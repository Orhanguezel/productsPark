// =============================================================
// FILE: src/modules/email-templates/_shared.ts
// FINAL — Shared helpers (site_name cache + row mapping)
// =============================================================

import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { siteSettings } from '@/modules/siteSettings/schema';
import type { EmailTemplateRow } from '@/modules/email-templates/schema';
import {
  extractVariablesFromText,
  parseVariablesColumn,
  toBool,
} from '@/modules/email-templates/utils';

let cachedSiteName: string | null = null;
let cachedSiteNameLoadedAt: number | null = null;

async function getSiteNameFromSettings(): Promise<string> {
  const now = Date.now();

  if (cachedSiteName && cachedSiteNameLoadedAt && now - cachedSiteNameLoadedAt < 5 * 60_000) {
    return cachedSiteName;
  }

  const [titleRow] = await db
    .select({ value: siteSettings.value })
    .from(siteSettings)
    .where(eq(siteSettings.key, 'site_title'))
    .limit(1);

  if (titleRow?.value) {
    cachedSiteName = String(titleRow.value);
    cachedSiteNameLoadedAt = now;
    return cachedSiteName;
  }

  const [companyRow] = await db
    .select({ value: siteSettings.value })
    .from(siteSettings)
    .where(eq(siteSettings.key, 'footer_company_name'))
    .limit(1);

  if (companyRow?.value) {
    cachedSiteName = String(companyRow.value);
    cachedSiteNameLoadedAt = now;
    return cachedSiteName;
  }

  cachedSiteName = 'Site';
  cachedSiteNameLoadedAt = now;
  return cachedSiteName;
}

export async function enrichParamsWithSiteName(
  params: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  if (Object.prototype.hasOwnProperty.call(params, 'site_name')) return params;
  const siteName = await getSiteNameFromSettings();
  return { ...params, site_name: siteName };
}

export function mapTemplateRowPublic(r: EmailTemplateRow) {
  const content = r.content ?? '';
  const parsedVars = parseVariablesColumn(r.variables);

  return {
    id: r.id,
    key: r.template_key,
    name: r.template_name,
    subject: r.subject,
    content_html: content,
    variables: parsedVars ?? (content ? extractVariablesFromText(content) : []),
    is_active: toBool(r.is_active),
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}
