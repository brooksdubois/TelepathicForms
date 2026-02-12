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

export type SliderSize = 'sm' | 'md' | 'lg';
export type SliderVariant = 'outlined' | 'filled' | 'standard';
export type SliderMode = 'single' | 'range' | 'stepper';

export type SliderProps = {
  // Core value
  value: number | [number, number];
  onValue?: (value: number | [number, number]) => void;
  onChange?: (value: number | [number, number]) => void;

  // Configuration
  min?: number;
  max?: number;
  step?: number;
  mode?: SliderMode;

  // Display
  label?: string;
  helperText?: string;
  error?: boolean;
  errorText?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  fullWidth?: boolean;

  // Visual
  marks?: { value: number; label: string }[];
  showValue?: boolean;
  showInput?: boolean;
  size?: SliderSize;
  variant?: SliderVariant;

  // Ring animation
  ringEnabled?: boolean;
  animateRingOnFocus?: boolean;
  onRingApi?: (api: {
    pulse: () => void;
    focus: () => void;
    pulseAndFocus: () => void;
  }) => void;

  // Render customization
  renderLabel?: (props: {
    label?: string;
    required?: boolean;
    disabled?: boolean;
  }) => JSX.Element;

  renderHelper?: (props: {
    helperText?: string;
    error?: boolean;
    id?: string;
  }) => JSX.Element;

  // Class overrides
  class?: string;
  rootClass?: string;
  labelClass?: string;
  helperClass?: string;
  trackClass?: string;
  thumbClass?: string;
};

const sizeStyles: Record<
  SliderSize,
  { track: string; thumb: string; button: string; input: string }
> = {
  sm: {
    track: 'h-1',
    thumb: 'h-4 w-4',
    button: 'px-2 py-1 text-xs',
    input: 'text-xs px-2 py-1',
  },
  md: {
    track: 'h-2',
    thumb: 'h-5 w-5',
    button: 'px-3 py-1.5 text-sm',
    input: 'text-sm px-3 py-1.5',
  },
  lg: {
    track: 'h-3',
    thumb: 'h-6 w-6',
    button: 'px-4 py-2 text-base',
    input: 'text-base px-4 py-2',
  },
};

const variantStyles: Record<SliderVariant, string> = {
  outlined:
    'rounded-xl border bg-white/90 shadow-sm backdrop-blur-sm dark:bg-slate-900/60',
  filled:
    'rounded-xl border border-transparent bg-slate-100/90 shadow-inner shadow-slate-200/60 dark:bg-slate-800/60 dark:shadow-slate-900/60',
  standard: 'border-b bg-transparent',
};

const Slider = (props: SliderProps) => {
  const merged = mergeProps(
    {
      min: 0,
      max: 100,
      step: 1,
      mode: 'single' as SliderMode,
      size: 'md' as SliderSize,
      variant: 'outlined' as SliderVariant,
      ringEnabled: true,
      animateRingOnFocus: true,
      showValue: true,
      marks: [],
    },
    props
  );

  const [local, otherProps] = splitProps(merged, [
    'value',
    'onValue',
    'onChange',
    'min',
    'max',
    'step',
    'mode',
    'label',
    'helperText',
    'error',
    'errorText',
    'required',
    'disabled',
    'readOnly',
    'fullWidth',
    'marks',
    'showValue',
    'showInput',
    'size',
    'variant',
    'ringEnabled',
    'animateRingOnFocus',
    'onRingApi',
    'renderLabel',
    'renderHelper',
    'class',
    'rootClass',
    'labelClass',
    'helperClass',
    'trackClass',
    'thumbClass',
  ]);

  let trackRef: HTMLDivElement | undefined;
  let thumbRef: HTMLDivElement | undefined;
  let minThumbRef: HTMLDivElement | undefined;
  let maxThumbRef: HTMLDivElement | undefined;

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
    enabled: () => local.ringEnabled,
    radius: () => (local.variant === 'standard' ? 2 : 12),
  });

  const [isDragging, setIsDragging] = createSignal(false);
  const [activeThumb, setActiveThumb] = createSignal<'min' | 'max' | 'single'>('single');
  const [inputValue, setInputValue] = createSignal<string>('');
  
  // FIXED: Add real-time drag value signals
  const [dragMinValue, setDragMinValue] = createSignal<number | null>(null);
  const [dragMaxValue, setDragMaxValue] = createSignal<number | null>(null);

  const min = () => local.min;
  const max = () => local.max;
  const step = () => local.step;
  const mode = () => local.mode;
  const disabled = () => local.disabled;
  const readOnly = () => local.readOnly;
  const errorActive = () => local.error;
  const marks = () => local.marks || [];

  const clamp = (val: number): number => {
    return Math.max(min(), Math.min(max(), val));
  };

  const snapToStep = (val: number): number => {
    const steps = Math.round((val - min()) / step());
    return min() + steps * step();
  };

  const getCurrentValue = (): number | [number, number] => {
    if (mode() === 'range') {
      return Array.isArray(local.value)
        ? local.value
        : [min(), max()];
    }
    return typeof local.value === 'number'
      ? local.value
      : (local.value as [number, number])[0];
  };

  const getSingleValue = (): number => {
    const val = getCurrentValue();
    return typeof val === 'number' ? val : val[0];
  };

  const getMinValue = (): number => {
    // FIXED: Return drag value if dragging, otherwise actual value
    if (isDragging() && activeThumb() === 'min' && dragMinValue() !== null) {
      return dragMinValue()!;
    }
    if (mode() === 'range') {
      const val = getCurrentValue() as [number, number];
      return val[0];
    }
    return min();
  };

  const getMaxValue = (): number => {
    // FIXED: Return drag value if dragging, otherwise actual value
    if (isDragging() && activeThumb() === 'max' && dragMaxValue() !== null) {
      return dragMaxValue()!;
    }
    if (isDragging() && activeThumb() === 'single' && dragMaxValue() !== null) {
      return dragMaxValue()!;
    }
    if (mode() === 'range') {
      const val = getCurrentValue() as [number, number];
      return val[1];
    }
    return getSingleValue();
  };

  const getPercent = (val: number): number => {
    return ((clamp(val) - min()) / (max() - min())) * 100;
  };

  const minPercent = () => getPercent(getMinValue());
  const maxPercent = () => getPercent(getMaxValue());

  createEffect(() => {
    setInputValue(String(getSingleValue()));
  });

  const handleTrackClick = (e: MouseEvent) => {
    if (disabled() || readOnly() || !trackRef) return;

    const rect = trackRef.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, x / rect.width));
    const rawValue = min() + percent * (max() - min());
    const newValue = snapToStep(rawValue);

    if (mode() === 'range') {
      const [currentMin, currentMax] = getCurrentValue() as [number, number];
      const distToMin = Math.abs(newValue - currentMin);
      const distToMax = Math.abs(newValue - currentMax);

      let newRange: [number, number];
      if (distToMin < distToMax) {
        newRange = [Math.min(newValue, currentMax), currentMax];
      } else {
        newRange = [currentMin, Math.max(currentMin, newValue)];
      }

      local.onValue?.(newRange);
      local.onChange?.(newRange);
    } else {
      local.onValue?.(newValue);
      local.onChange?.(newValue);
    }
  };

  const handleThumbMouseDown = (e: MouseEvent, thumb: 'min' | 'max' | 'single') => {
  if (disabled() || readOnly()) return;
  
  e.preventDefault();
  e.stopPropagation();
  
  setIsDragging(true);
  setActiveThumb(thumb);
  
  // FIXED: Clear drag values on start
  setDragMinValue(null);
  setDragMaxValue(null);

  const startX = e.clientX;
  
  // FIXED: Capture the actual current value from props, not from getMinValue/getMaxValue
  // because those might return drag values from previous drag
  let startValue: number;
  if (mode() === 'range') {
    const currentRange = getCurrentValue() as [number, number];
    startValue = thumb === 'max' ? currentRange[1] : currentRange[0];
  } else {
    startValue = getCurrentValue() as number;
  }

  const handleMouseMove = (moveEvent: MouseEvent) => {
    if (!trackRef) return;

    const rect = trackRef.getBoundingClientRect();
    const deltaX = moveEvent.clientX - startX;
    const deltaPercent = deltaX / rect.width;
    const deltaValue = deltaPercent * (max() - min());
    let newValue = clamp(startValue + deltaValue);
    newValue = snapToStep(newValue);

    if (mode() === 'range') {
      const [currentMin, currentMax] = getCurrentValue() as [number, number];
      let newRange: [number, number];

      if (thumb === 'max') {
        newRange = [currentMin, Math.max(currentMin, newValue)];
        setDragMaxValue(newRange[1]);
      } else if (thumb === 'min') {
        newRange = [Math.min(currentMax, newValue), currentMax];
        setDragMinValue(newRange[0]);
      } else {
        newRange = [newValue, currentMax];
        setDragMaxValue(newValue);
      }

      local.onValue?.(newRange);
    } else {
      setDragMaxValue(newValue);
      local.onValue?.(newValue);
    }
  };

  const handleMouseUp = () => {
    setDragMinValue(null);
    setDragMaxValue(null);
    setIsDragging(false);
    setActiveThumb('single');
    
    const finalValue = getCurrentValue();
    local.onChange?.(finalValue);

    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
};

  const handleStepperChange = (delta: number) => {
    if (disabled() || readOnly()) return;
    
    const current = getSingleValue();
    const steps = Math.round((current - min()) / step());
    const newValue = clamp(min() + (steps + delta) * step());
    
    local.onValue?.(newValue);
    local.onChange?.(newValue);
  };

  const handleStepperInput = (e: Event) => {
    if (disabled() || readOnly()) return;
    
    const target = e.currentTarget as HTMLInputElement;
    const value = parseFloat(target.value);
    
    if (!isNaN(value)) {
      const clamped = clamp(value);
      const stepped = snapToStep(clamped);
      local.onValue?.(stepped);
    }
  };

  onCleanup(() => {
    document.removeEventListener('mousemove', () => {});
    document.removeEventListener('mouseup', () => {});
  });

  const id = createUniqueId();
  const helperId = `slider-${id}-helper`;

  const trackClasses = () => cx(
    'relative w-full rounded-full transition-all',
    sizeStyles[local.size].track,
    disabled() && 'opacity-50 cursor-not-allowed',
    !disabled() && !readOnly() && 'cursor-pointer',
    local.trackClass
  );

  const thumbClasses = () => cx(
    'absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full transition-shadow',
    sizeStyles[local.size].thumb,
    'border-2 border-emerald-500 bg-white dark:bg-slate-900',
    disabled() && 'cursor-not-allowed',
    readOnly() && 'cursor-default',
    !disabled() && !readOnly() && 'cursor-grab active:cursor-grabbing',
    isDragging() && 'shadow-lg',
    local.thumbClass
  );

  const containerClasses = () => cx(
    'relative flex flex-col gap-2',
    variantStyles[local.variant],
    local.variant === 'standard' ? 'rounded-none px-0 pb-1.5 pt-2.5' : 'rounded-xl px-4 py-3',
    errorActive() 
      ? 'border-rose-500/80 focus-within:border-rose-500 dark:border-rose-500/70'
      : 'border-slate-300/80 focus-within:border-emerald-400 dark:border-slate-700 dark:focus-within:border-emerald-400',
    disabled() && 'opacity-60'
  );

  return (
    <div
      class={cx(
        'flex flex-col gap-1.5',
        local.fullWidth ? 'w-full' : 'inline-flex',
        local.class,
        local.rootClass
      )}
    >
      {/* Label */}
      {local.renderLabel ? (
        local.renderLabel({
          label: local.label,
          required: local.required,
          disabled: disabled(),
        })
      ) : local.label ? (
        <label
          class={cx(
            'text-sm font-medium text-slate-700 dark:text-slate-200',
            disabled() && 'opacity-60',
            local.labelClass
          )}
        >
          {local.label}
          {local.required && <span class="ml-1 text-rose-500">*</span>}
        </label>
      ) : null}

      {/* Slider Container */}
      <div class={containerClasses()}>
        {/* Laser Ring */}
        {local.ringEnabled && (
          <span
            ref={setRingHostEl}
            aria-hidden="true"
            class={cx(
              'tf-focus-laser-ring',
              errorActive()
                ? 'text-rose-500 dark:text-rose-400'
                : 'text-emerald-500 dark:text-emerald-400'
            )}
          >
            <svg
              class="tf-focus-laser-ring-svg"
              viewBox={`0 0 ${ringBox().w} ${ringBox().h}`}
              preserveAspectRatio="none"
            >
              {ringActive() && (
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
                    d={ringPathD()}
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.25"
                    stroke-linecap="round"
                    vector-effect="non-scaling-stroke"
                  />
                </>
              )}
            </svg>
          </span>
        )}

        {/* Slider Content */}
        <div class="flex flex-col gap-3">
          {/* Track and Thumbs */}
          <div class="relative">
            {/* Track */}
            <div
              ref={trackRef}
              class={trackClasses()}
              onClick={handleTrackClick}
              onMouseDown={(e) => e.preventDefault()}
              onFocus={() => {
                if (local.ringEnabled && local.animateRingOnFocus) {
                  pulseRing();
                }
              }}
              tabIndex={disabled() || readOnly() ? -1 : 0}
              role="slider"
              aria-label={local.label ?? 'Slider'}
              aria-valuemin={min()}
              aria-valuemax={max()}
              aria-valuenow={getMaxValue()}
              aria-disabled={disabled()}
              aria-readonly={readOnly()}
            >
              {/* Background */}
              <div class="absolute inset-0 rounded-full bg-slate-200 dark:bg-slate-700" />

              {/* Fill */}
              {mode() === 'range' ? (
                <div
                  class="absolute h-full rounded-full bg-emerald-500 dark:bg-emerald-400"
                  style={{
                    left: `${minPercent()}%`,
                    width: `${maxPercent() - minPercent()}%`,
                  }}
                />
              ) : (
                <div
                  class="absolute h-full rounded-full bg-emerald-500 dark:bg-emerald-400"
                  style={{
                    left: '0%',
                    width: `${maxPercent()}%`,
                  }}
                />
              )}

              {/* Range Min Thumb */}
              {mode() === 'range' && (
                <div
                  ref={minThumbRef}
                  class={thumbClasses()}
                  style={{ left: `${minPercent()}%` }}
                  onMouseDown={(e) => handleThumbMouseDown(e, 'min')}
                  role="slider"
                  aria-label="Minimum value"
                  aria-valuemin={min()}
                  aria-valuemax={max()}
                  aria-valuenow={getMinValue()}
                  aria-disabled={disabled()}
                  aria-readonly={readOnly()}
                  tabIndex={disabled() || readOnly() ? -1 : 0}
                />
              )}

              {/* Max/Single Thumb */}
              <div
                ref={mode() === 'range' ? maxThumbRef : thumbRef}
                class={thumbClasses()}
                style={{ left: `${maxPercent()}%` }}
                onMouseDown={(e) => handleThumbMouseDown(e, mode() === 'range' ? 'max' : 'single')}
                role="slider"
                aria-label={mode() === 'range' ? 'Maximum value' : 'Value'}
                aria-valuemin={min()}
                aria-valuemax={max()}
                aria-valuenow={getMaxValue()}
                aria-disabled={disabled()}
                aria-readonly={readOnly()}
                tabIndex={disabled() || readOnly() ? -1 : 0}
              />
            </div>

            {/* FIXED: Value Display - Shows real-time updates during drag */}
            <Show when={local.showValue}>
              <div class="mt-4 flex items-center justify-between px-1 text-xs text-slate-500 dark:text-slate-400">
                <span class="font-medium">{min()}{local.label?.includes('%') ? '%' : ''}</span>
                <div class="flex items-center gap-1 font-medium text-emerald-600 transition-all dark:text-emerald-400">
                  {mode() === 'range' ? (
                    <>
                      <span class={cx(isDragging() && activeThumb() === 'min' && 'scale-110 font-bold')}>
                        {getMinValue()}{local.label?.includes('%') ? '%' : ''}
                      </span>
                      <span>—</span>
                      <span class={cx(isDragging() && activeThumb() === 'max' && 'scale-110 font-bold')}>
                        {getMaxValue()}{local.label?.includes('%') ? '%' : ''}
                      </span>
                    </>
                  ) : (
                    <span class={cx(isDragging() && 'scale-110 font-bold transition-all')}>
                      {getMaxValue()}{local.label?.includes('%') ? '%' : ''}
                    </span>
                  )}
                </div>
                <span class="font-medium">{max()}{local.label?.includes('%') ? '%' : ''}</span>
              </div>
            </Show>
          </div>

          {/* Stepper Controls */}
          {mode() === 'stepper' && local.showInput && (
            <div class="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleStepperChange(-1)}
                disabled={disabled() || readOnly() || getSingleValue() <= min()}
                class={cx(
                  'rounded-lg border border-slate-200 bg-white font-medium transition',
                  'hover:border-slate-300 hover:bg-slate-50 active:bg-slate-100',
                  'disabled:cursor-not-allowed disabled:opacity-50',
                  'dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800',
                  sizeStyles[local.size].button
                )}
              >
                −
              </button>

              <input
                type="number"
                value={inputValue()}
                onInput={handleStepperInput}
                disabled={disabled() || readOnly()}
                min={min()}
                max={max()}
                step={step()}
                class={cx(
                  'w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 outline-none transition',
                  'focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/40',
                  'dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100',
                  'disabled:cursor-not-allowed disabled:opacity-50',
                  sizeStyles[local.size].input
                )}
              />

              <button
                type="button"
                onClick={() => handleStepperChange(1)}
                disabled={disabled() || readOnly() || getSingleValue() >= max()}
                class={cx(
                  'rounded-lg border border-slate-200 bg-white font-medium transition',
                  'hover:border-slate-300 hover:bg-slate-50 active:bg-slate-100',
                  'disabled:cursor-not-allowed disabled:opacity-50',
                  'dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800',
                  sizeStyles[local.size].button
                )}
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Helper Text */}
      {local.renderHelper ? (
        local.renderHelper({
          helperText: errorActive() ? local.errorText || local.helperText : local.helperText,
          error: errorActive(),
          id: helperId,
        })
      ) : (local.helperText || (errorActive() && local.errorText)) ? (
        <div
          id={helperId}
          class={cx(
            'text-xs',
            errorActive() 
              ? 'text-rose-600 dark:text-rose-300'
              : 'text-slate-500 dark:text-slate-400',
            local.helperClass
          )}
        >
          {errorActive() ? local.errorText || local.helperText : local.helperText}
        </div>
      ) : null}
    </div>
  );
};

export default Slider;