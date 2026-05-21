import { createSignal } from 'solid-js';
import { appRoutePathSet } from './routes';

const PRODUCTION_BASE_PATH = '/TelepathicForms';
const routerBasePath = import.meta.env.PROD ? PRODUCTION_BASE_PATH : '';

const normalizePath = (path: string) => {
  const withoutHash = path.startsWith('#') ? path.slice(1) : path;
  if (!withoutHash) return '/';
  const withLeadingSlash = withoutHash.startsWith('/') ? withoutHash : `/${withoutHash}`;
  const trimmed = withLeadingSlash.replace(/\/+$/, '');
  return trimmed === '' ? '/' : trimmed;
};

const stripRouterBasePath = (path: string) => {
  const normalized = normalizePath(path);
  if (!routerBasePath) return normalized;
  if (normalized === routerBasePath) return '/';
  if (normalized.startsWith(`${routerBasePath}/`)) {
    return normalizePath(normalized.slice(routerBasePath.length));
  }
  return normalized;
};

const routeFromPathname = () => {
  const withoutIndex = stripRouterBasePath(
    window.location.pathname.replace(/\/index\.html$/, ''),
  );
  const segment = withoutIndex.split('/').filter(Boolean).at(-1);
  if (!segment) return '/';

  const candidate = normalizePath(segment);
  return appRoutePathSet.has(candidate) ? candidate : '/';
};

export const currentRoutePath = () => {
  const hashRoute = normalizePath(window.location.hash);
  return hashRoute === '/' ? routeFromPathname() : hashRoute;
};

export const routeHref = (href: string) => {
  const normalized = stripRouterBasePath(href);
  if (!routerBasePath) return normalized;
  if (normalized === '/') return routerBasePath;
  return `${routerBasePath}${normalized}`;
};

export const [path, setPath] = createSignal(currentRoutePath());

export const navigateTo = (href: string, options: { replace?: boolean } = {}) => {
  const normalized = stripRouterBasePath(href);
  const browserPath = routeHref(normalized);
  if (options.replace) {
    window.history.replaceState({}, '', browserPath);
  } else {
    window.history.pushState({}, '', browserPath);
  }
  setPath(normalized);
};
