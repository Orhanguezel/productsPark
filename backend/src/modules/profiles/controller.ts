// src/modules/profiles/controller.ts

import type { RouteHandler, FastifyRequest } from 'fastify';
import '@fastify/jwt';
import { db } from '@/db/client';
import { eq } from 'drizzle-orm';
import { profiles, type ProfileRow, type ProfileInsert } from './schema';
import { users } from '@/modules/auth/schema';
import { profileUpsertSchema, type ProfileUpsertInput } from './validation';
import { ZodError } from 'zod';

export type ProfileUpsertRequest = { profile: ProfileUpsertInput };

type JwtUser = { sub?: unknown };

// ✅ FE'ye döneceğimiz tip: profil column'ları + users.wallet_balance
export type ProfileWithWallet = ProfileRow & {
  wallet_balance: string; // decimal(10,2) → Drizzle select'te string
};

function getUserId(req: FastifyRequest): string {
  const payload = (req as unknown as { user?: JwtUser }).user;
  const subVal = payload?.sub;
  if (typeof subVal !== 'string' || subVal.length === 0) {
    throw new Error('unauthorized');
  }
  return subVal; // UUID
}

/**
 * ✅ Profili ve cüzdan bakiyesini 2 ayrı sorguyla al
 *   - profiles: profil alanları (ProfileRow)
 *   - users: wallet_balance
 *   Böylece Drizzle join'in "id: string | null" saçmalığıyla uğraşmıyoruz.
 */
async function selectProfileWithWallet(userId: string): Promise<ProfileWithWallet | null> {
  // 1) profil
  const [profileRow] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  if (!profileRow) {
    return null;
  }

  // 2) users.wallet_balance
  const [userRow] = await db
    .select({ wallet_balance: users.wallet_balance })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const wallet = userRow?.wallet_balance ?? '0.00';

  const merged: ProfileWithWallet = {
    ...profileRow,
    wallet_balance: wallet,
  };

  return merged;
}

/** GET /profiles/v1/me */
export const getMyProfile: RouteHandler = async (req, reply) => {
  try {
    const userId = getUserId(req);
    const row = await selectProfileWithWallet(userId);
    return reply.send(row ?? null);
  } catch (e: unknown) {
    req.log.error(e);
    if (e instanceof Error && e.message === 'unauthorized') {
      return reply.status(401).send({ error: { message: 'unauthorized' } });
    }
    return reply.status(500).send({ error: { message: 'profile_fetch_failed' } });
  }
};

/** PUT /profiles/v1/me (upsert) */
export const upsertMyProfile: RouteHandler<{ Body: ProfileUpsertRequest }> = async (req, reply) => {
  try {
    const userId = getUserId(req);
    const input = profileUpsertSchema.parse(req.body?.profile ?? {});

    const set: Partial<ProfileInsert> = {
      ...(input.full_name !== undefined ? { full_name: input.full_name } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.avatar_url !== undefined ? { avatar_url: input.avatar_url } : {}),
      ...(input.address_line1 !== undefined ? { address_line1: input.address_line1 } : {}),
      ...(input.address_line2 !== undefined ? { address_line2: input.address_line2 } : {}),
      ...(input.city !== undefined ? { city: input.city } : {}),
      ...(input.country !== undefined ? { country: input.country } : {}),
      ...(input.postal_code !== undefined ? { postal_code: input.postal_code } : {}),
      // wallet_balance BU TABLODA YOK; users tablosunda tutuluyor.
    };

    const existing = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, userId))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(profiles)
        .set({ ...set, updated_at: new Date() })
        .where(eq(profiles.id, userId));
    } else {
      const insertValues: ProfileInsert = {
        id: userId,
        ...set,
      };
      await db.insert(profiles).values(insertValues);
    }

    // ✅ Güncel profili yine wallet_balance ile birlikte dön
    const row = await selectProfileWithWallet(userId);
    return reply.send(row);
  } catch (e: unknown) {
    req.log.error(e);
    if (e instanceof ZodError) {
      return reply
        .status(400)
        .send({ error: { message: 'validation_error', details: e.issues } });
    }
    if (e instanceof Error && e.message === 'unauthorized') {
      return reply.status(401).send({ error: { message: 'unauthorized' } });
    }
    return reply.status(500).send({ error: { message: 'profile_upsert_failed' } });
  }
};
