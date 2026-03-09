import { Show, createEffect, createSignal, type JSX } from "solid-js";
import Select, { type SelectOption } from "./Select";

import { cx } from "../utils/cx";
import type { LaserRingVariant } from "../utils/laserRingVariants";

export type TimePickerSize = "sm" | "md" | "lg";
export type TimePickerVariant = "outlined" | "filled" | "standard";

export type TimePickerProps = {
  id?: string;
  name?: string;
  class?: string;
  rootClass?: string;
  labelClass?: string;
  inputClass?: string;
  helperClass?: string;

  label?: string;
  helperText?: string;
  errorText?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  fullWidth?: boolean;

  size?: TimePickerSize;
  variant?: TimePickerVariant;
  value?: string;
  hour12?: boolean;
  hasSeconds?: boolean;

  error?: boolean;
  ringEnabled?: boolean;
  animateRingOnFocus?: boolean;
  ringVariant?: LaserRingVariant;

  onRingApi?: (api: {
    pulse: () => void;
    focus: () => void;
    pulseAndFocus: () => void;
  }) => void;

  onValue?: (value: string) => void;
  onFocus?: JSX.EventHandlerUnion<HTMLElement, FocusEvent>;
  onBlur?: JSX.EventHandlerUnion<HTMLElement, FocusEvent>;
};

type Period = "AM" | "PM";

const sizeStyles: Record<
  TimePickerSize,
  {
    root: string;
    control: string;
    selectWidth: string;
    gapLabel: string;
  }
> = {
  sm: {
    root: "min-h-8 px-2 py-1 gap-1",
    control: "h-6 px-1.5 text-xs",
    selectWidth: "w-20",
    gapLabel: "text-xs",
  },
  md: {
    root: "min-h-10 px-2.5 py-1.5 gap-1.5",
    control: "h-7 px-2 text-sm",
    selectWidth: "w-[5.75rem]",
    gapLabel: "text-sm",
  },
  lg: {
    root: "min-h-11 px-3 py-1.5 gap-1.5",
    control: "h-8 px-2.5 text-base",
    selectWidth: "w-24",
    gapLabel: "text-base",
  },
};

const variantStyles: Record<TimePickerVariant, string> = {
  outlined:
    "rounded-xl border bg-white/90 shadow-sm backdrop-blur-sm dark:bg-slate-900/60",
  filled:
    "rounded-xl border border-transparent bg-slate-100/90 shadow-inner shadow-slate-200/60 dark:bg-slate-800/60 dark:shadow-slate-900/60",
  standard: "border-b bg-transparent",
};

const normalizeUnit = (value: number, min: number, max: number) =>
  Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : min;

const pad2 = (value: number) => {
  const normalized = Math.trunc(Math.abs(value));
  return String(normalized).padStart(2, "0");
};

type ParsedTime = {
  hour24: number;
  minute: number;
  second: number;
  hasValue: boolean;
};

const parseValue = (raw: string | undefined): ParsedTime => {
  if (!raw) return { hour24: 0, minute: 0, second: 0, hasValue: false };

  const trimmed = raw.trim();
  if (!trimmed) return { hour24: 0, minute: 0, second: 0, hasValue: false };

  const amPmMatch = trimmed.match(/\s*([AaPp][Mm])\s*$/);
  const hasAmPm = Boolean(amPmMatch);
  const ampm = hasAmPm ? amPmMatch![1].toUpperCase() : null;

  const core = hasAmPm ? trimmed.slice(0, -2).trim() : trimmed;
  const parts = core.split(":").map((token) => Number(token.trim()));
  if (parts.length === 0 || parts.some((value) => Number.isNaN(value))) {
    return { hour24: 0, minute: 0, second: 0, hasValue: false };
  }

  let hour = normalizeUnit(parts[0], 0, 23);
  const minute = normalizeUnit(parts[1] ?? 0, 0, 60);
  const second = normalizeUnit(parts[2] ?? 0, 0, 60);

  if (ampm) {
    const hour12 = normalizeUnit(hour, 1, 12);
    const isPm = ampm === "PM";
    hour = hour12 === 12 ? (isPm ? 12 : 0) : isPm ? hour12 + 12 : hour12;
  }

  return { hour24: hour, minute, second, hasValue: true };
};

const to24Hour = (hour12: number, period: Period) => {
  const normalized = normalizeUnit(hour12, 1, 12);
  return normalized === 12 ? (period === "PM" ? 12 : 0) : normalized + (period === "PM" ? 12 : 0);
};

const to12Hour = (hour24: number) => {
  const normalized = normalizeUnit(hour24, 0, 23);
  if (normalized === 0) return 12;
  if (normalized > 12) return normalized - 12;
  return normalized;
};

const toPeriod = (hour24: number) => (hour24 >= 12 ? "PM" : "AM");

const buildTime = (hour: number, minute: number, second: number, hasSeconds: boolean) =>
  hasSeconds
    ? `${pad2(hour)}:${pad2(minute)}:${pad2(second)}`
    : `${pad2(hour)}:${pad2(minute)}`;

export const normalizeTimeValue = (
  raw: string | undefined,
  options?: { hasSeconds?: boolean },
) => {
  if (!raw) return "";

  const trimmed = raw.trim();
  if (!trimmed) return "";

  const parsed = parseValue(trimmed);
  if (!parsed.hasValue) return trimmed;

  return buildTime(
    parsed.hour24,
    parsed.minute,
    parsed.second,
    options?.hasSeconds !== false,
  );
};

const TimePicker = (props: TimePickerProps) => {
  const [hour24, setHour24] = createSignal(0);
  const [minute, setMinute] = createSignal(0);
  const [second, setSecond] = createSignal(0);
  const [period, setPeriod] = createSignal<Period>("AM");
  const [hasValue, setHasValue] = createSignal(false);
  const [isFocused, setIsFocused] = createSignal(false);

  let containerEl: HTMLDivElement | undefined;

  createEffect(() => {
    const parsed = parseValue(props.value);
    setHour24(parsed.hour24);
    setMinute(parsed.minute);
    setSecond(parsed.second);
    setPeriod(toPeriod(parsed.hour24));
    setHasValue(parsed.hasValue);
  });

  const hasLabel = () => props.label && props.label.trim().length > 0;
  const size = () => props.size ?? "md";
  const variant = () => props.variant ?? "outlined";
  const is12Hour = () => Boolean(props.hour12);
  const hasSeconds = () => props.hasSeconds !== false;
  const isInteractive = () => !(props.disabled || props.readOnly);

  const hourOptions = () => {
    const max = is12Hour() ? 12 : 24;
    return Array.from({ length: max }, (_, index) => {
      const value = is12Hour() ? (index === 0 ? 12 : index) : index;
      return {
        value: String(value),
        label: is12Hour() ? String(value) : pad2(index),
      };
    });
  };

  const minuteOptions = () =>
    Array.from({ length: 61 }, (_, index) => ({
      value: pad2(index),
      label: pad2(index),
    }));

  const secondOptions = () =>
    Array.from({ length: 61 }, (_, index) => ({
      value: pad2(index),
      label: pad2(index),
    }));

  const periodOptions: SelectOption[] = [
    { value: "AM", label: "AM" },
    { value: "PM", label: "PM" },
  ];

  const optionInputClass =
    "rounded-lg px-1.5 py-0 text-sm leading-none text-slate-900 outline-none transition overflow-visible whitespace-nowrap text-center";
  const selectContainerClass = () =>
    cx(
      sizeStyles[size()].control,
      "rounded-lg border-transparent bg-transparent shadow-none gap-1.5",
    );
  const fieldSelectClass = () =>
    cx(sizeStyles[size()].selectWidth, "min-w-[4.5rem] flex-1");
  const periodSelectClass = () =>
    cx("min-w-[3.75rem]", sizeStyles[size()].selectWidth);

  const emit = (nextHour24: number, nextMinute: number, nextSecond: number) => {
    props.onValue?.(
      buildTime(
        normalizeUnit(nextHour24, 0, 23),
        normalizeUnit(nextMinute, 0, 60),
        normalizeUnit(nextSecond, 0, 60),
        hasSeconds(),
      ),
    );
  };

  const handleFocus = (event: FocusEvent) => {
    if (!isFocused()) {
      setIsFocused(true);
      props.onFocus?.(event);
    }
  };

  const handleBlur = (event: FocusEvent) => {
    const nextFocus = event.relatedTarget as Node | null;
    if (containerEl?.contains(nextFocus)) return;
    if (isFocused()) {
      setIsFocused(false);
      props.onBlur?.(event);
    }
  };

  const commitHour = (nextValue: string) => {
    if (!isInteractive()) return;

    const parsed = Number(nextValue);
    if (!Number.isFinite(parsed)) return;
    if (!hasValue()) setHasValue(true);

    const nextHour24 = is12Hour()
      ? to24Hour(parsed, period())
      : normalizeUnit(parsed, 0, 23);

    setHour24(nextHour24);
    emit(nextHour24, minute(), second());
  };

  const commitMinute = (nextValue: string) => {
    if (!isInteractive()) return;
    const numeric = Number(nextValue);
    const nextMinute = Number.isFinite(numeric) ? normalizeUnit(numeric, 0, 60) : 0;
    if (!hasValue()) setHasValue(true);
    setMinute(nextMinute);
    emit(hour24(), nextMinute, second());
  };

  const commitSecond = (nextValue: string) => {
    if (!isInteractive()) return;
    const numeric = Number(nextValue);
    const nextSecond = Number.isFinite(numeric) ? normalizeUnit(numeric, 0, 60) : 0;
    if (!hasValue()) setHasValue(true);
    setSecond(nextSecond);
    emit(hour24(), minute(), nextSecond);
  };

  const changePeriod = (next: Period) => {
    if (!isInteractive()) return;
    if (!hasValue()) setHasValue(true);
    setPeriod(next);
    const nextHour24 = to24Hour(to12Hour(hour24()), next);
    setHour24(nextHour24);
    emit(nextHour24, minute(), second());
  };

  const menuWidth = () =>
    containerEl?.getBoundingClientRect().width || undefined;

  const hourDisplayValue = () =>
    hasValue()
      ? is12Hour()
        ? String(to12Hour(hour24()))
        : pad2(hour24())
      : "";
  const minuteDisplayValue = () => (hasValue() ? pad2(minute()) : "");
  const secondDisplayValue = () => (hasValue() ? pad2(second()) : "");
  const periodDisplayValue = () => (hasValue() ? period() : "");

  return (
    <div class={cx("flex flex-col gap-1.5", props.fullWidth ? "w-full" : "inline-flex", props.rootClass)}>
      {hasLabel() ? (
        <label
          class={cx(
            "text-sm font-medium text-slate-700 dark:text-slate-200",
            props.labelClass,
            props.disabled && "opacity-60",
          )}
        >
          {props.label}
          {props.required ? <span class="ml-1 text-rose-500">*</span> : null}
        </label>
      ) : null}

      <div
        ref={containerEl}
        class={cx(
          "relative flex items-center transition-all dark:bg-slate-900/60 backdrop-blur-sm",
          variantStyles[variant()],
          sizeStyles[size()].root,
          sizeStyles[size()].gapLabel,
          props.error
            ? "border-rose-500/80"
            : "border-slate-300/80 focus-within:border-emerald-400 dark:border-slate-700 dark:focus-within:border-emerald-400",
          isFocused() ? "ring-2 ring-emerald-400/40" : "",
          props.fullWidth ? "w-full" : "w-auto",
          props.disabled || props.readOnly ? "opacity-60" : "cursor-pointer",
          props.class,
        )}
        onFocus={handleFocus}
        onBlur={handleBlur}
        >
        <Select
          class={fieldSelectClass()}
          containerClass={selectContainerClass()}
          inputClass={optionInputClass}
          options={hourOptions()}
          value={hourDisplayValue()}
          placeholder="HH"
          disabled={props.disabled}
          readOnly={props.readOnly}
          size={size()}
          variant={variant()}
          ringEnabled={props.ringEnabled}
          animateRingOnFocus={props.animateRingOnFocus}
          ringVariant={props.ringVariant}
          aria-label={is12Hour() ? "Hour (12-hour)" : "Hour"}
          menuWidth={menuWidth()}
          onFocus={(event) => {
            handleFocus(event);
          }}
          onBlur={handleBlur}
          onValue={commitHour}
        />

        <span class={cx("font-medium text-slate-500 dark:text-slate-300", sizeStyles[size()].gapLabel)}>:</span>

        <Select
          class={fieldSelectClass()}
          containerClass={selectContainerClass()}
          inputClass={optionInputClass}
          options={minuteOptions()}
          value={minuteDisplayValue()}
          placeholder="MM"
          disabled={props.disabled}
          readOnly={props.readOnly}
          size={size()}
          variant={variant()}
          ringEnabled={props.ringEnabled}
          animateRingOnFocus={props.animateRingOnFocus}
          ringVariant={props.ringVariant}
          aria-label="Minute"
          menuWidth={menuWidth()}
          onFocus={(event) => {
            handleFocus(event);
          }}
          onBlur={handleBlur}
          onValue={commitMinute}
      />

        <Show when={hasSeconds()}>
          <span class={cx("font-medium text-slate-500 dark:text-slate-300", sizeStyles[size()].gapLabel)}>:</span>
        </Show>

        <Show when={hasSeconds()}>
          <Select
            class={fieldSelectClass()}
            containerClass={selectContainerClass()}
            inputClass={optionInputClass}
            options={secondOptions()}
            value={secondDisplayValue()}
            placeholder="SS"
            disabled={props.disabled}
            readOnly={props.readOnly}
            size={size()}
            variant={variant()}
            ringEnabled={props.ringEnabled}
            animateRingOnFocus={props.animateRingOnFocus}
            ringVariant={props.ringVariant}
            aria-label="Second"
            menuWidth={menuWidth()}
            onFocus={(event) => {
              handleFocus(event);
            }}
            onBlur={handleBlur}
            onValue={commitSecond}
          />
        </Show>

        <Show when={is12Hour()}>
          <span class={cx("mx-1 h-6 self-center rounded-full border-r border-slate-300/70 dark:border-slate-700")} />
          <Select
            class={periodSelectClass()}
            containerClass={selectContainerClass()}
            inputClass={optionInputClass}
            options={periodOptions}
            value={periodDisplayValue()}
            placeholder="AM/PM"
            disabled={props.disabled}
            readOnly={props.readOnly}
            size={size()}
            variant={variant()}
            ringEnabled={props.ringEnabled}
            animateRingOnFocus={props.animateRingOnFocus}
            ringVariant={props.ringVariant}
            aria-label="AM PM"
            menuWidth={menuWidth()}
            onFocus={(event) => {
              handleFocus(event);
            }}
            onBlur={handleBlur}
            onValue={(next) => changePeriod(next as Period)}
          />
        </Show>
      </div>

      <Show when={props.helperText || props.errorText}>
        <div class={cx("text-xs", props.error ? "text-rose-600 dark:text-rose-300" : "text-slate-500 dark:text-slate-400", props.helperClass)}>
          {props.error ? props.errorText : props.helperText}
        </div>
      </Show>
    </div>
  );
};

export default TimePicker;
