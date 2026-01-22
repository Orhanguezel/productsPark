// =============================================================
// FILE: src/integrations/constants.ts
// FINAL — API URL resolver (Vite)
// - VITE_API_URL can be:
//   a) full:   http://localhost:8081/api
//   b) origin: http://localhost:8081
// - VITE_API_BASE default: /api
// =============================================================

type ViteEnvLike = Record<string, string | boolean | undefined>;

function getEnvString(key: string): string {
  const env = import.meta.env as unknown as ViteEnvLike;
  const v = env[key];
  return typeof v === 'string' ? v.trim() : '';
}

function trimSlashRight(x: string): string {
  return x.replace(/\/+$/, '');
}
function ensureLeadingSlash(x: string): string {
  return x.startsWith('/') ? x : `/${x}`;
}
function isAbsUrl(x: string): boolean {
  return /^https?:\/\//i.test(x);
}

function join(origin: string, base: string): string {
  const o = trimSlashRight(origin);
  const b = trimSlashRight(ensureLeadingSlash(base));
  return `${o}${b}`;
}

function guessDevBackendOrigin(): string {
  try {
    const loc = window.location;
    const host = loc?.hostname || 'localhost';
    const proto = loc?.protocol || 'http:';
    return `${proto}//${host}:8081`;
  } catch {
    return 'http://localhost:8081';
  }
}

export const API_BASE = (() => {
  const b = getEnvString('VITE_API_BASE');
  return trimSlashRight(b || '/api') || '/api';
})();

/**
 * API_URL:
 * - If VITE_API_URL includes path (/api), use as-is
 * - If VITE_API_URL is only origin, join with API_BASE
 * - Dev fallback: http://<host>:8081 + /api
 * - Prod fallback: /api (same-origin)
 */
export const API_URL = (() => {
  const apiUrl = getEnvString('VITE_API_URL');
  const apiBase = API_BASE;

  // 1) Full absolute url: http(s)://.../api or any path
  if (apiUrl && isAbsUrl(apiUrl)) {
    // If it already contains a path segment beyond origin, keep it.
    // Detect by parsing pathname.
    try {
      const u = new URL(apiUrl);
      const hasPath = (u.pathname || '').replace(/\/+$/, '') !== '';
      if (hasPath && u.pathname !== '/') return trimSlashRight(apiUrl);

      // If it's only origin (pathname "/"), join with base
      return join(trimSlashRight(apiUrl), apiBase);
    } catch {
      return trimSlashRight(apiUrl);
    }
  }

  // 2) If API_BASE itself is absolute
  if (isAbsUrl(apiBase)) return trimSlashRight(apiBase);

  // 3) Dev fallback: guess origin + base
  if (import.meta.env.DEV) {
    return join(guessDevBackendOrigin(), apiBase);
  }

  // 4) Prod fallback: same-origin base
  return ensureLeadingSlash(trimSlashRight(apiBase));
})();
