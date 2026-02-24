import type { FormSpec } from "./types";
import { defaultPropsByTarget, type EditorTarget } from "./editorRegistry";

type SerializationContext =
  | "root"
  | "field"
  | "option"
  | "trigger"
  | "operation"
  | "predicate"
  | "whenGroup"
  | "generic";

const INDENT = "  ";

const ROOT_KEY_ORDER = ["id", "fields"];

const FIELD_KEY_ORDER = [
  "id",
  "kind",
  "label",
  "row",
  "placeholder",
  "helperText",
  "options",
  "type",
  "autoComplete",
  "readOnly",
  "minLength",
  "maxLength",
  "size",
  "variant",
  "startAdornment",
  "endAdornment",
  "ringEnabled",
  "animateRingOnFocus",
  "ringVariant",
  "rows",
  "autosize",
  "minRows",
  "maxRows",
  "searchable",
  "clearable",
  "minDate",
  "maxDate",
  "disablePast",
  "disableFuture",
  "disableWeekends",
  "locale",
  "weekStartsOn",
  "openOnFocus",
  "closeOnSelect",
  "maxSelected",
  "indeterminate",
  "inline",
  "maxDigits",
  "required",
  "initialValue",
  "inputMask",
  "inputBlocker",
  "triggers",
];

const OPTION_KEY_ORDER = ["label", "value", "disabled", "group", "helperText"];
const TRIGGER_KEY_ORDER = ["when", "operation", "operations"];
const OPERATION_KEY_ORDER = ["fieldIds", "operator", "value"];
const PREDICATE_KEY_ORDER = ["fieldIds", "operator", "value"];
const WHEN_GROUP_KEY_ORDER = ["all", "any"];

const RUNTIME_ONLY_FIELD_KEYS = new Set(["validate", "shouldDisableDate"]);
const PRUNE_EXEMPT_FIELD_KEYS = new Set(["id", "kind", "label", "row", "triggers"]);

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isIdentifierKey = (key: string) => /^[$A-Z_][0-9A-Z_$]*$/i.test(key);

const formatKey = (key: string) => (isIdentifierKey(key) ? key : JSON.stringify(key));

const getKnownOrder = (context: SerializationContext): string[] => {
  switch (context) {
    case "root":
      return ROOT_KEY_ORDER;
    case "field":
      return FIELD_KEY_ORDER;
    case "option":
      return OPTION_KEY_ORDER;
    case "trigger":
      return TRIGGER_KEY_ORDER;
    case "operation":
      return OPERATION_KEY_ORDER;
    case "predicate":
      return PREDICATE_KEY_ORDER;
    case "whenGroup":
      return WHEN_GROUP_KEY_ORDER;
    case "generic":
    default:
      return [];
  }
};

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

const sortKeys = (keys: string[], context: SerializationContext): string[] => {
  const order = getKnownOrder(context);
  const orderMap = new Map(order.map((key, index) => [key, index]));

  return [...keys].sort((a, b) => {
    const aOrder = orderMap.get(a);
    const bOrder = orderMap.get(b);

    if (aOrder !== undefined && bOrder !== undefined) {
      return aOrder - bOrder;
    }

    if (aOrder !== undefined) return -1;
    if (bOrder !== undefined) return 1;

    return a.localeCompare(b);
  });
};

const nextContext = (
  parentContext: SerializationContext,
  parentKey: string | null,
  value: unknown,
): SerializationContext => {
  if (!isPlainObject(value)) return "generic";

  if (parentContext === "root" && parentKey === "fields") return "field";
  if (parentContext === "field" && parentKey === "options") return "option";
  if (parentContext === "field" && parentKey === "triggers") return "trigger";
  if (parentContext === "trigger" && (parentKey === "operation" || parentKey === "operations")) {
    return "operation";
  }

  if (parentContext === "trigger" && parentKey === "when") {
    if ("all" in value || "any" in value) return "whenGroup";
    return "predicate";
  }

  if (parentContext === "whenGroup") return "predicate";

  if ("id" in value && "kind" in value) return "field";
  if ("label" in value && "value" in value) return "option";
  if ("when" in value && ("operation" in value || "operations" in value)) return "trigger";
  if ("operator" in value && "fieldIds" in value) return "predicate";

  return "generic";
};

const shouldOmitKey = (
  context: SerializationContext,
  key: string,
  value: unknown,
  scope: Record<string, unknown>,
): boolean => {
  if (value === undefined) return true;
  if (typeof value === "function") return true;

  if (context === "field" && RUNTIME_ONLY_FIELD_KEYS.has(key)) {
    return true;
  }

  if (context === "field" && !PRUNE_EXEMPT_FIELD_KEYS.has(key)) {
    const kind = scope.kind;
    if (typeof kind === "string") {
      const target = `field:${kind}` as EditorTarget;
      const defaults = defaultPropsByTarget[target];
      if (defaults && Object.prototype.hasOwnProperty.call(defaults, key)) {
        return deepEqual(value, defaults[key]);
      }
    }
  }

  return false;
};

const toIndent = (level: number) => INDENT.repeat(level);

const serializePrimitive = (value: string | number | boolean | null): string => {
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  return "null";
};

const serializeValue = (
  value: unknown,
  level: number,
  context: SerializationContext,
  parentKey: string | null = null,
): string | undefined => {
  if (value === undefined || typeof value === "function") return undefined;

  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return serializePrimitive(value);
  }

  if (Array.isArray(value)) {
    const serializedItems = value
      .map((item) => serializeValue(item, level + 1, nextContext(context, parentKey, item), parentKey))
      .filter((item): item is string => item !== undefined);

    if (serializedItems.length === 0) return "[]";

    return `[\n${serializedItems
      .map((item) => `${toIndent(level + 1)}${item},`)
      .join("\n")}\n${toIndent(level)}]`;
  }

  if (!isPlainObject(value)) return undefined;

  const entries = Object.entries(value).filter(
    ([key, entryValue]) => !shouldOmitKey(context, key, entryValue, value),
  );

  if (entries.length === 0) return "{}";

  const sortedKeys = sortKeys(
    entries.map(([key]) => key),
    context,
  );

  const lines: string[] = [];
  for (const key of sortedKeys) {
    const entryValue = value[key];
    if (shouldOmitKey(context, key, entryValue, value)) continue;

    const serialized = serializeValue(
      entryValue,
      level + 1,
      nextContext(context, key, entryValue),
      key,
    );

    if (serialized === undefined) continue;

    lines.push(`${toIndent(level + 1)}${formatKey(key)}: ${serialized},`);
  }

  if (lines.length === 0) return "{}";

  return `{\n${lines.join("\n")}\n${toIndent(level)}}`;
};

export const serializeFormSpecToTS = (spec: FormSpec): string => {
  const serialized = serializeValue(spec, 0, "root");
  const objectLiteral = serialized ?? "{}";
  return `const formSpec: FormSpec = ${objectLiteral} as const;`;
};
