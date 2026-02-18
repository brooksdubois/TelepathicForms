import {createMemo, type Component} from "solid-js";
import type {FieldHandle, FieldSpec} from "../engine/generators";
import TextField from "../primitives/TextField";
import {
  blockNonDigitsAndMaxLen,
  formatZip,
  normalizeDigits,
} from "../utils/fieldHelpers";
import {fromObservable} from "../utils/fromObservable";

export type ZipWrapperProps = {
  spec: FieldSpec;
  field: FieldHandle;
  fullWidth?: boolean;
};

export const ZipWrapper: Component<ZipWrapperProps> = (p) => {
  const disabled = fromObservable(p.field.disabled$, false);
  const errors = fromObservable(p.field.errors$, []);
  const touched = fromObservable(p.field.touched$, false);
  const rawDigits = fromObservable(p.field.value$, "");

  const errorText = createMemo(() =>
    disabled() ? "" : touched() ? errors()[0] ?? "" : ""
  );
  const maxDigits = p.spec.maxDigits ?? 9;
  const blocker = new RegExp(p.spec.inputBlocker ?? "^\\d{0,9}$");

  return (
    <TextField
      id={p.spec.id}
      label={p.spec.label}
      rawValue={rawDigits()}
      format={formatZip}
      parse={(display) => normalizeDigits(display, maxDigits)}
      inputMask={p.spec.inputMask ?? "00000[-0000]"}
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
      onKeyDown={(e) => blockNonDigitsAndMaxLen(e as KeyboardEvent, rawDigits(), maxDigits)}
      onValue={(nextRaw) => {
        const digits = normalizeDigits(nextRaw, maxDigits);
        if (!blocker.test(digits)) return;
        p.field.setValue(digits);
      }}
      onBlur={() => p.field.markTouched()}
    />
  );
};
