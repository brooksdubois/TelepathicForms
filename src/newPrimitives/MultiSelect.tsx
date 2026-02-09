import {
  For,
  Show,
  createEffect,
  createMemo,
  createSignal,
  createUniqueId,
  mergeProps,
  onCleanup,
  splitProps,
} from 'solid-js';
import type { JSX } from 'solid-js';

import { cx } from '../utils/cx';

export type MultiSelectSize = 'sm' | 'md' | 'lg';
export type MultiSelectVariant = 'outlined' | 'filled' | 'standard';

export type MultiSelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
  group?: string;
};

export type MultiSelectProps = {
  class?: string;
  label?: string;
  helperText?: string;
  error?: boolean;
  errorText?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  fullWidth?: boolean;
  inline?: boolean;
  size?: MultiSelectSize;
  variant?: MultiSelectVariant;

  value?: string[];
  options: MultiSelectOption[];

  placeholder?: string;
  searchable?: boolean;
  clearable?: boolean;
  maxSelected?: number;
  ringEnabled?: boolean;
  animateRingOnFocus?: boolean;
  onRingApi?: (api: {
    pulse: () => void;
    focus: () => void;
    pulseAndFocus: () => void;
  }) => void;

  onValue?: (value: string[], ctx?: { added?: string; removed?: string; event?: Event }) => void;

  renderLabel?: (props: {
    label?: string;
    required?: boolean;
    disabled?: boolean;
    htmlFor?: string;
  }) => JSX.Element;

  renderHelper?: (props: {
    helperText?: string;
    error?: boolean;
    id?: string;
  }) => JSX.Element;

  rootClass?: string;
  labelClass?: string;
  inputClass?: string;
  helperClass?: string;
};

const sizeStyles: Record<
  MultiSelectSize,
  {
    container: string;
    standard: string;
    inputText: string;
    chipText: string;
    chipHeight: string;
    helperOffset: string;
    option: string;
    group: string;
  }
> = {
  sm: {
    container: 'px-3 py-2',
    standard: 'px-0 pb-1 pt-2',
    inputText: 'text-sm',
    chipText: 'text-xs',
    chipHeight: 'h-6',
    helperOffset: 'pl-1',
    option: 'px-3 py-1.5 text-sm',
    group: 'px-3 pt-2 pb-1 text-[10px]',
  },
  md: {
    container: 'px-3.5 py-2.5',
    standard: 'px-0 pb-1.5 pt-2.5',
    inputText: 'text-sm',
    chipText: 'text-xs',
    chipHeight: 'h-6.5',
    helperOffset: 'pl-1',
    option: 'px-3.5 py-2 text-sm',
    group: 'px-3.5 pt-2 pb-1 text-[10px]',
  },
  lg: {
    container: 'px-4 py-3',
    standard: 'px-0 pb-2 pt-3',
    inputText: 'text-base',
    chipText: 'text-sm',
    chipHeight: 'h-7',
    helperOffset: 'pl-1',
    option: 'px-4 py-2.5 text-base',
    group: 'px-4 pt-2.5 pb-1 text-[11px]',
  },
};

const variantStyles: Record<MultiSelectVariant, string> = {
  outlined:
    'rounded-xl border bg-white/90 shadow-sm backdrop-blur-sm dark:bg-slate-900/60',
  filled:
    'rounded-xl border border-transparent bg-slate-100/90 shadow-inner shadow-slate-200/60 dark:bg-slate-800/60 dark:shadow-slate-900/60',
  standard: 'border-b bg-transparent',
};

const MultiSelect = (props: MultiSelectProps) => {
  const merged = mergeProps(
    {
      value: [] as string[],
      searchable: true,
      clearable: false,
    },
    props,
  );

  const [local] = splitProps(merged, [
    'class',
    'label',
    'helperText',
    'error',
    'errorText',
    'required',
    'disabled',
    'readOnly',
    'fullWidth',
    'inline',
    'size',
    'variant',
    'value',
    'options',
    'placeholder',
    'searchable',
    'clearable',
    'maxSelected',
    'ringEnabled',
    'animateRingOnFocus',
    'onRingApi',
    'onValue',
    'renderLabel',
    'renderHelper',
    'rootClass',
    'labelClass',
    'inputClass',
    'helperClass',
  ]);

  let rootEl: HTMLDivElement | undefined;
  let fieldEl: HTMLDivElement | undefined;
  let queryInputEl: HTMLInputElement | undefined;
  const optionEls: Array<HTMLDivElement | undefined> = [];

  const [open, setOpen] = createSignal(false);
  const [query, setQuery] = createSignal('');
  const [activeIndex, setActiveIndex] = createSignal(-1);
  const [menuWidth, setMenuWidth] = createSignal<number>();

  const required = () => Boolean(local.required);
  const disabled = () => Boolean(local.disabled);
  const readOnly = () => Boolean(local.readOnly);
  const fullWidth = () => Boolean(local.fullWidth);
  const inline = () => Boolean(local.inline);
  const searchable = () => Boolean(local.searchable);
  const clearable = () => Boolean(local.clearable);
  const ringEnabled = () => local.ringEnabled ?? true;
  const animateRingOnFocus = () => local.animateRingOnFocus ?? true;
  const [ringPulseKey, setRingPulseKey] = createSignal(0);

  const size = () => (local.size ?? 'md') as MultiSelectSize;
  const variant = () => (local.variant ?? 'outlined') as MultiSelectVariant;
  const errorActive = () => Boolean(local.error);

  const valueArray = () => local.value ?? [];

  const helperContent = () => {
    if (errorActive()) {
      return local.errorText ?? local.helperText;
    }
    return local.helperText;
  };

  const hasHelper = () => Boolean(local.renderHelper) || Boolean(helperContent());

  const autoId = createUniqueId();
  const inputId = () => `ms-${autoId}`;
  const helperId = () => `${inputId()}-helper`;
  const listboxId = () => `${inputId()}-listbox`;
  const optionId = (index: number) => `${inputId()}-opt-${index}`;

  const describedBy = () => (hasHelper() ? helperId() : undefined);
  const ariaInvalid = () => (errorActive() ? 'true' : undefined);

  const optionMap = createMemo(
    () => new Map(local.options.map((option) => [option.value, option] as const)),
  );

  const selectedSet = createMemo(() => new Set(valueArray()));

  const orderSelection = (set: Set<string>) => {
    // Preserve option order for known values so chip order remains stable as filtering changes.
    const known: string[] = [];
    for (const option of local.options) {
      if (set.has(option.value)) known.push(option.value);
    }

    const knownSet = new Set(known);
    const unknown = valueArray().filter(
      (item, index, arr) => set.has(item) && !knownSet.has(item) && arr.indexOf(item) === index,
    );

    return [...known, ...unknown];
  };

  const selectedValues = createMemo(() => orderSelection(selectedSet()));

  const filteredOptions = createMemo(() => {
    const q = query().trim().toLowerCase();
    if (!q) return local.options;

    return local.options.filter((option) => {
      const label = option.label.toLowerCase();
      const value = option.value.toLowerCase();
      return label.includes(q) || value.includes(q);
    });
  });

  const canInteract = () => !disabled() && !readOnly();

  const pulseRing = () => {
    if (!ringEnabled()) return;
    setRingPulseKey((k) => k + 1);
  };

  createEffect(() => {
    const focus = () => queryInputEl?.focus();
    const pulse = () => pulseRing();
    const pulseAndFocus = () => {
      focus();
      pulse();
    };
    local.onRingApi?.({ pulse, focus, pulseAndFocus });
  });

  const updateMenuWidth = () => {
    if (!fieldEl) return;
    setMenuWidth(fieldEl.getBoundingClientRect().width);
  };

  const firstEnabledIndex = () =>
    filteredOptions().findIndex((option) => !option.disabled);

  const nextEnabledIndex = (start: number, direction: 1 | -1) => {
    const options = filteredOptions();
    if (!options.length) return -1;

    for (let i = 0; i < options.length; i += 1) {
      const index = (start + direction + options.length) % options.length;
      if (!options[index]?.disabled) return index;
      start = index;
    }

    return -1;
  };

  const syncHighlight = () => {
    const options = filteredOptions();
    if (!options.length) {
      setActiveIndex(-1);
      return;
    }

    const selectedIndex = options.findIndex(
      (option) => selectedSet().has(option.value) && !option.disabled,
    );
    if (selectedIndex >= 0) {
      setActiveIndex(selectedIndex);
      return;
    }

    setActiveIndex(firstEnabledIndex());
  };

  const openMenu = () => {
    if (!canInteract() || open()) return;

    setOpen(true);
    updateMenuWidth();
    syncHighlight();
  };

  const closeMenu = () => {
    setOpen(false);
    setActiveIndex(-1);
    setQuery('');
  };

  const emitSet = (
    nextSet: Set<string>,
    ctx: { added?: string; removed?: string; event?: Event },
  ) => {
    const next = orderSelection(nextSet);
    local.onValue?.(next, ctx);
  };

  const toggleOption = (option: MultiSelectOption, event?: Event) => {
    if (!canInteract() || option.disabled) return;

    const currentSet = selectedSet();
    const nextSet = new Set(currentSet);

    if (nextSet.has(option.value)) {
      nextSet.delete(option.value);
      emitSet(nextSet, { removed: option.value, event });
      return;
    }

    const max = local.maxSelected;
    if (max !== undefined && max >= 0 && nextSet.size >= max) {
      return;
    }

    nextSet.add(option.value);
    emitSet(nextSet, { added: option.value, event });
  };

  const removeChip = (valueToRemove: string, event?: Event) => {
    if (!canInteract()) return;

    const currentSet = selectedSet();
    if (!currentSet.has(valueToRemove)) return;

    const nextSet = new Set(currentSet);
    nextSet.delete(valueToRemove);
    emitSet(nextSet, { removed: valueToRemove, event });
  };

  const clearAll = (event: MouseEvent) => {
    if (!canInteract()) return;
    if (!selectedValues().length) return;

    event.stopPropagation();
    local.onValue?.([], { event });
    queryInputEl?.focus();
  };

  const handleFieldClick: JSX.EventHandlerUnion<HTMLDivElement, MouseEvent> = (
    event,
  ) => {
    const target = event.target as HTMLElement | null;
    if (
      target?.closest('[data-ms-chip]') ||
      target?.closest('[data-ms-chip-remove]') ||
      target?.closest('[data-ms-clear]')
    ) {
      return;
    }

    queryInputEl?.focus();
    if (!canInteract()) return;

    if (!open()) {
      openMenu();
    }
  };

  const handleInput: JSX.EventHandlerUnion<HTMLInputElement, InputEvent> = (event) => {
    if (!searchable()) return;

    setQuery(event.currentTarget.value);
    if (!open() && canInteract()) {
      openMenu();
    }
  };

  const handleKeyDown: JSX.EventHandlerUnion<HTMLInputElement, KeyboardEvent> = (
    event,
  ) => {
    const key = event.key;

    if (key === 'Tab') {
      closeMenu();
      return;
    }

    if (key === 'Escape') {
      if (open()) {
        event.preventDefault();
        closeMenu();
      }
      return;
    }

    if (disabled()) return;

    if (key === 'Backspace' && query() === '' && selectedValues().length > 0) {
      if (!readOnly()) {
        event.preventDefault();
        const last = selectedValues()[selectedValues().length - 1];
        removeChip(last, event);
      }
      return;
    }

    if (readOnly()) return;

    if (key === 'ArrowDown') {
      event.preventDefault();
      if (!open()) {
        openMenu();
        return;
      }

      const current = activeIndex();
      const start = current >= 0 ? current : filteredOptions().length - 1;
      const next = nextEnabledIndex(start, 1);
      if (next >= 0) setActiveIndex(next);
      return;
    }

    if (key === 'ArrowUp') {
      event.preventDefault();
      if (!open()) {
        openMenu();
        return;
      }

      const current = activeIndex();
      const start = current >= 0 ? current : 0;
      const next = nextEnabledIndex(start, -1);
      if (next >= 0) setActiveIndex(next);
      return;
    }

    if (key === 'Enter') {
      event.preventDefault();
      if (!open()) {
        openMenu();
        return;
      }

      const index = activeIndex();
      if (index >= 0) {
        const option = filteredOptions()[index];
        if (option) toggleOption(option, event);
      }
      return;
    }

    if (key === ' ' && !open()) {
      event.preventDefault();
      openMenu();
    }
  };

  createEffect(() => {
    if (!open()) return;

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target || !rootEl?.contains(target)) {
        closeMenu();
      }
    };

    const onResize = () => updateMenuWidth();

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    window.addEventListener('resize', onResize);

    onCleanup(() => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      window.removeEventListener('resize', onResize);
    });
  });

  createEffect(() => {
    if (!open()) return;
    const index = activeIndex();
    if (index < 0) return;

    queueMicrotask(() => {
      optionEls[index]?.scrollIntoView({ block: 'nearest' });
    });
  });

  createEffect(() => {
    const options = filteredOptions();
    const index = activeIndex();

    if (!options.length) {
      if (index !== -1) setActiveIndex(-1);
      return;
    }

    if (index >= options.length || index < 0 || options[index]?.disabled) {
      setActiveIndex(firstEnabledIndex());
    }
  });

  const containerClass = () => {
    const sizeClass =
      variant() === 'standard'
        ? sizeStyles[size()].standard
        : sizeStyles[size()].container;

    const toneClasses = errorActive()
      ? 'border-rose-500/80 focus-within:border-rose-500 dark:border-rose-500/70'
      : 'border-slate-300/80 focus-within:border-emerald-400 dark:border-slate-700 dark:focus-within:border-emerald-400';

    return cx(
      'tf-input-container relative w-full transition duration-150',
      variantStyles[variant()],
      sizeClass,
      toneClasses,
      variant() === 'standard' ? 'rounded-none' : 'rounded-xl',
      disabled() ? 'cursor-not-allowed opacity-60' : 'cursor-text',
      readOnly() && !disabled() ? 'bg-slate-50/80 dark:bg-slate-900/40' : '',
      local.inputClass,
    );
  };

  const helperToneClass = () => {
    if (errorActive()) return 'text-rose-600 dark:text-rose-300';
    return 'text-slate-500 dark:text-slate-400';
  };

  const helperClass = () =>
    cx('text-xs', helperToneClass(), sizeStyles[size()].helperOffset, local.helperClass);

  const renderLabel = () => {
    if (local.renderLabel) {
      return local.renderLabel({
        label: local.label,
        required: required(),
        disabled: disabled(),
        htmlFor: inputId(),
      });
    }

    if (!local.label) return null;

    return (
      <label
        for={inputId()}
        class={cx(
          'text-sm font-medium text-slate-700 dark:text-slate-200',
          disabled() ? 'opacity-60' : '',
          local.labelClass,
        )}
      >
        <span>{local.label}</span>
        <Show when={required()}>
          <span class="text-rose-500"> *</span>
        </Show>
      </label>
    );
  };

  return (
    <div
      ref={rootEl}
      class={cx(
        inline() ? 'flex items-center gap-3' : 'flex flex-col gap-1.5',
        fullWidth() ? 'w-full' : 'inline-flex',
        local.class,
        local.rootClass,
      )}
    >
      <Show when={!inline()}>{renderLabel()}</Show>

      <div class={cx('relative min-w-0', inline() ? 'flex min-w-0 flex-1 items-center gap-3' : '')}>
        <Show when={inline()}>{renderLabel()}</Show>

        <div ref={fieldEl} class={containerClass()} onClick={handleFieldClick}>
          <Show when={ringEnabled()}>
            <span
              aria-hidden="true"
              class={cx(
                'tf-focus-ant-ring',
                errorActive()
                  ? 'text-rose-500 dark:text-rose-400'
                  : 'text-emerald-500 dark:text-emerald-400',
              )}
            >
              <svg
                class="tf-focus-ant-ring-svg"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                <Show
                  when={ringPulseKey()}
                  keyed
                  fallback={
                    <rect
                      class="tf-focus-ant-ring-stroke"
                      x="1.5"
                      y="1.5"
                      width="97"
                      height="97"
                      rx={variant() === 'standard' ? '0.5' : '17'}
                      ry={variant() === 'standard' ? '0.5' : '17'}
                      pathLength="100"
                    />
                  }
                >
                  {(k) => (
                    <rect
                      class="tf-focus-ant-ring-stroke"
                      data-pulse={k}
                      x="1.5"
                      y="1.5"
                      width="97"
                      height="97"
                      rx={variant() === 'standard' ? '0.5' : '17'}
                      ry={variant() === 'standard' ? '0.5' : '17'}
                      pathLength="100"
                    />
                  )}
                </Show>
              </svg>
            </span>
          </Show>

          <div class="flex min-w-0 items-center gap-2">
            <div class="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
              <For each={selectedValues()}>
                {(item) => {
                  const option = optionMap().get(item);
                  const chipLabel = option?.label ?? item;

                  return (
                    <span
                      data-ms-chip
                      class={cx(
                        'group inline-flex max-w-full items-center gap-1 rounded-full border border-slate-200/80 bg-slate-100/90 px-2 py-0.5 text-slate-700 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-200',
                        sizeStyles[size()].chipText,
                        sizeStyles[size()].chipHeight,
                      )}
                    >
                      <span class="truncate">{chipLabel}</span>
                      <Show when={!disabled() && !readOnly()}>
                        <button
                          type="button"
                          data-ms-chip-remove
                          class="inline-flex h-4 w-4 items-center justify-center rounded-full text-slate-500 opacity-70 transition hover:bg-slate-200 hover:text-slate-700 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                          onMouseDown={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                          }}
                          onClick={(event) => {
                            event.stopPropagation();
                            removeChip(item, event);
                            if (open()) {
                              queryInputEl?.focus();
                            }
                          }}
                          aria-label={`Remove ${chipLabel}`}
                        >
                          ×
                        </button>
                      </Show>
                    </span>
                  );
                }}
              </For>

              <input
                id={inputId()}
                ref={queryInputEl}
                type="text"
                role="combobox"
                aria-haspopup="listbox"
                aria-expanded={open() ? 'true' : 'false'}
                aria-controls={listboxId()}
                aria-activedescendant={
                  open() && activeIndex() >= 0 ? optionId(activeIndex()) : undefined
                }
                aria-invalid={ariaInvalid()}
                aria-describedby={describedBy()}
                aria-readonly={readOnly() ? 'true' : undefined}
                disabled={disabled()}
                readOnly={!searchable() || readOnly()}
                value={query()}
                placeholder={
                  selectedValues().length === 0 && query() === ''
                    ? (local.placeholder ?? 'Select options')
                    : ''
                }
                class={cx(
                  'min-w-[4rem] flex-1 bg-transparent outline-none placeholder:text-slate-400/90 dark:placeholder:text-slate-500',
                  sizeStyles[size()].inputText,
                  disabled()
                    ? 'cursor-not-allowed text-slate-500 dark:text-slate-400'
                    : 'text-slate-900 dark:text-slate-100',
                )}
                onInput={handleInput}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                  if (animateRingOnFocus()) {
                    pulseRing();
                  }
                  if (!readOnly() && !disabled() && !open()) {
                    openMenu();
                  }
                }}
              />
            </div>

            <Show when={clearable() && selectedValues().length > 0 && !readOnly() && !disabled()}>
              <button
                type="button"
                data-ms-clear
                class="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-200 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                onClick={clearAll}
                aria-label="Clear all selected options"
              >
                ×
              </button>
            </Show>

            <span
              class={cx(
                'pointer-events-none shrink-0 text-slate-500 transition-transform dark:text-slate-400',
                open() ? 'rotate-180' : '',
              )}
              aria-hidden="true"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                class="h-4 w-4"
              >
                <path
                  fill-rule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.51a.75.75 0 01-1.08 0l-4.25-4.51a.75.75 0 01.02-1.06z"
                  clip-rule="evenodd"
                />
              </svg>
            </span>
          </div>
        </div>

        <Show when={open()}>
          <div
            id={listboxId()}
            role="listbox"
            aria-multiselectable="true"
            class="absolute z-20 mt-2 max-h-64 overflow-auto rounded-xl border border-slate-200/80 bg-white/95 py-1 shadow-lg shadow-slate-200/60 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/95 dark:shadow-slate-900/60"
            style={{ width: `${menuWidth() ?? 0}px` }}
          >
            <Show
              when={filteredOptions().length > 0}
              fallback={
                <div class="px-3.5 py-2 text-sm text-slate-500 dark:text-slate-400">
                  No options found
                </div>
              }
            >
              <For each={filteredOptions()}>
                {(option, index) => {
                  const optionDisabled = () => Boolean(option.disabled);
                  const selected = () => selectedSet().has(option.value);
                  const highlighted = () => activeIndex() === index();

                  const prev = index() > 0 ? filteredOptions()[index() - 1] : undefined;
                  const showGroup = () => option.group && option.group !== prev?.group;

                  return (
                    <>
                      <Show when={showGroup()}>
                        <div
                          class={cx(
                            'font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500',
                            sizeStyles[size()].group,
                          )}
                        >
                          {option.group}
                        </div>
                      </Show>

                      <div
                        id={optionId(index())}
                        ref={(el) => {
                          optionEls[index()] = el;
                        }}
                        role="option"
                        aria-selected={selected() ? 'true' : 'false'}
                        aria-disabled={optionDisabled() ? 'true' : undefined}
                        class={cx(
                          'flex items-center justify-between gap-3 transition',
                          sizeStyles[size()].option,
                          optionDisabled()
                            ? 'cursor-not-allowed text-slate-400 dark:text-slate-500'
                            : 'cursor-pointer text-slate-800 dark:text-slate-100',
                          highlighted() && !optionDisabled()
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                            : '',
                        )}
                        onMouseDown={(event) => event.preventDefault()}
                        onMouseEnter={() => {
                          if (!optionDisabled()) setActiveIndex(index());
                        }}
                        onClick={(event) => toggleOption(option, event)}
                      >
                        <span class="min-w-0 truncate">{option.label}</span>

                        <span
                          class={cx(
                            'inline-flex h-5 w-5 items-center justify-center rounded border transition',
                            selected()
                              ? 'border-emerald-500 bg-emerald-500 text-white dark:border-emerald-400 dark:bg-emerald-400 dark:text-slate-950'
                              : 'border-slate-300 text-transparent dark:border-slate-600',
                          )}
                          aria-hidden="true"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            class="h-3.5 w-3.5"
                          >
                            <path
                              fill-rule="evenodd"
                              d="M16.704 5.29a1 1 0 010 1.414l-7.41 7.411a1 1 0 01-1.415 0L3.296 9.53A1 1 0 114.71 8.117l3.876 3.876 6.704-6.703a1 1 0 011.414 0z"
                              clip-rule="evenodd"
                            />
                          </svg>
                        </span>
                      </div>
                    </>
                  );
                }}
              </For>
            </Show>
          </div>
        </Show>
      </div>

      <Show when={hasHelper()}>
        <div id={helperId()} class={helperClass()}>
          {local.renderHelper ? (
            local.renderHelper({
              helperText: helperContent(),
              error: errorActive(),
              id: helperId(),
            })
          ) : (
            <span>{helperContent()}</span>
          )}
        </div>
      </Show>
    </div>
  );
};

export default MultiSelect;
