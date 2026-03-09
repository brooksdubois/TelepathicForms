import { For, createEffect, createSignal, onCleanup } from 'solid-js';
import type { Component } from 'solid-js';

import { cx } from '../utils/cx';
import { navigateTo, path } from '../router';

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
  { href: '/slider', label: 'Slider Lab' },
  { href: '/date-range', label: 'Date Range Lab' },
  { href: '/time', label: 'TimePicker Lab' },
];

const normalizePath = (p: string) => p.replace(/\/+$/, '') || '/';

const PlaygroundNav: Component<{ currentPath?: string; class?: string }> = (props) => {
  const activePath = () => normalizePath(props.currentPath ?? path());
  const isDesignerActive = () => activePath() === '/designer';
  const [isOpen, setIsOpen] = createSignal(false);
  const [closeTimer, setCloseTimer] = createSignal<number | undefined>(undefined);
  let menuRootRef: HTMLDivElement | undefined;

  const clearCloseTimer = () => {
    const timer = closeTimer();
    if (timer !== undefined) {
      window.clearTimeout(timer);
      setCloseTimer(undefined);
    }
  };

  const scheduleClose = () => {
    clearCloseTimer();
    setCloseTimer(window.setTimeout(() => setIsOpen(false), 120));
  };

  createEffect(() => {
    if (!isOpen()) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target || menuRootRef?.contains(target)) return;
      setIsOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    onCleanup(() => {
      document.removeEventListener('mousedown', handlePointerDown);
    });
  });

  onCleanup(() => clearCloseTimer());

  const closeMenu = () => {
    clearCloseTimer();
    setIsOpen(false);
  };

  const handleNavigate = (href: string) => {
    closeMenu();
    navigateTo(href);
  };

  return (
    <div
      ref={menuRootRef}
      class={cx('relative flex items-center gap-3', props.class)}
      onMouseEnter={() => clearCloseTimer()}
      onMouseLeave={() => scheduleClose()}
    >
      <div class="relative">
        <div
          class={cx(
            'inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold tracking-[0.18em]',
            'border border-slate-200/80 bg-white/85 text-slate-700 shadow-sm backdrop-blur-sm transition-all duration-200',
            'hover:border-emerald-300 hover:text-emerald-700 focus-within:border-emerald-300 focus-within:text-emerald-700',
            'dark:border-slate-700 dark:bg-slate-900/65 dark:text-slate-100 dark:hover:border-emerald-400/50 dark:hover:text-emerald-300 dark:focus-within:border-emerald-400/50 dark:focus-within:text-emerald-300',
            isOpen() ? 'border-emerald-300 text-emerald-700 dark:border-emerald-400/50 dark:text-emerald-300' : '',
          )}
        >
          <button
            type="button"
            class="inline-flex items-center gap-2 focus:outline-none"
            aria-expanded={isOpen() ? 'true' : 'false'}
            aria-haspopup="menu"
            onClick={() => {
              clearCloseTimer();
              setIsOpen((open) => !open);
            }}
            onFocus={() => {
              clearCloseTimer();
              setIsOpen(true);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.preventDefault();
                closeMenu();
              }
              if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                clearCloseTimer();
                setIsOpen(true);
              }
            }}
          >
            <span>PLAYGROUNDS</span>
            <svg
              class={cx('h-3.5 w-3.5 transition-transform duration-200', isOpen() ? 'rotate-180' : '')}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        <div
          class={cx(
            'absolute right-0 top-full z-[81] mt-1 w-64 origin-top-right rounded-2xl border border-slate-200/80 bg-white/95 p-2 shadow-xl shadow-slate-200/60 backdrop-blur-md transition-all duration-150',
            'dark:border-slate-700 dark:bg-slate-950/92 dark:shadow-slate-950/60',
            isOpen()
              ? 'pointer-events-auto translate-y-0 opacity-100'
              : 'pointer-events-none -translate-y-1 opacity-0',
          )}
          role="menu"
          onMouseEnter={() => clearCloseTimer()}
          onMouseLeave={() => scheduleClose()}
        >
          <div class="mb-1 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
            Playground Labs
          </div>
          <div class="flex max-h-[26rem] flex-col gap-1 overflow-y-auto pr-1">
            <For each={labs}>
              {(item) => {
                const isActive = () => normalizePath(item.href) === activePath();

                return isActive() ? (
                  <span
                    aria-current="page"
                    class={cx(
                      'block rounded-xl px-3 py-2 text-sm font-medium',
                      'bg-emerald-500/10 text-emerald-700 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.22)]',
                      'dark:bg-emerald-400/10 dark:text-emerald-300 dark:shadow-[inset_0_0_0_1px_rgba(52,211,153,0.22)]',
                    )}
                  >
                    {item.label}
                  </span>
                ) : (
                  <button
                    type="button"
                    role="menuitem"
                    class={cx(
                      'block w-full rounded-xl px-3 py-2 text-left text-sm text-slate-700 transition-all duration-150',
                      'hover:bg-emerald-50 hover:text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50',
                      'dark:text-slate-200 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-300',
                    )}
                    onClick={() => handleNavigate(item.href)}
                  >
                    {item.label}
                  </button>
                );
              }}
            </For>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          closeMenu();
          navigateTo('/designer');
        }}
        class={cx(
          'flex-shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold tracking-[0.12em]',
          'transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2',
          'dark:focus:ring-offset-slate-950',
          isDesignerActive()
            ? 'bg-sky-700 text-white shadow-[0_0_0_1px_rgba(125,211,252,0.35),0_8px_20px_rgba(2,132,199,0.4)]'
            : 'bg-gradient-to-r from-sky-500 via-cyan-500 to-blue-600 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.25)_inset,0_8px_20px_rgba(14,116,144,0.35)] hover:brightness-110'
        )}
        aria-label="Open designer tool"
      >
        DESIGNER
      </button>
    </div>
  );
};

export default PlaygroundNav;
