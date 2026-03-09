import {
  FieldKind,
  TriggerOperators,
  type FieldSpec,
  type FormSpec,
  WhenOperators,
} from "../engine/types";
import {
  defaultPropsByTarget,
  editorPropsByTarget,
  type EditorTarget,
  type PropDescriptor,
} from "./editorRegistry";

const toBooleanInitialValue = (value: unknown) => (value === true ? "true" : "");

const toStringInitialValue = (value: unknown) => {
  if (value === undefined || value === null) return "";
  return String(value);
};

const toNumberInitialValue = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  if (typeof value === "string" && value.trim() !== "") {
    return value;
  }

  return "";
};

const toOptionsCsvInitialValue = (value: unknown) => {
  if (Array.isArray(value)) {
    return value
      .map((option) => {
        if (typeof option === "string") return option;
        if (typeof option === "object" && option !== null) {
          const asRecord = option as Record<string, unknown>;
          if (typeof asRecord.label === "string") return asRecord.label;
          if (typeof asRecord.value === "string") return asRecord.value;
        }
        return "";
      })
      .filter((entry) => entry.length > 0)
      .join(", ");
  }

  return toStringInitialValue(value);
};

const resolveInitialValue = (
  descriptor: PropDescriptor,
  currentProps: Record<string, unknown>,
  target: EditorTarget,
) => {
  const currentValue = currentProps[descriptor.key];
  const defaultValue = defaultPropsByTarget[target][descriptor.key];
  const resolved = currentValue ?? defaultValue;

  if (descriptor.key === "options") {
    return toOptionsCsvInitialValue(resolved);
  }

  switch (descriptor.kind) {
    case "boolean":
      return toBooleanInitialValue(resolved);
    case "number":
      return toNumberInitialValue(resolved);
    case "enum": {
      const enumValues = descriptor.enumValues ?? [];
      const nextValue = toStringInitialValue(resolved);
      if (enumValues.length === 0) return nextValue;
      return enumValues.includes(nextValue) ? nextValue : enumValues[0];
    }
    case "string":
    default:
      return toStringInitialValue(resolved);
  }
};

const magneticPointsNotes = (base: string | undefined) =>
  base
    ? `${base} (requires step = 0 or null for magnetic behavior)`
    : "Comma-separated values, e.g. 25, 50, 75 (requires step = 0 or null)";

const magneticPointsTriggers = () => [
  {
    when: {
      any: [
        { fieldIds: ["prop:step"], operator: WhenOperators.equals, value: "0" },
        { fieldIds: ["prop:step"], operator: WhenOperators.equals, value: "" },
      ],
    },
    operation: {
      fieldIds: ["prop:magneticPoints"],
      operator: TriggerOperators.setDisabled,
      value: false,
    },
  },
  {
    when: {
      all: [
        { fieldIds: ["prop:step"], operator: WhenOperators.notEquals, value: "0" },
        { fieldIds: ["prop:step"], operator: WhenOperators.notEquals, value: "" },
      ],
    },
    operation: {
      fieldIds: ["prop:magneticPoints"],
      operator: TriggerOperators.setDisabled,
      value: true,
    },
  },
];

const descriptorToFieldSpec = (
  descriptor: PropDescriptor,
  target: EditorTarget,
  currentProps: Record<string, unknown>,
  rowNumber: number,
): FieldSpec => {
  const isMagneticPoints = target === "field:slider" && descriptor.key === "magneticPoints";

  const regexValidator = descriptor.isRegex
    ? (value: string) => {
        if (!value.trim()) return [];
        try {
          new RegExp(value);
          return [];
        } catch {
          return ["Invalid regular expression"];
        }
      }
    : undefined;

  const common: FieldSpec = {
    id: `prop:${descriptor.key}`,
    kind: FieldKind.text,
    label: descriptor.label,
    row: rowNumber,
    helperText: isMagneticPoints
      ? magneticPointsNotes(descriptor.helper)
      : descriptor.helper,
    initialValue: resolveInitialValue(descriptor, currentProps, target),
    ringEnabled: true,
    animateRingOnFocus: true,
    ringVariant: "laser",
    validate: regexValidator,
  };

  if (isMagneticPoints) {
    return {
      ...common,
      kind: FieldKind.text,
      triggers: magneticPointsTriggers(),
    };
  }

  if (descriptor.kind === "number") {
    return {
      ...common,
      kind: FieldKind.number,
      maxDigits: 6,
    };
  }

  if (descriptor.kind === "boolean") {
    return {
      ...common,
      kind: FieldKind.checkbox,
      inline: true,
    };
  }

  if (descriptor.kind === "enum") {
    return {
      ...common,
      kind: FieldKind.select,
      options: (descriptor.enumValues ?? []).map((value) => ({
        label: value,
        value,
      })),
    };
  }

  return common;
};

export const makeEditorSpec = (
  target: EditorTarget,
  currentProps: Record<string, unknown>,
  descriptorsOverride?: PropDescriptor[],
): FormSpec => {
  const descriptors = descriptorsOverride ?? editorPropsByTarget[target];

  return {
    id: `editor-${target}`,
    fields: descriptors.map((descriptor, index) =>
      descriptorToFieldSpec(descriptor, target, currentProps, index + 1),
    ),
  };
};
