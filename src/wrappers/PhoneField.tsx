import {createMemo, type Component} from "solid-js";
import {TextFieldPrimitive} from "../primitives";
import type {FieldHandle} from "../engine/generators";
import {
  blockNonDigitsAndMaxLen,
  formatPhone,
  normalizePhone,
  phoneDigitsBlocker,
} from "../utils/fieldHelpers";
import {fromObservable} from "../utils/fromObservable";

export type PhoneFieldProps = {
  inputMask?: string;
  inputBlocker?: string;
  id?: string;
  label?: string;
  placeholder?: string;
  helperText?: string;
  required?: boolean;
  fullWidth?: boolean;
  field: FieldHandle;
};

export const PhoneField: Component<PhoneFieldProps> = (p) => {
  const disabled = fromObservable(p.field.disabled$, false);
  const errors = fromObservable(p.field.errors$, []);
  const touched = fromObservable(p.field.touched$, false);
  const valid = fromObservable(p.field.valid$, true);
  const rawDigits = fromObservable(p.field.value$, "");

  const displayValue = createMemo(() => formatPhone(rawDigits()));
  const errorText = createMemo(() =>
    disabled() ? "" : touched() ? errors()[0] ?? "" : ""
  );
  const showRequiredDot = createMemo(() => !!p.required && !valid());
  const mask = p.inputMask ?? "(___) ___-____";
  const blocker = new RegExp(p.inputBlocker ?? "^\\d{0,10}$");

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
      fullWidth={p.fullWidth}
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
