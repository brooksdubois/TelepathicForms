import { For, Show, createEffect, createMemo, createSignal, onCleanup } from 'solid-js';
import type { JSX } from 'solid-js';
import { Portal } from 'solid-js/web';
import { Transition } from 'solid-transition-group';
import { Temporal } from '@js-temporal/polyfill';
import { useLaserAnimation as useLaserRing } from '../utils/useLaserAnimation';

/* ── Types ── */
export type DateRangeValue = { start: string; end: string } | null;
export type DateRangeChangeSource = 'calendar' | 'clear' | 'typing';

export type DateRangePickerProps = {
  id?: string;
  name?: string;
  class?: string;
  inputClass?: string;
  popoverClass?: string;
  label?: string;
  helperText?: string;
  placeholder?: string;

  value?: DateRangeValue;
  onChange?: (
    value: DateRangeValue,
    ctx?: { source: DateRangeChangeSource },
  ) => void;

  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  error?: boolean;
  clearable?: boolean;
  ringEnabled?: boolean;
  animateRingOnFocus?: boolean;

  minDate?: string;
  maxDate?: string;
  disablePast?: boolean;
  disableFuture?: boolean;
  disableWeekends?: boolean;
  shouldDisableDate?: (isoDate: string) => boolean;

  openOnFocus?: boolean;
  closeOnSelect?: boolean;

  locale?: string;
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  inputMask?: string;

  onOpenChange?: (open: boolean) => void;
  onFocus?: JSX.EventHandlerUnion<HTMLInputElement, FocusEvent>;
  onBlur?: JSX.EventHandlerUnion<HTMLInputElement, FocusEvent>;
};

/* ── Helpers ── */
const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ');

const pad2 = (n: number) => n.toString().padStart(2, '0');

const toIsoDateString = (date: Temporal.PlainDate) =>
  date.withCalendar('iso8601').toString();

const comparePD = (a: Temporal.PlainDate, b: Temporal.PlainDate) =>
  Temporal.PlainDate.compare(a.withCalendar('iso8601'), b.withCalendar('iso8601'));

const startOfMonth = (date: Temporal.PlainDate) => date.with({ day: 1 });

const shiftMonth = (date: Temporal.PlainDate, months: number) => {
  const shifted = startOfMonth(date).add({ months });
  const day = Math.min(date.day, shifted.daysInMonth);
  return shifted.with({ day });
};

const dayOfWeekToSundayIndex = (dow: number) => dow % 7;

const resolveWeekStart = (locale: string): 0 | 1 | 2 | 3 | 4 | 5 | 6 => {
  try {
    const l = new Intl.Locale(locale) as Intl.Locale & { weekInfo?: { firstDay?: number } };
    const fd = l.weekInfo?.firstDay;
    if (typeof fd === 'number') return (fd % 7) as 0 | 1 | 2 | 3 | 4 | 5 | 6;
  } catch { /* ignore */ }
  return 0;
};

const parseIsoStrict = (text: string | null | undefined): Temporal.PlainDate | null => {
  if (!text) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text.trim());
  if (!m) return null;
  try {
    return Temporal.PlainDate.from({ year: +m[1], month: +m[2], day: +m[3] });
  } catch { return null; }
};

const formatDisplay = (iso: string | null) => {
  if (!iso) return '';
  const d = parseIsoStrict(iso);
  if (!d) return '';
  return `${pad2(d.month)}-${pad2(d.day)}-${d.year.toString().padStart(4, '0')}`;
};

type DayCell = {
  date: Temporal.PlainDate;
  iso: string;
  outsideMonth: boolean;
};

const buildGrid = (monthStart: Temporal.PlainDate, weekStartsOn: number): DayCell[] => {
  const firstIndex = dayOfWeekToSundayIndex(monthStart.dayOfWeek);
  const offset = (firstIndex - weekStartsOn + 7) % 7;
  const gridStart = monthStart.subtract({ days: offset });

  return Array.from({ length: 42 }, (_, i) => {
    const date = gridStart.add({ days: i });
    return {
      date,
      iso: toIsoDateString(date),
      outsideMonth: date.month !== monthStart.month || date.year !== monthStart.year,
    };
  });
};

const callHandler = <T, E extends Event>(
  handler: JSX.EventHandlerUnion<T, E> | undefined,
  event: E,
) => {
  if (!handler) return;
  const handlers = Array.isArray(handler) ? handler : [handler];
  handlers.forEach((fn) => fn && fn(event));
};

/* ── Component ── */
const DateRangePicker = (props: DateRangePickerProps) => {
  const autoId = `drp-${Math.random().toString(36).slice(2, 10)}`;

  let rootEl: HTMLDivElement | undefined;
  let inputEl: HTMLInputElement | undefined;
  let popoverEl: HTMLDivElement | undefined;

  const locale = createMemo(() => props.locale ?? (typeof navigator !== 'undefined' ? navigator.language : 'en-US'));
  const weekStartsOn = createMemo(() => {
    if (typeof props.weekStartsOn === 'number') return props.weekStartsOn;
    return resolveWeekStart(locale());
  });
  const closeOnSelect = createMemo(() => props.closeOnSelect ?? true);
  const openOnFocus = createMemo(() => props.openOnFocus ?? true);
  const placeholder = createMemo(() => props.placeholder ?? 'Select date range');

  /* ── State ── */
  const [open, setOpenRaw] = createSignal(false);
  const [popoverPos, setPopoverPos] = createSignal({ top: 0, left: 0, width: 0 });

  // Selection
  const [selStart, setSelStart] = createSignal<string | null>(props.value?.start ?? null);
  const [selEnd, setSelEnd] = createSignal<string | null>(props.value?.end ?? null);
  const [picking, setPicking] = createSignal(false); // after first click
  const [hoverIso, setHoverIso] = createSignal<string | null>(null);

  // Calendar nav — left month
  const todayDate = () => Temporal.Now.plainDateISO();
  const [leftMonth, setLeftMonth] = createSignal(startOfMonth(
    (props.value?.start ? parseIsoStrict(props.value.start) : null) ?? todayDate()
  ));

  const rightMonth = createMemo(() => shiftMonth(leftMonth(), 1).with({ day: 1 }));

  const ringEnabled = () => props.ringEnabled ?? true;
  const animateRingOnFocus = () => props.animateRingOnFocus ?? true;
  const {
    ringBox,
    ringPathD,
    ringPulseKey,
    ringActive,
    pulseRing,
    setRingHostEl,
    setRingMeasureEl,
    setRingLaserSegEl,
  } = useLaserRing({ enabled: ringEnabled, radius: () => 16 });

  /* ── Sync from props ── */
  createEffect(() => {
    const v = props.value;
    if (v && v.start && v.end) {
      setSelStart(v.start);
      setSelEnd(v.end);
      setPicking(false);
    } else if (v === null || v === undefined) {
      setSelStart(null);
      setSelEnd(null);
      setPicking(false);
    }
  });

  /* ── Open / close ── */
  const canInteract = () => !props.disabled && !props.readOnly;

  const setOpen = (next: boolean) => {
    if (!canInteract() && next) return;
    setOpenRaw(next);
    props.onOpenChange?.(next);
  };

  const updatePopoverPos = () => {
    if (!rootEl) return;
    const r = rootEl.getBoundingClientRect();
    setPopoverPos({ top: r.bottom + 8, left: r.left, width: Math.max(r.width, 580) });
  };

  createEffect(() => {
    if (open()) {
      updatePopoverPos();
      const onRepos = () => updatePopoverPos();
      window.addEventListener('resize', onRepos);
      window.addEventListener('scroll', onRepos, true);
      onCleanup(() => {
        window.removeEventListener('resize', onRepos);
        window.removeEventListener('scroll', onRepos, true);
      });
    }
  });

  // Close on outside click
  createEffect(() => {
    if (!open()) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (rootEl?.contains(t) || popoverEl?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    onCleanup(() => document.removeEventListener('mousedown', handler));
  });

  /* ── Date disabling ── */
  const minDate = createMemo(() => parseIsoStrict(props.minDate));
  const maxDate = createMemo(() => parseIsoStrict(props.maxDate));

  const isDateDisabled = (date: Temporal.PlainDate) => {
    if (props.disabled || props.readOnly) return true;
    const min = minDate();
    if (min && comparePD(date, min) < 0) return true;
    const max = maxDate();
    if (max && comparePD(date, max) > 0) return true;
    const today = todayDate();
    if (props.disablePast && comparePD(date, today) < 0) return true;
    if (props.disableFuture && comparePD(date, today) > 0) return true;
    if (props.disableWeekends && (date.dayOfWeek === 6 || date.dayOfWeek === 7)) return true;
    if (props.shouldDisableDate) {
      try { return Boolean(props.shouldDisableDate(toIsoDateString(date))); }
      catch { return true; }
    }
    return false;
  };

  /* ── Range logic ── */
  const effectiveStart = createMemo(() => {
    const s = selStart();
    const e = picking() ? hoverIso() : selEnd();
    if (!s || !e) return s;
    return s <= e ? s : e;
  });

  const effectiveEnd = createMemo(() => {
    const s = selStart();
    const e = picking() ? hoverIso() : selEnd();
    if (!s || !e) return e;
    return s <= e ? e : s;
  });

  /* ── Calendar navigation ── */
  const prevMonth = () => setLeftMonth(shiftMonth(leftMonth(), -1).with({ day: 1 }));
  const nextMonth = () => setLeftMonth(shiftMonth(leftMonth(), 1).with({ day: 1 }));

  const leftGrid = createMemo(() => buildGrid(leftMonth(), weekStartsOn()));
  const rightGrid = createMemo(() => buildGrid(rightMonth(), weekStartsOn()));

  const dayLabels = createMemo(() => {
    const anchor = todayDate().subtract({ days: dayOfWeekToSundayIndex(todayDate().dayOfWeek) });
    return Array.from({ length: 7 }, (_, i) => {
      const offset = (weekStartsOn() + i) % 7;
      return anchor.add({ days: offset }).toLocaleString(locale(), { weekday: 'short' });
    });
  });

  /* ── Click handler ── */
  const handleDayClick = (iso: string, date: Temporal.PlainDate) => {
    if (isDateDisabled(date)) return;

    if (!picking()) {
      setSelStart(iso);
      setSelEnd(null);
      setPicking(true);
      setHoverIso(iso);
    } else {
      const s = selStart()!;
      const newStart = iso < s ? iso : s;
      const newEnd = iso < s ? s : iso;

      setSelStart(newStart);
      setSelEnd(newEnd);
      setPicking(false);
      setHoverIso(null);

      props.onChange?.({ start: newStart, end: newEnd }, { source: 'calendar' });

      if (closeOnSelect()) setOpen(false);
    }
  };

  const handleClear = () => {
    setSelStart(null);
    setSelEnd(null);
    setPicking(false);
    setHoverIso(null);
    props.onChange?.(null, { source: 'clear' });
  };

  /* ── Display ── */
  const displayText = createMemo(() => {
    const s = selStart();
    const e = selEnd();
    if (s && e && !picking()) return `${formatDisplay(s)}  →  ${formatDisplay(e)}`;
    if (s && picking()) return `${formatDisplay(s)}  →  ...`;
    return '';
  });

  /* ── Ids ── */
  const inputId = () => props.id ?? autoId;
  const helperId = () => `${inputId()}-helper`;
  const dialogId = () => `${inputId()}-dialog`;

  const errorActive = createMemo(() => Boolean(props.error));
  const helperContent = createMemo(() => props.helperText);
  const helperActive = createMemo(() => Boolean(helperContent()));
  const showClear = createMemo(() =>
    Boolean(props.clearable) && Boolean(selStart() || selEnd()) && canInteract()
  );

  const monthLabel = (m: Temporal.PlainDate) =>
    m.toLocaleString(locale(), { month: 'long', year: 'numeric' });

  /* ── Render a single month panel ── */
  const renderMonthPanel = (monthStart: Temporal.PlainDate, cells: DayCell[]) => (
    <div class="flex-1 min-w-0">
      <div class="mb-2 text-center text-sm font-semibold text-slate-800 dark:text-slate-100">
        {monthLabel(monthStart)}
      </div>

      {/* Weekday headers */}
      <div class="grid grid-cols-7 gap-1 pb-1">
        <For each={dayLabels()}>
          {(label) => (
            <div class="py-1 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {label}
            </div>
          )}
        </For>
      </div>

      {/* Day grid */}
      <div class="grid grid-cols-7 gap-0">
        <For each={cells}>
          {(cell) => {
            const iso = cell.iso;
            const disabled = () => isDateDisabled(cell.date);
            const isToday = () => iso === toIsoDateString(todayDate());
            const isStart = () => iso === effectiveStart();
            const isEnd = () => iso === effectiveEnd();
            const inRange = () => {
              const s = effectiveStart();
              const e = effectiveEnd();
              return !!s && !!e && iso > s && iso < e;
            };

            return (
              <div
                class={cx(
                  'relative flex h-9 items-center justify-center',
                  // Range band backgrounds
                  inRange() && 'bg-emerald-100/60 dark:bg-emerald-500/15',
                  isStart() && !isEnd() && 'rounded-l-full bg-emerald-100/60 dark:bg-emerald-500/15',
                  isEnd() && !isStart() && 'rounded-r-full bg-emerald-100/60 dark:bg-emerald-500/15',
                  isStart() && isEnd() && 'rounded-full',
                )}
              >
                <button
                  type="button"
                  disabled={disabled()}
                  onClick={() => handleDayClick(iso, cell.date)}
                  onMouseEnter={() => picking() && setHoverIso(iso)}
                  class={cx(
                    'relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-sm transition-all duration-100',
                    // Outside month
                    cell.outsideMonth
                      ? 'text-slate-400 dark:text-slate-600'
                      : 'text-slate-700 dark:text-slate-200',
                    // Disabled
                    disabled() && 'cursor-not-allowed opacity-40',
                    // Start/End pill
                    (isStart() || isEnd()) && !disabled() &&
                      'bg-emerald-500 font-semibold text-white shadow-sm hover:bg-emerald-600 dark:bg-emerald-400 dark:text-slate-950 dark:hover:bg-emerald-500',
                    // In-range hover
                    inRange() && !isStart() && !isEnd() && !disabled() &&
                      'text-emerald-700 hover:bg-emerald-200/80 dark:text-emerald-200 dark:hover:bg-emerald-500/30',
                    // Normal day hover
                    !isStart() && !isEnd() && !inRange() && !disabled() && !cell.outsideMonth &&
                      'hover:bg-slate-100 dark:hover:bg-slate-800',
                    // Today indicator ring
                    isToday() && !isStart() && !isEnd() && 'ring-1 ring-emerald-400/60',
                  )}
                >
                  {cell.date.day}
                  <Show when={isToday() && !isStart() && !isEnd()}>
                    <span class="pointer-events-none absolute bottom-0.5 h-1 w-1 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                  </Show>
                </button>
              </div>
            );
          }}
        </For>
      </div>
    </div>
  );

  return (
    <div ref={rootEl} class={cx('relative flex flex-col gap-1.5', props.class)}>
      {/* Hidden inputs for form submission */}
      <Show when={props.name}>
        <input type="hidden" name={`${props.name}_start`} value={selStart() ?? ''} disabled={props.disabled} />
        <input type="hidden" name={`${props.name}_end`} value={selEnd() ?? ''} disabled={props.disabled} />
      </Show>

      {/* Label */}
      <Show when={props.label}>
        <label
          for={inputId()}
          class={cx(
            'text-sm font-medium text-slate-700 dark:text-slate-200',
            props.disabled ? 'opacity-60' : '',
          )}
        >
          <span>{props.label}</span>
          <Show when={props.required}>
            <span class="text-rose-500"> *</span>
          </Show>
        </label>
      </Show>

      {/* Input trigger */}
      <div
        class={cx(
          'tf-input-container relative flex w-full items-center gap-1 rounded-xl border bg-white/90 px-3.5 py-2.5 shadow-sm transition dark:bg-slate-900/60',
          errorActive()
            ? 'border-rose-500/80 focus-within:border-rose-500'
            : 'border-slate-300/80 focus-within:border-emerald-400 dark:border-slate-700 dark:focus-within:border-emerald-400',
          props.disabled
            ? 'cursor-not-allowed opacity-60'
            : props.readOnly ? 'cursor-default' : 'cursor-pointer',
          props.inputClass,
        )}
        onClick={() => {
          if (!canInteract()) return;
          inputEl?.focus();
          setOpen(true);
        }}
      >
        {/* Laser ring */}
        <Show when={ringEnabled()}>
          <span
            ref={setRingHostEl}
            aria-hidden="true"
            class={cx(
              'tf-focus-laser-ring',
              errorActive()
                ? 'text-rose-500 dark:text-rose-400'
                : 'text-emerald-500 dark:text-emerald-400',
            )}
          >
            <svg
              class="tf-focus-laser-ring-svg"
              viewBox={`0 0 ${ringBox().w} ${ringBox().h}`}
              preserveAspectRatio="none"
            >
              <Show when={ringActive()}>
                <path
                  class="tf-focus-laser-ring-outline"
                  data-pulse={ringPulseKey()}
                  d={ringPathD()}
                  fill="none"
                  vector-effect="non-scaling-stroke"
                  opacity="0.02"
                />
                <path ref={setRingMeasureEl} d={ringPathD()} fill="none" stroke="none" />
                <path
                  ref={setRingLaserSegEl}
                  class="tf-focus-laser-ring-segment"
                  data-pulse={ringPulseKey()}
                  d=""
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.25"
                  stroke-linecap="round"
                  vector-effect="non-scaling-stroke"
                />
              </Show>
            </svg>
          </span>
        </Show>

        <input
          ref={inputEl}
          id={inputId()}
          role="combobox"
          aria-haspopup="dialog"
          aria-expanded={open() ? 'true' : 'false'}
          aria-controls={dialogId()}
          aria-describedby={helperActive() ? helperId() : undefined}
          aria-invalid={errorActive() ? 'true' : undefined}
          disabled={props.disabled}
          readOnly
          required={props.required}
          placeholder={placeholder()}
          value={displayText()}
          class={cx(
            'min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400/90 dark:text-slate-100 dark:placeholder:text-slate-500 cursor-pointer',
            props.disabled ? 'cursor-not-allowed' : '',
          )}
          onFocus={(e) => {
            if (animateRingOnFocus()) pulseRing();
            if (openOnFocus() && canInteract()) setOpen(true);
            callHandler(props.onFocus, e);
          }}
          onBlur={(e) => callHandler(props.onBlur, e)}
          onKeyDown={(e) => {
            if (e.key === 'Escape' && open()) { e.preventDefault(); setOpen(false); }
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(!open()); }
          }}
        />

        {/* Clear button */}
        <Show when={showClear()}>
          <button
            type="button"
            class="inline-flex h-5 w-5 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-200 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
            aria-label="Clear date range"
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleClear(); inputEl?.focus(); }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4" aria-hidden="true">
              <path fill-rule="evenodd" d="M4.22 4.22a.75.75 0 011.06 0L10 8.94l4.72-4.72a.75.75 0 111.06 1.06L11.06 10l4.72 4.72a.75.75 0 11-1.06 1.06L10 11.06l-4.72 4.72a.75.75 0 11-1.06-1.06L8.94 10 4.22 5.28a.75.75 0 010-1.06z" clip-rule="evenodd" />
            </svg>
          </button>
        </Show>

        {/* Calendar icon */}
        <button
          type="button"
          class="inline-flex h-5 w-5 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-200 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
          aria-label={open() ? 'Close calendar' : 'Open calendar'}
          onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (canInteract()) { setOpen(!open()); inputEl?.focus(); } }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4" aria-hidden="true">
            <path d="M6 2.75A.75.75 0 016.75 2h.5a.75.75 0 010 1.5h-.5A.75.75 0 016 2.75zM12.75 2a.75.75 0 000 1.5h.5a.75.75 0 000-1.5h-.5z" />
            <path fill-rule="evenodd" d="M4.25 4A2.25 2.25 0 002 6.25v8.5A2.25 2.25 0 004.25 17h11.5A2.25 2.25 0 0018 14.75v-8.5A2.25 2.25 0 0015.75 4H4.25zM3.5 8.5v6.25c0 .414.336.75.75.75h11.5a.75.75 0 00.75-.75V8.5h-13z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Helper text */}
      <Show when={helperActive()}>
        <div
          id={helperId()}
          class={cx(
            'text-xs',
            errorActive() ? 'text-rose-600 dark:text-rose-300' : 'text-slate-500 dark:text-slate-400',
          )}
        >
          {helperContent()}
        </div>
      </Show>

      {/* Popover */}
      <Portal>
        <Transition
          onEnter={(rawEl, done) => {
            const el = rawEl as HTMLElement;
            el.classList.add('tf-popover-enter');
            const t = setTimeout(() => { el.classList.remove('tf-popover-enter'); done(); }, 220);
            el.addEventListener('animationend', () => { clearTimeout(t); el.classList.remove('tf-popover-enter'); done(); }, { once: true });
          }}
          onExit={(rawEl, done) => {
            const el = rawEl as HTMLElement;
            el.classList.add('tf-popover-exit');
            const t = setTimeout(() => { el.classList.remove('tf-popover-exit'); done(); }, 180);
            el.addEventListener('animationend', () => { clearTimeout(t); el.classList.remove('tf-popover-exit'); done(); }, { once: true });
          }}
        >
          {open() ? (
            <div
              ref={popoverEl}
              id={dialogId()}
              role="dialog"
              aria-label="Choose date range"
              style={{
                position: 'fixed',
                top: `${popoverPos().top}px`,
                left: `${popoverPos().left}px`,
                width: `${popoverPos().width}px`,
                'max-width': '600px',
              }}
              class={cx(
                'z-[9999] origin-top rounded-xl border border-slate-200/80 bg-white/95 shadow-xl shadow-slate-200/60 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/95 dark:shadow-slate-900/60',
                props.popoverClass,
              )}
              onMouseDown={(e) => e.preventDefault()}
              onMouseLeave={() => picking() && setHoverIso(selStart())}
            >
              {/* Navigation header */}
              <div class="flex items-center justify-between border-b border-slate-200/80 px-3 py-2 dark:border-slate-700">
                <button
                  type="button"
                  class="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-600 transition hover:bg-slate-200 hover:text-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100"
                  aria-label="Previous month"
                  onClick={() => prevMonth()}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4">
                    <path fill-rule="evenodd" d="M11.78 4.22a.75.75 0 010 1.06L7.06 10l4.72 4.72a.75.75 0 11-1.06 1.06l-5.25-5.25a.75.75 0 010-1.06l5.25-5.25a.75.75 0 011.06 0z" clip-rule="evenodd" />
                  </svg>
                </button>

                <div class="flex items-center gap-6">
                  <span class="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {monthLabel(leftMonth())}
                  </span>
                  <span class="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {monthLabel(rightMonth())}
                  </span>
                </div>

                <button
                  type="button"
                  class="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-600 transition hover:bg-slate-200 hover:text-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100"
                  aria-label="Next month"
                  onClick={() => nextMonth()}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4">
                    <path fill-rule="evenodd" d="M8.22 15.78a.75.75 0 010-1.06L12.94 10 8.22 5.28a.75.75 0 111.06-1.06l5.25 5.25a.75.75 0 010 1.06l-5.25 5.25a.75.75 0 01-1.06 0z" clip-rule="evenodd" />
                  </svg>
                </button>
              </div>

              {/* Dual calendar grid */}
              <div class="flex gap-4 px-4 pb-3 pt-2">
                {renderMonthPanel(leftMonth(), leftGrid())}
                <div class="w-px self-stretch bg-slate-200/80 dark:bg-slate-700" />
                {renderMonthPanel(rightMonth(), rightGrid())}
              </div>

              {/* Footer */}
              <div class="flex items-center justify-between border-t border-slate-200/80 px-3 py-2 dark:border-slate-700">
                <div class="flex items-center gap-3">
                  <Show when={showClear()}>
                    <button
                      type="button"
                      class="inline-flex items-center rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-200 hover:text-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100"
                      onClick={handleClear}
                    >
                      Clear
                    </button>
                  </Show>
                  <Show when={picking()}>
                    <span class="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                      Select end date
                    </span>
                  </Show>
                </div>
                <div class="text-[11px] text-slate-500 dark:text-slate-400">
                  {selStart() && selEnd() && !picking()
                    ? `${formatDisplay(selStart())} → ${formatDisplay(selEnd())}`
                    : selStart() && picking()
                      ? `From ${formatDisplay(selStart())}`
                      : 'No selection'}
                </div>
              </div>
            </div>
          ) : null}
        </Transition>
      </Portal>
    </div>
  );
};

export default DateRangePicker;
