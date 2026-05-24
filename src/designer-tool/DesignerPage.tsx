import { Show, createEffect, createSignal, onCleanup, onMount, type Component } from "solid-js";
import { FieldKind, type FieldSpec, type FormSpec } from "../engine/types";
import {
  defaultPropsByTarget,
  editorPropsByTarget,
  type EditorTarget,
} from "../designer/editorRegistry";
import { parseRowSelectionId } from "../designer/rowUtils";
import { demoFormSpec } from "../form-demo/DemoFormSpec";
import type { DesignerSelection } from "../designer/types";
import { darkModeStore } from "../darkModeStore";
import Select from "../primitives/Select";
import FormDesignerLayout from "./FormDesignerLayout";
import FormPreview from "./FormPreview";
import FormPropsForm from "./FormPropsForm";
import TreeCodeViewer from "./TreeCodeViewer";

type FieldEditorTarget = Exclude<EditorTarget, "row">;

const isFieldEditorTarget = (target: EditorTarget): target is FieldEditorTarget =>
  target !== "row";

const toFieldKind = (target: FieldEditorTarget): FieldKind =>
  target.replace("field:", "") as FieldKind;

const toFieldEditorTarget = (kind: FieldKind): FieldEditorTarget =>
  `field:${kind}` as FieldEditorTarget;

const formatFieldKindLabel = (kind: FieldKind) =>
  kind
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (char) => char.toUpperCase());

const FIELD_TYPE_OPTIONS = (Object.keys(editorPropsByTarget) as EditorTarget[])
  .filter(isFieldEditorTarget)
  .map((target) => {
    const kind = toFieldKind(target);
    return {
      kind,
      label: formatFieldKindLabel(kind),
    };
  });

const DESIGNER_DESKTOP_QUERY = "(min-width: 768px)";

const MobileDesignerBlocker: Component = () => (
  <main class="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-slate-100">
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="designer-mobile-block-title"
      class="w-full max-w-sm rounded-lg border border-slate-700 bg-slate-900 p-5 text-center shadow-2xl shadow-slate-950/60"
    >
      <h1 id="designer-mobile-block-title" class="text-lg font-semibold">
        Not intended for mobile (use desktop)
      </h1>
      <p class="mt-3 text-sm leading-6 text-slate-300">
        The form designer requires a desktop viewport for the resizable panels,
        tree editor, property editor, and live preview.
      </p>
    </div>
  </main>
);

const cloneFormSpec = (spec: FormSpec): FormSpec => ({
  ...spec,
  fields: spec.fields.map((field) => ({
    ...field,
    options: field.options ? field.options.map((option) => ({ ...option })) : undefined,
  })),
});

const getNextRowNumber = (spec: FormSpec) =>
  spec.fields.reduce(
    (maxRow, field) =>
      typeof field.row === "number" ? Math.max(maxRow, field.row) : maxRow,
    0,
  ) + 1;

const getNextFieldId = (spec: FormSpec) => {
  const ids = new Set(spec.fields.map((field) => field.id));
  let index = 1;
  while (ids.has(`field-${index}`)) {
    index += 1;
  }
  return `field-${index}`;
};

type AddFieldIntent =
  | { mode: "new-row" }
  | { mode: "row-end"; rowId: string }
  | { mode: "after-field"; fieldId: string }
  | { mode: "replace-field-kind"; fieldId: string };

const createFieldForKind = (
  spec: FormSpec,
  kind: FieldKind,
  row: number | undefined,
): FieldSpec => {
  const target = toFieldEditorTarget(kind);
  const defaults = defaultPropsByTarget[target] as Partial<FieldSpec>;
  const { row: _defaultRow, ...fieldDefaults } = defaults;
  const defaultLabel = fieldDefaults.label;

  return {
    ...fieldDefaults,
    id: getNextFieldId(spec),
    kind,
    label:
      typeof defaultLabel === "string" && defaultLabel.trim().length > 0
        ? defaultLabel
        : `New ${formatFieldKindLabel(kind)} Field`,
    row,
  };
};

const appendToRow = (fields: FieldSpec[], rowId: string, nextField: FieldSpec): FieldSpec[] => {
  const parsed = parseRowSelectionId(rowId);
  if (!parsed) return fields;

  const matchesRow =
    parsed.kind === "number"
      ? (field: FieldSpec) => field.row === parsed.rowNumber
      : (field: FieldSpec) => typeof field.row !== "number";

  let insertAfterIndex = -1;
  for (let index = 0; index < fields.length; index += 1) {
    if (matchesRow(fields[index])) {
      insertAfterIndex = index;
    }
  }

  if (insertAfterIndex < 0) {
    return [...fields, nextField];
  }

  return [
    ...fields.slice(0, insertAfterIndex + 1),
    nextField,
    ...fields.slice(insertAfterIndex + 1),
  ];
};

const getConvertiblePropKeys = (kind: FieldKind): Set<string> => {
  const target = toFieldEditorTarget(kind);
  return new Set(editorPropsByTarget[target].map((descriptor) => descriptor.key));
};

const convertFieldToKind = (field: FieldSpec, kind: FieldKind): FieldSpec => {
  const defaultLabel = `New ${formatFieldKindLabel(kind)} Field`;
  const next: Partial<FieldSpec> = {
    id: field.id,
    kind,
    row: field.row,
    label:
      typeof field.label === "string" && field.label.trim().length > 0
        ? field.label
        : defaultLabel,
  };

  const keysToPreserve = getConvertiblePropKeys(kind);
  for (const key of keysToPreserve) {
    if (key === "row" || key === "label") continue;
    const value = (field as Record<string, unknown>)[key];
    if (value !== undefined) {
      (next as Record<string, unknown>)[key] = value;
    }
  }

  return next as FieldSpec;
};

const DesignerPage: Component = () => {
  const [formSpec, setFormSpec] = createSignal<FormSpec>(cloneFormSpec(demoFormSpec));
  const [selected, setSelected] = createSignal<DesignerSelection>(null);
  const [showTriggers, setShowTriggers] = createSignal(false);
  const [isDesktopDesignerViewport, setIsDesktopDesignerViewport] = createSignal(true);
  const [isAddFieldModalOpen, setIsAddFieldModalOpen] = createSignal(false);
  const [pendingFieldKind, setPendingFieldKind] = createSignal<FieldKind>(
    FIELD_TYPE_OPTIONS[0]?.kind ?? FieldKind.text,
  );
  const [pendingAddFieldIntent, setPendingAddFieldIntent] = createSignal<AddFieldIntent>({
    mode: "new-row",
  });
  let addFieldConfirmButtonRef: HTMLButtonElement | undefined;

  onMount(() => {
    document.documentElement.classList.remove("dark");
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousHtmlOverscrollBehavior = document.documentElement.style.overscrollBehavior;
    const previousBodyOverflow = document.body.style.overflow;
    const previousBodyOverscrollBehavior = document.body.style.overscrollBehavior;

    document.documentElement.style.overflow = "hidden";
    document.documentElement.style.overscrollBehavior = "none";
    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";

    const mediaQuery = window.matchMedia(DESIGNER_DESKTOP_QUERY);
    const syncDesignerViewport = () => setIsDesktopDesignerViewport(mediaQuery.matches);
    syncDesignerViewport();

    mediaQuery.addEventListener("change", syncDesignerViewport);

    onCleanup(() => {
      mediaQuery.removeEventListener("change", syncDesignerViewport);
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.documentElement.style.overscrollBehavior = previousHtmlOverscrollBehavior;
      document.body.style.overflow = previousBodyOverflow;
      document.body.style.overscrollBehavior = previousBodyOverscrollBehavior;
    });
  });

  onCleanup(() => {
    if (darkModeStore.isDarkMode()) {
      document.documentElement.classList.add("dark");
    }
  });

  const openAddFieldModal = (
    intent: AddFieldIntent = { mode: "new-row" },
    initialKind?: FieldKind,
  ) => {
    setPendingAddFieldIntent(intent);
    setPendingFieldKind(initialKind ?? FIELD_TYPE_OPTIONS[0]?.kind ?? FieldKind.text);
    setIsAddFieldModalOpen(true);
  };

  const closeAddFieldModal = () => {
    setIsAddFieldModalOpen(false);
  };

  const confirmAddField = () => {
    const pendingKind = pendingFieldKind();
    const pendingIntent = pendingAddFieldIntent();
    let nextSelection: DesignerSelection = null;

    setFormSpec((previous) => {
      if (pendingIntent.mode === "new-row") {
        const nextRow = getNextRowNumber(previous);
        const nextField = createFieldForKind(previous, pendingKind, nextRow);
        nextSelection = { kind: "field", id: nextField.id };
        return {
          ...previous,
          fields: [...previous.fields, nextField],
        };
      }

      if (pendingIntent.mode === "row-end") {
        const parsed = parseRowSelectionId(pendingIntent.rowId);
        if (!parsed) return previous;

        const rowNumber = parsed.kind === "number" ? parsed.rowNumber : undefined;
        const nextField = createFieldForKind(previous, pendingKind, rowNumber);
        nextSelection = { kind: "field", id: nextField.id };
        return {
          ...previous,
          fields: appendToRow(previous.fields, pendingIntent.rowId, nextField),
        };
      }

      if (pendingIntent.mode === "replace-field-kind") {
        const fields = previous.fields.map((field) =>
          field.id === pendingIntent.fieldId ? convertFieldToKind(field, pendingKind) : field,
        );
        nextSelection = { kind: "field", id: pendingIntent.fieldId };
        return { ...previous, fields };
      }

      const anchorIndex = previous.fields.findIndex(
        (field) => field.id === pendingIntent.fieldId,
      );
      if (anchorIndex < 0) return previous;

      const anchorField = previous.fields[anchorIndex];
      const nextField = createFieldForKind(previous, pendingKind, anchorField.row);
      nextSelection = { kind: "field", id: nextField.id };
      return {
        ...previous,
        fields: [
          ...previous.fields.slice(0, anchorIndex + 1),
          nextField,
          ...previous.fields.slice(anchorIndex + 1),
        ],
      };
    });

    if (nextSelection) {
      setSelected(nextSelection);
    }

    closeAddFieldModal();
  };

  const handleAddFieldModalKeyDown = (
    event: KeyboardEvent & { currentTarget: HTMLDivElement; target: Element },
  ) => {
    if (
      event.key !== "Enter" ||
      event.defaultPrevented ||
      event.isComposing ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey
    ) {
      return;
    }

    const hasOpenSelect = Boolean(
      event.currentTarget.querySelector('[role="combobox"][aria-expanded="true"]'),
    );
    if (hasOpenSelect) return;

    const target = event.target as HTMLElement | null;
    const targetButton = target?.closest("button");
    const targetCombobox = target?.closest('[role="combobox"]');
    if (targetButton && !targetCombobox) return;

    event.preventDefault();
    event.stopPropagation();
    confirmAddField();
  };

  const convertFieldKind = (fieldId: string) => {
    const field = formSpec().fields.find((candidate) => candidate.id === fieldId);
    const initialKind = field?.kind ?? FieldKind.text;
    openAddFieldModal({ mode: "replace-field-kind", fieldId }, initialKind);
  };

  const removeField = (fieldId: string) => {
    setFormSpec((previous) => ({
      ...previous,
      fields: previous.fields.filter((field) => field.id !== fieldId),
    }));
  };

  const removeRow = (rowId: string) => {
    const parsed = parseRowSelectionId(rowId);
    if (!parsed) return;

    setFormSpec((previous) => ({
      ...previous,
      fields: previous.fields.filter((field) => {
        if (parsed.kind === "number") {
          return field.row !== parsed.rowNumber;
        }

        return typeof field.row === "number";
      }),
    }));
  };

  createEffect(() => {
    const currentSelection = selected();
    if (!currentSelection) return;

    const currentSpec = formSpec();

    if (currentSelection.kind === "field") {
      const exists = currentSpec.fields.some((field) => field.id === currentSelection.id);
      if (!exists) setSelected(null);
      return;
    }

    const parsed = parseRowSelectionId(currentSelection.id);
    if (!parsed) {
      setSelected(null);
      return;
    }

    const exists =
      parsed.kind === "number"
        ? currentSpec.fields.some((field) => field.row === parsed.rowNumber)
        : currentSpec.fields.some((field) => typeof field.row !== "number");

    if (!exists) setSelected(null);
  });

  createEffect(() => {
    if (!isDesktopDesignerViewport() || !isAddFieldModalOpen()) return;

    queueMicrotask(() => addFieldConfirmButtonRef?.focus());
  });

  const TreePanel: Component = () => (
    <TreeCodeViewer
      formSpec={formSpec()}
      selected={selected()}
      onSelect={setSelected}
      onAddRow={() => openAddFieldModal({ mode: "new-row" })}
      onConvertFieldKind={convertFieldKind}
      onAddToRow={(rowId) => openAddFieldModal({ mode: "row-end", rowId })}
      onAddAfterField={(fieldId) => openAddFieldModal({ mode: "after-field", fieldId })}
      onRemoveRow={removeRow}
      onRemoveField={removeField}
      onThemeChange={() => {}}
      showTriggers={showTriggers()}
      onPasteFormSpec={(next) => {
        setFormSpec(next);
        setSelected(null);
      }}
    />
  );

  const PropsPanel: Component = () => (
    <FormPropsForm
      formSpec={formSpec()}
      selected={selected()}
      setSelected={setSelected}
      setFormSpec={setFormSpec}
    />
  );

  const PreviewPanel: Component = () => (
    <FormPreview
      formSpec={formSpec()}
      showTriggers={showTriggers()}
      onShowTriggersChange={setShowTriggers}
    />
  );

  return (
    <>
      <Show
        when={isDesktopDesignerViewport()}
        fallback={<MobileDesignerBlocker />}
      >
        <FormDesignerLayout leftTop={TreePanel} leftBottom={PropsPanel} right={PreviewPanel} />
      </Show>

      <Show when={isDesktopDesignerViewport() && isAddFieldModalOpen()}>
        <div
          class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 p-4"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closeAddFieldModal();
            }
          }}
        >
          <div
            class="w-full max-w-sm rounded-lg border border-slate-300 bg-white p-4 shadow-xl"
            onKeyDownCapture={handleAddFieldModalKeyDown}
          >
            <h2 class="text-base font-semibold text-slate-900">Which field type?</h2>

            <div class="mt-3">
              <Select
                label="Field type"
                value={pendingFieldKind()}
                fullWidth
                options={FIELD_TYPE_OPTIONS.map((option) => ({
                  value: option.kind,
                  label: option.label,
                }))}
                onValue={(next) => setPendingFieldKind(next as FieldKind)}
              />
            </div>

            <div class="mt-4 flex flex-row-reverse items-center gap-2">
              <button
                ref={addFieldConfirmButtonRef}
                type="button"
                class="rounded-md bg-sky-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-sky-700"
                onClick={confirmAddField}
              >
                Okay
              </button>
              <button
                type="button"
                class="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                onClick={closeAddFieldModal}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </Show>
    </>
  );
};

export default DesignerPage;
