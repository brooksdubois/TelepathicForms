import {createMemo, type Component} from "solid-js";
import type {FieldHandle, FieldSpec} from "../engine/generators";
import RadioGroup from "../primitives/RadioGroup";
import {fromObservable} from "../utils/fromObservable";

export type RadioGroupWrapperProps = {
  spec: FieldSpec;
  field: FieldHandle;
  fullWidth?: boolean;
  inline?: boolean;
};

export const RadioGroupWrapper: Component<RadioGroupWrapperProps> = (p) => {
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
      helperText: opt.helperText,
    }))
  );

  return (
    <RadioGroup
      id={p.spec.id}
      name={p.spec.id}
      label={p.spec.label}
      value={value()}
      options={options()}
      helperText={p.spec.helperText}
      required={!!p.spec.required}
      disabled={disabled()}
      readOnly={!!p.spec.readOnly}
      fullWidth={p.fullWidth}
      inline={p.inline ?? p.spec.inline}
      size={p.spec.size}
      variant={p.spec.variant}
      ringEnabled={p.spec.ringEnabled}
      animateRingOnFocus={p.spec.animateRingOnFocus}
      ringVariant={p.spec.ringVariant}
      error={!!errorText()}
      errorText={errorText()}
      onValue={(next) => {
        p.field.setValue(next);
        p.field.markTouched();
      }}
    />
  );
};
