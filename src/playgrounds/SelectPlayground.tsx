import { For, Show, createEffect, createMemo, createSignal } from 'solid-js';
import type { Component } from 'solid-js';

import Select, {
  type SelectMeta,
  type SelectOption,
  type SelectProps,
  type SelectSize,
  type SelectVariant,
} from '../packages/select';

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

const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ');

type RingAnimationSelection = 'none' | 'laser' | 'expanse' | 'scanner';

const ringAnimationOptions: Array<{
  value: RingAnimationSelection;
  label: string;
}> = [
  { value: 'none', label: 'None' },
  { value: 'laser', label: 'Laser' },
  { value: 'expanse', label: 'Expanse' },
  { value: 'scanner', label: 'Scanner' },
];

const ringAnimationEnabled = (selection: RingAnimationSelection) =>
  selection !== 'none';

const ringAnimationVariant = (selection: RingAnimationSelection) =>
  selection === 'none' ? undefined : selection;

const labs = [
  { href: '/form-demo', label: 'Form Demo' },
  { href: '/text-field', label: 'TextField Lab' },
  { href: '/select', label: 'Select Lab' },
  { href: '/multi-select', label: 'MultiSelect Lab' },
  { href: '/checkbox', label: 'Checkbox Lab' },
  { href: '/radio-group', label: 'RadioGroup Lab' },
  { href: '/switch', label: 'Switch Lab' },
  { href: '/textarea', label: 'TextArea Lab' },
  { href: '/date', label: 'DatePicker Lab' },
];

const normalizePath = (path: string) => path.replace(/\/+$/, '') || '/';

const navItemClass =
  'rounded-full border border-slate-200/80 bg-white/80 px-3 py-1.5 text-slate-700 transition hover:border-emerald-300 hover:text-emerald-600 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200';

const PlaygroundNav: Component<{ currentPath: string; class?: string }> = (props) => {
  const activePath = () => normalizePath(props.currentPath);

  return (
    <div
      class={cx(
        'flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400',
        props.class,
      )}
    >
      <For each={labs}>
        {(item) =>
          normalizePath(item.href) === activePath() ? (
            <span
              aria-current="page"
              class="rounded-full border border-emerald-300/70 bg-emerald-500/10 px-3 py-1.5 text-emerald-700 dark:border-emerald-400/40 dark:text-emerald-300"
            >
              {item.label}
            </span>
          ) : (
            <a href={item.href} class={navItemClass}>
              {item.label}
            </a>
          )
        }
      </For>
    </div>
  );
};

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
  const [darkMode, setDarkMode] = createSignal(defaults.darkMode);
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
    cx('transition-all duration-200', previewFullWidth() ? 'w-full' : 'max-w-sm'),
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
    setDarkMode(defaults.darkMode);
  };

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

  const [selfCheckValue, setSelfCheckValue] = createSignal('yes');
  const [selfReadOnlyControl, setSelfReadOnlyControl] =
    createSignal<HTMLButtonElement>();
  const [selfDisabledControl, setSelfDisabledControl] =
    createSignal<HTMLButtonElement>();
  const [selfCheckStatus, setSelfCheckStatus] = createSignal({
    ariaInvalid: false,
    ariaDescribedBy: false,
    helperRendered: false,
    errorRendered: false,
    readOnly: false,
    disabled: false,
    readOnlyBlockedOpen: false,
    readOnlyFocusable: false,
  });

  createEffect(() => {
    const readOnlyControl = selfReadOnlyControl();
    const disabledControl = selfDisabledControl();
    const helper = document.getElementById('select-self-check-helper');
    const helperTextValue = helper?.textContent ?? '';

    const beforeExpanded = readOnlyControl?.getAttribute('aria-expanded');
    readOnlyControl?.click();
    const afterExpanded = readOnlyControl?.getAttribute('aria-expanded');

    setSelfCheckStatus({
      ariaInvalid: readOnlyControl?.getAttribute('aria-invalid') === 'true',
      ariaDescribedBy:
        (readOnlyControl?.getAttribute('aria-describedby') ?? '').includes(
          'select-self-check-helper',
        ) ?? false,
      helperRendered: Boolean(helper),
      errorRendered: helperTextValue.includes('Self-check error'),
      readOnly: readOnlyControl?.getAttribute('aria-readonly') === 'true',
      disabled: Boolean(disabledControl?.disabled),
      readOnlyBlockedOpen:
        beforeExpanded !== 'true' && afterExpanded !== 'true' && !Boolean(document.getElementById('select-self-check-menu')),
      readOnlyFocusable:
        Boolean(readOnlyControl) &&
        !Boolean(readOnlyControl?.disabled) &&
        (readOnlyControl?.tabIndex ?? -1) >= 0,
    });
  });

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
                  Solid Select Lab
                </div>
                <h1 class="font-display text-3xl font-semibold sm:text-4xl">
                  MUI-like selects, rebuilt for Solid
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
            <PlaygroundNav currentPath="/select" />
            <p class="max-w-2xl text-sm text-slate-600 dark:text-slate-300">
              Live-edit a SolidJS Select and inspect state, options, and behavior.
            </p>
          </header>

          <main class="flex flex-col gap-6">
            <section class="animate-rise rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-lg shadow-slate-200/40 dark:border-slate-800/80 dark:bg-slate-900/70 dark:shadow-slate-900/50">
              <div class="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 class="font-display text-lg font-semibold">Live preview</h2>
                  <div class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {configVariant()} / {configSize()}
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

                <div class="rounded-2xl border border-slate-200/70 bg-white/70 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/40">
                  <div class="flex flex-col gap-4">
                    <div class="grid gap-3">
                      <div class={controlLabelClass}>Appearance</div>
                      <label class="flex flex-col gap-2">
                        <span class={controlLabelClass}>Variant</span>
                        <select
                          class={controlInputClass}
                          value={configVariant()}
                          onInput={(event) =>
                            setConfigVariant(
                              event.currentTarget.value as SelectVariant,
                            )
                          }
                        >
                          <For each={variants}>
                            {(item) => <option value={item}>{item}</option>}
                          </For>
                        </select>
                      </label>

                      <label class="flex flex-col gap-2">
                        <span class={controlLabelClass}>Size</span>
                        <select
                          class={controlInputClass}
                          value={configSize()}
                          onInput={(event) =>
                            setConfigSize(event.currentTarget.value as SelectSize)
                          }
                        >
                          <For each={sizes}>
                            {(item) => <option value={item}>{item}</option>}
                          </For>
                        </select>
                      </label>
                    </div>

                    <div class="grid gap-2">
                      <div class={controlLabelClass}>Behavior</div>
                      <label class="flex items-center justify-between text-sm text-slate-700 dark:text-slate-200">
                        <span>Disabled</span>
                        <input
                          type="checkbox"
                          class={controlCheckboxClass}
                          checked={configDisabled()}
                          onInput={(event) =>
                            setConfigDisabled(event.currentTarget.checked)
                          }
                        />
                      </label>
                      <label class="flex items-center justify-between text-sm text-slate-700 dark:text-slate-200">
                        <span>Read only</span>
                        <input
                          type="checkbox"
                          class={controlCheckboxClass}
                          checked={configReadOnly()}
                          onInput={(event) =>
                            setConfigReadOnly(event.currentTarget.checked)
                          }
                        />
                      </label>
                      <label class="flex items-center justify-between text-sm text-slate-700 dark:text-slate-200">
                        <span>Required</span>
                        <input
                          type="checkbox"
                          class={controlCheckboxClass}
                          checked={configRequired()}
                          onInput={(event) =>
                            setConfigRequired(event.currentTarget.checked)
                          }
                        />
                      </label>
                      <label class="flex items-center justify-between text-sm text-slate-700 dark:text-slate-200">
                        <span>Full width</span>
                        <input
                          type="checkbox"
                          class={controlCheckboxClass}
                          checked={configFullWidth()}
                          onInput={(event) =>
                            setConfigFullWidth(event.currentTarget.checked)
                          }
                        />
                      </label>
                      <label class="flex items-center justify-between text-sm text-slate-700 dark:text-slate-200">
                        <span>Error</span>
                        <input
                          type="checkbox"
                          class={controlCheckboxClass}
                          checked={configErrorFlag()}
                          onInput={(event) =>
                            setConfigErrorFlag(event.currentTarget.checked)
                          }
                        />
                      </label>
                      <label class="flex flex-col gap-2">
                        <span class={controlLabelClass}>Ring animation</span>
                        <select
                          class={controlInputClass}
                          value={configRingAnimation()}
                          onInput={(event) =>
                            setConfigRingAnimation(
                              event.currentTarget.value as RingAnimationSelection,
                            )
                          }
                        >
                          <For each={ringAnimationOptions}>
                            {(item) => <option value={item.value}>{item.label}</option>}
                          </For>
                        </select>
                      </label>
                      <button
                        type="button"
                        class={cx(
                          'mt-2 rounded-xl border border-slate-200/80 bg-white/80 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-700 shadow-sm transition',
                          'hover:-translate-y-0.5 hover:border-emerald-300 hover:text-emerald-600',
                          'disabled:cursor-not-allowed disabled:opacity-50',
                          'dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200',
                        )}
                        disabled={!ringAnimationEnabled(configRingAnimation()) || !ringApi()}
                        onClick={() => ringApi()?.pulseAndFocus()}
                      >
                        Trigger ring
                      </button>
                    </div>

                    <div class="grid gap-3">
                      <div class={controlLabelClass}>Copy</div>
                      <label class="flex flex-col gap-2">
                        <span class={controlLabelClass}>Label</span>
                        <input
                          class={controlInputClass}
                          value={configLabel() ?? ''}
                          onInput={(event) => {
                            const value = event.currentTarget.value;
                            setConfigLabel(value ? value : undefined);
                          }}
                        />
                      </label>
                      <label class="flex flex-col gap-2">
                        <span class={controlLabelClass}>Helper text</span>
                        <input
                          class={controlInputClass}
                          value={configHelperText() ?? ''}
                          onInput={(event) => {
                            const value = event.currentTarget.value;
                            setConfigHelperText(value ? value : undefined);
                          }}
                        />
                      </label>
                      <label class="flex flex-col gap-2">
                        <span class={controlLabelClass}>Error text</span>
                        <input
                          class={controlInputClass}
                          value={configErrorText() ?? ''}
                          onInput={(event) => {
                            const value = event.currentTarget.value;
                            setConfigErrorText(value ? value : undefined);
                          }}
                        />
                      </label>
                      <label class="flex flex-col gap-2">
                        <span class={controlLabelClass}>Placeholder</span>
                        <input
                          class={controlInputClass}
                          value={configPlaceholder() ?? ''}
                          onInput={(event) => {
                            const value = event.currentTarget.value;
                            setConfigPlaceholder(value ? value : undefined);
                          }}
                        />
                      </label>
                    </div>

                    <div class="grid gap-3">
                      <div class={controlLabelClass}>Options editor</div>
                      <label class="flex flex-col gap-2">
                        <span class={controlLabelClass}>Preset</span>
                        <select
                          class={controlInputClass}
                          value={configPreset()}
                          onInput={(event) =>
                            setConfigPreset(event.currentTarget.value as SelectPresetKey)
                          }
                        >
                          <For each={selectOptionPresets}>
                            {(preset) => (
                              <option value={preset.key}>{preset.label}</option>
                            )}
                          </For>
                        </select>
                      </label>

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
                              <div class="flex items-center justify-between">
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

                    <div class="grid gap-3">
                      <div class={controlLabelClass}>Adornments</div>
                      <label class="flex flex-col gap-2">
                        <span class={controlLabelClass}>Start</span>
                        <input
                          class={controlInputClass}
                          value={startAdornmentText()}
                          onInput={(event) =>
                            setStartAdornmentText(event.currentTarget.value)
                          }
                        />
                      </label>
                      <label class="flex flex-col gap-2">
                        <span class={controlLabelClass}>End</span>
                        <input
                          class={controlInputClass}
                          value={endAdornmentText()}
                          onInput={(event) =>
                            setEndAdornmentText(event.currentTarget.value)
                          }
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

            <section class="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-lg shadow-slate-200/40 dark:border-slate-800/80 dark:bg-slate-900/70 dark:shadow-slate-900/50">
              <h2 class="font-display text-lg font-semibold">Self-checks</h2>
              <p class="mt-2 text-sm text-slate-600 dark:text-slate-300">
                These checks verify aria wiring, helper rendering, and disabled/read-only
                behavior without a test runner.
              </p>

              <div class="mt-4 grid gap-4 md:grid-cols-2">
                <div class="rounded-2xl border border-slate-200/70 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                  <Select
                    id="select-self-check"
                    label="Self-check"
                    helperText="Helper should be visible"
                    error
                    errorText="Self-check error"
                    readOnly
                    options={yesNoOptions}
                    value={selfCheckValue()}
                    onValue={setSelfCheckValue}
                    ref={setSelfReadOnlyControl}
                  />
                </div>
                <div class="rounded-2xl border border-slate-200/70 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                  <Select
                    id="select-self-check-disabled"
                    label="Disabled select"
                    helperText="Disabled rendering"
                    disabled
                    options={yesNoOptions}
                    value="yes"
                    onValue={() => undefined}
                    ref={setSelfDisabledControl}
                  />
                </div>
              </div>

              <div class="mt-4 grid gap-2 text-sm">
                <div
                  class={cx(
                    'rounded-xl border px-3 py-2',
                    selfCheckStatus().ariaInvalid
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200'
                      : 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200',
                  )}
                >
                  aria-invalid set when error is active: {String(
                    selfCheckStatus().ariaInvalid,
                  )}
                </div>
                <div
                  class={cx(
                    'rounded-xl border px-3 py-2',
                    selfCheckStatus().ariaDescribedBy
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200'
                      : 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200',
                  )}
                >
                  aria-describedby links helper text: {String(
                    selfCheckStatus().ariaDescribedBy,
                  )}
                </div>
                <div
                  class={cx(
                    'rounded-xl border px-3 py-2',
                    selfCheckStatus().helperRendered
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200'
                      : 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200',
                  )}
                >
                  helper text rendered: {String(selfCheckStatus().helperRendered)}
                </div>
                <div
                  class={cx(
                    'rounded-xl border px-3 py-2',
                    selfCheckStatus().errorRendered
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200'
                      : 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200',
                  )}
                >
                  error text rendered: {String(selfCheckStatus().errorRendered)}
                </div>
                <div
                  class={cx(
                    'rounded-xl border px-3 py-2',
                    selfCheckStatus().readOnly
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200'
                      : 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200',
                  )}
                >
                  readOnly state applied: {String(selfCheckStatus().readOnly)}
                </div>
                <div
                  class={cx(
                    'rounded-xl border px-3 py-2',
                    selfCheckStatus().disabled
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200'
                      : 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200',
                  )}
                >
                  disabled attribute applied: {String(selfCheckStatus().disabled)}
                </div>
                <div
                  class={cx(
                    'rounded-xl border px-3 py-2',
                    selfCheckStatus().readOnlyBlockedOpen
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200'
                      : 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200',
                  )}
                >
                  readOnly blocks menu opening: {String(
                    selfCheckStatus().readOnlyBlockedOpen,
                  )}
                </div>
                <div
                  class={cx(
                    'rounded-xl border px-3 py-2',
                    selfCheckStatus().readOnlyFocusable
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200'
                      : 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200',
                  )}
                >
                  readOnly remains focusable: {String(
                    selfCheckStatus().readOnlyFocusable,
                  )}
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
};

export default SelectPlayground;
