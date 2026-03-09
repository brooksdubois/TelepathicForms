import { Codeblock, CodeblockProvider, useCodeblockContext } from "solid-codeblock";
import {
  For,
  Show,
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  type Component,
} from "solid-js";
import { Portal } from "solid-js/web";
import { fromObservable } from "../utils/fromObservable";
import { groupFormSpecRows } from "../designer/rowUtils";
import { serializeFormSpecToTS } from "../designer/serializeFormSpec";
import type { DesignerSelection, FormSpec } from "../designer/types";
import Select from "../primitives/Select";
import { setTheme, theme, themeOptions, type AccentTheme } from "../theme/theme";
import { TextAreaWrapper } from "../wrappers";
import { FieldKind, TriggerOperators, type TriggerSpec } from "../engine/types";
import { FieldRuntimeNode, type FieldHandle, type FieldSpec } from "../engine/generators";

enum ViewerTab {
  Tree = "tree",
  Code = "code",
}

type TreeCodeViewerProps = {
  formSpec: FormSpec;
  selected: DesignerSelection;
  onSelect: (next: DesignerSelection) => void;
  onAddRow: () => void;
  onConvertFieldKind: (fieldId: string) => void;
  onAddToRow: (rowId: string) => void;
  onAddAfterField: (fieldId: string) => void;
  onRemoveRow: (rowId: string) => void;
  onRemoveField: (fieldId: string) => void;
  onThemeChange: (next: AccentTheme) => void;
  showTriggers: boolean;
  onPasteFormSpec?: (next: FormSpec) => void;
};

type CodeTabContentProps = {
  code: string;
};

const CodeTabContent: Component<CodeTabContentProps> = (props) => {
  const codeblock = useCodeblockContext();
  const lineCount = createMemo(() => props.code.split("\n").length);

  return (
    <Show
      when={!codeblock.loading}
      fallback={
        <div class="flex min-h-[180px] items-center justify-center rounded-md border border-slate-700 bg-slate-950/80 px-4 py-6 text-xs text-slate-400">
          Highlighting...
        </div>
      }
    >
      <div
        class="relative z-10 min-h-0 w-full max-w-full flex-1 overflow-x-auto overflow-y-scroll rounded-md border border-slate-700 bg-slate-950"
        style={{ "scrollbar-gutter": "stable both-edges" }}
      >
        <div class="flex w-max min-w-full items-start">
          <div class="sticky left-0 self-stretch border-r border-slate-800 bg-slate-900/95 px-3 py-3 text-right text-xs leading-6 text-slate-500">
            <For each={Array.from({ length: lineCount() }, (_, index) => index + 1)}>
              {(lineNumber) => <div class="select-none">{lineNumber}</div>}
            </For>
          </div>
          <div class="min-w-0 flex-1 p-3 text-[13px] leading-6 [&_.cb-container]:!inline-block [&_.cb-container]:!min-w-full [&_.cb-container]:!w-max [&_.cb-container]:!max-w-none [&_.cb-container]:!bg-transparent [&_.cb-container_pre]:!m-0 [&_.cb-container_pre]:!inline-block [&_.cb-container_pre]:!min-w-full [&_.cb-container_pre]:!w-max [&_.cb-container_pre]:!max-w-none [&_.cb-container_pre]:!bg-transparent [&_.cb-container_pre]:!p-0 [&_.cb-container_pre]:!font-mono [&_.cb-container_pre]:!whitespace-pre">
            <Codeblock lang="ts" textContent={props.code} />
          </div>
        </div>
      </div>
    </Show>
  );
};

const VALID_FIELD_KIND_VALUES = new Set(Object.values(FieldKind));
const PASTE_SPEC_FIELD_ID = "designerPasteSpecText";

type ParsedPasteSpec = {
  fields: FieldSpec[] | null;
  errors: string[];
};

type TriggerTreeEntry = {
  kind: TriggerOperators;
  targetFieldIds: string[];
};

type TriggerBadgeStyle = {
  icon: string;
  bgColor: string;
  label: string;
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const normalizeEnumReferences = (text: string) =>
  text
    .replace(/\bFieldKind\.([A-Za-z_][A-Za-z0-9_]*)\b/g, (_, enumKey) => `"${enumKey}"`)
    .replace(/\bWhenOperators\.([A-Za-z_][A-Za-z0-9_]*)\b/g, (_, enumKey) => `"${enumKey}"`)
    .replace(/\bTriggerOperators\.([A-Za-z_][A-Za-z0-9_]*)\b/g, (_, enumKey) => `"${enumKey}"`)
    .replace(/\bOperatorMaths\.([A-Za-z_][A-Za-z0-9_]*)\b/g, (_, enumKey) => `"${enumKey}"`);

const parseObjectLikeSpec = (text: string): unknown => {
  const normalizedText = normalizeEnumReferences(text.trim());

  try {
    return JSON.parse(normalizedText);
  } catch {
    // eslint-disable-next-line no-new-func
    return new Function(`"use strict"; return (${normalizedText});`)();
  }
};

const parseAndValidateFormSpec = (text: string): ParsedPasteSpec => {
  const trimmed = text.trim();

  if (!trimmed) {
    return {
      fields: null,
      errors: ["Paste a valid fields array to replace the current form."],
    };
  }

  if (trimmed[0] !== "[" || trimmed[trimmed.length - 1] !== "]") {
    return {
      fields: null,
      errors: ["Form fields must be an array wrapped in [ ]."],
    };
  }

  let parsed: unknown;
  try {
    parsed = parseObjectLikeSpec(trimmed);
  } catch (error) {
    return {
      fields: null,
      errors: [
        `Invalid form spec syntax: ${(error as Error).message ?? "Unable to parse form spec object."}`,
      ],
    };
  }

  if (!Array.isArray(parsed)) {
    return {fields: null, errors: ["Form fields must be an array." ]};
  }

  const errors: string[] = [];
  parsed.forEach((candidateField, index) => {
    if (!isPlainObject(candidateField)) {
      errors.push(`Field at index ${index + 1} must be an object.`);
      return;
    }

    const fieldId = typeof candidateField.id === "string" && candidateField.id.trim().length > 0
      ? candidateField.id
      : `#${index + 1}`;
    const kindValue = candidateField.kind;

    if (typeof kindValue !== "string") {
      errors.push(`Field "${fieldId}" is missing a valid "kind".`);
      return;
    }

    if (!VALID_FIELD_KIND_VALUES.has(kindValue)) {
      errors.push(`Field "${fieldId}" has unsupported kind "${kindValue}".`);
    }
  });

  return {fields: errors.length > 0 ? null : (parsed as FieldSpec[]), errors};
};

const PASTE_SPEC_FIELD: FieldSpec = {
  id: PASTE_SPEC_FIELD_ID,
  kind: FieldKind.textArea,
  label: "Form Fields",
  placeholder: '[\n  {\n    id: "firstName",\n    kind: FieldKind.text,\n  },\n]',
  helperText:
    "Paste a fields array. FieldKind enum values are supported during paste.",
  rows: 14,
  autosize: false,
  size: "md",
  variant: "outlined",
  ringEnabled: true,
  animateRingOnFocus: true,
};

const TRIGGER_BADGE_STYLE_BY_KIND: Record<TriggerOperators, TriggerBadgeStyle> = {
  [TriggerOperators.setHidden]: {
    icon: "H",
    bgColor: "bg-blue-100 text-blue-700 border-blue-300",
    label: "setHidden",
  },
  [TriggerOperators.setDisabled]: {
    icon: "D",
    bgColor: "bg-orange-100 text-orange-700 border-orange-300",
    label: "setDisabled",
  },
  [TriggerOperators.setValue]: {
    icon: "V",
    bgColor: "bg-emerald-100 text-emerald-700 border-emerald-300",
    label: "setValue",
  },
};

const TRIGGER_OP_ORDER: TriggerOperators[] = [
  TriggerOperators.setHidden,
  TriggerOperators.setDisabled,
  TriggerOperators.setValue,
];

const TRIGGER_OP_LABEL_BY_KIND: Record<TriggerOperators, string> = {
  [TriggerOperators.setHidden]: "Set Hidden",
  [TriggerOperators.setDisabled]: "Set Disabled",
  [TriggerOperators.setValue]: "Set Value",
};

const normalizeTriggerSpec = (value: unknown): TriggerSpec[] => {
  if (!Array.isArray(value)) return [];

  return value
    .map((trigger) => {
      if (!trigger || typeof trigger !== "object") return null;
      const maybeTrigger = trigger as Partial<TriggerSpec>;
      const directOperation = maybeTrigger.operation ?? null;
      const operationsArray = maybeTrigger.operations ?? null;
      const operations =
        directOperation != null
          ? [directOperation]
          : Array.isArray(operationsArray)
            ? operationsArray
            : [];

      if (!operations.length) return null;

      return {
        ...maybeTrigger,
        operations,
      } as TriggerSpec;
    })
    .filter((item): item is TriggerSpec => item !== null);
};

const collectTriggerTreeEntries = (field: FieldSpec): TriggerTreeEntry[] => {
  const triggerEntries = new Map<TriggerOperators, Set<string>>();
  const triggers = normalizeTriggerSpec(field.triggers);

  for (const trigger of triggers) {
    for (const operation of trigger.operations) {
      const operator = operation.operator;
      if (!Object.values(TriggerOperators).includes(operator)) continue;
      const targetSet = triggerEntries.get(operator) ?? new Set<string>();

      for (const fieldId of operation.fieldIds ?? []) {
        targetSet.add(fieldId);
      }

      triggerEntries.set(operator, targetSet);
    }
  }

  return TRIGGER_OP_ORDER.filter((op) => triggerEntries.has(op)).map((op) => ({
    kind: op,
    targetFieldIds: Array.from(triggerEntries.get(op) ?? []),
  }));
};

const pasteSpecRuntime = new FieldRuntimeNode<string>({
  id: PASTE_SPEC_FIELD_ID,
  initialValue: "",
  validate: (value) => parseAndValidateFormSpec(value).errors,
});

const pasteSpecHandle: FieldHandle = {
  value$: pasteSpecRuntime.value$,
  disabled$: pasteSpecRuntime.disabled$,
  hidden$: pasteSpecRuntime.hidden$,
  errors$: pasteSpecRuntime.errors$,
  touched$: pasteSpecRuntime.touched$,
  focused$: pasteSpecRuntime.focused$,
  valid$: pasteSpecRuntime.valid$,
  setValue: (next) => pasteSpecRuntime.setValue(next),
  markTouched: () => pasteSpecRuntime.markTouched(),
  setFocused: (next) => pasteSpecRuntime.setFocused(next),
};

const TreeCodeViewer: Component<TreeCodeViewerProps> = (props) => {
  const [activeTab, setActiveTab] = createSignal<ViewerTab>(ViewerTab.Tree);
  const [expandedRows, setExpandedRows] = createSignal<Record<string, boolean>>({});
  const [expandedTriggerEntries, setExpandedTriggerEntries] = createSignal<
    Record<string, boolean>
  >({});
  const [copied, setCopied] = createSignal(false);
  const [isPasteModalOpen, setIsPasteModalOpen] = createSignal(false);
  const serializedCode = createMemo(() => serializeFormSpecToTS(props.formSpec));
  const pasteValue = fromObservable(pasteSpecHandle.value$, "");
  const pasteErrors = fromObservable(pasteSpecHandle.errors$, []);
  const activeTheme = createMemo(() => props.formSpec.theme ?? theme());
  const fieldsById = createMemo(() => {
    const next = new Map<string, string>();
    props.formSpec.fields.forEach((field) =>
      next.set(field.id, field.label ?? field.id),
    );
    return next;
  });

  const getFieldLabel = (fieldId: string) => fieldsById().get(fieldId) ?? fieldId;

  const openPasteModal = () => {
    pasteSpecHandle.setValue("");
    setIsPasteModalOpen(true);
  };

  const applyPastedSpec = () => {
    pasteSpecHandle.markTouched();
    const parsed = parseAndValidateFormSpec(pasteValue());
    if (parsed.errors.length > 0) return;
    if (!props.onPasteFormSpec || !parsed.fields) return;
    props.onPasteFormSpec({
      ...props.formSpec,
      fields: parsed.fields,
    });
    setIsPasteModalOpen(false);
  };

  let copiedTimer: number | undefined;
  onCleanup(() => {
    if (copiedTimer !== undefined) {
      window.clearTimeout(copiedTimer);
    }
  });

  const rows = createMemo(() => groupFormSpecRows(props.formSpec));

  createEffect(() => {
    const rowIds = rows().map((row) => row.id);
    setExpandedRows((previous) => {
      const next: Record<string, boolean> = {};
      for (const rowId of rowIds) {
        next[rowId] = previous[rowId] ?? true;
      }
      return next;
    });
  });

  const toggleRow = (rowId: string) => {
    setExpandedRows((prev) => ({ ...prev, [rowId]: !prev[rowId] }));
  };

  const isRowSelected = (rowId: string) =>
    props.selected?.kind === "row" && props.selected.id === rowId;

  const isFieldSelected = (fieldId: string) =>
    props.selected?.kind === "field" && props.selected.id === fieldId;

  const isTriggerExpanded = (fieldId: string, triggerKind: TriggerOperators) =>
    expandedTriggerEntries()[`${fieldId}:${triggerKind}`] ?? false;

  const toggleTriggerEntry = (fieldId: string, triggerKind: TriggerOperators) => {
    const key = `${fieldId}:${triggerKind}`;
    setExpandedTriggerEntries((previous) => ({
      ...previous,
      [key]: !(previous[key] ?? false),
    }));
  };

  const copyCode = async () => {
    const textToCopy = serializedCode();

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = textToCopy;
        textArea.setAttribute("readonly", "");
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        document.body.append(textArea);
        textArea.select();
        document.execCommand("copy");
        textArea.remove();
      }

      setCopied(true);
      if (copiedTimer !== undefined) {
        window.clearTimeout(copiedTimer);
      }
      copiedTimer = window.setTimeout(() => setCopied(false), 1000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div class="relative z-10 isolate flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border border-slate-300 bg-white p-3">
      <div class="mb-3 flex items-center justify-between gap-2">
        <div class="inline-flex w-fit rounded-lg border border-slate-300 bg-slate-100 p-1">
          <button
            type="button"
            class="rounded-md px-3 py-1.5 text-sm font-medium capitalize text-slate-600"
            classList={{
              "bg-white text-slate-900 shadow-sm": activeTab() === ViewerTab.Tree,
            }}
            onClick={() => setActiveTab(ViewerTab.Tree)}
          >
            tree
          </button>
          <button
            type="button"
            class="rounded-md px-3 py-1.5 text-sm font-medium capitalize text-slate-600"
            classList={{
              "bg-white text-slate-900 shadow-sm": activeTab() === ViewerTab.Code,
            }}
            onClick={() => setActiveTab(ViewerTab.Code)}
          >
            code
          </button>
        </div>

        <div class="flex items-center gap-2">
          <div class="w-36">
            <Select
              value={activeTheme()}
              options={themeOptions}
              size="sm"
              fullWidth
              onValue={(next) => {
                const nextTheme = next as AccentTheme;
                setTheme(nextTheme);
                props.onThemeChange(nextTheme);
              }}
            />
          </div>
          <button
            type="button"
            class="inline-flex h-8 w-8 items-center justify-center rounded-md bg-sky-600 text-lg font-semibold leading-none text-white transition hover:bg-sky-700"
            aria-label="Add row"
            onClick={props.onAddRow}
          >
            +
          </button>
        </div>
      </div>

      <Show
        when={activeTab() === ViewerTab.Tree}
        fallback={
          <div class="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
          <div class="flex items-center justify-end gap-2">
              <Show when={copied()}>
                <span class="text-xs font-medium text-emerald-600">Copied</span>
              </Show>
              <button
                type="button"
                class="inline-flex h-8 items-center justify-center rounded-md border border-slate-300 bg-white px-2.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                onClick={openPasteModal}
              >
                Paste form spec
              </button>
              <button
                type="button"
                class="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 bg-white text-sm text-slate-700 transition hover:bg-slate-100"
                aria-label="Copy code"
                onClick={copyCode}
              >
                📋
              </button>
            </div>

            <CodeblockProvider opts={{ theme: "github-dark", langs: ["ts"] }}>
              <CodeTabContent code={serializedCode()} />
            </CodeblockProvider>
          </div>
        }
      >
        <div class="min-h-0 flex-1 overflow-auto rounded-md border border-slate-200 bg-slate-50 p-2">
          <ul class="space-y-1">
            <For each={rows()}>
              {(row, rowIndex) => {
                const rowLabel = row.label ?? `Row ${rowIndex() + 1}`;
                const rowExpanded = () => expandedRows()[row.id] ?? true;

                return (
                  <li class="rounded-md">
                    <div
                      class="flex items-center gap-1 rounded-md px-2 py-1.5 text-sm font-semibold text-slate-800"
                      classList={{
                        "bg-sky-100 ring-1 ring-sky-300": isRowSelected(row.id),
                        "hover:bg-slate-100": !isRowSelected(row.id),
                      }}
                    >
                      <button
                        type="button"
                        class="inline-flex h-6 w-6 items-center justify-center rounded text-xs text-slate-600 hover:bg-slate-200"
                        onClick={() => toggleRow(row.id)}
                        aria-label={rowExpanded() ? "Collapse row" : "Expand row"}
                      >
                        {rowExpanded() ? "▼" : "▶"}
                      </button>

                      <button
                        type="button"
                        class="min-w-0 flex-1 truncate text-left"
                        onClick={() => props.onSelect({ kind: "row", id: row.id })}
                        on:dblclick={() => toggleRow(row.id)}
                      >
                        {rowLabel}
                      </button>

                      <div class="ml-2 flex items-center gap-1">
                        <button
                          type="button"
                          class="inline-flex h-6 w-6 items-center justify-center rounded text-base text-sky-600 transition hover:bg-sky-100"
                          onClick={() => props.onAddToRow(row.id)}
                          aria-label="Add row item"
                        >
                          ⊕
                        </button>
                        <button
                          type="button"
                          class="inline-flex h-6 w-6 items-center justify-center rounded text-base text-rose-600 transition hover:bg-rose-100"
                          onClick={() => props.onRemoveRow(row.id)}
                          aria-label="Remove row item"
                        >
                          ⊖
                        </button>
                      </div>
                    </div>

                    <Show when={rowExpanded()}>
                      <ul class="mt-1 space-y-1 pl-8">
                        <For each={row.fields}>
                          {(field, fieldIndex) => {
                            const fieldLabel = field.label ?? `field ${fieldIndex() + 1}`;
                            const triggerEntries = () => collectTriggerTreeEntries(field);

                            return (
                              <li>
                                <div
                                  class="flex items-center rounded-md px-2 py-1.5 text-sm text-slate-700"
                                  classList={{
                                    "bg-sky-100 ring-1 ring-sky-300": isFieldSelected(field.id),
                                    "hover:bg-slate-100": !isFieldSelected(field.id),
                                  }}
                                  on:dblclick={(event) => {
                                    const target = event.target as HTMLElement;
                                    if (target.closest("[data-tree-action='add']")) return;
                                    if (target.closest("[data-tree-action='remove']")) return;
                                    if (target.closest("[data-tree-trigger]")) return;
                                    props.onConvertFieldKind(field.id);
                                  }}
                                >
                                  <button
                                    type="button"
                                    class="min-w-0 flex-1 truncate text-left"
                                    onClick={() =>
                                      props.onSelect({
                                        kind: "field",
                                        id: field.id,
                                      })
                                    }
                                  >
                                    {fieldLabel} ({field.kind})
                                  </button>

                                  <div class="ml-2 flex items-center gap-1">
                                    <button
                                      type="button"
                                      class="inline-flex h-6 w-6 items-center justify-center rounded text-base text-sky-600 transition hover:bg-sky-100"
                                      data-tree-action="add"
                                      onClick={() => props.onAddAfterField(field.id)}
                                      aria-label="Add field item"
                                    >
                                      ⊕
                                    </button>
                                    <button
                                      type="button"
                                      class="inline-flex h-6 w-6 items-center justify-center rounded text-base text-rose-600 transition hover:bg-rose-100"
                                      data-tree-action="remove"
                                      onClick={() => props.onRemoveField(field.id)}
                                      aria-label="Remove field item"
                                    >
                                      ⊖
                                    </button>
                                  </div>
                                </div>

                                <Show when={props.showTriggers && triggerEntries().length > 0}>
                                  <ul class="mt-1 space-y-1 pl-6">
                                    <For each={triggerEntries()}>
                                      {(entry) => {
                                        const style = TRIGGER_BADGE_STYLE_BY_KIND[entry.kind];
                                        const isExpanded = () =>
                                          isTriggerExpanded(field.id, entry.kind);

                                        return (
                                          <li>
                                            <div
                                              data-tree-trigger
                                              class="flex items-center rounded-md px-2 py-1.5 text-xs text-slate-700"
                                            >
                                              <button
                                                type="button"
                                                data-tree-trigger
                                                class="inline-flex min-w-0 flex-1 items-center gap-2 text-left font-medium"
                                                onClick={() =>
                                                  toggleTriggerEntry(field.id, entry.kind)
                                                }
                                                aria-label={isExpanded() ? "Collapse trigger" : "Expand trigger"}
                                              >
                                                <span class="inline-flex h-6 w-6 items-center justify-center rounded text-[11px] text-slate-700">
                                                  {isExpanded() ? "▼" : "▶"}
                                                </span>
                                                <span
                                                  class={`inline-flex h-5 min-w-5 items-center justify-center rounded border px-1.5 text-[11px] font-semibold ${style.bgColor}`}
                                                >
                                                  {style.icon}
                                                </span>
                                                      <span>{TRIGGER_OP_LABEL_BY_KIND[entry.kind]}</span>
                                              </button>
                                            </div>

                                            <Show when={isExpanded() && entry.targetFieldIds.length > 0}>
                                              <ul class="mt-1 space-y-1 pl-6">
                                                <For each={entry.targetFieldIds}>
                                                  {(targetFieldId) => (
                                                    <li>
                                                      <button
                                                        type="button"
                                                        class="inline-flex w-full items-center gap-2 rounded-md px-2 py-1 text-xs text-slate-600 transition hover:bg-slate-200"
                                                        onClick={() =>
                                                          props.onSelect({
                                                            kind: "field",
                                                            id: targetFieldId,
                                                          })
                                                        }
                                                      >
                                                        <span>{getFieldLabel(targetFieldId)}</span>
                                                      </button>
                                                    </li>
                                                  )}
                                                </For>
                                              </ul>
                                            </Show>
                                          </li>
                                        );
                                      }}
                                    </For>
                                  </ul>
                                </Show>
                              </li>
                            );
                          }}
                        </For>
                      </ul>
                    </Show>
                  </li>
                );
              }}
            </For>
          </ul>
        </div>
      </Show>
      <Show when={isPasteModalOpen()}>
        <Portal>
          <div
            class="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/35 p-4"
            onClick={(event) => {
              if (event.target === event.currentTarget) {
                setIsPasteModalOpen(false);
              }
            }}
          >
            <div class="w-full max-w-3xl rounded-lg border border-slate-300 bg-white p-4 shadow-xl">
              <h2 class="text-base font-semibold text-slate-900">Paste form spec</h2>
              <p class="mt-1 text-xs text-slate-600">
                Paste a fields array to replace the current designer form immediately.
              </p>

              <div class="mt-3">
                <TextAreaWrapper spec={PASTE_SPEC_FIELD} field={pasteSpecHandle} fullWidth={true} />
              </div>

              <div class="mt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  class="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                  onClick={() => setIsPasteModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  class="rounded-md bg-sky-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={applyPastedSpec}
                  disabled={pasteErrors().length > 0}
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </Portal>
      </Show>
    </div>
  );
};

export default TreeCodeViewer;
