import { For, Show, createEffect, createMemo, createSignal, onCleanup } from 'solid-js';
import type { JSX } from 'solid-js';
import { Portal } from 'solid-js/web';
import { Temporal } from '@js-temporal/polyfill';

export type DatePickerChangeSource = 'typing' | 'calendar' | 'clear';

export type DatePickerProps = {
  id?: string;
  name?: string;
  class?: string;
  inputClass?: string;
  popoverClass?: string;
  label?: string;
  helperText?: string;
  placeholder?: string;
  value?: string | null;
  defaultValue?: string | null;
  onChange?: (
    value: string | null,
    ctx?: { source: DatePickerChangeSource; event?: Event },
  ) => void;

  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  error?: boolean;
  clearable?: boolean;

  minDate?: string;
  maxDate?: string;
  shouldDisableDate?: (isoDate: string) => boolean;
  disablePast?: boolean;
  disableFuture?: boolean;
  disableWeekends?: boolean;

  locale?: string;
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  format?: (date: Temporal.PlainDate) => string;
  parse?: (text: string) => Temporal.PlainDate | null;
  calendar?: Temporal.CalendarLike;
  inputMask?: string;

  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  closeOnSelect?: boolean;
  openOnFocus?: boolean;

  renderInput?: (props: {
    valueText: string;
    inputProps: JSX.InputHTMLAttributes<HTMLInputElement>;
  }) => JSX.Element;
  renderDay?: (props: {
    iso: string;
    date: Temporal.PlainDate;
    selected: boolean;
    today: boolean;
    disabled: boolean;
    outsideMonth: boolean;
  }) => JSX.Element;

  autoComplete?: string;
  onFocus?: JSX.EventHandlerUnion<HTMLInputElement, FocusEvent>;
  onBlur?: JSX.EventHandlerUnion<HTMLInputElement, FocusEvent>;
  onInput?: JSX.EventHandlerUnion<HTMLInputElement, InputEvent>;
  onKeyDown?: JSX.EventHandlerUnion<HTMLInputElement, KeyboardEvent>;
};

type DayCell = {
  date: Temporal.PlainDate;
  iso: string;
  outsideMonth: boolean;
};

const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ');

const pad2 = (value: number) => value.toString().padStart(2, '0');

const isToken = (ch: string) => ch === 'Y' || ch === 'M' || ch === 'D';

const dayOfWeekToSundayIndex = (dayOfWeek: number) => dayOfWeek % 7;

const resolveWeekStartsOnFromLocale = (locale: string): 0 | 1 | 2 | 3 | 4 | 5 | 6 => {
  try {
    const l = new Intl.Locale(locale) as Intl.Locale & {
      weekInfo?: { firstDay?: number };
    };
    const firstDay = l.weekInfo?.firstDay;
    if (typeof firstDay === 'number') {
      return (firstDay % 7) as 0 | 1 | 2 | 3 | 4 | 5 | 6;
    }
  } catch {
    // Ignore locale weekInfo lookup failures.
  }
  return 0;
};

const toIsoDateString = (date: Temporal.PlainDate) =>
  date.withCalendar('iso8601').toString();

const comparePlainDate = (a: Temporal.PlainDate, b: Temporal.PlainDate) =>
  Temporal.PlainDate.compare(a.withCalendar('iso8601'), b.withCalendar('iso8601'));

const startOfMonth = (date: Temporal.PlainDate) => date.with({ day: 1 });

const shiftMonthClampDay = (date: Temporal.PlainDate, months: number) => {
  const shiftedStart = startOfMonth(date).add({ months });
  const nextDay = Math.min(date.day, shiftedStart.daysInMonth);
  return shiftedStart.with({ day: nextDay });
};

const buildCalendarGrid = (
  monthStart: Temporal.PlainDate,
  weekStartsOn: number,
): DayCell[] => {
  const firstIndex = dayOfWeekToSundayIndex(monthStart.dayOfWeek);
  const offset = (firstIndex - weekStartsOn + 7) % 7;
  const gridStart = monthStart.subtract({ days: offset });

  return Array.from({ length: 42 }, (_, index) => {
    const date = gridStart.add({ days: index });
    return {
      date,
      iso: toIsoDateString(date),
      outsideMonth:
        date.month !== monthStart.month || date.year !== monthStart.year,
    };
  });
};

const parseIsoStrict = (
  text: string,
  calendar: Temporal.CalendarLike,
): Temporal.PlainDate | null => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text.trim());
  if (!m) return null;

  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);

  try {
    return Temporal.PlainDate.from({ year, month, day, calendar });
  } catch {
    return null;
  }
};

const parseMMDDYYYY = (
  text: string,
  calendar: Temporal.CalendarLike,
): Temporal.PlainDate | null => {
  const m = /^(\d{2})[-/](\d{2})[-/](\d{4})$/.exec(text.trim());
  if (!m) return null;

  const month = Number(m[1]);
  const day = Number(m[2]);
  const year = Number(m[3]);

  try {
    return Temporal.PlainDate.from({ year, month, day, calendar });
  } catch {
    return null;
  }
};

const parseByMask = (
  text: string,
  mask: string,
  calendar: Temporal.CalendarLike,
): Temporal.PlainDate | null => {
  const digits = text.replace(/\D/g, '');
  const groups: Array<{ token: 'Y' | 'M' | 'D'; len: number }> = [];

  for (let i = 0; i < mask.length; i += 1) {
    const ch = mask[i] as 'Y' | 'M' | 'D';
    if (!isToken(ch)) continue;

    if (groups.length > 0 && groups[groups.length - 1].token === ch) {
      groups[groups.length - 1].len += 1;
    } else {
      groups.push({ token: ch, len: 1 });
    }
  }

  const total = groups.reduce((sum, group) => sum + group.len, 0);
  if (total === 0 || digits.length !== total) return null;

  let cursor = 0;
  let year: number | null = null;
  let month: number | null = null;
  let day: number | null = null;

  for (const group of groups) {
    const value = Number(digits.slice(cursor, cursor + group.len));
    cursor += group.len;

    if (group.token === 'Y') year = value;
    if (group.token === 'M') month = value;
    if (group.token === 'D') day = value;
  }

  if (year === null || month === null || day === null) return null;

  try {
    return Temporal.PlainDate.from({ year, month, day, calendar });
  } catch {
    return null;
  }
};

const applyMask = (rawText: string, mask: string) => {
  const digits = rawText.replace(/\D/g, '');
  let digitIndex = 0;
  let out = '';

  for (let i = 0; i < mask.length; i += 1) {
    const ch = mask[i];
    if (isToken(ch)) {
      if (digitIndex >= digits.length) break;
      out += digits[digitIndex];
      digitIndex += 1;
    } else if (digitIndex > 0) {
      out += ch;
    }
  }

  return out;
};

const countMaskTokens = (mask: string) => (mask.match(/[YMD]/g)?.length ?? 0);
const countDigitsBefore = (text: string, index: number) =>
  text.slice(0, Math.max(0, index)).replace(/\D/g, '').length;
const removeDigitAt = (digits: string, index: number) => {
  if (index < 0 || index >= digits.length) return digits;
  return digits.slice(0, index) + digits.slice(index + 1);
};
const caretIndexForDigitCount = (masked: string, digitCount: number) => {
  if (digitCount <= 0) return 0;

  let seen = 0;
  for (let i = 0; i < masked.length; i += 1) {
    if (/\d/.test(masked[i])) {
      seen += 1;
      if (seen === digitCount) return i + 1;
    }
  }

  return masked.length;
};

const formatWithMask = (date: Temporal.PlainDate, mask: string) => {
  const year = date.year.toString().padStart(4, '0');
  const month = pad2(date.month);
  const day = pad2(date.day);

  let yIndex = 0;
  let mIndex = 0;
  let dIndex = 0;
  let out = '';

  for (let i = 0; i < mask.length; i += 1) {
    const ch = mask[i];
    if (ch === 'Y') {
      out += year[Math.min(yIndex, year.length - 1)] ?? '';
      yIndex += 1;
    } else if (ch === 'M') {
      out += month[Math.min(mIndex, month.length - 1)] ?? '';
      mIndex += 1;
    } else if (ch === 'D') {
      out += day[Math.min(dIndex, day.length - 1)] ?? '';
      dIndex += 1;
    } else {
      out += ch;
    }
  }

  return out;
};

const callHandler = <T, E extends Event>(
  handler: JSX.EventHandlerUnion<T, E> | undefined,
  event: E,
) => {
  if (!handler) return;
  const handlers = Array.isArray(handler) ? handler : [handler];
  handlers.forEach((item) => item && item(event));
};

const DatePicker = (props: DatePickerProps) => {
  const autoId = `dp-${Math.random().toString(36).slice(2, 10)}`;

  let rootEl: HTMLDivElement | undefined;
  let inputEl: HTMLInputElement | undefined;
  let popoverEl: HTMLDivElement | undefined;

  const locale = createMemo(() =>
    props.locale ??
    (typeof navigator !== 'undefined' ? navigator.language : 'en-US'),
  );

  const calendar = createMemo<Temporal.CalendarLike>(
    () => props.calendar ?? 'iso8601',
  );

  const weekStartsOn = createMemo(() => {
    if (typeof props.weekStartsOn === 'number') return props.weekStartsOn;
    return resolveWeekStartsOnFromLocale(locale());
  });

  const placeholder = createMemo(
    () => props.placeholder ?? props.inputMask ?? 'YYYY-MM-DD',
  );

  const closeOnSelect = createMemo(() => props.closeOnSelect ?? true);
  const openOnFocus = createMemo(() => props.openOnFocus ?? true);

  const isValueControlled = createMemo(() => props.value !== undefined);
  const [internalValue, setInternalValue] = createSignal<string | null>(
    props.defaultValue ?? null,
  );

  const committedValue = createMemo<string | null>(() =>
    isValueControlled() ? (props.value ?? null) : internalValue(),
  );

  const isOpenControlled = createMemo(() => props.open !== undefined);
  const [internalOpen, setInternalOpen] = createSignal(Boolean(props.defaultOpen));

  const open = createMemo(() =>
    isOpenControlled() ? Boolean(props.open) : internalOpen(),
  );

  const [popoverMounted, setPopoverMounted] = createSignal(open());
  const [popoverVisible, setPopoverVisible] = createSignal(open());
  let popoverMountTimer: number | undefined;

  const [popoverPos, setPopoverPos] = createSignal({ top: 0, left: 0, width: 0 });

  const [rawText, setRawText] = createSignal('');
  const [isEditing, setIsEditing] = createSignal(false);
  const [draftPinned, setDraftPinned] = createSignal(false);

  const todayDate = () => Temporal.Now.plainDateISO().withCalendar(calendar());

  const [viewMonth, setViewMonth] = createSignal(startOfMonth(todayDate()));
  const [activeDate, setActiveDate] = createSignal(todayDate());

  const parseText = (text: string, includeCustom: boolean) => {
    const trimmed = text.trim();
    if (!trimmed) return null;

    if (includeCustom && props.parse) {
      try {
        const parsed = props.parse(trimmed);
        if (parsed) return parsed;
      } catch {
        // Ignore custom parser exceptions.
      }
    }

    if (props.inputMask) {
      const masked = parseByMask(trimmed, props.inputMask, calendar());
      if (masked) return masked;
    }

    return parseIsoStrict(trimmed, calendar());
  };

  const parseIncoming = (value: string | null | undefined) => {
    if (!value) return null;
    return parseText(value, true) ?? parseMMDDYYYY(value, calendar());
  };

  const formatDisplay = (date: Temporal.PlainDate) => {
    if (props.format) return props.format(date);
    if (props.inputMask) return formatWithMask(date, props.inputMask);
    return toIsoDateString(date);
  };

  const setOpenState = (next: boolean) => {
    const prev = open();
    if (prev === next) return;

    if (!isOpenControlled()) {
      setInternalOpen(next);
    }

    props.onOpenChange?.(next);
  };

  const minDate = createMemo(() => parseIncoming(props.minDate));
  const maxDate = createMemo(() => parseIncoming(props.maxDate));

  const isDateDisabled = (date: Temporal.PlainDate) => {
    if (props.disabled || props.readOnly) return true;

    const min = minDate();
    if (min && comparePlainDate(date, min) < 0) return true;

    const max = maxDate();
    if (max && comparePlainDate(date, max) > 0) return true;

    const today = todayDate();
    if (props.disablePast && comparePlainDate(date, today) < 0) return true;
    if (props.disableFuture && comparePlainDate(date, today) > 0) return true;

    if (props.disableWeekends && (date.dayOfWeek === 6 || date.dayOfWeek === 7)) {
      return true;
    }

    if (props.shouldDisableDate) {
      try {
        return Boolean(props.shouldDisableDate(toIsoDateString(date)));
      } catch {
        return true;
      }
    }

    return false;
  };

  const committedDate = createMemo(() => parseIncoming(committedValue()));

  const selectedIso = createMemo(() => {
    const selected = committedDate();
    return selected ? toIsoDateString(selected) : null;
  });

  let lastCommittedSync: string | null | undefined;
  createEffect(() => {
    const committed = committedValue();
    if (committed === lastCommittedSync) return;

    lastCommittedSync = committed;

    const parsed = parseIncoming(committed);

    if (!isEditing()) {
      setDraftPinned(false);
      setRawText(parsed ? formatDisplay(parsed) : '');
    }

    if (!open()) {
      const base = parsed ?? todayDate();
      setViewMonth(startOfMonth(base));
      setActiveDate(base);
    }
  });

  const valueText = createMemo(() => {
    if (isEditing() || draftPinned()) return rawText();
    const selected = committedDate();
    return selected ? formatDisplay(selected) : '';
  });

  const canInteract = () => !props.disabled && !props.readOnly;

  const validationBuffer = createMemo(() =>
    (isEditing() || draftPinned() ? rawText() : '').trim(),
  );

  const internalValidationMessage = createMemo<string | null>(() => {
    if (!canInteract()) return null;

    const text = validationBuffer();
    if (!text) return null;

    if (props.inputMask) {
      const requiredDigits = countMaskTokens(props.inputMask);
      const typedDigits = text.replace(/\D/g, '').length;
      if (typedDigits < requiredDigits) return null;
    } else if (text.length < 6) {
      return null;
    }

    const parsed = parseText(text, true);
    if (!parsed) return "This isn't a valid date.";
    if (isDateDisabled(parsed)) return 'This date is not allowed.';
    return null;
  });

  const errorActive = createMemo(
    () => Boolean(props.error) || Boolean(internalValidationMessage()),
  );
  const helperContent = createMemo(() => internalValidationMessage() ?? props.helperText);

  const updatePopoverPos = () => {
    const anchor = rootEl;
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();

    setPopoverPos({
      top: rect.bottom + 8,
      left: rect.left,
      width: rect.width,
    });
  };

  createEffect(() => {
    if (open()) {
      if (popoverMountTimer !== undefined) {
        window.clearTimeout(popoverMountTimer);
        popoverMountTimer = undefined;
      }

      const base = committedDate() ?? todayDate();
      setViewMonth(startOfMonth(base));
      setActiveDate(base);

      setPopoverMounted(true);
      requestAnimationFrame(() => {
        updatePopoverPos();
        setPopoverVisible(true);
      });
      return;
    }

    setPopoverVisible(false);

    if (popoverMounted()) {
      popoverMountTimer = window.setTimeout(() => {
        setPopoverMounted(false);
        popoverMountTimer = undefined;
      }, 170);
    }
  });

  createEffect(() => {
    if (!open()) return;

    updatePopoverPos();

    const onReposition = () => updatePopoverPos();
    window.addEventListener('resize', onReposition);
    window.addEventListener('scroll', onReposition, true);

    onCleanup(() => {
      window.removeEventListener('resize', onReposition);
      window.removeEventListener('scroll', onReposition, true);
    });
  });

  createEffect(() => {
    if (!open()) return;

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;

      const inRoot = !!rootEl && rootEl.contains(target);
      const inPopover = !!popoverEl && popoverEl.contains(target);

      if (!inRoot && !inPopover) {
        setOpenState(false);
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);

    onCleanup(() => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
    });
  });

  onCleanup(() => {
    if (popoverMountTimer !== undefined) {
      window.clearTimeout(popoverMountTimer);
    }
  });

  const commitDate = (
    nextDate: Temporal.PlainDate | null,
    source: DatePickerChangeSource,
    event?: Event,
  ) => {
    if (nextDate && isDateDisabled(nextDate)) return false;

    const nextValue = nextDate ? toIsoDateString(nextDate) : null;
    const prevValue = committedValue();

    if (!isValueControlled()) {
      setInternalValue(nextValue);
    }

    if (prevValue !== nextValue) {
      props.onChange?.(nextValue, { source, event });
    }

    if (nextDate) {
      setViewMonth(startOfMonth(nextDate));
      setActiveDate(nextDate);
      setRawText(formatDisplay(nextDate));
    } else {
      setRawText('');
    }

    setDraftPinned(false);
    setIsEditing(false);

    return true;
  };

  const commitFromText = (event?: Event) => {
    if (!canInteract()) return false;

    const text = rawText().trim();

    if (!text) {
      return commitDate(null, 'typing', event);
    }

    const parsed = parseText(text, true);
    if (!parsed || isDateDisabled(parsed)) {
      setIsEditing(false);
      setDraftPinned(true);
      return false;
    }

    return commitDate(parsed, 'typing', event);
  };

  const commitFromCalendar = (nextDate: Temporal.PlainDate, event?: Event) => {
    if (!canInteract() || isDateDisabled(nextDate)) return;

    const didCommit = commitDate(nextDate, 'calendar', event);
    if (didCommit && closeOnSelect()) {
      setOpenState(false);
    }

    inputEl?.focus();
  };

  const openIfAllowed = () => {
    if (!canInteract()) return;
    setOpenState(true);
  };

  const setActiveAndKeepInView = (next: Temporal.PlainDate) => {
    setActiveDate(next);

    const month = viewMonth();
    if (next.year !== month.year || next.month !== month.month) {
      setViewMonth(startOfMonth(next));
    }
  };

  const moveActiveByDays = (days: number) => {
    const next = activeDate().add({ days });
    setActiveAndKeepInView(next);
  };

  const moveActiveByMonths = (months: number) => {
    const next = shiftMonthClampDay(activeDate(), months);
    setActiveDate(next);
    setViewMonth(startOfMonth(next));
  };

  const moveActiveToWeekEdge = (toEnd: boolean) => {
    const current = activeDate();
    const currentIndex = dayOfWeekToSundayIndex(current.dayOfWeek);
    const offsetFromWeekStart =
      (currentIndex - weekStartsOn() + 7) % 7;

    const delta = toEnd ? 6 - offsetFromWeekStart : -offsetFromWeekStart;
    moveActiveByDays(delta);
  };

  const handleInput = (event: InputEvent & { currentTarget: HTMLInputElement }) => {
    let nextText = event.currentTarget.value;

    if (props.inputMask) {
      nextText = applyMask(nextText, props.inputMask);
      event.currentTarget.value = nextText;
    }

    setRawText(nextText);
    setIsEditing(true);
    setDraftPinned(false);

    callHandler(props.onInput, event);
  };

  const handleInputFocus: JSX.EventHandlerUnion<HTMLInputElement, FocusEvent> = (
    event,
  ) => {
    if (!isEditing()) {
      setRawText(valueText());
    }
    setIsEditing(true);

    if (openOnFocus()) {
      openIfAllowed();
    }

    callHandler(props.onFocus, event);
  };

  const handleInputBlur: JSX.EventHandlerUnion<HTMLInputElement, FocusEvent> = (
    event,
  ) => {
    commitFromText(event);
    callHandler(props.onBlur, event);
  };

  const handleInputKeyDown: JSX.EventHandlerUnion<HTMLInputElement, KeyboardEvent> = (
    event,
  ) => {
    callHandler(props.onKeyDown, event);
    if (event.defaultPrevented) return;

    const key = event.key;

    if (
      canInteract() &&
      props.inputMask &&
      (key === 'Backspace' || key === 'Delete')
    ) {
      const node = event.currentTarget;
      const start = node.selectionStart ?? 0;
      const end = node.selectionEnd ?? start;

      if (start === end) {
        const text = node.value;
        const digits = text.replace(/\D/g, '');

        if (key === 'Backspace' && start > 0 && /\D/.test(text[start - 1] ?? '')) {
          const removeIndex = countDigitsBefore(text, start) - 1;
          if (removeIndex >= 0) {
            event.preventDefault();
            const nextDigits = removeDigitAt(digits, removeIndex);
            const nextMasked = applyMask(nextDigits, props.inputMask);
            const nextCaret = caretIndexForDigitCount(nextMasked, removeIndex);

            setRawText(nextMasked);
            setIsEditing(true);
            setDraftPinned(false);
            node.value = nextMasked;

            queueMicrotask(() => {
              node.setSelectionRange(nextCaret, nextCaret);
            });
          }
          return;
        }

        if (key === 'Delete' && start < text.length && /\D/.test(text[start] ?? '')) {
          const removeIndex = countDigitsBefore(text, start);
          if (removeIndex >= 0) {
            event.preventDefault();
            const nextDigits = removeDigitAt(digits, removeIndex);
            const nextMasked = applyMask(nextDigits, props.inputMask);
            const nextCaret = caretIndexForDigitCount(nextMasked, removeIndex);

            setRawText(nextMasked);
            setIsEditing(true);
            setDraftPinned(false);
            node.value = nextMasked;

            queueMicrotask(() => {
              node.setSelectionRange(nextCaret, nextCaret);
            });
          }
          return;
        }
      }
    }

    if (key === 'Tab') {
      if (open()) setOpenState(false);
      return;
    }

    if (key === 'Escape') {
      if (open()) {
        event.preventDefault();
        setOpenState(false);
      }
      return;
    }

    if (key === 'Enter') {
      event.preventDefault();
      if (open()) {
        const next = activeDate();
        if (!isDateDisabled(next)) {
          commitFromCalendar(next, event);
        }
        return;
      }

      commitFromText(event);
      return;
    }

    if (!open()) return;

    if (key === 'ArrowLeft') {
      event.preventDefault();
      moveActiveByDays(-1);
      return;
    }

    if (key === 'ArrowRight') {
      event.preventDefault();
      moveActiveByDays(1);
      return;
    }

    if (key === 'ArrowUp') {
      event.preventDefault();
      moveActiveByDays(-7);
      return;
    }

    if (key === 'ArrowDown') {
      event.preventDefault();
      moveActiveByDays(7);
      return;
    }

    if (key === 'PageUp') {
      event.preventDefault();
      moveActiveByMonths(-1);
      return;
    }

    if (key === 'PageDown') {
      event.preventDefault();
      moveActiveByMonths(1);
      return;
    }

    if (key === 'Home') {
      event.preventDefault();
      moveActiveToWeekEdge(false);
      return;
    }

    if (key === 'End') {
      event.preventDefault();
      moveActiveToWeekEdge(true);
    }
  };

  const calendarCells = createMemo(() =>
    buildCalendarGrid(viewMonth(), weekStartsOn()),
  );

  const dayLabels = createMemo(() => {
    const anchorSunday = todayDate().subtract({
      days: dayOfWeekToSundayIndex(todayDate().dayOfWeek),
    });

    return Array.from({ length: 7 }, (_, i) => {
      const offset = (weekStartsOn() + i) % 7;
      const day = anchorSunday.add({ days: offset });
      return day.toLocaleString(locale(), { weekday: 'short' });
    });
  });

  const inputId = () => props.id ?? autoId;
  const helperId = () => `${inputId()}-helper`;
  const dialogId = () => `${inputId()}-dialog`;

  const activeCellId = createMemo(() => {
    if (!open()) return undefined;
    return `${inputId()}-day-${toIsoDateString(activeDate())}`;
  });

  const helperActive = createMemo(() => Boolean(helperContent()));

  const showClear = createMemo(
    () =>
      Boolean(props.clearable) &&
      Boolean(committedValue()) &&
      !props.disabled &&
      !props.readOnly,
  );

  const monthLabel = createMemo(() =>
    viewMonth().toLocaleString(locale(), {
      month: 'long',
      year: 'numeric',
    }),
  );

  const selectTodayAction = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const today = todayDate();

    if (isDateDisabled(today)) {
      setViewMonth(startOfMonth(today));
      setActiveDate(today);
      inputEl?.focus();
      return;
    }

    commitFromCalendar(today, event);
  };

  const inputProps: JSX.InputHTMLAttributes<HTMLInputElement> = {
    id: inputId(),
    role: 'combobox',
    'aria-haspopup': 'dialog',
    'aria-expanded': open() ? 'true' : 'false',
    'aria-controls': dialogId(),
    'aria-activedescendant': activeCellId(),
    'aria-describedby': helperActive() ? helperId() : undefined,
    'aria-invalid': errorActive() ? 'true' : undefined,
    disabled: props.disabled,
    readOnly: props.readOnly,
    required: props.required,
    placeholder: placeholder(),
    autoComplete: props.autoComplete ?? 'off',
    value: valueText(),
    onInput: handleInput,
    onFocus: handleInputFocus,
    onBlur: handleInputBlur,
    onKeyDown: handleInputKeyDown,
    ref: (el: HTMLInputElement) => {
      inputEl = el;
    },
  };

  return (
    <div
      ref={rootEl}
      class={cx('relative flex flex-col gap-1.5', props.class)}
    >
      <Show when={props.name}>
        <input
          type="hidden"
          name={props.name}
          value={committedValue() ?? ''}
          disabled={props.disabled}
        />
      </Show>

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

      <Show
        when={props.renderInput}
        fallback={
          <div
            class={cx(
              'relative flex w-full items-center gap-1 rounded-xl border bg-white/90 px-3 py-2.5 shadow-sm transition dark:bg-slate-900/60',
              errorActive()
                ? 'border-rose-500/80 focus-within:border-rose-500'
                : 'border-slate-300/80 focus-within:border-emerald-400 dark:border-slate-700 dark:focus-within:border-emerald-400',
              props.disabled
                ? 'cursor-not-allowed opacity-60'
                : props.readOnly
                  ? 'cursor-default'
                  : 'cursor-text',
              props.inputClass,
            )}
            onClick={(event) => {
              const target = event.target as HTMLElement | null;
              if (target?.closest('[data-dp-icon-btn]')) return;

              if (!canInteract()) return;

              inputEl?.focus();
              openIfAllowed();
            }}
          >
            <input
              {...inputProps}
              class={cx(
                'min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400/90 dark:text-slate-100 dark:placeholder:text-slate-500',
                props.disabled
                  ? 'cursor-not-allowed'
                  : props.readOnly
                    ? 'cursor-default'
                    : 'cursor-text',
              )}
            />

            <Show when={showClear()}>
              <button
                type="button"
                data-dp-icon-btn
                class="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-200 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                aria-label="Clear date"
                onMouseDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                }}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  if (!canInteract()) return;
                  commitDate(null, 'clear', event);
                  inputEl?.focus();
                }}
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
                    d="M4.22 4.22a.75.75 0 011.06 0L10 8.94l4.72-4.72a.75.75 0 111.06 1.06L11.06 10l4.72 4.72a.75.75 0 11-1.06 1.06L10 11.06l-4.72 4.72a.75.75 0 11-1.06-1.06L8.94 10 4.22 5.28a.75.75 0 010-1.06z"
                    clip-rule="evenodd"
                  />
                </svg>
              </button>
            </Show>

            <button
              type="button"
              data-dp-icon-btn
              class="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-200 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
              aria-label={open() ? 'Close calendar' : 'Open calendar'}
              onMouseDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                if (!canInteract()) return;
                setOpenState(!open());
                inputEl?.focus();
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                class="h-4 w-4"
                aria-hidden="true"
              >
                <path d="M6 2.75A.75.75 0 016.75 2h.5a.75.75 0 010 1.5h-.5A.75.75 0 016 2.75zM12.75 2a.75.75 0 000 1.5h.5a.75.75 0 000-1.5h-.5z" />
                <path
                  fill-rule="evenodd"
                  d="M4.25 4A2.25 2.25 0 002 6.25v8.5A2.25 2.25 0 004.25 17h11.5A2.25 2.25 0 0018 14.75v-8.5A2.25 2.25 0 0015.75 4H4.25zM3.5 8.5v6.25c0 .414.336.75.75.75h11.5a.75.75 0 00.75-.75V8.5h-13z"
                  clip-rule="evenodd"
                />
              </svg>
            </button>
          </div>
        }
      >
        {props.renderInput?.({ valueText: valueText(), inputProps })}
      </Show>

      <Show when={helperActive()}>
        <div
          id={helperId()}
          class={cx(
            'text-xs',
            errorActive()
              ? 'text-rose-600 dark:text-rose-300'
              : 'text-slate-500 dark:text-slate-400',
          )}
        >
          {helperContent()}
        </div>
      </Show>

      <Show when={popoverMounted()}>
        <Portal>
          <div
            ref={popoverEl}
            id={dialogId()}
            role="dialog"
            aria-label="Choose date"
            style={{
              position: 'fixed',
              top: `${popoverPos().top}px`,
              left: `${popoverPos().left}px`,
              width: `${popoverPos().width}px`,
            }}
            class={cx(
              'z-[9999] origin-top rounded-xl border border-slate-200/80 bg-white/95 shadow-xl shadow-slate-200/60 backdrop-blur-sm transition duration-150 ease-out dark:border-slate-700 dark:bg-slate-900/95 dark:shadow-slate-900/60',
              popoverVisible()
                ? 'pointer-events-auto scale-100 opacity-100'
                : 'pointer-events-none scale-[0.98] opacity-0',
              props.popoverClass,
            )}
            onMouseDown={(event) => {
              event.preventDefault();
            }}
          >
            <div class="flex items-center justify-between border-b border-slate-200/80 px-3 py-2 dark:border-slate-700">
              <button
                type="button"
                class="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-600 transition hover:bg-slate-200 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100"
                aria-label="Previous month"
                disabled={!canInteract()}
                onClick={(event) => {
                  event.preventDefault();
                  if (!canInteract()) return;
                  const next = shiftMonthClampDay(activeDate(), -1);
                  setActiveDate(next);
                  setViewMonth(startOfMonth(next));
                  inputEl?.focus();
                }}
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
                    d="M11.78 4.22a.75.75 0 010 1.06L7.06 10l4.72 4.72a.75.75 0 11-1.06 1.06l-5.25-5.25a.75.75 0 010-1.06l5.25-5.25a.75.75 0 011.06 0z"
                    clip-rule="evenodd"
                  />
                </svg>
              </button>

              <div class="text-sm font-semibold text-slate-800 dark:text-slate-100">
                {monthLabel()}
              </div>

              <button
                type="button"
                class="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-600 transition hover:bg-slate-200 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100"
                aria-label="Next month"
                disabled={!canInteract()}
                onClick={(event) => {
                  event.preventDefault();
                  if (!canInteract()) return;
                  const next = shiftMonthClampDay(activeDate(), 1);
                  setActiveDate(next);
                  setViewMonth(startOfMonth(next));
                  inputEl?.focus();
                }}
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
                    d="M8.22 15.78a.75.75 0 010-1.06L12.94 10 8.22 5.28a.75.75 0 111.06-1.06l5.25 5.25a.75.75 0 010 1.06l-5.25 5.25a.75.75 0 01-1.06 0z"
                    clip-rule="evenodd"
                  />
                </svg>
              </button>
            </div>

            <div class="px-3 pb-3 pt-2">
              <div class="grid grid-cols-7 gap-1 pb-1">
                <For each={dayLabels()}>
                  {(label) => (
                    <div class="py-1 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {label}
                    </div>
                  )}
                </For>
              </div>

              <div role="grid" class="grid grid-cols-7 gap-1">
                <For each={calendarCells()}>
                  {(cell) => {
                    const iso = cell.iso;
                    const selected = () => selectedIso() === iso;
                    const today = () =>
                      toIsoDateString(todayDate()) === iso;
                    const active = () =>
                      toIsoDateString(activeDate()) === iso;
                    const disabled = () => isDateDisabled(cell.date);

                    return (
                      <button
                        id={`${inputId()}-day-${iso}`}
                        type="button"
                        role="gridcell"
                        aria-selected={selected() ? 'true' : 'false'}
                        aria-disabled={disabled() ? 'true' : undefined}
                        disabled={disabled()}
                        class={cx(
                          'relative inline-flex h-9 w-full items-center justify-center rounded-lg text-sm transition focus-visible:outline-none',
                          cell.outsideMonth
                            ? 'text-slate-400 dark:text-slate-500'
                            : 'text-slate-700 dark:text-slate-200',
                          disabled()
                            ? 'cursor-not-allowed opacity-45'
                            : 'cursor-pointer hover:bg-emerald-500/10 hover:text-emerald-700 dark:hover:text-emerald-300',
                          selected()
                            ? 'bg-emerald-500 text-white hover:bg-emerald-500 dark:bg-emerald-400 dark:text-slate-950 dark:hover:bg-emerald-400'
                            : '',
                          active() && !selected()
                            ? 'ring-2 ring-emerald-400/70 ring-offset-1 ring-offset-white dark:ring-emerald-400 dark:ring-offset-slate-900'
                            : '',
                        )}
                        onMouseEnter={() => {
                          setActiveDate(cell.date);
                        }}
                        onClick={(event) => {
                          event.preventDefault();
                          if (disabled()) return;
                          commitFromCalendar(cell.date, event);
                        }}
                      >
                        <Show
                          when={props.renderDay}
                          fallback={<span>{cell.date.day}</span>}
                        >
                          {props.renderDay?.({
                            iso,
                            date: cell.date,
                            selected: selected(),
                            today: today(),
                            disabled: disabled(),
                            outsideMonth: cell.outsideMonth,
                          })}
                        </Show>

                        <Show when={today() && !selected()}>
                          <span class="pointer-events-none absolute bottom-1 h-1 w-1 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                        </Show>
                      </button>
                    );
                  }}
                </For>
              </div>
            </div>

            <div class="flex items-center justify-between border-t border-slate-200/80 px-3 py-2 dark:border-slate-700">
              <button
                type="button"
                class="inline-flex items-center rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-200 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100"
                onClick={selectTodayAction}
                disabled={!canInteract()}
              >
                Today
              </button>

              <div class="text-[11px] text-slate-500 dark:text-slate-400">
                {toIsoDateString(activeDate())}
              </div>
            </div>
          </div>
        </Portal>
      </Show>
    </div>
  );
};

export default DatePicker;
