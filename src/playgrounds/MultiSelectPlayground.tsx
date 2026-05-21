import { For, createEffect, createMemo, createSignal } from 'solid-js';
import type { Component } from 'solid-js';

import MultiSelect, {
  type MultiSelectOption,
  type MultiSelectProps,
  type MultiSelectSize,
  type MultiSelectVariant,
} from '../components/MultiSelect';
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

const DARK_MODE_STORAGE_KEY = 'darkMode';

const readStoredDarkMode = (fallback: boolean) => {
  if (typeof window === 'undefined') return fallback;
  const stored = window.localStorage.getItem(DARK_MODE_STORAGE_KEY);

  if (stored === null) return fallback;

  try {
    return Boolean(JSON.parse(stored));
  } catch {
    return fallback;
  }
};

const writeStoredDarkMode = (next: boolean) => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(DARK_MODE_STORAGE_KEY, JSON.stringify(next));
  }
};

const INSPECTOR_AS_PROPS_STORAGE_KEY = 'tf-code-viewer-as-props';

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

const INSPECTOR_CODE_VIEW_STORAGE_KEY = 'tf-code-viewer-object-json-view';

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

const variants: MultiSelectVariant[] = ['outlined', 'filled', 'standard'];
const sizes: MultiSelectSize[] = ['sm', 'md', 'lg'];

type PresetKey = 'states' | 'tags' | 'people';

const optionPresets: Array<{ key: PresetKey; label: string; options: MultiSelectOption[] }> = [
  {
    key: 'states',
    label: 'US States',
    options: [
      { value: 'ca', label: 'California', group: 'West' },
      { value: 'wa', label: 'Washington', group: 'West' },
      { value: 'tx', label: 'Texas', group: 'South' },
      { value: 'fl', label: 'Florida', group: 'South' },
      { value: 'ny', label: 'New York', group: 'Northeast', disabled: true },
    ],
  },
  {
    key: 'tags',
    label: 'Tags',
    options: [
      { value: 'design', label: 'Design', group: 'Discipline' },
      { value: 'frontend', label: 'Frontend', group: 'Discipline' },
      { value: 'backend', label: 'Backend', group: 'Discipline' },
      { value: 'urgent', label: 'Urgent', group: 'Priority' },
      { value: 'blocked', label: 'Blocked', group: 'Priority' },
    ],
  },
  {
    key: 'people',
    label: 'People',
    options: [
      { value: 'ava', label: 'Ava Patel', group: 'Engineering' },
      { value: 'noah', label: 'Noah Kim', group: 'Engineering' },
      { value: 'liam', label: 'Liam Chen', group: 'Product' },
      { value: 'mia', label: 'Mia Johnson', group: 'Product', disabled: true },
      { value: 'zoe', label: 'Zoe Garcia', group: 'Support' },
    ],
  },
];

const defaults = {
  value: ['ca', 'wa'],
  disabled: false,
  readOnly: false,
  required: false,
  error: false,
  fullWidth: false,
  ringAnimation: 'laser' as RingAnimationSelection,
  inline: false,
  searchable: true,
  clearable: true,
  maxSelected: undefined as number | undefined,
  variant: 'outlined' as MultiSelectVariant,
  size: 'md' as MultiSelectSize,
  label: 'Regions',
  helperText: 'Choose one or more regions.',
  errorText: 'Select at least one region.',
  placeholder: 'Find regions…',
  darkMode: false,
  preset: 'states' as PresetKey,
};

const variantOptions = variants.map((value) => ({value, label: value}));
const sizeOptions = sizes.map((value) => ({value, label: value}));
const presetOptions = optionPresets.map((item) => ({value: item.key, label: item.label}));
const maxSelectedOptions = [
  { value: '', label: 'Unlimited' },
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3', label: '3' },
  { value: '4', label: '4' },
] as const;

const ExampleCard: Component<{
  title: string;
  props: Omit<MultiSelectProps, 'value' | 'onValue'>;
  initialValue?: string[];
}> = (props) => {
  const [value, setValue] = createSignal(props.initialValue ?? []);

  createEffect(() => {
    const options = props.props.options ?? [];
    const valid = new Set(options.map((option) => option.value));
    const next = value().filter((item, index, arr) => valid.has(item) && arr.indexOf(item) === index);
    if (next.length !== value().length) {
      setValue(next);
    }
  });

  return (
    <div class="flex flex-col gap-3 rounded-2xl border border-slate-200/70 bg-white/80 p-4 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/60">
      <div class="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {props.title}
      </div>
      <MultiSelect {...props.props} fullWidth value={value()} onValue={setValue} />
    </div>
  );
};

const MultiSelectPlayground: Component = () => {
  const [darkMode, setDarkMode] = createSignal(readStoredDarkMode(defaults.darkMode));
  const setDarkModeAndPersist = (next: boolean) => {
    setDarkMode(next);
    writeStoredDarkMode(next);
  };
  const [preset, setPreset] = createSignal<PresetKey>(defaults.preset);

  const [configValue, setConfigValue] = createSignal<string[]>(defaults.value);
  const [configDisabled, setConfigDisabled] = createSignal(defaults.disabled);
  const [configReadOnly, setConfigReadOnly] = createSignal(defaults.readOnly);
  const [configRequired, setConfigRequired] = createSignal(defaults.required);
  const [configError, setConfigError] = createSignal(defaults.error);
  const [configFullWidth, setConfigFullWidth] = createSignal(defaults.fullWidth);
  const [configRingAnimation, setConfigRingAnimation] = createSignal<RingAnimationSelection>(
    defaults.ringAnimation,
  );
  const [configInline, setConfigInline] = createSignal(defaults.inline);
  const [configSearchable, setConfigSearchable] = createSignal(defaults.searchable);
  const [configClearable, setConfigClearable] = createSignal(defaults.clearable);
  const [configMaxSelected, setConfigMaxSelected] = createSignal<number | undefined>(
    defaults.maxSelected,
  );

  const [configVariant, setConfigVariant] = createSignal(defaults.variant);
  const [configSize, setConfigSize] = createSignal(defaults.size);
  const [configLabel, setConfigLabel] = createSignal<string | undefined>(defaults.label);
  const [configHelperText, setConfigHelperText] = createSignal<string | undefined>(
    defaults.helperText,
  );
  const [configErrorText, setConfigErrorText] = createSignal<string | undefined>(
    defaults.errorText,
  );
  const [configPlaceholder, setConfigPlaceholder] = createSignal<string | undefined>(
    defaults.placeholder,
  );
  const [ringApi, setRingApi] = createSignal<{
    pulse: () => void;
    focus: () => void;
    pulseAndFocus: () => void;
  }>();

  const activePreset = createMemo(
    () => optionPresets.find((item) => item.key === preset()) ?? optionPresets[0],
  );

  const options = createMemo(() => activePreset().options);

  createEffect(() => {
    const validValues = new Set(options().map((item) => item.value));
    const next = configValue().filter((item) => validValues.has(item));
    if (next.length !== configValue().length) {
      setConfigValue(next);
    }
  });

  const previewWrapperClass = createMemo(() =>
    cx('transition-all duration-200', configFullWidth() ? 'w-full' : 'max-w-xl'),
  );

  const inspectorSnapshot = createMemo(() =>
    JSON.stringify(
      {
        props: {
          value: configValue(),
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
          inline: configInline(),
          searchable: configSearchable(),
          clearable: configClearable(),
          maxSelected: configMaxSelected(),
          size: configSize(),
          variant: configVariant(),
          error: configError(),
          preset: activePreset().label,
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
    setDarkModeAndPersist(defaults.darkMode);
    setPreset(defaults.preset);
    setConfigValue(defaults.value);
    setConfigDisabled(defaults.disabled);
    setConfigReadOnly(defaults.readOnly);
    setConfigRequired(defaults.required);
    setConfigError(defaults.error);
    setConfigFullWidth(defaults.fullWidth);
    setConfigRingAnimation(defaults.ringAnimation);
    setConfigInline(defaults.inline);
    setConfigSearchable(defaults.searchable);
    setConfigClearable(defaults.clearable);
    setConfigMaxSelected(defaults.maxSelected);
    setConfigVariant(defaults.variant);
    setConfigSize(defaults.size);
    setConfigLabel(defaults.label);
    setConfigHelperText(defaults.helperText);
    setConfigErrorText(defaults.errorText);
    setConfigPlaceholder(defaults.placeholder);
  };

  const controlSections = (): readonly PlaygroundControlSection[] => [
    {
      heading: 'Appearance',
      controls: [
        {
          kind: 'select',
          label: 'Variant',
          value: configVariant,
          set: (next) => setConfigVariant(next as MultiSelectVariant),
          options: variantOptions,
        },
        {
          kind: 'select',
          label: 'Size',
          value: configSize,
          set: (next) => setConfigSize(next as MultiSelectSize),
          options: sizeOptions,
        },
        {
          kind: 'select',
          label: 'Max selected',
          value: () => (configMaxSelected() === undefined ? '' : String(configMaxSelected())),
          set: (next) =>
            setConfigMaxSelected(
              next === '' || Number.isNaN(Number(next)) ? undefined : Number(next),
            ),
          options: maxSelectedOptions,
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
      heading: 'Data',
      controls: [
        {
          kind: 'select',
          label: 'Options preset',
          value: preset,
          set: (next) => setPreset(next as PresetKey),
          options: presetOptions,
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
          label: 'Searchable',
          value: configSearchable,
          set: setConfigSearchable,
        },
        {
          kind: 'checkbox',
          label: 'Clearable',
          value: configClearable,
          set: setConfigClearable,
        },
        {
          kind: 'checkbox',
          label: 'Inline',
          value: configInline,
          set: setConfigInline,
        },
        {
          kind: 'checkbox',
          label: 'Full width',
          value: configFullWidth,
          set: setConfigFullWidth,
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
          label: 'Placeholder',
          value: configPlaceholder,
          set: (next) => setConfigPlaceholder(next),
        },
      ],
    },
  ];

  const examples: Array<{
    title: string;
    props: Omit<MultiSelectProps, 'value' | 'onValue'>;
    initialValue?: string[];
  }> = [
    {
      title: 'Default',
      props: {
        label: 'Regions',
        helperText: 'Pick the regions your team supports.',
        options: optionPresets[0].options,
        clearable: true,
      },
      initialValue: ['ca', 'wa'],
    },
    {
      title: 'Required',
      props: {
        label: 'Project tags',
        required: true,
        helperText: 'Choose at least one tag.',
        options: optionPresets[1].options,
      },
      initialValue: ['frontend'],
    },
    {
      title: 'Disabled',
      props: {
        label: 'Assigned reviewers',
        disabled: true,
        helperText: 'Managed by repository rules.',
        options: optionPresets[2].options,
      },
      initialValue: ['ava', 'noah'],
    },
    {
      title: 'Error state',
      props: {
        label: 'Escalation teams',
        error: true,
        errorText: 'At least one team must be selected.',
        options: [
          { value: 'oncall', label: 'On-call' },
          { value: 'platform', label: 'Platform' },
          { value: 'security', label: 'Security' },
        ],
      },
    },
    {
      title: 'Filled variant',
      props: {
        label: 'Feature flags',
        variant: 'filled',
        options: [
          { value: 'beta-ui', label: 'Beta UI' },
          { value: 'new-billing', label: 'New billing flow' },
          { value: 'smart-search', label: 'Smart search' },
        ],
      },
      initialValue: ['beta-ui'],
    },
    {
      title: 'Standard variant',
      props: {
        label: 'Deployment targets',
        variant: 'standard',
        options: [
          { value: 'dev', label: 'Development' },
          { value: 'stage', label: 'Staging' },
          { value: 'prod', label: 'Production' },
        ],
      },
      initialValue: ['stage'],
    },
    {
      title: 'Max selected',
      props: {
        label: 'Alert channels',
        helperText: 'Limit to two channels.',
        maxSelected: 2,
        options: [
          { value: 'email', label: 'Email' },
          { value: 'sms', label: 'SMS' },
          { value: 'slack', label: 'Slack' },
          { value: 'pager', label: 'Pager' },
        ],
      },
      initialValue: ['email', 'slack'],
    },
    {
      title: 'Read only + class overrides',
      props: {
        label: 'Organization scopes',
        readOnly: true,
        helperText: 'Synced from organization policy.',
        options: [
          { value: 'viewer', label: 'Viewer' },
          { value: 'editor', label: 'Editor' },
          { value: 'admin', label: 'Admin' },
        ],
        rootClass: 'rounded-2xl bg-amber-50/80 p-3 dark:bg-amber-500/10',
        labelClass: 'text-amber-700 dark:text-amber-200',
        helperClass: 'text-amber-600 dark:text-amber-300',
      },
      initialValue: ['editor'],
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
            <div class="flex items-center justify-between">
              <div>
                <div class="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-600 dark:text-emerald-300">
                  Solid MultiSelect Lab
                </div>
                <h1 class="font-display text-3xl font-semibold sm:text-4xl">
                  MUI-like multi-select, rebuilt for Solid
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
            <section class="animate-rise rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-lg shadow-slate-200/40 dark:border-slate-800/80 dark:bg-slate-900/70 dark:shadow-slate-900/50">
              <div class="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 class="font-display text-lg font-semibold">Live preview</h2>
                  <div class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {configVariant()} / {configSize()}
                  </div>
                </div>
                <div class="flex flex-col items-end gap-2">
                  <PlaygroundNav />
                  <label class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    <span>Dark</span>
                    <input
                      type="checkbox"
                      class={controlCheckboxClass}
                      checked={darkMode()}
                      onInput={(event) => setDarkModeAndPersist(event.currentTarget.checked)}
                    />
                  </label>
                </div>
              </div>

              <div class="mt-6 flex flex-col gap-6">
                <div class="flex flex-col gap-3">
                  <div class={previewWrapperClass()}>
                    <MultiSelect
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
                      inline={configInline()}
                      size={configSize()}
                      variant={configVariant()}
                      value={configValue()}
                      options={options()}
                      searchable={configSearchable()}
                      clearable={configClearable()}
                      maxSelected={configMaxSelected()}
                      placeholder={configPlaceholder()}
                      error={configError()}
                      onValue={setConfigValue}
                    />
                  </div>

                  <div class="rounded-2xl border border-slate-200/70 bg-slate-50/90 p-3 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-300">
                    Selected values: <span class="font-mono">[{configValue().join(', ')}]</span>
                  </div>
                </div>

                <div class="grid gap-6 lg:grid-cols-2 lg:items-stretch">
                  <div class="h-full rounded-2xl border border-slate-200/70 bg-white/70 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/40">
                  <PlaygroundControlPanel sections={controlSections()} />
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

          </main>
        </div>
      </div>
    </div>
  );
};

export default MultiSelectPlayground;
