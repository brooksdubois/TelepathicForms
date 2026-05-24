export type Lang = string;
export type Theme = string;
export type ILanguageRegistration = Record<string, unknown> | string;

type LegacyGetHighlighterOptions = {
  langs?: (Lang | ILanguageRegistration)[];
  themes?: Theme[];
  theme?: Theme;
};

type LegacyCodeToHtmlOptions = {
  lang: Lang;
  theme?: Theme;
};

const fallbackTheme: Theme = "snazzy-light";
const supportedThemes = new Set<Theme>(["github-dark", "night-owl", fallbackTheme]);

let defaultTheme: Theme = fallbackTheme;
let highlighterPromise:
  | Promise<{
      loadLanguage: (lang: never) => Promise<void>;
      codeToHtml: (code: string, options: { lang: never; theme: never }) => string;
    }>
  | undefined;

const resolveTheme = (theme: Theme | undefined) =>
  theme && supportedThemes.has(theme) ? theme : fallbackTheme;

const getBundledHighlighter = async () => {
  highlighterPromise ??= Promise.all([
    import("shiki/core"),
    import("shiki/engine/javascript"),
    import("shiki/dist/langs/typescript.mjs"),
    import("shiki/dist/langs/javascript.mjs"),
    import("shiki/dist/langs/json.mjs"),
    import("shiki/dist/themes/github-dark.mjs"),
    import("shiki/dist/themes/night-owl.mjs"),
    import("shiki/dist/themes/snazzy-light.mjs"),
  ]).then(
    ([
      { createHighlighterCore },
      { createJavaScriptRegexEngine },
      typescript,
      javascript,
      json,
      githubDark,
      nightOwl,
      snazzyLight,
    ]) =>
      createHighlighterCore({
        engine: createJavaScriptRegexEngine(),
        langs: [typescript.default, javascript.default, json.default],
        themes: [githubDark.default, nightOwl.default, snazzyLight.default],
      }),
  );

  return highlighterPromise;
};

export const setCDN = (_cdnRoot: string) => {
  // Shiki v3 no longer uses setCDN; keep for solid-codeblock compatibility.
};

export const getHighlighter = async (options: LegacyGetHighlighterOptions = {}) => {
  defaultTheme = resolveTheme(options.theme ?? options.themes?.[0] ?? defaultTheme);

  const highlighter = await getBundledHighlighter();

  return {
    loadLanguage: (lang: ILanguageRegistration | Lang) =>
      highlighter.loadLanguage(lang as never),
    codeToHtml: (code: string, renderOptions: LegacyCodeToHtmlOptions) =>
      highlighter.codeToHtml(code, {
        lang: renderOptions.lang as never,
        theme: resolveTheme(renderOptions.theme ?? defaultTheme) as never,
      }),
  };
};
