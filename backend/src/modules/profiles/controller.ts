// =============================================================
// FILE: src/modules/profiles/controller.ts
// FINAL — add GET /profiles/:id (public)
// =============================================================

import type { RouteHandler, FastifyRequest } from 'fastify';
import '@fastify/jwt';

import { db } from '@/db/client';
import { eq } from 'drizzle-orm';

import { profiles, type ProfileRow, type ProfileInsert } from './schema';
import { profileUpsertSchema, type ProfileUpsertInput } from './validation';
import { z } from 'zod';

export type ProfileUpsertRequest = { profile: ProfileUpsertInput };
export type ProfileIdParams = { id: string };

type JwtUser = { sub?: unknown };

function getUserId(req: FastifyRequest): string {
  // requireAuth sonrası fastify-jwt payload'ını req.user'a yazar.
  const payload = (req as unknown as { user?: JwtUser }).user;
  const subVal = payload?.sub;
  if (typeof subVal !== 'string' || subVal.length === 0) {
    throw new Error('unauthorized');
  }
  return subVal; // UUID
}

const profileIdParamsSchema = z.object({
  id: z.string().uuid(),
});

// ---------------------------------------------------------------------
// ✅ Public: GET /profiles/:id
// ---------------------------------------------------------------------
export const getProfileByIdPublic: RouteHandler<{ Params: ProfileIdParams }> = async (
  req,
  reply,
) => {
  try {
    const { id } = profileIdParamsSchema.parse(req.params);

    const rows = await db.select().from(profiles).where(eq(profiles.id, id)).limit(1);
    const row: ProfileRow | undefined = rows[0];

    if (!row) {
      return reply.status(404).send({ error: { message: 'not_found' } });
    }

    return reply.send(row);
  } catch (e: unknown) {
    req.log.error(e);

    if (e instanceof z.ZodError) {
      return reply.status(400).send({ error: { message: 'validation_error' } });
    }

    return reply.status(500).send({ error: { message: 'profile_fetch_failed' } });
  }
};

// ---------------------------------------------------------------------
// Auth: GET /profiles/me
// ---------------------------------------------------------------------
export const getMyProfile: RouteHandler = async (req, reply) => {
  try {
    const userId = getUserId(req);
    const rows = await db.select().from(profiles).where(eq(profiles.id, userId)).limit(1);
    const row: ProfileRow | undefined = rows[0];
    return reply.send(row ?? null);
  } catch (e: unknown) {
    req.log.error(e);
    if (e instanceof Error && e.message === 'unauthorized') {
      return reply.status(401).send({ error: { message: 'unauthorized' } });
    }
    return reply.status(500).send({ error: { message: 'profile_fetch_failed' } });
  }
};

// ---------------------------------------------------------------------
// Auth: PUT /profiles/me (upsert)
// ---------------------------------------------------------------------
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

      // social (optional)
      ...(input.website_url !== undefined ? { website_url: input.website_url } : {}),
      ...(input.instagram_url !== undefined ? { instagram_url: input.instagram_url } : {}),
      ...(input.facebook_url !== undefined ? { facebook_url: input.facebook_url } : {}),
      ...(input.x_url !== undefined ? { x_url: input.x_url } : {}),
      ...(input.linkedin_url !== undefined ? { linkedin_url: input.linkedin_url } : {}),
      ...(input.youtube_url !== undefined ? { youtube_url: input.youtube_url } : {}),
      ...(input.tiktok_url !== undefined ? { tiktok_url: input.tiktok_url } : {}),
    };

    const existing = await db.select().from(profiles).where(eq(profiles.id, userId)).limit(1);

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

    const [row] = await db.select().from(profiles).where(eq(profiles.id, userId)).limit(1);
    return reply.send(row ?? null);
  } catch (e: unknown) {
    req.log.error(e);
    if (e instanceof z.ZodError) {
      return reply.status(400).send({ error: { message: 'validation_error' } });
    }
    if (e instanceof Error && e.message === 'unauthorized') {
      return reply.status(401).send({ error: { message: 'unauthorized' } });
    }
    return reply.status(500).send({ error: { message: 'profile_upsert_failed' } });
  }
};
