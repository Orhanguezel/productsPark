// ===================================================================
// FILE: src/modules/newsletter/validation.ts
// FINAL — Newsletter Validation (Single Language)
// - i18n/locale removed
// ===================================================================

import { z } from 'zod';
import { boolLike } from '@/modules/_shared/common';

/**
 * PUBLIC: Subscribe
 */
export const newsletterSubscribeSchema = z.object({
  email: z.string().trim().email().max(255),
  // Tek dil: locale kaldırıldı
  meta: z.record(z.any()).optional(),
});

/**
 * PUBLIC: Unsubscribe
 */
export const newsletterUnsubscribeSchema = z.object({
  email: z.string().trim().email().max(255),
});

/**
 * ADMIN: List query
 */
export const newsletterListQuerySchema = z.object({
  q: z.string().trim().optional(), // email search
  email: z.string().trim().email().max(255).optional(),
  verified: boolLike.optional(), // is_verified
  subscribed: boolLike.optional(), // unsubscribed_at NULL / NOT NULL

  limit: z.coerce.number().int().min(1).max(1000).optional(),
  offset: z.coerce.number().int().min(0).optional(),

  orderBy: z.enum(['created_at', 'updated_at', 'email', 'verified']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
});

/**
 * ADMIN: Update
 */
export const newsletterAdminUpdateSchema = z.object({
  verified: boolLike.optional(),
  subscribed: boolLike.optional(), // true → aktif, false → unsubscribed_at now
  meta: z.record(z.any()).nullable().optional(),
});

// ---------- Types ----------

export type NewsletterSubscribeInput = z.infer<typeof newsletterSubscribeSchema>;
export type NewsletterUnsubscribeInput = z.infer<typeof newsletterUnsubscribeSchema>;
export type NewsletterListQuery = z.infer<typeof newsletterListQuerySchema>;
export type NewsletterAdminUpdateInput = z.infer<typeof newsletterAdminUpdateSchema>;
