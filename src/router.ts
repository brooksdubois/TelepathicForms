import { createSignal } from 'solid-js';

const normalizePath = (path: string) => {
  if (!path) return '/';
  const trimmed = path.replace(/\/+$/, '');
  return trimmed === '' ? '/' : trimmed;
};

export const [path, setPath] = createSignal(normalizePath(window.location.pathname));

export const navigateTo = (href: string) => {
  const normalized = normalizePath(href);
  window.history.pushState({}, '', normalized);
  setPath(normalized);
};