import { createHighlighter } from "shiki/dist/index.mjs";

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

let defaultTheme: Theme = "github-dark";

export const setCDN = (_cdnRoot: string) => {
  // Shiki v3 no longer uses setCDN; keep for solid-codeblock compatibility.
};

export const getHighlighter = async (options: LegacyGetHighlighterOptions = {}) => {
  const themes = options.theme
    ? [options.theme]
    : options.themes && options.themes.length > 0
      ? options.themes
      : [defaultTheme];

  if (options.theme) {
    defaultTheme = options.theme;
  }

  const highlighter = await createHighlighter({
    langs: options.langs as never,
    themes: themes as never,
  });

  return {
    loadLanguage: (lang: ILanguageRegistration | Lang) =>
      highlighter.loadLanguage(lang as never),
    codeToHtml: (code: string, renderOptions: LegacyCodeToHtmlOptions) =>
      highlighter.codeToHtml(code, {
        lang: renderOptions.lang as never,
        theme: (renderOptions.theme ?? defaultTheme) as never,
      }),
  };
};

export * from "shiki/dist/index.mjs";
