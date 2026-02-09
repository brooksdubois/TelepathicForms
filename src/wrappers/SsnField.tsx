import {createMemo, createSignal, type Component} from "solid-js";
import {TextFieldPrimitive} from "../primitives";
import type {FieldHandle, FieldSpec} from "../engine/generators";
import {
  blockNonDigitsAndMaxLen,
  formatSSN,
  normalizeDigits,
} from "../utils/fieldHelpers";
import {fromObservable} from "../utils/fromObservable";

export type SsnFieldProps = {
  spec: FieldSpec;
  field: FieldHandle;
  inline?: boolean;
  fullWidth?: boolean;
};

export const SsnField: Component<SsnFieldProps> = (p) => {
  const disabled = fromObservable(p.field.disabled$, false);
  const errors = fromObservable(p.field.errors$, []);
  const touched = fromObservable(p.field.touched$, false);
  const valid = fromObservable(p.field.valid$, true);
  const rawDigits = fromObservable(p.field.value$, "");
  const [show, setShow] = createSignal(false);

  const displayValue = createMemo(() => formatSSN(rawDigits()));
  const errorText = createMemo(() =>
    disabled() ? "" : touched() ? errors()[0] ?? "" : ""
  );
  const showRequiredDot = createMemo(() => !!p.spec.required && !valid());
  const mask = p.spec.inputMask ?? "___-__-____";
  const maxDigits = p.spec.maxDigits ?? 9;
  const blocker = new RegExp(p.spec.inputBlocker ?? "^\\d{0,9}$");

  return (
    <TextFieldPrimitive
      id={p.spec.id}
      label={p.spec.label}
      type={show() ? "text" : "password"}
      inputMode="numeric"
      value={displayValue()}
      placeholder={p.spec.placeholder ?? mask}
      disabled={disabled()}
      errorText={errorText()}
      helperText={p.spec.helperText}
      requiredDot={showRequiredDot()}
      inline={p.inline}
      fullWidth={p.fullWidth}
      rightSlot={
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          disabled={disabled()}
          style={{
            padding: "8px 10px",
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
      onKeyDown={(e) => blockNonDigitsAndMaxLen(e, rawDigits(), maxDigits)}
      onInput={(nextDisplay) => {
        if (/[^0-9-]/.test(nextDisplay)) return;
        const digits = normalizeDigits(nextDisplay, maxDigits);
        if (!blocker.test(digits)) return;
        p.field.setValue(digits);
      }}
      onBlur={() => p.field.markTouched()}
    />
  );
};
