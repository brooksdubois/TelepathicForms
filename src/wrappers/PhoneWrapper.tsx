import {createMemo, type Component} from "solid-js";
import type {FieldHandle, FieldSpec} from "../engine/generators";
import TextField from "../primitives/TextField";
import {
  blockNonDigitsAndMaxLen,
  formatPhone,
  normalizePhone,
  phoneDigitsBlocker,
} from "../utils/fieldHelpers";
import {fromObservable} from "../utils/fromObservable";

export type PhoneWrapperProps = {
  spec: FieldSpec;
  field: FieldHandle;
  fullWidth?: boolean;
};

export const PhoneWrapper: Component<PhoneWrapperProps> = (p) => {
  const disabled = fromObservable(p.field.disabled$, false);
  const errors = fromObservable(p.field.errors$, []);
  const touched = fromObservable(p.field.touched$, false);
  const rawDigits = fromObservable(p.field.value$, "");

  const errorText = createMemo(() =>
    disabled() ? "" : touched() ? errors()[0] ?? "" : ""
  );
  const blocker = new RegExp(p.spec.inputBlocker ?? "^\\d{0,10}$");

  return (
    <TextField
      id={p.spec.id}
      label={p.spec.label}
      rawValue={rawDigits()}
      format={formatPhone}
      parse={normalizePhone}
      inputMask={p.spec.inputMask ?? "(___) ___-____"}
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
      error={!!errorText()}
      errorText={errorText()}
      onKeyDown={(e) => blockNonDigitsAndMaxLen(e as KeyboardEvent, rawDigits(), 10)}
      onValue={(nextRaw) => {
        const digits = normalizePhone(nextRaw);
        if (!blocker.test(digits)) return;
        if (!phoneDigitsBlocker.test(digits)) return;
        p.field.setValue(digits);
      }}
      onFocus={() => p.field.setFocused(true)}
      onBlur={() => {
        p.field.markTouched();
        p.field.setFocused(false);
      }}
    />
  );
};
