// =============================================================
// FILE: src/integrations/types/emailTemplates.ts
// FINAL — Email Templates types + helpers + normalizers (central barrel)
// - strict/no-any
// - fixes: toBool expects BoolLike, we coerce unknown -> BoolLike safely
// =============================================================

import type { BoolLike } from '@/integrations/types';
import { isUnknownRow, toBool, toStr } from '@/integrations/types';

/* -------------------- local tiny helpers -------------------- */

type Obj = Record<string, unknown>;

function isObj(v: unknown): v is Obj {
  return isUnknownRow(v);
}

function toOptStr(v: unknown): string | null {
  const s = toStr(v).trim();
  return s ? s : null;
}

/**
 * Coerce unknown -> BoolLike safely (so we can call central toBool)
 * - supports boolean/0/1/"0"/"1"/"true"/"false"/null/undefined
 * - otherwise returns null (so toBool(null) => false in most implementations)
 */
function asBoolLike(v: unknown): BoolLike {
  if (v == null) return v; // null | undefined
  if (typeof v === 'boolean') return v;
  if (v === 0 || v === 1) return v;

  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    if (s === '0' || s === '1' || s === 'true' || s === 'false') return s as BoolLike;
    return null;
  }

  // number but not 0/1, or other types -> null
  if (typeof v === 'number') return v ? 1 : 0;
  return null;
}

function extractHtml(raw: unknown): string {
  // bazı BE’ler raw string HTML döner, bazıları {html:""} döner
  if (typeof raw === 'string') return raw;
  if (isObj(raw) && typeof raw.html === 'string') return raw.html;
  return '';
}

function toArrayOfStrings(v: unknown): string[] {
  const push = (out: string[], x: unknown) => {
    if (typeof x === 'string') {
      const s = x.trim();
      if (s) out.push(s);
    } else if (typeof x === 'number' || typeof x === 'boolean') {
      out.push(String(x));
    }
  };

  if (Array.isArray(v)) {
    const out: string[] = [];
    for (const x of v) push(out, x);
    return out;
  }

  if (typeof v === 'string') {
    const s = v.trim();
    if (!s) return [];

    // JSON array/string olabilir
    try {
      const parsed: unknown = JSON.parse(s);
      if (Array.isArray(parsed)) {
        const out: string[] = [];
        for (const x of parsed) push(out, x);
        return out;
      }
      if (typeof parsed === 'string' && parsed.trim()) return [parsed.trim()];
    } catch {
      // ignore parse errors
    }

    // comma list fallback
    return s
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);
  }

  // single primitive fallback
  if (typeof v === 'number' || typeof v === 'boolean') return [String(v)];

  return [];
}

function pluckArray(res: unknown): unknown[] {
  if (Array.isArray(res)) return res;
  if (isObj(res)) {
    for (const k of ['data', 'items', 'rows', 'result'] as const) {
      const v = res[k];
      if (Array.isArray(v)) return v;
    }
  }
  return [];
}

/* -------------------- ADMIN types -------------------- */

/** Admin UI view (normalized) */
export type EmailTemplateAdminView = {
  id: string;
  key: string; // template_key || key
  name: string; // template_name || name || title
  subject: string;
  content_html: string;
  variables: string[];
  is_active: boolean;
  locale: string | null;
  created_at?: string;
  updated_at?: string;
};

/** Admin create body (BE schema aligned) */
export type EmailTemplateAdminCreateBody = {
  template_key: string;
  template_name: string;
  subject: string;
  content: string; // HTML string
  variables?: unknown; // string[] | "a,b" | json string
  is_active?: BoolLike;
  locale?: string | null;
};

/** Admin patch body */
export type EmailTemplateAdminPatchBody = Partial<EmailTemplateAdminCreateBody>;

/* -------------------- PUBLIC types -------------------- */

/** Public list params */
export type EmailTemplatesPublicListParams = {
  q?: string;
  key?: string;
  is_active?: boolean;
  limit?: number;
  offset?: number;
  orderBy?: 'created_at' | 'updated_at' | 'template_key';
  order?: 'asc' | 'desc';
};

/** Public view (single-language) */
export type EmailTemplatePublic = {
  id: string;
  key: string;
  name: string;
  subject: string;
  content_html: string;
  variables: string[];
  is_active: boolean;
};

/** Render request body */
export type RenderTemplateByKeyBody = {
  vars?: Record<string, unknown>;
};

/** Render response */
export type EmailTemplateRenderResp = {
  ok: boolean;
  html: string;
  subject?: string;
  error?: string;
  raw?: unknown;
};

/* -------------------- normalizers -------------------- */

export function normalizeEmailTemplateAdmin(row: unknown): EmailTemplateAdminView {
  const r: Obj = isObj(row) ? row : {};

  const htmlSrc = r.body_html ?? r.content ?? r.html ?? r.body;

  const created_at =
    typeof r.created_at === 'string' && r.created_at.trim() ? r.created_at : undefined;
  const updated_at =
    typeof r.updated_at === 'string' && r.updated_at.trim() ? r.updated_at : undefined;

  return {
    id: toStr(r.id).trim(),
    key: toStr(r.template_key ?? r.key).trim(),
    name: toStr(r.template_name ?? r.name ?? r.title).trim(),
    subject: toStr(r.subject ?? r.mail_subject ?? r.title).trim(),
    content_html: extractHtml(htmlSrc),
    variables: toArrayOfStrings(r.variables),
    is_active: toBool(asBoolLike(r.is_active)),
    locale: toOptStr(r.locale),
    ...(created_at ? { created_at } : {}),
    ...(updated_at ? { updated_at } : {}),
  };
}

export function normalizeEmailTemplateAdminList(res: unknown): EmailTemplateAdminView[] {
  return pluckArray(res).map((x) => normalizeEmailTemplateAdmin(x));
}

export function normalizeEmailTemplatePublic(row: unknown): EmailTemplatePublic {
  const r: Obj = isObj(row) ? row : {};
  const htmlSrc = r.body_html ?? r.content ?? r.html ?? r.body;

  return {
    id: toStr(r.id).trim(),
    key: toStr(r.template_key ?? r.key).trim(),
    name: toStr(r.template_name ?? r.name ?? r.title).trim(),
    subject: toStr(r.subject ?? r.mail_subject ?? r.title).trim(),
    content_html: extractHtml(htmlSrc),
    variables: toArrayOfStrings(r.variables),
    is_active: toBool(asBoolLike(r.is_active)),
  };
}

export function normalizeEmailTemplatePublicList(res: unknown): EmailTemplatePublic[] {
  return pluckArray(res).map((x) => normalizeEmailTemplatePublic(x));
}

export function normalizeEmailTemplateRenderResp(res: unknown): EmailTemplateRenderResp {
  const r: Obj = isObj(res) ? res : {};

  // ok: ok|success tolerant
  const okRaw = r.ok ?? r.success;
  const ok = typeof okRaw === 'boolean' ? okRaw : toBool(asBoolLike(okRaw));

  const html =
    typeof r.html === 'string'
      ? r.html
      : typeof r.content === 'string'
      ? r.content
      : typeof res === 'string'
      ? res
      : '';

  const subject = typeof r.subject === 'string' && r.subject.trim() ? r.subject : undefined;

  const error =
    typeof r.error === 'string' ? r.error : typeof r.message === 'string' ? r.message : undefined;

  return {
    ok,
    html,
    ...(subject ? { subject } : {}),
    ...(error ? { error } : {}),
    raw: res,
  };
}

/* -------------------- query builders -------------------- */

export function toEmailTemplatesPublicQuery(p?: EmailTemplatesPublicListParams): string {
  if (!p) return '';
  const sp = new URLSearchParams();

  if (p.q) sp.set('q', p.q);
  if (p.key) sp.set('key', p.key);
  if (typeof p.is_active === 'boolean') sp.set('is_active', p.is_active ? '1' : '0');

  if (typeof p.limit === 'number') sp.set('limit', String(p.limit));
  if (typeof p.offset === 'number') sp.set('offset', String(p.offset));

  if (p.orderBy) sp.set('orderBy', p.orderBy);
  if (p.order) sp.set('order', p.order);

  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}
