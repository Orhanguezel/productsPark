// src/modules/payments/admin.providers.controller.ts
import crypto from 'crypto';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { and, eq, like, sql, type SQL } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/db/client';
import { setContentRange } from '@/common/utils/contentRange';
import { paymentProviders } from './schema';
import {
  parseJsonObject,
  toJsonString,
  isDupErr,
  hasNoSecretCol,
} from './admin.utils';

// ---------- validations ----------
const listProvidersAdminQuery = z
  .object({
    is_active: z
      .union([
        z.literal('1'),
        z.literal('0'),
        z.literal('true'),
        z.literal('false'),
      ])
      .optional(),
    q: z.string().optional(),
    limit: z.coerce.number().int().min(0).max(200).optional(),
    offset: z.coerce.number().int().min(0).optional(),
  })
  .partial();

const updateProviderAdminBody = z.object({
  key: z.string().min(1).optional(),
  display_name: z.string().min(1).optional(),
  is_active: z
    .union([
      z.boolean(),
      z.literal(0),
      z.literal(1),
      z.literal('0'),
      z.literal('1'),
      z.literal('true'),
      z.literal('false'),
    ])
    .optional(),
  public_config: z.record(z.unknown()).nullable().optional(),
  secret_config: z.record(z.unknown()).nullable().optional(),
});

const createProviderAdminBody = updateProviderAdminBody
  .extend({
    key: z.string().min(1),
    display_name: z.string().min(1),
  })
  .required({ key: true, display_name: true });

// ---------- mappers ----------
const mapProviderAdmin = (r: typeof paymentProviders.$inferSelect) => ({
  id: r.id,
  key: r.key,
  display_name: r.displayName,
  is_active: Boolean(r.isActive),
  public_config: parseJsonObject(r.publicConfig),
  secret_config: parseJsonObject((r as any).secretConfig),
});

// ---------- handlers ----------
export async function listPaymentProvidersAdminHandler(
  req: FastifyRequest<{
    Querystring: { is_active?: string; q?: string; limit?: string; offset?: string };
  }>,
  reply: FastifyReply
) {
  const parsed = listProvidersAdminQuery.safeParse(req.query);
  if (!parsed.success) {
    return reply
      .code(400)
      .send({ error: { message: 'validation_error', details: parsed.error.format() } });
  }

  const { is_active, q, limit = 200, offset = 0 } = parsed.data;

  const active =
    is_active === '1' || is_active === 'true'
      ? 1
      : is_active === '0' || is_active === 'false'
      ? 0
      : undefined;

  const conds: SQL[] = [];
  if (active !== undefined) conds.push(eq(paymentProviders.isActive, active));
  if (q) {
    const pat = `%${q}%`;
    conds.push(like(paymentProviders.displayName, pat));
  }

  const total =
    (
      await (conds.length
        ? db
            .select({ total: sql<number>`COUNT(*)`.as('total') })
            .from(paymentProviders)
            .where(and(...conds))
        : db
            .select({ total: sql<number>`COUNT(*)`.as('total') })
            .from(paymentProviders))
    )[0]?.total ?? 0;

  const rows = conds.length
    ? await db
        .select()
        .from(paymentProviders)
        .where(and(...conds))
        .orderBy(paymentProviders.displayName)
        .limit(Math.min(limit, 200))
        .offset(Math.max(offset, 0))
    : await db
        .select()
        .from(paymentProviders)
        .orderBy(paymentProviders.displayName)
        .limit(Math.min(limit, 200))
        .offset(Math.max(offset, 0));

  const data = rows.map(mapProviderAdmin);

  reply.header('x-total-count', String(total));
  reply.header('access-control-expose-headers', 'x-total-count, content-range');
  setContentRange(reply, offset, limit, total);

  return reply.send(data);
}

export async function getPaymentProviderAdminByIdHandler(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const [r] = await db
    .select()
    .from(paymentProviders)
    .where(eq(paymentProviders.id, req.params.id))
    .limit(1);

  if (!r) {
    return reply.code(404).send({ error: { message: 'not_found' } });
  }

  return reply.send(mapProviderAdmin(r));
}

export async function createPaymentProviderAdminHandler(
  req: FastifyRequest<{ Body: unknown }>,
  reply: FastifyReply
) {
  const parsed = createProviderAdminBody.safeParse(req.body ?? {});
  if (!parsed.success) {
    return reply.code(400).send({
      error: { message: 'validation_error', details: parsed.error.format() },
    });
  }

  const b = parsed.data;
  const id = crypto.randomUUID();
  const isActive =
    b.is_active === true ||
    b.is_active === 1 ||
    b.is_active === '1' ||
    b.is_active === 'true'
      ? 1
      : 0;

  const row = {
    id,
    key: b.key,
    displayName: b.display_name,
    isActive,
    publicConfig: toJsonString(b.public_config ?? null),
    secretConfig: toJsonString(b.secret_config ?? null),
  } as typeof paymentProviders.$inferInsert;

  try {
    await db
      .insert(paymentProviders)
      .values(row)
      .onDuplicateKeyUpdate({
        set: {
          displayName: row.displayName,
          isActive: row.isActive,
          publicConfig: row.publicConfig,
          ...(typeof (paymentProviders as any).secretConfig !== 'undefined'
            ? { secretConfig: row.secretConfig }
            : {}),
          updatedAt: sql`CURRENT_TIMESTAMP(3)`,
        },
      });
  } catch (e) {
    if (hasNoSecretCol(e)) {
      const { secretConfig, ...withoutSecret } = row;
      await db
        .insert(paymentProviders)
        .values(withoutSecret as any)
        .onDuplicateKeyUpdate({
          set: {
            displayName: row.displayName,
            isActive: row.isActive,
            publicConfig: row.publicConfig,
            updatedAt: sql`CURRENT_TIMESTAMP(3)`,
          },
        });
    } else if (isDupErr(e)) {
      // upsert zaten halletti; ekstra bir şey yapmıyoruz
    } else {
      throw e;
    }
  }

  const [out] = await db
    .select()
    .from(paymentProviders)
    .where(eq(paymentProviders.key, b.key))
    .limit(1);

  return reply.code(201).send(mapProviderAdmin(out));
}

export async function updatePaymentProviderAdminHandler(
  req: FastifyRequest<{ Params: { id: string }; Body: unknown }>,
  reply: FastifyReply
) {
  const parsed = updateProviderAdminBody.safeParse(req.body ?? {});
  if (!parsed.success) {
    return reply
      .code(400)
      .send({ error: { message: 'validation_error', details: parsed.error.format() } });
  }

  const b = parsed.data;
  const patch: Record<string, unknown> = {};

  if (b.key) patch['key'] = b.key;
  if (b.display_name) patch['displayName'] = b.display_name;
  if (b.is_active !== undefined) {
    patch['isActive'] =
      b.is_active === true ||
      b.is_active === 1 ||
      b.is_active === '1' ||
      b.is_active === 'true'
        ? 1
        : 0;
  }
  if (b.public_config !== undefined) {
    patch['publicConfig'] = toJsonString(b.public_config);
  }
  if (
    b.secret_config !== undefined &&
    typeof (paymentProviders as any).secretConfig !== 'undefined'
  ) {
    patch['secretConfig'] = toJsonString(b.secret_config);
  }

  await db
    .update(paymentProviders)
    .set(patch as any)
    .where(eq(paymentProviders.id, req.params.id));

  const [row] = await db
    .select()
    .from(paymentProviders)
    .where(eq(paymentProviders.id, req.params.id))
    .limit(1);

  if (!row) {
    return reply.code(404).send({ error: { message: 'not_found' } });
  }

  return reply.send(mapProviderAdmin(row));
}

export async function deletePaymentProviderAdminHandler(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  await db
    .delete(paymentProviders)
    .where(eq(paymentProviders.id, req.params.id));

  return reply.send({ success: true });
}
