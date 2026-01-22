// ===================================================================
// FILE: src/modules/newsletter/controller.ts (PUBLIC)
// FINAL — Newsletter Public Controller (Single Language)
// - locale removed
// ===================================================================

import type { RouteHandler } from 'fastify';
import { randomUUID } from 'crypto';
import { db } from '@/db/client';
import { eq } from 'drizzle-orm';
import { newsletterSubscribers, type NewsletterRow, type NewsletterInsert } from './schema';
import {
  newsletterSubscribeSchema,
  newsletterUnsubscribeSchema,
  type NewsletterSubscribeInput,
  type NewsletterUnsubscribeInput,
} from './validation';

function parseMeta(metaStr: unknown): any {
  const s = String(metaStr ?? '').trim();
  if (!s) return null;
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

// DB row → API output
function mapRow(row: NewsletterRow) {
  return {
    id: row.id,
    email: row.email,
    is_verified: !!row.is_verified,
    meta: parseMeta(row.meta),
    created_at: row.created_at,
    updated_at: row.updated_at,
    unsubscribed_at: row.unsubscribed_at ?? null,

    // legacy-ish aliases
    subscribeDate: row.created_at,
    unsubscribeDate: row.unsubscribed_at ?? null,
  };
}

/**
 * PUBLIC: POST /newsletter/subscribe
 * - Email'i upsert eder
 * - unsubscribed_at'ı NULL'a çeker (re-subscribe)
 */
export const subscribeNewsletterPublic: RouteHandler = async (req, reply) => {
  const parsed = newsletterSubscribeSchema.safeParse((req.body ?? {}) as NewsletterSubscribeInput);
  if (!parsed.success) {
    return reply.code(400).send({
      error: 'INVALID_BODY',
      details: parsed.error.flatten(),
    });
  }

  const body = parsed.data;
  const email = body.email.trim().toLowerCase();
  const metaStr = body.meta ? JSON.stringify(body.meta) : '{}';
  const now = new Date();

  const insert: NewsletterInsert = {
    id: randomUUID(),
    email,
    is_verified: false,
    meta: metaStr,
    unsubscribed_at: null,
    created_at: now as any,
    updated_at: now as any,
  };

  await db
    .insert(newsletterSubscribers)
    .values(insert)
    .onDuplicateKeyUpdate({
      set: {
        meta: metaStr,
        unsubscribed_at: null,
        updated_at: now as any,
      },
    });

  const [row] = await db
    .select()
    .from(newsletterSubscribers)
    .where(eq(newsletterSubscribers.email, email))
    .limit(1);

  return reply.code(201).send(mapRow(row));
};

/**
 * PUBLIC: POST /newsletter/unsubscribe
 * - Email varsa unsubscribed_at = NOW
 * - Yoksa da 200 { ok: true } döner (email enumeration engelleme)
 */
export const unsubscribeNewsletterPublic: RouteHandler = async (req, reply) => {
  const parsed = newsletterUnsubscribeSchema.safeParse(
    (req.body ?? {}) as NewsletterUnsubscribeInput,
  );
  if (!parsed.success) {
    return reply.code(400).send({
      error: 'INVALID_BODY',
      details: parsed.error.flatten(),
    });
  }

  const body = parsed.data;
  const email = body.email.trim().toLowerCase();
  const now = new Date();

  await db
    .update(newsletterSubscribers)
    .set({
      unsubscribed_at: now as any,
      updated_at: now as any,
    })
    .where(eq(newsletterSubscribers.email, email));

  return reply.send({ ok: true });
};
