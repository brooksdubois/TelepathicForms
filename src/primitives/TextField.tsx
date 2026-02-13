import {
  Show,
  createEffect,
  createUniqueId,
  mergeProps,
  splitProps,
} from 'solid-js';
import type { JSX } from 'solid-js';

import { cx } from '../utils/cx';
import type { LaserRingVariant } from '../utils/laserRingVariants';
import { useLaserRing } from '../utils/useLaserRing';

export type TextFieldSize = 'sm' | 'md' | 'lg';
export type TextFieldVariant = 'outlined' | 'filled' | 'standard';

export type InputEditContext = {
  /** Display value before this input event (based on current props). */
  prevDisplay: string;
  /** Display value present in the DOM for this input event. */
  nextDisplay: string;
  /** Value emitted to the wrapper (raw if rawValue/parse is used; otherwise nextDisplay). */
  nextValue: string;

  /** Cursor/selection after the browser applies the input event (in nextDisplay coordinates). */
  selectionStart: number;
  selectionEnd: number;
  selectedText: string;

  /** InputEvent details useful for masking logic. */
  inputType?: string;
  data?: string | null;
  isComposing?: boolean;
};

type NativeInputProps = Omit<
  JSX.InputHTMLAttributes<HTMLInputElement>,
  'size' | 'value' | 'onInput' | 'onChange'
>;

export type TextFieldProps = NativeInputProps & {
  class?: string;
  label?: string;
  helperText?: string;
  error?: boolean;
  errorText?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  fullWidth?: boolean;
  size?: TextFieldSize;
  variant?: TextFieldVariant;
  startAdornment?: JSX.Element;
  endAdornment?: JSX.Element;

  /** Display value (primitive is prop-driven). Backward-compatible mode. */
  value?: string;

  /**
   * Optional raw value (masked mode).
   * If provided, the input displays `format(rawValue)` and `onValue(parse(display))` is emitted.
   */
  rawValue?: string;

  /** Optional input mask string (used as a default placeholder if `placeholder` is not set). */
  inputMask?: string;

  /** Enables the focus ring rendering/behavior. Defaults to true. */
  ringEnabled?: boolean;

  /** If true, triggers the ring animation on focus. Defaults to true. */
  animateRingOnFocus?: boolean;
  ringVariant?: LaserRingVariant;

  /** Exposes a small API to manually trigger the ring animation. */
  onRingApi?: (api: {
    pulse: () => void;
    focus: () => void;
    pulseAndFocus: () => void;
  }) => void;

  /** Format raw -> display (masked mode only). Defaults to identity. */
  format?: (raw: string) => string;

  /** Parse display -> raw (masked mode only). Defaults to identity. */
  parse?: (display: string) => string;

  /** Called on input with the next value (wrapper owns state). */
  onValue?: (value: string, ctx?: InputEditContext) => void;

  /**
   * Optional caret/selection strategy.
   * If provided, it is called after `onValue` and the component will apply the returned selection
   * in a microtask (after the wrapper/state update has a chance to re-render).
   */
  deriveSelection?: (ctx: InputEditContext) => { start: number; end: number } | null | undefined;

  /** Exposes the underlying input element to wrappers for advanced masking logic. */
  inputRef?: (el: HTMLInputElement) => void;

  renderLabel?: (props: {
    label?: string;
    required?: boolean;
    disabled?: boolean;
    htmlFor?: string;
  }) => JSX.Element;

  renderHelper?: (props: {
    helperText?: string;
    error?: boolean;
    id?: string;
  }) => JSX.Element;

  rootClass?: string;
  labelClass?: string;
  inputClass?: string;
  helperClass?: string;
};

const sizeStyles: Record<
  TextFieldSize,
  { container: string; input: string; adornment: string; standard: string }
> = {
  sm: {
    container: 'px-3 py-2',
    input: 'text-sm',
    adornment: 'text-xs',
    standard: 'px-0 pb-1 pt-2',
  },
  md: {
    container: 'px-3.5 py-2.5',
    input: 'text-sm',
    adornment: 'text-sm',
    standard: 'px-0 pb-1.5 pt-2.5',
  },
  lg: {
    container: 'px-4 py-3',
    input: 'text-base',
    adornment: 'text-sm',
    standard: 'px-0 pb-2 pt-3',
  },
};

const variantStyles: Record<TextFieldVariant, string> = {
  outlined:
    'rounded-xl border bg-white/90 shadow-sm backdrop-blur-sm dark:bg-slate-900/60',
  filled:
    'rounded-xl border border-transparent bg-slate-100/90 shadow-inner shadow-slate-200/60 dark:bg-slate-800/60 dark:shadow-slate-900/60',
  standard: 'border-b bg-transparent',
};

const baseInputClass =
  'min-w-0 flex-1 bg-transparent text-slate-900 outline-none placeholder:text-slate-400/90 dark:text-slate-100 dark:placeholder:text-slate-500';

const callHandler = <T, E extends Event>(
  handler: JSX.EventHandlerUnion<T, E> | undefined,
  event: E,
) => {
  if (!handler) return;
  const handlers = Array.isArray(handler) ? handler : [handler];
  handlers.forEach((item) => item && item(event));
};

const TextField = (props: TextFieldProps) => {
  const merged = mergeProps(props);

  const [local, inputProps] = splitProps(merged, [
    'class',
    'label',
    'helperText',
    'error',
    'errorText',
    'required',
    'disabled',
    'readOnly',
    'fullWidth',
    'size',
    'variant',
    'startAdornment',
    'endAdornment',
    'value',
    'rawValue',
    'inputMask',
    'format',
    'parse',
    'onValue',
    'deriveSelection',
    'inputRef',
    'renderLabel',
    'renderHelper',
    'rootClass',
    'labelClass',
    'inputClass',
    'helperClass',
    'id',
    'name',
    'type',
    'placeholder',
    'autoComplete',
    'minLength',
    'maxLength',
    'onInput',
    'onChange',
    'onKeyDown',
    'onBlur',
    'ringEnabled',
    'animateRingOnFocus',
    'ringVariant',
    'onRingApi',
    'onFocus',
  ]);

  let inputEl: HTMLInputElement | undefined;

  const ringEnabled = () => local.ringEnabled ?? true;
  const animateRingOnFocus = () => local.animateRingOnFocus ?? true;
  const {
    ringBox,
    ringPathD,
    ringPulseKey,
    ringActive,
    ringFadeAnimation,
    pulseRing,
    setRingHostEl,
    setRingMeasureEl,
    setRingLaserSegEl,
  } = useLaserRing({
    enabled: ringEnabled,
    radius: () => (variant() === 'standard' ? 2 : 16),
    variant: () => local.ringVariant,
  });

  createEffect(() => {
    const focusInput = () => inputEl?.focus();
    const pulseAndFocus = () => {
      focusInput();
      pulseRing();
    };

    local.onRingApi?.({ pulse: pulseRing, focus: focusInput, pulseAndFocus });
  });

  const required = () => Boolean(local.required);
  const disabled = () => Boolean(local.disabled);
  const readOnly = () => Boolean(local.readOnly);
  const fullWidth = () => Boolean(local.fullWidth);

  const hasRaw = () => local.rawValue !== undefined;
  const format = () => local.format ?? ((x: string) => x);
  const parse = () => local.parse ?? ((x: string) => x);

  const displayValue = () =>
    hasRaw() ? format()(local.rawValue ?? '') : (local.value ?? '');

  const placeholder = () => local.placeholder ?? local.inputMask;

  const size = () => (local.size ?? 'md') as TextFieldSize;
  const variant = () => (local.variant ?? 'outlined') as TextFieldVariant;

  const errorActive = () => Boolean(local.error);

  const helperContent = () => {
    if (local.error) {
      return local.errorText ?? local.helperText;
    }
    return local.helperText;
  };

  const hasHelper = () => Boolean(local.renderHelper) || Boolean(helperContent());

  const autoId = createUniqueId();
  const inputId = () => local.id ?? `tf-${autoId}`;
  const helperId = () => `${inputId()}-helper`;

  const describedBy = () => {
    const ids: string[] = [];
    const fromProps = inputProps['aria-describedby'];

    if (fromProps) ids.push(fromProps);
    if (hasHelper()) ids.push(helperId());

    return ids.length > 0 ? ids.join(' ') : undefined;
  };

  const ariaInvalid = () => (errorActive() ? 'true' : inputProps['aria-invalid']);

  const containerClass = () => {
    const sizeClass =
      variant() === 'standard'
        ? sizeStyles[size()].standard
        : sizeStyles[size()].container;

    const toneClasses = errorActive()
      ? 'border-rose-500/80 focus-within:border-rose-500 dark:border-rose-500/70'
      : 'border-slate-300/80 focus-within:border-emerald-400 dark:border-slate-700 dark:focus-within:border-emerald-400';

    return cx(
      'tf-input-container relative flex w-full items-center gap-2 transition duration-150',
      variantStyles[variant()],
      sizeClass,
      toneClasses,
      variant() === 'standard' ? 'rounded-none' : 'rounded-xl',
      disabled() ? 'cursor-not-allowed opacity-60' : 'cursor-text',
      readOnly() && !disabled() ? 'bg-slate-50/80 dark:bg-slate-900/40' : '',
    );
  };

  const helperToneClass = () => {
    if (errorActive()) return 'text-rose-600 dark:text-rose-300';
    return 'text-slate-500 dark:text-slate-400';
  };

  const inputClass = () =>
    cx(
      baseInputClass,
      sizeStyles[size()].input,
      disabled() ? 'cursor-not-allowed' : 'cursor-text',
      local.inputClass,
    );

  const helperClass = () => cx('text-xs', helperToneClass(), local.helperClass);

  const handleInput: JSX.EventHandlerUnion<HTMLInputElement, InputEvent> = (
    event,
  ) => {
    const el = event.currentTarget;
    const prev = displayValue();
    const nextDisplay = el.value;

    const nextValue = hasRaw() ? parse()(nextDisplay) : nextDisplay;

    const start = el.selectionStart ?? nextDisplay.length;
    const end = el.selectionEnd ?? nextDisplay.length;

    const ctx: InputEditContext = {
      prevDisplay: prev,
      nextDisplay,
      nextValue,
      selectionStart: start,
      selectionEnd: end,
      selectedText: nextDisplay.slice(start, end),
      inputType: (event as any).inputType,
      data: (event as any).data,
      isComposing: (event as any).isComposing,
    };

    local.onValue?.(nextValue, ctx);
    callHandler(local.onInput, event);

    const derive = local.deriveSelection;
    if (derive) {
      queueMicrotask(() => {
        const sel = derive(ctx);
        const node = inputEl;
        if (!sel || !node) return;
        const s = Math.max(0, Math.min(sel.start, node.value.length));
        const e = Math.max(0, Math.min(sel.end, node.value.length));
        try {
          node.setSelectionRange(s, e);
        } catch {
          // no-op (e.g., unsupported input types)
        }
      });
    }
  };

  const handleBlur: JSX.EventHandlerUnion<HTMLInputElement, FocusEvent> = (
    event,
  ) => {
    callHandler(local.onBlur, event);
  };

  return (
    <div
      class={cx(
        'relative flex flex-col gap-1.5',
        fullWidth() ? 'w-full' : 'inline-flex',
        local.class,
        local.rootClass,
      )}
    >
      {local.renderLabel
        ? local.renderLabel({
            label: local.label,
            required: required(),
            disabled: disabled(),
            htmlFor: inputId(),
          })
        : local.label && (
            <label
              for={inputId()}
              class={cx(
                'text-sm font-medium text-slate-700 dark:text-slate-200',
                disabled() ? 'opacity-60' : '',
                local.labelClass,
              )}
            >
              <span>{local.label}</span>
              <Show when={required()}>
                <span class="text-rose-500"> *</span>
              </Show>
            </label>
          )}

      <div class={containerClass()}>
        <Show when={ringEnabled()}>
          <span
            ref={setRingHostEl}
            aria-hidden="true"
            class={cx(
              'tf-focus-laser-ring',
              errorActive()
                ? 'text-rose-500 dark:text-rose-400'
                : 'text-emerald-500 dark:text-emerald-400',
            )}
            style={ringActive() ? { animation: ringFadeAnimation() } : undefined}
          >
            <svg
              class="tf-focus-laser-ring-svg"
              viewBox={`0 0 ${ringBox().w} ${ringBox().h}`}
              preserveAspectRatio="none"
            >
              {/* Outline and laser segment mounted only during the pulse window */}
              <Show when={ringActive()}>
                {() => (
                  <>
                    <path
                      class="tf-focus-laser-ring-outline"
                      data-pulse={ringPulseKey()}
                      d={ringPathD()}
                      fill="none"
                      vector-effect="non-scaling-stroke"
                      opacity="0.02"
                    />

                    <path
                      ref={setRingMeasureEl}
                      d={ringPathD()}
                      fill="none"
                      stroke="none"
                    />

                    <path
                      ref={setRingLaserSegEl}
                      class="tf-focus-laser-ring-segment"
                      data-pulse={ringPulseKey()}
                      d=""
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2.25"
                      stroke-linecap="round"
                      vector-effect="non-scaling-stroke"
                    />
                  </>
                )}
              </Show>
            </svg>
          </span>
        </Show>

        <Show when={local.startAdornment}>
          <span
            class={cx(
              'text-slate-500 dark:text-slate-400',
              sizeStyles[size()].adornment,
            )}
          >
            {local.startAdornment}
          </span>
        </Show>

        <input
          id={inputId()}
          ref={(el) => {
            inputEl = el;
            local.inputRef?.(el);
          }}
          name={local.name}
          type={local.type ?? 'text'}
          placeholder={placeholder()}
          autoComplete={local.autoComplete}
          minLength={local.minLength}
          maxLength={local.maxLength}
          class={inputClass()}
          required={required()}
          disabled={disabled()}
          readOnly={readOnly()}
          aria-invalid={ariaInvalid()}
          aria-describedby={describedBy()}
          onInput={handleInput}
          onChange={local.onChange}
          onKeyDown={local.onKeyDown}
          onBlur={handleBlur}
          onFocus={(event) => {
            if (animateRingOnFocus()) pulseRing();
            callHandler(local.onFocus, event);
          }}
          value={displayValue()}
          {...inputProps}
        />

        <Show when={local.endAdornment}>
          <span
            class={cx(
              'text-slate-500 dark:text-slate-400',
              sizeStyles[size()].adornment,
            )}
          >
            {local.endAdornment}
          </span>
        </Show>
      </div>

      <Show when={hasHelper()}>
        <div id={helperId()} class={helperClass()}>
          {local.renderHelper ? (
            local.renderHelper({
              helperText: helperContent(),
              error: errorActive(),
              id: helperId(),
            })
          ) : (
            <span>{helperContent()}</span>
          )}
        </div>
      </Show>
    </div>
  );
};

export default TextField;
