import { For, Show, createEffect, createMemo, createSignal } from 'solid-js';
import type { Component } from 'solid-js';
import { Temporal } from '@js-temporal/polyfill';

import DatePicker, { type DatePickerProps } from '../primitives/DatePicker';
import PlaygroundNav from '../playgrounds/PlaygroundNav';
import { cx } from '../utils/cx';

type DateFormat = 'MM-DD-YYYY' | 'YYYY-MM-DD' | 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'DD.MM.YYYY';
type DisableMode = 'none' | 'oddDays' | 'monthEnd' | 'weekendsOnly';

type ChangeCtx = {
  source: string;
  value: string | null;
};

const formatPresets: DateFormat[] = [
  'MM-DD-YYYY',
  'YYYY-MM-DD',
  'DD/MM/YYYY',
  'MM/DD/YYYY',
  'DD.MM.YYYY',
];

const disableModeOptions: Array<{ value: DisableMode; label: string }> = [
  { value: 'none', label: 'None' },
  { value: 'oddDays', label: 'Odd days' },
  { value: 'monthEnd', label: 'Month end' },
  { value: 'weekendsOnly', label: 'Weekends only' },
];

const defaults = {
  darkMode: false,
  value: '02-10-2026' as string | null,
  valueFormat: 'MM-DD-YYYY' as DateFormat,
  inputFormat: 'MM-DD-YYYY' as DateFormat,
  placeholder: undefined as string | undefined,
  placeholderTouched: false,

  disabled: false,
  readOnly: false,
  required: false,
  error: false,
  fullWidth: false,
  clearable: true,
  openOnFocus: true,
  closeOnSelect: true,

  minDate: undefined as string | undefined,
  maxDate: undefined as string | undefined,
  disablePast: false,
  disableFuture: false,
  disableWeekends: false,
  shouldDisableMode: 'none' as DisableMode,
};

const pad2 = (value: number) => value.toString().padStart(2, '0');

const parseISO = (text: string): Temporal.PlainDate | null => {
  try {
    return Temporal.PlainDate.from(text.trim());
  } catch {
    return null;
  }
};

const parseByFormat = (text: string, format: DateFormat): Temporal.PlainDate | null => {
  const source = text.trim();
  if (!source) return null;

  const tokens: Array<'YYYY' | 'MM' | 'DD'> = [];
  let regex = '^';

  for (let i = 0; i < format.length; ) {
    if (format.startsWith('YYYY', i)) {
      regex += '(\\d{4})';
      tokens.push('YYYY');
      i += 4;
      continue;
    }

    if (format.startsWith('MM', i)) {
      regex += '(\\d{2})';
      tokens.push('MM');
      i += 2;
      continue;
    }

    if (format.startsWith('DD', i)) {
      regex += '(\\d{2})';
      tokens.push('DD');
      i += 2;
      continue;
    }

    const ch = format[i].replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');
    regex += ch;
    i += 1;
  }

  regex += '$';
  const match = new RegExp(regex).exec(source);
  if (!match) return null;

  let year = 0;
  let month = 0;
  let day = 0;

  for (let i = 0; i < tokens.length; i += 1) {
    const value = Number(match[i + 1]);
    if (tokens[i] === 'YYYY') year = value;
    if (tokens[i] === 'MM') month = value;
    if (tokens[i] === 'DD') day = value;
  }

  try {
    return Temporal.PlainDate.from({ year, month, day });
  } catch {
    return null;
  }
};

const parseAny = (text: string, prioritizedFormats: DateFormat[]): Temporal.PlainDate | null => {
  const value = text.trim();
  if (!value) return null;

  for (const format of prioritizedFormats) {
    const parsed = parseByFormat(value, format);
    if (parsed) return parsed;
  }

  return parseISO(value);
};

const formatByFormat = (date: Temporal.PlainDate, format: DateFormat) =>
  format
    .replace(/YYYY/g, date.year.toString().padStart(4, '0'))
    .replace(/MM/g, pad2(date.month))
    .replace(/DD/g, pad2(date.day));

const normalizeValueForFormat = (
  value: string | null,
  targetFormat: DateFormat,
  sourceFormats: DateFormat[],
): string | null => {
  if (!value) return null;
  const parsed = parseAny(value, sourceFormats);
  if (!parsed) return null;
  return formatByFormat(parsed, targetFormat);
};

const toIsoDate = (value: string | null, prioritizedFormats: DateFormat[]) => {
  if (!value) return null;
  const parsed = parseAny(value, prioritizedFormats);
  if (!parsed) return null;
  return parsed.toString();
};

const ExampleCard: Component<{
  title: string;
  props: Omit<DatePickerProps, 'value' | 'onChange' | 'parse' | 'format' | 'inputMask'> & {
    valueFormat?: DateFormat;
    inputFormat?: DateFormat;
  };
  initialValue?: string | null;
}> = (props) => {
  const valueFormat = () => props.props.valueFormat ?? 'MM-DD-YYYY';
  const inputFormat = () => props.props.inputFormat ?? 'MM-DD-YYYY';

  const [value, setValue] = createSignal<string | null>(props.initialValue ?? null);

  const parseForPicker = (text: string) =>
    parseAny(text, [inputFormat(), valueFormat(), ...formatPresets]);

  const handleChange: DatePickerProps['onChange'] = (next, ctx) => {
    if (!next) {
      setValue(null);
      return;
    }

    const parsed = parseISO(next) ?? parseAny(next, [inputFormat(), valueFormat(), ...formatPresets]);
    setValue(parsed ? formatByFormat(parsed, valueFormat()) : null);

    if (ctx?.source === 'clear') {
      setValue(null);
    }
  };

  return (
    <div class="flex flex-col gap-3 rounded-2xl border border-slate-200/70 bg-white/80 p-4 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/60">
      <div class="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {props.title}
      </div>
      <DatePicker
        {...props.props}
        value={value()}
        onChange={handleChange}
        format={(date) => formatByFormat(date, inputFormat())}
        parse={parseForPicker}
        inputMask={inputFormat()}
        placeholder={props.props.placeholder ?? inputFormat()}
      />
    </div>
  );
};

const DatePickerPlayground: Component = () => {
  const [darkMode, setDarkMode] = createSignal(defaults.darkMode);

  const [configValue, setConfigValue] = createSignal<string | null>(defaults.value);
  const [configValueFormat, setConfigValueFormat] = createSignal<DateFormat>(
    defaults.valueFormat,
  );
  const [configInputFormat, setConfigInputFormat] = createSignal<DateFormat>(
    defaults.inputFormat,
  );
  const [configPlaceholder, setConfigPlaceholder] = createSignal<string | undefined>(
    defaults.placeholder,
  );
  const [configPlaceholderTouched, setConfigPlaceholderTouched] = createSignal(
    defaults.placeholderTouched,
  );

  const [configDisabled, setConfigDisabled] = createSignal(defaults.disabled);
  const [configReadOnly, setConfigReadOnly] = createSignal(defaults.readOnly);
  const [configRequired, setConfigRequired] = createSignal(defaults.required);
  const [configError, setConfigError] = createSignal(defaults.error);
  const [configFullWidth, setConfigFullWidth] = createSignal(defaults.fullWidth);

  const [configClearable, setConfigClearable] = createSignal(defaults.clearable);
  const [configOpenOnFocus, setConfigOpenOnFocus] = createSignal(defaults.openOnFocus);
  const [configCloseOnSelect, setConfigCloseOnSelect] = createSignal(defaults.closeOnSelect);

  const [configMinDate, setConfigMinDate] = createSignal<string | undefined>(defaults.minDate);
  const [configMaxDate, setConfigMaxDate] = createSignal<string | undefined>(defaults.maxDate);
  const [configDisablePast, setConfigDisablePast] = createSignal(defaults.disablePast);
  const [configDisableFuture, setConfigDisableFuture] = createSignal(defaults.disableFuture);
  const [configDisableWeekends, setConfigDisableWeekends] = createSignal(defaults.disableWeekends);
  const [configShouldDisableMode, setConfigShouldDisableMode] = createSignal<DisableMode>(
    defaults.shouldDisableMode,
  );

  const [lastChangeCtx, setLastChangeCtx] = createSignal<ChangeCtx | undefined>(undefined);
  const [lastOpenState, setLastOpenState] = createSignal(false);

  const resolvedPlaceholder = createMemo(() =>
    configPlaceholderTouched() ? configPlaceholder() : configInputFormat(),
  );

  const previewWrapperClass = createMemo(() =>
    cx('transition-all duration-200', configFullWidth() ? 'w-full' : 'max-w-xl'),
  );

  const parseForPicker = (text: string) =>
    parseAny(text, [configInputFormat(), configValueFormat(), ...formatPresets]);

  const handleValueFormatChange = (nextFormat: DateFormat) => {
    const next = normalizeValueForFormat(
      configValue(),
      nextFormat,
      [configValueFormat(), configInputFormat(), ...formatPresets],
    );

    setConfigValue(next);
    setConfigValueFormat(nextFormat);
  };

  const handleInputFormatChange = (nextFormat: DateFormat) => {
    const next = normalizeValueForFormat(
      configValue(),
      configValueFormat(),
      [configInputFormat(), configValueFormat(), ...formatPresets],
    );

    setConfigValue(next);
    setConfigInputFormat(nextFormat);
  };

  const derivedShouldDisableDate = createMemo<DatePickerProps['shouldDisableDate'] | undefined>(
    () => {
      const mode = configShouldDisableMode();
      if (mode === 'none') return undefined;

      return (isoDate: string) => {
        const parsed = parseISO(isoDate);
        if (!parsed) return false;

        if (mode === 'oddDays') return parsed.day % 2 === 1;
        if (mode === 'monthEnd') return parsed.day === parsed.daysInMonth;
        if (mode === 'weekendsOnly') return parsed.dayOfWeek === 6 || parsed.dayOfWeek === 7;

        return false;
      };
    },
  );

  const previewValueAsIso = createMemo(() =>
    toIsoDate(configValue(), [configValueFormat(), configInputFormat(), ...formatPresets]),
  );

  const inspectorSnapshot = createMemo(() =>
    JSON.stringify(
      {
        value: configValue(),
        valueAsIso: previewValueAsIso(),
        props: {
          label: 'Appointment date',
          helperText: 'Type a date or pick from the calendar popover.',
          placeholder: resolvedPlaceholder(),
          valueFormat: configValueFormat(),
          inputFormat: configInputFormat(),
          disabled: configDisabled(),
          readOnly: configReadOnly(),
          required: configRequired(),
          error: configError(),
          fullWidth: configFullWidth(),
          clearable: configClearable(),
          openOnFocus: configOpenOnFocus(),
          closeOnSelect: configCloseOnSelect(),
          minDate: configMinDate(),
          maxDate: configMaxDate(),
          disablePast: configDisablePast(),
          disableFuture: configDisableFuture(),
          disableWeekends: configDisableWeekends(),
          shouldDisableMode: configShouldDisableMode(),
        },
        derived: {
          shouldDisableDate: configShouldDisableMode() === 'none' ? null : configShouldDisableMode(),
          lastOpenState: lastOpenState(),
          lastChangeCtx: lastChangeCtx(),
        },
      },
      null,
      2,
    ),
  );

  const handlePreviewChange: DatePickerProps['onChange'] = (next, ctx) => {
    const parsed = next ? parseISO(next) ?? parseAny(next, [configInputFormat(), configValueFormat()]) : null;
    const normalized = parsed ? formatByFormat(parsed, configValueFormat()) : null;

    setConfigValue(normalized);
    setLastChangeCtx({ source: ctx?.source ?? 'unknown', value: normalized });
  };

  createEffect(() => {
    const min = configMinDate();
    const max = configMaxDate();
    if (!min || !max) return;

    const minParsed = parseAny(min, [configValueFormat(), configInputFormat(), ...formatPresets]);
    const maxParsed = parseAny(max, [configValueFormat(), configInputFormat(), ...formatPresets]);

    if (!minParsed || !maxParsed) return;

    if (Temporal.PlainDate.compare(minParsed, maxParsed) > 0) {
      setConfigMaxDate(min);
    }
  });

  const resetControls = () => {
    setDarkMode(defaults.darkMode);

    setConfigValue(defaults.value);
    setConfigValueFormat(defaults.valueFormat);
    setConfigInputFormat(defaults.inputFormat);
    setConfigPlaceholder(defaults.placeholder);
    setConfigPlaceholderTouched(defaults.placeholderTouched);

    setConfigDisabled(defaults.disabled);
    setConfigReadOnly(defaults.readOnly);
    setConfigRequired(defaults.required);
    setConfigError(defaults.error);
    setConfigFullWidth(defaults.fullWidth);

    setConfigClearable(defaults.clearable);
    setConfigOpenOnFocus(defaults.openOnFocus);
    setConfigCloseOnSelect(defaults.closeOnSelect);

    setConfigMinDate(defaults.minDate);
    setConfigMaxDate(defaults.maxDate);
    setConfigDisablePast(defaults.disablePast);
    setConfigDisableFuture(defaults.disableFuture);
    setConfigDisableWeekends(defaults.disableWeekends);
    setConfigShouldDisableMode(defaults.shouldDisableMode);

    setLastChangeCtx(undefined);
    setLastOpenState(false);
  };

  const examples: Array<{
    title: string;
    props: Omit<DatePickerProps, 'value' | 'onChange' | 'parse' | 'format' | 'inputMask'> & {
      valueFormat?: DateFormat;
      inputFormat?: DateFormat;
    };
    initialValue?: string | null;
  }> = [
    {
      title: 'Default (MM-DD-YYYY)',
      props: {
        label: 'Start date',
        helperText: 'Choose a project start date.',
      },
      initialValue: '02-10-2026',
    },
    {
      title: 'Required',
      props: {
        label: 'Contract date',
        required: true,
        helperText: 'Date is required before submission.',
      },
      initialValue: null,
    },
    {
      title: 'Disabled',
      props: {
        label: 'Archived date',
        disabled: true,
        helperText: 'Managed by policy and cannot be changed.',
      },
      initialValue: '01-15-2026',
    },
    {
      title: 'Error',
      props: {
        label: 'Approval deadline',
        error: true,
        helperText: 'Please choose a valid deadline date.',
      },
      initialValue: null,
    },
    {
      title: 'Clearable + custom placeholder',
      props: {
        label: 'Reminder date',
        clearable: true,
        placeholder: 'Pick or type reminder date',
        helperText: 'Clear to remove reminder.',
      },
      initialValue: '03-22-2026',
    },
    {
      title: 'DisablePast',
      props: {
        label: 'Future appointment',
        disablePast: true,
        helperText: 'Only today and future dates are allowed.',
      },
      initialValue: null,
    },
    {
      title: 'Min/Max window',
      props: {
        label: 'Sprint window',
        minDate: '03-01-2026',
        maxDate: '03-31-2026',
        helperText: 'Limited to March 2026.',
      },
      initialValue: '03-15-2026',
    },
    {
      title: 'Non-default format (YYYY-MM-DD)',
      props: {
        label: 'ISO style date',
        valueFormat: 'YYYY-MM-DD',
        inputFormat: 'YYYY-MM-DD',
        helperText: 'Value and input both use ISO-like style.',
      },
      initialValue: '2026-02-10',
    },
    {
      title: 'Disable weekends',
      props: {
        label: 'Business day only',
        disableWeekends: true,
        helperText: 'Saturday and Sunday are blocked.',
      },
      initialValue: null,
    },
    {
      title: 'ReadOnly + class overrides',
      props: {
        label: 'Synced settlement date',
        readOnly: true,
        helperText: 'Loaded from external ledger sync.',
        class: 'rounded-2xl bg-amber-50/80 p-3 dark:bg-amber-500/10',
        inputClass: 'border-amber-300/80 dark:border-amber-400/40',
        popoverClass: 'border-amber-300/80 dark:border-amber-400/40',
      },
      initialValue: '02-12-2026',
    },
  ];

  const controlLabelClass =
    'text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400';
  const controlInputClass =
    'w-full rounded-xl border border-slate-200/80 bg-white/80 px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/40 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100';
  const controlCheckboxClass =
    'h-4 w-4 rounded border-slate-300 accent-emerald-500 focus:ring-emerald-400';

  return (
    <div class={cx('min-h-screen', darkMode() ? 'dark' : '')}>
      <div class="relative min-h-screen bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
        <div class="pointer-events-none absolute inset-0 overflow-hidden">
          <div class="absolute -left-32 top-20 h-72 w-72 rounded-full bg-emerald-200/60 blur-3xl dark:bg-emerald-500/10" />
          <div class="absolute right-10 top-0 h-96 w-96 rounded-full bg-amber-200/50 blur-3xl dark:bg-amber-500/10" />
          <div class="absolute bottom-10 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-sky-200/50 blur-3xl dark:bg-sky-500/10" />
          <div class="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.08),_transparent_55%)] dark:bg-[radial-gradient(circle_at_top,_rgba(226,232,240,0.06),_transparent_55%)]" />
        </div>

        <div class="relative mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-10">
          <header class="flex flex-col gap-4">
            <div class="flex items-center justify-between">
              <div>
                <div class="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-600 dark:text-emerald-300">
                  Solid DatePicker Lab
                </div>
                <h1 class="font-display text-3xl font-semibold sm:text-4xl">
                  MUI-like date picker, rebuilt for Solid
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
            <PlaygroundNav currentPath="/date" />
          </header>

          <main class="flex flex-col gap-6">
            <section class="animate-rise rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-lg shadow-slate-200/40 dark:border-slate-800/80 dark:bg-slate-900/70 dark:shadow-slate-900/50">
              <div class="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 class="font-display text-lg font-semibold">Live preview</h2>
                  <div class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    value: {configValueFormat()} / input: {configInputFormat()}
                  </div>
                </div>
                <label class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  <span>Dark</span>
                  <input
                    type="checkbox"
                    class={controlCheckboxClass}
                    checked={darkMode()}
                    onInput={(event) => setDarkMode(event.currentTarget.checked)}
                  />
                </label>
              </div>

              <div class="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr),320px]">
                <div class="flex flex-col gap-3">
                  <div class={previewWrapperClass()}>
                    <DatePicker
                      label="Appointment date"
                      helperText="Type a date or pick from the calendar popover."
                      value={configValue()}
                      onChange={handlePreviewChange}
                      disabled={configDisabled()}
                      readOnly={configReadOnly()}
                      required={configRequired()}
                      error={configError()}
                      clearable={configClearable()}
                      placeholder={resolvedPlaceholder()}
                      minDate={configMinDate()}
                      maxDate={configMaxDate()}
                      disablePast={configDisablePast()}
                      disableFuture={configDisableFuture()}
                      disableWeekends={configDisableWeekends()}
                      shouldDisableDate={derivedShouldDisableDate()}
                      openOnFocus={configOpenOnFocus()}
                      closeOnSelect={configCloseOnSelect()}
                      format={(date) => formatByFormat(date, configInputFormat())}
                      parse={parseForPicker}
                      inputMask={configInputFormat()}
                      onOpenChange={setLastOpenState}
                    />
                  </div>

                  <div class="rounded-2xl border border-slate-200/70 bg-slate-50/90 p-3 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-300">
                    <div>
                      Selected value:{' '}
                      <span class="font-mono">{configValue() ?? 'null'}</span>
                    </div>
                    <div>
                      Last change source:{' '}
                      <span class="font-mono">{lastChangeCtx()?.source ?? 'n/a'}</span>
                    </div>
                    <div>
                      Popover open:{' '}
                      <span class="font-mono">{String(lastOpenState())}</span>
                    </div>
                  </div>
                </div>

                <div class="rounded-2xl border border-slate-200/70 bg-white/70 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/40">
                  <div class="flex flex-col gap-4">
                    <div class="grid gap-3">
                      <div class={controlLabelClass}>Data</div>
                      <label class="flex flex-col gap-2">
                        <span class={controlLabelClass}>Current value</span>
                        <input
                          class={controlInputClass}
                          value={configValue() ?? ''}
                          onInput={(event) => {
                            const next = event.currentTarget.value;
                            setConfigValue(next ? next : null);
                          }}
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

                    <div class="grid gap-3">
                      <div class={controlLabelClass}>Formatting</div>
                      <label class="flex flex-col gap-2">
                        <span class={controlLabelClass}>valueFormat</span>
                        <select
                          class={controlInputClass}
                          value={configValueFormat()}
                          onInput={(event) =>
                            handleValueFormatChange(event.currentTarget.value as DateFormat)
                          }
                        >
                          <For each={formatPresets}>
                            {(item) => <option value={item}>{item}</option>}
                          </For>
                        </select>
                      </label>
                      <label class="flex flex-col gap-2">
                        <span class={controlLabelClass}>inputFormat</span>
                        <select
                          class={controlInputClass}
                          value={configInputFormat()}
                          onInput={(event) =>
                            handleInputFormatChange(event.currentTarget.value as DateFormat)
                          }
                        >
                          <For each={formatPresets}>
                            {(item) => <option value={item}>{item}</option>}
                          </For>
                        </select>
                      </label>
                      <label class="flex flex-col gap-2">
                        <span class={controlLabelClass}>Placeholder</span>
                        <input
                          class={controlInputClass}
                          value={configPlaceholder() ?? ''}
                          onInput={(event) => {
                            const next = event.currentTarget.value;
                            setConfigPlaceholderTouched(true);
                            setConfigPlaceholder(next ? next : undefined);
                          }}
                        />
                      </label>
                    </div>

                    <div class="grid gap-3">
                      <div class={controlLabelClass}>Constraints</div>
                      <label class="flex flex-col gap-2">
                        <span class={controlLabelClass}>Min date</span>
                        <input
                          class={controlInputClass}
                          value={configMinDate() ?? ''}
                          onInput={(event) => {
                            const next = event.currentTarget.value;
                            setConfigMinDate(next ? next : undefined);
                          }}
                        />
                      </label>
                      <label class="flex flex-col gap-2">
                        <span class={controlLabelClass}>Max date</span>
                        <input
                          class={controlInputClass}
                          value={configMaxDate() ?? ''}
                          onInput={(event) => {
                            const next = event.currentTarget.value;
                            setConfigMaxDate(next ? next : undefined);
                          }}
                        />
                      </label>
                      <label class="flex flex-col gap-2">
                        <span class={controlLabelClass}>shouldDisableDate</span>
                        <select
                          class={controlInputClass}
                          value={configShouldDisableMode()}
                          onInput={(event) =>
                            setConfigShouldDisableMode(event.currentTarget.value as DisableMode)
                          }
                        >
                          <For each={disableModeOptions}>
                            {(item) => <option value={item.value}>{item.label}</option>}
                          </For>
                        </select>
                      </label>
                      <label class="flex items-center justify-between text-sm text-slate-700 dark:text-slate-200">
                        <span>Disable past</span>
                        <input
                          type="checkbox"
                          class={controlCheckboxClass}
                          checked={configDisablePast()}
                          onInput={(event) => setConfigDisablePast(event.currentTarget.checked)}
                        />
                      </label>
                      <label class="flex items-center justify-between text-sm text-slate-700 dark:text-slate-200">
                        <span>Disable future</span>
                        <input
                          type="checkbox"
                          class={controlCheckboxClass}
                          checked={configDisableFuture()}
                          onInput={(event) => setConfigDisableFuture(event.currentTarget.checked)}
                        />
                      </label>
                      <label class="flex items-center justify-between text-sm text-slate-700 dark:text-slate-200">
                        <span>Disable weekends</span>
                        <input
                          type="checkbox"
                          class={controlCheckboxClass}
                          checked={configDisableWeekends()}
                          onInput={(event) =>
                            setConfigDisableWeekends(event.currentTarget.checked)
                          }
                        />
                      </label>
                    </div>

                    <div class="grid gap-3">
                      <div class={controlLabelClass}>Behavior</div>
                      <label class="flex items-center justify-between text-sm text-slate-700 dark:text-slate-200">
                        <span>Open on focus</span>
                        <input
                          type="checkbox"
                          class={controlCheckboxClass}
                          checked={configOpenOnFocus()}
                          onInput={(event) => setConfigOpenOnFocus(event.currentTarget.checked)}
                        />
                      </label>
                      <label class="flex items-center justify-between text-sm text-slate-700 dark:text-slate-200">
                        <span>Close on select</span>
                        <input
                          type="checkbox"
                          class={controlCheckboxClass}
                          checked={configCloseOnSelect()}
                          onInput={(event) => setConfigCloseOnSelect(event.currentTarget.checked)}
                        />
                      </label>
                      <label class="flex items-center justify-between text-sm text-slate-700 dark:text-slate-200">
                        <span>Clearable</span>
                        <input
                          type="checkbox"
                          class={controlCheckboxClass}
                          checked={configClearable()}
                          onInput={(event) => setConfigClearable(event.currentTarget.checked)}
                        />
                      </label>
                    </div>

                    <div class="grid gap-3">
                      <div class={controlLabelClass}>State</div>
                      <label class="flex items-center justify-between text-sm text-slate-700 dark:text-slate-200">
                        <span>Disabled</span>
                        <input
                          type="checkbox"
                          class={controlCheckboxClass}
                          checked={configDisabled()}
                          onInput={(event) => setConfigDisabled(event.currentTarget.checked)}
                        />
                      </label>
                      <label class="flex items-center justify-between text-sm text-slate-700 dark:text-slate-200">
                        <span>Read only</span>
                        <input
                          type="checkbox"
                          class={controlCheckboxClass}
                          checked={configReadOnly()}
                          onInput={(event) => setConfigReadOnly(event.currentTarget.checked)}
                        />
                      </label>
                      <label class="flex items-center justify-between text-sm text-slate-700 dark:text-slate-200">
                        <span>Required</span>
                        <input
                          type="checkbox"
                          class={controlCheckboxClass}
                          checked={configRequired()}
                          onInput={(event) => setConfigRequired(event.currentTarget.checked)}
                        />
                      </label>
                      <label class="flex items-center justify-between text-sm text-slate-700 dark:text-slate-200">
                        <span>Error</span>
                        <input
                          type="checkbox"
                          class={controlCheckboxClass}
                          checked={configError()}
                          onInput={(event) => setConfigError(event.currentTarget.checked)}
                        />
                      </label>
                      <label class="flex items-center justify-between text-sm text-slate-700 dark:text-slate-200">
                        <span>Full width</span>
                        <input
                          type="checkbox"
                          class={controlCheckboxClass}
                          checked={configFullWidth()}
                          onInput={(event) => setConfigFullWidth(event.currentTarget.checked)}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section class="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-lg shadow-slate-200/40 dark:border-slate-800/80 dark:bg-slate-900/70 dark:shadow-slate-900/50">
              <h2 class="font-display text-lg font-semibold">Examples grid</h2>
              <div class="mt-5 grid gap-4 md:grid-cols-2">
                <For each={examples}>
                  {(item) => (
                    <ExampleCard
                      title={item.title}
                      props={item.props}
                      initialValue={item.initialValue}
                    />
                  )}
                </For>
              </div>
            </section>

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

export default DatePickerPlayground;
