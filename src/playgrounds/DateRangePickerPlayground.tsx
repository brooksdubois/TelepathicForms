import { For, Show, createEffect, createMemo, createSignal } from 'solid-js';
import type { Component } from 'solid-js';

import DateRangePicker from '../primitives/DateRangePicker';
import type { DateRangeValue } from '../primitives/DateRangePicker';
import PlaygroundNav from '../playgrounds/PlaygroundNav';
import { cx } from '../utils/cx';

type ChangeCtx = {
  source: string;
  value: DateRangeValue;
};

const defaults = {
  darkMode: false,
  value: null as DateRangeValue,
  disabled: false,
  readOnly: false,
  required: false,
  error: false,
  clearable: true,
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
  const [darkMode, setDarkMode] = createSignal(defaults.darkMode);

  const [configValue, setConfigValue] = createSignal<DateRangeValue>(defaults.value);
  const [configDisabled, setConfigDisabled] = createSignal(defaults.disabled);
  const [configReadOnly, setConfigReadOnly] = createSignal(defaults.readOnly);
  const [configRequired, setConfigRequired] = createSignal(defaults.required);
  const [configError, setConfigError] = createSignal(defaults.error);
  const [configClearable, setConfigClearable] = createSignal(defaults.clearable);
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
    setDarkMode(defaults.darkMode);
    setConfigValue(defaults.value);
    setConfigDisabled(defaults.disabled);
    setConfigReadOnly(defaults.readOnly);
    setConfigRequired(defaults.required);
    setConfigError(defaults.error);
    setConfigClearable(defaults.clearable);
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

  const controlLabelClass = 'text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400';
  const controlInputClass = 'w-full rounded-xl border border-slate-200/80 bg-white/80 px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/40 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100';
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
            <div class="flex items-center justify-between">
              <div>
                <div class="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-600 dark:text-emerald-300">
                  Solid DateRangePicker Lab
                </div>
                <h1 class="font-display text-3xl font-semibold sm:text-4xl">
                  Dual-month range picker for Solid
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
          </header>

          <main class="flex flex-col gap-6">
            {/* Live preview + controls */}
            <section class="animate-rise rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-lg shadow-slate-200/40 dark:border-slate-800/80 dark:bg-slate-900/70 dark:shadow-slate-900/50">
              <div class="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 class="font-display text-lg font-semibold">Live preview</h2>
                  <div class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Dual-month calendar with range selection
                  </div>
                </div>
                <div class="flex flex-col items-end gap-2">
                  <PlaygroundNav currentPath="/date-range" />
                  <label class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    <span>Dark</span>
                    <input
                      type="checkbox"
                      class={controlCheckboxClass}
                      checked={darkMode()}
                      onInput={(e) => setDarkMode(e.currentTarget.checked)}
                    />
                  </label>
                </div>
              </div>

              <div class="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr),320px]">
                {/* Preview */}
                <div class="flex flex-col gap-3">
                  <div class="max-w-xl">
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
                <div class="rounded-2xl border border-slate-200/70 bg-white/70 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/40">
                  <div class="flex flex-col gap-4">
                    {/* Data */}
                    <div class="grid gap-3">
                      <div class={controlLabelClass}>Data</div>
                      <label class="flex flex-col gap-2">
                        <span class={controlLabelClass}>Start date</span>
                        <input
                          class={controlInputClass}
                          value={configValue()?.start ?? ''}
                          onInput={(e) => {
                            const start = e.currentTarget.value;
                            const end = configValue()?.end ?? '';
                            if (start && end) setConfigValue({ start, end });
                            else if (start) setConfigValue({ start, end: start });
                            else setConfigValue(null);
                          }}
                          placeholder="YYYY-MM-DD"
                        />
                      </label>
                      <label class="flex flex-col gap-2">
                        <span class={controlLabelClass}>End date</span>
                        <input
                          class={controlInputClass}
                          value={configValue()?.end ?? ''}
                          onInput={(e) => {
                            const end = e.currentTarget.value;
                            const start = configValue()?.start ?? '';
                            if (start && end) setConfigValue({ start, end });
                            else setConfigValue(null);
                          }}
                          placeholder="YYYY-MM-DD"
                        />
                      </label>
                      <button
                        type="button"
                        class={cx(
                          'rounded-xl border border-slate-200/80 bg-white/80 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-700 shadow-sm transition',
                          'hover:-translate-y-0.5 hover:border-emerald-300 hover:text-emerald-600',
                          'dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200',
                        )}
                        onClick={() => {
                          setConfigValue(null);
                          setLastChangeCtx({ source: 'clear', value: null });
                        }}
                      >
                        Clear value
                      </button>
                    </div>

                    {/* Constraints */}
                    <div class="grid gap-3">
                      <div class={controlLabelClass}>Constraints</div>
                      <label class="flex flex-col gap-2">
                        <span class={controlLabelClass}>Min date</span>
                        <input
                          class={controlInputClass}
                          value={configMinDate() ?? ''}
                          onInput={(e) => setConfigMinDate(e.currentTarget.value || undefined)}
                          placeholder="YYYY-MM-DD"
                        />
                      </label>
                      <label class="flex flex-col gap-2">
                        <span class={controlLabelClass}>Max date</span>
                        <input
                          class={controlInputClass}
                          value={configMaxDate() ?? ''}
                          onInput={(e) => setConfigMaxDate(e.currentTarget.value || undefined)}
                          placeholder="YYYY-MM-DD"
                        />
                      </label>
                      <label class="flex items-center justify-between text-sm text-slate-700 dark:text-slate-200">
                        <span>Disable past</span>
                        <input type="checkbox" class={controlCheckboxClass} checked={configDisablePast()} onInput={(e) => setConfigDisablePast(e.currentTarget.checked)} />
                      </label>
                      <label class="flex items-center justify-between text-sm text-slate-700 dark:text-slate-200">
                        <span>Disable future</span>
                        <input type="checkbox" class={controlCheckboxClass} checked={configDisableFuture()} onInput={(e) => setConfigDisableFuture(e.currentTarget.checked)} />
                      </label>
                      <label class="flex items-center justify-between text-sm text-slate-700 dark:text-slate-200">
                        <span>Disable weekends</span>
                        <input type="checkbox" class={controlCheckboxClass} checked={configDisableWeekends()} onInput={(e) => setConfigDisableWeekends(e.currentTarget.checked)} />
                      </label>
                    </div>

                    {/* Behavior */}
                    <div class="grid gap-3">
                      <div class={controlLabelClass}>Behavior</div>
                      <label class="flex items-center justify-between text-sm text-slate-700 dark:text-slate-200">
                        <span>Open on focus</span>
                        <input type="checkbox" class={controlCheckboxClass} checked={configOpenOnFocus()} onInput={(e) => setConfigOpenOnFocus(e.currentTarget.checked)} />
                      </label>
                      <label class="flex items-center justify-between text-sm text-slate-700 dark:text-slate-200">
                        <span>Close on select</span>
                        <input type="checkbox" class={controlCheckboxClass} checked={configCloseOnSelect()} onInput={(e) => setConfigCloseOnSelect(e.currentTarget.checked)} />
                      </label>
                      <label class="flex items-center justify-between text-sm text-slate-700 dark:text-slate-200">
                        <span>Clearable</span>
                        <input type="checkbox" class={controlCheckboxClass} checked={configClearable()} onInput={(e) => setConfigClearable(e.currentTarget.checked)} />
                      </label>
                    </div>

                    {/* State */}
                    <div class="grid gap-3">
                      <div class={controlLabelClass}>State</div>
                      <label class="flex items-center justify-between text-sm text-slate-700 dark:text-slate-200">
                        <span>Disabled</span>
                        <input type="checkbox" class={controlCheckboxClass} checked={configDisabled()} onInput={(e) => setConfigDisabled(e.currentTarget.checked)} />
                      </label>
                      <label class="flex items-center justify-between text-sm text-slate-700 dark:text-slate-200">
                        <span>Read only</span>
                        <input type="checkbox" class={controlCheckboxClass} checked={configReadOnly()} onInput={(e) => setConfigReadOnly(e.currentTarget.checked)} />
                      </label>
                      <label class="flex items-center justify-between text-sm text-slate-700 dark:text-slate-200">
                        <span>Required</span>
                        <input type="checkbox" class={controlCheckboxClass} checked={configRequired()} onInput={(e) => setConfigRequired(e.currentTarget.checked)} />
                      </label>
                      <label class="flex items-center justify-between text-sm text-slate-700 dark:text-slate-200">
                        <span>Error</span>
                        <input type="checkbox" class={controlCheckboxClass} checked={configError()} onInput={(e) => setConfigError(e.currentTarget.checked)} />
                      </label>
                    </div>
                  </div>
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

            {/* Inspector */}
            <section class="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-lg shadow-slate-200/40 dark:border-slate-800/80 dark:bg-slate-900/70 dark:shadow-slate-900/50">
              <h2 class="font-display text-lg font-semibold">Inspector</h2>
              <div class="mt-4 rounded-2xl bg-slate-950/95 p-4 text-xs text-slate-200">
                <pre class="whitespace-pre-wrap">{inspectorSnapshot()}</pre>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
};

export default DateRangePickerPlayground;
