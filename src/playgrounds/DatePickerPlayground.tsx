import { For, Show, createEffect, createMemo, createSignal, onMount } from 'solid-js';
import type { Component } from 'solid-js';
import { Temporal } from '@js-temporal/polyfill';

import DatePicker, { type DatePickerProps } from '../primitives/DatePicker';
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

type DateFormat = 'MM-DD-YYYY' | 'YYYY-MM-DD' | 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'DD.MM.YYYY';
type DisableMode = 'none' | 'oddDays' | 'monthEnd' | 'weekendsOnly';

type ChangeCtx = {
  source: string;
  value: string | null;
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

const formatPresets: DateFormat[] = [
  'MM-DD-YYYY',
  'YYYY-MM-DD',
  'DD/MM/YYYY',
  'MM/DD/YYYY',
  'DD.MM.YYYY',
];
const formatOptions = formatPresets.map((value) => ({ value, label: value }));

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
  ringAnimation: 'laser' as RingAnimationSelection,
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
  const darkMode = darkModeStore.isDarkMode;
  const setDarkModeAndPersist = darkModeStore.setDarkMode;

  onMount(() => darkModeStore.initializeDarkMode());

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
  const [configRingAnimation, setConfigRingAnimation] = createSignal<RingAnimationSelection>(
    defaults.ringAnimation,
  );
  const [ringApi, setRingApi] = createSignal<{
    pulse: () => void;
    focus: () => void;
    pulseAndFocus: () => void;
  }>();

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
    cx(
      "tf-playground-preview-frame",
      configFullWidth() ? "max-w-4xl" : "max-w-3xl",
    ),
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
          ringEnabled: ringAnimationEnabled(configRingAnimation()),
          ringVariant: ringAnimationVariant(configRingAnimation()),
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


  const controlSections = (): readonly PlaygroundControlSection[] => [
    {
      heading: 'Data',
      controls: [
        {
          kind: 'text',
          label: 'Current value',
          value: () => configValue() ?? undefined,
          set: (next) => setConfigValue(next ?? null),
          placeholder: configValueFormat(),
        },
      ],
    },
    {
      heading: 'Formatting',
      controls: [
        {
          kind: 'select',
          label: 'Value format',
          value: () => configValueFormat(),
          set: (next) => handleValueFormatChange(next as DateFormat),
          options: formatOptions,
        },
        {
          kind: 'select',
          label: 'Input format',
          value: () => configInputFormat(),
          set: (next) => handleInputFormatChange(next as DateFormat),
          options: formatOptions,
        },
        {
          kind: 'text',
          label: 'Placeholder',
          value: configPlaceholder,
          set: (next) => {
            setConfigPlaceholderTouched(true);
            setConfigPlaceholder(next);
          },
          placeholder: configInputFormat(),
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
          placeholder: configValueFormat(),
        },
        {
          kind: 'text',
          label: 'Max date',
          value: configMaxDate,
          set: setConfigMaxDate,
          placeholder: configValueFormat(),
        },
        {
          kind: 'select',
          label: 'shouldDisableDate',
          value: () => configShouldDisableMode(),
          set: (next) => setConfigShouldDisableMode(next as DisableMode),
          options: disableModeOptions,
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
        {
          kind: 'checkbox',
          label: 'Full width',
          value: configFullWidth,
          set: setConfigFullWidth,
        },
      ],
    },
  ];

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
    setDarkModeAndPersist(defaults.darkMode);

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
    setConfigRingAnimation(defaults.ringAnimation);

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
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div class="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-600 dark:text-emerald-300">
                  Solid DatePicker Lab
                </div>
                <h1 class="font-display text-3xl font-semibold sm:text-4xl">
                  DatePicker, Rebuilt for Solid
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
            <section class="animate-rise rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-lg shadow-slate-200/40 dark:border-slate-800/80 dark:bg-slate-900/70 dark:shadow-slate-900/50">
              <div class="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 class="font-display text-lg font-semibold">Live Preview</h2>
                  <div class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    value: {configValueFormat()} / input: {configInputFormat()}
                  </div>
                </div>
              </div>

              <div class="mt-6 flex flex-col gap-6">
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
                      ringEnabled={ringAnimationEnabled(configRingAnimation())}
                      ringVariant={ringAnimationVariant(configRingAnimation())}
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
                      onRingApi={setRingApi}
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
                    <button
                      type="button"
                      class={PlaygroundRingButtonClass}
                      disabled={!ringAnimationEnabled(configRingAnimation()) || !ringApi()}
                      onClick={() => ringApi()?.pulseAndFocus()}
                    >
                      Trigger ring
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

          </main>
        </div>
      </div>
    </div>
  );
};

export default DatePickerPlayground;
