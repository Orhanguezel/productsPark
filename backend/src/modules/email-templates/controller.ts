// =============================================================
// FILE: src/modules/email-templates/public.controller.ts
// =============================================================
import type { FastifyReply, FastifyRequest } from "fastify";
import { and, desc, eq, isNull, or } from "drizzle-orm";
import { db } from "@/db/client";
import { email_templates, type EmailTemplateRow } from "./schema";
import {
  extractVariablesFromText,
  parseVariablesColumn,
  toBool,
  renderTextWithParams,
} from "./utils";
import { renderByKeySchema } from "./validation";

// ✅ site_settings tablosu için import (schema sende farklıysa path’i uyarlarsın)
import {siteSettings } from "@/modules/siteSettings/schema";

type ListQuery = {
  locale?: string | null;
  is_active?: string | number | boolean;
  q?: string;
};

/* ------------------------------------------------------------------
   SITE NAME HELPER (site_settings → site_name)
   ------------------------------------------------------------------ */

let cachedSiteName: string | null = null;
let cachedSiteNameLoadedAt: number | null = null;

async function getSiteNameFromSettings(): Promise<string> {
  const now = Date.now();
  // 5 dakikalık basit cache
  if (cachedSiteName && cachedSiteNameLoadedAt && now - cachedSiteNameLoadedAt < 5 * 60_000) {
    return cachedSiteName;
  }

  // 1) site_title
  const [titleRow] = await db
    .select({ value: siteSettings.value })
    .from(siteSettings)
    .where(eq(siteSettings.key, "site_title"))
    .limit(1);

  if (titleRow?.value) {
    cachedSiteName = String(titleRow.value);
    cachedSiteNameLoadedAt = now;
    return cachedSiteName;
  }

  // 2) footer_company_name
  const [companyRow] = await db
    .select({ value: siteSettings.value })
    .from(siteSettings)
    .where(eq(siteSettings.key, "footer_company_name"))
    .limit(1);

  if (companyRow?.value) {
    cachedSiteName = String(companyRow.value);
    cachedSiteNameLoadedAt = now;
    return cachedSiteName;
  }

  // 3) Fallback
  cachedSiteName = "Site";
  cachedSiteNameLoadedAt = now;
  return cachedSiteName;
}

/** vars içine site_name yoksa settings’ten inject eder */
async function enrichParamsWithSiteName(
  params: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  // Kullanıcı zaten site_name gönderdiyse override ETME
  if (Object.prototype.hasOwnProperty.call(params, "site_name")) {
    return params;
  }

  const siteName = await getSiteNameFromSettings();
  return {
    ...params,
    site_name: siteName,
  };
}

/* ------------------------------------------------------------------
   LIST
   ------------------------------------------------------------------ */

export async function listEmailTemplatesPublic(
  req: FastifyRequest<{ Querystring: ListQuery }>,
  reply: FastifyReply,
) {
  try {
    const { locale, is_active, q } = req.query;
    const filters = [];

    if (typeof is_active !== "undefined") {
      filters.push(eq(email_templates.is_active, toBool(is_active) ? 1 : 0));
    } else {
      // public default: sadece aktifleri ver
      filters.push(eq(email_templates.is_active, 1));
    }

    if (locale === null) {
      filters.push(isNull(email_templates.locale));
    } else if (typeof locale === "string" && locale.length > 0) {
      filters.push(eq(email_templates.locale, locale));
    }

    if (q && q.trim().length > 0) {
      filters.push(
        or(
          eq(email_templates.template_key, q),
          eq(email_templates.template_name, q), // basit örnek
        ),
      );
    }

    const where = filters.length ? and(...filters) : undefined;

    const rows = await db
      .select()
      .from(email_templates)
      .where(where as any)
      .orderBy(desc(email_templates.updated_at));

    const out = rows.map((r) => ({
      id: r.id,
      key: r.template_key,
      name: r.template_name,
      subject: r.subject,
      content_html: r.content,
      variables:
        parseVariablesColumn(r.variables) ?? extractVariablesFromText(r.content),
      is_active: toBool(r.is_active),
      locale: r.locale ?? null,
      created_at: r.created_at,
      updated_at: r.updated_at,
    }));

    return reply.send(out);
  } catch (e) {
    req.log.error(e);
    return reply
      .code(500)
      .send({ error: { message: "email_templates_list_failed" } });
  }
}

/** GET by key with locale preference (exact → null fallback) */
export async function getEmailTemplateByKeyPublic(
  req: FastifyRequest<{
    Params: { key: string };
    Querystring: { locale?: string };
  }>,
  reply: FastifyReply,
) {
  try {
    const { key } = req.params;
    const { locale } = req.query;

    // 1) exact match (key + locale)
    if (locale) {
      const [exact] = await db
        .select()
        .from(email_templates)
        .where(
          and(
            eq(email_templates.template_key, key),
            eq(email_templates.is_active, 1),
            eq(email_templates.locale, locale),
          ),
        )
        .limit(1);

      if (exact) {
        return reply.send({
          id: exact.id,
          key: exact.template_key,
          name: exact.template_name,
          subject: exact.subject,
          content_html: exact.content,
          variables:
            parseVariablesColumn(exact.variables) ??
            extractVariablesFromText(exact.content),
          is_active: true,
          locale: exact.locale ?? null,
          created_at: exact.created_at,
          updated_at: exact.updated_at,
        });
      }
    }

    // 2) fallback: key + NULL locale
    const [fallback] = await db
      .select()
      .from(email_templates)
      .where(
        and(
          eq(email_templates.template_key, key),
          eq(email_templates.is_active, 1),
          isNull(email_templates.locale),
        ),
      )
      .limit(1);

    if (!fallback)
      return reply.code(404).send({ error: { message: "not_found" } });

    return reply.send({
      id: fallback.id,
      key: fallback.template_key,
      name: fallback.template_name,
      subject: fallback.subject,
      content_html: fallback.content,
      variables:
        parseVariablesColumn(fallback.variables) ??
        extractVariablesFromText(fallback.content),
      is_active: true,
      locale: fallback.locale ?? null,
      created_at: fallback.created_at,
      updated_at: fallback.updated_at,
    });
  } catch (e) {
    req.log.error(e);
    return reply
      .code(500)
      .send({ error: { message: "email_template_get_failed" } });
  }
}

/** POST /email_templates/by-key/:key/render  (public render helper) */
export async function renderTemplateByKeyPublic(
  req: FastifyRequest<{
    Params: { key: string };
    Body: { params?: Record<string, unknown> };
    Querystring: { locale?: string };
  }>,
  reply: FastifyReply,
) {
  try {
    const parsed = renderByKeySchema.parse({
      key: req.params.key,
      locale: req.query?.locale,
      params: req.body?.params ?? {},
    });

    // aynı seçim stratejisi
    const { key, locale } = parsed;
    const baseParams: Record<string, unknown> = parsed.params || {};

    // ✅ site_settings → site_name inject
    const params = await enrichParamsWithSiteName(baseParams);

    let row: EmailTemplateRow | undefined;

    if (locale) {
      const [exact] = await db
        .select()
        .from(email_templates)
        .where(
          and(
            eq(email_templates.template_key, key),
            eq(email_templates.is_active, 1),
            eq(email_templates.locale, locale),
          ),
        )
        .limit(1);
      row = exact;
    }

    if (!row) {
      const [fallback] = await db
        .select()
        .from(email_templates)
        .where(
          and(
            eq(email_templates.template_key, key),
            eq(email_templates.is_active, 1),
            isNull(email_templates.locale),
          ),
        )
        .limit(1);
      row = fallback;
    }

    if (!row)
      return reply.code(404).send({ error: { message: "not_found" } });

    const subject = renderTextWithParams(row.subject, params);
    const body = renderTextWithParams(row.content, params);
    const required =
      parseVariablesColumn(row.variables) ??
      extractVariablesFromText(row.content);

    // ✅ eksik listesi enriched params üstünden hesaplanmalı
    const missing = required.filter((k) => !(k in (params || {})));

    return reply.send({
      id: row.id,
      key: row.template_key,
      name: row.template_name,
      subject,
      body,
      required_variables: required,
      missing_variables: missing,
      updated_at: row.updated_at,
    });
  } catch (e) {
    if ((e as any)?.name === "ZodError") {
      return reply.code(400).send({
        error: { message: "validation_error", details: (e as any).issues },
      });
    }
    req.log.error(e);
    return reply
      .code(500)
      .send({ error: { message: "email_template_render_failed" } });
  }
}
