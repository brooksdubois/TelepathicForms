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
import { cx } from '../utils/cx';

const variants: RadioGroupVariant[] = ['outlined', 'filled', 'standard'];
const sizes: RadioGroupSize[] = ['sm', 'md', 'lg'];

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
  const [darkMode, setDarkMode] = createSignal(defaults.darkMode);
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

  const resetControls = () => {
    setDarkMode(defaults.darkMode);
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
            <PlaygroundNav currentPath="/radio-group" />
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
                              event.currentTarget.value as RadioGroupVariant,
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
                            setConfigSize(event.currentTarget.value as RadioGroupSize)
                          }
                        >
                          <For each={sizes}>
                            {(item) => <option value={item}>{item}</option>}
                          </For>
                        </select>
                      </label>

                      <label class="flex flex-col gap-2">
                        <span class={controlLabelClass}>Value</span>
                        <select
                          class={controlInputClass}
                          value={configValue()}
                          onInput={(event) => setConfigValue(event.currentTarget.value)}
                        >
                          <For each={previewOptions}>
                            {(option) => (
                              <option value={option.value}>{option.label}</option>
                            )}
                          </For>
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
                        <span>Inline (horizontal)</span>
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
                          onInput={(event) =>
                            setConfigFullWidth(event.currentTarget.checked)
                          }
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

export default RadioGroupPlayground;
