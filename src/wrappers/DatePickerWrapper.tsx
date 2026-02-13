import {createMemo, type Component} from "solid-js";
import type {FieldHandle, FieldSpec} from "../engine/generators";
import DatePicker from "../primitives/DatePicker";
import {fromObservable} from "../utils/fromObservable";

export type DatePickerWrapperProps = {
  spec: FieldSpec;
  field: FieldHandle;
  fullWidth?: boolean;
};

export const DatePickerWrapper: Component<DatePickerWrapperProps> = (p) => {
  const value = fromObservable(p.field.value$, "");
  const disabled = fromObservable(p.field.disabled$, false);
  const errors = fromObservable(p.field.errors$, []);
  const touched = fromObservable(p.field.touched$, false);

  const errorText = createMemo(() =>
    disabled() ? "" : touched() ? errors()[0] ?? "" : ""
  );

  return (
    <DatePicker
      id={p.spec.id}
      label={p.spec.label}
      value={value() || null}
      placeholder={p.spec.placeholder}
      helperText={errorText() || p.spec.helperText}
      required={!!p.spec.required}
      disabled={disabled()}
      readOnly={!!p.spec.readOnly}
      error={!!errorText()}
      clearable={p.spec.clearable}
      inputMask={p.spec.inputMask}
      minDate={p.spec.minDate}
      maxDate={p.spec.maxDate}
      disablePast={p.spec.disablePast}
      disableFuture={p.spec.disableFuture}
      disableWeekends={p.spec.disableWeekends}
      shouldDisableDate={p.spec.shouldDisableDate}
      locale={p.spec.locale}
      weekStartsOn={p.spec.weekStartsOn}
      openOnFocus={p.spec.openOnFocus}
      closeOnSelect={p.spec.closeOnSelect}
      ringEnabled={p.spec.ringEnabled}
      animateRingOnFocus={p.spec.animateRingOnFocus}
      ringVariant={p.spec.ringVariant}
      class={p.fullWidth ? "w-full" : undefined}
      onChange={(next) => p.field.setValue(next ?? "")}
      onFocus={() => p.field.setFocused(true)}
      onBlur={() => {
        p.field.markTouched();
        p.field.setFocused(false);
      }}
    />
  );
};
