import { For, createMemo, createSignal } from 'solid-js';
import type { Component } from 'solid-js';

import TextArea, {
  type TextAreaSize,
  type TextAreaVariant,
  type TextAreaResize,
  type TextAreaCountMode,
} from '../primitives/TextArea';
import PlaygroundNav from './PlaygroundNav';
import {
  ringAnimationEnabled,
  ringAnimationOptions,
  ringAnimationVariant,
  type RingAnimationSelection,
} from './ringAnimationOptions';
import { cx } from '../utils/cx';
import { darkModeStore } from '../darkModeStore';

const variants: TextAreaVariant[] = ['outlined', 'filled', 'standard'];
const sizes: TextAreaSize[] = ['sm', 'md', 'lg'];
const resizeModes: TextAreaResize[] = ['auto', 'manual', 'none'];
const countModes: { label: string; value: TextAreaCountMode }[] = [
  { label: 'Off', value: false },
  { label: 'Characters', value: 'characters' },
  { label: 'Words', value: 'words' },
];

const defaults = {
  variant: 'outlined' as TextAreaVariant,
  size: 'md' as TextAreaSize,
  resize: 'auto' as TextAreaResize,
  showCount: false as TextAreaCountMode,
  disabled: false,
  readOnly: false,
  required: false,
  fullWidth: false,
  ringAnimation: 'laser' as RingAnimationSelection,
  minRows: 2,
  maxRows: 6 as number | undefined,
  rows: 4,
  minHeight: 60,
  maxHeight: 400,
  maxLength: undefined as number | undefined,
  label: 'Notes',
  helperText: 'Share project context for your team.',
  errorText: 'Please add at least a short note.',
  placeholder: 'Write your notes here...',
  autoComplete: 'off',
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
  const [previewValue, setPreviewValue] = createSignal(defaults.value);
  const [configVariant, setConfigVariant] = createSignal(defaults.variant);
  const [configSize, setConfigSize] = createSignal(defaults.size);
  const [configResize, setConfigResize] = createSignal(defaults.resize);
  const [configShowCount, setConfigShowCount] = createSignal<TextAreaCountMode>(defaults.showCount);
  const [configDisabled, setConfigDisabled] = createSignal(defaults.disabled);
  const [configReadOnly, setConfigReadOnly] = createSignal(defaults.readOnly);
  const [configRequired, setConfigRequired] = createSignal(defaults.required);
  const [configFullWidth, setConfigFullWidth] = createSignal(defaults.fullWidth);
  const [configRingAnimation, setConfigRingAnimation] = createSignal<RingAnimationSelection>(
    defaults.ringAnimation,
  );
  const [configMinRows, setConfigMinRows] = createSignal(defaults.minRows);
  const [configMaxRowsInput, setConfigMaxRowsInput] = createSignal(
    defaults.maxRows?.toString() ?? '',
  );
  const [configRows, setConfigRows] = createSignal(defaults.rows);
  const [configMinHeight, setConfigMinHeight] = createSignal(defaults.minHeight);
  const [configMaxHeight, setConfigMaxHeight] = createSignal(defaults.maxHeight);
  const [configMaxLengthInput, setConfigMaxLengthInput] = createSignal(
    defaults.maxLength?.toString() ?? '',
  );
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
  const [configAutoComplete, setConfigAutoComplete] = createSignal(defaults.autoComplete);
  const [configErrorFlag, setConfigErrorFlag] = createSignal(defaults.error);
  const [startAdornmentText, setStartAdornmentText] = createSignal(defaults.startAdornmentText);
  const [endAdornmentText, setEndAdornmentText] = createSignal(defaults.endAdornmentText);

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
  const resolvedMaxLength = createMemo(() => parsePositiveInt(configMaxLengthInput()));

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
          maxLength: resolvedMaxLength(),
          required: configRequired(),
          disabled: configDisabled(),
          readOnly: configReadOnly(),
          fullWidth: configFullWidth(),
          ringEnabled: ringAnimationEnabled(configRingAnimation()),
          ringVariant: ringAnimationVariant(configRingAnimation()),
          resize: configResize(),
          showCount: configShowCount(),
          minRows: resolvedMinRows(),
          maxRows: resolvedMaxRows(),
          rows: configResize() !== 'auto' ? resolvedRows() : undefined,
          minHeight: configResize() === 'manual' ? configMinHeight() : undefined,
          maxHeight: configResize() === 'manual' ? configMaxHeight() : undefined,
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
    setPreviewValue(defaults.value);
    setConfigVariant(defaults.variant);
    setConfigSize(defaults.size);
    setConfigResize(defaults.resize);
    setConfigShowCount(defaults.showCount);
    setConfigDisabled(defaults.disabled);
    setConfigReadOnly(defaults.readOnly);
    setConfigRequired(defaults.required);
    setConfigFullWidth(defaults.fullWidth);
    setConfigRingAnimation(defaults.ringAnimation);
    setConfigMinRows(defaults.minRows);
    setConfigMaxRowsInput(defaults.maxRows?.toString() ?? '');
    setConfigRows(defaults.rows);
    setConfigMinHeight(defaults.minHeight);
    setConfigMaxHeight(defaults.maxHeight);
    setConfigMaxLengthInput(defaults.maxLength?.toString() ?? '');
    setConfigLabel(defaults.label);
    setConfigHelperText(defaults.helperText);
    setConfigErrorText(defaults.errorText);
    setConfigPlaceholder(defaults.placeholder);
    setConfigAutoComplete(defaults.autoComplete);
    setConfigErrorFlag(defaults.error);
    setStartAdornmentText(defaults.startAdornmentText);
    setEndAdornmentText(defaults.endAdornmentText);
  };

  const controlLabelClass =
    'text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400';
  const controlInputClass =
    'w-full rounded-xl border border-slate-200/80 bg-white/80 px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/40 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100';
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
                  Solid TextArea Lab
                </div>
                <h1 class="font-display text-3xl font-semibold sm:text-4xl">
                  Multiline input with resize &amp; character count
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
            <PlaygroundNav currentPath="/textarea" />
            <p class="max-w-2xl text-sm text-slate-600 dark:text-slate-300">
              Explore the TextArea primitive with auto-resize, manual drag-to-resize,
              character/word counters, and all the variants you know from TextField.
            </p>
          </header>

          <main class="flex flex-col gap-6">
            {/* ── Live Preview ── */}
            <section class="animate-rise rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-lg shadow-slate-200/40 dark:border-slate-800/80 dark:bg-slate-900/70 dark:shadow-slate-900/50">
              <div class="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 class="font-display text-lg font-semibold">Live preview</h2>
                  <div class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {configVariant()} / {configSize()} / resize: {configResize()}
                  </div>
                </div>
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
                      resize={configResize()}
                      showCount={configShowCount()}
                      minRows={resolvedMinRows()}
                      maxRows={resolvedMaxRows()}
                      rows={resolvedRows()}
                      minHeight={configMinHeight()}
                      maxHeight={configMaxHeight()}
                      maxLength={resolvedMaxLength()}
                      size={configSize()}
                      variant={configVariant()}
                      startAdornment={startAdornment()}
                      endAdornment={endAdornment()}
                      placeholder={configPlaceholder()}
                      autoComplete={configAutoComplete()}
                      error={configErrorFlag()}
                      value={previewValue()}
                      onValue={setPreviewValue}
                    />
                  </div>
                  <div class="text-xs text-slate-500 dark:text-slate-400">
                    {configResize() === 'auto'
                      ? 'Textarea grows automatically as you type.'
                      : configResize() === 'manual'
                        ? 'Drag the handle in the bottom-right corner to resize.'
                        : 'Fixed size — no resizing.'}
                  </div>
                </div>

                {/* ── Controls Panel ── */}
                <div class="rounded-2xl border border-slate-200/70 bg-white/70 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/40">
                  <div class="flex flex-col gap-4">
                    {/* Appearance */}
                    <div class="grid gap-3">
                      <div class={controlLabelClass}>Appearance</div>
                      <label class="flex flex-col gap-2">
                        <span class={controlLabelClass}>Variant</span>
                        <select
                          class={controlInputClass}
                          value={configVariant()}
                          onInput={(e) => setConfigVariant(e.currentTarget.value as TextAreaVariant)}
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
                          onInput={(e) => setConfigSize(e.currentTarget.value as TextAreaSize)}
                        >
                          <For each={sizes}>
                            {(item) => <option value={item}>{item}</option>}
                          </For>
                        </select>
                      </label>
                    </div>

                    {/* Resize & Count */}
                    <div class="grid gap-3">
                      <div class={controlLabelClass}>Resize &amp; Count</div>
                      <label class="flex flex-col gap-2">
                        <span class={controlLabelClass}>Resize mode</span>
                        <select
                          class={controlInputClass}
                          value={configResize()}
                          onInput={(e) => setConfigResize(e.currentTarget.value as TextAreaResize)}
                        >
                          <For each={resizeModes}>
                            {(item) => <option value={item}>{item}</option>}
                          </For>
                        </select>
                      </label>
                      <label class="flex flex-col gap-2">
                        <span class={controlLabelClass}>Show count</span>
                        <select
                          class={controlInputClass}
                          value={String(configShowCount())}
                          onInput={(e) => {
                            const val = e.currentTarget.value;
                            setConfigShowCount(
                              val === 'false' ? false : (val as TextAreaCountMode),
                            );
                          }}
                        >
                          <For each={countModes}>
                            {(item) => (
                              <option value={String(item.value)}>{item.label}</option>
                            )}
                          </For>
                        </select>
                      </label>
                      <label class="flex flex-col gap-2">
                        <span class={controlLabelClass}>Max length (optional)</span>
                        <input
                          type="number"
                          min="1"
                          class={controlInputClass}
                          value={configMaxLengthInput()}
                          placeholder="unset"
                          onInput={(e) => setConfigMaxLengthInput(e.currentTarget.value)}
                        />
                      </label>
                    </div>

                    {/* Rows config */}
                    <div class="grid gap-3">
                      <div class={controlLabelClass}>Sizing</div>
                      <label class="flex flex-col gap-2">
                        <span class={controlLabelClass}>Min rows</span>
                        <input
                          type="number"
                          min="1"
                          class={controlInputClass}
                          value={configMinRows()}
                          onInput={(e) =>
                            setConfigMinRows(Math.max(1, parseInt(e.currentTarget.value, 10) || 1))
                          }
                        />
                      </label>
                      <label class="flex flex-col gap-2">
                        <span class={controlLabelClass}>Max rows (auto mode)</span>
                        <input
                          type="number"
                          min="1"
                          disabled={configResize() !== 'auto'}
                          class={cx(
                            controlInputClass,
                            configResize() !== 'auto' ? 'cursor-not-allowed opacity-60' : '',
                          )}
                          value={configMaxRowsInput()}
                          placeholder="unset"
                          onInput={(e) => setConfigMaxRowsInput(e.currentTarget.value)}
                        />
                      </label>
                      <label class="flex flex-col gap-2">
                        <span class={controlLabelClass}>Rows (non-auto modes)</span>
                        <input
                          type="number"
                          min="1"
                          disabled={configResize() === 'auto'}
                          class={cx(
                            controlInputClass,
                            configResize() === 'auto' ? 'cursor-not-allowed opacity-60' : '',
                          )}
                          value={resolvedRows()}
                          onInput={(e) =>
                            setConfigRows(Math.max(1, parseInt(e.currentTarget.value, 10) || 1))
                          }
                        />
                      </label>
                      <label class="flex flex-col gap-2">
                        <span class={controlLabelClass}>Min height px (manual)</span>
                        <input
                          type="number"
                          min="30"
                          disabled={configResize() !== 'manual'}
                          class={cx(
                            controlInputClass,
                            configResize() !== 'manual' ? 'cursor-not-allowed opacity-60' : '',
                          )}
                          value={configMinHeight()}
                          onInput={(e) =>
                            setConfigMinHeight(Math.max(30, parseInt(e.currentTarget.value, 10) || 60))
                          }
                        />
                      </label>
                      <label class="flex flex-col gap-2">
                        <span class={controlLabelClass}>Max height px (manual)</span>
                        <input
                          type="number"
                          min="60"
                          disabled={configResize() !== 'manual'}
                          class={cx(
                            controlInputClass,
                            configResize() !== 'manual' ? 'cursor-not-allowed opacity-60' : '',
                          )}
                          value={configMaxHeight()}
                          onInput={(e) =>
                            setConfigMaxHeight(Math.max(60, parseInt(e.currentTarget.value, 10) || 400))
                          }
                        />
                      </label>
                    </div>

                    {/* State */}
                    <div class="grid gap-2">
                      <div class={controlLabelClass}>State</div>
                      <label class="flex items-center justify-between text-sm text-slate-700 dark:text-slate-200">
                        <span>Disabled</span>
                        <input
                          type="checkbox"
                          class={controlCheckboxClass}
                          checked={configDisabled()}
                          onInput={(e) => setConfigDisabled(e.currentTarget.checked)}
                        />
                      </label>
                      <label class="flex items-center justify-between text-sm text-slate-700 dark:text-slate-200">
                        <span>Read only</span>
                        <input
                          type="checkbox"
                          class={controlCheckboxClass}
                          checked={configReadOnly()}
                          onInput={(e) => setConfigReadOnly(e.currentTarget.checked)}
                        />
                      </label>
                      <label class="flex items-center justify-between text-sm text-slate-700 dark:text-slate-200">
                        <span>Required</span>
                        <input
                          type="checkbox"
                          class={controlCheckboxClass}
                          checked={configRequired()}
                          onInput={(e) => setConfigRequired(e.currentTarget.checked)}
                        />
                      </label>
                      <label class="flex items-center justify-between text-sm text-slate-700 dark:text-slate-200">
                        <span>Full width</span>
                        <input
                          type="checkbox"
                          class={controlCheckboxClass}
                          checked={configFullWidth()}
                          onInput={(e) => setConfigFullWidth(e.currentTarget.checked)}
                        />
                      </label>
                      <label class="flex items-center justify-between text-sm text-slate-700 dark:text-slate-200">
                        <span>Error</span>
                        <input
                          type="checkbox"
                          class={controlCheckboxClass}
                          checked={configErrorFlag()}
                          onInput={(e) => setConfigErrorFlag(e.currentTarget.checked)}
                        />
                      </label>
                      <label class="flex flex-col gap-2">
                        <span class={controlLabelClass}>Ring animation</span>
                        <select
                          class={controlInputClass}
                          value={configRingAnimation()}
                          onInput={(e) =>
                            setConfigRingAnimation(e.currentTarget.value as RingAnimationSelection)
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

                    {/* Copy */}
                    <div class="grid gap-3">
                      <div class={controlLabelClass}>Copy</div>
                      <label class="flex flex-col gap-2">
                        <span class={controlLabelClass}>Label</span>
                        <input
                          class={controlInputClass}
                          value={configLabel() ?? ''}
                          onInput={(e) => {
                            const v = e.currentTarget.value;
                            setConfigLabel(v || undefined);
                          }}
                        />
                      </label>
                      <label class="flex flex-col gap-2">
                        <span class={controlLabelClass}>Helper text</span>
                        <input
                          class={controlInputClass}
                          value={configHelperText() ?? ''}
                          onInput={(e) => {
                            const v = e.currentTarget.value;
                            setConfigHelperText(v || undefined);
                          }}
                        />
                      </label>
                      <label class="flex flex-col gap-2">
                        <span class={controlLabelClass}>Error text</span>
                        <input
                          class={controlInputClass}
                          value={configErrorText() ?? ''}
                          onInput={(e) => {
                            const v = e.currentTarget.value;
                            setConfigErrorText(v || undefined);
                          }}
                        />
                      </label>
                      <label class="flex flex-col gap-2">
                        <span class={controlLabelClass}>Placeholder</span>
                        <input
                          class={controlInputClass}
                          value={configPlaceholder() ?? ''}
                          onInput={(e) => {
                            const v = e.currentTarget.value;
                            setConfigPlaceholder(v || undefined);
                          }}
                        />
                      </label>
                    </div>

                    {/* Adornments */}
                    <div class="grid gap-3">
                      <div class={controlLabelClass}>Adornments</div>
                      <label class="flex flex-col gap-2">
                        <span class={controlLabelClass}>Start</span>
                        <input
                          class={controlInputClass}
                          value={startAdornmentText()}
                          onInput={(e) => setStartAdornmentText(e.currentTarget.value)}
                        />
                      </label>
                      <label class="flex flex-col gap-2">
                        <span class={controlLabelClass}>End</span>
                        <input
                          class={controlInputClass}
                          value={endAdornmentText()}
                          onInput={(e) => setEndAdornmentText(e.currentTarget.value)}
                        />
                      </label>
                    </div>

                    {/* Value */}
                    <div class="grid gap-2">
                      <div class={controlLabelClass}>Value</div>
                      <textarea
                        class={cx(controlInputClass, 'min-h-28 resize-y')}
                        value={previewValue()}
                        onInput={(e) => setPreviewValue(e.currentTarget.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ── Examples Grid ── */}
            <section class="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-lg shadow-slate-200/40 dark:border-slate-800/80 dark:bg-slate-900/70 dark:shadow-slate-900/50">
              <h2 class="font-display text-lg font-semibold">Examples</h2>
              <div class="mt-5 grid gap-4 md:grid-cols-2">
                {/* Auto resize */}
                <ExampleCard
                  title="Auto resize"
                  description="Grows as you type, up to 6 rows."
                  resize="auto"
                  minRows={2}
                  maxRows={6}
                  placeholder="Start typing to see it grow..."
                />

                {/* Manual drag resize */}
                <ExampleCard
                  title="Manual drag resize"
                  description="Drag the corner handle to resize."
                  resize="manual"
                  rows={3}
                  minHeight={80}
                  maxHeight={300}
                  placeholder="Drag the ↘ handle to resize..."
                />

                {/* Character count */}
                <ExampleCard
                  title="Character count (max 200)"
                  description="Shows character count with limit."
                  resize="auto"
                  showCount="characters"
                  maxLength={200}
                  minRows={2}
                  maxRows={8}
                  placeholder="Describe your opinion..."
                />

                {/* Word count */}
                <ExampleCard
                  title="Word count"
                  description="Tracks word count as you type."
                  resize="auto"
                  showCount="words"
                  minRows={3}
                  placeholder="Write your life story here..."
                />

                {/* Fixed size */}
                <ExampleCard
                  title="Fixed / no resize"
                  description="Fixed height, no resizing."
                  resize="none"
                  rows={4}
                  placeholder="Fixed size textarea..."
                />

                {/* Filled + manual */}
                <ExampleCard
                  title="Filled + manual resize"
                  description="Filled variant with drag handle."
                  resize="manual"
                  variant="filled"
                  rows={3}
                  minHeight={80}
                  maxHeight={250}
                  showCount="characters"
                  maxLength={500}
                  placeholder="Filled variant, drag to resize..."
                />
              </div>
            </section>

            {/* ── Inspector ── */}
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

/* ── Example Card ── */

const ExampleCard: Component<{
  title: string;
  description: string;
  resize: TextAreaResize;
  variant?: TextAreaVariant;
  showCount?: TextAreaCountMode;
  maxLength?: number;
  rows?: number;
  minRows?: number;
  maxRows?: number;
  minHeight?: number;
  maxHeight?: number;
  placeholder?: string;
}> = (props) => {
  const [value, setValue] = createSignal('');

  return (
    <div class="flex flex-col gap-3 rounded-2xl border border-slate-200/70 bg-white/80 p-4 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/60">
      <div>
        <div class="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {props.title}
        </div>
        <div class="text-xs text-slate-400 dark:text-slate-500">{props.description}</div>
      </div>
      <TextArea
        fullWidth
        label={props.title}
        resize={props.resize}
        variant={props.variant}
        showCount={props.showCount}
        maxLength={props.maxLength}
        rows={props.rows}
        minRows={props.minRows}
        maxRows={props.maxRows}
        minHeight={props.minHeight}
        maxHeight={props.maxHeight}
        placeholder={props.placeholder}
        value={value()}
        onValue={setValue}
      />
    </div>
  );
};

export default TextAreaPlayground;