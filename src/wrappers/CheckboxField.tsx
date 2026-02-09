import {createMemo, type Component} from "solid-js";
import {CheckboxFieldPrimitive} from "../primitives";
import type {FieldHandle, FieldSpec} from "../engine/generators";
import {fromObservable} from "../utils/fromObservable";

export type CheckboxFieldProps = {
  spec: FieldSpec;
  field: FieldHandle;
  inline?: boolean;
  fullWidth?: boolean;
};

export const CheckboxField: Component<CheckboxFieldProps> = (p) => {
  const disabled = fromObservable(p.field.disabled$, false);
  const errors = fromObservable(p.field.errors$, []);
  const touched = fromObservable(p.field.touched$, false);
  const value = fromObservable(p.field.value$, "");

  const errorText = createMemo(() =>
    disabled() ? "" : touched() ? errors()[0] ?? "" : ""
  );
  const checked = createMemo(() => value() === "true");

  return (
    <CheckboxFieldPrimitive
      id={p.spec.id}
      label={p.spec.label}
      checked={checked()}
      disabled={disabled()}
      errorText={errorText()}
      helperText={p.spec.helperText}
      inline={p.inline}
      fullWidth={p.fullWidth}
      onChange={(next) => {
        p.field.setValue(next ? "true" : "");
        p.field.markTouched();
      }}
    />
  );
};
