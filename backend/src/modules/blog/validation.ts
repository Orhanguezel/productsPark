import { z } from 'zod';

const urlOrEmptyToNull = z
  .string()
  .max(500)
  .url()
  .optional()
  .nullable()
  .or(z.literal('').transform(() => null));

const categorySchema = z
  .string()
  .max(120)
  .transform((s: string) => s.trim())
  .optional()
  .nullable()
  .transform((v: string | null | undefined) => (v == null ? null : v.trim() ? v.trim() : null));

export const blogCreateSchema = z.object({
  title: z.string().min(1).max(255),
  slug: z.string().min(1).max(255).optional(),
  excerpt: z.string().max(500).optional().nullable(),
  content: z.string().min(1),

  // ✅ NEW
  category: categorySchema,

  featured_image: urlOrEmptyToNull.optional(),
  featured_image_asset_id: z.string().uuid().optional().nullable(),
  featured_image_alt: z.string().max(255).optional().nullable(),

  author: z.string().max(100).optional().nullable(),
  meta_title: z.string().max(255).optional().nullable(),
  meta_description: z.string().max(500).optional().nullable(),
  is_published: z.coerce.boolean().optional(),
  is_featured: z.coerce.boolean().optional(),
  published_at: z.coerce.date().optional().nullable(),
  revision_reason: z.string().max(255).optional(),
});

export const blogUpdateSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  slug: z.string().min(1).max(255).optional(),
  excerpt: z.string().max(500).optional().nullable(),
  content: z.string().min(1).optional(),

  // ✅ NEW
  category: categorySchema,

  featured_image: urlOrEmptyToNull.optional(),
  featured_image_asset_id: z.string().uuid().optional().nullable(),
  featured_image_alt: z.string().max(255).optional().nullable(),

  author: z.string().max(100).optional().nullable(),
  meta_title: z.string().max(255).optional().nullable(),
  meta_description: z.string().max(500).optional().nullable(),
  is_published: z.coerce.boolean().optional(),
  is_featured: z.coerce.boolean().optional(),
  published_at: z.coerce.date().optional().nullable(),
  revision_reason: z.string().max(255).optional(),
});

export const blogPublishSchema = z.object({
  published_at: z.coerce.date().optional(),
  revision_reason: z.string().max(255).optional(),
});

export const blogUnpublishSchema = z.object({
  revision_reason: z.string().max(255).optional(),
});

export const blogRestoreSchema = z.object({
  slug: z.string().min(1).max(255).optional(),
  revision_reason: z.string().max(255).optional(),
});

export const blogRevertSchema = z.object({
  reason: z.string().max(255).optional(),
});
