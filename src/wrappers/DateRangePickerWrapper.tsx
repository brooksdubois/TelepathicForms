import { Component, createMemo } from 'solid-js';
import DateRangePicker from '../primitives/DateRangePicker';
import type { DateRangeValue, DateRangePickerProps } from '../primitives/DateRangePicker';

export interface DateRangePickerWrapperProps {
  label?: string;
  value?: { start: string; end: string } | string;
  onChange?: (value: { start: string; end: string } | undefined) => void;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  error?: boolean;
  helperText?: string;
  placeholder?: string;
  clearable?: boolean;
  disablePast?: boolean;
  disableFuture?: boolean;
  disableWeekends?: boolean;
  minDate?: string;
  maxDate?: string;
  shouldDisableDate?: (iso: string) => boolean;

  ringEnabled?: boolean;
  animateRingOnFocus?: boolean;
  openOnFocus?: boolean;
  closeOnSelect?: boolean;

  class?: string;
  inputClass?: string;
  popoverClass?: string;
}

export const DateRangePickerWrapper: Component<DateRangePickerWrapperProps> = (props) => {
  // Parse value — supports both object and JSON string from engine
  const parsedValue = createMemo<DateRangeValue>(() => {
    const v = props.value;
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

  const handleChange = (value: DateRangeValue) => {
    if (value) {
      props.onChange?.(value);
    } else {
      props.onChange?.(undefined);
    }
  };

  return (
    <DateRangePicker
      label={props.label}
      value={parsedValue()}
      onChange={handleChange}
      required={props.required}
      disabled={props.disabled}
      readOnly={props.readOnly}
      error={props.error}
      helperText={props.helperText}
      placeholder={props.placeholder}
      clearable={props.clearable ?? true}
      disablePast={props.disablePast}
      disableFuture={props.disableFuture}
      disableWeekends={props.disableWeekends}
      minDate={props.minDate}
      maxDate={props.maxDate}
      shouldDisableDate={props.shouldDisableDate}
      ringEnabled={props.ringEnabled}
      animateRingOnFocus={props.animateRingOnFocus}
      openOnFocus={props.openOnFocus}
      closeOnSelect={props.closeOnSelect}
      class={props.class}
      inputClass={props.inputClass}
      popoverClass={props.popoverClass}
    />
  );
};