// src/modules/profiles/validation.ts

import { z } from 'zod';

const optionalUrl = z
  .string()
  .trim()
  .max(2048)
  .optional()
  .refine((v: string | undefined) => v === undefined || v.length === 0 || /^https?:\/\//i.test(v), {
    message: 'url_must_start_with_http',
  })
  .transform((v: string | undefined) => {
    const s = (v ?? '').trim();
    return s.length ? s : undefined;
  });

export const profileUpsertSchema = z.object({
  full_name: z.string().min(1).max(191).optional(),
  phone: z.string().max(64).optional(),
  avatar_url: optionalUrl,

  address_line1: z.string().max(255).optional(),
  address_line2: z.string().max(255).optional(),
  city: z.string().max(128).optional(),
  country: z.string().max(128).optional(),
  postal_code: z.string().max(32).optional(),

  // social (optional)
  website_url: optionalUrl,
  instagram_url: optionalUrl,
  facebook_url: optionalUrl,
  x_url: optionalUrl,
  linkedin_url: optionalUrl,
  youtube_url: optionalUrl,
  tiktok_url: optionalUrl,
});

export type ProfileUpsertInput = z.infer<typeof profileUpsertSchema>;
