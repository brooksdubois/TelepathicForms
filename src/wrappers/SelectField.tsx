import {createMemo, type Component} from "solid-js";
import {SelectFieldPrimitive} from "../primitives";
import type {FieldHandle, FieldSpec} from "../engine/generators";
import {fromObservable} from "../utils/fromObservable";

export type SelectFieldProps = {
  spec: FieldSpec;
  field: FieldHandle;
  fullWidth?: boolean;
};

export const SelectField: Component<SelectFieldProps> = (p) => {
  const disabled = fromObservable(p.field.disabled$, false);
  const errors = fromObservable(p.field.errors$, []);
  const touched = fromObservable(p.field.touched$, false);
  const valid = fromObservable(p.field.valid$, true);
  const value = fromObservable(p.field.value$, "");

  const errorText = createMemo(() =>
    disabled() ? "" : touched() ? errors()[0] ?? "" : ""
  );
  const showRequiredDot = createMemo(() => !!p.spec.required && !valid());
  const options = p.spec.options ?? [];

  return (
    <SelectFieldPrimitive
      id={p.spec.id}
      label={p.spec.label}
      value={value()}
      placeholder={p.spec.placeholder}
      disabled={disabled()}
      errorText={errorText()}
      helperText={p.spec.helperText}
      requiredDot={showRequiredDot()}
      options={options}
      fullWidth={p.fullWidth}
      onChange={(next) => p.field.setValue(next)}
      onBlur={() => p.field.markTouched()}
    />
  );
};
