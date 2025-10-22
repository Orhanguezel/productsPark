import { z } from 'zod';

export const cartItemCreateSchema = z.object({
  id: z.string().uuid().optional(),
  product_id: z.string().uuid(),
  quantity: z.coerce.number().int().min(1).default(1),
  options: z.any().optional().nullable(), // JSON
});

export const cartItemUpdateSchema = z.object({
  quantity: z.coerce.number().int().min(1).optional(),
  options: z.any().optional().nullable(),
});

export type CartItemCreateInput = z.infer<typeof cartItemCreateSchema>;
export type CartItemUpdateInput = z.infer<typeof cartItemUpdateSchema>;
