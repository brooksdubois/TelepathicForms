import { For, Show, createEffect, createMemo, createSignal, onMount } from 'solid-js';
import type { Component } from 'solid-js';

import TextField, {
  type TextFieldProps,
  type TextFieldSize,
  type TextFieldVariant,
} from '../components/TextField';
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
import { navigateTo, routeHref } from '../router';
import { routePathByComponent } from '../routes';
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

const variants: TextFieldVariant[] = ['outlined', 'filled', 'standard'];
const sizes: TextFieldSize[] = ['sm', 'md', 'lg'];

const defaults = {
  variant: 'outlined' as TextFieldVariant,
  size: 'md' as TextFieldSize,
  disabled: false,
  readOnly: false,
  required: false,
  fullWidth: false,
  ringAnimation: 'laser' as RingAnimationSelection,
  label: 'Email address',
  helperText: 'We will only use this for account updates.',
  errorText: 'Enter a valid email address.',
  placeholder: 'name@company.com',
  startAdornmentText: '',
  endAdornmentText: '',
  type: 'email',
  darkMode: false,
  value: '',
};

const variantOptions = variants.map((value) => ({value, label: value}));
const sizeOptions = sizes.map((value) => ({value, label: value}));
const typeOptions = [
  {value: 'text', label: 'text'},
  {value: 'email', label: 'email'},
  {value: 'password', label: 'password'},
  {value: 'number', label: 'number'},
] as const;

const adornmentBadge = (value: string) => (
  <span class="rounded-full bg-slate-900/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600 dark:bg-white/10 dark:text-slate-300">
    {value}
  </span>
);

const ExampleCard: Component<{
  title: string;
  props: Omit<TextFieldProps, 'value' | 'onValue'>;
  initialValue?: string;
}> = (props) => {
  const [value, setValue] = createSignal(props.initialValue ?? '');

  return (
    <div class="flex flex-col gap-3 rounded-2xl border border-slate-200/70 bg-white/80 p-4 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/60">
      <div class="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {props.title}
      </div>
      <TextField
        {...props.props}
        fullWidth
        value={value()}
        onValue={setValue}
      />
    </div>
  );
};

const TextFieldPlayground: Component = () => {
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
  const [configLabel, setConfigLabel] = createSignal(defaults.label);
  const [configHelperText, setConfigHelperText] = createSignal(
    defaults.helperText,
  );
  const [configErrorText, setConfigErrorText] = createSignal(defaults.errorText);
  const [configPlaceholder, setConfigPlaceholder] = createSignal(
    defaults.placeholder,
  );
  const [configType, setConfigType] = createSignal(defaults.type);
  const [configAutoComplete, setConfigAutoComplete] = createSignal(
    defaults.type === 'email' ? 'email' : 'off',
  );
  const [configErrorFlag, setConfigErrorFlag] = createSignal(false);

  const startAdornment = createMemo(() => {
    const value = startAdornmentText();
    return value ? adornmentBadge(value) : null;
  });

  const endAdornment = createMemo(() => {
    const value = endAdornmentText();
    return value ? adornmentBadge(value) : null;
  });

  const previewFullWidth = createMemo(() => configFullWidth());

  const inspectorSnapshot = createMemo(() =>
    JSON.stringify(
      {
        props: {
          value: previewValue(),
          label: configLabel(),
          helperText: configHelperText(),
          errorText: configErrorText(),
          placeholder: configPlaceholder(),
          type: configType(),
          autoComplete: configAutoComplete(),
          minLength: 2,
          maxLength: 64,
          required: configRequired(),
          disabled: configDisabled(),
          readOnly: configReadOnly(),
          fullWidth: configFullWidth(),
          ringEnabled: ringAnimationEnabled(configRingAnimation()),
          ringVariant: ringAnimationVariant(configRingAnimation()),
          size: configSize(),
          variant: configVariant(),
          error: configErrorFlag(),
          startAdornment: startAdornmentText() || undefined,
          endAdornment: endAdornmentText() || undefined,
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
    setConfigType(defaults.type);
    setConfigAutoComplete(defaults.type === 'email' ? 'email' : 'off');
    setConfigErrorFlag(false);
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
          set: (next) => setConfigVariant(next as TextFieldVariant),
          options: variantOptions,
        },
        {
          kind: 'select',
          label: 'Size',
          value: configSize,
          set: (next) => setConfigSize(next as TextFieldSize),
          options: sizeOptions,
        },
        {
          kind: 'select',
          label: 'Type',
          value: configType,
          set: (next) => {
            setConfigType(next);
            setConfigAutoComplete(next === 'email' ? 'email' : 'off');
          },
          options: typeOptions,
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

  const previewWrapperClass = createMemo(() =>
    cx('transition-all duration-200', previewFullWidth() ? 'w-full' : 'max-w-sm'),
  );

  const examples: Array<{
    title: string;
    props: Omit<TextFieldProps, 'value' | 'onValue'>;
    initialValue?: string;
  }> = [
    {
      title: 'Default',
      props: {
        label: 'Full name',
        placeholder: 'Add your name',
        helperText: 'Matches your ID card.',
        variant: 'outlined',
      },
    },
    {
      title: 'Required',
      props: {
        label: 'Company',
        required: true,
        helperText: 'Required field.',
      },
    },
    {
      title: 'Disabled',
      props: {
        label: 'Disabled',
        disabled: true,
        helperText: 'Unavailable right now.',
      },
      initialValue: 'Not editable',
    },
    {
      title: 'Error (prop)',
      props: {
        label: 'Username',
        error: true,
        errorText: 'This handle is taken.',
      },
      initialValue: 'solid-ui',
    },
    {
      title: 'Filled variant',
      props: {
        label: 'Team',
        variant: 'filled',
        helperText: 'Shown on your profile.',
      },
    },
    {
      title: 'Standard variant',
      props: {
        label: 'Role',
        variant: 'standard',
        helperText: 'Displayed in the roster.',
      },
    },
    {
      title: 'With adornments',
      props: {
        label: 'Budget',
        startAdornment: (
          <span class="text-xs font-semibold uppercase tracking-wide text-slate-500">
            USD
          </span>
        ),
        endAdornment: (
          <span class="text-xs font-semibold uppercase tracking-wide text-slate-500">
            /mo
          </span>
        ),
      },
      initialValue: '1200',
    },
    {
      title: 'Password',
      props: {
        label: 'Password',
        type: 'password',
        helperText: 'Use at least 10 characters.',
      },
      initialValue: 'password123',
    },
    {
      title: 'Read only',
      props: {
        label: 'Plan',
        readOnly: true,
        helperText: 'Synced from billing.',
      },
      initialValue: 'Growth',
    },
    {
      title: 'Long helper text',
      props: {
        label: 'Bio',
        helperText:
          'Keep it concise. This copy wraps to demonstrate spacing on longer helper text for multi-line usage.',
      },
    },
    {
      title: 'Helper emphasis',
      props: {
        label: 'Repo name',
        helperText: 'Use lowercase letters, numbers, and hyphens only.',
      },
    },
    {
      title: 'Slot overrides',
      props: {
        label: 'Project',
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
        helperText: 'Custom colors via hooks.',
        rootClass: 'rounded-2xl bg-amber-50/80 p-3 dark:bg-amber-500/10',
        labelClass: 'text-amber-700 dark:text-amber-200',
        inputClass: 'text-amber-900 dark:text-amber-100',
        helperClass: 'text-amber-600 dark:text-amber-300',
      },
    },
  ];

  const [selfCheckValue, setSelfCheckValue] = createSignal('Read only');
  const [selfReadOnlyInput, setSelfReadOnlyInput] =
    createSignal<HTMLInputElement>();
  const [selfDisabledInput, setSelfDisabledInput] =
    createSignal<HTMLInputElement>();
  const [selfCheckStatus, setSelfCheckStatus] = createSignal({
    ariaInvalid: false,
    ariaDescribedBy: false,
    helperRendered: false,
    errorRendered: false,
    readOnly: false,
    disabled: false,
  });

  createEffect(() => {
    const readOnlyInput = selfReadOnlyInput();
    const disabledInput = selfDisabledInput();
    const helper = document.getElementById('self-check-helper');
    const helperTextValue = helper?.textContent ?? '';

    setSelfCheckStatus({
      ariaInvalid: readOnlyInput?.getAttribute('aria-invalid') === 'true',
      ariaDescribedBy:
        (readOnlyInput?.getAttribute('aria-describedby') ?? '').includes(
          'self-check-helper',
        ) ?? false,
      helperRendered: Boolean(helper),
      errorRendered: helperTextValue.includes('Self-check error'),
      readOnly: Boolean(readOnlyInput?.readOnly),
      disabled: Boolean(disabledInput?.disabled),
    });
  });

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
                  Solid TextField Lab
                </div>
                <h1 class="font-display text-3xl font-semibold sm:text-4xl">
                  MUI-like inputs, rebuilt for Solid
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
            <p class="max-w-2xl text-sm text-slate-600 dark:text-slate-300">
              Live-edit a SolidJS TextField and see how each prop changes the
              component appearance and behavior.
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
                    <TextField
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
                      type={configType()}
                      autoComplete={configAutoComplete()}
                      minLength={2}
                      maxLength={64}
                      error={configErrorFlag()}
                      value={previewValue()}
                      onValue={setPreviewValue}
                    />
                  </div>
                  <div class="text-xs text-slate-500 dark:text-slate-400">
                    Use the controls to explore how each prop affects the input.
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
              <div class="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 class="font-display text-lg font-semibold">Solid Select Lab</h2>
                  <p class="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
                    A dedicated Select playground is available at `/select` with
                    exhaustive controls, examples, meta states, inspector, and
                    self-checks.
                  </p>
                </div>
                <a
                  href={routeHref(routePathByComponent.select)}
                  onClick={(event) => {
                    event.preventDefault();
                    navigateTo(routePathByComponent.select);
                  }}
                  class="rounded-full border border-slate-200/80 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:text-emerald-600 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200"
                >
                  Open Select Lab
                </a>
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
              <h2 class="font-display text-lg font-semibold">Self-checks</h2>
              <p class="mt-2 text-sm text-slate-600 dark:text-slate-300">
                These checks verify aria wiring, helper rendering, and
                disabled/read-only behavior without a test runner.
              </p>

              <div class="mt-4 grid gap-4 md:grid-cols-2">
                <div class="rounded-2xl border border-slate-200/70 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                  <TextField
                    id="self-check"
                    label="Self-check"
                    helperText="Helper should be visible"
                    error
                    errorText="Self-check error"
                    readOnly
                    value={selfCheckValue()}
                    onValue={setSelfCheckValue}
                    ref={setSelfReadOnlyInput}
                  />
                </div>
                <div class="rounded-2xl border border-slate-200/70 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                  <TextField
                    id="self-check-disabled"
                    label="Disabled field"
                    helperText="Disabled rendering"
                    disabled
                    value="Disabled"
                    onValue={() => undefined}
                    ref={setSelfDisabledInput}
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
                  readOnly set: {String(selfCheckStatus().readOnly)}
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
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
};

export default TextFieldPlayground;
