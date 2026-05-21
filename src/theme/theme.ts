import { createSignal } from "solid-js";

export type AccentTheme = "purple" | "blue" | "green" | "orange" | "gray" | "navy";

const STORAGE_KEY = "telepathic-forms-accent-theme";

export const themeOptions: Array<{ value: AccentTheme; label: string }> = [
  { value: "purple", label: "Purple" },
  { value: "blue", label: "Blue" },
  { value: "green", label: "Green" },
  { value: "orange", label: "Orange" },
  { value: "gray", label: "Gray" },
  { value: "navy", label: "Navy" },
];

const themeSet = new Set<AccentTheme>(themeOptions.map((option) => option.value));

const isAccentTheme = (value: string | null | undefined): value is AccentTheme =>
  Boolean(value) && themeSet.has(value as AccentTheme);

const readStoredTheme = (): AccentTheme => {
  if (typeof window === "undefined") return "green";

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return isAccentTheme(stored) ? stored : "green";
  } catch {
    return "green";
  }
};

const applyDocumentTheme = (next: AccentTheme) => {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-tf-theme", next);
};

const initialTheme = readStoredTheme();

export const [theme, setThemeSignal] = createSignal<AccentTheme>(initialTheme);

applyDocumentTheme(initialTheme);

export const setTheme = (next: AccentTheme) => {
  setThemeSignal(next);
  applyDocumentTheme(next);

  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // Ignore storage failures.
  }
};
