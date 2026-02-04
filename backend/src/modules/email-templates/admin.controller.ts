// =============================================================
// FILE: src/modules/email-templates/admin.controller.ts
// =============================================================
import type { RouteHandler } from "fastify";
import { randomUUID } from "crypto";
import { and, desc, eq, like, isNull, or, type SQL } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import {
  email_templates,
  type EmailTemplateInsert,
  type EmailTemplateRow,
} from "./schema";
import {
  emailTemplateCreateSchema,
  emailTemplateUpdateSchema,
  listQuerySchema,
} from "./validation";
import {
  extractVariablesFromText,
  parseVariablesColumn,
  toBool,
  now,
  normalizeVariablesInput,
} from "./utils";

type ListQuery = {
  q?: string;
  locale?: string | null;
  is_active?: string | number | boolean;
};

// and(...) her koşulda SQL döndürsün (union yok)
const andNonEmpty = (conds: SQL[]): SQL => (and(...conds) as SQL);

/** GET /admin/email_templates */
export const listEmailTemplatesAdmin: RouteHandler = async (req, reply) => {
  try {
    const parsed = listQuerySchema.safeParse((req as any).query);
    const qdata: ListQuery = parsed.success ? parsed.data : {};

    const filters: SQL[] = [];

    if (qdata.q && qdata.q.trim()) {
      const q = qdata.q.trim();
      filters.push(
        or(
          like(email_templates.template_key, `%${q}%`),
          like(email_templates.template_name, `%${q}%`),
          like(email_templates.subject, `%${q}%`),
          like(email_templates.content, `%${q}%`),
        ) as SQL
      );
    }

    if (typeof qdata.is_active !== "undefined") {
      filters.push(eq(email_templates.is_active, toBool(qdata.is_active) ? 1 : 0) as SQL);
    }

    if (qdata.locale === null) {
      filters.push(isNull(email_templates.locale) as SQL);
    } else if (typeof qdata.locale === "string" && qdata.locale.length > 0) {
      filters.push(eq(email_templates.locale, qdata.locale) as SQL);
    }

    let rows: EmailTemplateRow[];
    if (filters.length > 0) {
      const whereSql = andNonEmpty(filters);
      rows = await db
        .select()
        .from(email_templates)
        .where(whereSql)
        .orderBy(desc(email_templates.updated_at));
    } else {
      rows = await db
        .select()
        .from(email_templates)
        .orderBy(desc(email_templates.updated_at));
    }

    const out = rows.map((r) => ({
      ...r,
      variables: parseVariablesColumn(r.variables),
      detected_variables: extractVariablesFromText(r.content),
      is_active: toBool(r.is_active),
    }));

    return reply.send(out);
  } catch (e) {
    (req as any).log?.error?.(e);
    return reply.code(500).send({ error: { message: "email_templates_list_failed" } });
  }
};

/** GET /admin/email_templates/:id */
export const getEmailTemplateAdmin: RouteHandler = async (req, reply) => {
  try {
    const { id } = (req.params as { id?: string }) ?? {};
    if (!id) return reply.code(400).send({ error: { message: "invalid_id" } });

    const [row] = await db
      .select()
      .from(email_templates)
      .where(eq(email_templates.id, id))
      .limit(1);

    if (!row) return reply.code(404).send({ error: { message: "not_found" } });

    return reply.send({
      ...row,
      variables: parseVariablesColumn(row.variables),
      detected_variables: extractVariablesFromText(row.content),
      is_active: toBool(row.is_active),
    });
  } catch (e) {
    (req as any).log?.error?.(e);
    return reply.code(500).send({ error: { message: "email_template_get_failed" } });
  }
};

/** POST /admin/email_templates */
export const createEmailTemplateAdmin: RouteHandler = async (req, reply) => {
  try {
    const input = emailTemplateCreateSchema.parse(req.body ?? {});
    const id = randomUUID();

    const toInsert: EmailTemplateInsert = {
      id,
      template_key: input.template_key,
      template_name: input.template_name,
      subject: input.subject,
      content: input.content,
      variables: normalizeVariablesInput(input.variables),
      is_active:
        typeof input.is_active === "undefined" ? 1 : (toBool(input.is_active) ? 1 : 0),
      locale: input.locale ?? null,
      created_at: now(),
      updated_at: now(),
    };

    await db.insert(email_templates).values(toInsert);

    const [row] = await db
      .select()
      .from(email_templates)
      .where(eq(email_templates.id, id))
      .limit(1);

    return reply.code(201).send({
      ...row!,
      variables: parseVariablesColumn(row!.variables),
      detected_variables: extractVariablesFromText(row!.content),
      is_active: toBool(row!.is_active),
    });
  } catch (e) {
    const msg = String((e as Error).message || "");
    if (msg.includes("ux_email_tpl_key_locale")) {
      return reply.code(409).send({ error: { message: "key_exists_for_locale" } });
    }
    if (e instanceof z.ZodError) {
      return reply.code(400).send({
        error: { message: "validation_error" },
      });
    }
    (req as any).log?.error?.(e);
    return reply.code(500).send({ error: { message: "email_template_create_failed" } });
  }
};

/** PATCH /admin/email_templates/:id */
export const updateEmailTemplateAdmin: RouteHandler = async (req, reply) => {
  try {
    const { id } = (req.params as { id?: string }) ?? {};
    if (!id) return reply.code(400).send({ error: { message: "invalid_id" } });

    const patch = emailTemplateUpdateSchema.parse(req.body ?? {});
    const [row] = await db
      .select()
      .from(email_templates)
      .where(eq(email_templates.id, id))
      .limit(1);

    if (!row) return reply.code(404).send({ error: { message: "not_found" } });

    const updateData: Partial<EmailTemplateRow> = { updated_at: now() };

    if (typeof patch.template_key !== "undefined") updateData.template_key = patch.template_key;
    if (typeof patch.template_name !== "undefined") updateData.template_name = patch.template_name;
    if (typeof patch.subject !== "undefined") updateData.subject = patch.subject;
    if (typeof patch.content !== "undefined") updateData.content = patch.content;
    if (typeof patch.variables !== "undefined")
      updateData.variables = normalizeVariablesInput(patch.variables);
    if (typeof patch.is_active !== "undefined")
      updateData.is_active = toBool(patch.is_active) ? 1 : 0;
    if (typeof patch.locale !== "undefined") updateData.locale = patch.locale ?? null;

    await db.update(email_templates).set(updateData).where(eq(email_templates.id, id));

    const [updated] = await db
      .select()
      .from(email_templates)
      .where(eq(email_templates.id, id))
      .limit(1);

    return reply.send({
      ...updated!,
      variables: parseVariablesColumn(updated!.variables),
      detected_variables: extractVariablesFromText(updated!.content),
      is_active: toBool(updated!.is_active),
    });
  } catch (e) {
    const msg = String((e as Error).message || "");
    if (msg.includes("ux_email_tpl_key_locale")) {
      return reply.code(409).send({ error: { message: "key_exists_for_locale" } });
    }
    if (e instanceof z.ZodError) {
      return reply.code(400).send({
        error: { message: "validation_error" },
      });
    }
    (req as any).log?.error?.(e);
    return reply.code(500).send({ error: { message: "email_template_update_failed" } });
  }
};

/** DELETE /admin/email_templates/:id */
export const deleteEmailTemplateAdmin: RouteHandler = async (req, reply) => {
  try {
    const { id } = (req.params as { id?: string }) ?? {};
    if (!id) return reply.code(400).send({ error: { message: "invalid_id" } });

    await db.delete(email_templates).where(eq(email_templates.id, id));
    return reply.code(204).send();
  } catch (e) {
    (req as any).log?.error?.(e);
    return reply.code(500).send({ error: { message: "email_template_delete_failed" } });
  }
};
