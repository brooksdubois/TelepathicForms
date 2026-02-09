import {createMemo, type Component} from "solid-js";
import {TextFieldPrimitive} from "../primitives";
import type {FieldHandle} from "../engine/generators";
import {blockNonDigitsAndMaxLen} from "../utils/fieldHelpers";
import {fromObservable} from "../utils/fromObservable";

export type NumberFieldProps = {
  id?: string;
  label?: string;
  placeholder?: string;
  helperText?: string;
  maxDigits?: number;
  required?: boolean;
  fullWidth?: boolean;
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
      fullWidth={p.fullWidth}
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
