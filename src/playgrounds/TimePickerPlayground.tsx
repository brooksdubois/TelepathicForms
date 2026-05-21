import { createEffect, createMemo, createSignal, onMount } from 'solid-js';
import type { Component } from 'solid-js';

import TimePicker, {
  normalizeTimeValue,
  type TimePickerProps,
} from '../primitives/TimePicker';
import {
  ringAnimationEnabled,
  ringAnimationOptions,
  ringAnimationVariant,
  type RingAnimationSelection,
} from './ringAnimationOptions';
import PlaygroundNav from './PlaygroundNav';
import {
  PlaygroundControlPanel,
  PlaygroundRingButtonClass,
  type PlaygroundControlSection,
} from './shared/PlaygroundControls';
import { cx } from '../utils/cx';
import CodeViewer from '../components/CodeViewer';
import { darkModeStore } from '../darkModeStore';

type TimePickerVariant = NonNullable<TimePickerProps['variant']>;
type TimePickerSize = NonNullable<TimePickerProps['size']>;

const INSPECTOR_AS_PROPS_STORAGE_KEY = 'telepathic-forms-code-viewer-as-props';

const readStoredInspectorAsProps = () => {
  if (typeof window === 'undefined') return false;
  const stored = window.localStorage.getItem(INSPECTOR_AS_PROPS_STORAGE_KEY);

  if (stored === null) return false;

  try {
    return Boolean(JSON.parse(stored));
  } catch {
    return false;
  }
};

const writeStoredInspectorAsProps = (next: boolean) => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(INSPECTOR_AS_PROPS_STORAGE_KEY, JSON.stringify(next));
  }
};

const INSPECTOR_CODE_VIEW_STORAGE_KEY = 'telepathic-forms-code-viewer-object-json-view';

const readStoredInspectorCodeView = () => {
  if (typeof window === 'undefined') return 'object';
  const stored = window.localStorage.getItem(INSPECTOR_CODE_VIEW_STORAGE_KEY);
  return stored === 'json' || stored === 'object' ? stored : 'object';
};

const writeStoredInspectorCodeView = (next: string) => {
  if (next !== 'json' && next !== 'object') return;
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(INSPECTOR_CODE_VIEW_STORAGE_KEY, next);
  }
};

const defaults = {
  value: '12:45:30',
  disabled: false,
  readOnly: false,
  required: false,
  error: false,
  fullWidth: false,
  hour12: false,
  hasSeconds: true,
  darkMode: false,
  size: 'md' as TimePickerSize,
  variant: 'outlined' as TimePickerVariant,
  ringAnimation: 'laser' as RingAnimationSelection,
};

const variantValues: TimePickerVariant[] = ['outlined', 'filled', 'standard'];
const sizeValues: TimePickerSize[] = ['sm', 'md', 'lg'];
const variantOptions = variantValues.map((value) => ({ value, label: value }));
const sizeOptions = sizeValues.map((value) => ({ value, label: value }));

const TimePickerPlayground: Component = () => {
  const darkMode = darkModeStore.isDarkMode;
  const setDarkModeAndPersist = darkModeStore.setDarkMode;

  onMount(() => darkModeStore.initializeDarkMode());
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
    label: 'Start time',
    helperText: 'Choose a time for your event.',
    required: configRequired(),
    disabled: configDisabled(),
    readOnly: configReadOnly(),
    error: configError(),
    errorText: configError() ? 'Please fix the selected time.' : undefined,
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
  const [inspectorCodeView, setInspectorCodeView] = createSignal(readStoredInspectorCodeView());
  const [inspectorAsProps, setInspectorAsProps] = createSignal(readStoredInspectorAsProps());
  const setInspectorAsPropsAndPersist = (next: boolean) => {
    setInspectorAsProps(next);
    writeStoredInspectorAsProps(next);
  };
  const setInspectorCodeViewAndPersist = (next: string) => {
    setInspectorCodeView(next);
    writeStoredInspectorCodeView(next);
  };

  const isInspectorIdentifierKey = (key: string) => /^[$A-Z_][0-9A-Z_$]*$/i.test(key);
  const formatInspectorObjectKey = (key: string) =>
    isInspectorIdentifierKey(key) ? key : JSON.stringify(key);

  const serializeInspectorObjectValue = (value: unknown, level = 0): string => {
    const indent = '  '.repeat(level);
    const childIndent = '  '.repeat(level + 1);

    if (value === null || typeof value === 'string' || typeof value === 'boolean') {
      return JSON.stringify(value);
    }

    if (typeof value === 'number') {
      return Number.isFinite(value) ? String(value) : 'null';
    }

    if (Array.isArray(value)) {
      if (value.length === 0) return '[]';
      const lines = value.map(
        (item) => `${childIndent}${serializeInspectorObjectValue(item, level + 1)},`,
      );
      return '[\n' + lines.join('\n') + '\n' + indent + ']';
    }

    if (typeof value === 'object' && value !== null) {
      const entries = Object.entries(value);
      if (entries.length === 0) return '{}';
      const lines = entries.map(
        ([key, entryValue]) =>
          `${childIndent}${formatInspectorObjectKey(key)}: ${serializeInspectorObjectValue(entryValue, level + 1)},`,
      );
      return '{\n' + lines.join('\n') + '\n' + indent + '}';
    }

    return 'null';
  };

  const inspectorObject = createMemo(() => {
    try {
      const parsed = JSON.parse(inspectorPayload()) as unknown;

      if (
        typeof parsed === 'object' &&
        parsed !== null &&
        !Array.isArray(parsed) &&
        'props' in parsed
      ) {
        return (parsed as { props?: unknown }).props ?? {};
      }

      return parsed;
    } catch {
      return {};
    }
  });

  const inspectorCodeViews = createMemo(() => {
    const rawObject = inspectorObject();
    const objectValue = inspectorAsProps() ? { props: rawObject } : rawObject;
    const dark = darkMode();

    return [
      {
        id: 'object',
        label: 'object',
        code: serializeInspectorObjectValue(objectValue),
        lang: 'js' as const,
        theme: dark ? ('github-dark' as const) : ('snazzy-light' as const),
      },
      {
        id: 'json',
        label: 'json',
        code: JSON.stringify(rawObject, null, 2),
        lang: 'json' as const,
        theme: dark ? ('night-owl' as const) : ('snazzy-light' as const),
      },
    ];
  });


  const controlSections = (): readonly PlaygroundControlSection[] => [
    {
      heading: 'Data',
      controls: [
        {
          kind: 'text',
          label: 'Current value',
          value: configValue,
          set: (next) => setConfigValue(next ?? ''),
          placeholder: configHasSeconds() ? 'HH:MM:SS' : 'HH:MM',
          emptyAsUndefined: false,
        },
      ],
    },
    {
      heading: 'Appearance',
      controls: [
        {
          kind: 'select',
          label: 'Size',
          value: () => configSize(),
          set: (next) => setConfigSize(next as TimePickerSize),
          options: sizeOptions,
        },
        {
          kind: 'select',
          label: 'Variant',
          value: () => configVariant(),
          set: (next) => setConfigVariant(next as TimePickerVariant),
          options: variantOptions,
        },
        {
          kind: 'select',
          label: 'Ring animation',
          value: () => configRingAnimation(),
          set: (next) => setConfigRingAnimation(next as RingAnimationSelection),
          options: ringAnimationOptions,
        },
      ],
    },
    {
      heading: 'Behavior',
      controls: [
        {
          kind: 'checkbox',
          label: 'Disabled',
          value: configDisabled,
          set: setConfigDisabled,
        },
        {
          kind: 'checkbox',
          label: 'Read only',
          value: configReadOnly,
          set: setConfigReadOnly,
        },
        {
          kind: 'checkbox',
          label: 'Required',
          value: configRequired,
          set: setConfigRequired,
        },
        {
          kind: 'checkbox',
          label: 'Error',
          value: configError,
          set: setConfigError,
        },
        {
          kind: 'checkbox',
          label: '12-hour mode',
          value: configHour12,
          set: setConfigHour12,
        },
        {
          kind: 'checkbox',
          label: 'Show seconds',
          value: configHasSeconds,
          set: setConfigHasSeconds,
        },
        {
          kind: 'checkbox',
          label: 'Full width',
          value: configFullWidth,
          set: setConfigFullWidth,
        },
      ],
    },
  ];

  const resetControls = () => {
    setDarkModeAndPersist(defaults.darkMode);
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
    'text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400';
  const controlCheckboxClass =
    'h-4 w-4 rounded border-slate-300 accent-emerald-500 focus:ring-emerald-400';

  const presetValues = [
    { label: 'Morning', value: '09:15:00' },
    { label: 'Noon', value: '12:00:00' },
    { label: 'Evening', value: '18:30:45' },
    { label: 'Midnight', value: '00:00:00' },
  ];

  return (
    <div class={cx('min-h-screen', darkMode() ? 'dark' : '')}>
      <div class="relative min-h-screen bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
        <div class="relative mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-10">
          <header class="flex flex-col gap-3">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div class="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-600 dark:text-emerald-300">
                  Time Picker Lab
                </div>
                <h1 class="font-display text-3xl font-semibold sm:text-4xl">
                  TimePicker, Rebuilt for Solid
                </h1>
              </div>
              <div class="flex flex-col items-end gap-2">
                <PlaygroundNav />
                <label class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  <span>Dark</span>
                  <input
                    type="checkbox"
                    class="h-4 w-4 rounded border-slate-300 accent-emerald-500 focus:ring-emerald-400"
                    checked={darkMode()}
                    onInput={(event) => setDarkModeAndPersist(event.currentTarget.checked)}
                  />
                </label>
              </div>
            </div>
          </header>

          <main class="flex flex-col gap-6">
            <section class="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-lg shadow-slate-200/40 dark:border-slate-800/80 dark:bg-slate-900/70 dark:shadow-slate-900/50">
              <div class="mb-6">
                <h2 class="mb-1 text-lg font-semibold">Live Preview</h2>
                <p class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {configHour12() ? '12-hour mode' : '24-hour mode'}
                </p>
              </div>

              <div
                class={cx(
                  'tf-playground-preview-frame',
                  configFullWidth() ? 'max-w-4xl' : 'max-w-3xl',
                )}
              >
                <TimePicker
                  {...previewConfig()}
                  onRingApi={setRingApi}
                  onValue={setConfigValue}
                />
              </div>

              <div class="mt-4 flex flex-wrap gap-2">
                <button
                  class={cx(PlaygroundRingButtonClass, 'mt-0')}
                  type="button"
                  onClick={() => ringApi()?.focus()}
                >
                  Focus via API
                </button>
                <button
                  class={cx(PlaygroundRingButtonClass, 'mt-0')}
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

              <div class="mt-6 grid min-w-0 gap-6 lg:grid-cols-2 lg:items-stretch">
                <div class="min-w-0 space-y-4">
                  <div class="min-w-0 rounded-2xl border border-slate-200/70 bg-white/70 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/40">
                    <h2 class="mb-3 font-semibold">Configuration</h2>

                    <div class="mt-3">
                      <PlaygroundControlPanel sections={controlSections()} />
                    </div>
                  </div>

                  <div class="min-w-0 rounded-2xl border border-slate-200/70 bg-white/70 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/40">
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
                </div>

                <section class="flex min-h-0 min-w-0 flex-col rounded-2xl border border-slate-200/70 bg-white/70 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/40">
                  <CodeViewer
                    views={inspectorCodeViews()}
                    class="h-96 lg:h-auto"
                    maxHeightClass="max-h-96 lg:max-h-none"
                      defaultView="object"
                      activeViewId={inspectorCodeView()}
                      onActiveViewIdChange={setInspectorCodeViewAndPersist}
                      tabBarEnd={
                        <label class="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                          <input
                            type="checkbox"
                            class="h-4 w-4 rounded border-slate-300 accent-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                            checked={inspectorAsProps()}
                            disabled={inspectorCodeView() === 'json'}
                            onInput={(event) => setInspectorAsPropsAndPersist(event.currentTarget.checked)}
                          />
                          <span>as props</span>
                        </label>
                      }
                      showCopyButton
                      showLineNumbers={false}
                  />
                </section>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
};

export default TimePickerPlayground;
