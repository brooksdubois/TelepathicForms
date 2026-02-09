import {createMemo, createSignal, type Component} from "solid-js";
import type {FieldHandle, FieldSpec} from "../engine/generators";
import TextField from "../newPrimitives/TextField";
import {
  blockNonDigitsAndMaxLen,
  formatSSN,
  normalizeDigits,
} from "../utils/fieldHelpers";
import {fromObservable} from "../utils/fromObservable";

export type SsnWrapperProps = {
  spec: FieldSpec;
  field: FieldHandle;
  fullWidth?: boolean;
};

export const SsnWrapper: Component<SsnWrapperProps> = (p) => {
  const disabled = fromObservable(p.field.disabled$, false);
  const errors = fromObservable(p.field.errors$, []);
  const touched = fromObservable(p.field.touched$, false);
  const rawDigits = fromObservable(p.field.value$, "");
  const [show, setShow] = createSignal(false);

  const errorText = createMemo(() =>
    disabled() ? "" : touched() ? errors()[0] ?? "" : ""
  );
  const maxDigits = p.spec.maxDigits ?? 9;
  const blocker = new RegExp(p.spec.inputBlocker ?? "^\\d{0,9}$");

  return (
    <TextField
      id={p.spec.id}
      label={p.spec.label}
      type={show() ? "text" : "password"}
      rawValue={rawDigits()}
      format={formatSSN}
      parse={(display) => normalizeDigits(display, maxDigits)}
      inputMask={p.spec.inputMask ?? "___-__-____"}
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
      onKeyDown={(e) => blockNonDigitsAndMaxLen(e as KeyboardEvent, rawDigits(), maxDigits)}
      onValue={(nextRaw) => {
        const digits = normalizeDigits(nextRaw, maxDigits);
        if (!blocker.test(digits)) return;
        p.field.setValue(digits);
      }}
      onBlur={() => p.field.markTouched()}
    />
  );
};
