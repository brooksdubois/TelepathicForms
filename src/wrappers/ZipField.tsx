import {createMemo, type Component} from "solid-js";
import {TextFieldPrimitive} from "../primitives";
import type {FieldHandle, FieldSpec} from "../engine/generators";
import {
  blockNonDigitsAndMaxLen,
  formatZip,
  normalizeDigits,
} from "../utils/fieldHelpers";
import {fromObservable} from "../utils/fromObservable";

export type ZipFieldProps = {
  spec: FieldSpec;
  field: FieldHandle;
  inline?: boolean;
  fullWidth?: boolean;
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
      fullWidth={p.fullWidth}
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
