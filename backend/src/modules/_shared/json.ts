// =============================================================
// FILE: src/modules/_shared/json.ts
// FINAL — JSON helpers (safe, reusable)
// =============================================================

export type JsonObject = Record<string, any>;

export function safeJsonParse<T = any>(input: unknown, fallback: T): T {
  if (input === null || input === undefined) return fallback;
  if (typeof input !== 'string') return fallback;
  const s = input.trim();
  if (!s) return fallback;
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}

export function packJson(v: unknown): string {
  // JSON.stringify undefined => undefined; DB için string bekleniyor
  if (v === undefined) return 'null';
  try {
    return JSON.stringify(v);
  } catch {
    return 'null';
  }
}

export function unpackArray(s?: string | null): string[] {
  const parsed = safeJsonParse<any>(s, []);
  return Array.isArray(parsed) ? parsed.map((x) => String(x ?? '')).filter(Boolean) : [];
}

export function extractHtmlFromJson(s?: string | null): string {
  const parsed = safeJsonParse<any>(s, null);
  if (parsed && typeof parsed === 'object' && typeof parsed.html === 'string') return parsed.html;
  // Eğer düz string html gelmişse
  if (typeof s === 'string' && s.trim()) return s;
  return '';
}

/**
 * İçeriği DB’de tek formatta tut:
 * - Eğer input JSON ve içinde { html: string } varsa onu normalize et
 * - Değilse düz string’i { html: input } yap
 */
export function packContent(htmlOrJson: string): string {
  const raw = String(htmlOrJson ?? '').trim();
  if (!raw) return JSON.stringify({ html: '' });

  const parsed = safeJsonParse<any>(raw, null);
  if (parsed && typeof parsed === 'object' && typeof parsed.html === 'string') {
    return JSON.stringify({ html: parsed.html });
  }
  return JSON.stringify({ html: raw });
}
