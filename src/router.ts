import { createSignal } from 'solid-js';
import { appRoutePathSet } from './routes';

const normalizePath = (path: string) => {
  const withoutHash = path.startsWith('#') ? path.slice(1) : path;
  if (!withoutHash) return '/';
  const withLeadingSlash = withoutHash.startsWith('/') ? withoutHash : `/${withoutHash}`;
  const trimmed = withLeadingSlash.replace(/\/+$/, '');
  return trimmed === '' ? '/' : trimmed;
};

const routeFromPathname = () => {
  const withoutIndex = window.location.pathname.replace(/\/index\.html$/, '');
  const segment = withoutIndex.split('/').filter(Boolean).at(-1);
  if (!segment) return '/';

  const candidate = normalizePath(segment);
  return appRoutePathSet.has(candidate) ? candidate : '/';
};

export const currentRoutePath = () => {
  const hashRoute = normalizePath(window.location.hash);
  return hashRoute === '/' ? routeFromPathname() : hashRoute;
};

export const routeHref = (href: string) => normalizePath(href);

export const [path, setPath] = createSignal(currentRoutePath());

export const navigateTo = (href: string, options: { replace?: boolean } = {}) => {
  const normalized = normalizePath(href);
  if (options.replace) {
    window.history.replaceState({}, '', normalized);
  } else {
    window.history.pushState({}, '', normalized);
  }
  setPath(normalized);
};
