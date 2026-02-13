import {createMemo, type Component} from "solid-js";
import type {FieldHandle, FieldSpec} from "../engine/generators";
import Checkbox from "../primitives/Checkbox";
import {fromObservable} from "../utils/fromObservable";

export type CheckboxWrapperProps = {
  spec: FieldSpec;
  field: FieldHandle;
  fullWidth?: boolean;
  inline?: boolean;
};

export const CheckboxWrapper: Component<CheckboxWrapperProps> = (p) => {
  const value = fromObservable(p.field.value$, "");
  const disabled = fromObservable(p.field.disabled$, false);
  const errors = fromObservable(p.field.errors$, []);
  const touched = fromObservable(p.field.touched$, false);

  const checked = createMemo(() => value() === "true");
  const errorText = createMemo(() =>
    disabled() ? "" : touched() ? errors()[0] ?? "" : ""
  );

  return (
    <Checkbox
      id={p.spec.id}
      label={p.spec.label}
      checked={checked()}
      indeterminate={p.spec.indeterminate}
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
      onChecked={(next) => {
        p.field.setValue(next ? "true" : "");
        p.field.markTouched();
      }}
    />
  );
};
