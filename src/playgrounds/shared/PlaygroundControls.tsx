import { For } from 'solid-js';
import type { Component, Accessor } from 'solid-js';

import { cx } from '../../utils/cx';

const controlLabelClass =
  'text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400';

const controlInputClass =
  'min-w-0 max-w-full w-full rounded-xl border border-slate-200/80 bg-white/80 px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/40 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100';

const controlCheckboxClass =
  'h-4 w-4 rounded border-slate-300 accent-emerald-500 focus:ring-emerald-400';

const handleCheckboxInput = (value: boolean, setter: (next: boolean) => void) => {
  setter(value);
};

const handleTextInput = (
  value: string,
  setter: (next: string | undefined) => void,
  emptyAsUndefined: boolean,
) => {
  setter(emptyAsUndefined && value === '' ? undefined : value);
};

const handleNumberInput = (
  value: string,
  setter: (next: number | undefined) => void,
  emptyAsUndefined: boolean,
) => {
  const trimmed = value.trim();
  if (emptyAsUndefined && trimmed === '') {
    setter(undefined);
    return;
  }

  const parsed = Number(trimmed);
  if (Number.isNaN(parsed)) return;
  setter(parsed);
};

const handleSelectInput = (value: string, setter: (next: string) => void) => {
  setter(value);
};

export type SelectOption = Readonly<{
  value: string;
  label: string;
}>;

export type TextControl = Readonly<{
  kind: 'text';
  label: string;
  value: Accessor<string | undefined>;
  set: (next: string | undefined) => void;
  placeholder?: string;
  emptyAsUndefined?: boolean;
}>;

export type NumberControl = Readonly<{
  kind: 'number';
  label: string;
  value: Accessor<number | undefined>;
  set: (next: number | undefined) => void;
  placeholder?: string;
  emptyAsUndefined?: boolean;
}>;

export type CheckboxControl = Readonly<{
  kind: 'checkbox';
  label: string;
  value: Accessor<boolean>;
  set: (next: boolean) => void;
}>;

export type SelectControl = Readonly<{
  kind: 'select';
  label: string;
  value: Accessor<string>;
  set: (next: string) => void;
  options: ReadonlyArray<SelectOption>;
}>;

export type PlaygroundControl = TextControl | NumberControl | CheckboxControl | SelectControl;

export type PlaygroundControlSection = Readonly<{
  heading: string;
  controls: ReadonlyArray<PlaygroundControl>;
}>;

type PlaygroundControlPanelProps = Readonly<{
  sections: ReadonlyArray<PlaygroundControlSection>;
}>;

export const PlaygroundControlPanel: Component<PlaygroundControlPanelProps> = (
  props,
) => {
  return (
    <div class="flex min-w-0 flex-col gap-4">
      <For each={props.sections}>
        {(section) => (
          <div class="grid min-w-0 gap-3">
            <For each={section.controls}>
              {(control) => {
                if (control.kind === 'text') {
                  return (
                    <label class="flex min-w-0 flex-col gap-2">
                      <span class={controlLabelClass}>{control.label}</span>
                      <input
                        class={controlInputClass}
                        type="text"
                        value={control.value() ?? ''}
                        placeholder={control.placeholder}
                        onInput={(event) =>
                          handleTextInput(
                            event.currentTarget.value,
                            control.set,
                            control.emptyAsUndefined ?? true,
                          )
                        }
                      />
                    </label>
                  );
                }

                if (control.kind === 'number') {
                  return (
                    <label class="flex min-w-0 flex-col gap-2">
                      <span class={controlLabelClass}>{control.label}</span>
                      <input
                        class={controlInputClass}
                        type="number"
                        value={control.value() ?? ''}
                        placeholder={control.placeholder}
                        onInput={(event) =>
                          handleNumberInput(
                            event.currentTarget.value,
                            control.set,
                            control.emptyAsUndefined ?? true,
                          )
                        }
                      />
                    </label>
                  );
                }

                if (control.kind === 'checkbox') {
                  return (
                    <label class="flex min-w-0 items-center justify-between gap-3 text-sm text-slate-700 dark:text-slate-200">
                      <span class="min-w-0 break-words">{control.label}</span>
                      <input
                        type="checkbox"
                        class={controlCheckboxClass}
                        checked={control.value()}
                        onInput={(event) =>
                          handleCheckboxInput(event.currentTarget.checked, control.set)
                        }
                      />
                    </label>
                  );
                }

                return (
                  <label class="flex min-w-0 flex-col gap-2">
                    <span class={controlLabelClass}>{control.label}</span>
                    <select
                      class={controlInputClass}
                      value={control.value()}
                      onInput={(event) =>
                        handleSelectInput(event.currentTarget.value, control.set)
                      }
                    >
                      <For each={control.options}>
                        {(item) => <option value={item.value}>{item.label}</option>}
                      </For>
                    </select>
                  </label>
                );
              }}
            </For>
          </div>
        )}
      </For>
    </div>
  );
};

export const PlaygroundRingButtonClass = cx(
  'mt-2 rounded-xl border border-slate-200/80 bg-white/80 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-700 shadow-sm transition',
  'hover:-translate-y-0.5 hover:border-emerald-300 hover:text-emerald-600',
  'disabled:cursor-not-allowed disabled:opacity-50',
  'dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200',
);
