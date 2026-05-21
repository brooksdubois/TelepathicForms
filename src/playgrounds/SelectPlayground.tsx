import { For, Show, createEffect, createMemo, createSignal, onMount } from 'solid-js';
import type { Component } from 'solid-js';

import Select, {
  type SelectMeta,
  type SelectOption,
  type SelectProps,
  type SelectSize,
  type SelectVariant,
} from '../components/Select';
import PlaygroundNav from './PlaygroundNav';
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

const variants: SelectVariant[] = ['outlined', 'filled', 'standard'];
const sizes: SelectSize[] = ['sm', 'md', 'lg'];

type SelectPresetKey = 'states' | 'colors' | 'yes-no';

const selectOptionPresets: Array<{
  key: SelectPresetKey;
  label: string;
  options: SelectOption[];
}> = [
  {
    key: 'states',
    label: 'US states sample',
    options: [
      { value: 'ca', label: 'California' },
      { value: 'ny', label: 'New York' },
      { value: 'tx', label: 'Texas' },
      { value: 'wa', label: 'Washington' },
      { value: 'fl', label: 'Florida' },
    ],
  },
  {
    key: 'colors',
    label: 'Colors sample',
    options: [
      { value: 'emerald', label: 'Emerald' },
      { value: 'amber', label: 'Amber' },
      { value: 'sky', label: 'Sky' },
      { value: 'rose', label: 'Rose' },
    ],
  },
  {
    key: 'yes-no',
    label: 'Yes/No sample',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
      { value: 'maybe', label: 'Maybe' },
    ],
  },
];

const defaults = {
  variant: 'outlined' as SelectVariant,
  size: 'md' as SelectSize,
  disabled: false,
  readOnly: false,
  required: false,
  fullWidth: false,
  ringAnimation: 'laser' as RingAnimationSelection,
  label: 'State',
  helperText: 'Pick the state used for billing.',
  errorText: 'Please choose a state.',
  placeholder: 'Select an option',
  darkMode: false,
  value: '',
  error: false,
  optionsPreset: 'states' as SelectPresetKey,
  disableSecondOption: false,
  startAdornmentText: '',
  endAdornmentText: '',
};

const yesNoOptions: SelectOption[] = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'maybe', label: 'Maybe later' },
];

const roleOptions: SelectOption[] = [
  { value: 'owner', label: 'Owner' },
  { value: 'admin', label: 'Admin' },
  { value: 'editor', label: 'Editor' },
  { value: 'viewer', label: 'Viewer' },
];

const regionOptions: SelectOption[] = [
  { value: 'us-east', label: 'US East' },
  { value: 'us-west', label: 'US West' },
  { value: 'eu-central', label: 'EU Central' },
  { value: 'ap-south', label: 'AP South' },
];

const priorityOptions: SelectOption[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

const currencyOptions: SelectOption[] = [
  { value: 'usd', label: 'USD' },
  { value: 'eur', label: 'EUR' },
  { value: 'gbp', label: 'GBP' },
  { value: 'jpy', label: 'JPY' },
];

const adornmentBadge = (value: string) => (
  <span class="rounded-full bg-slate-900/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600 dark:bg-white/10 dark:text-slate-300">
    {value}
  </span>
);

const variantOptions = variants.map((value) => ({value, label: value}));
const sizeOptions = sizes.map((value) => ({value, label: value}));
const presetOptions = selectOptionPresets.map((preset) => ({
  value: preset.key,
  label: preset.label,
}));

const ExampleCard: Component<{
  title: string;
  props: Omit<SelectProps, 'value' | 'onValue'>;
  initialValue?: string;
}> = (props) => {
  const [value, setValue] = createSignal(props.initialValue ?? '');

  createEffect(() => {
    const options = props.props.options ?? [];
    const exists = options.some((option) => option.value === value());
    if (!exists && value() !== '') {
      setValue('');
    }
  });

  return (
    <div class="flex flex-col gap-3 rounded-2xl border border-slate-200/70 bg-white/80 p-4 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/60">
      <div class="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {props.title}
      </div>
      <Select {...props.props} fullWidth value={value()} onValue={setValue} />
    </div>
  );
};

const SelectPlayground: Component = () => {
  const darkMode = darkModeStore.isDarkMode;
  const setDarkModeAndPersist = darkModeStore.setDarkMode;

  onMount(() => darkModeStore.initializeDarkMode());
  const [startAdornmentText, setStartAdornmentText] = createSignal(
    defaults.startAdornmentText,
  );
  const [endAdornmentText, setEndAdornmentText] = createSignal(
    defaults.endAdornmentText,
  );
  const [previewValue, setPreviewValue] = createSignal(defaults.value);
  const [configVariant, setConfigVariant] = createSignal(defaults.variant);
  const [configSize, setConfigSize] = createSignal(defaults.size);
  const [configDisabled, setConfigDisabled] = createSignal(defaults.disabled);
  const [configReadOnly, setConfigReadOnly] = createSignal(defaults.readOnly);
  const [configRequired, setConfigRequired] = createSignal(defaults.required);
  const [configFullWidth, setConfigFullWidth] = createSignal(defaults.fullWidth);
  const [configRingAnimation, setConfigRingAnimation] = createSignal<RingAnimationSelection>(
    defaults.ringAnimation,
  );
  const [ringApi, setRingApi] = createSignal<{
    pulse: () => void;
    focus: () => void;
    pulseAndFocus: () => void;
  }>();
  const [configLabel, setConfigLabel] = createSignal<string | undefined>(
    defaults.label,
  );
  const [configHelperText, setConfigHelperText] = createSignal<string | undefined>(
    defaults.helperText,
  );
  const [configErrorText, setConfigErrorText] = createSignal<string | undefined>(
    defaults.errorText,
  );
  const [configPlaceholder, setConfigPlaceholder] = createSignal<
    string | undefined
  >(defaults.placeholder);
  const [configErrorFlag, setConfigErrorFlag] = createSignal(defaults.error);
  const [configPreset, setConfigPreset] = createSignal<SelectPresetKey>(
    defaults.optionsPreset,
  );
  const [disableSecondOption, setDisableSecondOption] = createSignal(
    defaults.disableSecondOption,
  );

  const startAdornment = createMemo(() => {
    const value = startAdornmentText();
    return value ? adornmentBadge(value) : null;
  });

  const endAdornment = createMemo(() => {
    const value = endAdornmentText();
    return value ? adornmentBadge(value) : null;
  });

  const activePreset = createMemo(
    () =>
      selectOptionPresets.find((item) => item.key === configPreset()) ??
      selectOptionPresets[0],
  );

  const previewOptions = createMemo(() =>
    activePreset().options.map((option, index) =>
      index === 1 && disableSecondOption() ? { ...option, disabled: true } : option,
    ),
  );

  const previewDisabledOptionLabel = createMemo(
    () => previewOptions()[1]?.label ?? 'Second option',
  );

  createEffect(() => {
    const exists = previewOptions().some((option) => option.value === previewValue());
    if (!exists && previewValue() !== '') {
      setPreviewValue('');
    }
  });

  const previewFullWidth = createMemo(() => configFullWidth());
  const previewWrapperClass = createMemo(() =>
    cx(
      "tf-playground-preview-frame",
      previewFullWidth() ? "max-w-4xl" : "max-w-3xl",
    ),
  );

  const inspectorSnapshot = createMemo(() =>
    JSON.stringify(
      {
        props: {
          value: previewValue(),
          label: configLabel(),
          helperText: configHelperText(),
          errorText: configErrorText(),
          placeholder: configPlaceholder(),
          required: configRequired(),
          disabled: configDisabled(),
          readOnly: configReadOnly(),
          fullWidth: configFullWidth(),
          ringEnabled: ringAnimationEnabled(configRingAnimation()),
          ringVariant: ringAnimationVariant(configRingAnimation()),
          size: configSize(),
          variant: configVariant(),
          error: configErrorFlag(),
          preset: activePreset().label,
          options: previewOptions().map((option) => ({
            value: option.value,
            label: option.label,
            disabled: option.disabled ?? false,
          })),
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


  const resetControls = () => {
    setPreviewValue(defaults.value);
    setConfigVariant(defaults.variant);
    setConfigSize(defaults.size);
    setConfigDisabled(defaults.disabled);
    setConfigReadOnly(defaults.readOnly);
    setConfigRequired(defaults.required);
    setConfigFullWidth(defaults.fullWidth);
    setConfigRingAnimation(defaults.ringAnimation);
    setConfigLabel(defaults.label);
    setConfigHelperText(defaults.helperText);
    setConfigErrorText(defaults.errorText);
    setConfigPlaceholder(defaults.placeholder);
    setConfigErrorFlag(defaults.error);
    setConfigPreset(defaults.optionsPreset);
    setDisableSecondOption(defaults.disableSecondOption);
    setStartAdornmentText(defaults.startAdornmentText);
    setEndAdornmentText(defaults.endAdornmentText);
    setDarkModeAndPersist(defaults.darkMode);
  };

  const controlSections = (): readonly PlaygroundControlSection[] => [
    {
      heading: 'Appearance',
      controls: [
        {
          kind: 'select',
          label: 'Variant',
          value: configVariant,
          set: (next) => setConfigVariant(next as SelectVariant),
          options: variantOptions,
        },
        {
          kind: 'select',
          label: 'Size',
          value: configSize,
          set: (next) => setConfigSize(next as SelectSize),
          options: sizeOptions,
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
          label: 'Full width',
          value: configFullWidth,
          set: setConfigFullWidth,
        },
        {
          kind: 'checkbox',
          label: 'Error',
          value: configErrorFlag,
          set: setConfigErrorFlag,
        },
      ],
    },
    {
      heading: 'Data',
      controls: [
        {
          kind: 'select',
          label: 'Preset',
          value: configPreset,
          set: (next) => setConfigPreset(next as SelectPresetKey),
          options: presetOptions,
        },
        {
          kind: 'checkbox',
          label: 'Disable second option',
          value: disableSecondOption,
          set: setDisableSecondOption,
        },
      ],
    },
    {
      heading: 'Copy',
      controls: [
        {
          kind: 'text',
          label: 'Label',
          value: configLabel,
          set: (next) => setConfigLabel(next),
        },
        {
          kind: 'text',
          label: 'Helper text',
          value: configHelperText,
          set: (next) => setConfigHelperText(next),
        },
        {
          kind: 'text',
          label: 'Error text',
          value: configErrorText,
          set: (next) => setConfigErrorText(next),
        },
        {
          kind: 'text',
          label: 'Placeholder',
          value: configPlaceholder,
          set: (next) => setConfigPlaceholder(next),
        },
      ],
    },
    {
      heading: 'Adornments',
      controls: [
        {
          kind: 'text',
          label: 'Start',
          value: () => startAdornmentText(),
          set: setStartAdornmentText,
        },
        {
          kind: 'text',
          label: 'End',
          value: () => endAdornmentText(),
          set: setEndAdornmentText,
        },
      ],
    },
  ];

  const examples: Array<{
    title: string;
    props: Omit<SelectProps, 'value' | 'onValue'>;
    initialValue?: string;
  }> = [
    {
      title: 'Default',
      props: {
        label: 'Region',
        placeholder: 'Choose a region',
        helperText: 'Used for routing traffic.',
        options: regionOptions,
      },
    },
    {
      title: 'Required',
      props: {
        label: 'Role',
        required: true,
        helperText: 'Required field.',
        options: roleOptions,
      },
    },
    {
      title: 'Disabled',
      props: {
        label: 'Status',
        disabled: true,
        helperText: 'Unavailable right now.',
        options: yesNoOptions,
      },
      initialValue: 'yes',
    },
    {
      title: 'Error (prop)',
      props: {
        label: 'Priority',
        error: true,
        errorText: 'Pick a priority before continuing.',
        options: priorityOptions,
      },
    },
    {
      title: 'Filled variant',
      props: {
        label: 'Currency',
        variant: 'filled',
        helperText: 'Shown in invoices.',
        options: currencyOptions,
      },
      initialValue: 'usd',
    },
    {
      title: 'Standard variant',
      props: {
        label: 'Team size',
        variant: 'standard',
        helperText: 'Used for seat planning.',
        options: [
          { value: '1-5', label: '1-5' },
          { value: '6-20', label: '6-20' },
          { value: '21-100', label: '21-100' },
          { value: '100+', label: '100+' },
        ],
      },
    },
    {
      title: 'With adornments',
      props: {
        label: 'Billing currency',
        startAdornment: (
          <span class="text-xs font-semibold uppercase tracking-wide text-slate-500">
            ISO
          </span>
        ),
        endAdornment: (
          <span class="text-xs font-semibold uppercase tracking-wide text-slate-500">
            code
          </span>
        ),
        options: currencyOptions,
      },
      initialValue: 'eur',
    },
    {
      title: 'Read only',
      props: {
        label: 'Plan tier',
        readOnly: true,
        helperText: 'Synced from billing.',
        options: [
          { value: 'starter', label: 'Starter' },
          { value: 'growth', label: 'Growth' },
          { value: 'enterprise', label: 'Enterprise' },
        ],
      },
      initialValue: 'growth',
    },
    {
      title: 'Meta warning',
      props: {
        label: 'Workspace handle',
        helperText: 'Keep it short.',
        options: [
          { value: 'solid-lab', label: 'solid-lab' },
          { value: 'solid-ui', label: 'solid-ui' },
          { value: 'solid-app', label: 'solid-app' },
        ],
        meta: {
          touched: true,
          dirty: false,
          errors: [],
          warnings: ['Similar handle already exists.'],
        } satisfies SelectMeta,
      },
    },
    {
      title: 'Meta error',
      props: {
        label: 'Environment',
        helperText: 'Choose deployment target.',
        options: [
          { value: 'dev', label: 'Development' },
          { value: 'stage', label: 'Staging' },
          { value: 'prod', label: 'Production' },
        ],
        meta: {
          touched: true,
          dirty: true,
          errors: ['Production requires approval.'],
          warnings: [],
        } satisfies SelectMeta,
      },
    },
    {
      title: 'Slot overrides',
      props: {
        label: 'Project',
        options: [
          { value: 'apollo', label: 'Apollo' },
          { value: 'orion', label: 'Orion' },
          { value: 'vega', label: 'Vega' },
        ],
        renderLabel: ({ label, required }) => (
          <div class="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
            <span class="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-300">
              custom
            </span>
            <span>{label}</span>
            <Show when={required}>
              <span class="text-rose-500">*</span>
            </Show>
          </div>
        ),
        renderHelper: ({ helperText }) => (
          <div class="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span class="inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 text-[10px] font-semibold text-slate-500 dark:border-slate-700 dark:text-slate-400">
              i
            </span>
            <span>{helperText}</span>
          </div>
        ),
        helperText: 'Slot content can be any JSX.',
        required: true,
      },
    },
    {
      title: 'Class overrides',
      props: {
        label: 'Accent',
        helperText: 'Custom colors via class hooks.',
        options: priorityOptions,
        rootClass: 'rounded-2xl bg-amber-50/80 p-3 dark:bg-amber-500/10',
        labelClass: 'text-amber-700 dark:text-amber-200',
        inputClass: 'text-amber-900 dark:text-amber-100',
        helperClass: 'text-amber-600 dark:text-amber-300',
      },
    },
  ];
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
                  Solid Select Lab
                </div>
                <h1 class="font-display text-3xl font-semibold sm:text-4xl">
                  Select, Rebuilt for Solid
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
            <p class="max-w-2xl text-sm text-slate-600 dark:text-slate-300">
              Live-edit a SolidJS Select and inspect state, options, and behavior.
            </p>
          </header>

          <main class="flex flex-col gap-6">
            <section class="animate-rise rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-lg shadow-slate-200/40 dark:border-slate-800/80 dark:bg-slate-900/70 dark:shadow-slate-900/50">
              <div class="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 class="font-display text-lg font-semibold">Live Preview</h2>
                  <div class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {configVariant()} / {configSize()}
                  </div>
                </div>
              </div>

              <div class="mt-6 flex flex-col gap-6">
                <div class="flex flex-col gap-3">
                  <div class={previewWrapperClass()}>
                    <Select
                      label={configLabel()}
                      helperText={configHelperText()}
                      errorText={configErrorText()}
                      required={configRequired()}
                      disabled={configDisabled()}
                      readOnly={configReadOnly()}
                      fullWidth={configFullWidth()}
                      ringEnabled={ringAnimationEnabled(configRingAnimation())}
                      ringVariant={ringAnimationVariant(configRingAnimation())}
                      onRingApi={setRingApi}
                      size={configSize()}
                      variant={configVariant()}
                      startAdornment={startAdornment()}
                      endAdornment={endAdornment()}
                      placeholder={configPlaceholder()}
                      options={previewOptions()}
                      error={configErrorFlag()}
                      value={previewValue()}
                      onValue={setPreviewValue}
                    />
                  </div>
                  <div class="text-xs text-slate-500 dark:text-slate-400">
                    Use arrows to navigate options, Enter/Space to select, and
                    Escape to close.
                  </div>
                </div>

                <div class="grid gap-6 lg:grid-cols-2 lg:items-stretch">
                  <div class="h-full rounded-2xl border border-slate-200/70 bg-white/70 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/40">
                  <PlaygroundControlPanel sections={controlSections()} />
                  <div class="grid gap-1.5">
                    <div class="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Options editor
                    </div>
                    <label class="flex items-center justify-between text-sm text-slate-700 dark:text-slate-200">
                      <span>Disable {previewDisabledOptionLabel()}</span>
                      <input
                        type="checkbox"
                        class={controlCheckboxClass}
                        checked={disableSecondOption()}
                        onInput={(event) =>
                          setDisableSecondOption(event.currentTarget.checked)
                        }
                      />
                    </label>

                    <div class="rounded-xl border border-slate-200/70 bg-white/70 p-3 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300">
                      <div class="mb-2 font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Active options
                      </div>
                      <div class="flex flex-col gap-1.5">
                        <For each={previewOptions()}>
                          {(option) => (
                            <div class="flex flex-wrap items-center justify-between gap-3">
                              <span>{option.label}</span>
                              <span class="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                {option.disabled ? 'disabled' : 'enabled'}
                              </span>
                            </div>
                          )}
                        </For>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    class={PlaygroundRingButtonClass}
                    disabled={!ringAnimationEnabled(configRingAnimation()) || !ringApi()}
                    onClick={() => ringApi()?.pulseAndFocus()}
                  >
                    Trigger ring
                  </button>
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


            <section class="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-lg shadow-slate-200/40 dark:border-slate-800/80 dark:bg-slate-900/70 dark:shadow-slate-900/50">
              <h2 class="font-display text-lg font-semibold">Accessibility</h2>
              <p class="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Select keeps listbox interaction predictable while exposing ARIA state for validation, helper text, disabled, and read-only modes.
              </p>

              <ul class="mt-4 grid gap-2 text-sm text-slate-700 dark:text-slate-200 md:grid-cols-2">
                <li class="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
                  aria-invalid is set when error is active.
                </li>
                <li class="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
                  aria-describedby links helper and error text.
                </li>
                <li class="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
                  Disabled state removes interaction from the trigger.
                </li>
                <li class="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
                  Read-only remains focusable but blocks menu opening.
                </li>
              </ul>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
};

export default SelectPlayground;
