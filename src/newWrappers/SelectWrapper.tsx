import {createMemo, type Component} from "solid-js";
import type {FieldHandle, FieldSpec} from "../engine/generators";
import Select from "../newPrimitives/Select";
import {fromObservable} from "../utils/fromObservable";

export type SelectWrapperProps = {
  spec: FieldSpec;
  field: FieldHandle;
  fullWidth?: boolean;
};

export const SelectWrapper: Component<SelectWrapperProps> = (p) => {
  const value = fromObservable(p.field.value$, "");
  const disabled = fromObservable(p.field.disabled$, false);
  const errors = fromObservable(p.field.errors$, []);
  const touched = fromObservable(p.field.touched$, false);

  const errorText = createMemo(() =>
    disabled() ? "" : touched() ? errors()[0] ?? "" : ""
  );

  const options = createMemo(() =>
    (p.spec.options ?? []).map((opt) => ({
      value: opt.value,
      label: opt.label,
      disabled: opt.disabled,
    }))
  );

  return (
    <Select
      id={p.spec.id}
      label={p.spec.label}
      value={value()}
      options={options()}
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
      onValue={(next) => p.field.setValue(next)}
      onBlur={() => p.field.markTouched()}
      onFocus={() => p.field.setFocused(true)}
    />
  );
};
