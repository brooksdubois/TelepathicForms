import {createMemo, createSignal, type Component} from "solid-js";
import {TextFieldPrimitive} from "../primitives";
import type {FieldHandle, FieldSpec} from "../engine/generators";
import {
  blockNonDecimalInput,
  formatPercentDisplay,
  normalizeDecimalInput,
} from "../utils/fieldHelpers";
import {fromObservable} from "../utils/fromObservable";

export type PercentFieldProps = {
  spec: FieldSpec;
  field: FieldHandle;
  inline?: boolean;
  fullWidth?: boolean;
};

export const PercentField: Component<PercentFieldProps> = (p) => {
  const disabled = fromObservable(p.field.disabled$, false);
  const errors = fromObservable(p.field.errors$, []);
  const touched = fromObservable(p.field.touched$, false);
  const valid = fromObservable(p.field.valid$, true);
  const raw = fromObservable(p.field.value$, "");

  const [isEditing, setIsEditing] = createSignal(false);

  const errorText = createMemo(() =>
    disabled() ? "" : touched() ? errors()[0] ?? "" : ""
  );
  const showRequiredDot = createMemo(() => !!p.spec.required && !valid());
  const editValue = createMemo(() => raw());
  const displayValue = createMemo(() => formatPercentDisplay(raw()));
  const maxIntDigits = p.spec.maxDigits ?? 1000;

  return (
    <TextFieldPrimitive
      id={p.spec.id}
      label={p.spec.label}
      inputMode="decimal"
      value={isEditing() ? editValue() : displayValue()}
      placeholder={p.spec.placeholder}
      disabled={disabled()}
      errorText={errorText()}
      helperText={p.spec.helperText}
      requiredDot={showRequiredDot()}
      inline={p.inline}
      fullWidth={p.fullWidth}
      onKeyDown={(e) => blockNonDecimalInput(e, raw())}
      onInput={(nextDisplay) => {
        const normalized = normalizeDecimalInput(nextDisplay, maxIntDigits, null);
        p.field.setValue(normalized);
      }}
      onFocus={() => {
        setIsEditing(true);
        p.field.setFocused(true);
      }}
      onBlur={() => {
        setIsEditing(false);
        p.field.markTouched();
        p.field.setFocused(false);
      }}
    />
  );
};
