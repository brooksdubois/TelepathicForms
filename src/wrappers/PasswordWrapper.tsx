import {createMemo, createSignal, type Component} from "solid-js";
import type {FieldHandle, FieldSpec} from "../engine/generators";
import TextField from "../primitives/TextField";
import {fromObservable} from "../utils/fromObservable";

export type PasswordWrapperProps = {
  spec: FieldSpec;
  field: FieldHandle;
  fullWidth?: boolean;
};

export const PasswordWrapper: Component<PasswordWrapperProps> = (p) => {
  const disabled = fromObservable(p.field.disabled$, false);
  const errors = fromObservable(p.field.errors$, []);
  const touched = fromObservable(p.field.touched$, false);
  const value = fromObservable(p.field.value$, "");
  const [show, setShow] = createSignal(false);

  const errorText = createMemo(() =>
    disabled() ? "" : touched() ? errors()[0] ?? "" : ""
  );

  return (
    <TextField
      id={p.spec.id}
      label={p.spec.label}
      value={value()}
      type={show() ? "text" : "password"}
      autoComplete={p.spec.autoComplete}
      minLength={p.spec.minLength}
      maxLength={p.spec.maxLength}
      placeholder={p.spec.placeholder}
      helperText={p.spec.helperText}
      required={!!p.spec.required}
      disabled={disabled()}
      readOnly={!!p.spec.readOnly}
      fullWidth={p.fullWidth}
      size={p.spec.size}
      variant={p.spec.variant}
      startAdornment={p.spec.startAdornment}
      endAdornment={
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          disabled={disabled()}
          style={{
            padding: "6px 9px",
            "border-radius": "8px",
            border: "1px solid rgba(0,0,0,0.25)",
            "background-color": "white",
            "font-size": "12px",
            cursor: "pointer",
            opacity: disabled() ? 0.6 : 1,
          }}
        >
          {show() ? "Hide" : "Show"}
        </button>
      }
      ringEnabled={p.spec.ringEnabled}
      animateRingOnFocus={p.spec.animateRingOnFocus}
      error={!!errorText()}
      errorText={errorText()}
      onValue={(next) => p.field.setValue(next)}
      onBlur={() => p.field.markTouched()}
    />
  );
};
