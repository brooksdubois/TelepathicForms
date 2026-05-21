import { For, createMemo, createSignal, onMount } from 'solid-js';
import type { Component } from 'solid-js';

import Slider, {
  type SliderProps,
  type SliderSize,
  type SliderVariant,
  type SliderMode,
} from '../primitives/Slider';
import PlaygroundNav from './PlaygroundNav';
import {
  PlaygroundControlPanel,
  type PlaygroundControlSection,
} from './shared/PlaygroundControls';
import { cx } from '../utils/cx';
import { darkModeStore } from '../darkModeStore';
import CodeViewer from '../components/CodeViewer';

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

const variants: SliderVariant[] = ['outlined', 'filled', 'standard'];
const sizes: SliderSize[] = ['sm', 'md', 'lg'];
const modes: SliderMode[] = ['single', 'range', 'stepper'];
const variantOptions = variants.map((value) => ({value, label: value}));
const sizeOptions = sizes.map((value) => ({value, label: value}));
const modeOptions = modes.map((value) => ({value, label: value}));

const defaults = {
  singleValue: 50,
  rangeValue: [25, 75] as [number, number],
  stepperValue: 50,
  disabled: false,
  readOnly: false,
  required: false,
  fullWidth: false,
  ringEnabled: true,
  showValue: true,
  showInput: true,
  variant: 'outlined' as SliderVariant,
  size: 'md' as SliderSize,
  mode: 'single' as SliderMode,
  min: 0,
  max: 100,
  step: 1,
  label: 'Select a value',
  helperText: 'Drag the slider or click to select.',
};

const ExampleCard: Component<{
  title: string;
  mode: SliderMode;
  props: Omit<SliderProps, 'value' | 'onInput' | 'onChange'>;
}> = (props) => {
  const initialValue = props.mode === 'range' ? [25, 75] as [number, number] : 50;
  const [value, setValue] = createSignal(initialValue);

  return (
    <div class="flex flex-col gap-3 rounded-2xl border border-slate-200/70 bg-white/80 p-4 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/60">
      <div class="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {props.title}
      </div>
      <Slider
        {...props.props}
        fullWidth
        value={value()}
        onInput={(next) => setValue(next)}
        onChange={(next) => setValue(next)}
      />
    </div>
  );
};

const SliderPlayground: Component = () => {
  onMount(() => darkModeStore.initializeDarkMode());

  const [configMode, setConfigMode] = createSignal(defaults.mode);
  const [configSingleValue, setConfigSingleValue] = createSignal(defaults.singleValue);
  const [configRangeValue, setConfigRangeValue] = createSignal(defaults.rangeValue);
  const [configStepperValue, setConfigStepperValue] = createSignal(defaults.stepperValue);
  const [configDisabled, setConfigDisabled] = createSignal(defaults.disabled);
  const [configReadOnly, setConfigReadOnly] = createSignal(defaults.readOnly);
  const [configRequired, setConfigRequired] = createSignal(defaults.required);
  const [configFullWidth, setConfigFullWidth] = createSignal(defaults.fullWidth);
  const [configRingEnabled, setConfigRingEnabled] = createSignal(defaults.ringEnabled);
  const [configShowValue, setConfigShowValue] = createSignal(defaults.showValue);
  const [configShowInput, setConfigShowInput] = createSignal(defaults.showInput);
  const [configVariant, setConfigVariant] = createSignal(defaults.variant);
  const [configSize, setConfigSize] = createSignal(defaults.size);
  const [configMin, setConfigMin] = createSignal(defaults.min);
  const [configMax, setConfigMax] = createSignal(defaults.max);
  const [configStep, setConfigStep] = createSignal(defaults.step);
  const [configLabel, setConfigLabel] = createSignal(defaults.label);
  const [configHelperText, setConfigHelperText] = createSignal(defaults.helperText);
  const [ringApi, setRingApi] = createSignal<{
    pulse: () => void;
    focus: () => void;
    pulseAndFocus: () => void;
  }>();

  const previewWrapperClass = createMemo(() =>
    cx(
      "tf-playground-preview-frame",
      configFullWidth() ? "max-w-4xl" : "max-w-3xl",
    ),
  );

  const getCurrentValue = () => {
    if (configMode() === 'range') {
      return configRangeValue();
    } else if (configMode() === 'stepper') {
      return configStepperValue();
    }
    return configSingleValue();
  };

  const inspectorSnapshot = createMemo(() =>
    JSON.stringify(
      {
        props: {
          value: getCurrentValue(),
          mode: configMode(),
          min: configMin(),
          max: configMax(),
          step: configStep(),
          label: configLabel(),
          helperText: configHelperText(),
          required: configRequired(),
          disabled: configDisabled(),
          readOnly: configReadOnly(),
          fullWidth: configFullWidth(),
          ringEnabled: configRingEnabled(),
          showValue: configShowValue(),
          showInput: configShowInput(),
          size: configSize(),
          variant: configVariant(),
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
    const dark = darkModeStore.isDarkMode();

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
      heading: 'Mode',
      controls: [
        {
          kind: 'select',
          label: 'Type',
          value: configMode,
          set: (next) => setConfigMode(next as SliderMode),
          options: modeOptions,
        },
      ],
    },
    {
      heading: 'Appearance',
      controls: [
        {
          kind: 'select',
          label: 'Variant',
          value: configVariant,
          set: (next) => setConfigVariant(next as SliderVariant),
          options: variantOptions,
        },
        {
          kind: 'select',
          label: 'Size',
          value: configSize,
          set: (next) => setConfigSize(next as SliderSize),
          options: sizeOptions,
        },
      ],
    },
    {
      heading: 'Configuration',
      controls: [
        {
          kind: 'number',
          label: 'Min',
          value: configMin,
          set: (next) => setConfigMin(next ?? defaults.min),
        },
        {
          kind: 'number',
          label: 'Max',
          value: configMax,
          set: (next) => setConfigMax(next ?? defaults.max),
        },
        {
          kind: 'number',
          label: 'Step',
          value: configStep,
          set: (next) => setConfigStep(next ?? defaults.step),
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
          label: 'Ring enabled',
          value: configRingEnabled,
          set: setConfigRingEnabled,
        },
        {
          kind: 'checkbox',
          label: 'Show value',
          value: configShowValue,
          set: setConfigShowValue,
        },
        {
          kind: 'checkbox',
          label: 'Show input',
          value: configShowInput,
          set: setConfigShowInput,
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
      ],
    },
  ];

  const resetControls = () => {
    setConfigMode(defaults.mode);
    setConfigSingleValue(defaults.singleValue);
    setConfigRangeValue(defaults.rangeValue);
    setConfigStepperValue(defaults.stepperValue);
    setConfigDisabled(defaults.disabled);
    setConfigReadOnly(defaults.readOnly);
    setConfigRequired(defaults.required);
    setConfigFullWidth(defaults.fullWidth);
    setConfigRingEnabled(defaults.ringEnabled);
    setConfigShowValue(defaults.showValue);
    setConfigShowInput(defaults.showInput);
    setConfigVariant(defaults.variant);
    setConfigSize(defaults.size);
    setConfigMin(defaults.min);
    setConfigMax(defaults.max);
    setConfigStep(defaults.step);
    setConfigLabel(defaults.label);
    setConfigHelperText(defaults.helperText);
  };

  const examples: Array<{
    title: string;
    mode: SliderMode;
    props: Omit<SliderProps, 'value' | 'onInput' | 'onChange'>;
  }> = [
    {
      title: 'Single Slider',
      mode: 'single',
      props: {
        label: 'Volume',
        helperText: 'Adjust volume level',
        min: 0,
        max: 100,
        step: 1,
      },
    },
    {
      title: 'Range Slider',
      mode: 'range',
      props: {
        label: 'Price Range',
        helperText: 'Select price range ($0 - $1000)',
        min: 0,
        max: 1000,
        step: 10,
        marks: [
          { value: 0, label: '$0' },
          { value: 250, label: '$250' },
          { value: 500, label: '$500' },
          { value: 750, label: '$750' },
          { value: 1000, label: '$1000' },
        ],
      },
    },
    {
      title: 'Stepper Control',
      mode: 'stepper',
      props: {
        label: 'Quantity',
        helperText: 'Use +/- buttons or type a value',
        min: 1,
        max: 100,
        step: 1,
      },
    },
    {
      title: 'Disabled State',
      mode: 'single',
      props: {
        label: 'Disabled Slider',
        helperText: 'This slider cannot be interacted with',
        disabled: true,
      },
    },
    {
      title: 'Read Only',
      mode: 'single',
      props: {
        label: 'Read Only Value',
        helperText: 'Display only, cannot be changed',
        readOnly: true,
      },
    },
    {
      title: 'Percentage Slider',
      mode: 'single',
      props: {
        label: 'Brightness',
        helperText: 'Adjust brightness (0% - 100%)',
        min: 0,
        max: 100,
        step: 5,
        marks: [
          { value: 0, label: '0%' },
          { value: 50, label: '50%' },
          { value: 100, label: '100%' },
        ],
      },
    },
    {
      title: 'Small Size',
      mode: 'single',
      props: {
        label: 'Small Slider',
        size: 'sm',
      },
    },
    {
      title: 'Large Size',
      mode: 'single',
      props: {
        label: 'Large Slider',
        size: 'lg',
      },
    },
    {
      title: 'Filled Variant',
      mode: 'single',
      props: {
        label: 'Filled Style',
        variant: 'filled',
      },
    },
    {
      title: 'Standard Variant',
      mode: 'single',
      props: {
        label: 'Standard Style',
        variant: 'standard',
      },
    },
  ];

  const controlCheckboxClass =
    'h-4 w-4 rounded border-slate-300 accent-emerald-500 focus:ring-emerald-400';

  return (
    <div class={cx('min-h-screen', darkModeStore.isDarkMode() ? 'dark' : '')}>
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
                  Solid Slider Lab
                </div>
                <h1 class="font-display text-3xl font-semibold sm:text-4xl">
                  Slider, Rebuilt for Solid
                </h1>
              </div>
              <div class="flex flex-col items-end gap-2">
                <PlaygroundNav />
                <label class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  <span>Dark</span>
                  <input
                    type="checkbox"
                    class="h-4 w-4 rounded border-slate-300 accent-emerald-500 focus:ring-emerald-400"
                    checked={darkModeStore.isDarkMode()}
                    onInput={(event) => darkModeStore.setDarkMode(event.currentTarget.checked)}
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
                    {configMode()} / {configVariant()} / {configSize()}
                  </div>
                </div>
              </div>

              <div class="mt-6 flex flex-col gap-6">
                <div class="flex flex-col gap-3">
                  <div class={previewWrapperClass()}>
                    {configMode() === 'single' && (
                      <Slider
                        label={configLabel()}
                        helperText={configHelperText()}
                        required={configRequired()}
                        disabled={configDisabled()}
                        readOnly={configReadOnly()}
                        fullWidth={configFullWidth()}
                        ringEnabled={configRingEnabled()}
                        onRingApi={setRingApi}
                        size={configSize()}
                        variant={configVariant()}
                        min={configMin()}
                        max={configMax()}
                        step={configStep()}
                        value={configSingleValue()}
                        onInput={(val) => setConfigSingleValue(val as number)}
                        onChange={(val) => setConfigSingleValue(val as number)}
                        showValue={configShowValue()}
                      />
                    )}
                    {configMode() === 'range' && (
                      <Slider
                        label={configLabel()}
                        helperText={configHelperText()}
                        required={configRequired()}
                        disabled={configDisabled()}
                        readOnly={configReadOnly()}
                        fullWidth={configFullWidth()}
                        ringEnabled={configRingEnabled()}
                        onRingApi={setRingApi}
                        size={configSize()}
                        variant={configVariant()}
                        min={configMin()}
                        max={configMax()}
                        step={configStep()}
                        mode="range"
                        value={configRangeValue()}
                        onInput={(val) => setConfigRangeValue(val as [number, number])}
                        onChange={(val) => setConfigRangeValue(val as [number, number])}
                        showValue={configShowValue()}
                      />
                    )}
                    {configMode() === 'stepper' && (
                      <Slider
                        label={configLabel()}
                        helperText={configHelperText()}
                        required={configRequired()}
                        disabled={configDisabled()}
                        readOnly={configReadOnly()}
                        fullWidth={configFullWidth()}
                        ringEnabled={configRingEnabled()}
                        onRingApi={setRingApi}
                        size={configSize()}
                        variant={configVariant()}
                        min={configMin()}
                        max={configMax()}
                        step={configStep()}
                        mode="stepper"
                        value={configStepperValue()}
                        onInput={(val) => setConfigStepperValue(val as number)}
                        onChange={(val) => setConfigStepperValue(val as number)}
                        showValue={configShowValue()}
                        showInput={configShowInput()}
                      />
                    )}
                  </div>
                  <div class="text-xs text-slate-500 dark:text-slate-400">
                    Fully controlled slider with {configMode()} mode.
                  </div>
                </div>

                <div class="grid gap-6 lg:grid-cols-2 lg:items-stretch">
                  <div class="h-full rounded-2xl border border-slate-200/70 bg-white/70 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/40">
                  <PlaygroundControlPanel sections={controlSections()} />
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
                      mode={item.mode}
                      props={item.props}
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

export default SliderPlayground;
