import { createHighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import javascript from "shiki/dist/langs/javascript.mjs";
import json from "shiki/dist/langs/json.mjs";
import typescript from "shiki/dist/langs/typescript.mjs";
import githubDark from "shiki/dist/themes/github-dark.mjs";

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

const bundledLanguages = [typescript, javascript, json];
const bundledThemes = [githubDark];
const fallbackTheme: Theme = "github-dark";
const supportedThemes = new Set<Theme>([fallbackTheme]);

let defaultTheme: Theme = fallbackTheme;

const resolveTheme = (theme: Theme | undefined) =>
  theme && supportedThemes.has(theme) ? theme : fallbackTheme;

export const setCDN = (_cdnRoot: string) => {
  // Shiki v3 no longer uses setCDN; keep for solid-codeblock compatibility.
};

export const getHighlighter = async (options: LegacyGetHighlighterOptions = {}) => {
  defaultTheme = resolveTheme(options.theme ?? options.themes?.[0] ?? defaultTheme);

  const highlighter = await createHighlighterCore({
    engine: createJavaScriptRegexEngine(),
    langs: bundledLanguages,
    themes: bundledThemes,
  });

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
