import {
  For,
  Show,
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  type Component,
  type JSX,
} from "solid-js";
import { getHighlighter } from "../designer/shikiCompat";
import { cx } from "../utils/cx";

export type CodeViewerLanguage = "ts" | "typescript" | "js" | "javascript" | "json";
export type CodeViewerTheme = "snazzy-light" | "night-owl" | "github-dark";

export type CodeViewerView = {
  id: string;
  label: string;
  code: string;
  lang?: CodeViewerLanguage;
  theme?: CodeViewerTheme;
};

export type CodeViewerProps = {
  code?: string;
  views?: CodeViewerView[];
  defaultView?: string;
  activeViewId?: string;
  onActiveViewIdChange?: (next: string) => void;
  jsonObjectViews?: boolean;
  preloadViews?: boolean;
  lang?: CodeViewerLanguage;
  theme?: CodeViewerTheme;
  class?: string;
  maxHeightClass?: string;
  minHeightClass?: string;
  showLineNumbers?: boolean;
  tabBarEnd?: JSX.Element;
  showCopyButton?: boolean;
  dark?: boolean;
};

type HighlightOptions = {
  code: string;
  lang?: CodeViewerLanguage;
  theme?: CodeViewerTheme;
};

const highlightCache = new Map<string, string>();
const pendingHighlights = new Map<string, Promise<string>>();

const resolveLang = (lang: CodeViewerLanguage | undefined): CodeViewerLanguage => lang ?? "js";
const resolveTheme = (theme: CodeViewerTheme | undefined): CodeViewerTheme => theme ?? "snazzy-light";
const isDarkTheme = (theme: CodeViewerTheme) => theme === "night-owl" || theme === "github-dark";

const highlightKey = (code: string, lang: CodeViewerLanguage, theme: CodeViewerTheme) =>
  `${theme}\u0000${lang}\u0000${code}`;

const isIdentifierKey = (key: string) => /^[$A-Z_][0-9A-Z_$]*$/i.test(key);

const formatObjectKey = (key: string) => (isIdentifierKey(key) ? key : JSON.stringify(key));

const serializeObjectValue = (value: unknown, level = 0): string => {
  const indent = "  ".repeat(level);
  const childIndent = "  ".repeat(level + 1);

  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return JSON.stringify(value);
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : "null";
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    return `[\n${value
      .map((item) => `${childIndent}${serializeObjectValue(item, level + 1)},`)
      .join("\n")}\n${indent}]`;
  }

  if (typeof value === "object" && value !== null) {
    const entries = Object.entries(value);
    if (entries.length === 0) return "{}";
    return `{\n${entries
      .map(
        ([key, entryValue]) =>
          `${childIndent}${formatObjectKey(key)}: ${serializeObjectValue(entryValue, level + 1)},`,
      )
      .join("\n")}\n${indent}}`;
  }

  return "null";
};

const createJsonObjectViews = (code: string, dark: boolean | undefined): CodeViewerView[] => {
  const objectTheme: CodeViewerTheme = dark ? "github-dark" : "snazzy-light";
  const jsonTheme: CodeViewerTheme = dark ? "night-owl" : "snazzy-light";

  try {
    const parsed = JSON.parse(code);
    return [
      {
        id: "object",
        label: "object",
        code: serializeObjectValue(parsed),
        lang: "js",
        theme: objectTheme,
      },
      {
        id: "json",
        label: "json",
        code: JSON.stringify(parsed, null, 2),
        lang: "json",
        theme: jsonTheme,
      },
    ];
  } catch {
    return [
      {
        id: "object",
        label: "object",
        code,
        lang: "js",
        theme: objectTheme,
      },
      {
        id: "json",
        label: "json",
        code,
        lang: "json",
        theme: jsonTheme,
      },
    ];
  }
};

export const getCachedCodeViewerHighlight = (options: HighlightOptions) => {
  const lang = resolveLang(options.lang);
  const theme = resolveTheme(options.theme);
  return highlightCache.get(highlightKey(options.code, lang, theme));
};

export const preloadCodeViewerHighlight = (options: HighlightOptions) => {
  const lang = resolveLang(options.lang);
  const theme = resolveTheme(options.theme);
  const key = highlightKey(options.code, lang, theme);
  const cached = highlightCache.get(key);

  if (cached) return Promise.resolve(cached);

  const pending = pendingHighlights.get(key);
  if (pending) return pending;

  const nextHighlight = getHighlighter({ theme, langs: [lang] })
    .then((highlighter) => highlighter.codeToHtml(options.code, { lang, theme }))
    .then((html) => {
      highlightCache.set(key, html);
      pendingHighlights.delete(key);
      return html;
    })
    .catch((error) => {
      pendingHighlights.delete(key);
      throw error;
    });

  pendingHighlights.set(key, nextHighlight);
  return nextHighlight;
};

export const preloadCodeViewerViews = (views: CodeViewerView[]) =>
  Promise.all(
    views.map((view) =>
      preloadCodeViewerHighlight({
        code: view.code,
        lang: view.lang,
        theme: view.theme,
      }),
    ),
  );

const CodeViewer: Component<CodeViewerProps> = (props) => {
  const resolvedViews = createMemo<CodeViewerView[]>(() => {
    if (props.views && props.views.length > 0) return props.views;
    if (props.jsonObjectViews) return createJsonObjectViews(props.code ?? "", props.dark);
    return [
      {
        id: "code",
        label: "code",
        code: props.code ?? "",
        lang: props.lang,
        theme: props.theme,
      },
    ];
  });
  const [activeViewId, setActiveViewId] = createSignal<string | undefined>(props.defaultView);
  const activeView = createMemo(() => {
    const views = resolvedViews();
    const requestedViewId = props.activeViewId ?? activeViewId() ?? props.defaultView ?? views[0]?.id;
    return views.find((view) => view.id === requestedViewId) ?? views[0];
  });
  const lang = createMemo(() => resolveLang(activeView()?.lang ?? props.lang));
  const theme = createMemo(() => resolveTheme(activeView()?.theme ?? props.theme));
  const code = createMemo(() => activeView()?.code ?? "");
  const lineCount = createMemo(() => code().split("\n").length);
  const [highlightedHtml, setHighlightedHtml] = createSignal<string | undefined>();
  const [copied, setCopied] = createSignal(false);
  const dark = createMemo(() => isDarkTheme(theme()));
  const hasTabs = createMemo(() => resolvedViews().length > 1);
  let copiedTimer: number | undefined;

  onCleanup(() => {
    if (copiedTimer !== undefined) {
      window.clearTimeout(copiedTimer);
    }
  });

  const copyActiveView = async () => {
    const textToCopy = code();

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = textToCopy;
        textArea.setAttribute("readonly", "");
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        document.body.append(textArea);
        textArea.select();
        document.execCommand("copy");
        textArea.remove();
      }

      setCopied(false);
      setCopied(true);
      if (copiedTimer !== undefined) {
        window.clearTimeout(copiedTimer);
      }
      copiedTimer = window.setTimeout(() => setCopied(false), 10_000);
    } catch {
      setCopied(false);
    }
  };

  createEffect(() => {
    const views = resolvedViews();
    const defaultViewId = props.defaultView ?? views[0]?.id;
    const requestedViewId = props.activeViewId ?? activeViewId();
    if (!views.some((view) => view.id === requestedViewId)) {
      setActiveViewId(defaultViewId);
      if (defaultViewId) props.onActiveViewIdChange?.(defaultViewId);
    }
  });

  createEffect(() => {
    if (props.preloadViews === false || resolvedViews().length < 2) return;
    void preloadCodeViewerViews(resolvedViews()).catch((error) => {
      console.error("Unable to preload code views", error);
    });
  });

  createEffect(() => {
    const currentCode = code();
    const currentLang = lang();
    const currentTheme = theme();
    let cancelled = false;
    const cachedHighlight = getCachedCodeViewerHighlight({
      code: currentCode,
      lang: currentLang,
      theme: currentTheme,
    });

    setHighlightedHtml(cachedHighlight);

    if (!cachedHighlight) {
      preloadCodeViewerHighlight({
        code: currentCode,
        lang: currentLang,
        theme: currentTheme,
      })
        .then((html) => {
          if (!cancelled) setHighlightedHtml(html);
        })
        .catch((error) => {
          console.error("Unable to highlight code", error);
        });
    }

    onCleanup(() => {
      cancelled = true;
    });
  });

  createEffect(() => {
    code();
    activeView()?.id;
    setCopied(false);
    if (copiedTimer !== undefined) {
      window.clearTimeout(copiedTimer);
      copiedTimer = undefined;
    }
  });

  return (
    <div class={cx("flex min-h-0 w-full max-w-full flex-col", props.class)}>
      <Show when={hasTabs()}>
        <div class="flex w-full items-end justify-between gap-3">
          <div
            class={cx(
              "flex min-w-0 items-center gap-1 rounded-t-md border border-b-0 p-1 text-xs font-semibold uppercase tracking-wide",
              dark()
                ? "border-slate-700 bg-slate-900 text-slate-400"
                : "border-slate-200 bg-slate-50 text-slate-500",
            )}
          >
            <For each={resolvedViews()}>
              {(view) => {
                const selected = () => activeView()?.id === view.id;

                return (
                  <button
                    type="button"
                    class={cx(
                      "rounded px-2.5 py-1 transition",
                      selected()
                        ? dark()
                          ? "bg-slate-700 text-slate-100"
                          : "bg-white text-slate-900 shadow-sm"
                        : dark()
                          ? "hover:bg-slate-800 hover:text-slate-200"
                          : "hover:bg-slate-100 hover:text-slate-700",
                    )}
                    onClick={() => {
                      setActiveViewId(view.id);
                      props.onActiveViewIdChange?.(view.id);
                    }}
                  >
                    {view.label}
                  </button>
                );
              }}
            </For>
          </div>
          <Show when={props.showCopyButton || props.tabBarEnd}>
            <div class="flex shrink-0 items-center gap-2 pb-1 normal-case tracking-normal">
              {props.tabBarEnd}
              <Show when={props.showCopyButton}>
                <button
                  type="button"
                  class={cx(
                    "inline-flex h-8 w-8 items-center justify-center rounded-md border text-sm transition",
                    dark()
                      ? "border-slate-700 bg-slate-950 text-slate-200 hover:bg-slate-900"
                      : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100",
                  )}
                  aria-label="Copy code"
                  onClick={copyActiveView}
                >
                  {copied() ? "✅" : "📋"}
                </button>
              </Show>
            </div>
          </Show>
        </div>
      </Show>

      <Show
        when={highlightedHtml()}
        fallback={
          <div
            class={cx(
              "flex flex-1 items-center justify-center border px-4 py-6 text-xs",
              hasTabs() ? "rounded-b-md rounded-tr-md" : "rounded-md",
              dark()
                ? "border-slate-700 bg-slate-950/80 text-slate-400"
                : "border-slate-200 bg-white text-slate-500",
              props.minHeightClass ?? "min-h-[180px]",
              props.maxHeightClass,
            )}
          >
            Highlighting...
          </div>
        }
      >
        {(html) => (
          <div
            class={cx(
              "relative z-10 min-h-0 w-full max-w-full flex-1 overflow-x-auto overflow-y-auto border",
              hasTabs() ? "rounded-b-md rounded-tr-md" : "rounded-md",
              dark() ? "border-slate-700 bg-slate-950" : "border-slate-200 bg-white",
              props.maxHeightClass,
              props.minHeightClass,
            )}
            style={{ "scrollbar-gutter": "stable both-edges" }}
          >
            <div class="flex w-max min-w-full items-start">
              <Show when={props.showLineNumbers ?? true}>
                <div
                  class={cx(
                    "sticky left-0 self-stretch border-r px-3 py-3 text-right text-xs leading-6",
                    dark()
                      ? "border-slate-800 bg-slate-900/95 text-slate-500"
                      : "border-slate-200 bg-slate-50 text-slate-400",
                  )}
                >
                  <For each={Array.from({ length: lineCount() }, (_, index) => index + 1)}>
                    {(lineNumber) => <div class="select-none">{lineNumber}</div>}
                  </For>
                </div>
              </Show>
              <div
                class="min-w-0 flex-1 p-3 text-[13px] leading-6 [&_pre]:!m-0 [&_pre]:!inline-block [&_pre]:!min-w-full [&_pre]:!w-max [&_pre]:!max-w-none [&_pre]:!bg-transparent [&_pre]:!p-0 [&_pre]:!font-mono [&_pre]:!whitespace-pre"
                innerHTML={html()}
              />
            </div>
          </div>
        )}
      </Show>
    </div>
  );
};

export default CodeViewer;
