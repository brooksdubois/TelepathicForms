import { For, Show, createMemo, createSignal } from 'solid-js';
import type { Component } from 'solid-js';

import Checkbox, {
  type CheckboxProps,
  type CheckboxSize,
  type CheckboxVariant,
} from '../packages/checkbox';

const variants: CheckboxVariant[] = ['outlined', 'filled', 'standard'];
const sizes: CheckboxSize[] = ['sm', 'md', 'lg'];

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
  checked: false,
  indeterminate: false,
  disabled: false,
  readOnly: false,
  required: false,
  error: false,
  fullWidth: false,
  ringAnimation: 'laser' as RingAnimationSelection,
  inline: false,
  variant: 'outlined' as CheckboxVariant,
  size: 'md' as CheckboxSize,
  label: 'I agree to the Terms of Service',
  helperText: 'You can update this preference later in settings.',
  errorText: 'Please confirm before continuing.',
  darkMode: false,
};

const ExampleCard: Component<{
  title: string;
  props: Omit<CheckboxProps, 'checked' | 'onChecked'>;
  initialChecked?: boolean;
  initialIndeterminate?: boolean;
}> = (props) => {
  const [checked, setChecked] = createSignal(Boolean(props.initialChecked));
  const [indeterminate, setIndeterminate] = createSignal(
    Boolean(props.initialIndeterminate),
  );

  return (
    <div class="flex flex-col gap-3 rounded-2xl border border-slate-200/70 bg-white/80 p-4 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/60">
      <div class="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {props.title}
      </div>
      <Checkbox
        {...props.props}
        fullWidth
        checked={checked()}
        indeterminate={indeterminate()}
        onChecked={(next) => {
          setChecked(next);
          if (indeterminate()) setIndeterminate(false);
        }}
      />
    </div>
  );
};

const CheckboxPlayground: Component = () => {
  const [darkMode, setDarkMode] = createSignal(defaults.darkMode);
  const [configChecked, setConfigChecked] = createSignal(defaults.checked);
  const [configIndeterminate, setConfigIndeterminate] = createSignal(
    defaults.indeterminate,
  );
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
    cx('transition-all duration-200', configFullWidth() ? 'w-full' : 'max-w-md'),
  );

  const inspectorSnapshot = createMemo(() =>
    JSON.stringify(
      {
        props: {
          checked: configChecked(),
          indeterminate: configIndeterminate(),
          label: configLabel(),
          helperText: configHelperText(),
          errorText: configErrorText(),
          required: configRequired(),
          disabled: configDisabled(),
          readOnly: configReadOnly(),
          error: configError(),
          fullWidth: configFullWidth(),
          ringEnabled: ringAnimationEnabled(configRingAnimation()),
          ringVariant: ringAnimationVariant(configRingAnimation()),
          inline: configInline(),
          size: configSize(),
          variant: configVariant(),
        },
      },
      null,
      2,
    ),
  );

  const resetControls = () => {
    setDarkMode(defaults.darkMode);
    setConfigChecked(defaults.checked);
    setConfigIndeterminate(defaults.indeterminate);
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
    props: Omit<CheckboxProps, 'checked' | 'onChecked'>;
    initialChecked?: boolean;
    initialIndeterminate?: boolean;
  }> = [
    {
      title: 'Default',
      props: {
        label: 'Email me updates',
        helperText: 'Get product announcements once a month.',
      },
    },
    {
      title: 'Checked',
      props: {
        label: 'Enable notifications',
        helperText: 'Receive release notes and critical alerts.',
      },
      initialChecked: true,
    },
    {
      title: 'Indeterminate',
      props: {
        label: 'Select all team permissions',
        helperText: 'Some but not all child options are selected.',
      },
      initialIndeterminate: true,
    },
    {
      title: 'Filled variant',
      props: {
        label: 'Enable experimental features',
        variant: 'filled',
      },
    },
    {
      title: 'Standard variant',
      props: {
        label: 'Auto-archive completed tasks',
        variant: 'standard',
      },
    },
    {
      title: 'Error state',
      props: {
        label: 'Accept policy updates',
        error: true,
        errorText: 'Required to continue.',
      },
    },
    {
      title: 'Read only',
      props: {
        label: 'Managed by organization policy',
        helperText: 'This setting is read-only for your role.',
        readOnly: true,
      },
      initialChecked: true,
    },
    {
      title: 'Slot overrides',
      props: {
        label: 'Custom slot',
        helperText: 'Slot content can be any JSX.',
        required: true,
        renderLabel: ({ label, required, htmlFor }) => (
          <label
            for={htmlFor}
            class="flex min-w-0 items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200"
          >
            <span class="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-300">
              custom
            </span>
            <span class="min-w-0 break-words">{label}</span>
            <Show when={required}>
              <span class="text-rose-500">*</span>
            </Show>
          </label>
        ),
        renderHelper: ({ helperText }) => (
          <div class="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span class="inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 text-[10px] font-semibold text-slate-500 dark:border-slate-700 dark:text-slate-400">
              i
            </span>
            <span>{helperText}</span>
          </div>
        ),
      },
    },
    {
      title: 'Class overrides',
      props: {
        label: 'Accent styles',
        helperText: 'Custom colors via class hooks.',
        rootClass: 'rounded-2xl bg-amber-50/80 p-3 dark:bg-amber-500/10',
        labelClass: 'text-amber-700 dark:text-amber-200',
        inputClass: 'border-amber-500/80',
        helperClass: 'text-amber-600 dark:text-amber-300',
      },
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
                  Solid Checkbox Lab
                </div>
                <h1 class="font-display text-3xl font-semibold sm:text-4xl">
                  MUI-like checkboxes, rebuilt for Solid
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
            <PlaygroundNav currentPath="/checkbox" />
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
                    <Checkbox
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
                      checked={configChecked()}
                      indeterminate={configIndeterminate()}
                      onChecked={(next) => {
                        setConfigChecked(next);
                        if (configIndeterminate()) setConfigIndeterminate(false);
                      }}
                    />
                  </div>
                  <div class="text-xs text-slate-500 dark:text-slate-400">
                    Use the controls to explore checkbox states, variants, and layout.
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
                              event.currentTarget.value as CheckboxVariant,
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
                            setConfigSize(event.currentTarget.value as CheckboxSize)
                          }
                        >
                          <For each={sizes}>
                            {(item) => <option value={item}>{item}</option>}
                          </For>
                        </select>
                      </label>
                    </div>

                    <div class="grid gap-2">
                      <div class={controlLabelClass}>State</div>
                      <label class="flex items-center justify-between text-sm text-slate-700 dark:text-slate-200">
                        <span>Checked</span>
                        <input
                          type="checkbox"
                          class={controlCheckboxClass}
                          checked={configChecked()}
                          onInput={(event) =>
                            setConfigChecked(event.currentTarget.checked)
                          }
                        />
                      </label>
                      <label class="flex items-center justify-between text-sm text-slate-700 dark:text-slate-200">
                        <span>Indeterminate</span>
                        <input
                          type="checkbox"
                          class={controlCheckboxClass}
                          checked={configIndeterminate()}
                          onInput={(event) =>
                            setConfigIndeterminate(event.currentTarget.checked)
                          }
                        />
                      </label>
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
                          onInput={(event) =>
                            setConfigError(event.currentTarget.checked)
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
                      <label class="flex items-center justify-between text-sm text-slate-700 dark:text-slate-200">
                        <span>Inline</span>
                        <input
                          type="checkbox"
                          class={controlCheckboxClass}
                          checked={configInline()}
                          onInput={(event) =>
                            setConfigInline(event.currentTarget.checked)
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
                      initialChecked={item.initialChecked}
                      initialIndeterminate={item.initialIndeterminate}
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

export default CheckboxPlayground;
