import type { RouteHandler } from 'fastify';
import { randomUUID } from 'crypto';
import { db } from '@/db/client';
import { and, desc, eq, like } from 'drizzle-orm';
import {
  email_templates,
  type EmailTemplateInsert,
} from './schema';
import {
  emailTemplateCreateSchema,
  emailTemplateUpdateSchema,
  renderByIdSchema,
  renderByNameSchema,
} from './validation';
import {
  extractVariablesFromText,
  renderTextWithParams,
  parseVariablesColumn,
} from './renderer';

const now = () => new Date();

function normalizeVariablesInput(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === 'string') {
    // string ise geçerli JSON string olmalı (validation bunu sağlıyor)
    return v;
  }
  try {
    return JSON.stringify(v);
  } catch {
    return null;
  }
}

// GET /email_templates?q=...
export const listEmailTemplates: RouteHandler = async (req, reply) => {
  try {
    const q = (req.query as any)?.q as string | undefined;
    const where = q
      ? and(
          like(email_templates.name, `%${q}%` as any),
          like(email_templates.subject, `%${q}%` as any),
        )
      : undefined;

    const rows = await db
      .select()
      .from(email_templates)
      .where(where as any)
      .orderBy(desc(email_templates.updated_at));

    return reply.send(
      rows.map((r) => ({
        ...r,
        variables: parseVariablesColumn(r.variables),
        // body’de geçen gerçek placeholders:
        detected_variables: extractVariablesFromText(r.body),
      })),
    );
  } catch (e: any) {
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'email_templates_list_failed' } });
  }
};

// GET /email_templates/:id
export const getEmailTemplate: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  try {
    const [row] = await db.select().from(email_templates).where(eq(email_templates.id, id)).limit(1);
    if (!row) return reply.code(404).send({ error: { message: 'not_found' } });
    return reply.send({
      ...row,
      variables: parseVariablesColumn(row.variables),
      detected_variables: extractVariablesFromText(row.body),
    });
  } catch (e: any) {
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'email_template_get_failed' } });
  }
};

// GET /email_templates/name/:name
export const getEmailTemplateByName: RouteHandler = async (req, reply) => {
  const { name } = req.params as { name: string };
  try {
    const [row] = await db.select().from(email_templates).where(eq(email_templates.name, name)).limit(1);
    if (!row) return reply.code(404).send({ error: { message: 'not_found' } });
    return reply.send({
      ...row,
      variables: parseVariablesColumn(row.variables),
      detected_variables: extractVariablesFromText(row.body),
    });
  } catch (e: any) {
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'email_template_get_failed' } });
  }
};

// POST /email_templates
export const createEmailTemplate: RouteHandler = async (req, reply) => {
  try {
    const input = emailTemplateCreateSchema.parse(req.body || {});
    const id = randomUUID();

    const toInsert: EmailTemplateInsert = {
      id,
      name: input.name,
      subject: input.subject,
      body: input.body,
      variables: normalizeVariablesInput(input.variables) ?? null,
      created_at: now(),
      updated_at: now(),
    };

    await db.insert(email_templates).values(toInsert);

    const [row] = await db.select().from(email_templates).where(eq(email_templates.id, id)).limit(1);
    return reply.code(201).send({
      ...row,
      variables: parseVariablesColumn(row.variables),
      detected_variables: extractVariablesFromText(row.body),
    });
  } catch (e: any) {
    // uniq ihlali:
    if (String(e?.message || '').includes('ux_email_templates_name')) {
      return reply.code(409).send({ error: { message: 'name_exists' } });
    }
    if (e?.name === 'ZodError') {
      return reply.code(400).send({ error: { message: 'validation_error', details: e.issues } });
    }
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'email_template_create_failed' } });
  }
};

// PATCH /email_templates/:id
export const updateEmailTemplate: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  try {
    const patch = emailTemplateUpdateSchema.parse(req.body || {});

    const [row] = await db.select().from(email_templates).where(eq(email_templates.id, id)).limit(1);
    if (!row) return reply.code(404).send({ error: { message: 'not_found' } });

    const updateData: Partial<EmailTemplateInsert> = { updated_at: now() };
    if (patch.name !== undefined) updateData.name = patch.name;
    if (patch.subject !== undefined) updateData.subject = patch.subject;
    if (patch.body !== undefined) updateData.body = patch.body;
    if (patch.variables !== undefined) {
      updateData.variables = normalizeVariablesInput(patch.variables);
    }

    await db.update(email_templates).set(updateData).where(eq(email_templates.id, id));

    const [updated] = await db.select().from(email_templates).where(eq(email_templates.id, id)).limit(1);

    return reply.send({
      ...updated!,
      variables: parseVariablesColumn(updated!.variables),
      detected_variables: extractVariablesFromText(updated!.body),
    });
  } catch (e: any) {
    if (String(e?.message || '').includes('ux_email_templates_name')) {
      return reply.code(409).send({ error: { message: 'name_exists' } });
    }
    if (e?.name === 'ZodError') {
      return reply.code(400).send({ error: { message: 'validation_error', details: e.issues } });
    }
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'email_template_update_failed' } });
  }
};

// DELETE /email_templates/:id
export const deleteEmailTemplate: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  try {
    await db.delete(email_templates).where(eq(email_templates.id, id));
    return reply.code(204).send();
  } catch (e: any) {
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'email_template_delete_failed' } });
  }
};

// POST /email_templates/:id/render
export const renderById: RouteHandler = async (req, reply) => {
  try {
    const { id, params } = renderByIdSchema.parse({
      id: (req.params as any)?.id,
      params: (req.body as any)?.params ?? {},
    });

    const [tpl] = await db.select().from(email_templates).where(eq(email_templates.id, id)).limit(1);
    if (!tpl) return reply.code(404).send({ error: { message: 'not_found' } });

    const subject = renderTextWithParams(tpl.subject, params);
    const body = renderTextWithParams(tpl.body, params);
    const required = parseVariablesColumn(tpl.variables) ?? extractVariablesFromText(tpl.body);
    const missing = required.filter((k) => !(k in (params || {})));

    return reply.send({
      id: tpl.id,
      name: tpl.name,
      subject,
      body,
      required_variables: required,
      missing_variables: missing,
      updated_at: tpl.updated_at,
    });
  } catch (e: any) {
    if (e?.name === 'ZodError') {
      return reply.code(400).send({ error: { message: 'validation_error', details: e.issues } });
    }
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'email_template_render_failed' } });
  }
};

// POST /email_templates/name/:name/render
export const renderByName: RouteHandler = async (req, reply) => {
  try {
    const { name, params } = renderByNameSchema.parse({
      name: (req.params as any)?.name,
      params: (req.body as any)?.params ?? {},
    });

    const [tpl] = await db.select().from(email_templates).where(eq(email_templates.name, name)).limit(1);
    if (!tpl) return reply.code(404).send({ error: { message: 'not_found' } });

    const subject = renderTextWithParams(tpl.subject, params);
    const body = renderTextWithParams(tpl.body, params);
    const required = parseVariablesColumn(tpl.variables) ?? extractVariablesFromText(tpl.body);
    const missing = required.filter((k) => !(k in (params || {})));

    return reply.send({
      id: tpl.id,
      name: tpl.name,
      subject,
      body,
      required_variables: required,
      missing_variables: missing,
      updated_at: tpl.updated_at,
    });
  } catch (e: any) {
    if (e?.name === 'ZodError') {
      return reply.code(400).send({ error: { message: 'validation_error', details: e.issues } });
    }
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'email_template_render_failed' } });
  }
};
