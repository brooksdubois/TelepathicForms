import {createMemo, type Component} from "solid-js";
import {TextAreaFieldPrimitive} from "../primitives";
import type {FieldHandle, FieldSpec} from "../engine/generators";
import {fromObservable} from "../utils/fromObservable";

export type TextAreaFieldProps = {
  spec: FieldSpec;
  field: FieldHandle;
  fullWidth?: boolean;
};

export const TextAreaField: Component<TextAreaFieldProps> = (p) => {
  const disabled = fromObservable(p.field.disabled$, false);
  const errors = fromObservable(p.field.errors$, []);
  const touched = fromObservable(p.field.touched$, false);
  const valid = fromObservable(p.field.valid$, true);
  const value = fromObservable(p.field.value$, "");

  const errorText = createMemo(() =>
    disabled() ? "" : touched() ? errors()[0] ?? "" : ""
  );
  const showRequiredDot = createMemo(() => !!p.spec.required && !valid());

  return (
    <TextAreaFieldPrimitive
      id={p.spec.id}
      label={p.spec.label}
      value={value()}
      placeholder={p.spec.placeholder}
      disabled={disabled()}
      errorText={errorText()}
      helperText={p.spec.helperText}
      requiredDot={showRequiredDot()}
      fullWidth={p.fullWidth}
      onInput={(v) => p.field.setValue(v)}
      onBlur={() => p.field.markTouched()}
    />
  );
};
