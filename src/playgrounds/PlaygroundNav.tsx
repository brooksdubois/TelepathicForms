import { For } from 'solid-js';
import type { Component } from 'solid-js';

import { cx } from '../utils/cx';

const labs = [
  { href: '/form-demo', label: 'Form Demo' },
  { href: '/text-field', label: 'TextField Lab' },
  { href: '/select', label: 'Select Lab' },
  { href: '/multi-select', label: 'MultiSelect Lab' },
  { href: '/checkbox', label: 'Checkbox Lab' },
  { href: '/radio-group', label: 'RadioGroup Lab' },
  { href: '/switch', label: 'Switch Lab' },
  { href: '/textarea', label: 'TextArea Lab' },
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

export default PlaygroundNav;
