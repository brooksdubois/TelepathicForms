import { createSignal, onMount } from 'solid-js';

// Create a global dark mode signal
const createDarkModeStore = () => {
  const [isDarkMode, setIsDarkMode] = createSignal(false);
  let isInitialized = false;

  const initializeDarkMode = () => {
    if (isInitialized) return;
    
    // Read from localStorage on initialization
    const saved = localStorage.getItem('darkMode');
    const darkModeValue = saved !== null ? JSON.parse(saved) : false;
    
    setIsDarkMode(darkModeValue);
    applyDarkMode(darkModeValue);
    
    isInitialized = true;
  };

  const applyDarkMode = (isDark: boolean) => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const toggleDarkMode = () => {
    const newValue = !isDarkMode();
    setIsDarkMode(newValue);
    localStorage.setItem('darkMode', JSON.stringify(newValue));
    applyDarkMode(newValue);
  };

  const setDarkMode = (value: boolean) => {
    setIsDarkMode(value);
    localStorage.setItem('darkMode', JSON.stringify(value));
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