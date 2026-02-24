import type { FieldSpec, FormSpec } from "../engine/types";
import { parseRowSelectionId } from "./rowUtils";
import type { DesignerSelection } from "./types";

const applyFieldPatch = (
  field: FieldSpec,
  patch: Record<string, unknown>,
): FieldSpec => {
  let changed = false;
  const nextField: Record<string, unknown> = { ...field };

  for (const [key, nextValue] of Object.entries(patch)) {
    if (nextValue === undefined) {
      if (Object.prototype.hasOwnProperty.call(nextField, key)) {
        delete nextField[key];
        changed = true;
      }
      continue;
    }

    const previousValue = (field as Record<string, unknown>)[key];
    if (previousValue !== nextValue) {
      nextField[key] = nextValue;
      changed = true;
    }
  }

  return changed ? (nextField as FieldSpec) : field;
};

export const patchSelectedNode = (
  formSpec: FormSpec,
  selected: DesignerSelection,
  patch: Record<string, unknown>,
): FormSpec => {
  if (!selected) return formSpec;

  if (selected.kind === "field") {
    let changed = false;
    const fields = formSpec.fields.map((field) => {
      if (field.id !== selected.id) return field;
      const patched = applyFieldPatch(field, patch);
      if (patched !== field) changed = true;
      return patched;
    });

    return changed ? { ...formSpec, fields } : formSpec;
  }

  const parsed = parseRowSelectionId(selected.id);
  if (!parsed) return formSpec;

  const shouldPatchField = (field: FieldSpec) => {
    if (parsed.kind === "number") {
      return field.row === parsed.rowNumber;
    }

    return typeof field.row !== "number";
  };

  let changed = false;
  const fields = formSpec.fields.map((field) => {
    if (!shouldPatchField(field)) return field;
    const patched = applyFieldPatch(field, patch);
    if (patched !== field) changed = true;
    return patched;
  });

  return changed ? { ...formSpec, fields } : formSpec;
};
