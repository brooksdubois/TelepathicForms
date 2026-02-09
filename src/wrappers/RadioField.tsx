import {createMemo, type Component} from "solid-js";
import {RadioGroupFieldPrimitive} from "../primitives";
import type {FieldHandle, FieldSpec} from "../engine/generators";
import {fromObservable} from "../utils/fromObservable";

export type RadioFieldProps = {
  spec: FieldSpec;
  field: FieldHandle;
  inline?: boolean;
  fullWidth?: boolean;
};

export const RadioField: Component<RadioFieldProps> = (p) => {
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
    <RadioGroupFieldPrimitive
      id={p.spec.id}
      name={p.spec.id}
      label={p.spec.label}
      value={value()}
      disabled={disabled()}
      errorText={errorText()}
      helperText={p.spec.helperText}
      options={options}
      inline={p.inline}
      requiredDot={showRequiredDot()}
      fullWidth={p.fullWidth}
      onChange={(next) => {
        p.field.setValue(next);
        p.field.markTouched();
      }}
    />
  );
};
