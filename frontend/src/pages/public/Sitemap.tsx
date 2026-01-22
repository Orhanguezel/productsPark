// =============================================================
// FILE: src/pages/Sitemap.tsx
// FINAL — Sitemap page reads from site_settings (admin-manageable)
// - uses useGetSiteSettingByKeyQuery(key: string)
// - exactOptionalPropertyTypes friendly: optional props are omitted when undefined
// =============================================================

import { useEffect, useMemo } from 'react';
import { useGetSiteSettingByKeyQuery } from '@/integrations/hooks';

type SitemapUrlItem = {
  path: string;
  changefreq?: string;
  priority?: number;
  lastmod?: string;
};

const escapeXml = (s: string) =>
  (s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const bool = (v: unknown): boolean => {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    if (['true', '1', 'yes', 'y', 'on'].includes(s)) return true;
    if (['false', '0', 'no', 'n', 'off'].includes(s)) return false;
  }
  return false;
};

const toStr = (v: unknown): string => (typeof v === 'string' ? v : v == null ? '' : String(v));

const joinUrl = (base: string, path: string): string => {
  const b = (base || '').replace(/\/+$/, '');
  const p = (path || '').startsWith('/') ? path : `/${path}`;
  return `${b}${p}`;
};

const buildXml = (baseUrl: string, items: SitemapUrlItem[]) => {
  const nowIso = new Date().toISOString();

  const urls = items
    .map((it) => {
      const loc = escapeXml(joinUrl(baseUrl, it.path));
      const lastmod = `<lastmod>${escapeXml(it.lastmod || nowIso)}</lastmod>`;
      const changefreq = it.changefreq
        ? `<changefreq>${escapeXml(it.changefreq)}</changefreq>`
        : '';
      const priority =
        typeof it.priority === 'number' && Number.isFinite(it.priority)
          ? `<priority>${it.priority.toFixed(1)}</priority>`
          : '';

      return `<url><loc>${loc}</loc>${lastmod}${changefreq}${priority}</url>`;
    })
    .join('');

  return (
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">` +
    urls +
    `</urlset>`
  );
};

function parseUrlsFromText(raw: unknown): SitemapUrlItem[] {
  const s = toStr(raw).trim();
  if (!s) return [];

  try {
    const parsed = JSON.parse(s) as unknown;
    if (!Array.isArray(parsed)) return [];

    const items: SitemapUrlItem[] = [];

    for (const it of parsed) {
      if (!it || typeof it !== 'object' || Array.isArray(it)) continue;
      const obj = it as Record<string, unknown>;

      const path = typeof obj.path === 'string' ? obj.path.trim() : '';
      if (!path) continue;

      const changefreq = typeof obj.changefreq === 'string' ? obj.changefreq.trim() : '';
      const priorityRaw = obj.priority;
      const priorityNum =
        typeof priorityRaw === 'number'
          ? priorityRaw
          : typeof priorityRaw === 'string'
          ? Number(priorityRaw)
          : NaN;

      const lastmod = typeof obj.lastmod === 'string' ? obj.lastmod.trim() : '';

      // ✅ exactOptionalPropertyTypes friendly: undefined alanları objeye EKLEME
      const out: SitemapUrlItem = { path };

      if (changefreq) out.changefreq = changefreq;
      if (Number.isFinite(priorityNum)) out.priority = priorityNum;
      if (lastmod) out.lastmod = lastmod;

      items.push(out);
    }

    return items;
  } catch {
    return [];
  }
}

export default function Sitemap() {
  // ✅ RTK signature: (key: string)
  const enabledQ = useGetSiteSettingByKeyQuery('sitemap_enabled');
  const baseQ = useGetSiteSettingByKeyQuery('sitemap_base_url');
  const urlsQ = useGetSiteSettingByKeyQuery('sitemap_urls');

  const loading = enabledQ.isLoading || baseQ.isLoading || urlsQ.isLoading;
  const isError = enabledQ.isError || baseQ.isError || urlsQ.isError;

  const enabledVal = useMemo(() => bool(enabledQ.data?.value), [enabledQ.data]);
  const baseUrl = useMemo(() => {
    const v = toStr(baseQ.data?.value).trim();
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return v ? v : origin;
  }, [baseQ.data]);

  const urlItems = useMemo(() => parseUrlsFromText(urlsQ.data?.value), [urlsQ.data]);

  const xml = useMemo(() => {
    if (!enabledVal) return '';
    if (!baseUrl) return '';
    return buildXml(baseUrl, urlItems);
  }, [enabledVal, baseUrl, urlItems]);

  useEffect(() => {
    if (loading) return;
    if (!enabledVal) return;
    if (!xml) return;

    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);

    window.location.replace(url);

    return () => URL.revokeObjectURL(url);
  }, [loading, enabledVal, xml]);

  if (loading) {
    return <div style={{ padding: '20px', fontFamily: 'monospace' }}>Loading sitemap...</div>;
  }

  if (isError) {
    return <div style={{ padding: '20px', fontFamily: 'monospace' }}>Failed to load sitemap.</div>;
  }

  if (!enabledVal) {
    return <div style={{ padding: '20px', fontFamily: 'monospace' }}>Sitemap is disabled.</div>;
  }

  if (!xml) {
    return (
      <div style={{ padding: '20px', fontFamily: 'monospace' }}>
        Sitemap is empty (no URLs configured).
      </div>
    );
  }

  // replace çalışmazsa fallback
  return <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>{xml}</pre>;
}
