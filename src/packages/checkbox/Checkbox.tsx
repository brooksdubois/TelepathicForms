import {
  Show,
  createEffect,
  createUniqueId,
  mergeProps,
  splitProps,
} from 'solid-js';
import type { JSX } from 'solid-js';
import './styles/index.css';

import { cx } from './internal/cx';
import type { LaserRingVariant } from './internal/laserRingVariants';
import { useRingAnimation } from './internal/useRingAnimation';

export type CheckboxSize = 'sm' | 'md' | 'lg';
export type CheckboxVariant = 'outlined' | 'filled' | 'standard';

export type CheckboxProps = Omit<
  JSX.InputHTMLAttributes<HTMLInputElement>,
  'size' | 'type' | 'checked' | 'onChange' | 'onInput'
> & {
  class?: string;
  label?: string;
  helperText?: string;
  error?: boolean;
  errorText?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  fullWidth?: boolean;
  inline?: boolean;
  size?: CheckboxSize;
  variant?: CheckboxVariant;

  checked?: boolean;
  indeterminate?: boolean;
  ringEnabled?: boolean;
  animateRingOnFocus?: boolean;
  ringVariant?: LaserRingVariant;
  onRingApi?: (api: {
    pulse: () => void;
    focus: () => void;
    pulseAndFocus: () => void;
  }) => void;

  onChecked?: (checked: boolean, ctx?: { indeterminate?: boolean; event?: Event }) => void;

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

  inputRef?: (el: HTMLInputElement) => void;
};

const sizeStyles: Record<
  CheckboxSize,
  {
    box: string;
    glyph: string;
    label: string;
    helper: string;
    gap: string;
    helperOffset: string;
  }
> = {
  sm: {
    box: 'h-[18px] w-[18px] rounded-[5px]',
    glyph: 'text-[11px]',
    label: 'text-sm',
    helper: 'text-xs',
    gap: 'gap-2',
    helperOffset: 'pl-6',
  },
  md: {
    box: 'h-[19px] w-[19px] rounded-[6px]',
    glyph: 'text-[12px]',
    label: 'text-sm',
    helper: 'text-xs',
    gap: 'gap-2.5',
    helperOffset: 'pl-7',
  },
  lg: {
    box: 'h-5 w-5 rounded-[7px]',
    glyph: 'text-[13px]',
    label: 'text-base',
    helper: 'text-sm',
    gap: 'gap-3',
    helperOffset: 'pl-8',
  },
};

const variantStyles: Record<CheckboxVariant, string> = {
  outlined: 'bg-white/90 shadow-sm dark:bg-slate-900/60',
  filled:
    'bg-slate-100/90 shadow-inner shadow-slate-200/60 dark:bg-slate-800/60 dark:shadow-slate-900/60',
  standard: 'bg-transparent',
};

const callHandler = <T, E extends Event>(
  handler: JSX.EventHandlerUnion<T, E> | undefined,
  event: E,
) => {
  if (!handler) return;
  const handlers = Array.isArray(handler) ? handler : [handler];
  handlers.forEach((item) => item && item(event));
};

const Checkbox = (props: CheckboxProps) => {
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
    'inline',
    'size',
    'variant',
    'checked',
    'indeterminate',
    'onChecked',
    'renderLabel',
    'renderHelper',
    'rootClass',
    'labelClass',
    'inputClass',
    'helperClass',
    'inputRef',
    'id',
    'name',
    'value',
    'onInput',
    'onChange',
    'onBlur',
    'onKeyDown',
    'onFocus',
    'ringEnabled',
    'animateRingOnFocus',
    'ringVariant',
    'onRingApi',
  ]);

  let inputEl: HTMLInputElement | undefined;
  let prevChecked: boolean | undefined;

  const required = () => Boolean(local.required);
  const disabled = () => Boolean(local.disabled);
  const readOnly = () => Boolean(local.readOnly);
  const fullWidth = () => Boolean(local.fullWidth);
  const inline = () => Boolean(local.inline);
  const ringEnabled = () => local.ringEnabled ?? true;
  const animateRingOnFocus = () => local.animateRingOnFocus ?? true;

  const size = () => (local.size ?? 'md') as CheckboxSize;
  const variant = () => (local.variant ?? 'outlined') as CheckboxVariant;
  const checked = () => Boolean(local.checked);
  const indeterminate = () => Boolean(local.indeterminate);
  const errorActive = () => Boolean(local.error);
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
  } = useRingAnimation({
    enabled: ringEnabled,
    radius: () => 8,
    variant: () => local.ringVariant,
  });

  const helperContent = () => {
    if (errorActive()) {
      return local.errorText ?? local.helperText;
    }
    return local.helperText;
  };

  const hasHelper = () => Boolean(local.renderHelper) || Boolean(helperContent());

  const autoId = createUniqueId();
  const inputId = () => local.id ?? `checkbox-${autoId}`;
  const helperId = () => `${inputId()}-helper`;

  const describedBy = () => {
    const ids: string[] = [];
    const fromProps = inputProps['aria-describedby'];

    if (fromProps) ids.push(fromProps);
    if (hasHelper()) ids.push(helperId());

    return ids.length > 0 ? ids.join(' ') : undefined;
  };

  const ariaInvalid = () => (errorActive() ? 'true' : inputProps['aria-invalid']);

  const labelToneClass = () =>
    cx(
      'leading-snug text-slate-700 dark:text-slate-200',
      disabled() ? 'opacity-60' : '',
      readOnly() && !disabled() ? 'opacity-90' : '',
      local.labelClass,
    );

  const helperToneClass = () => {
    if (errorActive()) return 'text-rose-600 dark:text-rose-300';
    return 'text-slate-500 dark:text-slate-400';
  };

  const helperClass = () =>
    cx(sizeStyles[size()].helper, helperToneClass(), 'leading-snug', local.helperClass);

  const boxClass = () => {
    const tone = errorActive()
      ? 'border-rose-500/90 peer-focus:ring-rose-500/40 peer-focus:ring-offset-rose-50 dark:peer-focus:ring-rose-500/50 dark:peer-focus:ring-offset-slate-950'
      : 'border-slate-300/90 peer-focus:ring-emerald-500/35 peer-focus:ring-offset-white dark:border-slate-700 dark:peer-focus:ring-emerald-400/45 dark:peer-focus:ring-offset-slate-950';

    const stateTone = checked() || indeterminate()
      ? errorActive()
        ? 'bg-white text-slate-950 border-rose-500 dark:bg-white dark:text-slate-950 dark:border-rose-400'
        : 'bg-white text-slate-950 border-slate-800/80 dark:bg-white dark:text-slate-950 dark:border-slate-200'
      : 'text-transparent';

    return cx(
      'relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden border transition duration-150 peer-focus:ring-2 peer-focus:ring-offset-1',
      sizeStyles[size()].box,
      variantStyles[variant()],
      tone,
      stateTone,
      disabled() ? 'opacity-60' : '',
      readOnly() && !disabled() ? 'opacity-90' : '',
      local.inputClass,
    );
  };

  const rootClass = () =>
    cx(
      inline() ? 'flex items-center gap-3' : 'flex flex-col gap-1.5',
      fullWidth() ? 'w-full' : 'inline-flex',
      local.class,
      local.rootClass,
    );

  const controlRowClass = () =>
    cx(
      'min-w-0',
      inline() ? 'flex min-w-0 flex-1 items-center gap-3' : 'flex items-start',
      sizeStyles[size()].gap,
    );

  const hasLabel = () => Boolean(local.renderLabel) || Boolean(local.label);

  createEffect(() => {
    const focus = () => inputEl?.focus();
    const pulse = () => pulseRing();
    const pulseAndFocus = () => {
      focus();
      pulse();
    };
    local.onRingApi?.({ pulse, focus, pulseAndFocus });
  });

  const labelContent = () => {
    if (local.renderLabel) {
      return local.renderLabel({
        label: local.label,
        required: required(),
        disabled: disabled(),
        htmlFor: inputId(),
      });
    }

    if (!local.label) return null;

    return (
      <label
        for={inputId()}
        class={cx('min-w-0 break-words', sizeStyles[size()].label, labelToneClass())}
      >
        <span>{local.label}</span>
        <Show when={required()}>
          <span class="text-rose-500"> *</span>
        </Show>
      </label>
    );
  };

  const handleInput: JSX.EventHandlerUnion<HTMLInputElement, InputEvent> = (
    event,
  ) => {
    callHandler(local.onInput, event);
  };

  const handleChange: JSX.EventHandlerUnion<HTMLInputElement, Event> = (event) => {
    const el = event.currentTarget;

    if (disabled() || readOnly()) {
      event.preventDefault();
      el.checked = checked();
      callHandler(local.onChange, event);
      return;
    }

    const nextChecked = el.checked;
    local.onChecked?.(nextChecked, {
      indeterminate: local.indeterminate,
      event,
    });

    callHandler(local.onChange, event);
  };

  createEffect(() => {
    const nextChecked = checked();

    if (prevChecked === undefined) {
      prevChecked = nextChecked;
      return;
    }

    if (nextChecked && !prevChecked) {
      pulseRing();
    }

    prevChecked = nextChecked;
  });

  createEffect(() => {
    if (!inputEl) return;
    inputEl.indeterminate = indeterminate();
  });

  return (
    <div class={rootClass()}>
      <div class={controlRowClass()}>
        <input
          id={inputId()}
          ref={(el) => {
            inputEl = el;
            el.indeterminate = indeterminate();
            local.inputRef?.(el);
          }}
          type="checkbox"
          name={local.name}
          value={local.value}
          checked={checked()}
          required={required()}
          disabled={disabled()}
          aria-readonly={readOnly() ? 'true' : undefined}
          aria-invalid={ariaInvalid()}
          aria-describedby={describedBy()}
          class="peer sr-only"
          onInput={handleInput}
          onChange={handleChange}
          onFocus={(event) => {
            if (animateRingOnFocus()) {
              pulseRing();
            }
            callHandler(local.onFocus, event);
          }}
          onBlur={local.onBlur}
          onKeyDown={local.onKeyDown}
          {...inputProps}
        />

        <div
          class={cx(
            'group relative inline-flex min-w-0 items-start rounded-lg',
            sizeStyles[size()].gap,
            disabled() ? 'cursor-not-allowed' : readOnly() ? 'cursor-default' : 'cursor-pointer',
          )}
        >
          <Show when={ringEnabled()}>
            <span
              ref={setRingHostEl}
              aria-hidden="true"
              class={cx(
                'pointer-events-none absolute -inset-1.5 z-10 opacity-0',
                errorActive()
                  ? 'text-rose-500 dark:text-rose-400'
                  : 'text-emerald-500 dark:text-emerald-400',
              )}
              style={ringActive() ? {animation: ringFadeAnimation()} : undefined}
            >
              <svg
                class="block h-full w-full"
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

          <label for={inputId()} class="inline-flex shrink-0 select-none">
            <span class={boxClass()}>
              <span
                aria-hidden="true"
                class={cx(
                  'pointer-events-none absolute inset-0 grid select-none place-items-center font-black leading-none transition-opacity duration-100',
                  sizeStyles[size()].glyph,
                  indeterminate() ? 'opacity-100' : 'opacity-0',
                )}
              >
                −
              </span>
              <span
                aria-hidden="true"
                class={cx(
                  'pointer-events-none absolute inset-0 grid select-none place-items-center font-black leading-none transition-opacity duration-100',
                  sizeStyles[size()].glyph,
                  checked() && !indeterminate() ? 'opacity-100' : 'opacity-0',
                )}
              >
                ✓
              </span>
            </span>
          </label>

          <Show when={hasLabel()}>
            <span class={cx('min-w-0', sizeStyles[size()].label)}>{labelContent()}</span>
          </Show>
        </div>
      </div>

      <Show when={hasHelper()}>
        <div
          id={helperId()}
          class={cx(
            helperClass(),
            inline() ? 'min-w-0 break-words' : sizeStyles[size()].helperOffset,
          )}
        >
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

export default Checkbox;
