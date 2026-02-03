// TelepathicFormDemo.tsx
// Single-file Solid.js + TypeScript sketch:
//
// 1) TextFieldPrimitive: pure props-in / events-out
// 2) PhoneField: thin wrapper that adds phone-ish normalization/formatting
// 3) FieldRuntimeNode: the “telepathic” state node (BehaviorSubjects + derived streams)
// 4) GraphRuntime: a tiny wiring/scheduling substrate (no “boss logic”, just a switchboard)
//
// deps: solid-js, rxjs
import {createMemo, createSignal, onCleanup, Component, For} from "solid-js";
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
  value: string;
  placeholder?: string;
  disabled?: boolean;
  errorText?: string;
  helperText?: string;
  onInput: (next: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  onKeyDown?: (e: KeyboardEvent) => void;
};

export const TextFieldPrimitive: Component<TextFieldPrimitiveProps> = (p) => {
  const describedBy = createMemo(() => (p.id ? `${p.id}__help` : undefined));

  return (
    <label style={{display: "block", "font-family": "system-ui", "margin-bottom": "12px"}}>
      {p.label && <div style={{"font-size": "12px", "margin-bottom": "4px", opacity: 0.8}}>{p.label}</div>}

      <input
        id={p.id}
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
          width: "360px",
          padding: "10px 12px",
          "border-radius": "10px",
          border: p.errorText ? "1px solid #c62828" : "1px solid rgba(0,0,0,0.25)",
          outline: "none",
          "font-size": "14px",
          opacity: p.disabled ? 0.6 : 1,
        }}
      />

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

/** ---------------------------------------------
 * 3) FieldRuntimeNode: state + ports
 * --------------------------------------------- */
type Validator<T> = (value: T) => string[]; // return list of error messages
type Formatter = (raw: string) => string;
type Normalizer = (raw: string) => string;

type NodePatch<T> = {
  value?: T;
  disabledOverride?: boolean | null;
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

  constructor(args: {
    id: string;
    initialValue: T;
    validate?: Validator<T>;
    disabled$?: Observable<boolean>; // external wiring optional
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

  /** Apply multiple writes in a deterministic order (used by GraphRuntime batching). */
  applyPatch(patch: NodePatch<T>) {
    if (Object.prototype.hasOwnProperty.call(patch, "value")) {
      this.setValue(patch.value as T);
    }
    if (Object.prototype.hasOwnProperty.call(patch, "disabledOverride")) {
      this.setDisabledOverride(patch.disabledOverride as boolean | null);
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
  phone = "phone",
  text = "text",
  number = "number",
}

type FieldSpec = {
  id: string;
  kind: FieldKind;
  label: string;
  placeholder?: string;
  helperText?: string;
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
}

enum TriggerOperators {
  setDisabled = "setDisabled",
  setValue = "setValue",
}

type WhenPredicate = {
  fieldIds: string[];
  operator: WhenOperators;
};

type WhenClause =
  | WhenOperators
  | {
  [OperatorMaths.all]?: WhenPredicate;
  [OperatorMaths.any]?: WhenPredicate;
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
      const digits = initial.replace(/\D/g, "").slice(0, 6);
      return new FieldRuntimeNode<string>({
        id: spec.id,
        initialValue: digits,
        validate: spec.validate ?? (() => []),
      });
    }

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

  const predStreamFor = (id: string, op: WhenOperators) => {
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

    return op === WhenOperators.isValid ? n.valid$ : n.valid$.pipe(map((v) => !v));
  };

  const predicateFor = (when: WhenClause): Observable<boolean> => {
    // Simple self-referential case (default)
    if (typeof when === "string") return predStreamFor(sourceId, when);

    const allPred = when[OperatorMaths.all];
    const anyPred = when[OperatorMaths.any];

    const clause = allPred ?? anyPred;
    const mode: OperatorMaths = allPred ? OperatorMaths.all : OperatorMaths.any;

    if (!clause) return predStreamFor(sourceId, WhenOperators.isValid);

    const streams = clause.fieldIds.map((id) => predStreamFor(id, clause.operator));

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
      errors$: node.errors$,
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

type FieldHandle = {
  value$: BehaviorSubject<string>;
  disabled$: Observable<boolean>;
  errors$: Observable<string[]>;
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
  field: FieldHandle; // engine handle
};

export const PhoneField: Component<PhoneFieldProps> = (p) => {
  // pull reactive ports into Solid
  const disabled = fromObservable(p.field.disabled$, false);
  const errors = fromObservable(p.field.errors$, []);
  const rawDigits = fromObservable(p.field.value$, ""); // stored value = digits

  const displayValue = createMemo(() => formatPhone(rawDigits()));
  const errorText = createMemo(() => errors()[0] ?? "");
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

type NumberFieldProps = {
  id?: string;
  label?: string;
  placeholder?: string;
  helperText?: string;
  maxDigits?: number; // default 6
  field: FieldHandle;
};

export const NumberField: Component<NumberFieldProps> = (p) => {
  const disabled = fromObservable(p.field.disabled$, false);
  const errors = fromObservable(p.field.errors$, []);
  const value = fromObservable(p.field.value$, "");

  const errorText = createMemo(() => errors()[0] ?? "");
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

const BoundTextField: Component<{ spec: FieldSpec; field: FieldHandle }> = (p) => {
  const value = fromObservable(p.field.value$, "");
  const disabled = fromObservable(p.field.disabled$, false);
  const errors = fromObservable(p.field.errors$, []);

  const errorText = createMemo(() => errors()[0] ?? "");

  return (
    <TextFieldPrimitive
      id={p.spec.id}
      label={p.spec.label}
      value={value()}
      placeholder={p.spec.placeholder}
      disabled={disabled()}
      errorText={errorText()}
      helperText={p.spec.helperText}
      onInput={(v) => p.field.setValue(v)}
      onBlur={() => p.field.markTouched()}
    />
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

          switch (f.kind) {
            case FieldKind.phone:
              return (
                <PhoneField
                  id={f.id}
                  label={f.label}
                  placeholder={f.placeholder}
                  helperText={f.helperText}
                  inputMask={f.inputMask}
                  inputBlocker={f.inputBlocker}
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
                  field={handle}
                />
              );

            case FieldKind.text:
            default:
              return <BoundTextField spec={f} field={handle} />;
          }
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
        id: "phone",
        kind: FieldKind.phone,
        label: "Phone (required)",
        placeholder: "(___) ___-____",
        inputMask: "(___) ___-____",
        inputBlocker: "^\\d{0,10}$",
        helperText: "Digits are stored; formatting is view-only.",
        triggers: [
          {
            when: WhenOperators.isValid,
            operation: {
              fieldIds: ["ext"],
              operator: TriggerOperators.setDisabled,
              value: false,
            },
          },
          {
            when: WhenOperators.isInvalid,
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
        id: "ext",
        kind: FieldKind.number,
        label: "Extension (disabled until phone valid)",
        helperText: "Optional. Digits only, max 6.",
        validate: (v) => {
          if (!v) return []; // optional
          if (!/^\d{1,6}$/.test(v)) return ["Ext must be 1–6 digits."];
          return [];
        },
        triggers: [
          {
            when: WhenOperators.isValid,
            operation: {
              fieldIds: ["notes"],
              operator: TriggerOperators.setDisabled,
              value: false,
            },
          },
        ],
      },
      {
        id: "notes",
        kind: FieldKind.text,
        label: "Notes (disabled until phone & ext valid)",
        helperText: "Up to 140 chars.",
        validate: (v) => (v.length > 140 ? ["Max 140 chars."] : []),
      },
    ],
  };

  const {graph, nodesById, handlesById} = buildGraphFromFormSpec(formSpec);
  onCleanup(() => graph.destroy());

  // debug readouts
  const phoneValid = fromObservable(nodesById.get("phone")!.valid$, false);
  const extDisabled = fromObservable(nodesById.get("ext")!.disabled$, false);

  return (
    <div style={{padding: "18px"}}>
      <div style={{"font-family": "system-ui", "font-size": "16px", "margin-bottom": "10px"}}>
        Telepathic Fields (spec-driven sketch)
      </div>

      <FormRenderer form={formSpec} handlesById={handlesById}/>

      <div
        style={{
          "margin-top": "14px",
          "font-family": "ui-monospace, SFMono-Regular, Menlo, monospace",
          "font-size": "12px",
        }}
      >
        <div>phone.valid = {String(phoneValid())}</div>
        <div>ext.disabled (wired) = {String(extDisabled())}</div>
      </div>
    </div>
  );
};