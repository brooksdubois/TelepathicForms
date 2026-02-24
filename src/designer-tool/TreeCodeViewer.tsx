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
import { groupFormSpecRows } from "../designer/rowUtils";
import { serializeFormSpecToTS } from "../designer/serializeFormSpec";
import type { DesignerSelection, FormSpec } from "../designer/types";

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

const TreeCodeViewer: Component<TreeCodeViewerProps> = (props) => {
  const [activeTab, setActiveTab] = createSignal<ViewerTab>(ViewerTab.Tree);
  const [expandedRows, setExpandedRows] = createSignal<Record<string, boolean>>({});
  const [copied, setCopied] = createSignal(false);
  const serializedCode = createMemo(() => serializeFormSpecToTS(props.formSpec));

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

        <button
          type="button"
          class="inline-flex h-8 w-8 items-center justify-center rounded-md bg-sky-600 text-lg font-semibold leading-none text-white transition hover:bg-sky-700"
          aria-label="Add row"
          onClick={props.onAddRow}
        >
          +
        </button>
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
    </div>
  );
};

export default TreeCodeViewer;
