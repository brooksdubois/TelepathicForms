import {createMemo, type Component} from "solid-js";
import type {FieldHandle, FieldSpec} from "../engine/generators";
import TextField from "../primitives/TextField";
import {blockNonDigitsAndMaxLen} from "../utils/fieldHelpers";
import {fromObservable} from "../utils/fromObservable";

export type NumberWrapperProps = {
  spec: FieldSpec;
  field: FieldHandle;
  fullWidth?: boolean;
};

export const NumberWrapper: Component<NumberWrapperProps> = (p) => {
  const disabled = fromObservable(p.field.disabled$, false);
  const errors = fromObservable(p.field.errors$, []);
  const touched = fromObservable(p.field.touched$, false);
  const value = fromObservable(p.field.value$, "");

  const errorText = createMemo(() =>
    disabled() ? "" : touched() ? errors()[0] ?? "" : ""
  );

  const maxDigits = p.spec.maxDigits ?? 6;

  return (
    <TextField
      id={p.spec.id}
      label={p.spec.label}
      value={value()}
      inputMask={p.spec.inputMask}
      type={p.spec.type ?? "text"}
      autoComplete={p.spec.autoComplete}
      minLength={p.spec.minLength}
      maxLength={p.spec.maxLength}
      placeholder={p.spec.placeholder}
      helperText={p.spec.helperText}
      required={!!p.spec.required}
      disabled={disabled()}
      readOnly={!!p.spec.readOnly}
      fullWidth={p.fullWidth}
      size={p.spec.size}
      variant={p.spec.variant}
      startAdornment={p.spec.startAdornment}
      endAdornment={p.spec.endAdornment}
      ringEnabled={p.spec.ringEnabled}
      animateRingOnFocus={p.spec.animateRingOnFocus}
      ringVariant={p.spec.ringVariant}
      error={!!errorText()}
      errorText={errorText()}
      onKeyDown={(e) => blockNonDigitsAndMaxLen(e as KeyboardEvent, value(), maxDigits)}
      onValue={(next) => {
        const digits = next.replace(/\D/g, "");
        if (digits.length > maxDigits) return;
        p.field.setValue(digits);
      }}
      onBlur={() => p.field.markTouched()}
    />
  );
};
