import { For, Show, createMemo, createSignal, onMount } from 'solid-js';
import type { Component } from 'solid-js';

import DateRangePicker from '../primitives/DateRangePicker';
import type { DateRangeValue } from '../primitives/DateRangePicker';
import PlaygroundNav from '../playgrounds/PlaygroundNav';
import {
  ringAnimationEnabled,
  ringAnimationOptions,
  ringAnimationVariant,
  type RingAnimationSelection,
} from './ringAnimationOptions';
import {
  PlaygroundControlPanel,
  PlaygroundRingButtonClass,
  type PlaygroundControlSection,
} from './shared/PlaygroundControls';
import { cx } from '../utils/cx';
import CodeViewer from '../components/CodeViewer';
import { darkModeStore } from '../darkModeStore';

type ChangeCtx = {
  source: string;
  value: DateRangeValue;
};

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
  darkMode: false,
  value: null as DateRangeValue,
  disabled: false,
  readOnly: false,
  required: false,
  error: false,
  clearable: true,
  ringAnimation: 'laser' as RingAnimationSelection,
  openOnFocus: true,
  closeOnSelect: true,
  disablePast: false,
  disableFuture: false,
  disableWeekends: false,
  minDate: undefined as string | undefined,
  maxDate: undefined as string | undefined,
};

const ExampleCard: Component<{
  title: string;
  description?: string;
  pickerProps: Record<string, any>;
  initialValue?: DateRangeValue;
}> = (props) => {
  const [value, setValue] = createSignal<DateRangeValue>(props.initialValue ?? null);

  return (
    <div class="flex flex-col gap-3 rounded-2xl border border-slate-200/70 bg-white/80 p-4 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/60">
      <div class="flex flex-col gap-0.5">
        <div class="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {props.title}
        </div>
        <Show when={props.description}>
          <div class="text-[11px] text-slate-400 dark:text-slate-500">{props.description}</div>
        </Show>
      </div>
      <DateRangePicker
        {...props.pickerProps}
        value={value()}
        onChange={(v) => setValue(v)}
      />
      <div class="rounded-lg bg-slate-50/80 px-2 py-1.5 text-[11px] font-mono text-slate-500 dark:bg-slate-950/40 dark:text-slate-400">
        {value() ? `${value()!.start} → ${value()!.end}` : 'null'}
      </div>
    </div>
  );
};

const DateRangePickerPlayground: Component = () => {
  const darkMode = darkModeStore.isDarkMode;
  const setDarkModeAndPersist = darkModeStore.setDarkMode;

  onMount(() => darkModeStore.initializeDarkMode());

  const [configValue, setConfigValue] = createSignal<DateRangeValue>(defaults.value);
  const [configDisabled, setConfigDisabled] = createSignal(defaults.disabled);
  const [configReadOnly, setConfigReadOnly] = createSignal(defaults.readOnly);
  const [configRequired, setConfigRequired] = createSignal(defaults.required);
  const [configError, setConfigError] = createSignal(defaults.error);
  const [configClearable, setConfigClearable] = createSignal(defaults.clearable);
  const [configRingAnimation, setConfigRingAnimation] = createSignal<RingAnimationSelection>(
    defaults.ringAnimation,
  );
  const [configOpenOnFocus, setConfigOpenOnFocus] = createSignal(defaults.openOnFocus);
  const [configCloseOnSelect, setConfigCloseOnSelect] = createSignal(defaults.closeOnSelect);
  const [configDisablePast, setConfigDisablePast] = createSignal(defaults.disablePast);
  const [configDisableFuture, setConfigDisableFuture] = createSignal(defaults.disableFuture);
  const [configDisableWeekends, setConfigDisableWeekends] = createSignal(defaults.disableWeekends);
  const [configMinDate, setConfigMinDate] = createSignal<string | undefined>(defaults.minDate);
  const [configMaxDate, setConfigMaxDate] = createSignal<string | undefined>(defaults.maxDate);

  const [lastChangeCtx, setLastChangeCtx] = createSignal<ChangeCtx | undefined>(undefined);
  const [lastOpenState, setLastOpenState] = createSignal(false);

  const handlePreviewChange = (value: DateRangeValue, ctx?: { source: string }) => {
    setConfigValue(value);
    setLastChangeCtx({ source: ctx?.source ?? 'unknown', value });
  };

  const resetControls = () => {
    setDarkModeAndPersist(defaults.darkMode);
    setConfigValue(defaults.value);
    setConfigDisabled(defaults.disabled);
    setConfigReadOnly(defaults.readOnly);
    setConfigRequired(defaults.required);
    setConfigError(defaults.error);
    setConfigClearable(defaults.clearable);
    setConfigRingAnimation(defaults.ringAnimation);
    setConfigOpenOnFocus(defaults.openOnFocus);
    setConfigCloseOnSelect(defaults.closeOnSelect);
    setConfigDisablePast(defaults.disablePast);
    setConfigDisableFuture(defaults.disableFuture);
    setConfigDisableWeekends(defaults.disableWeekends);
    setConfigMinDate(defaults.minDate);
    setConfigMaxDate(defaults.maxDate);
    setLastChangeCtx(undefined);
    setLastOpenState(false);
  };

  const inspectorSnapshot = createMemo(() =>
    JSON.stringify(
      {
        value: configValue(),
        props: {
          label: 'Travel dates',
          helperText: 'Pick a start and end date from the calendar.',
          disabled: configDisabled(),
          readOnly: configReadOnly(),
          required: configRequired(),
          error: configError(),
          clearable: configClearable(),
          ringEnabled: ringAnimationEnabled(configRingAnimation()),
          ringVariant: ringAnimationVariant(configRingAnimation()),
          openOnFocus: configOpenOnFocus(),
          closeOnSelect: configCloseOnSelect(),
          minDate: configMinDate(),
          maxDate: configMaxDate(),
          disablePast: configDisablePast(),
          disableFuture: configDisableFuture(),
          disableWeekends: configDisableWeekends(),
        },
        derived: {
          lastOpenState: lastOpenState(),
          lastChangeCtx: lastChangeCtx(),
        },
      },
      null,
      2,
    ),
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
      const parsed = JSON.parse(inspectorSnapshot()) as unknown;

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


  const setRangeStart = (next: string | undefined) => {
    const start = next?.trim() ?? '';
    const end = configValue()?.end ?? '';

    if (!start) {
      setConfigValue(null);
      return;
    }

    setConfigValue({ start, end: end || start });
  };

  const setRangeEnd = (next: string | undefined) => {
    const end = next?.trim() ?? '';
    const start = configValue()?.start ?? '';

    if (!start || !end) {
      setConfigValue(null);
      return;
    }

    setConfigValue({ start, end });
  };

  const controlSections = (): readonly PlaygroundControlSection[] => [
    {
      heading: 'Data',
      controls: [
        {
          kind: 'text',
          label: 'Start date',
          value: () => configValue()?.start ?? undefined,
          set: setRangeStart,
          placeholder: 'YYYY-MM-DD',
        },
        {
          kind: 'text',
          label: 'End date',
          value: () => configValue()?.end ?? undefined,
          set: setRangeEnd,
          placeholder: 'YYYY-MM-DD',
        },
      ],
    },
    {
      heading: 'Constraints',
      controls: [
        {
          kind: 'text',
          label: 'Min date',
          value: configMinDate,
          set: setConfigMinDate,
          placeholder: 'YYYY-MM-DD',
        },
        {
          kind: 'text',
          label: 'Max date',
          value: configMaxDate,
          set: setConfigMaxDate,
          placeholder: 'YYYY-MM-DD',
        },
        {
          kind: 'checkbox',
          label: 'Disable past',
          value: configDisablePast,
          set: setConfigDisablePast,
        },
        {
          kind: 'checkbox',
          label: 'Disable future',
          value: configDisableFuture,
          set: setConfigDisableFuture,
        },
        {
          kind: 'checkbox',
          label: 'Disable weekends',
          value: configDisableWeekends,
          set: setConfigDisableWeekends,
        },
      ],
    },
    {
      heading: 'Behavior',
      controls: [
        {
          kind: 'checkbox',
          label: 'Clearable',
          value: configClearable,
          set: setConfigClearable,
        },
        {
          kind: 'select',
          label: 'Ring animation',
          value: () => configRingAnimation(),
          set: (next) => setConfigRingAnimation(next as RingAnimationSelection),
          options: ringAnimationOptions,
        },
        {
          kind: 'checkbox',
          label: 'Open on focus',
          value: configOpenOnFocus,
          set: setConfigOpenOnFocus,
        },
        {
          kind: 'checkbox',
          label: 'Close on select',
          value: configCloseOnSelect,
          set: setConfigCloseOnSelect,
        },
      ],
    },
    {
      heading: 'State',
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
      ],
    },
  ];

  const examples: Array<{
    title: string;
    description?: string;
    pickerProps: Record<string, any>;
    initialValue?: DateRangeValue;
  }> = [
    {
      title: 'Default',
      description: 'Basic range picker with clear.',
      pickerProps: { label: 'Date range', clearable: true, helperText: 'Click to select a range.' },
    },
    {
      title: 'Pre-selected range',
      description: 'Starts with a value.',
      pickerProps: { label: 'Sprint window', clearable: true, helperText: 'March sprint window.' },
      initialValue: { start: '2026-03-02', end: '2026-03-13' },
    },
    {
      title: 'Required',
      pickerProps: { label: 'Booking dates', required: true, helperText: 'Required for booking.' },
    },
    {
      title: 'Disabled',
      pickerProps: { label: 'Locked period', disabled: true, helperText: 'Cannot be changed.' },
      initialValue: { start: '2026-01-10', end: '2026-01-20' },
    },
    {
      title: 'Error state',
      pickerProps: { label: 'Validation error', error: true, helperText: 'Dates overlap with existing booking.' },
      initialValue: { start: '2026-02-01', end: '2026-02-14' },
    },
    {
      title: 'Disable past dates',
      description: 'Only future dates are selectable.',
      pickerProps: { label: 'Upcoming trip', disablePast: true, clearable: true, helperText: 'Future dates only.' },
    },
    {
      title: 'Disable weekends',
      pickerProps: { label: 'Business period', disableWeekends: true, clearable: true, helperText: 'Weekdays only.' },
    },
    {
      title: 'Min/Max window',
      description: 'Constrained to March 2026.',
      pickerProps: {
        label: 'Conference dates',
        minDate: '2026-03-01',
        maxDate: '2026-03-31',
        clearable: true,
        helperText: 'Limited to March 2026.',
      },
    },
    {
      title: 'Read only',
      pickerProps: { label: 'Approved leave', readOnly: true, helperText: 'Approved by manager.' },
      initialValue: { start: '2026-04-07', end: '2026-04-11' },
    },
    {
      title: 'No ring',
      description: 'Ring animation disabled.',
      pickerProps: { label: 'Plain range', ringEnabled: false, clearable: true, helperText: 'No laser ring effect.' },
    },
  ];

  const controlCheckboxClass = 'h-4 w-4 rounded border-slate-300 accent-emerald-500 focus:ring-emerald-400';

  return (
    <div class={cx('min-h-screen', darkMode() ? 'dark' : '')}>
      <div class="relative min-h-screen bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
        {/* Background blobs */}
        <div class="pointer-events-none absolute inset-0 overflow-hidden">
          <div class="absolute -left-32 top-20 h-72 w-72 rounded-full bg-emerald-200/60 blur-3xl dark:bg-emerald-500/10" />
          <div class="absolute right-10 top-0 h-96 w-96 rounded-full bg-amber-200/50 blur-3xl dark:bg-amber-500/10" />
          <div class="absolute bottom-10 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-sky-200/50 blur-3xl dark:bg-sky-500/10" />
          <div class="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.08),_transparent_55%)] dark:bg-[radial-gradient(circle_at_top,_rgba(226,232,240,0.06),_transparent_55%)]" />
        </div>

        <div class="relative mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-10">
          {/* Header */}
          <header class="flex flex-col gap-4">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div class="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-600 dark:text-emerald-300">
                  Solid DateRangePicker Lab
                </div>
                <h1 class="font-display text-3xl font-semibold sm:text-4xl">
                  DateRangePicker, Rebuilt for Solid
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
            {/* Live Preview + controls */}
            <section class="animate-rise rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-lg shadow-slate-200/40 dark:border-slate-800/80 dark:bg-slate-900/70 dark:shadow-slate-900/50">
              <div class="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 class="font-display text-lg font-semibold">Live Preview</h2>
                  <div class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Dual-month calendar with range selection
                  </div>
                </div>
              </div>

              <div class="mt-6 flex flex-col gap-6">
                {/* Preview */}
                <div class="flex flex-col gap-3">
                  <div class="tf-playground-preview-frame max-w-3xl">
                    <DateRangePicker
                      label="Travel dates"
                      helperText="Pick a start and end date from the calendar."
                      value={configValue()}
                      onChange={handlePreviewChange}
                      disabled={configDisabled()}
                      readOnly={configReadOnly()}
                      required={configRequired()}
                      error={configError()}
                      clearable={configClearable()}
                      ringEnabled={ringAnimationEnabled(configRingAnimation())}
                      ringVariant={ringAnimationVariant(configRingAnimation())}
                      openOnFocus={configOpenOnFocus()}
                      closeOnSelect={configCloseOnSelect()}
                      minDate={configMinDate()}
                      maxDate={configMaxDate()}
                      disablePast={configDisablePast()}
                      disableFuture={configDisableFuture()}
                      disableWeekends={configDisableWeekends()}
                      onOpenChange={setLastOpenState}
                    />
                  </div>

                  <div class="rounded-2xl border border-slate-200/70 bg-slate-50/90 p-3 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-300">
                    <div>
                      Start: <span class="font-mono">{configValue()?.start ?? 'null'}</span>
                    </div>
                    <div>
                      End: <span class="font-mono">{configValue()?.end ?? 'null'}</span>
                    </div>
                    <div>
                      Last source: <span class="font-mono">{lastChangeCtx()?.source ?? 'n/a'}</span>
                    </div>
                    <div>
                      Popover open: <span class="font-mono">{String(lastOpenState())}</span>
                    </div>
                  </div>
                </div>

                {/* Controls panel */}
                <div class="grid gap-6 lg:grid-cols-2 lg:items-stretch">
                  <div class="h-full rounded-2xl border border-slate-200/70 bg-white/70 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/40">
                  <div class="flex flex-col gap-4">
                    <PlaygroundControlPanel sections={controlSections()} />
                    <button
                      type="button"
                      class={cx(PlaygroundRingButtonClass, 'mt-0')}
                      onClick={() => {
                        setConfigValue(null);
                        setLastChangeCtx({ source: 'clear', value: null });
                      }}
                    >
                      Clear value
                    </button>
                  </div>
                  </div>
                  <section class="flex min-h-0 flex-col rounded-2xl border border-slate-200/70 bg-white/70 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/40">
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
              </div>
            </section>

            {/* Examples grid */}
              <section class="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-lg shadow-slate-200/40 dark:border-slate-800/80 dark:bg-slate-900/70 dark:shadow-slate-900/50">
              <h2 class="font-display text-lg font-semibold">Examples grid</h2>
              <div class="mt-5 grid gap-4 md:grid-cols-2">
                <For each={examples}>
                  {(item) => (
                    <ExampleCard
                      title={item.title}
                      description={item.description}
                      pickerProps={item.pickerProps}
                      initialValue={item.initialValue}
                    />
                  )}
                </For>
              </div>
            </section>

          </main>
        </div>
      </div>
    </div>
  );
};

export default DateRangePickerPlayground;
