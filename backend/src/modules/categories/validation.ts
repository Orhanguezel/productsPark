import { z } from 'zod';

export const categoryCreateSchema = z.object({
  id: z.string().uuid().optional(), // yoksa server üretir
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
  image_url: z.string().url().max(500).optional().nullable(),
  icon: z.string().max(100).optional().nullable(),
  parent_id: z.string().uuid().optional().nullable(),
  is_featured: z.coerce.number().int().min(0).max(1).optional().default(0),
  display_order: z.coerce.number().int().min(0).optional().default(0),
});

export const categoryUpdateSchema = categoryCreateSchema
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: 'no_fields_to_update' });

export type CategoryCreateInput = z.infer<typeof categoryCreateSchema>;
export type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>;
