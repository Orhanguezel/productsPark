// src/modules/categories/validation.ts
import { z } from 'zod';

const emptyToNull = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((v) => (v === '' ? null : v), schema);

export const boolLike = z.union([
  z.boolean(),
  z.literal(0), z.literal(1),
  z.literal('0'), z.literal('1'),
  z.literal('true'), z.literal('false'),
]);

export const categoryCreateSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255),

  description: emptyToNull(z.string().optional().nullable()),
  image_url: emptyToNull(z.string().url().max(500).optional().nullable()),
  icon: emptyToNull(z.string().max(100).optional().nullable()),
  parent_id: emptyToNull(z.string().uuid().optional().nullable()),

  is_active: boolLike.optional(),
  is_featured: boolLike.optional(),
  display_order: z.coerce.number().int().min(0).optional(),

  // FE'den gelebilen ama DB'de kolon olmayan alanları tolere et
  seo_title: emptyToNull(z.string().max(255).optional().nullable()),
  seo_description: emptyToNull(z.string().max(500).optional().nullable()),
})
.strict()
.passthrough();

export const categoryUpdateSchema = categoryCreateSchema
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: 'no_fields_to_update' });

export type CategoryCreateInput = z.infer<typeof categoryCreateSchema>;
export type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>;
