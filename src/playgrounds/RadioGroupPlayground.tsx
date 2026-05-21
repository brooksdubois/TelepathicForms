import { For, createEffect, createMemo, createSignal } from 'solid-js';
import type { Component } from 'solid-js';

import RadioGroup, {
  type RadioGroupProps,
  type RadioGroupSize,
  type RadioGroupVariant,
  type RadioOption,
} from '../components/RadioGroup';
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

const variants: RadioGroupVariant[] = ['outlined', 'filled', 'standard'];
const sizes: RadioGroupSize[] = ['sm', 'md', 'lg'];
const variantOptions = variants.map((value) => ({value, label: value}));
const sizeOptions = sizes.map((value) => ({value, label: value}));

const previewOptions: RadioOption[] = [
  { value: 'email', label: 'Email', helperText: 'Weekly summary and product notes.' },
  { value: 'sms', label: 'SMS' },
  { value: 'push', label: 'Push notifications', disabled: true },
  { value: 'none', label: 'No notifications' },
];

const defaults = {
  value: 'email',
  disabled: false,
  readOnly: false,
  required: false,
  error: false,
  fullWidth: false,
  ringAnimation: 'laser' as RingAnimationSelection,
  inline: false,
  variant: 'outlined' as RadioGroupVariant,
  size: 'md' as RadioGroupSize,
  label: 'Notification channel',
  helperText: 'Choose how you want us to contact you.',
  errorText: 'Select one option to continue.',
  darkMode: false,
};

const ExampleCard: Component<{
  title: string;
  props: Omit<RadioGroupProps, 'value' | 'onValue'>;
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
      <RadioGroup {...props.props} fullWidth value={value()} onValue={setValue} />
    </div>
  );
};

const RadioGroupPlayground: Component = () => {
  const [darkMode, setDarkMode] = createSignal(readStoredDarkMode(defaults.darkMode));
  const setDarkModeAndPersist = (next: boolean) => {
    setDarkMode(next);
    writeStoredDarkMode(next);
  };
  const [configValue, setConfigValue] = createSignal(defaults.value);
  const [configDisabled, setConfigDisabled] = createSignal(defaults.disabled);
  const [configReadOnly, setConfigReadOnly] = createSignal(defaults.readOnly);
  const [configRequired, setConfigRequired] = createSignal(defaults.required);
  const [configError, setConfigError] = createSignal(defaults.error);
  const [configFullWidth, setConfigFullWidth] = createSignal(defaults.fullWidth);
  const [configRingAnimation, setConfigRingAnimation] = createSignal<RingAnimationSelection>(
    defaults.ringAnimation,
  );
  const [configInline, setConfigInline] = createSignal(defaults.inline);
  const [configVariant, setConfigVariant] = createSignal(defaults.variant);
  const [configSize, setConfigSize] = createSignal(defaults.size);
  const [configLabel, setConfigLabel] = createSignal<string | undefined>(
    defaults.label,
  );
  const [configHelperText, setConfigHelperText] = createSignal<string | undefined>(
    defaults.helperText,
  );
  const [configErrorText, setConfigErrorText] = createSignal<string | undefined>(
    defaults.errorText,
  );
  const [ringApi, setRingApi] = createSignal<{
    pulse: () => void;
    focus: () => void;
    pulseAndFocus: () => void;
  }>();

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
          required: configRequired(),
          disabled: configDisabled(),
          readOnly: configReadOnly(),
          fullWidth: configFullWidth(),
          ringEnabled: ringAnimationEnabled(configRingAnimation()),
          ringVariant: ringAnimationVariant(configRingAnimation()),
          inline: configInline(),
          error: configError(),
          size: configSize(),
          variant: configVariant(),
          options: previewOptions,
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
      heading: 'Appearance',
      controls: [
        {
          kind: 'select',
          label: 'Variant',
          value: configVariant,
          set: (next) => setConfigVariant(next as RadioGroupVariant),
          options: variantOptions,
        },
        {
          kind: 'select',
          label: 'Size',
          value: configSize,
          set: (next) => setConfigSize(next as RadioGroupSize),
          options: sizeOptions,
        },
        {
          kind: 'select',
          label: 'Value',
          value: configValue,
          set: (next) => setConfigValue(next),
          options: previewOptions.map((option) => ({
            value: option.value,
            label: option.label,
          })),
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
          kind: 'select',
          label: 'Ring animation',
          value: () => configRingAnimation(),
          set: (next) =>
            setConfigRingAnimation(next as RingAnimationSelection),
          options: ringAnimationOptions,
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
          set: setConfigLabel,
        },
        {
          kind: 'text',
          label: 'Helper text',
          value: configHelperText,
          set: setConfigHelperText,
        },
        {
          kind: 'text',
          label: 'Error text',
          value: configErrorText,
          set: setConfigErrorText,
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
    setConfigRingAnimation(defaults.ringAnimation);
    setConfigInline(defaults.inline);
    setConfigVariant(defaults.variant);
    setConfigSize(defaults.size);
    setConfigLabel(defaults.label);
    setConfigHelperText(defaults.helperText);
    setConfigErrorText(defaults.errorText);
  };

  const examples: Array<{
    title: string;
    props: Omit<RadioGroupProps, 'value' | 'onValue'>;
    initialValue?: string;
  }> = [
    {
      title: 'Default',
      props: {
        label: 'Preferred channel',
        helperText: 'Choose one option.',
        options: previewOptions,
      },
      initialValue: 'email',
    },
    {
      title: 'Required',
      props: {
        label: 'Primary contact',
        required: true,
        helperText: 'Required for account alerts.',
        options: [
          { value: 'email', label: 'Email' },
          { value: 'sms', label: 'SMS' },
          { value: 'phone', label: 'Phone call' },
        ],
      },
    },
    {
      title: 'Disabled',
      props: {
        label: 'Delivery mode',
        disabled: true,
        helperText: 'Managed by your organization.',
        options: [
          { value: 'live', label: 'Live updates' },
          { value: 'daily', label: 'Daily digest' },
          { value: 'weekly', label: 'Weekly digest' },
        ],
      },
      initialValue: 'daily',
    },
    {
      title: 'Error state',
      props: {
        label: 'Escalation path',
        error: true,
        errorText: 'Select a path before proceeding.',
        options: [
          { value: 'pagerduty', label: 'PagerDuty' },
          { value: 'slack', label: 'Slack' },
          { value: 'email', label: 'Email' },
        ],
      },
    },
    {
      title: 'Filled variant',
      props: {
        label: 'Workspace visibility',
        variant: 'filled',
        options: [
          { value: 'private', label: 'Private' },
          { value: 'internal', label: 'Internal' },
          { value: 'public', label: 'Public', helperText: 'Visible to everyone.' },
        ],
      },
      initialValue: 'internal',
    },
    {
      title: 'Standard variant',
      props: {
        label: 'Theme preference',
        variant: 'standard',
        options: [
          { value: 'system', label: 'System' },
          { value: 'light', label: 'Light' },
          { value: 'dark', label: 'Dark' },
        ],
      },
      initialValue: 'system',
    },
    {
      title: 'Inline layout',
      props: {
        label: 'Data residency',
        inline: true,
        options: [
          { value: 'us', label: 'US' },
          { value: 'eu', label: 'EU' },
          { value: 'apac', label: 'APAC' },
        ],
      },
      initialValue: 'us',
    },
    {
      title: 'Read only',
      props: {
        label: 'Plan family',
        readOnly: true,
        helperText: 'Inherited from billing.',
        options: [
          { value: 'starter', label: 'Starter' },
          { value: 'growth', label: 'Growth' },
          { value: 'enterprise', label: 'Enterprise' },
        ],
      },
      initialValue: 'growth',
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
            <div class="flex items-center justify-between">
              <div>
                <div class="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-600 dark:text-emerald-300">
                  Solid RadioGroup Lab
                </div>
                <h1 class="font-display text-3xl font-semibold sm:text-4xl">
                  MUI-like radio groups, rebuilt for Solid
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
                    <RadioGroup
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
                      error={configError()}
                      value={configValue()}
                      options={previewOptions}
                      onValue={setConfigValue}
                    />
                  </div>
                  <div class="text-xs text-slate-500 dark:text-slate-400">
                    Native keyboard behavior works automatically because all radios share the same name.
                  </div>
                </div>

                <div class="grid gap-6 lg:grid-cols-2 lg:items-stretch">
                  <div class="h-full rounded-2xl border border-slate-200/70 bg-white/70 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/40">
                  <div class="flex flex-col gap-4">
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

export default RadioGroupPlayground;
