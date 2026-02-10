import {
  For,
  Show,
  createEffect,
  createSignal,
  createUniqueId,
  mergeProps,
  onCleanup,
  splitProps,
} from 'solid-js';
import type { JSX } from 'solid-js';
import { Portal } from 'solid-js/web';

import { cx } from '../utils/cx';
import { useAntRing } from '../utils/useAntRing';

export type SelectSize = 'sm' | 'md' | 'lg';
export type SelectVariant = 'outlined' | 'filled' | 'standard';
export type SelectMeta = {
  touched?: boolean;
  dirty?: boolean;
  errors?: string[];
  warnings?: string[];
};

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export type SelectChangeContext = {
  prevValue: string;
  nextValue: string;
  option?: SelectOption;
  optionIndex: number;
  trigger: 'click' | 'keyboard';
};

type NativeControlProps = Omit<
  JSX.ButtonHTMLAttributes<HTMLButtonElement>,
  'onInput' | 'onChange' | 'children' | 'type'
>;

export type SelectProps = NativeControlProps & {
  class?: string;
  label?: string;
  helperText?: string;
  error?: boolean;
  errorText?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  fullWidth?: boolean;
  size?: SelectSize;
  variant?: SelectVariant;
  value?: string;
  options?: SelectOption[];
  placeholder?: string;
  startAdornment?: JSX.Element;
  endAdornment?: JSX.Element;
  ringEnabled?: boolean;
  animateRingOnFocus?: boolean;
  onRingApi?: (api: {
    pulse: () => void;
    focus: () => void;
    pulseAndFocus: () => void;
  }) => void;
  onValue?: (value: string, ctx?: SelectChangeContext) => void;
  meta?: SelectMeta;

  renderLabel?: (props: {
    label?: string;
    required?: boolean;
    disabled?: boolean;
    htmlFor?: string;
  }) => JSX.Element;

  renderHelper?: (props: {
    helperText?: string;
    error?: boolean;
    meta?: SelectMeta;
    id?: string;
  }) => JSX.Element;

  rootClass?: string;
  labelClass?: string;
  inputClass?: string;
  helperClass?: string;
  menuClass?: string;
  optionClass?: string;
};

const sizeStyles: Record<
  SelectSize,
  { container: string; input: string; adornment: string; standard: string; option: string }
> = {
  sm: {
    container: 'px-3 py-2',
    input: 'text-sm',
    adornment: 'text-xs',
    standard: 'px-0 pb-1 pt-2',
    option: 'px-3 py-1.5',
  },
  md: {
    container: 'px-3.5 py-2.5',
    input: 'text-sm',
    adornment: 'text-sm',
    standard: 'px-0 pb-1.5 pt-2.5',
    option: 'px-3.5 py-2',
  },
  lg: {
    container: 'px-4 py-3',
    input: 'text-base',
    adornment: 'text-sm',
    standard: 'px-0 pb-2 pt-3',
    option: 'px-4 py-2.5',
  },
};

const variantStyles: Record<SelectVariant, string> = {
  outlined:
    'rounded-xl border bg-white/90 shadow-sm backdrop-blur-sm dark:bg-slate-900/60',
  filled:
    'rounded-xl border border-transparent bg-slate-100/90 shadow-inner shadow-slate-200/60 dark:bg-slate-800/60 dark:shadow-slate-900/60',
  standard: 'border-b bg-transparent',
};

const baseDisplayClass =
  'min-w-0 flex-1 truncate bg-transparent text-left text-slate-900 outline-none dark:text-slate-100';

const callHandler = <T, E extends Event>(
  handler: JSX.EventHandlerUnion<T, E> | undefined,
  event: E,
) => {
  if (!handler) return;
  const handlers = Array.isArray(handler) ? handler : [handler];
  handlers.forEach((item) => item && item(event));
};

const Select = (props: SelectProps) => {
  const merged = mergeProps(
    {
      options: [] as SelectOption[],
    },
    props,
  );

  const [local, controlProps] = splitProps(merged, [
    'class',
    'label',
    'helperText',
    'error',
    'errorText',
    'required',
    'disabled',
    'readOnly',
    'fullWidth',
    'size',
    'variant',
    'value',
    'options',
    'placeholder',
    'startAdornment',
    'endAdornment',
    'onValue',
    'meta',
    'renderLabel',
    'renderHelper',
    'rootClass',
    'labelClass',
    'inputClass',
    'helperClass',
    'menuClass',
    'optionClass',
    'id',
    'name',
    'onClick',
    'onKeyDown',
    'onBlur',
    'onFocus',
    'ringEnabled',
    'animateRingOnFocus',
    'onRingApi',
  ]);

  let rootEl: HTMLDivElement | undefined;
  let controlEl: HTMLButtonElement | undefined;
  const optionEls: Array<HTMLDivElement | undefined> = [];

  let menuEl: HTMLDivElement | undefined;

  const [menuPos, setMenuPos] = createSignal<{ top: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: 0,
  });

  const updateMenuPos = () => {
    const anchor = controlEl;
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    // 8px gap (matches `mt-2`)
    setMenuPos({ top: rect.bottom + 8, left: rect.left, width: rect.width });
  };

  const [open, setOpen] = createSignal(false);
  const [highlightedIndex, setHighlightedIndex] = createSignal(-1);

  const required = () => Boolean(local.required);
  const disabled = () => Boolean(local.disabled);
  const readOnly = () => Boolean(local.readOnly);
  const fullWidth = () => Boolean(local.fullWidth);
  const canInteract = () => !disabled() && !readOnly();
  const ringEnabled = () => local.ringEnabled ?? true;
  const animateRingOnFocus = () => local.animateRingOnFocus ?? true;
  const {
    ringBox,
    ringPathD,
    ringPulseKey,
    ringActive,
    pulseRing,
    setRingHostEl,
    setRingMeasureEl,
    setRingAntSegEl,
  } = useAntRing({
    enabled: ringEnabled,
    radius: () => (variant() === 'standard' ? 2 : 16),
  });

  createEffect(() => {
    const focus = () => controlEl?.focus();
    const pulse = () => pulseRing();
    const pulseAndFocus = () => {
      focus();
      pulse();
    };
    local.onRingApi?.({ pulse, focus, pulseAndFocus });
  });

  const size = () => (local.size ?? 'md') as SelectSize;
  const variant = () => (local.variant ?? 'outlined') as SelectVariant;

  const meta = () => local.meta;
  const metaErrors = () => meta()?.errors ?? [];
  const metaWarnings = () => meta()?.warnings ?? [];
  const touched = () => meta()?.touched ?? false;
  const dirty = () => meta()?.dirty ?? false;

  const showMetaError = () => metaErrors().length > 0 && (touched() || dirty());
  const errorActive = () => Boolean(local.error) || showMetaError();

  const helperContent = () => {
    if (showMetaError()) {
      return metaErrors()[0] ?? local.errorText ?? local.helperText;
    }
    if (local.error) {
      return local.errorText ?? local.helperText ?? metaErrors()[0];
    }
    if (metaWarnings().length > 0) {
      return metaWarnings()[0];
    }
    return local.helperText;
  };

  const hasHelper = () => Boolean(local.renderHelper) || Boolean(helperContent());

  const autoId = createUniqueId();
  const controlId = () => local.id ?? `select-${autoId}`;
  const helperId = () => `${controlId()}-helper`;
  const menuId = () => `${controlId()}-menu`;
  const optionId = (index: number) => `${controlId()}-option-${index}`;

  const describedBy = () => {
    const ids: string[] = [];
    const fromProps = (controlProps as Record<string, string | undefined>)[
      'aria-describedby'
    ];

    if (fromProps) ids.push(fromProps);
    if (hasHelper()) ids.push(helperId());

    return ids.length > 0 ? ids.join(' ') : undefined;
  };

  const ariaInvalid = () =>
    errorActive()
      ? 'true'
      : (controlProps as Record<string, string | undefined>)['aria-invalid'];

  const selectedIndex = () =>
    local.options.findIndex((option) => option.value === (local.value ?? ''));

  const selectedOption = () => {
    const index = selectedIndex();
    return index >= 0 ? local.options[index] : undefined;
  };

  const isPlaceholder = () => !selectedOption() && (local.value ?? '') === '';

  const displayLabel = () => {
    if (selectedOption()) return selectedOption()?.label ?? '';
    if (!isPlaceholder()) return local.value ?? '';
    return local.placeholder ?? '';
  };

  const firstEnabledIndex = () =>
    local.options.findIndex((option) => !option.disabled);

  const lastEnabledIndex = () => {
    for (let i = local.options.length - 1; i >= 0; i -= 1) {
      if (!local.options[i]?.disabled) return i;
    }
    return -1;
  };

  const nextEnabledIndex = (start: number, direction: 1 | -1) => {
    if (!local.options.length) return -1;
    for (let i = 0; i < local.options.length; i += 1) {
      const index = (start + direction + local.options.length) % local.options.length;
      if (!local.options[index]?.disabled) return index;
      start = index;
    }
    return -1;
  };

  const syncHighlightToSelection = () => {
    const current = selectedIndex();
    if (current >= 0 && !local.options[current]?.disabled) {
      setHighlightedIndex(current);
      return;
    }
    setHighlightedIndex(firstEnabledIndex());
  };

  const closeMenu = () => {
    setOpen(false);
    setHighlightedIndex(-1);
  };

  const openMenu = () => {
    if (!canInteract() || open()) return;
    setOpen(true);
    updateMenuPos();
    syncHighlightToSelection();
  };

  const moveHighlight = (direction: 1 | -1) => {
    if (!open()) {
      openMenu();
      if (direction === -1 && highlightedIndex() < 0) {
        setHighlightedIndex(lastEnabledIndex());
      }
      return;
    }

    const current = highlightedIndex();
    const start =
      current >= 0
        ? current
        : direction === 1
          ? local.options.length - 1
          : 0;
    const next = nextEnabledIndex(start, direction);
    if (next >= 0) {
      setHighlightedIndex(next);
    }
  };

  const selectOptionAt = (index: number, trigger: SelectChangeContext['trigger']) => {
    if (!canInteract()) return;

    const option = local.options[index];
    if (!option || option.disabled) return;

    const prevValue = local.value ?? '';
    const ctx: SelectChangeContext = {
      prevValue,
      nextValue: option.value,
      option,
      optionIndex: index,
      trigger,
    };

    local.onValue?.(option.value, ctx);
    closeMenu();
  };

  const containerClass = () => {
    const sizeClass =
      variant() === 'standard'
        ? sizeStyles[size()].standard
        : sizeStyles[size()].container;

    const toneClasses = errorActive()
      ? 'border-rose-500/80 focus-within:border-rose-500 dark:border-rose-500/70'
      : 'border-slate-300/80 focus-within:border-emerald-400 dark:border-slate-700 dark:focus-within:border-emerald-400';

    return cx(
      'tf-input-container relative flex w-full items-center gap-2 transition duration-150',
      variantStyles[variant()],
      sizeClass,
      toneClasses,
      variant() === 'standard' ? 'rounded-none' : 'rounded-xl',
      disabled()
        ? 'cursor-not-allowed opacity-60'
        : readOnly()
          ? 'cursor-default'
          : 'cursor-pointer',
      readOnly() && !disabled() ? 'bg-slate-50/80 dark:bg-slate-900/40' : '',
    );
  };

  const helperToneClass = () => {
    if (errorActive()) return 'text-rose-600 dark:text-rose-300';
    if (metaWarnings().length > 0) return 'text-amber-600 dark:text-amber-300';
    return 'text-slate-500 dark:text-slate-400';
  };

  const displayClass = () =>
    cx(
      baseDisplayClass,
      sizeStyles[size()].input,
      disabled()
        ? 'cursor-not-allowed'
        : readOnly()
          ? 'cursor-default'
          : 'cursor-pointer',
      isPlaceholder() ? 'text-slate-400/90 dark:text-slate-500' : '',
      local.inputClass,
    );

  const helperClass = () => cx('text-xs', helperToneClass(), local.helperClass);

  const handleContainerPointerDown: JSX.EventHandlerUnion<HTMLDivElement, PointerEvent> = () => {
    if (disabled() || readOnly()) return;
    if (animateRingOnFocus()) {
      pulseRing();
    }
  };

  const handleClick: JSX.EventHandlerUnion<HTMLButtonElement, MouseEvent> = (
    event,
  ) => {
    if (disabled() || readOnly()) {
      callHandler(local.onClick, event);
      return;
    }

    if (open()) {
      closeMenu();
    } else {
      setOpen(true);
      updateMenuPos();
      syncHighlightToSelection();
    }

    callHandler(local.onClick, event);
  };

  const handleContainerClick: JSX.EventHandlerUnion<HTMLDivElement, MouseEvent> = (
    event,
  ) => {
    const target = event.target as Node | null;
    if (target && controlEl?.contains(target)) {
      return;
    }

    if (!disabled()) {
      controlEl?.focus();
    }

    if (disabled() || readOnly()) {
      return;
    }

    if (open()) {
      closeMenu();
    } else {
      setOpen(true);
      updateMenuPos();
      syncHighlightToSelection();
    }
  };

  const handleKeyDown: JSX.EventHandlerUnion<HTMLButtonElement, KeyboardEvent> = (
    event,
  ) => {
    callHandler(local.onKeyDown, event);

    if (disabled() || readOnly()) return;

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

    if (key === 'ArrowDown') {
      event.preventDefault();
      moveHighlight(1);
      return;
    }

    if (key === 'ArrowUp') {
      event.preventDefault();
      moveHighlight(-1);
      return;
    }

    if (key === 'Enter') {
      event.preventDefault();
      if (!open()) {
        openMenu();
        return;
      }
      const index =
        highlightedIndex() >= 0 ? highlightedIndex() : firstEnabledIndex();
      if (index >= 0) {
        selectOptionAt(index, 'keyboard');
      }
      return;
    }

    if (key === ' ') {
      event.preventDefault();
      if (!open()) {
        openMenu();
        return;
      }
      const index =
        highlightedIndex() >= 0 ? highlightedIndex() : firstEnabledIndex();
      if (index >= 0) {
        selectOptionAt(index, 'keyboard');
      }
    }
  };

  const handleBlur: JSX.EventHandlerUnion<HTMLButtonElement, FocusEvent> = (
    event,
  ) => {
    const nextFocus = event.relatedTarget as Node | null;
    const insideRoot = !!nextFocus && !!rootEl && rootEl.contains(nextFocus);
    const insideMenu = !!nextFocus && !!menuEl && menuEl.contains(nextFocus);
    if (insideRoot || insideMenu) {
      callHandler(local.onBlur, event);
      return;
    }
    closeMenu();
    callHandler(local.onBlur, event);
  };

  const handleFocus: JSX.EventHandlerUnion<HTMLButtonElement, FocusEvent> = (
    event,
  ) => {
    if (animateRingOnFocus() && event.currentTarget.matches(':focus-visible')) {
      pulseRing();
    }
    callHandler(local.onFocus, event);
  };

  createEffect(() => {
    if (!open()) return;

    updateMenuPos();

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      const isInsideRoot = !!rootEl && rootEl.contains(target);
      const isInsideMenu = !!menuEl && menuEl.contains(target);
      if (!target || (!isInsideRoot && !isInsideMenu)) {
        closeMenu();
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    const onReposition = () => updateMenuPos();
    window.addEventListener('scroll', onReposition, true);
    window.addEventListener('resize', onReposition);
    onCleanup(() => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      window.removeEventListener('scroll', onReposition, true);
      window.removeEventListener('resize', onReposition);
    });
  });

  createEffect(() => {
    if (!open()) return;
    const index = highlightedIndex();
    if (index < 0) return;
    queueMicrotask(() => {
      optionEls[index]?.scrollIntoView({ block: 'nearest' });
    });
  });

  return (
    <div
      ref={rootEl}
      class={cx(
        'flex flex-col gap-1.5',
        fullWidth() ? 'w-full' : 'inline-flex',
        local.class,
        local.rootClass,
      )}
    >
      {local.renderLabel
        ? local.renderLabel({
            label: local.label,
            required: required(),
            disabled: disabled(),
            htmlFor: controlId(),
          })
        : local.label && (
            <label
              for={controlId()}
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
          )}

      <div class="relative">
        <Show when={local.name}>
          <input
            type="hidden"
            name={local.name}
            value={local.value ?? ''}
            disabled={disabled()}
          />
        </Show>

        <div
          class={containerClass()}
          onPointerDown={handleContainerPointerDown}
          onClick={handleContainerClick}
        >
          <Show when={ringEnabled()}>
            <span
              ref={setRingHostEl}
              aria-hidden="true"
              class={cx(
                'tf-focus-ant-ring',
                errorActive()
                  ? 'text-rose-500 dark:text-rose-400'
                  : 'text-emerald-500 dark:text-emerald-400',
              )}
              style={ringActive() ? {animation: 'tf-focus-ant-ring-fade 620ms ease-out forwards'} : undefined}
            >
              <svg
                class="tf-focus-ant-ring-svg"
                viewBox={`0 0 ${ringBox().w} ${ringBox().h}`}
                preserveAspectRatio="none"
              >
                <Show when={ringActive()}>
                  {() => (
                    <>
                      <path
                        class="tf-focus-ant-ring-outline"
                        data-pulse={ringPulseKey()}
                        d={ringPathD()}
                        fill="none"
                        vector-effect="non-scaling-stroke"
                        opacity="0.02"
                      />

                      <path
                        ref={setRingMeasureEl}
                        d={ringPathD()}
                        fill="none"
                        stroke="none"
                      />

                      <path
                        ref={setRingAntSegEl}
                        class="tf-focus-ant-ring-ant"
                        data-pulse={ringPulseKey()}
                        d=""
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2.25"
                        stroke-linecap="round"
                        vector-effect="non-scaling-stroke"
                      />
                    </>
                  )}
                </Show>
              </svg>
            </span>
          </Show>

          <Show when={local.startAdornment}>
            <span
              class={cx(
                'text-slate-500 dark:text-slate-400',
                sizeStyles[size()].adornment,
              )}
            >
              {local.startAdornment}
            </span>
          </Show>

          <button
            type="button"
            id={controlId()}
            ref={controlEl}
            role="combobox"
            aria-haspopup="listbox"
            aria-expanded={open() ? 'true' : 'false'}
            aria-controls={open() ? menuId() : undefined}
            aria-activedescendant={
              open() && highlightedIndex() >= 0
                ? optionId(highlightedIndex())
                : undefined
            }
            aria-invalid={ariaInvalid()}
            aria-describedby={describedBy()}
            aria-disabled={disabled() ? 'true' : undefined}
            aria-readonly={readOnly() ? 'true' : undefined}
            disabled={disabled()}
            class={displayClass()}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            onFocus={handleFocus}
            {...controlProps}
          >
            <span>{displayLabel() || '\u00A0'}</span>
          </button>

          <Show
            when={local.endAdornment}
            fallback={
              <span
                class={cx(
                  'pointer-events-none text-slate-500 transition-transform dark:text-slate-400',
                  sizeStyles[size()].adornment,
                  open() ? 'rotate-180' : '',
                )}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  class="h-4 w-4"
                  aria-hidden="true"
                >
                  <path
                    fill-rule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.51a.75.75 0 01-1.08 0l-4.25-4.51a.75.75 0 01.02-1.06z"
                    clip-rule="evenodd"
                  />
                </svg>
              </span>
            }
          >
            <span
              class={cx(
                'text-slate-500 dark:text-slate-400',
                sizeStyles[size()].adornment,
              )}
            >
              {local.endAdornment}
            </span>
          </Show>
        </div>

        <Show when={open()}>
          <Portal>
            <div
              ref={menuEl}
              id={menuId()}
              role="listbox"
              style={{
                position: 'fixed',
                top: `${menuPos().top}px`,
                left: `${menuPos().left}px`,
                width: `${menuPos().width}px`,
              }}
              class={cx(
                'z-[9999] max-h-60 overflow-auto rounded-xl border border-slate-200/80 bg-white/95 py-1 shadow-lg shadow-slate-200/60 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/95 dark:shadow-slate-900/60',
                local.menuClass,
              )}
            >
              <Show
                when={local.options.length > 0}
                fallback={
                  <div class="px-3.5 py-2 text-sm text-slate-500 dark:text-slate-400">
                    No options
                  </div>
                }
              >
                <For each={local.options}>
                  {(option, index) => {
                    const selected = () => option.value === (local.value ?? '');
                    const highlighted = () => index() === highlightedIndex();
                    const optionDisabled = () => Boolean(option.disabled);

                    return (
                      <div
                        id={optionId(index())}
                        ref={(el) => {
                          optionEls[index()] = el;
                        }}
                        role="option"
                        aria-selected={selected() ? 'true' : 'false'}
                        aria-disabled={optionDisabled() ? 'true' : undefined}
                        class={cx(
                          'flex items-center justify-between transition',
                          sizeStyles[size()].option,
                          sizeStyles[size()].input,
                          optionDisabled()
                            ? 'cursor-not-allowed text-slate-400 dark:text-slate-500'
                            : 'cursor-pointer text-slate-800 dark:text-slate-100',
                          highlighted() && !optionDisabled()
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                            : '',
                          selected() && !optionDisabled() ? 'font-semibold' : '',
                          local.optionClass,
                        )}
                        onMouseDown={(event) => event.preventDefault()}
                        onMouseEnter={() => {
                          if (!optionDisabled()) setHighlightedIndex(index());
                        }}
                        onClick={() => selectOptionAt(index(), 'click')}
                      >
                        <span>{option.label}</span>
                        <Show when={selected() && !optionDisabled()}>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            class="h-4 w-4 text-emerald-600 dark:text-emerald-300"
                            aria-hidden="true"
                          >
                            <path
                              fill-rule="evenodd"
                              d="M16.704 5.29a1 1 0 010 1.414l-7.41 7.411a1 1 0 01-1.415 0L3.296 9.53A1 1 0 114.71 8.117l3.876 3.876 6.704-6.703a1 1 0 011.414 0z"
                              clip-rule="evenodd"
                            />
                          </svg>
                        </Show>
                      </div>
                    );
                  }}
                </For>
              </Show>
            </div>
          </Portal>
        </Show>
      </div>

      <Show when={hasHelper()}>
        <div id={helperId()} class={helperClass()}>
          {local.renderHelper ? (
            local.renderHelper({
              helperText: helperContent(),
              error: errorActive(),
              meta: meta(),
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

export default Select;
