// ===================================================================
// FILE: src/modules/payments/admin.providers.controller.ts
// FINAL — Admin Payment Providers
// Fixes:
// - secret_config default: masked (prevents leaking credentials)
// - optional include_secret=1 for admins (still masked by default; can unmask if mask_secret=false)
// - PATCH secret_config=null no longer wipes secrets accidentally
// - explicit clear_secret=true to wipe secret_config
// ===================================================================

import crypto from 'crypto';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { and, eq, like, sql, type SQL } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/db/client';
import { setContentRange } from '@/common/utils/contentRange';
import { paymentProviders } from './schema';
import { parseJsonObject, toJsonString, isDupErr, hasNoSecretCol } from './admin.utils';

// -----------------------------
// helpers
// -----------------------------

const toBoolLoose = (raw: unknown): boolean | undefined => {
  if (raw === undefined) return undefined;
  if (typeof raw === 'boolean') return raw;
  if (typeof raw === 'number') return raw === 1;
  if (typeof raw === 'string') {
    const s = raw.trim().toLowerCase();
    if (['1', 'true', 'yes', 'y', 'on', 'enabled'].includes(s)) return true;
    if (['0', 'false', 'no', 'n', 'off', 'disabled'].includes(s)) return false;
  }
  return undefined;
};

const maskSecrets = (obj: Record<string, unknown> | null): Record<string, unknown> | null => {
  if (!obj) return null;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = k.toLowerCase();
    const looksSecret =
      key.includes('key') ||
      key.includes('secret') ||
      key.includes('salt') ||
      key.includes('token') ||
      key.includes('pass') ||
      key.includes('private');

    if (!looksSecret) {
      out[k] = v;
      continue;
    }

    // keep small hints but mask value
    if (typeof v === 'string') {
      const s = v.trim();
      if (!s) out[k] = '';
      else if (s.length <= 6) out[k] = '******';
      else out[k] = `${s.slice(0, 2)}******${s.slice(-2)}`;
    } else if (typeof v === 'number') {
      out[k] = '******';
    } else {
      out[k] = '******';
    }
  }
  return out;
};

// -----------------------------
// validations
// -----------------------------

const listProvidersAdminQuery = z
  .object({
    is_active: z
      .union([z.literal('1'), z.literal('0'), z.literal('true'), z.literal('false')])
      .optional(),
    q: z.string().optional(),
    limit: z.coerce.number().int().min(0).max(200).optional(),
    offset: z.coerce.number().int().min(0).optional(),

    // NEW:
    include_secret: z
      .union([z.literal('1'), z.literal('0'), z.literal('true'), z.literal('false')])
      .optional(),
    mask_secret: z
      .union([z.literal('1'), z.literal('0'), z.literal('true'), z.literal('false')])
      .optional(),
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

  // NEW: explicit secret wipe
  clear_secret: z
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
});

const createProviderAdminBody = updateProviderAdminBody
  .extend({
    key: z.string().min(1),
    display_name: z.string().min(1),
  })
  .required({ key: true, display_name: true });

// -----------------------------
// mappers
// -----------------------------

const mapProviderAdmin = (
  r: typeof paymentProviders.$inferSelect,
  opts?: { includeSecret?: boolean; maskSecret?: boolean },
) => {
  const includeSecret = opts?.includeSecret ?? false;
  const maskSecret = opts?.maskSecret ?? true;

  const pub = parseJsonObject(r.publicConfig);
  const sec = includeSecret ? parseJsonObject((r as any).secretConfig) : null;

  return {
    id: r.id,
    key: r.key,
    display_name: r.displayName,
    is_active: Boolean(r.isActive),
    public_config: pub,
    secret_config: includeSecret ? (maskSecret ? maskSecrets(sec) : sec) : null,
  };
};

// -----------------------------
// handlers
// -----------------------------

export async function listPaymentProvidersAdminHandler(
  req: FastifyRequest<{
    Querystring: {
      is_active?: string;
      q?: string;
      limit?: string;
      offset?: string;
      include_secret?: string;
      mask_secret?: string;
    };
  }>,
  reply: FastifyReply,
) {
  const parsed = listProvidersAdminQuery.safeParse(req.query);
  if (!parsed.success) {
    return reply.code(400).send({
      error: { message: 'validation_error', details: parsed.error.format() },
    });
  }

  const { is_active, q, limit = 200, offset = 0, include_secret, mask_secret } = parsed.data;

  const active =
    is_active === '1' || is_active === 'true'
      ? 1
      : is_active === '0' || is_active === 'false'
        ? 0
        : undefined;

  const includeSecret = include_secret === '1' || include_secret === 'true';
  const maskSecret =
    mask_secret === undefined ? true : mask_secret === '1' || mask_secret === 'true';

  const conds: SQL[] = [];
  if (active !== undefined) conds.push(eq(paymentProviders.isActive, active));
  if (q) conds.push(like(paymentProviders.displayName, `%${q}%`));

  const total =
    (
      await (conds.length
        ? db
            .select({ total: sql<number>`COUNT(*)`.as('total') })
            .from(paymentProviders)
            .where(and(...conds))
        : db.select({ total: sql<number>`COUNT(*)`.as('total') }).from(paymentProviders))
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

  const data = rows.map((r) => mapProviderAdmin(r, { includeSecret, maskSecret }));

  reply.header('x-total-count', String(total));
  reply.header('access-control-expose-headers', 'x-total-count, content-range');
  setContentRange(reply, offset, limit, total);
  return reply.send(data);
}

export async function getPaymentProviderAdminByIdHandler(
  req: FastifyRequest<{
    Params: { id: string };
    Querystring?: { include_secret?: string; mask_secret?: string };
  }>,
  reply: FastifyReply,
) {
  const includeSecret =
    (req.query?.include_secret === '1' || req.query?.include_secret === 'true') ?? false;
  const maskSecret =
    req.query?.mask_secret === undefined
      ? true
      : req.query?.mask_secret === '1' || req.query?.mask_secret === 'true';

  const [r] = await db
    .select()
    .from(paymentProviders)
    .where(eq(paymentProviders.id, req.params.id))
    .limit(1);

  if (!r) return reply.code(404).send({ error: { message: 'not_found' } });
  return reply.send(mapProviderAdmin(r, { includeSecret, maskSecret }));
}

export async function createPaymentProviderAdminHandler(
  req: FastifyRequest<{ Body: unknown }>,
  reply: FastifyReply,
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
    b.is_active === true || b.is_active === 1 || b.is_active === '1' || b.is_active === 'true'
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
      const { secretConfig, ...withoutSecret } = row as any;
      await db
        .insert(paymentProviders)
        .values(withoutSecret)
        .onDuplicateKeyUpdate({
          set: {
            displayName: row.displayName,
            isActive: row.isActive,
            publicConfig: row.publicConfig,
            updatedAt: sql`CURRENT_TIMESTAMP(3)`,
          },
        });
    } else if (isDupErr(e)) {
      // upsert already handled
    } else {
      throw e;
    }
  }

  const [out] = await db
    .select()
    .from(paymentProviders)
    .where(eq(paymentProviders.key, b.key))
    .limit(1);

  // default: DO NOT return secrets on create
  return reply.code(201).send(mapProviderAdmin(out, { includeSecret: false, maskSecret: true }));
}

export async function updatePaymentProviderAdminHandler(
  req: FastifyRequest<{
    Params: { id: string };
    Body: unknown;
    Querystring?: { include_secret?: string; mask_secret?: string };
  }>,
  reply: FastifyReply,
) {
  const parsed = updateProviderAdminBody.safeParse(req.body ?? {});
  if (!parsed.success) {
    return reply.code(400).send({
      error: { message: 'validation_error', details: parsed.error.format() },
    });
  }

  const includeSecret =
    (req.query?.include_secret === '1' || req.query?.include_secret === 'true') ?? false;
  const maskSecret =
    req.query?.mask_secret === undefined
      ? true
      : req.query?.mask_secret === '1' || req.query?.mask_secret === 'true';

  const b = parsed.data;
  const patch: Record<string, unknown> = {};

  if (b.key) patch.key = b.key;
  if (b.display_name) patch.displayName = b.display_name;
  if (b.is_active !== undefined) {
    patch.isActive =
      b.is_active === true || b.is_active === 1 || b.is_active === '1' || b.is_active === 'true'
        ? 1
        : 0;
  }

  if (b.public_config !== undefined) {
    patch.publicConfig = toJsonString(b.public_config);
  }

  // SECRET handling:
  // - secret_config is ignored if null/undefined (prevents accidental wipe)
  // - explicit clear_secret=true wipes secretConfig
  const clearSecret = toBoolLoose(b.clear_secret) === true;

  if (clearSecret && typeof (paymentProviders as any).secretConfig !== 'undefined') {
    patch.secretConfig = null;
  } else if (
    b.secret_config !== undefined &&
    b.secret_config !== null &&
    typeof (paymentProviders as any).secretConfig !== 'undefined'
  ) {
    patch.secretConfig = toJsonString(b.secret_config);
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
  if (!row) return reply.code(404).send({ error: { message: 'not_found' } });

  // Default: secrets are not returned unless explicitly requested
  return reply.send(mapProviderAdmin(row, { includeSecret, maskSecret }));
}

export async function deletePaymentProviderAdminHandler(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  await db.delete(paymentProviders).where(eq(paymentProviders.id, req.params.id));
  return reply.send({ success: true });
}
