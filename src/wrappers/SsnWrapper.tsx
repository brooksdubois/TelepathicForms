import {createMemo, createSignal, type Component} from "solid-js";
import type {FieldHandle, FieldSpec} from "../engine/generators";
import TextField from "../primitives/TextField";
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
          class="inline-flex h-5 min-h-5 shrink-0 items-center rounded-md border border-slate-300 bg-white px-2 text-[11px] leading-none text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:bg-slate-800/80"
          classList={{ "opacity-60": !!disabled(), "cursor-pointer": !disabled(), "cursor-not-allowed": disabled() }}
        >
          {show() ? "Hide" : "Show"}
        </button>
      }
      ringEnabled={p.spec.ringEnabled}
      animateRingOnFocus={p.spec.animateRingOnFocus}
      ringVariant={p.spec.ringVariant}
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
