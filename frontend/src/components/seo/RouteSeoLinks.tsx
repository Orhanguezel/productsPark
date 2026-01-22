// =============================================================
// FILE: src/components/seo/RouteSeoLinks.tsx
// FINAL — Canonical + Hreflang (route-aware) from /seo/meta
// - react-router location based
// - exactOptionalPropertyTypes friendly
// =============================================================

import React, { useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { useSeoMetaQuery } from '@/integrations/hooks';
import { toStr} from '@/integrations/types';

type HreflangLocaleItem = {
  locale: string; // e.g. "tr", "en", "de"
  prefix?: string; // e.g. "", "/en", "/de"
};


function safeParseLocales(raw: string): HreflangLocaleItem[] {
  const s = (raw || '').trim();
  if (!s) return [];
  try {
    const arr = JSON.parse(s) as unknown;
    if (!Array.isArray(arr)) return [];
    const out: HreflangLocaleItem[] = [];
    for (const it of arr) {
      if (!it || typeof it !== 'object' || Array.isArray(it)) continue;
      const o = it as Record<string, unknown>;
      const locale = typeof o.locale === 'string' ? o.locale.trim() : '';
      if (!locale) continue;
      const prefix = typeof o.prefix === 'string' ? o.prefix.trim() : '';
      out.push({ locale, prefix });
    }
    return out;
  } catch {
    return [];
  }
}

function joinUrl(base: string, path: string): string {
  const b = (base || '').replace(/\/+$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${b}${p}`;
}

function stripLocalePrefix(pathname: string, locales: HreflangLocaleItem[]): string {
  if (!pathname) return '/';
  // en uzun prefix önce (ör: "/en-us" önce gelsin)
  const prefixes = locales
    .map((x) => x.prefix || '')
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);

  for (const p of prefixes) {
    const pref = p.startsWith('/') ? p : `/${p}`;
    if (pathname === pref) return '/';
    if (pathname.startsWith(pref + '/')) return pathname.slice(pref.length) || '/';
  }
  return pathname;
}

export function RouteSeoLinks() {
  const loc = useLocation();
  const { data } = useSeoMetaQuery();

  const canonicalBase =
    toStr(data?.canonical_base_url).trim() ||
    (typeof window !== 'undefined' ? window.location.origin : '');

  const hreflangEnabled = !!data?.hreflang_enabled;
  const locales = useMemo(
    () => safeParseLocales(toStr(data?.hreflang_locales)),
    [data?.hreflang_locales],
  );

  const canonicalHref = useMemo(() => {
    const cleaned = stripLocalePrefix(loc.pathname || '/', locales);
    return canonicalBase ? joinUrl(canonicalBase, cleaned) : '';
  }, [canonicalBase, loc.pathname, locales]);

  const alternates = useMemo(() => {
    if (!hreflangEnabled || !canonicalBase) return [];
    if (!locales.length) return [];

    const cleaned = stripLocalePrefix(loc.pathname || '/', locales);
    return locales.map((l) => {
      const prefix = (l.prefix || '').trim();
      const pref = prefix ? (prefix.startsWith('/') ? prefix : `/${prefix}`) : '';
      const href = joinUrl(canonicalBase, pref + cleaned);
      return { hrefLang: l.locale, href };
    });
  }, [hreflangEnabled, canonicalBase, locales, loc.pathname]);

  if (!canonicalHref && !alternates.length) return null;

  return (
    <Helmet>
      {canonicalHref ? <link rel="canonical" href={canonicalHref} /> : null}

      {alternates.map((a) => (
        <link key={`alt-${a.hrefLang}`} rel="alternate" hrefLang={a.hrefLang} href={a.href} />
      ))}
    </Helmet>
  );
}
