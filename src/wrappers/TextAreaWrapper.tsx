import {createMemo, type Component} from "solid-js";
import type {FieldHandle, FieldSpec} from "../engine/generators";
import TextArea from "../primitives/TextArea";
import {fromObservable} from "../utils/fromObservable";

export type TextAreaWrapperProps = {
  spec: FieldSpec;
  field: FieldHandle;
  fullWidth?: boolean;
};

export const TextAreaWrapper: Component<TextAreaWrapperProps> = (p) => {
  const value = fromObservable(p.field.value$, "");
  const disabled = fromObservable(p.field.disabled$, false);
  const errors = fromObservable(p.field.errors$, []);
  const touched = fromObservable(p.field.touched$, false);

  const errorText = createMemo(() =>
    disabled() ? "" : touched() ? errors()[0] ?? "" : ""
  );

  return (
    <TextArea
      id={p.spec.id}
      label={p.spec.label}
      value={value()}
      placeholder={p.spec.placeholder}
      helperText={p.spec.helperText}
      autoComplete={p.spec.autoComplete}
      minLength={p.spec.minLength}
      maxLength={p.spec.maxLength}
      required={!!p.spec.required}
      disabled={disabled()}
      readOnly={!!p.spec.readOnly}
      fullWidth={p.fullWidth}
      size={p.spec.size}
      variant={p.spec.variant}
      startAdornment={p.spec.startAdornment}
      endAdornment={p.spec.endAdornment}
      rows={p.spec.rows}
      resize={p.spec.resize}
      autosize={p.spec.autosize}
      minRows={p.spec.minRows}
      maxRows={p.spec.maxRows}
      minHeight={p.spec.minHeight}
      maxHeight={p.spec.maxHeight}
      showCount={p.spec.showCount}
      ringEnabled={p.spec.ringEnabled}
      animateRingOnFocus={p.spec.animateRingOnFocus}
      ringVariant={p.spec.ringVariant}
      error={!!errorText()}
      errorText={errorText()}
      onValue={(next) => p.field.setValue(next)}
      onFocus={() => p.field.setFocused(true)}
      onBlur={() => {
        p.field.markTouched();
        p.field.setFocused(false);
      }}
    />
  );
};