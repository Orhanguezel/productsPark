// =============================================================
// FILE: src/modules/email-templates/service.ts
// =============================================================
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import {
  email_templates,
  type EmailTemplateRow,
} from "./schema";
import {
  extractVariablesFromText,
  parseVariablesColumn,
  renderTextWithParams,
} from "./utils";

// Render sonucu FE/BE tarafında kullanılabilir
export interface RenderedEmailTemplate {
  template: EmailTemplateRow;
  subject: string;
  html: string;
  required_variables: string[];
  missing_variables: string[];
}

/**
 * DB'den template'i (key + locale) bulur, params ile render eder.
 *  - Önce exact locale
 *  - Bulamazsa locale NULL fallback
 *  - Aktif (is_active = 1) zorunlu
 */
export async function renderEmailTemplateByKey(
  key: string,
  params: Record<string, unknown> = {},
  locale?: string | null,
): Promise<RenderedEmailTemplate | null> {
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

  if (!row) return null;

  const subject = renderTextWithParams(row.subject, params);
  const html = renderTextWithParams(row.content, params);

  const required =
    parseVariablesColumn(row.variables) ??
    extractVariablesFromText(row.content);

  const missing = required.filter((k) => !(k in (params || {})));

  return {
    template: row,
    subject,
    html,
    required_variables: required,
    missing_variables: missing,
  };
}
