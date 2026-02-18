import {createMemo, createSignal, type Component} from "solid-js";
import type {FieldHandle, FieldSpec} from "../engine/generators";
import TextField from "../primitives/TextField";
import {
  blockNonDecimalInput,
  formatCurrencyDisplay,
  normalizeDecimalInput,
  roundDecimalHalfEven,
} from "../utils/fieldHelpers";
import {fromObservable} from "../utils/fromObservable";

export type CurrencyWrapperProps = {
  spec: FieldSpec;
  field: FieldHandle;
  fullWidth?: boolean;
};

export const CurrencyWrapper: Component<CurrencyWrapperProps> = (p) => {
  const disabled = fromObservable(p.field.disabled$, false);
  const errors = fromObservable(p.field.errors$, []);
  const touched = fromObservable(p.field.touched$, false);
  const raw = fromObservable(p.field.value$, "");
  const [isEditing, setIsEditing] = createSignal(false);

  const errorText = createMemo(() =>
    disabled() ? "" : touched() ? errors()[0] ?? "" : ""
  );
  const maxIntDigits = p.spec.maxDigits ?? 9;

  return (
    <TextField
      id={p.spec.id}
      label={p.spec.label}
      rawValue={raw()}
      format={(value) => (isEditing() ? value : formatCurrencyDisplay(value))}
      parse={(display) => normalizeDecimalInput(display, maxIntDigits, null)}
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
      onKeyDown={(e) => blockNonDecimalInput(e as KeyboardEvent, raw())}
      onValue={(nextRaw) => p.field.setValue(nextRaw)}
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
