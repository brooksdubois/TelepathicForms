import {
  For,
  Show,
  createEffect,
  onCleanup,
  createSignal,
  createUniqueId,
  mergeProps,
  splitProps,
} from 'solid-js';
import type { JSX } from 'solid-js';

import { cx } from '../utils/cx';
import type { LaserRingVariant } from '../utils/laserRingVariants';
import { useLaserRing } from '../utils/useLaserRing';

export type RadioGroupSize = 'sm' | 'md' | 'lg';
export type RadioGroupVariant = 'outlined' | 'filled' | 'standard';
export type RadioGroupDirection = 'vertical' | 'horizontal';

export type RadioOption = {
  value: string;
  label: string;
  disabled?: boolean;
  helperText?: string;
};

export type RadioGroupProps = {
  class?: string;
  id?: string;
  label?: string;
  helperText?: string;
  error?: boolean;
  errorText?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  fullWidth?: boolean;
  inline?: boolean;
  size?: RadioGroupSize;
  variant?: RadioGroupVariant;

  name?: string;
  value?: string;
  options: RadioOption[];
  ringEnabled?: boolean;
  animateRingOnFocus?: boolean;
  ringVariant?: LaserRingVariant;
  onRingApi?: (api: {
    pulse: () => void;
    focus: () => void;
    pulseAndFocus: () => void;
  }) => void;

  onValue?: (value: string, ctx?: { prev?: string; event?: Event }) => void;

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
  RadioGroupSize,
  {
    container: string;
    control: string;
    dot: string;
    optionGap: string;
    label: string;
    optionHelper: string;
    helperOffset: string;
  }
> = {
  sm: {
    container: 'px-3 py-2',
    control: 'h-[18px] w-[18px]',
    dot: 'h-[8px] w-[8px]',
    optionGap: 'gap-2',
    label: 'text-sm',
    optionHelper: 'text-[11px]',
    helperOffset: 'pl-6',
  },
  md: {
    container: 'px-3.5 py-2.5',
    control: 'h-[19px] w-[19px]',
    dot: 'h-[9px] w-[9px]',
    optionGap: 'gap-2.5',
    label: 'text-sm',
    optionHelper: 'text-xs',
    helperOffset: 'pl-7',
  },
  lg: {
    container: 'px-4 py-3',
    control: 'h-5 w-5',
    dot: 'h-[10px] w-[10px]',
    optionGap: 'gap-3',
    label: 'text-base',
    optionHelper: 'text-sm',
    helperOffset: 'pl-8',
  },
};

const variantStyles: Record<RadioGroupVariant, string> = {
  outlined:
    'rounded-xl border bg-white/90 shadow-sm backdrop-blur-sm dark:bg-slate-900/60',
  filled:
    'rounded-xl border border-transparent bg-slate-100/90 shadow-inner shadow-slate-200/60 dark:bg-slate-800/60 dark:shadow-slate-900/60',
  standard: 'bg-transparent',
};

const RadioGroup = (props: RadioGroupProps) => {
  const merged = mergeProps(props);

  const [local] = splitProps(merged, [
    'class',
    'id',
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
    'name',
    'value',
    'options',
    'ringEnabled',
    'animateRingOnFocus',
    'ringVariant',
    'onRingApi',
    'onValue',
    'renderLabel',
    'renderHelper',
    'rootClass',
    'labelClass',
    'inputClass',
    'helperClass',
  ]);

  const optionInputEls: Array<HTMLInputElement | undefined> = [];
  const [animatingOption, setAnimatingOption] = createSignal<string | undefined>(
    undefined,
  );
  let animatingOptionTimer: number | undefined;
  let interactionArmTimer: number | undefined;
  let interactionArmed = false;

  const clearAnimatingOptionTimer = () => {
    if (animatingOptionTimer !== undefined) {
      window.clearTimeout(animatingOptionTimer);
      animatingOptionTimer = undefined;
    }
  };

  const clearAnimatingOption = () => {
    clearAnimatingOptionTimer();
    setAnimatingOption(undefined);
  };

  const clearInteractionArmTimer = () => {
    if (interactionArmTimer !== undefined) {
      window.clearTimeout(interactionArmTimer);
      interactionArmTimer = undefined;
    }
  };

  const armInteraction = () => {
    interactionArmed = true;
    clearInteractionArmTimer();
    interactionArmTimer = window.setTimeout(() => {
      interactionArmed = false;
      interactionArmTimer = undefined;
    }, 500);
  };

  const disarmInteraction = () => {
    interactionArmed = false;
    clearInteractionArmTimer();
  };

  const required = () => Boolean(local.required);
  const disabled = () => Boolean(local.disabled);
  const readOnly = () => Boolean(local.readOnly);
  const fullWidth = () => Boolean(local.fullWidth);
  const inline = () => Boolean(local.inline);
  const ringEnabled = () => local.ringEnabled ?? true;

  const size = () => (local.size ?? 'md') as RadioGroupSize;
  const variant = () => (local.variant ?? 'outlined') as RadioGroupVariant;
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
    radius: () => 8,
    variant: () => local.ringVariant,
  });

  const errorActive = () => Boolean(local.error);
  const value = () => local.value ?? '';

  const helperContent = () => {
    if (errorActive()) {
      return local.errorText ?? local.helperText;
    }
    return local.helperText;
  };

  const hasHelper = () => Boolean(local.renderHelper) || Boolean(helperContent());
  const hasLegend = () => Boolean(local.renderLabel) || Boolean(local.label);

  const autoId = createUniqueId();
  const groupId = () => local.id ?? `rg-${autoId}`;
  const legendId = () => `${groupId()}-legend`;
  const helperId = () => `${groupId()}-helper`;
  const optionId = (index: number) => `${groupId()}-opt-${index}`;
  const groupName = () => local.name ?? `${groupId()}-name`;

  const describedBy = () => (hasHelper() ? helperId() : undefined);
  const ariaInvalid = () => (errorActive() ? 'true' : undefined);

  const helperToneClass = () => {
    if (errorActive()) return 'text-rose-600 dark:text-rose-300';
    return 'text-slate-500 dark:text-slate-400';
  };

  const helperClass = () =>
    cx('leading-snug text-xs', helperToneClass(), local.helperClass);

  const legendClass = () =>
    cx(
      'mb-1.5 text-sm font-medium text-slate-700 dark:text-slate-200',
      disabled() ? 'opacity-60' : '',
      local.labelClass,
    );

  const containerClass = () => {
    const sizeClass = variant() === 'standard' ? 'px-0 py-1' : sizeStyles[size()].container;

    const toneClasses =
      variant() === 'standard'
        ? ''
        : errorActive()
          ? 'border-rose-500/80'
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

  const optionsWrapClass = () =>
    cx(
      'min-w-0',
      inline() ? 'flex flex-wrap items-start gap-x-6 gap-y-2' : 'flex flex-col gap-2',
    );

  const optionLabelClass = (optionDisabled: boolean) =>
    cx(
      'group/option relative inline-flex min-w-0 items-start rounded-lg',
      sizeStyles[size()].optionGap,
      optionDisabled || disabled()
        ? 'cursor-not-allowed'
        : readOnly()
          ? 'cursor-default'
          : 'cursor-pointer',
      inline() ? 'w-auto' : 'w-full',
    );

  const optionControlClass = (checked: boolean) => {
    const tone = errorActive()
      ? 'border-rose-500/90 peer-focus-visible:ring-rose-500/40 dark:peer-focus-visible:ring-rose-500/50'
      : 'border-slate-300/90 peer-focus-visible:ring-emerald-500/35 dark:border-slate-700 dark:peer-focus-visible:ring-emerald-400/45';

    const fill = checked
      ? errorActive()
        ? 'border-rose-500 bg-rose-500 dark:border-rose-400 dark:bg-rose-400'
        : 'border-emerald-500 bg-emerald-500 dark:border-emerald-400 dark:bg-emerald-400'
      : 'bg-white dark:bg-slate-900';

    return cx(
      'relative mt-0.5 inline-flex shrink-0 items-center justify-center rounded-full border transition duration-150 peer-focus-visible:ring-2 peer-focus-visible:ring-offset-1 peer-focus-visible:ring-offset-white dark:peer-focus-visible:ring-offset-slate-950',
      sizeStyles[size()].control,
      tone,
      fill,
    );
  };

  const optionTextClass = (optionDisabled: boolean) =>
    cx(
      'min-w-0 leading-snug text-slate-700 dark:text-slate-200',
      sizeStyles[size()].label,
      optionDisabled || disabled() ? 'opacity-60' : '',
    );

  const optionHelperClass = (optionDisabled: boolean) =>
    cx(
      'mt-0.5 min-w-0 leading-snug text-slate-500 dark:text-slate-400',
      sizeStyles[size()].optionHelper,
      optionDisabled || disabled() ? 'opacity-60' : '',
    );

  const pulseOption = (optionValue: string | undefined) => {
    if (!ringEnabled() || !optionValue) return;
    clearAnimatingOptionTimer();
    setAnimatingOption(optionValue);
    pulseRing();
    animatingOptionTimer = window.setTimeout(() => {
      setAnimatingOption((current) =>
        current === optionValue ? undefined : current,
      );
      animatingOptionTimer = undefined;
    }, 720);
  };

  const focusSelectedOption = () => {
    const activeValue =
      local.options.find((option) => option.value === value() && !option.disabled)?.value ??
      local.options.find((option) => !option.disabled)?.value;
    if (!activeValue) return;
    const index = local.options.findIndex((option) => option.value === activeValue);
    if (index >= 0) {
      optionInputEls[index]?.focus();
    }
  };

  const pulseCurrentOption = () => {
    const activeValue =
      local.options.find((option) => option.value === value() && !option.disabled)?.value ??
      local.options.find((option) => !option.disabled)?.value;
    pulseOption(activeValue);
  };

  createEffect(() => {
    const focus = () => focusSelectedOption();
    const pulse = () => pulseCurrentOption();
    const pulseAndFocus = () => {
      focus();
      pulse();
    };
    local.onRingApi?.({ pulse, focus, pulseAndFocus });
  });

  const renderLegend = () => {
    if (local.renderLabel) {
      return local.renderLabel({
        label: local.label,
        required: required(),
        disabled: disabled(),
        htmlFor: undefined,
      });
    }

    if (!local.label) return null;

    return (
      <>
        <span>{local.label}</span>
        <Show when={required()}>
          <span class="text-rose-500"> *</span>
        </Show>
      </>
    );
  };

  const handleChange = (event: Event, nextValue: string, optionDisabled: boolean) => {
    const target = event.currentTarget as HTMLInputElement;

    if (disabled() || readOnly() || optionDisabled) {
      event.preventDefault();
      target.checked = nextValue === value();
      return;
    }

    const prev = value();
    if (nextValue === prev) {
      disarmInteraction();
      return;
    }

    if (interactionArmed) {
      pulseOption(nextValue);
    }
    disarmInteraction();

    local.onValue?.(nextValue, {
      prev,
      event,
    });
  };

  createEffect(() => {
    if (ringEnabled()) return;
    clearAnimatingOption();
  });

  onCleanup(() => {
    clearAnimatingOptionTimer();
    clearInteractionArmTimer();
    interactionArmed = false;
  });

  const optionsMarkup = () => (
    <div class={optionsWrapClass()}>
      <For each={local.options}>
        {(option, index) => {
          const optionDisabled = Boolean(option.disabled);
          const checked = () => option.value === value();

          return (
            <label
              for={optionId(index())}
              class={optionLabelClass(optionDisabled)}
              onPointerDown={() => armInteraction()}
            >
              <Show when={ringEnabled() && animatingOption() === option.value}>
                <span
                  ref={setRingHostEl}
                  aria-hidden="true"
                  class={cx(
                    'pointer-events-none absolute -inset-1 z-10 opacity-0',
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

              <input
                id={optionId(index())}
                ref={(el) => {
                  optionInputEls[index()] = el;
                }}
                type="radio"
                name={groupName()}
                value={option.value}
                checked={checked()}
                disabled={disabled() || optionDisabled}
                aria-invalid={ariaInvalid()}
                aria-describedby={describedBy()}
                class="peer sr-only"
                onChange={(event) => handleChange(event, option.value, optionDisabled)}
                onKeyDown={(event) => {
                  if (
                    event.key === ' ' ||
                    event.key === 'Enter' ||
                    event.key === 'ArrowUp' ||
                    event.key === 'ArrowDown' ||
                    event.key === 'ArrowLeft' ||
                    event.key === 'ArrowRight'
                  ) {
                    armInteraction();
                  }
                }}
              />

              <span class={optionControlClass(checked())}>
                <span
                  aria-hidden="true"
                  class={cx(
                    'rounded-full bg-white transition duration-150',
                    sizeStyles[size()].dot,
                    checked() ? 'scale-100 opacity-100' : 'scale-0 opacity-0',
                  )}
                />
              </span>

              <span class="min-w-0">
                <span class={optionTextClass(optionDisabled)}>{option.label}</span>
                <Show when={option.helperText}>
                  <div class={optionHelperClass(optionDisabled)}>{option.helperText}</div>
                </Show>
              </span>
            </label>
          );
        }}
      </For>
    </div>
  );

  return (
    <div
      class={cx(
        'flex flex-col gap-1.5',
        fullWidth() ? 'w-full' : 'inline-flex',
        local.class,
        local.rootClass,
      )}
    >
      <Show
        when={hasLegend()}
        fallback={
          <div
            id={groupId()}
            role="radiogroup"
            aria-label={local.label ?? local.name ?? 'Radio group'}
            aria-invalid={ariaInvalid()}
            aria-describedby={describedBy()}
            class={containerClass()}
          >
            {optionsMarkup()}
          </div>
        }
      >
        <fieldset
          id={groupId()}
          aria-invalid={ariaInvalid()}
          aria-describedby={describedBy()}
          class={cx('min-w-0 border-0 p-0', containerClass())}
        >
          <legend id={legendId()} class={legendClass()}>
            {renderLegend()}
          </legend>
          {optionsMarkup()}
        </fieldset>
      </Show>

      <Show when={hasHelper()}>
        <div
          id={helperId()}
          class={cx(
            helperClass(),
            variant() === 'standard' ? '' : sizeStyles[size()].helperOffset,
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

export default RadioGroup;
