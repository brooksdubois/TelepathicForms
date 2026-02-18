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
import { useRingAnimation } from '../utils/useRingAnimation';

export type SwitchSize = 'sm' | 'md' | 'lg';
export type SwitchVariant = 'outlined' | 'filled' | 'standard';

export type SwitchProps = Omit<
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
  size?: SwitchSize;
  variant?: SwitchVariant;

  checked?: boolean;
  ringEnabled?: boolean;
  animateRingOnFocus?: boolean;
  ringVariant?: LaserRingVariant;
  onRingApi?: (api: {
    pulse: () => void;
    focus: () => void;
    pulseAndFocus: () => void;
  }) => void;
  onChecked?: (checked: boolean, ctx?: { prev?: boolean; event?: Event }) => void;

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
  SwitchSize,
  {
    track: string;
    thumb: string;
    translateOn: string;
    text: string;
    helper: string;
    gap: string;
    helperOffset: string;
    container: string;
    standard: string;
  }
> = {
  sm: {
    track: 'h-5 w-9',
    thumb: 'h-4 w-4',
    translateOn: 'translate-x-4',
    text: 'text-sm',
    helper: 'text-xs',
    gap: 'gap-2',
    helperOffset: 'pl-11',
    container: 'px-3 py-2',
    standard: 'px-0 py-1',
  },
  md: {
    track: 'h-6 w-10',
    thumb: 'h-5 w-5',
    translateOn: 'translate-x-4',
    text: 'text-sm',
    helper: 'text-xs',
    gap: 'gap-2.5',
    helperOffset: 'pl-12',
    container: 'px-3.5 py-2.5',
    standard: 'px-0 py-1.5',
  },
  lg: {
    track: 'h-7 w-12',
    thumb: 'h-6 w-6',
    translateOn: 'translate-x-5',
    text: 'text-base',
    helper: 'text-sm',
    gap: 'gap-3',
    helperOffset: 'pl-14',
    container: 'px-4 py-3',
    standard: 'px-0 py-2',
  },
};

const variantStyles: Record<SwitchVariant, string> = {
  outlined:
    'rounded-xl border bg-white/90 shadow-sm backdrop-blur-sm dark:bg-slate-900/60',
  filled:
    'rounded-xl border border-transparent bg-slate-100/90 shadow-inner shadow-slate-200/60 dark:bg-slate-800/60 dark:shadow-slate-900/60',
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

const Switch = (props: SwitchProps) => {
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

  const size = () => (local.size ?? 'md') as SwitchSize;
  const variant = () => (local.variant ?? 'outlined') as SwitchVariant;
  const checked = () => Boolean(local.checked);
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
  const hasLabel = () => Boolean(local.renderLabel) || Boolean(local.label);

  const autoId = createUniqueId();
  const inputId = () => local.id ?? `switch-${autoId}`;
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

    const toneClasses =
      variant() === 'standard'
        ? ''
        : errorActive()
          ? 'border-rose-500/80 dark:border-rose-500/70'
          : 'border-slate-300/80 dark:border-slate-700';

    return cx(
      variantStyles[variant()],
      sizeClass,
      toneClasses,
      variant() === 'standard' ? 'rounded-none' : 'rounded-xl',
      disabled() ? 'opacity-60' : '',
      readOnly() && !disabled() && variant() !== 'standard'
        ? 'bg-slate-50/80 dark:bg-slate-900/40'
        : '',
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

  const rowClass = () =>
    cx(
      'min-w-0',
      inline() ? 'flex min-w-0 flex-1 items-center gap-3' : 'flex items-start',
      sizeStyles[size()].gap,
    );

  const labelClass = () =>
    cx(
      'min-w-0 break-words leading-snug text-slate-700 dark:text-slate-200',
      sizeStyles[size()].text,
      disabled() ? 'opacity-60' : '',
      local.labelClass,
    );

  const helperToneClass = () => {
    if (errorActive()) return 'text-rose-600 dark:text-rose-300';
    return 'text-slate-500 dark:text-slate-400';
  };

  const helperClass = () =>
    cx(
      sizeStyles[size()].helper,
      'leading-snug',
      helperToneClass(),
      local.helperClass,
    );

  const trackToneClass = () => {
    if (errorActive()) {
      return checked()
        ? 'border-rose-500 bg-rose-500 dark:border-rose-400 dark:bg-rose-400'
        : 'border-rose-300 bg-rose-100 dark:border-rose-400 dark:bg-rose-500/20';
    }

    return checked()
      ? 'border-emerald-500 bg-emerald-500 dark:border-emerald-400 dark:bg-emerald-400'
      : 'border-slate-300 bg-slate-200/90 dark:border-slate-600 dark:bg-slate-700/80';
  };

  const focusClass = () =>
    errorActive()
      ? 'peer-focus-visible:ring-rose-500/40 dark:peer-focus-visible:ring-rose-500/50'
      : 'peer-focus-visible:ring-emerald-500/35 dark:peer-focus-visible:ring-emerald-400/45';

  const renderLabel = () => {
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
      <label for={inputId()} class={labelClass()}>
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
    const node = event.currentTarget;

    if (disabled()) {
      callHandler(local.onChange, event);
      return;
    }

    if (readOnly()) {
      event.preventDefault();
      node.checked = checked();
      callHandler(local.onChange, event);
      return;
    }

    const prev = checked();
    const next = node.checked;

    local.onChecked?.(next, { prev, event });
    callHandler(local.onChange, event);
  };

  createEffect(() => {
    const focus = () => inputEl?.focus();
    const pulse = () => pulseRing();
    const pulseAndFocus = () => {
      focus();
      pulse();
    };
    local.onRingApi?.({ pulse, focus, pulseAndFocus });
  });

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

  return (
    <div class={rootClass()}>
      <div class={containerClass()}>
        <div class={rowClass()}>
          <input
            id={inputId()}
            ref={(el) => {
              inputEl = el;
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

          <label
            for={inputId()}
            class={cx(
              'relative inline-flex min-w-0 items-start rounded-lg',
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

            <span
              class={cx(
                'relative inline-flex shrink-0 rounded-full border p-0.5 transition duration-150 ease-out peer-focus-visible:ring-2 peer-focus-visible:ring-offset-1 peer-focus-visible:ring-offset-white dark:peer-focus-visible:ring-offset-slate-950',
                sizeStyles[size()].track,
                trackToneClass(),
                focusClass(),
              )}
            >
              <span
                aria-hidden="true"
                class={cx(
                  'rounded-full bg-white shadow-sm transition duration-150 ease-out',
                  sizeStyles[size()].thumb,
                  checked() ? sizeStyles[size()].translateOn : 'translate-x-0',
                )}
              />
            </span>

            <Show when={hasLabel()}>
              <span class="min-w-0">{renderLabel()}</span>
            </Show>
          </label>
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

export default Switch;
