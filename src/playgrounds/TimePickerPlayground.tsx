import { createEffect, createMemo, createSignal } from "solid-js";
import type { Component } from "solid-js";

import TimePicker, {
  normalizeTimeValue,
  type TimePickerProps,
} from "../primitives/TimePicker";
import {
  ringAnimationEnabled,
  ringAnimationOptions,
  ringAnimationVariant,
  type RingAnimationSelection,
} from "./ringAnimationOptions";
import PlaygroundNav from "./PlaygroundNav";
import { cx } from "../utils/cx";

type TimePickerVariant = NonNullable<TimePickerProps["variant"]>;
type TimePickerSize = NonNullable<TimePickerProps["size"]>;

const defaults = {
  value: "12:45:30",
  disabled: false,
  readOnly: false,
  required: false,
  error: false,
  fullWidth: false,
  hour12: false,
  hasSeconds: true,
  darkMode: false,
  size: "md" as TimePickerSize,
  variant: "outlined" as TimePickerVariant,
  ringAnimation: "laser" as RingAnimationSelection,
};

const variantOptions: TimePickerVariant[] = ["outlined", "filled", "standard"];
const sizeOptions: TimePickerSize[] = ["sm", "md", "lg"];

const TimePickerPlayground: Component = () => {
  const [darkMode, setDarkMode] = createSignal(defaults.darkMode);
  const [configValue, setConfigValue] = createSignal(defaults.value);
  const [configDisabled, setConfigDisabled] = createSignal(defaults.disabled);
  const [configReadOnly, setConfigReadOnly] = createSignal(defaults.readOnly);
  const [configRequired, setConfigRequired] = createSignal(defaults.required);
  const [configError, setConfigError] = createSignal(defaults.error);
  const [configFullWidth, setConfigFullWidth] = createSignal(defaults.fullWidth);
  const [configHour12, setConfigHour12] = createSignal(defaults.hour12);
  const [configHasSeconds, setConfigHasSeconds] = createSignal(defaults.hasSeconds);
  const [configSize, setConfigSize] = createSignal<TimePickerSize>(defaults.size);
  const [configVariant, setConfigVariant] =
    createSignal<TimePickerVariant>(defaults.variant);
  const [configRingAnimation, setConfigRingAnimation] = createSignal<RingAnimationSelection>(
    defaults.ringAnimation,
  );
  const [ringApi, setRingApi] = createSignal<
    | {
        pulse: () => void;
        focus: () => void;
        pulseAndFocus: () => void;
      }
    | undefined
  >();

  const previewConfig = createMemo(() => ({
    value: configValue(),
    label: "Start time",
    helperText: "Choose a time for your event.",
    required: configRequired(),
    disabled: configDisabled(),
    readOnly: configReadOnly(),
    error: configError(),
    errorText: configError() ? "Please fix the selected time." : undefined,
    fullWidth: configFullWidth(),
    hour12: configHour12(),
    hasSeconds: configHasSeconds(),
    size: configSize(),
    variant: configVariant(),
    ringEnabled: ringAnimationEnabled(configRingAnimation()),
    ringVariant: ringAnimationVariant(configRingAnimation()),
    animateRingOnFocus: true,
  }));

  createEffect(() => {
    const currentValue = configValue();
    const normalizedValue = normalizeTimeValue(currentValue, {
      hasSeconds: configHasSeconds(),
    });
    if (normalizedValue === currentValue) return;
    setConfigValue(normalizedValue);
  });

  const inspectorPayload = createMemo(() =>
    JSON.stringify({ props: previewConfig(), value: configValue() }, null, 2),
  );

  const resetControls = () => {
    setDarkMode(defaults.darkMode);
    setConfigValue(defaults.value);
    setConfigDisabled(defaults.disabled);
    setConfigReadOnly(defaults.readOnly);
    setConfigRequired(defaults.required);
    setConfigError(defaults.error);
    setConfigFullWidth(defaults.fullWidth);
    setConfigHour12(defaults.hour12);
    setConfigHasSeconds(defaults.hasSeconds);
    setConfigSize(defaults.size);
    setConfigVariant(defaults.variant);
    setConfigRingAnimation(defaults.ringAnimation);
  };

  const controlLabelClass =
    "text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400";
  const controlSelectClass =
    "rounded-xl border border-slate-300/80 bg-white/80 px-3 py-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100";

  const presetValues = [
    { label: "Morning", value: "09:15:00" },
    { label: "Noon", value: "12:00:00" },
    { label: "Evening", value: "18:30:45" },
    { label: "Midnight", value: "00:00:00" },
  ];

  return (
    <div class={cx("min-h-screen", darkMode() ? "dark" : "")}>
      <div class="relative min-h-screen bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
        <div class="relative mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-10">
          <header class="flex flex-col gap-3">
            <div class="flex items-center justify-between">
              <div>
                <div class="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-600 dark:text-emerald-300">
                  Time Picker Lab
                </div>
                <h1 class="font-display text-3xl font-semibold sm:text-4xl">
                  hh:mm:ss time picker, built for Solid
                </h1>
              </div>
              <button
                class="rounded-full border border-slate-200/80 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:text-emerald-600 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200"
                type="button"
                onClick={resetControls}
              >
                Reset
              </button>
            </div>

            <PlaygroundNav currentPath="/time" />
          </header>

          <main class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <section class="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-lg shadow-slate-200/40 dark:border-slate-800/80 dark:bg-slate-900/70 dark:shadow-slate-900/50">
              <div class="mb-6">
                <h2 class="mb-1 text-lg font-semibold">Live preview</h2>
                <p class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {configHour12() ? "12-hour mode" : "24-hour mode"}
                </p>
              </div>

              <div class={cx("w-full", configFullWidth() ? "max-w-none" : "max-w-md")}>
                <TimePicker
                  {...previewConfig()}
                  onRingApi={setRingApi}
                  onValue={setConfigValue}
                />
              </div>

              <div class="mt-4">
                <button
                  class="rounded-lg border border-emerald-300/70 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-400/50 dark:bg-emerald-500/10 dark:text-emerald-200"
                  type="button"
                  onClick={() => ringApi()?.focus()}
                >
                  Focus via API
                </button>
                <button
                  class="ml-2 rounded-lg border border-emerald-300/70 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-400/50 dark:bg-emerald-500/10 dark:text-emerald-200"
                  type="button"
                  onClick={() => ringApi()?.pulse()}
                >
                  Pulse
                </button>
              </div>

              <div class="mt-6 rounded-xl border border-slate-200/80 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/50">
                <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Current value
                </p>
                <p class="font-mono text-sm text-slate-800 dark:text-slate-100">{configValue()}</p>
              </div>
            </section>

            <section class="space-y-4">
              <div class="rounded-3xl border border-slate-200/70 bg-white/80 p-5 shadow-lg shadow-slate-200/40 dark:border-slate-800/80 dark:bg-slate-900/70 dark:shadow-slate-900/50">
                <h2 class="mb-3 font-semibold">Configuration</h2>

                <label class="flex items-center justify-between">
                  <span class={controlLabelClass}>Dark mode</span>
                  <input
                    class="h-4 w-4"
                    type="checkbox"
                    checked={darkMode()}
                    onChange={(event) => setDarkMode(event.currentTarget.checked)}
                  />
                </label>

                <label class="mt-3 flex items-center justify-between">
                  <span class={controlLabelClass}>Disabled</span>
                  <input
                    class="h-4 w-4"
                    type="checkbox"
                    checked={configDisabled()}
                    onChange={(event) => setConfigDisabled(event.currentTarget.checked)}
                  />
                </label>

                <label class="mt-3 flex items-center justify-between">
                  <span class={controlLabelClass}>Read only</span>
                  <input
                    class="h-4 w-4"
                    type="checkbox"
                    checked={configReadOnly()}
                    onChange={(event) => setConfigReadOnly(event.currentTarget.checked)}
                  />
                </label>

                <label class="mt-3 flex items-center justify-between">
                  <span class={controlLabelClass}>Required</span>
                  <input
                    class="h-4 w-4"
                    type="checkbox"
                    checked={configRequired()}
                    onChange={(event) => setConfigRequired(event.currentTarget.checked)}
                  />
                </label>

                <label class="mt-3 flex items-center justify-between">
                  <span class={controlLabelClass}>Error</span>
                  <input
                    class="h-4 w-4"
                    type="checkbox"
                    checked={configError()}
                    onChange={(event) => setConfigError(event.currentTarget.checked)}
                  />
                </label>

                <label class="mt-3 flex items-center justify-between">
                  <span class={controlLabelClass}>12-hour mode</span>
                  <input
                    class="h-4 w-4"
                    type="checkbox"
                    checked={configHour12()}
                    onChange={(event) => setConfigHour12(event.currentTarget.checked)}
                  />
                </label>

                <label class="mt-3 flex items-center justify-between">
                  <span class={controlLabelClass}>Show seconds</span>
                  <input
                    class="h-4 w-4"
                    type="checkbox"
                    checked={configHasSeconds()}
                    onChange={(event) => setConfigHasSeconds(event.currentTarget.checked)}
                  />
                </label>

                <label class="mt-3 flex items-center justify-between">
                  <span class={controlLabelClass}>Full width</span>
                  <input
                    class="h-4 w-4"
                    type="checkbox"
                    checked={configFullWidth()}
                    onChange={(event) => setConfigFullWidth(event.currentTarget.checked)}
                  />
                </label>

                <label class="mt-3 flex items-center justify-between">
                  <span class={controlLabelClass}>Size</span>
                  <select
                    class={controlSelectClass}
                    value={configSize()}
                    onChange={(event) =>
                      setConfigSize(event.currentTarget.value as TimePickerSize)
                    }
                  >
                    {sizeOptions.map((option) => <option value={option}>{option}</option>)}
                  </select>
                </label>

                <label class="mt-3 flex items-center justify-between">
                  <span class={controlLabelClass}>Variant</span>
                  <select
                    class={controlSelectClass}
                    value={configVariant()}
                    onChange={(event) =>
                      setConfigVariant(event.currentTarget.value as TimePickerVariant)
                    }
                  >
                    {variantOptions.map((option) => <option value={option}>{option}</option>)}
                  </select>
                </label>

                <label class="mt-3 flex items-center justify-between">
                  <span class={controlLabelClass}>Ring animation</span>
                  <select
                    class={controlSelectClass}
                    value={configRingAnimation()}
                    onChange={(event) =>
                      setConfigRingAnimation(event.currentTarget.value as RingAnimationSelection)
                    }
                  >
                    {ringAnimationOptions.map((option) => (
                      <option value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div class="rounded-3xl border border-slate-200/70 bg-white/80 p-5 shadow-lg shadow-slate-200/40 dark:border-slate-800/80 dark:bg-slate-900/70 dark:shadow-slate-900/50">
                <h2 class="mb-3 font-semibold">Quick presets</h2>
                <div class="flex flex-wrap gap-2">
                  {presetValues.map((preset) => (
                    <button
                      class="rounded-full border border-slate-200/80 bg-slate-100 px-3 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800/70"
                      type="button"
                      onClick={() => setConfigValue(preset.value)}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div class="rounded-3xl border border-slate-200/70 bg-white/80 p-5 shadow-lg shadow-slate-200/40 dark:border-slate-800/80 dark:bg-slate-900/70 dark:shadow-slate-900/50">
                <h2 class="mb-3 font-semibold">State</h2>
                <p class={controlLabelClass}>Serialized props</p>
                <pre class="mt-2 max-h-44 overflow-auto rounded-lg border border-slate-200/80 bg-slate-50 p-3 text-xs dark:border-slate-700 dark:bg-slate-950/80">
                  {inspectorPayload()}
                </pre>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
};

export default TimePickerPlayground;
