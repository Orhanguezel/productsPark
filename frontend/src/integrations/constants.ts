// =============================================================
// FILE: src/integrations/constants.ts
// FINAL — API URL resolver (Vite)
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

export const API_URL = (() => {
  const apiUrl = getEnvString('VITE_API_URL');
  const apiBase = API_BASE;

  // 1) Full absolute url
  if (apiUrl && isAbsUrl(apiUrl)) {
    try {
      const u = new URL(apiUrl);
      const path = (u.pathname || '').replace(/\/+$/, '');
      // if user gave origin-only ("/") treat as origin and join base
      if (!path || path === '') return join(trimSlashRight(apiUrl), apiBase);
      if (path === '/') return join(trimSlashRight(apiUrl), apiBase);
      return trimSlashRight(apiUrl);
    } catch {
      return trimSlashRight(apiUrl);
    }
  }

  // 2) If API_BASE itself is absolute
  if (isAbsUrl(apiBase)) return trimSlashRight(apiBase);

  // 3) Dev fallback
  if (import.meta.env.DEV) {
    return join(guessDevBackendOrigin(), apiBase);
  }

  // 4) Prod fallback: same-origin base
  return ensureLeadingSlash(trimSlashRight(apiBase));
})();
