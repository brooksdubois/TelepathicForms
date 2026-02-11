import {
  Show,
  createEffect,
  createSignal,
  createUniqueId,
  mergeProps,
  onCleanup,
  splitProps,
} from 'solid-js';
import type { JSX } from 'solid-js';

import { cx } from '../utils/cx';
import { useLaserRing } from '../utils/useLaserRing';

export type TextAreaSize = 'sm' | 'md' | 'lg';
export type TextAreaVariant = 'outlined' | 'filled' | 'standard';

type NativeTextareaProps = Omit<
  JSX.TextareaHTMLAttributes<HTMLTextAreaElement>,
  'size' | 'value' | 'onInput' | 'onChange' | 'rows'
>;

export type TextAreaProps = NativeTextareaProps & {
  class?: string;
  label?: string;
  helperText?: string;
  error?: boolean;
  errorText?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  fullWidth?: boolean;
  size?: TextAreaSize;
  variant?: TextAreaVariant;
  startAdornment?: JSX.Element;
  endAdornment?: JSX.Element;

  value?: string;
  onValue?: (value: string) => void;

  autoComplete?: string;
  placeholder?: string;
  minLength?: number;
  maxLength?: number;
  rows?: number;

  autosize?: boolean;
  minRows?: number;
  maxRows?: number;

  ringEnabled?: boolean;
  animateRingOnFocus?: boolean;
  onRingApi?: (api: {
    pulse: () => void;
    focus: () => void;
    pulseAndFocus: () => void;
  }) => void;

  inputRef?: (el: HTMLTextAreaElement) => void;

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
  TextAreaSize,
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

const variantStyles: Record<TextAreaVariant, string> = {
  outlined:
    'rounded-xl border bg-white/90 shadow-sm backdrop-blur-sm dark:bg-slate-900/60',
  filled:
    'rounded-xl border border-transparent bg-slate-100/90 shadow-inner shadow-slate-200/60 dark:bg-slate-800/60 dark:shadow-slate-900/60',
  standard: 'border-b bg-transparent',
};

const baseInputClass =
  'min-w-0 w-full flex-1 bg-transparent text-slate-900 outline-none placeholder:text-slate-400/90 dark:text-slate-100 dark:placeholder:text-slate-500';

const callHandler = <T, E extends Event>(
  handler: JSX.EventHandlerUnion<T, E> | undefined,
  event: E,
) => {
  if (!handler) return;
  const handlers = Array.isArray(handler) ? handler : [handler];
  handlers.forEach((item) => item && item(event));
};

const parseNumber = (value: string | null | undefined, fallback: number) => {
  const parsed = Number.parseFloat(value ?? '');
  return Number.isFinite(parsed) ? parsed : fallback;
};

const clampRows = (value: number | undefined, fallback: number) => {
  if (value === undefined) return fallback;
  if (!Number.isFinite(value)) return fallback;
  return Math.max(1, Math.floor(value));
};

const TextArea = (props: TextAreaProps) => {
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
    'onValue',
    'rows',
    'autosize',
    'minRows',
    'maxRows',
    'inputRef',
    'renderLabel',
    'renderHelper',
    'rootClass',
    'labelClass',
    'inputClass',
    'helperClass',
    'id',
    'name',
    'placeholder',
    'autoComplete',
    'minLength',
    'maxLength',
    'onInput',
    'onChange',
    'onKeyDown',
    'onBlur',
    'onFocus',
    'ringEnabled',
    'animateRingOnFocus',
    'onRingApi',
  ]);

  let textAreaEl: HTMLTextAreaElement | undefined;

  const ringEnabled = () => local.ringEnabled ?? true;
  const animateRingOnFocus = () => local.animateRingOnFocus ?? true;
  const {
    ringBox,
    ringPathD,
    ringPulseKey,
    ringActive,
    pulseRing,
    setRingHostEl,
    setRingMeasureEl,
    setRingLaserSegEl,
  } = useLaserRing({
    enabled: ringEnabled,
    radius: () => (variant() === 'standard' ? 2 : 16),
  });

  const required = () => Boolean(local.required);
  const disabled = () => Boolean(local.disabled);
  const readOnly = () => Boolean(local.readOnly);
  const fullWidth = () => Boolean(local.fullWidth);
  const autosize = () => local.autosize ?? true;
  const minRows = () => clampRows(local.minRows, 1);
  const maxRows = () => {
    if (local.maxRows === undefined) return undefined;
    return clampRows(local.maxRows, minRows());
  };

  createEffect(() => {
    const focus = () => textAreaEl?.focus();
    const pulse = () => pulseRing();
    const pulseAndFocus = () => {
      focus();
      pulse();
    };

    local.onRingApi?.({ pulse, focus, pulseAndFocus });
  });

  const resizeToContent = () => {
    const el = textAreaEl;
    if (!el) return;

    if (!autosize()) {
      el.style.height = '';
      el.style.overflowY = '';
      return;
    }

    const style = window.getComputedStyle(el);
    const lineHeight = parseNumber(
      style.lineHeight,
      parseNumber(style.fontSize, 16) * 1.2,
    );
    const verticalPadding =
      parseNumber(style.paddingTop, 0) + parseNumber(style.paddingBottom, 0);
    const verticalBorder =
      parseNumber(style.borderTopWidth, 0) + parseNumber(style.borderBottomWidth, 0);

    const minHeight = lineHeight * minRows() + verticalPadding + verticalBorder;
    const maxHeight =
      maxRows() !== undefined
        ? lineHeight * (maxRows() as number) + verticalPadding + verticalBorder
        : undefined;

    el.style.height = 'auto';
    const nextHeight = el.scrollHeight;
    const clampedHeight =
      maxHeight === undefined
        ? Math.max(minHeight, nextHeight)
        : Math.max(minHeight, Math.min(nextHeight, maxHeight));

    el.style.height = `${clampedHeight}px`;
    el.style.overflowY =
      maxHeight !== undefined && nextHeight > maxHeight + 0.5 ? 'auto' : 'hidden';
  };

  createEffect(() => {
    autosize();
    minRows();
    maxRows();
    local.value;

    queueMicrotask(() => resizeToContent());
  });

  createEffect(() => {
    const el = textAreaEl;
    if (!el || !autosize() || typeof ResizeObserver !== 'function') return;

    const observer = new ResizeObserver(() => resizeToContent());
    observer.observe(el);
    onCleanup(() => observer.disconnect());
  });

  const size = () => (local.size ?? 'md') as TextAreaSize;
  const variant = () => (local.variant ?? 'outlined') as TextAreaVariant;
  const errorActive = () => Boolean(local.error);

  const helperContent = () => {
    if (errorActive()) {
      return local.errorText ?? local.helperText;
    }
    return local.helperText;
  };

  const hasHelper = () => Boolean(local.renderHelper) || Boolean(helperContent());

  const autoId = createUniqueId();
  const inputId = () => local.id ?? `ta-${autoId}`;
  const helperId = () => `${inputId()}-helper`;

  const describedBy = () => {
    const ids: string[] = [];
    const fromProps = inputProps['aria-describedby'];

    if (fromProps) ids.push(String(fromProps));
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
      'tf-input-container relative flex w-full items-start gap-2 transition duration-150',
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
      autosize() ? 'resize-none overflow-hidden' : 'resize-y',
      local.inputClass,
    );

  const helperClass = () => cx('text-xs', helperToneClass(), local.helperClass);

  const handleInput: JSX.EventHandlerUnion<HTMLTextAreaElement, InputEvent> = (
    event,
  ) => {
    const el = event.currentTarget;
    local.onValue?.(el.value);
    callHandler(local.onInput, event);

    if (autosize()) {
      queueMicrotask(() => resizeToContent());
    }
  };

  const handleBlur: JSX.EventHandlerUnion<HTMLTextAreaElement, FocusEvent> = (
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
          >
            <svg
              class="tf-focus-laser-ring-svg"
              viewBox={`0 0 ${ringBox().w} ${ringBox().h}`}
              preserveAspectRatio="none"
            >
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
              'self-start pt-0.5 text-slate-500 dark:text-slate-400',
              sizeStyles[size()].adornment,
            )}
          >
            {local.startAdornment}
          </span>
        </Show>

        <textarea
          id={inputId()}
          ref={(el) => {
            textAreaEl = el;
            local.inputRef?.(el);
          }}
          name={local.name}
          placeholder={local.placeholder}
          autoComplete={local.autoComplete}
          minLength={local.minLength}
          maxLength={local.maxLength}
          rows={autosize() ? minRows() : local.rows}
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
          value={local.value ?? ''}
          {...inputProps}
        />

        <Show when={local.endAdornment}>
          <span
            class={cx(
              'self-start pt-0.5 text-slate-500 dark:text-slate-400',
              sizeStyles[size()].adornment,
            )}
          >
            {local.endAdornment}
          </span>
        </Show>
      </div>

      <Show when={hasHelper()}>
        <div id={helperId()} class={helperClass()}>
          {local.renderHelper
            ? local.renderHelper({
                helperText: helperContent(),
                error: errorActive(),
                id: helperId(),
              })
            : helperContent()}
        </div>
      </Show>
    </div>
  );
};

export default TextArea;
