import {
  Show,
  createEffect,
  createSignal,
  onCleanup,
  untrack,
  type Component,
  type Setter,
} from "solid-js";
import { Subscription } from "rxjs";
import {
  FormRenderer,
  buildGraphFromFormSpec,
  type FieldHandle,
  type FormSpec,
} from "../engine/generators";
import {
  defaultPropsByTarget,
  editorPropsByTarget,
  type EditorTarget,
  type PropDescriptor,
} from "../designer/editorRegistry";
import { makeEditorSpec } from "../designer/makeEditorSpec";
import { patchSelectedNode } from "../designer/patchSelectedNode";
import { parseRowSelectionId } from "../designer/rowUtils";
import type { DesignerSelection } from "../designer/types";

type FormPropsFormProps = {
  formSpec: FormSpec;
  selected: DesignerSelection;
  setSelected: Setter<DesignerSelection>;
  setFormSpec: Setter<FormSpec>;
};

const resolveEditorTarget = (
  formSpec: FormSpec,
  selected: DesignerSelection,
): EditorTarget | null => {
  if (!selected) return null;

  if (selected.kind === "row") {
    return "row";
  }

  const field = formSpec.fields.find((candidate) => candidate.id === selected.id);
  if (!field) return null;

  const candidateTarget = `field:${field.kind}` as EditorTarget;
  if (candidateTarget in editorPropsByTarget) return candidateTarget;

  return "field:text";
};

const getCurrentProps = (
  formSpec: FormSpec,
  selected: DesignerSelection,
): Record<string, unknown> => {
  if (!selected) return {};

  if (selected.kind === "field") {
    const field = formSpec.fields.find((candidate) => candidate.id === selected.id);
    return field ? { ...field } : {};
  }

  const parsed = parseRowSelectionId(selected.id);
  if (!parsed) return {};

  const fields = formSpec.fields.filter((field) =>
    parsed.kind === "number"
      ? field.row === parsed.rowNumber
      : typeof field.row !== "number",
  );

  const firstField = fields[0];

  return {
    row: parsed.kind === "number" ? parsed.rowNumber : undefined,
    size: firstField?.size,
    variant: firstField?.variant,
    ringEnabled: firstField?.ringEnabled,
    animateRingOnFocus: firstField?.animateRingOnFocus,
    ringVariant: firstField?.ringVariant,
  };
};

const buildSensibleRowValues = (formSpec: FormSpec): string[] => {
  const numberedRows = formSpec.fields
    .map((field) => field.row)
    .filter((row): row is number => typeof row === "number" && Number.isFinite(row) && row > 0);

  const maxRow = numberedRows.reduce((max, row) => Math.max(max, row), 0);
  const upperBound = Math.max(1, maxRow + 1);

  return Array.from({ length: upperBound }, (_, index) => String(index + 1));
};

const withSensibleRowDescriptor = (
  descriptors: PropDescriptor[],
  formSpec: FormSpec,
): PropDescriptor[] => {
  const rowValues = buildSensibleRowValues(formSpec);

  return descriptors.map((descriptor) => {
    if (descriptor.key !== "row") return descriptor;

    return {
      ...descriptor,
      kind: "enum",
      enumValues: rowValues,
      helper: "Move this to a specific row",
    };
  });
};

const descriptorValueToPatch = (
  descriptor: PropDescriptor,
  rawValue: string,
): unknown => {
  if (descriptor.key === "row") {
    const parsed = Number(rawValue);
    if (!Number.isFinite(parsed)) return undefined;
    return Math.max(1, Math.floor(parsed));
  }

  if (descriptor.key === "options") {
    return rawValue
      .split(",")
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0)
      .map((entry) => ({ label: entry, value: entry }));
  }

  if (descriptor.kind === "boolean") {
    return rawValue === "true";
  }

  if (descriptor.kind === "number") {
    if (rawValue.trim() === "") return undefined;

    const parsed = Number(rawValue);
    if (!Number.isFinite(parsed)) return undefined;

    if (descriptor.key === "row") {
      return Math.max(1, Math.floor(parsed));
    }

    return parsed;
  }

  if (descriptor.kind === "enum") {
    return rawValue.trim() === "" ? undefined : rawValue;
  }

  return rawValue;
};

const descriptorValueToEditorRaw = (
  descriptor: PropDescriptor,
  value: unknown,
): string => {
  if (descriptor.key === "options") {
    if (!Array.isArray(value)) return "";
    return value
      .map((entry) => {
        if (typeof entry === "string") return entry;
        if (typeof entry === "object" && entry !== null) {
          const asRecord = entry as Record<string, unknown>;
          if (typeof asRecord.label === "string") return asRecord.label;
          if (typeof asRecord.value === "string") return asRecord.value;
        }
        return "";
      })
      .filter((entry) => entry.length > 0)
      .join(", ");
  }

  if (descriptor.kind === "boolean") {
    return value === true ? "true" : "";
  }

  if (descriptor.kind === "number") {
    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }

    if (typeof value === "string") return value;
    return "";
  }

  if (value === undefined || value === null) return "";
  return String(value);
};

const PRUNE_EXEMPT_KEYS = new Set(["id", "kind", "label", "row"]);

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const deepEqual = (left: unknown, right: unknown): boolean => {
  if (left === right) return true;

  if (Array.isArray(left) && Array.isArray(right)) {
    if (left.length !== right.length) return false;
    for (let index = 0; index < left.length; index += 1) {
      if (!deepEqual(left[index], right[index])) return false;
    }
    return true;
  }

  if (isPlainObject(left) && isPlainObject(right)) {
    const leftKeys = Object.keys(left);
    const rightKeys = Object.keys(right);
    if (leftKeys.length !== rightKeys.length) return false;

    for (const key of leftKeys) {
      if (!Object.prototype.hasOwnProperty.call(right, key)) return false;
      if (!deepEqual(left[key], right[key])) return false;
    }
    return true;
  }

  return false;
};

const toCamelCaseFieldId = (value: string): string => {
  const tokens = value
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length > 0);

  if (tokens.length === 0) return "";

  const joined = tokens
    .map((token, index) => {
      const normalized = token.toLowerCase();
      if (index === 0) return normalized;
      return normalized.charAt(0).toUpperCase() + normalized.slice(1);
    })
    .join("");

  if (!joined) return "";
  if (/^[a-zA-Z_]/.test(joined)) return joined;
  return `field${joined.charAt(0).toUpperCase()}${joined.slice(1)}`;
};

const ensureUniqueFieldId = (
  base: string,
  currentId: string,
  formSpec: FormSpec,
): string => {
  const existing = new Set(
    formSpec.fields
      .map((field) => field.id)
      .filter((fieldId) => fieldId !== currentId),
  );

  if (!existing.has(base)) return base;

  let suffix = 2;
  let candidate = `${base}${suffix}`;
  while (existing.has(candidate)) {
    suffix += 1;
    candidate = `${base}${suffix}`;
  }
  return candidate;
};

const resolveLabelDrivenIdPatch = (
  formSpec: FormSpec,
  selected: DesignerSelection,
  patch: Record<string, unknown>,
): string | null => {
  if (!selected || selected.kind !== "field") return null;
  if (!Object.prototype.hasOwnProperty.call(patch, "label")) return null;

  const nextLabel = patch.label;
  if (typeof nextLabel !== "string" || nextLabel.trim().length === 0) return null;

  const currentField = formSpec.fields.find((field) => field.id === selected.id);
  if (!currentField) return null;

  const currentId = currentField.id;

  const nextBaseId = toCamelCaseFieldId(nextLabel);
  if (!nextBaseId) return null;

  const nextId = ensureUniqueFieldId(nextBaseId, currentId, formSpec);
  return nextId === currentId ? null : nextId;
};

const buildPatchFromHandles = (
  handlesById: Map<string, FieldHandle>,
  descriptors: PropDescriptor[],
): Record<string, unknown> => {
  const patch: Record<string, unknown> = {};

  for (const descriptor of descriptors) {
    const handle = handlesById.get(`prop:${descriptor.key}`);
    if (!handle) continue;

    const nextValue = descriptorValueToPatch(descriptor, handle.value$.getValue());
    patch[descriptor.key] = nextValue;
  }

  return patch;
};

const pruneDefaultsFromPatch = (
  patch: Record<string, unknown>,
  target: EditorTarget,
  descriptors: PropDescriptor[],
): Record<string, unknown> => {
  const defaults = defaultPropsByTarget[target];
  const nextPatch: Record<string, unknown> = {};

  for (const descriptor of descriptors) {
    const key = descriptor.key;
    if (!Object.prototype.hasOwnProperty.call(patch, key)) continue;

    const value = patch[key];
    if (PRUNE_EXEMPT_KEYS.has(key)) {
      nextPatch[key] = value;
      continue;
    }

    const hasDefault = Object.prototype.hasOwnProperty.call(defaults, key);
    if (!hasDefault) {
      nextPatch[key] = value;
      continue;
    }

    if (value === undefined) {
      nextPatch[key] = undefined;
      continue;
    }

    const defaultValue = defaults[key];
    nextPatch[key] = deepEqual(value, defaultValue) ? undefined : value;
  }

  return nextPatch;
};

const FormPropsForm: Component<FormPropsFormProps> = (props) => {
  const [editorTarget, setEditorTarget] = createSignal<EditorTarget | null>(null);
  const [editorSpec, setEditorSpec] = createSignal<FormSpec | null>(null);
  const [handlesById, setHandlesById] = createSignal<Map<string, FieldHandle> | null>(
    null,
  );

  createEffect(() => {
    const currentSelection = props.selected;

    if (!currentSelection) {
      setEditorTarget(null);
      setEditorSpec(null);
      setHandlesById(null);
      return;
    }

    const specSnapshot = untrack(() => props.formSpec);
    const target = resolveEditorTarget(specSnapshot, currentSelection);

    if (!target) {
      setEditorTarget(null);
      setEditorSpec(null);
      setHandlesById(null);
      return;
    }

    const descriptors = editorPropsByTarget[target];
    const editorDescriptors = withSensibleRowDescriptor(descriptors, specSnapshot);
    const nextEditorSpec = makeEditorSpec(
      target,
      getCurrentProps(specSnapshot, currentSelection),
      editorDescriptors,
    );

    const { graph, handlesById: nextHandlesById } = buildGraphFromFormSpec(nextEditorSpec);

    setEditorTarget(target);
    setEditorSpec(nextEditorSpec);
    setHandlesById(nextHandlesById);

    const subscription = new Subscription();

    const applyPatchFromEditorStream = (allowIdSync: boolean) => {
      const rawPatch = buildPatchFromHandles(nextHandlesById, editorDescriptors);
      const patch = pruneDefaultsFromPatch(rawPatch, target, editorDescriptors);
      let nextSelection: DesignerSelection = null;

      props.setFormSpec((previous) => {
        const nextId = allowIdSync
          ? resolveLabelDrivenIdPatch(previous, currentSelection, patch)
          : null;
        const nextPatch = nextId ? { ...patch, id: nextId } : patch;

        if (nextId && currentSelection?.kind === "field") {
          nextSelection = { kind: "field", id: nextId };
        }

        return patchSelectedNode(previous, currentSelection, nextPatch);
      });

      if (nextSelection) {
        props.setSelected(nextSelection);
      }
    };
    const labelHandle = nextHandlesById.get("prop:label");
    if (labelHandle) {
      let labelValueAtFocus = labelHandle.value$.getValue();
      subscription.add(
        labelHandle.focused$.subscribe((focused) => {
          if (focused) {
            labelValueAtFocus = labelHandle.value$.getValue();
            return;
          }

          const labelChanged = labelHandle.value$.getValue() !== labelValueAtFocus;
          applyPatchFromEditorStream(labelChanged);
        }),
      );
    }

    for (const descriptor of editorDescriptors) {
      if (!descriptor.isRegex) continue;
      const handle = nextHandlesById.get(`prop:${descriptor.key}`);
      if (!handle) continue;
      handle.markTouched();
    }

    for (const descriptor of editorDescriptors) {
      const handle = nextHandlesById.get(`prop:${descriptor.key}`);
      if (!handle) continue;

      subscription.add(handle.value$.subscribe(() => applyPatchFromEditorStream(false)));
    }

    onCleanup(() => {
      subscription.unsubscribe();
      graph.destroy();
    });
  });

  const resetToDefaults = () => {
    const target = editorTarget();
    const currentSelection = props.selected;
    const activeHandlesById = handlesById();

    if (!target || !currentSelection || !activeHandlesById) return;

    const defaults = defaultPropsByTarget[target];
    const descriptors = withSensibleRowDescriptor(
      editorPropsByTarget[target],
      props.formSpec,
    );
    const resetPatch = pruneDefaultsFromPatch(
      descriptors.reduce<Record<string, unknown>>((acc, descriptor) => {
        acc[descriptor.key] = defaults[descriptor.key];
        return acc;
      }, {}),
      target,
      descriptors,
    );

    props.setFormSpec((previous) =>
      patchSelectedNode(previous, currentSelection, resetPatch),
    );

    for (const descriptor of descriptors) {
      const handle = activeHandlesById.get(`prop:${descriptor.key}`);
      if (!handle) continue;

      const nextEditorValue = descriptorValueToEditorRaw(
        descriptor,
        defaults[descriptor.key],
      );
      handle.setValue(nextEditorValue);
    }
  };

  return (
    <div class="flex h-full min-h-0 flex-col rounded-lg border border-slate-300 bg-white p-3">
      <div class="mb-3 flex items-center justify-between gap-2">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-600">
          Properties
        </h2>
        <button
          type="button"
          class="rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={resetToDefaults}
          disabled={!props.selected || !editorTarget()}
        >
          Reset
        </button>
      </div>

      <Show
        when={props.selected && editorSpec() && handlesById()}
        fallback={
          <div class="flex min-h-0 flex-1 items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
            Select a row or field in the tree to edit its properties.
          </div>
        }
      >
        <div class="min-h-0 flex-1 overflow-auto rounded-md border border-slate-200 bg-slate-50 p-4">
          <FormRenderer form={editorSpec()!} handlesById={handlesById()!} />
        </div>
      </Show>
    </div>
  );
};

export default FormPropsForm;
