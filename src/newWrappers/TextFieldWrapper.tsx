import {createMemo, type Component} from "solid-js";
import type {FieldHandle, FieldSpec} from "../engine/generators";
import TextField from "../newPrimitives/TextField";
import {fromObservable} from "../utils/fromObservable";

export type TextFieldWrapperProps = {
  spec: FieldSpec;
  field: FieldHandle;
  fullWidth?: boolean;
};

export const TextFieldWrapper: Component<TextFieldWrapperProps> = (p) => {
  const value = fromObservable(p.field.value$, "");
  const disabled = fromObservable(p.field.disabled$, false);
  const errors = fromObservable(p.field.errors$, []);
  const touched = fromObservable(p.field.touched$, false);

  const errorText = createMemo(() =>
    disabled() ? "" : touched() ? errors()[0] ?? "" : ""
  );

  return (
    <TextField
      id={p.spec.id}
      label={p.spec.label}
      value={value()}
      type={p.spec.type ?? "text"}
      autoComplete={p.spec.autoComplete}
      minLength={p.spec.minLength}
      maxLength={p.spec.maxLength}
      placeholder={p.spec.placeholder}
      helperText={p.spec.helperText}
      error={!!errorText()}
      errorText={errorText()}
      required={!!p.spec.required}
      disabled={disabled()}
      readOnly={!!p.spec.readOnly}
      fullWidth={p.fullWidth}
      size={p.spec.size}
      variant={p.spec.variant}
      startAdornment={p.spec.startAdornment}
      endAdornment={p.spec.endAdornment}
      inputMask={p.spec.inputMask}
      ringEnabled={p.spec.ringEnabled}
      animateRingOnFocus={p.spec.animateRingOnFocus}
      onValue={(next) => p.field.setValue(next)}
      onFocus={() => p.field.setFocused(true)}
      onBlur={() => {
        p.field.markTouched();
        p.field.setFocused(false);
      }}
    />
  );
};
