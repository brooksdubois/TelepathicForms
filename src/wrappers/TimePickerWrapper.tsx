import { createEffect, createMemo, type Component } from "solid-js";
import type { FieldHandle, FieldSpec } from "../engine/generators";

import TimePicker, { normalizeTimeValue } from "../primitives/TimePicker";
import { fromObservable } from "../utils/fromObservable";

export type TimePickerWrapperProps = {
  spec: FieldSpec;
  field: FieldHandle;
  fullWidth?: boolean;
};

export const TimePickerWrapper: Component<TimePickerWrapperProps> = (p) => {
  const value = fromObservable(p.field.value$, "");
  const disabled = fromObservable(p.field.disabled$, false);
  const errors = fromObservable(p.field.errors$, []);
  const touched = fromObservable(p.field.touched$, false);

  createEffect(() => {
    const currentValue = value();
    const normalizedValue = normalizeTimeValue(currentValue, {
      hasSeconds: p.spec.hasSeconds,
    });
    if (normalizedValue === currentValue) return;
    p.field.setValue(normalizedValue);
  });

  const errorText = createMemo(() =>
    disabled() ? "" : touched() ? errors()[0] ?? "" : "",
  );

  return (
    <TimePicker
      id={p.spec.id}
      label={p.spec.label}
      value={value()}
      hour12={!!p.spec.hour12}
      hasSeconds={p.spec.hasSeconds}
      helperText={errorText() || p.spec.helperText}
      required={!!p.spec.required}
      disabled={disabled()}
      readOnly={!!p.spec.readOnly}
      fullWidth={p.fullWidth}
      size={p.spec.size}
      variant={p.spec.variant}
      ringEnabled={p.spec.ringEnabled}
      animateRingOnFocus={p.spec.animateRingOnFocus}
      ringVariant={p.spec.ringVariant}
      error={!!errorText()}
      errorText={errorText()}
      onValue={(next) => p.field.setValue(next)}
      onFocus={() => p.field.setFocused(true)}
      onBlur={() => {
        p.field.markTouched();
        p.field.setFocused(false);
      }}
    />
  );
};
