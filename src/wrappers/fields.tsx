import {createMemo, createSignal, type Component} from "solid-js";
import {
  TextFieldPrimitive,
  TextAreaFieldPrimitive,
  SelectFieldPrimitive,
  CheckboxFieldPrimitive,
  RadioGroupFieldPrimitive,
} from "../primitives/fields";
import {
  type FieldHandle,
  type FieldSpec,
  blockNonDecimalInput,
  blockNonDigitsAndMaxLen,
  formatCurrencyDisplay,
  formatPercentDisplay,
  formatPhone,
  formatSSN,
  formatZip,
  normalizeDecimalInput,
  normalizeDigits,
  normalizePhone,
  phoneDigitsBlocker,
  roundDecimalHalfEven,
} from "../engine/formEngine";
import {fromObservable} from "./fromObservable";

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

type CurrencyFieldProps = {
  spec: FieldSpec;
  field: FieldHandle;
  inline?: boolean;
};

export const CurrencyField: Component<CurrencyFieldProps> = (p) => {
  const disabled = fromObservable(p.field.disabled$, false);
  const errors = fromObservable(p.field.errors$, []);
  const touched = fromObservable(p.field.touched$, false);
  const valid = fromObservable(p.field.valid$, true);
  const raw = fromObservable(p.field.value$, "");

  const [isEditing, setIsEditing] = createSignal(false);

  const errorText = createMemo(() =>
    disabled() ? "" : touched() ? errors()[0] ?? "" : ""
  );
  const showRequiredDot = createMemo(() => !!p.spec.required && !valid());
  const editValue = createMemo(() => raw());
  const displayValue = createMemo(() => formatCurrencyDisplay(raw()));
  const maxIntDigits = p.spec.maxDigits ?? 9;

  return (
    <TextFieldPrimitive
      id={p.spec.id}
      label={p.spec.label}
      inputMode="decimal"
      value={isEditing() ? editValue() : displayValue()}
      placeholder={p.spec.placeholder}
      disabled={disabled()}
      errorText={errorText()}
      helperText={p.spec.helperText}
      requiredDot={showRequiredDot()}
      inline={p.inline}
      onKeyDown={(e) => blockNonDecimalInput(e, raw())}
      onInput={(nextDisplay) => {
        const normalized = normalizeDecimalInput(nextDisplay, maxIntDigits, null);
        p.field.setValue(normalized);
      }}
      onFocus={() => {
        setIsEditing(true);
        p.field.setFocused(true);
      }}
      onBlur={() => {
        setIsEditing(false);
        p.field.markTouched();
        const normalized = normalizeDecimalInput(raw(), maxIntDigits, null);
        const rounded = roundDecimalHalfEven(normalized, 2);
        p.field.setValue(rounded);
        p.field.setFocused(false);
      }}
    />
  );
};
type PercentFieldProps = {
  spec: FieldSpec;
  field: FieldHandle;
  inline?: boolean;
};

export const PercentField: Component<PercentFieldProps> = (p) => {
  const disabled = fromObservable(p.field.disabled$, false);
  const errors = fromObservable(p.field.errors$, []);
  const touched = fromObservable(p.field.touched$, false);
  const valid = fromObservable(p.field.valid$, true);
  const raw = fromObservable(p.field.value$, "");

  const [isEditing, setIsEditing] = createSignal(false);

  const errorText = createMemo(() =>
    disabled() ? "" : touched() ? errors()[0] ?? "" : ""
  );
  const showRequiredDot = createMemo(() => !!p.spec.required && !valid());
  const editValue = createMemo(() => raw());
  const displayValue = createMemo(() => formatPercentDisplay(raw()));
  const maxIntDigits = p.spec.maxDigits ?? 1000;

  return (
    <TextFieldPrimitive
      id={p.spec.id}
      label={p.spec.label}
      inputMode="decimal"
      value={isEditing() ? editValue() : displayValue()}
      placeholder={p.spec.placeholder}
      disabled={disabled()}
      errorText={errorText()}
      helperText={p.spec.helperText}
      requiredDot={showRequiredDot()}
      inline={p.inline}
      onKeyDown={(e) => blockNonDecimalInput(e, raw())}
      onInput={(nextDisplay) => {
        const normalized = normalizeDecimalInput(nextDisplay, maxIntDigits, null);
        p.field.setValue(normalized);
      }}
      onFocus={() => {
        setIsEditing(true);
        p.field.setFocused(true);
      }}
      onBlur={() => {
        setIsEditing(false);
        p.field.markTouched();
        p.field.setFocused(false);
      }}
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

export const BoundTextField: Component<{ spec: FieldSpec; field: FieldHandle }> = (p) => {
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
