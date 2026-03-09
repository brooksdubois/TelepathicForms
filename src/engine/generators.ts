import {combineLatest, distinctUntilChanged, map, of, type Observable} from "rxjs";
import {GraphRuntime} from "./GraphRuntime";
import {FieldRuntimeNode} from "./FieldRuntimeNode";
import {
  FieldKind,
  OperatorMaths,
  TriggerOperators,
  type ValidationContext,
  WhenOperators,
  type FieldHandle,
  type FieldSpec,
  type FormSpec,
  type TriggerOperation,
  type WhenClause,
  type WhenPredicate,
} from "./types";
import {
  makeSsnValidator,
  makeZipValidator,
  normalizeDecimalInput,
  normalizePhone,
  validatePhone,
} from "../utils/fieldHelpers";

const toFiniteNumber = (value: unknown, fallback: number) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return fallback;
};

const normalizeSliderMode = (mode: FieldSpec["mode"]) =>
  mode === "range" || mode === "stepper" ? mode : "single";

const normalizeSliderValueForMode = (
  spec: FieldSpec,
  mode: NonNullable<FieldSpec["mode"]>,
  initial: string,
) => {
  const configuredMin = toFiniteNumber(spec.min, 0);
  const configuredMax = toFiniteNumber(spec.max, 100);
  const min = Math.min(configuredMin, configuredMax);
  const max = Math.max(configuredMin, configuredMax);

  if (mode === "range") {
    if (typeof initial === "string" && initial.length > 0) return initial;
    return `[${min}, ${max}]`;
  }

  if (typeof initial === "string" && initial.length > 0) return initial;
  return String(min);
};

function createNodeFromSpec(
  spec: FieldSpec,
  validationContext: ValidationContext,
  validateDeps?: Array<Observable<string>>,
): FieldRuntimeNode<string> {
  const initial = spec.initialValue ?? "";
  const extras = {
    validationContext,
    validateDeps$:
      validateDeps && validateDeps.length > 0 ? validateDeps : undefined,
  };

  switch (spec.kind) {
    case FieldKind.dateRange: {
  const validate =
    spec.validate ??
    (spec.required
      ? (v: string) => {
          // Validate that a proper date range object is provided
          try {
            const parsed = JSON.parse(v);
            if (!parsed.start || !parsed.end) {
              return ["Date range is required."];
            }
            // Optional: Add more specific date validation
            const startDate = new Date(parsed.start);
            const endDate = new Date(parsed.end);
            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
              return ["Invalid date format."];
            }
            if (startDate > endDate) {
              return ["Start date must be before end date."];
            }
            return [];
          } catch {
            return ["Invalid date range format."];
          }
        }
      : () => []);

  return new FieldRuntimeNode<string>({
    id: spec.id,
    initialValue: initial || JSON.stringify({ start: '', end: '' }),
    validate,
    ...extras,
  });
}
    case FieldKind.date: {
      const validate =
        spec.validate ??
        (spec.required
          ? (v) => (v ? [] : ["Date is required."])
          : () => []);

      return new FieldRuntimeNode<string>({
        id: spec.id,
        initialValue: initial,
        validate,
        ...extras,
      });
    }

    case FieldKind.phone:
      return new FieldRuntimeNode<string>({
        id: spec.id,
        initialValue: normalizePhone(initial),
        validate: spec.validate ?? validatePhone,
        ...extras,
      });

    case FieldKind.number: {
      const maxDigits = spec.maxDigits ?? 6;
      const digits = initial.replace(/\D/g, "").slice(0, maxDigits);
      return new FieldRuntimeNode<string>({
        id: spec.id,
        initialValue: digits,
        validate: spec.validate ?? (() => []),
        ...extras,
      });
    }

    case FieldKind.currency: {
      const maxIntDigits = spec.maxDigits ?? 9;
      const normalized = normalizeDecimalInput(initial, maxIntDigits, 2);
      const validate =
        spec.validate ?? (spec.required ? (v) => (v ? [] : ["Required."]) : () => []);
      return new FieldRuntimeNode<string>({
        id: spec.id,
        initialValue: normalized,
        validate,
        ...extras,
      });
    }

    case FieldKind.percent: {
      const maxIntDigits = spec.maxDigits ?? 1000;
      const normalized = normalizeDecimalInput(initial, maxIntDigits, null);
      const validate =
        spec.validate ?? (spec.required ? (v) => (v ? [] : ["Required."]) : () => []);
      return new FieldRuntimeNode<string>({
        id: spec.id,
        initialValue: normalized,
        validate,
        ...extras,
      });
    }

    case FieldKind.ssn: {
      const maxDigits = spec.maxDigits ?? 9;
      const digits = initial.replace(/\D/g, "").slice(0, maxDigits);
      return new FieldRuntimeNode<string>({
        id: spec.id,
        initialValue: digits,
        validate: spec.validate ?? makeSsnValidator(!!spec.required),
        ...extras,
      });
    }

    case FieldKind.zip: {
      const maxDigits = spec.maxDigits ?? 9;
      const digits = initial.replace(/\D/g, "").slice(0, maxDigits);
      return new FieldRuntimeNode<string>({
        id: spec.id,
        initialValue: digits,
        validate: spec.validate ?? makeZipValidator(!!spec.required),
        ...extras,
      });
    }

    case FieldKind.slider: {
      const sliderMode = normalizeSliderMode(spec.mode);
      return new FieldRuntimeNode<string>({
        id: spec.id,
        initialValue: normalizeSliderValueForMode(spec, sliderMode, initial),
        validate: spec.validate ?? (() => []),
        ...extras,
      });
    }

    case FieldKind.time:
      return new FieldRuntimeNode<string>({
        id: spec.id,
        initialValue: initial || "",
        validate: spec.validate ?? (() => []),
        ...extras,
      });

    case FieldKind.select:
    case FieldKind.multiSelect:
    case FieldKind.radio:
    case FieldKind.inlineRadio: {
      const validate =
        spec.validate ??
        (spec.required
          ? (v) => (v ? [] : ["Selection is required."])
          : () => []);
      return new FieldRuntimeNode<string>({
        id: spec.id,
        initialValue: initial,
        validate,
        ...extras,
      });
    }

    case FieldKind.checkbox:
    case FieldKind.inlineCheckbox: {
      const next = initial === "true" ? "true" : "";
      return new FieldRuntimeNode<string>({
        id: spec.id,
        initialValue: next,
        validate: spec.validate ?? (() => []),
        ...extras,
      });
    }

    case FieldKind.switch: {
      const next = initial === "true" ? "true" : "";
      return new FieldRuntimeNode<string>({
        id: spec.id,
        initialValue: next,
        validate: spec.validate ?? (() => []),
        ...extras,
      });
    }

    case FieldKind.textArea:
    case FieldKind.password:
    case FieldKind.text:
    default:
      return new FieldRuntimeNode<string>({
        id: spec.id,
        initialValue: initial,
        validate: spec.validate ?? (() => []),
        ...extras,
      });
  }
}

function applyTriggersFromSpec(graph: GraphRuntime, field: FieldSpec) {
  const sourceId = field.id;
  const triggers = field.triggers ?? [];

  const predStreamFor = (id: string, op: WhenOperators, value?: string) => {
    if (!graph.hasNode(id)) {
      return of(false);
    }

    const n = graph.get<any>(id);

    if (op === WhenOperators.isEmpty) {
      return n.value$.pipe(
        map((v) => {
          if (v == null) return true;
          if (typeof v !== "string") return false;
          return v.length === 0;
        }),
        distinctUntilChanged()
      );
    }

    if (op === WhenOperators.equals || op === WhenOperators.notEquals) {
      return n.value$.pipe(
        map((v) => {
          const curr = v == null ? "" : String(v);
          const target = value ?? "";
          return op === WhenOperators.equals ? curr === target : curr !== target;
        }),
        distinctUntilChanged()
      );
    }

    return op === WhenOperators.isValid ? n.valid$ : n.valid$.pipe(map((v) => !v));
  };

  const predicateFor = (when: WhenClause): Observable<boolean> => {
    if (typeof when === "string") return predStreamFor(sourceId, when);

    if ("operator" in when) {
      const pred = when as WhenPredicate;
      const sourceIds = pred.fieldIds && pred.fieldIds.length > 0 ? pred.fieldIds : [sourceId];
      if (sourceIds.some((id) => !graph.hasNode(id))) {
        return of(false);
      }

      const ids = pred.fieldIds && pred.fieldIds.length > 0 ? pred.fieldIds : [sourceId];
      const streams = ids.map((id) =>
        predStreamFor(id, pred.operator, "value" in pred ? pred.value : undefined)
      );
      return combineLatest(streams).pipe(
        map((vals) => vals.every(Boolean)),
        distinctUntilChanged()
      );
    }

    const allPred = when[OperatorMaths.all];
    const anyPred = when[OperatorMaths.any];

    const clause = allPred ?? anyPred;
    const mode: OperatorMaths = allPred ? OperatorMaths.all : OperatorMaths.any;

    if (!clause) return predStreamFor(sourceId, WhenOperators.isValid);

    const predicates = Array.isArray(clause) ? clause : [clause];
    const hasMissingNode = predicates.some((pred) => {
      const ids = pred.fieldIds && pred.fieldIds.length > 0 ? pred.fieldIds : [sourceId];
      return ids.some((id) => !graph.hasNode(id));
    });
    if (hasMissingNode) return of(false);

    const streams = predicates.flatMap((pred) => {
      const ids = pred.fieldIds && pred.fieldIds.length > 0 ? pred.fieldIds : [sourceId];
      return ids.map((id) =>
        predStreamFor(id, pred.operator, "value" in pred ? pred.value : undefined)
      );
    });

    if (streams.length === 0) return predStreamFor(sourceId, WhenOperators.isValid);

    return combineLatest(streams).pipe(
      map((vals) => (mode === OperatorMaths.all ? vals.every(Boolean) : vals.some(Boolean))),
      distinctUntilChanged()
    );
  };

  triggers.forEach((t) => {
    const pred$ = predicateFor(t.when);

    const ops: TriggerOperation[] = "operations" in t ? t.operations : [t.operation];

    ops.forEach((op) => {
      switch (op.operator) {
        case TriggerOperators.setDisabled:
          op.fieldIds.forEach((targetId) => {
            if (!graph.hasNode(targetId)) return;
            graph.wireDisabledWhen(targetId, pred$, op.value);
          });
          break;

        case TriggerOperators.setValue:
          op.fieldIds.forEach((targetId) => {
            if (!graph.hasNode(targetId)) return;
            graph.wireValueWhen(targetId, pred$, op.value);
          });
          break;

        case TriggerOperators.setHidden:
          op.fieldIds.forEach((targetId) => {
            if (!graph.hasNode(targetId)) return;
            graph.wireHiddenWhen(targetId, pred$, op.value);
          });
          break;
      }
    });
  });
}

export function buildGraphFromFormSpec(form: FormSpec) {
  const graph = new GraphRuntime();
  const nodesById = new Map<string, FieldRuntimeNode<string>>();
  const getValue = (fieldId: string) => (nodesById.get(fieldId)?.value$?.value as string) ?? "";

  form.fields.forEach((f) => {
    const deps = (f.validationDependencies ?? []).map((fieldId) => nodesById.get(fieldId)?.value$);

    const node = graph.register(
      createNodeFromSpec(
        f,
        {getValue},
        deps.filter(Boolean) as Array<Observable<string>>,
      ),
    );
    nodesById.set(f.id, node);
  });

  form.fields.forEach((f) => applyTriggersFromSpec(graph, f));

  const handlesById = new Map<string, FieldHandle>();
  nodesById.forEach((node, id) => {
    handlesById.set(id, {
      value$: node.value$,
      disabled$: node.disabled$,
      hidden$: node.hidden$,
      errors$: node.errors$,
      touched$: node.touched$,
      focused$: node.focused$,
      valid$: node.valid$,
      setValue: (v) => node.setValue(v),
      markTouched: () => node.markTouched(),
      setFocused: (f) => node.setFocused(f),
    });
  });

  return {graph, nodesById, handlesById};
}

export {FieldRuntimeNode} from "./FieldRuntimeNode";
export {GraphRuntime} from "./GraphRuntime";
export {FieldSlot, groupFieldsByRow} from "./fieldRendering";
export type {FieldSlotProps, RowGroup} from "./fieldRendering";
export {FormRenderer} from "./FormRenderer";
export type {FormRendererProps} from "./FormRenderer";
export * from "./types";
