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
import { cx } from '../utils/cx';

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
  const [darkMode, setDarkMode] = createSignal(defaults.darkMode);
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

  const resetControls = () => {
    setDarkMode(defaults.darkMode);
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
                  <PlaygroundNav currentPath="/multi-select" />
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
              </div>

              <div class="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr),320px]">
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

                <div class="rounded-2xl border border-slate-200/70 bg-white/70 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/40">
                  <div class="flex flex-col gap-4">
                    <div class="grid gap-3">
                      <div class={controlLabelClass}>Data</div>
                      <label class="flex flex-col gap-2">
                        <span class={controlLabelClass}>Options preset</span>
                        <select
                          class={controlInputClass}
                          value={preset()}
                          onInput={(event) => setPreset(event.currentTarget.value as PresetKey)}
                        >
                          <For each={optionPresets}>
                            {(item) => <option value={item.key}>{item.label}</option>}
                          </For>
                        </select>
                      </label>
                    </div>

                    <div class="grid gap-3">
                      <div class={controlLabelClass}>Appearance</div>
                      <label class="flex flex-col gap-2">
                        <span class={controlLabelClass}>Variant</span>
                        <select
                          class={controlInputClass}
                          value={configVariant()}
                          onInput={(event) =>
                            setConfigVariant(event.currentTarget.value as MultiSelectVariant)
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
                            setConfigSize(event.currentTarget.value as MultiSelectSize)
                          }
                        >
                          <For each={sizes}>
                            {(item) => <option value={item}>{item}</option>}
                          </For>
                        </select>
                      </label>
                      <label class="flex flex-col gap-2">
                        <span class={controlLabelClass}>Max selected</span>
                        <select
                          class={controlInputClass}
                          value={configMaxSelected() === undefined ? '' : String(configMaxSelected())}
                          onInput={(event) => {
                            const next = event.currentTarget.value;
                            setConfigMaxSelected(next === '' ? undefined : Number(next));
                          }}
                        >
                          <option value="">Unlimited</option>
                          <option value="1">1</option>
                          <option value="2">2</option>
                          <option value="3">3</option>
                          <option value="4">4</option>
                        </select>
                      </label>
                    </div>

                    <div class="grid gap-2">
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
                      <label class="flex items-center justify-between text-sm text-slate-700 dark:text-slate-200">
                        <span>Searchable</span>
                        <input
                          type="checkbox"
                          class={controlCheckboxClass}
                          checked={configSearchable()}
                          onInput={(event) => setConfigSearchable(event.currentTarget.checked)}
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
                      <label class="flex items-center justify-between text-sm text-slate-700 dark:text-slate-200">
                        <span>Inline</span>
                        <input
                          type="checkbox"
                          class={controlCheckboxClass}
                          checked={configInline()}
                          onInput={(event) => setConfigInline(event.currentTarget.checked)}
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
                            const next = event.currentTarget.value;
                            setConfigLabel(next ? next : undefined);
                          }}
                        />
                      </label>
                      <label class="flex flex-col gap-2">
                        <span class={controlLabelClass}>Helper text</span>
                        <input
                          class={controlInputClass}
                          value={configHelperText() ?? ''}
                          onInput={(event) => {
                            const next = event.currentTarget.value;
                            setConfigHelperText(next ? next : undefined);
                          }}
                        />
                      </label>
                      <label class="flex flex-col gap-2">
                        <span class={controlLabelClass}>Placeholder</span>
                        <input
                          class={controlInputClass}
                          value={configPlaceholder() ?? ''}
                          onInput={(event) => {
                            const next = event.currentTarget.value;
                            setConfigPlaceholder(next ? next : undefined);
                          }}
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

export default MultiSelectPlayground;
