import { createSignal } from 'solid-js';

const DARK_MODE_STORAGE_KEY = 'telepathic-forms-dark-mode';

// Create a global dark mode signal
const createDarkModeStore = () => {
  const [isDarkMode, setIsDarkMode] = createSignal(false);
  let isInitialized = false;

  const readStoredDarkMode = () => {
    if (typeof window === 'undefined') return null;

    try {
      const saved = window.localStorage.getItem(DARK_MODE_STORAGE_KEY);
      if (saved === null) return null;
      return Boolean(JSON.parse(saved));
    } catch {
      return null;
    }
  };

  const writeStoredDarkMode = (value: boolean) => {
    if (typeof window === 'undefined') return;

    try {
      window.localStorage.setItem(DARK_MODE_STORAGE_KEY, JSON.stringify(value));
    } catch {
      // Ignore storage failures.
    }
  };

  const systemPrefersDark = () => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  };

  const resolveDarkMode = () => readStoredDarkMode() ?? systemPrefersDark();

  const initializeDarkMode = () => {
    if (isInitialized) return;

    if (typeof window === 'undefined' || typeof document === 'undefined') {
      isInitialized = true;
      return;
    }

    const darkModeValue = resolveDarkMode();
    
    setIsDarkMode(darkModeValue);
    applyDarkMode(darkModeValue);

    if (typeof window.matchMedia === 'function') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', (event) => {
        if (readStoredDarkMode() !== null) return;
        setIsDarkMode(event.matches);
        applyDarkMode(event.matches);
      });
    }
    
    isInitialized = true;
  };

  const applyDarkMode = (isDark: boolean) => {
    if (typeof document === 'undefined') return;

    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const toggleDarkMode = () => {
    const newValue = !isDarkMode();
    setIsDarkMode(newValue);
    writeStoredDarkMode(newValue);
    applyDarkMode(newValue);
  };

  const setDarkMode = (value: boolean) => {
    setIsDarkMode(value);
    writeStoredDarkMode(value);
    applyDarkMode(value);
  };

  return {
    isDarkMode,
    toggleDarkMode,
    setDarkMode,
    initializeDarkMode,
  };
};

export const darkModeStore = createDarkModeStore();
