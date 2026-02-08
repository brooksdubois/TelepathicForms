import {BehaviorSubject, Observable, Subscription, combineLatest, distinctUntilChanged, map, startWith} from "rxjs";

export type Validator<T> = (value: T) => string[]; // return list of error messages
export type Formatter = (raw: string) => string;
export type Normalizer = (raw: string) => string;

type NodePatch<T> = {
  value?: T;
  disabledOverride?: boolean | null;
  hiddenOverride?: boolean | null;
};

export class FieldRuntimeNode<T> {
  readonly id: string;

  // mutable ports
  readonly value$: BehaviorSubject<T>;
  readonly touched$ = new BehaviorSubject<boolean>(false);
  readonly focused$ = new BehaviorSubject<boolean>(false);

  // derived ports
  readonly errors$: Observable<string[]>;
  readonly valid$: Observable<boolean>;

  // "computed but can be overridden by graph wiring"
  private readonly disabledOverride$ = new BehaviorSubject<boolean | null>(null);
  readonly disabled$: Observable<boolean>;
  // "computed but can be overridden by graph wiring"
  private readonly hiddenOverride$ = new BehaviorSubject<boolean | null>(null);
  readonly hidden$: Observable<boolean>;

  constructor(args: {
    id: string;
    initialValue: T;
    validate?: Validator<T>;
    disabled$?: Observable<boolean>; // external wiring optional
    hidden$?: Observable<boolean>; // external wiring optional
  }) {
    this.id = args.id;
    this.value$ = new BehaviorSubject<T>(args.initialValue);

    const validate = args.validate ?? (() => []);
    this.errors$ = this.value$.pipe(
      map((v) => validate(v)),
      startWith(validate(args.initialValue)),
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b))
    );

    this.valid$ = this.errors$.pipe(
      map((errs) => errs.length === 0),
      distinctUntilChanged()
    );

    // disabled = (override ?? wiredExternal ?? false)
    const base$ = args.disabled$ ?? new BehaviorSubject(false);
    this.disabled$ = combineLatest([base$, this.disabledOverride$]).pipe(
      map(([base, override]) => (override === null ? base : override)),
      distinctUntilChanged()
    );

    // hidden = (override ?? wiredExternal ?? false)
    const hiddenBase$ = args.hidden$ ?? new BehaviorSubject(false);
    this.hidden$ = combineLatest([hiddenBase$, this.hiddenOverride$]).pipe(
      map(([base, override]) => (override === null ? base : override)),
      distinctUntilChanged()
    );
  }

  setValue(next: T) {
    this.value$.next(next);
  }

  markTouched() {
    this.touched$.next(true);
  }

  setFocused(isFocused: boolean) {
    this.focused$.next(isFocused);
  }

  /** Rare escape hatch: imperative override. Use sparingly. */
  setDisabledOverride(next: boolean | null) {
    this.disabledOverride$.next(next);
  }

  /** Rare escape hatch: imperative override. Use sparingly. */
  setHiddenOverride(next: boolean | null) {
    this.hiddenOverride$.next(next);
  }

  /** Apply multiple writes in a deterministic order (used by GraphRuntime batching). */
  applyPatch(patch: NodePatch<T>) {
    if (Object.prototype.hasOwnProperty.call(patch, "value")) {
      this.setValue(patch.value as T);
    }
    if (Object.prototype.hasOwnProperty.call(patch, "disabledOverride")) {
      this.setDisabledOverride(patch.disabledOverride as boolean | null);
    }
    if (Object.prototype.hasOwnProperty.call(patch, "hiddenOverride")) {
      this.setHiddenOverride(patch.hiddenOverride as boolean | null);
    }
  }
}

/** ---------------------------------------------
 * 4) GraphRuntime: registry + wiring substrate
 * --------------------------------------------- */
type NodeId = string;

export class GraphRuntime {
  private nodes = new Map<NodeId, FieldRuntimeNode<any>>();
  private subs = new Subscription();
  private pendingPatches = new Map<NodeId, NodePatch<any>>();
  private flushScheduled = false;

  private enqueuePatch(targetId: NodeId, patch: NodePatch<any>) {
    const prev = this.pendingPatches.get(targetId) ?? {};
    this.pendingPatches.set(targetId, {...prev, ...patch});

    if (!this.flushScheduled) {
      this.flushScheduled = true;
      queueMicrotask(() => this.flushPatches());
    }
  }

  private flushPatches() {
    this.flushScheduled = false;

    if (this.pendingPatches.size === 0) return;

    const toApply = Array.from(this.pendingPatches.entries());
    this.pendingPatches.clear();

    toApply.forEach(([id, patch]) => {
      const node = this.get<any>(id);
      node.applyPatch(patch);
    });
  }

  register<T>(node: FieldRuntimeNode<T>) {
    if (this.nodes.has(node.id)) throw new Error(`Duplicate node id: ${node.id}`);
    this.nodes.set(node.id, node);
    return node;
  }

  get<T>(id: NodeId): FieldRuntimeNode<T> {
    const n = this.nodes.get(id);
    if (!n) throw new Error(`Missing node: ${id}`);
    return n as FieldRuntimeNode<T>;
  }

  /** conditional write: when pred is true -> set disabled override (batched) */
  wireDisabledWhen(targetId: NodeId, pred$: Observable<boolean>, disabled: boolean) {
    this.subs.add(
      pred$.pipe(distinctUntilChanged()).subscribe((pred) => {
        if (pred) this.enqueuePatch(targetId, {disabledOverride: disabled});
      })
    );
  }

  /** conditional write: when pred is true -> set hidden override (batched) */
  wireHiddenWhen(targetId: NodeId, pred$: Observable<boolean>, hidden: boolean) {
    this.subs.add(
      pred$.pipe(distinctUntilChanged()).subscribe((pred) => {
        if (pred) this.enqueuePatch(targetId, {hiddenOverride: hidden});
      })
    );
  }

  /** conditional write: when pred is true -> set value (batched) */
  wireValueWhen(targetId: NodeId, pred$: Observable<boolean>, value: any) {
    this.subs.add(
      pred$.pipe(distinctUntilChanged()).subscribe((pred) => {
        if (pred) this.enqueuePatch(targetId, {value});
      })
    );
  }

  /** Dispose all subscriptions */
  destroy() {
    this.flushPatches();
    this.subs.unsubscribe();
    // optional: complete subjects
    this.nodes.forEach((n) => {
      n.value$.complete();
      n.touched$.complete();
      n.focused$.complete();
    });
    this.nodes.clear();
  }
}

/** ---------------------------------------------
 * 5) Form Spec: the JS object that “draws” the form
 * --------------------------------------------- */

export enum FieldKind {
  textArea = "textArea",
  phone = "phone",
  text = "text",
  number = "number",
  currency = "currency",
  percent = "percent",
  select = "select",
  checkbox = "checkbox",
  inlineCheckbox = "inlineCheckbox",
  radio = "radio",
  inlineRadio = "inlineRadio",
  ssn = "ssn",
  zip = "zip",
  password = "password",
}

export type FieldSpec = {
  id: string;
  kind: FieldKind;
  label: string;
  placeholder?: string;
  helperText?: string;
  options?: {label: string; value: string}[];
  maxDigits?: number;
  required?: boolean;
  /** optional initial value (stored/raw) */
  initialValue?: string;
  /** optional validator override (receives stored/raw value) */
  validate?: Validator<string>;
  inputMask?: string;
  inputBlocker?: string; // regex string
  triggers?: TriggerSpec[];
};

export enum OperatorMaths {
  all = "all",
  any = "any",
}

export enum WhenOperators {
  isValid = "isValid",
  isInvalid = "isInvalid",
  isEmpty = "isEmpty",
  equals = "equals",
  notEquals = "notEquals",
}

export enum TriggerOperators {
  setDisabled = "setDisabled",
  setValue = "setValue",
  setHidden = "setHidden",
}

export type WhenPredicate =
  | {
      fieldIds?: string[];
      operator: WhenOperators.isValid | WhenOperators.isInvalid | WhenOperators.isEmpty;
    }
  | {
      fieldIds?: string[];
      operator: WhenOperators.equals | WhenOperators.notEquals;
      value: string;
    };

export type WhenClause =
  | WhenOperators
  | WhenPredicate
  | {
      [OperatorMaths.all]?: WhenPredicate | WhenPredicate[];
      [OperatorMaths.any]?: WhenPredicate | WhenPredicate[];
    };

export type TriggerOperation =
  | {
  fieldIds: string[];
  operator: TriggerOperators.setDisabled;
  value: boolean;
}
  | {
  fieldIds: string[];
  operator: TriggerOperators.setValue;
  value: string;
}
  | {
  fieldIds: string[];
  operator: TriggerOperators.setHidden;
  value: boolean;
};

export type TriggerSpec =
  | {
      when: WhenClause;
      operation: TriggerOperation;
    }
  | {
      when: WhenClause;
      operations: TriggerOperation[];
    };

export type FormSpec = {
  id: string;
  fields: FieldSpec[];
};

function createNodeFromSpec(spec: FieldSpec): FieldRuntimeNode<string> {
  const initial = spec.initialValue ?? "";

  switch (spec.kind) {
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
    // Simple self-referential case (default)
    if (typeof when === "string") return predStreamFor(sourceId, when);

    // Direct predicate form (single predicate)
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

    const ops: TriggerOperation[] =
      "operations" in t ? t.operations : [t.operation];

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

  // 1) register nodes
  form.fields.forEach((f) => {
    const node = graph.register(createNodeFromSpec(f));
    nodesById.set(f.id, node);
  });

  // 2) apply per-field triggers
  form.fields.forEach((f) => applyTriggersFromSpec(graph, f));

  // 3) create stable handles for UI adapters
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

/** ---------------------------------------------
 * 2) Wrapper example: PhoneField
 * --------------------------------------------- */

// super basic US-ish phone normalizer: digits only, allow leading country "1" (11 digits) by stripping it
export const normalizePhone: Normalizer = (raw) => {
  // digits only; allow leading country "1" (11 digits) by stripping it
  const d = raw.replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("1")) return d.slice(1);
  return d;
};

export const phoneDigitsBlocker = /^\d{0,10}$/;

export const normalizeDigits = (raw: string, maxDigits: number) =>
  raw.replace(/\D/g, "").slice(0, maxDigits);

export function normalizeDecimalInput(
  raw: string,
  maxIntDigits: number,
  maxFracDigits: number | null
): string {
  const cleaned = raw.replace(/[^0-9.]/g, "");
  if (!cleaned) return "";

  let out = "";
  let seenDot = false;
  for (const ch of cleaned) {
    if (ch === ".") {
      if (seenDot) continue;
      seenDot = true;
      out += ".";
      continue;
    }
    out += ch;
  }

  let intPart = out;
  let fracPart = "";
  if (seenDot) {
    const idx = out.indexOf(".");
    intPart = out.slice(0, idx);
    fracPart = out.slice(idx + 1);
  }

  intPart = intPart.replace(/^0+(?=\d)/, "");
  if (intPart.length > maxIntDigits) intPart = intPart.slice(0, maxIntDigits);
  if (maxFracDigits !== null) fracPart = fracPart.slice(0, maxFracDigits);

  if (intPart === "" && fracPart === "") return "";
  if (intPart === "" && fracPart !== "") intPart = "0";

  return fracPart ? `${intPart}.${fracPart}` : intPart;
}

const addCommas = (intPart: string) =>
  intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

export const formatCurrencyDisplay = (n: string): string => {
  if (!n) return "";
  const [intRaw, fracRaw = ""] = n.split(".");
  const intWithCommas = addCommas(intRaw || "0");
  const frac2 = (fracRaw + "00").slice(0, 2);
  return `$${intWithCommas}.${frac2}`;
};


const padCurrencyTo2 = (n: string): string => {
  if (!n) return "";
  const [intRaw, fracRaw = ""] = n.split(".");
  const intPart = intRaw || "0";
  const frac2 = (fracRaw + "00").slice(0, 2);
  return `${intPart}.${frac2}`;
};

export const roundDecimalHalfEven = (raw: string, scale: number): string => {
  if (!raw) return "";

  const cleaned = raw.replace(/[^0-9.]/g, "");
  if (!cleaned) return "";

  // keep only first dot
  let out = "";
  let seenDot = false;
  for (const ch of cleaned) {
    if (ch === ".") {
      if (seenDot) continue;
      seenDot = true;
      out += ".";
      continue;
    }
    out += ch;
  }

  let [intPart, fracPart = ""] = out.split(".");
  intPart = (intPart || "0").replace(/^0+(?=\d)/, "");

  // Need next digit + rest to decide
  const frac = fracPart.padEnd(scale + 2, "0");
  const keep = frac.slice(0, scale);
  const next = frac.charCodeAt(scale) - 48; // digit after kept
  const rest = frac.slice(scale + 1);

  let roundUp = false;
  if (next > 5) roundUp = true;
  else if (next < 5) roundUp = false;
  else {
    // next == 5
    const hasNonZeroAfter = /[1-9]/.test(rest);
    if (hasNonZeroAfter) {
      roundUp = true;
    } else {
      // tie -> to even
      const lastDigit = scale === 0
        ? intPart.charCodeAt(intPart.length - 1) - 48
        : keep.charCodeAt(keep.length - 1) - 48;
      roundUp = (lastDigit % 2) === 1;
    }
  }

  const baseDigits = (intPart + keep.padEnd(scale, "0")) || "0";

  if (!roundUp) {
    if (scale === 0) return intPart;
    return `${intPart}.${keep.padEnd(scale, "0")}`;
  }

  // add 1 at rounding position with carry (string-safe)
  const arr = baseDigits.split("").map((c) => c.charCodeAt(0) - 48);
  let i = arr.length - 1;
  arr[i] += 1;
  while (i > 0 && arr[i] === 10) {
    arr[i] = 0;
    i -= 1;
    arr[i] += 1;
  }
  if (arr[0] === 10) {
    arr[0] = 0;
    arr.unshift(1);
  }

  const rounded = arr.join("");
  const intLen = rounded.length - scale;
  const intOut = rounded.slice(0, intLen) || "0";
  if (scale === 0) return intOut;
  const fracOut = rounded.slice(intLen).padStart(scale, "0");
  return `${intOut}.${fracOut}`;
};

export const formatPercentDisplay = (n: string): string => {
  if (!n) return "";
  const [intRaw, fracRaw = ""] = n.split(".");
  const intWithCommas = addCommas(intRaw || "0");
  if (fracRaw) return `${intWithCommas}.${fracRaw}%`;
  return `${intWithCommas}%`;
};

export const formatSSN: Formatter = (rawDigits) => {
  const d = rawDigits.replace(/\D/g, "");
  const a = d.slice(0, 3);
  const b = d.slice(3, 5);
  const c = d.slice(5, 9);
  if (d.length <= 3) return a;
  if (d.length <= 5) return `${a}-${b}`;
  return `${a}-${b}-${c}`;
};

export const formatZip: Formatter = (rawDigits) => {
  const d = rawDigits.replace(/\D/g, "");
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5, 9)}`;
};

function isControlKey(e: KeyboardEvent): boolean {
  if (e.ctrlKey || e.metaKey || e.altKey) return true;
  return (
    e.key === "Backspace" ||
    e.key === "Delete" ||
    e.key === "Tab" ||
    e.key === "Enter" ||
    e.key === "Escape" ||
    e.key === "ArrowLeft" ||
    e.key === "ArrowRight" ||
    e.key === "ArrowUp" ||
    e.key === "ArrowDown" ||
    e.key === "Home" ||
    e.key === "End"
  );
}

export function blockNonDigitsAndMaxLen(e: KeyboardEvent, currentDigits: string, maxLen: number) {
  if (isControlKey(e)) return;
  if (!/^\d$/.test(e.key)) {
    e.preventDefault();
    return;
  }
  if (currentDigits.length >= maxLen) {
    e.preventDefault();
  }
}

export function blockNonDecimalInput(e: KeyboardEvent, currentValue: string) {
  if (isControlKey(e)) return;
  if (/^\d$/.test(e.key)) return;
  if (e.key === "." && !currentValue.includes(".")) return;
  e.preventDefault();
}

// display formatting: (123) 456-7890 as you type
export const formatPhone: Formatter = (rawDigits) => {
  const d = rawDigits.replace(/\D/g, "");
  const a = d.slice(0, 3);
  const b = d.slice(3, 6);
  const c = d.slice(6, 10);
  if (d.length <= 3) return a;
  if (d.length <= 6) return `(${a}) ${b}`;
  return `(${a}) ${b}-${c}`;
};

// validator: must be 10 digits
const validatePhone: Validator<string> = (digits) => {
  if (!digits) return ["Phone is required."];
  if (!/^\d{10}$/.test(digits)) return ["Phone must be 10 digits."];
  return [];
};

const makeSsnValidator = (required: boolean): Validator<string> => (digits) => {
  if (!digits) return required ? ["SSN is required."] : [];
  if (!/^\d{9}$/.test(digits)) return ["SSN must be 9 digits."];
  return [];
};

const makeZipValidator = (required: boolean): Validator<string> => (digits) => {
  if (!digits) return required ? ["ZIP is required."] : [];
  if (!/^\d{5}(\d{4})?$/.test(digits)) return ["ZIP must be 5 or 9 digits."];
  return [];
};

export type FieldHandle = {
  value$: BehaviorSubject<string>;
  disabled$: Observable<boolean>;
  hidden$: Observable<boolean>;
  errors$: Observable<string[]>;
  touched$: Observable<boolean>;
  focused$: Observable<boolean>;
  valid$: Observable<boolean>;
  setValue: (next: string) => void;
  markTouched: () => void;
  setFocused: (f: boolean) => void;
};
