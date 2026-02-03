// TelepathicFormDemo.tsx
// Single-file Solid.js + TypeScript sketch:
//
// 1) TextFieldPrimitive: pure props-in / events-out
// 2) PhoneField: thin wrapper that adds phone-ish normalization/formatting
// 3) FieldRuntimeNode: the “telepathic” state node (BehaviorSubjects + derived streams)
// 4) GraphRuntime: a tiny wiring/scheduling substrate (no “boss logic”, just a switchboard)
//
// deps: solid-js, rxjs
import {createMemo, createSignal, onCleanup, Component, For, JSX, Show} from "solid-js";
import {BehaviorSubject, Observable, Subscription, combineLatest, map, distinctUntilChanged, startWith} from "rxjs";

/** ---------------------------------------------
 * Utils: Observable -> Solid signal
 * --------------------------------------------- */
function fromObservable<T>(obs$: Observable<T>, initial: T): () => T {
  const [v, setV] = createSignal<T>(initial);
  const sub = obs$.subscribe(setV);
  onCleanup(() => sub.unsubscribe());
  return v;
}

/** ---------------------------------------------
 * 1) Pure Primitive: TextFieldPrimitive
 * --------------------------------------------- */
type TextFieldPrimitiveProps = {
  id?: string;
  label?: string;
  type?: string;
  inputMode?: JSX.InputHTMLAttributes<HTMLInputElement>["inputMode"];
  value: string;
  placeholder?: string;
  disabled?: boolean;
  errorText?: string;
  helperText?: string;
  rightSlot?: JSX.Element;
  requiredDot?: boolean;
  inline?: boolean;
  onInput: (next: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  onKeyDown?: (e: KeyboardEvent) => void;
};

export const TextFieldPrimitive: Component<TextFieldPrimitiveProps> = (p) => {
  const describedBy = createMemo(() => (p.id ? `${p.id}__help` : undefined));
  const isInline = !!p.inline;
  const labelWidth = "180px";
  const helperIndent = "192px";

  return (
    <label
      style={
        isInline
          ? {
              display: "flex",
              "align-items": "center",
              gap: "12px",
              "flex-wrap": "wrap",
              "font-family": "system-ui",
              "margin-bottom": "12px",
            }
          : {display: "block", "font-family": "system-ui", "margin-bottom": "12px"}
      }
    >
      {p.label && (
        <div
          style={{
            "font-size": "12px",
            "margin-bottom": isInline ? "0" : "4px",
            opacity: 0.8,
            "font-weight": 600,
            width: isInline ? labelWidth : undefined,
            "flex-shrink": isInline ? 0 : undefined,
          }}
        >
          {p.label}
          {p.requiredDot && (
            <span style={{color: "#c62828", "margin-left": "6px", "font-size": "6px"}}>●</span>
          )}
        </div>
      )}

      <div
        style={{
          display: "flex",
          gap: "6px",
          "align-items": "center",
          width: "360px",
          flex: isInline ? "1 1 360px" : undefined,
        }}
      >
        <input
          id={p.id}
          type={p.type ?? "text"}
          inputMode={p.inputMode}
          value={p.value}
          placeholder={p.placeholder}
          disabled={p.disabled}
          aria-invalid={!!p.errorText}
          aria-describedby={describedBy()}
          onInput={(e) => p.onInput((e.currentTarget as HTMLInputElement).value)}
          onBlur={() => p.onBlur?.()}
          onFocus={() => p.onFocus?.()}
          onKeyDown={(e) => p.onKeyDown?.(e as KeyboardEvent)}
          style={{
            width: p.rightSlot ? "100%" : "360px",
            padding: "10px 12px",
            "border-radius": "10px",
            border: p.errorText ? "1px solid #c62828" : "1px solid rgba(0,0,0,0.25)",
            outline: "none",
            "font-size": "14px",
            opacity: p.disabled ? 0.6 : 1,
          }}
        />
        {p.rightSlot}
      </div>

      <div
        id={describedBy()}
        style={{
          "margin-top": isInline ? "4px" : "6px",
          "font-size": "12px",
          color: p.errorText ? "#c62828" : "rgba(0,0,0,0.6)",
          ...(isInline ? {"flex-basis": "100%", "margin-left": helperIndent} : {}),
        }}
      >
        {p.errorText || p.helperText || " "}
      </div>
    </label>
  );
};

type TextAreaFieldPrimitiveProps = {
  id?: string;
  label?: string;
  value: string;
  placeholder?: string;
  disabled?: boolean;
  errorText?: string;
  helperText?: string;
  rows?: number;
  requiredDot?: boolean;
  inline?: boolean;
  onInput: (next: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
};

export const TextAreaFieldPrimitive: Component<TextAreaFieldPrimitiveProps> = (p) => {
  const describedBy = createMemo(() => (p.id ? `${p.id}__help` : undefined));
  const isInline = !!p.inline;
  const labelWidth = "180px";
  const helperIndent = "192px";

  return (
    <label
      style={
        isInline
          ? {
              display: "flex",
              "align-items": "center",
              gap: "12px",
              "flex-wrap": "wrap",
              "font-family": "system-ui",
              "margin-bottom": "12px",
            }
          : {display: "block", "font-family": "system-ui", "margin-bottom": "12px"}
      }
    >
      {p.label && (
        <div
          style={{
            "font-size": "12px",
            "margin-bottom": isInline ? "0" : "4px",
            opacity: 0.8,
            "font-weight": 600,
            width: isInline ? labelWidth : undefined,
            "flex-shrink": isInline ? 0 : undefined,
          }}
        >
          {p.label}
          {p.requiredDot && (
            <span style={{color: "#c62828", "margin-left": "6px", "font-size": "6px"}}>●</span>
          )}
        </div>
      )}

      <textarea
        id={p.id}
        value={p.value}
        rows={p.rows ?? 4}
        placeholder={p.placeholder}
        disabled={p.disabled}
        aria-invalid={!!p.errorText}
        aria-describedby={describedBy()}
        onInput={(e) => p.onInput((e.currentTarget as HTMLTextAreaElement).value)}
        onBlur={() => p.onBlur?.()}
        onFocus={() => p.onFocus?.()}
        style={{
          width: "360px",
          padding: "10px 12px",
          "border-radius": "10px",
          border: p.errorText ? "1px solid #c62828" : "1px solid rgba(0,0,0,0.25)",
          outline: "none",
          "font-size": "14px",
          opacity: p.disabled ? 0.6 : 1,
          "min-height": "96px",
          resize: "vertical",
          flex: isInline ? "1 1 360px" : undefined,
        }}
      />

      <div
        id={describedBy()}
        style={{
          "margin-top": isInline ? "4px" : "6px",
          "font-size": "12px",
          color: p.errorText ? "#c62828" : "rgba(0,0,0,0.6)",
          ...(isInline ? {"flex-basis": "100%", "margin-left": helperIndent} : {}),
        }}
      >
        {p.errorText || p.helperText || " "}
      </div>
    </label>
  );
};

type SelectOption = {label: string; value: string};

type SelectFieldPrimitiveProps = {
  id?: string;
  label?: string;
  value: string;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  errorText?: string;
  helperText?: string;
  requiredDot?: boolean;
  inline?: boolean;
  onChange: (next: string) => void;
  onBlur?: () => void;
};

export const SelectFieldPrimitive: Component<SelectFieldPrimitiveProps> = (p) => {
  const describedBy = createMemo(() => (p.id ? `${p.id}__help` : undefined));
  const isInline = !!p.inline;
  const labelWidth = "180px";
  const helperIndent = "192px";

  return (
    <label
      style={
        isInline
          ? {
              display: "flex",
              "align-items": "center",
              gap: "12px",
              "flex-wrap": "wrap",
              "font-family": "system-ui",
              "margin-bottom": "12px",
            }
          : {display: "block", "font-family": "system-ui", "margin-bottom": "12px"}
      }
    >
      {p.label && (
        <div
          style={{
            "font-size": "12px",
            "margin-bottom": isInline ? "0" : "4px",
            opacity: 0.8,
            "font-weight": 600,
            width: isInline ? labelWidth : undefined,
            "flex-shrink": isInline ? 0 : undefined,
          }}
        >
          {p.label}
          {p.requiredDot && (
            <span style={{color: "#c62828", "margin-left": "6px", "font-size": "6px"}}>●</span>
          )}
        </div>
      )}

      <select
        id={p.id}
        value={p.value}
        disabled={p.disabled}
        aria-invalid={!!p.errorText}
        aria-describedby={describedBy()}
        onChange={(e) => p.onChange((e.currentTarget as HTMLSelectElement).value)}
        onBlur={() => p.onBlur?.()}
        style={{
          width: "360px",
          padding: "10px 12px",
          "border-radius": "10px",
          border: p.errorText ? "1px solid #c62828" : "1px solid rgba(0,0,0,0.25)",
          outline: "none",
          "font-size": "14px",
          opacity: p.disabled ? 0.6 : 1,
          "background-color": "white",
          flex: isInline ? "1 1 360px" : undefined,
        }}
      >
        {p.placeholder && <option value="">{p.placeholder}</option>}
        <For each={p.options}>
          {(opt) => <option value={opt.value}>{opt.label}</option>}
        </For>
      </select>

      <div
        id={describedBy()}
        style={{
          "margin-top": isInline ? "4px" : "6px",
          "font-size": "12px",
          color: p.errorText ? "#c62828" : "rgba(0,0,0,0.6)",
          ...(isInline ? {"flex-basis": "100%", "margin-left": helperIndent} : {}),
        }}
      >
        {p.errorText || p.helperText || " "}
      </div>
    </label>
  );
};

type CheckboxFieldPrimitiveProps = {
  id?: string;
  label?: string;
  checked: boolean;
  disabled?: boolean;
  errorText?: string;
  helperText?: string;
  inline?: boolean;
  onChange: (next: boolean) => void;
};

export const CheckboxFieldPrimitive: Component<CheckboxFieldPrimitiveProps> = (p) => {
  const describedBy = createMemo(() => (p.id ? `${p.id}__help` : undefined));

  return (
    <label style={{display: "block", "font-family": "system-ui", "margin-bottom": "12px"}}>
      <div
        style={{
          display: "flex",
          "align-items": "center",
          gap: "8px",
          "flex-wrap": p.inline ? "wrap" : "nowrap",
        }}
      >
        <input
          id={p.id}
          type="checkbox"
          checked={p.checked}
          disabled={p.disabled}
          aria-invalid={!!p.errorText}
          aria-describedby={describedBy()}
          onChange={(e) => p.onChange((e.currentTarget as HTMLInputElement).checked)}
        />
        {p.label && <div style={{"font-size": "14px"}}>{p.label}</div>}
      </div>

      <div
        id={describedBy()}
        style={{
          "margin-top": "6px",
          "font-size": "12px",
          color: p.errorText ? "#c62828" : "rgba(0,0,0,0.6)",
        }}
      >
        {p.errorText || p.helperText || " "}
      </div>
    </label>
  );
};

type RadioGroupFieldPrimitiveProps = {
  id?: string;
  label?: string;
  name: string;
  value: string;
  options: SelectOption[];
  disabled?: boolean;
  errorText?: string;
  helperText?: string;
  inline?: boolean;
  requiredDot?: boolean;
  onChange: (next: string) => void;
};

export const RadioGroupFieldPrimitive: Component<RadioGroupFieldPrimitiveProps> = (p) => {
  const describedBy = createMemo(() => (p.id ? `${p.id}__help` : undefined));

  return (
    <div style={{display: "block", "font-family": "system-ui", "margin-bottom": "12px"}}>
      {p.label && (
        <div style={{"font-size": "12px", "margin-bottom": "6px", opacity: 0.8, "font-weight": 600}}>
          {p.label}
          {p.requiredDot && (
            <span style={{color: "#c62828", "margin-left": "6px", "font-size": "6px"}}>●</span>
          )}
        </div>
      )}

      <div
        role="radiogroup"
        aria-describedby={describedBy()}
        style={{
          display: p.inline ? "flex" : "grid",
          gap: p.inline ? "12px" : "6px",
          "align-items": "center",
          "flex-wrap": p.inline ? "wrap" : "nowrap",
        }}
      >
        <For each={p.options}>
          {(opt) => (
            <label style={{display: "flex", "align-items": "center", gap: "6px"}}>
              <input
                type="radio"
                name={p.name}
                value={opt.value}
                checked={p.value === opt.value}
                disabled={p.disabled}
                aria-invalid={!!p.errorText}
                onChange={(e) => p.onChange((e.currentTarget as HTMLInputElement).value)}
              />
              <div style={{"font-size": "14px"}}>{opt.label}</div>
            </label>
          )}
        </For>
      </div>

      <div
        id={describedBy()}
        style={{
          "margin-top": "6px",
          "font-size": "12px",
          color: p.errorText ? "#c62828" : "rgba(0,0,0,0.6)",
        }}
      >
        {p.errorText || p.helperText || " "}
      </div>
    </div>
  );
};

type InlineRowProps = {
  children: JSX.Element;
  gap?: string;
  align?: string;
};

export const InlineRow: Component<InlineRowProps> = (p) => {
  return (
    <div
      style={{
        display: "flex",
        "align-items": p.align ?? "center",
        gap: p.gap ?? "12px",
        "flex-wrap": "wrap",
      }}
    >
      {p.children}
    </div>
  );
};

/** ---------------------------------------------
 * 3) FieldRuntimeNode: state + ports
 * --------------------------------------------- */
type Validator<T> = (value: T) => string[]; // return list of error messages
type Formatter = (raw: string) => string;
type Normalizer = (raw: string) => string;

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

enum FieldKind {
  textArea = "textArea",
  phone = "phone",
  text = "text",
  number = "number",
  select = "select",
  checkbox = "checkbox",
  inlineCheckbox = "inlineCheckbox",
  radio = "radio",
  inlineRadio = "inlineRadio",
  ssn = "ssn",
  zip = "zip",
  password = "password",
}

type FieldSpec = {
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

enum OperatorMaths {
  all = "all",
  any = "any",
}

enum WhenOperators {
  isValid = "isValid",
  isInvalid = "isInvalid",
  isEmpty = "isEmpty",
  equals = "equals",
  notEquals = "notEquals",
}

enum TriggerOperators {
  setDisabled = "setDisabled",
  setValue = "setValue",
  setHidden = "setHidden",
}

type WhenPredicate =
  | {
      fieldIds?: string[];
      operator: WhenOperators.isValid | WhenOperators.isInvalid | WhenOperators.isEmpty;
    }
  | {
      fieldIds?: string[];
      operator: WhenOperators.equals | WhenOperators.notEquals;
      value: string;
    };

type WhenClause =
  | WhenOperators
  | WhenPredicate
  | {
      [OperatorMaths.all]?: WhenPredicate | WhenPredicate[];
      [OperatorMaths.any]?: WhenPredicate | WhenPredicate[];
    };

type TriggerOperation =
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

type TriggerSpec =
  | {
      when: WhenClause;
      operation: TriggerOperation;
    }
  | {
      when: WhenClause;
      operations: TriggerOperation[];
    };

type FormSpec = {
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

function buildGraphFromFormSpec(form: FormSpec) {
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
const normalizePhone: Normalizer = (raw) => {
  // digits only; allow leading country "1" (11 digits) by stripping it
  const d = raw.replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("1")) return d.slice(1);
  return d;
};

const phoneDigitsBlocker = /^\d{0,10}$/;

const normalizeDigits = (raw: string, maxDigits: number) =>
  raw.replace(/\D/g, "").slice(0, maxDigits);

const formatSSN: Formatter = (rawDigits) => {
  const d = rawDigits.replace(/\D/g, "");
  const a = d.slice(0, 3);
  const b = d.slice(3, 5);
  const c = d.slice(5, 9);
  if (d.length <= 3) return a;
  if (d.length <= 5) return `${a}-${b}`;
  return `${a}-${b}-${c}`;
};

const formatZip: Formatter = (rawDigits) => {
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

function blockNonDigitsAndMaxLen(e: KeyboardEvent, currentDigits: string, maxLen: number) {
  if (isControlKey(e)) return;
  if (!/^\d$/.test(e.key)) {
    e.preventDefault();
    return;
  }
  if (currentDigits.length >= maxLen) {
    e.preventDefault();
  }
}

// display formatting: (123) 456-7890 as you type
const formatPhone: Formatter = (rawDigits) => {
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

type FieldHandle = {
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

type PhoneFieldProps = {
  inputMask?: string;
  inputBlocker?: string;
  id?: string;
  label?: string;
  placeholder?: string;
  helperText?: string;
  required?: boolean;
  field: FieldHandle; // engine handle
};

export const PhoneField: Component<PhoneFieldProps> = (p) => {
  // pull reactive ports into Solid
  const disabled = fromObservable(p.field.disabled$, false);
  const errors = fromObservable(p.field.errors$, []);
  const touched = fromObservable(p.field.touched$, false);
  const valid = fromObservable(p.field.valid$, true);
  const rawDigits = fromObservable(p.field.value$, ""); // stored value = digits

  const displayValue = createMemo(() => formatPhone(rawDigits()));
  const errorText = createMemo(() =>
    disabled() ? "" : touched() ? errors()[0] ?? "" : ""
  );
  const showRequiredDot = createMemo(() => !!p.required && !valid());
  const mask = p.inputMask ?? "(___) ___-____";
  const blocker = new RegExp(p.inputBlocker ?? "^\\d{0,10}$");

  // If something else changes the stored digits, display updates automatically.
  // On user input, normalize to digits and store those.
  return (
    <TextFieldPrimitive
      id={p.id}
      label={p.label ?? "Phone"}
      value={displayValue()}
      placeholder={p.placeholder ?? mask}
      disabled={disabled()}
      errorText={errorText()}
      helperText={p.helperText}
      requiredDot={showRequiredDot()}
      onKeyDown={(e) => {
        blockNonDigitsAndMaxLen(e, rawDigits(), 10);
      }}
      onInput={(nextDisplay) => {
        const digits = normalizePhone(nextDisplay);
        if (!blocker.test(digits)) return;
        if (!phoneDigitsBlocker.test(digits)) return;
        p.field.setValue(digits);
      }}
      onBlur={() => p.field.markTouched()}
      onFocus={() => p.field.setFocused(true)}
    />
  );
};

type TextAreaFieldProps = {
  spec: FieldSpec;
  field: FieldHandle;
};

export const TextAreaField: Component<TextAreaFieldProps> = (p) => {
  const disabled = fromObservable(p.field.disabled$, false);
  const errors = fromObservable(p.field.errors$, []);
  const touched = fromObservable(p.field.touched$, false);
  const valid = fromObservable(p.field.valid$, true);
  const value = fromObservable(p.field.value$, "");

  const errorText = createMemo(() =>
    disabled() ? "" : touched() ? errors()[0] ?? "" : ""
  );
  const showRequiredDot = createMemo(() => !!p.spec.required && !valid());

  return (
    <TextAreaFieldPrimitive
      id={p.spec.id}
      label={p.spec.label}
      value={value()}
      placeholder={p.spec.placeholder}
      disabled={disabled()}
      errorText={errorText()}
      helperText={p.spec.helperText}
      requiredDot={showRequiredDot()}
      onInput={(v) => p.field.setValue(v)}
      onBlur={() => p.field.markTouched()}
    />
  );
};

type SelectFieldProps = {
  spec: FieldSpec;
  field: FieldHandle;
};

export const SelectField: Component<SelectFieldProps> = (p) => {
  const disabled = fromObservable(p.field.disabled$, false);
  const errors = fromObservable(p.field.errors$, []);
  const touched = fromObservable(p.field.touched$, false);
  const valid = fromObservable(p.field.valid$, true);
  const value = fromObservable(p.field.value$, "");

  const errorText = createMemo(() =>
    disabled() ? "" : touched() ? errors()[0] ?? "" : ""
  );
  const showRequiredDot = createMemo(() => !!p.spec.required && !valid());
  const options = p.spec.options ?? [];

  return (
    <SelectFieldPrimitive
      id={p.spec.id}
      label={p.spec.label}
      value={value()}
      placeholder={p.spec.placeholder}
      disabled={disabled()}
      errorText={errorText()}
      helperText={p.spec.helperText}
      requiredDot={showRequiredDot()}
      options={options}
      onChange={(next) => p.field.setValue(next)}
      onBlur={() => p.field.markTouched()}
    />
  );
};

type CheckboxFieldProps = {
  spec: FieldSpec;
  field: FieldHandle;
  inline?: boolean;
};

export const CheckboxField: Component<CheckboxFieldProps> = (p) => {
  const disabled = fromObservable(p.field.disabled$, false);
  const errors = fromObservable(p.field.errors$, []);
  const touched = fromObservable(p.field.touched$, false);
  const value = fromObservable(p.field.value$, "");

  const errorText = createMemo(() =>
    disabled() ? "" : touched() ? errors()[0] ?? "" : ""
  );
  const checked = createMemo(() => value() === "true");

  return (
    <CheckboxFieldPrimitive
      id={p.spec.id}
      label={p.spec.label}
      checked={checked()}
      disabled={disabled()}
      errorText={errorText()}
      helperText={p.spec.helperText}
      inline={p.inline}
      onChange={(next) => {
        p.field.setValue(next ? "true" : "");
        p.field.markTouched();
      }}
    />
  );
};

export const InlineCheckboxField: Component<Omit<CheckboxFieldProps, "inline">> = (p) => {
  return <CheckboxField {...p} inline={true} />;
};

type RadioFieldProps = {
  spec: FieldSpec;
  field: FieldHandle;
  inline?: boolean;
};

export const RadioField: Component<RadioFieldProps> = (p) => {
  const disabled = fromObservable(p.field.disabled$, false);
  const errors = fromObservable(p.field.errors$, []);
  const touched = fromObservable(p.field.touched$, false);
  const valid = fromObservable(p.field.valid$, true);
  const value = fromObservable(p.field.value$, "");

  const errorText = createMemo(() =>
    disabled() ? "" : touched() ? errors()[0] ?? "" : ""
  );
  const showRequiredDot = createMemo(() => !!p.spec.required && !valid());
  const options = p.spec.options ?? [];

  return (
    <RadioGroupFieldPrimitive
      id={p.spec.id}
      name={p.spec.id}
      label={p.spec.label}
      value={value()}
      disabled={disabled()}
      errorText={errorText()}
      helperText={p.spec.helperText}
      options={options}
      inline={p.inline}
      requiredDot={showRequiredDot()}
      onChange={(next) => {
        p.field.setValue(next);
        p.field.markTouched();
      }}
    />
  );
};

export const InlineRadioField: Component<Omit<RadioFieldProps, "inline">> = (p) => {
  return <RadioField {...p} inline={true} />;
};

type SsnFieldProps = {
  spec: FieldSpec;
  field: FieldHandle;
  inline?: boolean;
};

export const SsnField: Component<SsnFieldProps> = (p) => {
  const disabled = fromObservable(p.field.disabled$, false);
  const errors = fromObservable(p.field.errors$, []);
  const touched = fromObservable(p.field.touched$, false);
  const valid = fromObservable(p.field.valid$, true);
  const rawDigits = fromObservable(p.field.value$, "");
  const [show, setShow] = createSignal(false);

  const displayValue = createMemo(() => formatSSN(rawDigits()));
  const errorText = createMemo(() =>
    disabled() ? "" : touched() ? errors()[0] ?? "" : ""
  );
  const showRequiredDot = createMemo(() => !!p.spec.required && !valid());
  const mask = p.spec.inputMask ?? "___-__-____";
  const maxDigits = p.spec.maxDigits ?? 9;
  const blocker = new RegExp(p.spec.inputBlocker ?? "^\\d{0,9}$");

  return (
    <TextFieldPrimitive
      id={p.spec.id}
      label={p.spec.label}
      type={show() ? "text" : "password"}
      inputMode="numeric"
      value={displayValue()}
      placeholder={p.spec.placeholder ?? mask}
      disabled={disabled()}
      errorText={errorText()}
      helperText={p.spec.helperText}
      requiredDot={showRequiredDot()}
      inline={p.inline}
      rightSlot={
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          disabled={disabled()}
          style={{
            padding: "8px 10px",
            "border-radius": "8px",
            border: "1px solid rgba(0,0,0,0.25)",
            "background-color": "white",
            "font-size": "12px",
            cursor: "pointer",
            opacity: disabled() ? 0.6 : 1,
          }}
        >
          {show() ? "Hide" : "Show"}
        </button>
      }
      onKeyDown={(e) => blockNonDigitsAndMaxLen(e, rawDigits(), maxDigits)}
      onInput={(nextDisplay) => {
        if (/[^0-9-]/.test(nextDisplay)) return;
        const digits = normalizeDigits(nextDisplay, maxDigits);
        if (!blocker.test(digits)) return;
        p.field.setValue(digits);
      }}
      onBlur={() => p.field.markTouched()}
    />
  );
};

type ZipFieldProps = {
  spec: FieldSpec;
  field: FieldHandle;
  inline?: boolean;
};

export const ZipField: Component<ZipFieldProps> = (p) => {
  const disabled = fromObservable(p.field.disabled$, false);
  const errors = fromObservable(p.field.errors$, []);
  const touched = fromObservable(p.field.touched$, false);
  const valid = fromObservable(p.field.valid$, true);
  const rawDigits = fromObservable(p.field.value$, "");

  const displayValue = createMemo(() => formatZip(rawDigits()));
  const errorText = createMemo(() =>
    disabled() ? "" : touched() ? errors()[0] ?? "" : ""
  );
  const showRequiredDot = createMemo(() => !!p.spec.required && !valid());
  const mask = p.spec.inputMask ?? "00000[-0000]";
  const maxDigits = p.spec.maxDigits ?? 9;
  const blocker = new RegExp(p.spec.inputBlocker ?? "^\\d{0,9}$");

  return (
    <TextFieldPrimitive
      id={p.spec.id}
      label={p.spec.label}
      inputMode="numeric"
      value={displayValue()}
      placeholder={p.spec.placeholder ?? mask}
      disabled={disabled()}
      errorText={errorText()}
      helperText={p.spec.helperText}
      requiredDot={showRequiredDot()}
      inline={p.inline}
      onKeyDown={(e) => blockNonDigitsAndMaxLen(e, rawDigits(), maxDigits)}
      onInput={(nextDisplay) => {
        if (/[^0-9-]/.test(nextDisplay)) return;
        const digits = normalizeDigits(nextDisplay, maxDigits);
        if (!blocker.test(digits)) return;
        p.field.setValue(digits);
      }}
      onBlur={() => p.field.markTouched()}
    />
  );
};

type NumberFieldProps = {
  id?: string;
  label?: string;
  placeholder?: string;
  helperText?: string;
  maxDigits?: number; // default 6
  required?: boolean;
  field: FieldHandle;
};

export const NumberField: Component<NumberFieldProps> = (p) => {
  const disabled = fromObservable(p.field.disabled$, false);
  const errors = fromObservable(p.field.errors$, []);
  const touched = fromObservable(p.field.touched$, false);
  const valid = fromObservable(p.field.valid$, true);
  const value = fromObservable(p.field.value$, "");

  const errorText = createMemo(() =>
    disabled() ? "" : touched() ? errors()[0] ?? "" : ""
  );
  const showRequiredDot = createMemo(() => !!p.required && !valid());
  const maxDigits = p.maxDigits ?? 6;

  return (
    <TextFieldPrimitive
      id={p.id}
      label={p.label}
      value={value()}
      placeholder={p.placeholder}
      disabled={disabled()}
      errorText={errorText()}
      helperText={p.helperText}
      requiredDot={showRequiredDot()}
      onKeyDown={(e) => blockNonDigitsAndMaxLen(e, value(), maxDigits)}
      onInput={(next) => {
        const digits = next.replace(/\D/g, "");
        if (digits.length > maxDigits) return;
        p.field.setValue(digits);
      }}
      onBlur={() => p.field.markTouched()}
    />
  );
};

type PasswordFieldProps = {
  spec: FieldSpec;
  field: FieldHandle;
  inline?: boolean;
};

export const PasswordField: Component<PasswordFieldProps> = (p) => {
  const disabled = fromObservable(p.field.disabled$, false);
  const errors = fromObservable(p.field.errors$, []);
  const value = fromObservable(p.field.value$, "");
  const [show, setShow] = createSignal(false);
  const touched = fromObservable(p.field.touched$, false);
  const valid = fromObservable(p.field.valid$, true);

  const errorText = createMemo(() =>
    disabled() ? "" : touched() ? errors()[0] ?? "" : ""
  );
  const showRequiredDot = createMemo(() => !!p.spec.required && !valid());

  return (
    <TextFieldPrimitive
      id={p.spec.id}
      label={p.spec.label}
      type={show() ? "text" : "password"}
      value={value()}
      placeholder={p.spec.placeholder}
      disabled={disabled()}
      errorText={errorText()}
      helperText={p.spec.helperText}
      requiredDot={showRequiredDot()}
      inline={p.inline}
      rightSlot={
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          disabled={disabled()}
          style={{
            padding: "8px 10px",
            "border-radius": "8px",
            border: "1px solid rgba(0,0,0,0.25)",
            "background-color": "white",
            "font-size": "12px",
            cursor: "pointer",
            opacity: disabled() ? 0.6 : 1,
          }}
        >
          {show() ? "Hide" : "Show"}
        </button>
      }
      onInput={(next) => p.field.setValue(next)}
      onBlur={() => p.field.markTouched()}
    />
  );
};

const BoundTextField: Component<{ spec: FieldSpec; field: FieldHandle }> = (p) => {
  const value = fromObservable(p.field.value$, "");
  const disabled = fromObservable(p.field.disabled$, false);
  const errors = fromObservable(p.field.errors$, []);
  const touched = fromObservable(p.field.touched$, false);
  const valid = fromObservable(p.field.valid$, true);

  const errorText = createMemo(() =>
    disabled() ? "" : touched() ? errors()[0] ?? "" : ""
  );
  const showRequiredDot = createMemo(() => !!p.spec.required && !valid());

  return (
    <TextFieldPrimitive
      id={p.spec.id}
      label={p.spec.label}
      value={value()}
      placeholder={p.spec.placeholder}
      disabled={disabled()}
      errorText={errorText()}
      helperText={p.spec.helperText}
      requiredDot={showRequiredDot()}
      onInput={(v) => p.field.setValue(v)}
      onBlur={() => p.field.markTouched()}
    />
  );
};

/** ---------------------------------------------
 * FieldSlot: stable field rendering boundary for hidden$
 * --------------------------------------------- */

type FieldSlotProps = {
  f: FieldSpec;
  handle: FieldHandle;
};

const FieldSlot: Component<FieldSlotProps> = (p) => {
  const hidden = fromObservable(p.handle.hidden$, false);

  return (
    <Show when={!hidden()} fallback={null}>
      {(() => {
        const f = p.f;
        const handle = p.handle;

        switch (f.kind) {
          case FieldKind.textArea:
            return <TextAreaField spec={f} field={handle} />;

          case FieldKind.phone:
            return (
              <PhoneField
                id={f.id}
                label={f.label}
                placeholder={f.placeholder}
                helperText={f.helperText}
                inputMask={f.inputMask}
                inputBlocker={f.inputBlocker}
                required={f.required}
                field={handle}
              />
            );

          case FieldKind.number:
            return (
              <NumberField
                id={f.id}
                label={f.label}
                placeholder={f.placeholder}
                helperText={f.helperText}
                maxDigits={f.maxDigits}
                required={f.required}
                field={handle}
              />
            );

          case FieldKind.select:
            return <SelectField spec={f} field={handle} />;

          case FieldKind.checkbox:
            return <CheckboxField spec={f} field={handle} />;

          case FieldKind.inlineCheckbox:
            return <InlineCheckboxField spec={f} field={handle} />;

          case FieldKind.radio:
            return <RadioField spec={f} field={handle} />;

          case FieldKind.inlineRadio:
            return <InlineRadioField spec={f} field={handle} />;

          case FieldKind.ssn:
            return <SsnField spec={f} field={handle} />;

          case FieldKind.zip:
            return <ZipField spec={f} field={handle} />;

          case FieldKind.password:
            return <PasswordField spec={f} field={handle} />;

          case FieldKind.text:
          default:
            return <BoundTextField spec={f} field={handle} />;
        }
      })()}
    </Show>
  );
};

/** ---------------------------------------------
 * 6) Spec-driven renderer (UI layer)
 * --------------------------------------------- */

type FormRendererProps = {
  form: FormSpec;
  handlesById: Map<string, FieldHandle>;
};

const FormRenderer: Component<FormRendererProps> = (p) => {
  return (
    <div>
      <For each={p.form.fields}>
        {(f) => {
          const handle = p.handlesById.get(f.id);
          if (!handle) throw new Error(`Missing FieldHandle for ${f.id}`);
          return <FieldSlot f={f} handle={handle} />;
        }}
      </For>
    </div>
  );
};

/** ---------------------------------------------
 * Demo App: Spec-driven version
 * --------------------------------------------- */
export const TelepathicFormDemo: Component = () => {
  // This is the JS object that “draws” the form.
  // In the real system, Kotlin would output/compile something like this.
  const formSpec: FormSpec = {
    id: "demo",
    fields: [
      {
        id: "contactMethod",
        kind: FieldKind.select,
        label: "Preferred Contact Method",
        placeholder: "Select one...",
        required: true,
        options: [
          {label: "Phone", value: "phone"},
          {label: "Email", value: "email"},
          {label: "Mail", value: "mail"},
        ],
        triggers: [
          // INITIAL: nothing selected -> hide everything except the selectors
          {
            when: WhenOperators.isEmpty,
            operations: [
              {fieldIds: ["phone", "hasExtension", "ext", "email", "zip", "preferredTime", "notes", "password"], operator: TriggerOperators.setHidden, value: true},
              // keep these disabled/cleared as a safety baseline
              {fieldIds: ["phone"], operator: TriggerOperators.setDisabled, value: true},
              {fieldIds: ["phone"], operator: TriggerOperators.setValue, value: ""},
              {fieldIds: ["hasExtension"], operator: TriggerOperators.setDisabled, value: true},
              {fieldIds: ["hasExtension"], operator: TriggerOperators.setValue, value: ""},
              {fieldIds: ["ext"], operator: TriggerOperators.setDisabled, value: true},
              {fieldIds: ["ext"], operator: TriggerOperators.setValue, value: ""},
              {fieldIds: ["zip"], operator: TriggerOperators.setDisabled, value: true},
              {fieldIds: ["zip"], operator: TriggerOperators.setValue, value: ""},
            ],
          },

          // PHONE: show phone-related fields; hide email/mail fields; show common fields
          {
            when: {operator: WhenOperators.equals, value: "phone"},
            operations: [
              {fieldIds: ["phone", "hasExtension", "preferredTime", "notes", "password"], operator: TriggerOperators.setHidden, value: false},
              {fieldIds: ["email", "zip"], operator: TriggerOperators.setHidden, value: true},
              // ext is controlled by its own triggers; default hidden until its triggers show it
              {fieldIds: ["ext"], operator: TriggerOperators.setHidden, value: true},
              {fieldIds: ["phone"], operator: TriggerOperators.setDisabled, value: false},
              {fieldIds: ["hasExtension"], operator: TriggerOperators.setDisabled, value: false},
            ],
          },

          // EMAIL: show email; hide phone/mail fields; show common fields
          {
            when: {operator: WhenOperators.equals, value: "email"},
            operations: [
              {fieldIds: ["email", "notes", "password"], operator: TriggerOperators.setHidden, value: false},
              {fieldIds: ["phone", "hasExtension", "ext", "zip", "preferredTime"], operator: TriggerOperators.setHidden, value: true},
            ],
          },

          // MAIL: show zip; hide phone/email fields; show common fields
          {
            when: {operator: WhenOperators.equals, value: "mail"},
            operations: [
              {fieldIds: ["zip", "notes", "password"], operator: TriggerOperators.setHidden, value: false},
              {fieldIds: ["phone", "hasExtension", "ext", "email", "preferredTime"], operator: TriggerOperators.setHidden, value: true},
              {fieldIds: ["zip"], operator: TriggerOperators.setDisabled, value: false},
            ],
          },

          // NOT PHONE: disable + clear phone and extension controls
          {
            when: {operator: WhenOperators.notEquals, value: "phone"},
            operations: [
              {fieldIds: ["phone"], operator: TriggerOperators.setDisabled, value: true},
              {fieldIds: ["phone"], operator: TriggerOperators.setValue, value: ""},
              {fieldIds: ["hasExtension"], operator: TriggerOperators.setDisabled, value: true},
              {fieldIds: ["hasExtension"], operator: TriggerOperators.setValue, value: ""},
              {fieldIds: ["ext"], operator: TriggerOperators.setDisabled, value: true},
              {fieldIds: ["ext"], operator: TriggerOperators.setValue, value: ""},
              {fieldIds: ["ext"], operator: TriggerOperators.setHidden, value: true},
            ],
          },

          // NOT MAIL: disable + clear zip
          {
            when: {operator: WhenOperators.notEquals, value: "mail"},
            operations: [
              {fieldIds: ["zip"], operator: TriggerOperators.setDisabled, value: true},
              {fieldIds: ["zip"], operator: TriggerOperators.setValue, value: ""},
            ],
          },
        ],
      },
      {
        id: "phone",
        kind: FieldKind.phone,
        label: "Phone (required for phone contact)",
        placeholder: "(___) ___-____",
        inputMask: "(___) ___-____",
        inputBlocker: "^\\d{0,10}$",
        required: true,
        helperText: "Digits are stored; formatting is view-only.",
      },
      {
        id: "hasExtension",
        kind: FieldKind.inlineCheckbox,
        label: "Has extension",
        helperText: "Enable the extension field.",
      },
      {
        id: "ext",
        kind: FieldKind.number,
        label: "Extension",
        helperText: "Optional. Digits only, max 6.",
        maxDigits: 6,
        validate: (v) => {
          if (!v) return []; // optional
          if (!/^\d{1,6}$/.test(v)) return ["Ext must be 1–6 digits."];
          return [];
        },
        triggers: [
          // Show/hide purely based on the checkbox
          {
            when: {fieldIds: ["hasExtension"], operator: WhenOperators.equals, value: "true"},
            operation: {
              fieldIds: ["ext"],
              operator: TriggerOperators.setHidden,
              value: false,
            },
          },
          {
            when: {fieldIds: ["hasExtension"], operator: WhenOperators.notEquals, value: "true"},
            operations: [
              {
                fieldIds: ["ext"],
                operator: TriggerOperators.setHidden,
                value: true,
              },
              {
                fieldIds: ["ext"],
                operator: TriggerOperators.setDisabled,
                value: true,
              },
              {
                fieldIds: ["ext"],
                operator: TriggerOperators.setValue,
                value: "",
              },
            ],
          },

          // Enable only when phone is valid AND the checkbox is on
          {
            when: {
              [OperatorMaths.all]: [
                {fieldIds: ["phone"], operator: WhenOperators.isValid},
                {fieldIds: ["hasExtension"], operator: WhenOperators.equals, value: "true"},
              ],
            },
            operation: {
              fieldIds: ["ext"],
              operator: TriggerOperators.setDisabled,
              value: false,
            },
          },

          // If phone becomes invalid while shown, disable + clear (but keep visibility)
          {
            when: {
              [OperatorMaths.all]: [
                {fieldIds: ["phone"], operator: WhenOperators.isInvalid},
                {fieldIds: ["hasExtension"], operator: WhenOperators.equals, value: "true"},
              ],
            },
            operations: [
              {
                fieldIds: ["ext"],
                operator: TriggerOperators.setDisabled,
                value: true,
              },
              {
                fieldIds: ["ext"],
                operator: TriggerOperators.setValue,
                value: "",
              },
            ],
          },
        ],
      },
      {
        id: "email",
        kind: FieldKind.text,
        label: "Email",
        placeholder: "you@example.com",
        helperText: "Used when contact method is email.",
        validate: (v) => {
          if (!v) return [];
          if (!/^[^@]+@[^@]+\.[^@]+$/.test(v)) return ["Enter a valid email."];
          return [];
        },
      },
      {
        id: "preferredTime",
        kind: FieldKind.inlineRadio,
        label: "Preferred Time",
        required: true,
        options: [
          {label: "Morning", value: "morning"},
          {label: "Afternoon", value: "afternoon"},
          {label: "Evening", value: "evening"},
        ],
        helperText: "Used for phone follow-ups.",
      },
      {
        id: "zip",
        kind: FieldKind.zip,
        label: "ZIP Code",
        inputMask: "00000[-0000]",
        inputBlocker: "^\\d{0,9}$",
        required: true,
        helperText: "Required only for mail contact.",
      },
      {
        id: "isEmployee",
        kind: FieldKind.checkbox,
        label: "I am an employee",
        helperText: "Employee-only SSN field will unlock.",
        triggers: [
          {
            when: {operator: WhenOperators.equals, value: "true"},
            operations: [
              {fieldIds: ["ssn"], operator: TriggerOperators.setHidden, value: false},
              {fieldIds: ["ssn"], operator: TriggerOperators.setDisabled, value: false},
            ],
          },
          {
            when: {operator: WhenOperators.notEquals, value: "true"},
            operations: [
              {fieldIds: ["ssn"], operator: TriggerOperators.setHidden, value: true},
              {fieldIds: ["ssn"], operator: TriggerOperators.setDisabled, value: true},
              {fieldIds: ["ssn"], operator: TriggerOperators.setValue, value: ""},
            ],
          },
        ],
      },
      {
        id: "ssn",
        kind: FieldKind.ssn,
        label: "SSN (optional)",
        inputMask: "___-__-____",
        inputBlocker: "^\\d{0,9}$",
        helperText: "Digits only. Stored as raw digits.",
      },
      {
        id: "notes",
        kind: FieldKind.textArea,
        label: "Notes",
        placeholder: "Anything else we should know?",
        helperText: "Up to 240 chars.",
        validate: (v) => (v.length > 240 ? ["Max 240 chars."] : []),
      },
      {
        id: "password",
        kind: FieldKind.password,
        label: "Account Password",
        placeholder: "••••••••",
        helperText: "Toggle show/hide (no masking rules enforced).",
      },
    ],
  };

  const {graph, nodesById, handlesById} = buildGraphFromFormSpec(formSpec);
  onCleanup(() => graph.destroy());

  const zipSpec = formSpec.fields.find((f) => f.id === "zip")!;
  const passwordSpec = formSpec.fields.find((f) => f.id === "password")!;

  // debug readouts
  const contactMethod = fromObservable(nodesById.get("contactMethod")!.value$, "");
  const phoneValid = fromObservable(nodesById.get("phone")!.valid$, false);
  const extDisabled = fromObservable(nodesById.get("ext")!.disabled$, false);
  const zipDisabled = fromObservable(nodesById.get("zip")!.disabled$, false);

  return (
    <div style={{padding: "18px"}}>
      <div style={{"font-family": "system-ui", "font-size": "16px", "margin-bottom": "10px"}}>
        Telepathic Fields (spec-driven sketch)
      </div>

      <FormRenderer form={formSpec} handlesById={handlesById}/>

      <div style={{"margin-top": "18px", "font-family": "system-ui", "font-size": "12px", opacity: 0.7}}>
        InlineRow demo (duplicates below)
      </div>
      <InlineRow>
        <ZipField spec={zipSpec} field={handlesById.get("zip")!} inline={true} />
        <PasswordField spec={passwordSpec} field={handlesById.get("password")!} inline={true} />
      </InlineRow>

      <div
        style={{
          "margin-top": "14px",
          "font-family": "ui-monospace, SFMono-Regular, Menlo, monospace",
          "font-size": "12px",
        }}
      >
        <div>phone.valid = {String(phoneValid())}</div>
        <div>ext.disabled (wired) = {String(extDisabled())}</div>
        <div>zip.disabled (wired) = {String(zipDisabled())}</div>
        <div>contactMethod = {contactMethod() || "(empty)"}</div>
      </div>
    </div>
  );
};
