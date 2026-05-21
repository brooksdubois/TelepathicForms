import { For, createMemo, createSignal } from 'solid-js';
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
    cx('transition-all duration-200', configFullWidth() ? 'w-full' : 'max-w-lg'),
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
            <div class="flex items-center justify-between">
              <div>
                <div class="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-600 dark:text-emerald-300">
                  Solid Slider Lab
                </div>
                <h1 class="font-display text-3xl font-semibold sm:text-4xl">
                  Flexible range sliders, rebuilt for Solid
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
                    {configMode()} / {configVariant()} / {configSize()}
                  </div>
                </div>
                <div class="flex flex-col items-end gap-2">
                  <PlaygroundNav />
                  <label class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    <span>Dark</span>
                    <input
                      type="checkbox"
                      class={controlCheckboxClass}
                      checked={darkModeStore.isDarkMode()}
                      onInput={(event) => darkModeStore.setDarkMode(event.currentTarget.checked)}
                    />
                  </label>
                </div>
              </div>

              <div class="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr),320px]">
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

                <div class="rounded-2xl border border-slate-200/70 bg-white/70 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/40">
                  <PlaygroundControlPanel sections={controlSections()} />
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

export default SliderPlayground;
