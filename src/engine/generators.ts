import {combineLatest, distinctUntilChanged, map, type Observable} from "rxjs";
import {GraphRuntime} from "./GraphRuntime";
import {FieldRuntimeNode} from "./FieldRuntimeNode";
import {
  FieldKind,
  OperatorMaths,
  TriggerOperators,
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

function createNodeFromSpec(spec: FieldSpec): FieldRuntimeNode<string> {
  const initial = spec.initialValue ?? "";

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
      });
    }

    case FieldKind.phone:
      return new FieldRuntimeNode<string>({
        id: spec.id,
        initialValue: normalizePhone(initial),
        validate: spec.validate ?? validatePhone,
      });

    case FieldKind.number: {
      const maxDigits = spec.maxDigits ?? 6;
      const digits = initial.replace(/\D/g, "").slice(0, maxDigits);
      return new FieldRuntimeNode<string>({
        id: spec.id,
        initialValue: digits,
        validate: spec.validate ?? (() => []),
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
      });
    }

    case FieldKind.ssn: {
      const maxDigits = spec.maxDigits ?? 9;
      const digits = initial.replace(/\D/g, "").slice(0, maxDigits);
      return new FieldRuntimeNode<string>({
        id: spec.id,
        initialValue: digits,
        validate: spec.validate ?? makeSsnValidator(!!spec.required),
      });
    }

    case FieldKind.zip: {
      const maxDigits = spec.maxDigits ?? 9;
      const digits = initial.replace(/\D/g, "").slice(0, maxDigits);
      return new FieldRuntimeNode<string>({
        id: spec.id,
        initialValue: digits,
        validate: spec.validate ?? makeZipValidator(!!spec.required),
      });
    }

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
      });
    }

    case FieldKind.checkbox:
    case FieldKind.inlineCheckbox: {
      const next = initial === "true" ? "true" : "";
      return new FieldRuntimeNode<string>({
        id: spec.id,
        initialValue: next,
        validate: spec.validate ?? (() => []),
      });
    }

    case FieldKind.switch: {
      const next = initial === "true" ? "true" : "";
      return new FieldRuntimeNode<string>({
        id: spec.id,
        initialValue: next,
        validate: spec.validate ?? (() => []),
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
      });
  }
}

function applyTriggersFromSpec(graph: GraphRuntime, field: FieldSpec) {
  const sourceId = field.id;
  const triggers = field.triggers ?? [];

  const predStreamFor = (id: string, op: WhenOperators, value?: string) => {
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
          op.fieldIds.forEach((targetId) => graph.wireDisabledWhen(targetId, pred$, op.value));
          break;

        case TriggerOperators.setValue:
          op.fieldIds.forEach((targetId) => graph.wireValueWhen(targetId, pred$, op.value));
          break;

        case TriggerOperators.setHidden:
          op.fieldIds.forEach((targetId) => graph.wireHiddenWhen(targetId, pred$, op.value));
          break;
      }
    });
  });
}

export function buildGraphFromFormSpec(form: FormSpec) {
  const graph = new GraphRuntime();
  const nodesById = new Map<string, FieldRuntimeNode<string>>();

  form.fields.forEach((f) => {
    const node = graph.register(createNodeFromSpec(f));
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
