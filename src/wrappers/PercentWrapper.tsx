import {createMemo, createSignal, type Component} from "solid-js";
import type {FieldHandle, FieldSpec} from "../engine/generators";
import TextField from "../primitives/TextField";
import {
  blockNonDecimalInput,
  formatPercentDisplay,
  normalizeDecimalInput,
} from "../utils/fieldHelpers";
import {fromObservable} from "../utils/fromObservable";

export type PercentWrapperProps = {
  spec: FieldSpec;
  field: FieldHandle;
  fullWidth?: boolean;
};

export const PercentWrapper: Component<PercentWrapperProps> = (p) => {
  const disabled = fromObservable(p.field.disabled$, false);
  const errors = fromObservable(p.field.errors$, []);
  const touched = fromObservable(p.field.touched$, false);
  const raw = fromObservable(p.field.value$, "");
  const [isEditing, setIsEditing] = createSignal(false);

  const errorText = createMemo(() =>
    disabled() ? "" : touched() ? errors()[0] ?? "" : ""
  );
  const maxIntDigits = p.spec.maxDigits ?? 1000;

  return (
    <TextField
      id={p.spec.id}
      label={p.spec.label}
      rawValue={raw()}
      format={(value) => (isEditing() ? value : formatPercentDisplay(value))}
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
        p.field.setFocused(false);
      }}
    />
  );
};
