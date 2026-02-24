import { createMemo, type Component } from "solid-js";
import type { FieldHandle, FieldSpec } from "../engine/generators";
import DateRangePicker from "../primitives/DateRangePicker";
import type { DateRangeValue } from "../primitives/DateRangePicker";
import { fromObservable } from "../utils/fromObservable";

export type DateRangePickerWrapperProps = {
  spec: FieldSpec;
  field: FieldHandle;
  fullWidth?: boolean;
};

export const DateRangePickerWrapper: Component<DateRangePickerWrapperProps> = (p) => {
  const value = fromObservable(p.field.value$, "");
  const disabled = fromObservable(p.field.disabled$, false);
  const errors = fromObservable(p.field.errors$, []);
  const touched = fromObservable(p.field.touched$, false);

  const parsedValue = createMemo<DateRangeValue>(() => {
    const v = value();
    if (!v) return null;

    if (typeof v === 'object' && 'start' in v && 'end' in v) {
      return v.start && v.end ? { start: v.start, end: v.end } : null;
    }

    if (typeof v === 'string') {
      try {
        const parsed = JSON.parse(v);
        if (parsed?.start && parsed?.end) return { start: parsed.start, end: parsed.end };
      } catch { /* not JSON */ }
    }

    return null;
  });

  const errorText = createMemo(() =>
    disabled() ? "" : touched() ? errors()[0] ?? "" : "",
  );

  return (
    <DateRangePicker
      label={p.spec.label}
      value={parsedValue()}
      onChange={(next) =>
        p.field.setValue(next ? JSON.stringify(next) : "")
      }
      required={!!p.spec.required}
      disabled={disabled()}
      readOnly={!!p.spec.readOnly}
      error={!!errorText()}
      helperText={errorText() || p.spec.helperText}
      placeholder={p.spec.placeholder}
      clearable={p.spec.clearable ?? true}
      disablePast={p.spec.disablePast}
      disableFuture={p.spec.disableFuture}
      disableWeekends={p.spec.disableWeekends}
      minDate={p.spec.minDate}
      maxDate={p.spec.maxDate}
      shouldDisableDate={p.spec.shouldDisableDate}
      ringEnabled={p.spec.ringEnabled}
      animateRingOnFocus={p.spec.animateRingOnFocus}
      openOnFocus={p.spec.openOnFocus}
      closeOnSelect={p.spec.closeOnSelect}
      class={p.fullWidth ? "w-full" : undefined}
      onFocus={() => p.field.setFocused(true)}
      onBlur={() => {
        p.field.markTouched();
        p.field.setFocused(false);
      }}
    />
  );
};
