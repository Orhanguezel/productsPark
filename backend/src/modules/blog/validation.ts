import { z } from 'zod';

export const blogCreateSchema = z.object({
  title: z.string().min(1).max(255),
  slug: z.string().min(1).max(255).optional(),
  excerpt: z.string().max(500).optional().nullable(),
  content: z.string().min(1),
  featured_image: z.string().max(500).url().optional().nullable().or(z.literal('').transform(() => null)),
  author: z.string().max(100).optional().nullable(),
  meta_title: z.string().max(255).optional().nullable(),
  meta_description: z.string().max(500).optional().nullable(),
  is_published: z.coerce.boolean().optional(),
  published_at: z.coerce.date().optional().nullable(),
  // revision açıklaması
  revision_reason: z.string().max(255).optional(),
});

export const blogUpdateSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  slug: z.string().min(1).max(255).optional(),
  excerpt: z.string().max(500).optional().nullable(),
  content: z.string().min(1).optional(),
  featured_image: z.string().max(500).url().optional().nullable().or(z.literal('').transform(() => null)),
  author: z.string().max(100).optional().nullable(),
  meta_title: z.string().max(255).optional().nullable(),
  meta_description: z.string().max(500).optional().nullable(),
  is_published: z.coerce.boolean().optional(),
  published_at: z.coerce.date().optional().nullable(),
  revision_reason: z.string().max(255).optional(),
});

export const blogPublishSchema = z.object({
  published_at: z.coerce.date().optional(), // verilmezse now()
  revision_reason: z.string().max(255).optional(),
});

export const blogUnpublishSchema = z.object({
  revision_reason: z.string().max(255).optional(),
});

export const blogRestoreSchema = z.object({
  // isteğe bağlı: restore sırasında slug’ı manuel vermek istersen
  slug: z.string().min(1).max(255).optional(),
  revision_reason: z.string().max(255).optional(),
});

export const blogRevertSchema = z.object({
  reason: z.string().max(255).optional(), // revert açıklaması
});
