import { For, createMemo, createSignal } from 'solid-js';
import type { Component } from 'solid-js';

import TextArea, {
  type TextAreaSize,
  type TextAreaVariant,
} from '../components/TextArea';
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

const variants: TextAreaVariant[] = ['outlined', 'filled', 'standard'];
const sizes: TextAreaSize[] = ['sm', 'md', 'lg'];
const variantsOptions = variants.map((value) => ({value, label: value}));
const sizeOptions = sizes.map((value) => ({value, label: value}));

const defaults = {
  variant: 'outlined' as TextAreaVariant,
  size: 'md' as TextAreaSize,
  disabled: false,
  readOnly: false,
  required: false,
  fullWidth: false,
  ringAnimation: 'laser' as RingAnimationSelection,
  autosize: true,
  minRows: 2,
  maxRows: 6 as number | undefined,
  rows: 4,
  label: 'Notes',
  helperText: 'Share project context for your team.',
  errorText: 'Please add at least a short note.',
  placeholder: 'Write your notes here...',
  autoComplete: 'off',
  darkMode: false,
  value: '',
  error: false,
  startAdornmentText: '',
  endAdornmentText: '',
};

const adornmentBadge = (value: string) => (
  <span class="rounded-full bg-slate-900/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600 dark:bg-white/10 dark:text-slate-300">
    {value}
  </span>
);

const parsePositiveInt = (value: string) => {
  if (value.trim() === '') return undefined;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return undefined;
  return Math.max(1, parsed);
};

const TextAreaPlayground: Component = () => {
  const [darkMode, setDarkMode] = createSignal(defaults.darkMode);
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
  const [configAutosize, setConfigAutosize] = createSignal(defaults.autosize);
  const [configMinRows, setConfigMinRows] = createSignal(defaults.minRows);
  const [configMaxRowsInput, setConfigMaxRowsInput] = createSignal(
    defaults.maxRows?.toString() ?? '',
  );
  const [configRows, setConfigRows] = createSignal(defaults.rows);
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
  const [configAutoComplete, setConfigAutoComplete] = createSignal(
    defaults.autoComplete,
  );
  const [configErrorFlag, setConfigErrorFlag] = createSignal(defaults.error);
  const [startAdornmentText, setStartAdornmentText] = createSignal(
    defaults.startAdornmentText,
  );
  const [endAdornmentText, setEndAdornmentText] = createSignal(
    defaults.endAdornmentText,
  );

  const [ringApi, setRingApi] = createSignal<{
    pulse: () => void;
    focus: () => void;
    pulseAndFocus: () => void;
  }>();

  const resolvedMinRows = createMemo(() => Math.max(1, configMinRows()));
  const resolvedMaxRows = createMemo(() => {
    const parsed = parsePositiveInt(configMaxRowsInput());
    if (parsed === undefined) return undefined;
    return Math.max(parsed, resolvedMinRows());
  });
  const resolvedRows = createMemo(() => Math.max(1, configRows()));

  const startAdornment = createMemo(() => {
    const value = startAdornmentText();
    return value ? adornmentBadge(value) : null;
  });

  const endAdornment = createMemo(() => {
    const value = endAdornmentText();
    return value ? adornmentBadge(value) : null;
  });

  const previewWrapperClass = createMemo(() =>
    cx('transition-all duration-200', configFullWidth() ? 'w-full' : 'max-w-xl'),
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
          autoComplete: configAutoComplete(),
          minLength: 2,
          maxLength: 300,
          required: configRequired(),
          disabled: configDisabled(),
          readOnly: configReadOnly(),
          fullWidth: configFullWidth(),
          ringEnabled: ringAnimationEnabled(configRingAnimation()),
          ringVariant: ringAnimationVariant(configRingAnimation()),
          autosize: configAutosize(),
          minRows: resolvedMinRows(),
          maxRows: resolvedMaxRows(),
          rows: configAutosize() ? undefined : resolvedRows(),
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

  const resetControls = () => {
    setDarkMode(defaults.darkMode);
    setPreviewValue(defaults.value);
    setConfigVariant(defaults.variant);
    setConfigSize(defaults.size);
    setConfigDisabled(defaults.disabled);
    setConfigReadOnly(defaults.readOnly);
    setConfigRequired(defaults.required);
    setConfigFullWidth(defaults.fullWidth);
    setConfigRingAnimation(defaults.ringAnimation);
    setConfigAutosize(defaults.autosize);
    setConfigMinRows(defaults.minRows);
    setConfigMaxRowsInput(defaults.maxRows?.toString() ?? '');
    setConfigRows(defaults.rows);
    setConfigLabel(defaults.label);
    setConfigHelperText(defaults.helperText);
    setConfigErrorText(defaults.errorText);
    setConfigPlaceholder(defaults.placeholder);
    setConfigAutoComplete(defaults.autoComplete);
    setConfigErrorFlag(defaults.error);
    setStartAdornmentText(defaults.startAdornmentText);
    setEndAdornmentText(defaults.endAdornmentText);
  };

  const controlSections = (): readonly PlaygroundControlSection[] => [
    {
      heading: 'Appearance',
      controls: [
        {
          kind: 'select',
          label: 'Variant',
          value: configVariant,
          set: (next) => setConfigVariant(next as TextAreaVariant),
          options: variantsOptions,
        },
        {
          kind: 'select',
          label: 'Size',
          value: configSize,
          set: (next) => setConfigSize(next as TextAreaSize),
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
        {
          kind: 'checkbox',
          label: 'Autosize',
          value: configAutosize,
          set: setConfigAutosize,
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
        {
          kind: 'text',
          label: 'Placeholder',
          value: configPlaceholder,
          set: setConfigPlaceholder,
        },
        {
          kind: 'text',
          label: 'Auto complete',
          value: configAutoComplete,
          set: setConfigAutoComplete,
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
                  Solid TextArea Lab
                </div>
                <h1 class="font-display text-3xl font-semibold sm:text-4xl">
                  Controlled textarea primitive for Solid
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
              Explore the TextArea primitive API and autosize behavior with
              TextField-matching variants, sizing, states, and ring controls.
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
                      class="h-4 w-4 rounded border-slate-300 accent-emerald-500 focus:ring-emerald-400"
                      checked={darkMode()}
                      onInput={(event) => setDarkMode(event.currentTarget.checked)}
                    />
                  </label>
                </div>
              </div>

              <div class="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr),320px]">
                <div class="flex flex-col gap-3">
                  <div class={previewWrapperClass()}>
                    <TextArea
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
                      autosize={configAutosize()}
                      minRows={resolvedMinRows()}
                      maxRows={resolvedMaxRows()}
                      rows={resolvedRows()}
                      size={configSize()}
                      variant={configVariant()}
                      startAdornment={startAdornment()}
                      endAdornment={endAdornment()}
                      placeholder={configPlaceholder()}
                      autoComplete={configAutoComplete()}
                      minLength={2}
                      maxLength={300}
                      error={configErrorFlag()}
                      value={previewValue()}
                      onValue={setPreviewValue}
                    />
                  </div>
                  <div class="text-xs text-slate-500 dark:text-slate-400">
                    Type directly in the preview to edit the controlled value.
                  </div>
                </div>

                <div class="rounded-2xl border border-slate-200/70 bg-white/70 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/40">
                  <PlaygroundControlPanel sections={controlSections()} />
                  <button
                    type="button"
                    class={PlaygroundRingButtonClass}
                    disabled={!ringAnimationEnabled(configRingAnimation()) || !ringApi()}
                    onClick={() => ringApi()?.pulseAndFocus()}
                  >
                    Trigger ring
                  </button>

                  <div class="mt-4 grid gap-3">
                    <div class="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Dimensions
                    </div>
                    <label class="flex flex-col gap-2">
                      <span class="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Min rows
                      </span>
                      <input
                        type="number"
                        min="1"
                        class="w-full rounded-xl border border-slate-200/80 bg-white/80 px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/40 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100"
                        value={configMinRows()}
                        onInput={(event) =>
                          setConfigMinRows(
                            Math.max(1, Number.parseInt(event.currentTarget.value, 10) || 1),
                          )
                        }
                      />
                    </label>
                    <label class="flex flex-col gap-2">
                      <span class="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Max rows (optional)
                      </span>
                      <input
                        type="number"
                        min="1"
                        disabled={!configAutosize()}
                        class={cx(
                          'w-full rounded-xl border border-slate-200/80 bg-white/80 px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/40 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100',
                          !configAutosize() ? 'cursor-not-allowed opacity-60' : '',
                        )}
                        value={configMaxRowsInput()}
                        placeholder="unset"
                        onInput={(event) =>
                          setConfigMaxRowsInput(event.currentTarget.value)
                        }
                      />
                    </label>
                    <label class="flex flex-col gap-2">
                      <span class="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Rows (autosize off)
                      </span>
                      <input
                        type="number"
                        min="1"
                        disabled={configAutosize()}
                        class={cx(
                          'w-full rounded-xl border border-slate-200/80 bg-white/80 px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/40 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100',
                          configAutosize() ? 'cursor-not-allowed opacity-60' : '',
                        )}
                        value={resolvedRows()}
                        onInput={(event) =>
                          setConfigRows(
                            Math.max(1, Number.parseInt(event.currentTarget.value, 10) || 1),
                          )
                        }
                      />
                    </label>
                    <label class="flex flex-col gap-2">
                      <span class="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Value
                      </span>
                      <textarea
                        class="min-h-28 w-full rounded-xl border border-slate-200/80 bg-white/80 px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/40 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100 resize-y"
                        value={previewValue()}
                        onInput={(event) => setPreviewValue(event.currentTarget.value)}
                      />
                    </label>
                  </div>
                </div>
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

export default TextAreaPlayground;
