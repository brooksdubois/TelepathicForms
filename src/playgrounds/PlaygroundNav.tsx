import { For, createEffect, createSignal, onCleanup } from "solid-js";
import type { Component } from "solid-js";

import { navigateTo, path } from "../router";
import { playgroundRoutes, routePathByComponent } from "../routes";
import { setTheme, theme, themeOptions, type AccentTheme } from "../theme/theme";
import { cx } from "../utils/cx";

type OpenMenu = "playgrounds" | "theme" | null;

const normalizePath = (p: string) => p.replace(/\/+$/, "") || "/";

const PlaygroundNav: Component<{ currentPath?: string; class?: string }> = (props) => {
  const activePath = () => normalizePath(props.currentPath ?? path());
  const isDesignerActive = () => activePath() === routePathByComponent.designer;
  const [openMenu, setOpenMenu] = createSignal<OpenMenu>(null);
  const [closeTimer, setCloseTimer] = createSignal<number | undefined>(undefined);
  let menuRootRef: HTMLDivElement | undefined;

  const isPlaygroundsOpen = () => openMenu() === "playgrounds";
  const isThemeOpen = () => openMenu() === "theme";

  const clearCloseTimer = () => {
    const timer = closeTimer();
    if (timer !== undefined) {
      window.clearTimeout(timer);
      setCloseTimer(undefined);
    }
  };

  const scheduleClose = () => {
    clearCloseTimer();
    setCloseTimer(window.setTimeout(() => setOpenMenu(null), 120));
  };

  createEffect(() => {
    if (!openMenu()) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target || menuRootRef?.contains(target)) return;
      setOpenMenu(null);
    };

    document.addEventListener("mousedown", handlePointerDown);
    onCleanup(() => {
      document.removeEventListener("mousedown", handlePointerDown);
    });
  });

  onCleanup(() => clearCloseTimer());

  const closeMenu = () => {
    clearCloseTimer();
    setOpenMenu(null);
  };

  const handleNavigate = (href: string) => {
    closeMenu();
    navigateTo(href);
  };

  const handleThemeChange = (next: AccentTheme) => {
    setTheme(next);
    closeMenu();
  };

  const openSpecificMenu = (menu: Exclude<OpenMenu, null>) => {
    clearCloseTimer();
    setOpenMenu(menu);
  };

  const ignoreTriggerClick = (event: MouseEvent) => {
    event.preventDefault();
  };

  const triggerClass = (active: boolean) =>
    cx(
      "inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold tracking-[0.18em]",
      "border border-slate-200/80 bg-white/85 text-slate-700 shadow-sm backdrop-blur-sm transition-all duration-200",
      "hover:border-emerald-300 hover:text-emerald-700 focus-within:border-emerald-300 focus-within:text-emerald-700",
      "dark:border-slate-700 dark:bg-slate-900/65 dark:text-slate-100 dark:hover:border-emerald-400/50 dark:hover:text-emerald-300 dark:focus-within:border-emerald-400/50 dark:focus-within:text-emerald-300",
      active ? "border-emerald-300 text-emerald-700 dark:border-emerald-400/50 dark:text-emerald-300" : "",
    );

  return (
    <div
      ref={menuRootRef}
      class={cx("relative flex items-center gap-3", props.class)}
      onMouseEnter={() => clearCloseTimer()}
      onMouseLeave={() => scheduleClose()}
    >
      <div class="relative">
        <div
          class={triggerClass(isPlaygroundsOpen())}
          onMouseEnter={() => openSpecificMenu("playgrounds")}
        >
          <button
            type="button"
            class="inline-flex items-center gap-2 focus:outline-none"
            aria-expanded={isPlaygroundsOpen() ? "true" : "false"}
            aria-haspopup="menu"
            onMouseDown={ignoreTriggerClick}
            onClick={ignoreTriggerClick}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.preventDefault();
                closeMenu();
              }
              if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openSpecificMenu("playgrounds");
              }
            }}
          >
            <span>PLAYGROUNDS</span>
            <svg
              class={cx("h-3.5 w-3.5 transition-transform duration-200", isPlaygroundsOpen() ? "rotate-180" : "")}
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
            "absolute right-0 top-full z-[81] mt-1 w-64 origin-top-right rounded-2xl border border-slate-200/80 bg-white/95 p-2 shadow-xl shadow-slate-200/60 backdrop-blur-md transition-all duration-150",
            "dark:border-slate-700 dark:bg-slate-950/92 dark:shadow-slate-950/60",
            isPlaygroundsOpen()
              ? "pointer-events-auto translate-y-0 opacity-100"
              : "pointer-events-none -translate-y-1 opacity-0",
          )}
          role="menu"
          onMouseEnter={() => clearCloseTimer()}
          onMouseLeave={() => scheduleClose()}
        >
          <div class="mb-1 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
            Playground Labs
          </div>
          <div class="flex max-h-[26rem] flex-col gap-1 overflow-y-auto pr-1">
            <For each={playgroundRoutes}>
              {(item) => {
                const isActive = () => normalizePath(item.path) === activePath();

                return (
                  <button
                    type="button"
                    role="menuitem"
                    aria-current={isActive() ? "page" : undefined}
                    disabled={isActive()}
                    class={cx(
                      "block w-full rounded-xl px-3 py-2 text-left text-sm transition-all duration-150",
                      isActive()
                        ? "cursor-default bg-emerald-500/10 font-medium text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"
                        : "text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 dark:text-slate-200 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-300",
                    )}
                    onClick={() => {
                      if (!isActive()) handleNavigate(item.path);
                    }}
                  >
                    {item.label}
                  </button>
                );
              }}
            </For>
          </div>
        </div>
      </div>

      <div class="relative">
        <div
          class={triggerClass(isThemeOpen())}
          onMouseEnter={() => openSpecificMenu("theme")}
        >
          <button
            type="button"
            class="inline-flex items-center gap-2 focus:outline-none"
            aria-expanded={isThemeOpen() ? "true" : "false"}
            aria-haspopup="menu"
            onMouseDown={ignoreTriggerClick}
            onClick={ignoreTriggerClick}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.preventDefault();
                closeMenu();
              }
              if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openSpecificMenu("theme");
              }
            }}
          >
            <span>THEME</span>
            <svg
              class={cx("h-3.5 w-3.5 transition-transform duration-200", isThemeOpen() ? "rotate-180" : "")}
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
            "absolute right-0 top-full z-[81] mt-1 w-52 origin-top-right rounded-2xl border border-slate-200/80 bg-white/95 p-2 shadow-xl shadow-slate-200/60 backdrop-blur-md transition-all duration-150",
            "dark:border-slate-700 dark:bg-slate-950/92 dark:shadow-slate-950/60",
            isThemeOpen()
              ? "pointer-events-auto translate-y-0 opacity-100"
              : "pointer-events-none -translate-y-1 opacity-0",
          )}
          role="menu"
          onMouseEnter={() => clearCloseTimer()}
          onMouseLeave={() => scheduleClose()}
        >
          <div class="mb-1 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
            Accent Theme
          </div>
          <div class="flex flex-col gap-1">
            <For each={themeOptions}>
              {(option) => {
                const isActive = () => option.value === theme();

                return (
                  <button
                    type="button"
                    role="menuitemradio"
                    aria-checked={isActive() ? "true" : "false"}
                    class={cx(
                      "block w-full rounded-xl px-3 py-2 text-left text-sm transition-all duration-150",
                      isActive()
                        ? "bg-emerald-500/10 font-medium text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"
                        : "text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 dark:text-slate-200 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-300",
                    )}
                    onClick={() => handleThemeChange(option.value)}
                  >
                    {option.label}
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
          navigateTo(routePathByComponent.designer);
        }}
        class={cx(
          "hidden flex-shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold tracking-[0.12em] lg:inline-flex",
          "transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2",
          "dark:focus:ring-offset-slate-950",
          isDesignerActive()
            ? "bg-sky-700 text-white shadow-[0_0_0_1px_rgba(125,211,252,0.35),0_8px_20px_rgba(2,132,199,0.4)]"
            : "bg-gradient-to-r from-sky-500 via-cyan-500 to-blue-600 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.25)_inset,0_8px_20px_rgba(14,116,144,0.35)] hover:brightness-110"
        )}
        aria-label="Open designer tool"
      >
        DESIGNER
      </button>
    </div>
  );
};

export default PlaygroundNav;
