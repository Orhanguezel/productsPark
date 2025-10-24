// src/modules/cart/validation.ts
import { z } from "zod";

export const cartItemListQuerySchema = z.object({
  user_id: z.string().uuid().optional(),
  with: z.string().optional(),
  sort: z.enum(["created_at", "updated_at"]).optional().default("created_at"),
  order: z.enum(["asc", "desc"]).optional().default("desc"),
  limit: z.coerce.number().int().positive().max(500).optional(),
  offset: z.coerce.number().int().nonnegative().optional(),
});
export type CartItemListQuery = z.infer<typeof cartItemListQuerySchema>;

const optionsShape = z.record(z.unknown()).optional(); // JSON objesi

export const cartItemCreateSchema = z.object({
  user_id: z.string().uuid(),
  product_id: z.string().uuid(),
  quantity: z.coerce.number().int().min(1).default(1),
  // Her iki alanı da kabul et, biri varsa onu kullanacağız (controller'da).
  selected_options: optionsShape,
  options: optionsShape,
});
export type CartItemCreateInput = z.infer<typeof cartItemCreateSchema>;

export const cartItemUpdateSchema = z.object({
  quantity: z.coerce.number().int().min(1).optional(),
  selected_options: optionsShape,
  options: optionsShape,
});
export type CartItemUpdateInput = z.infer<typeof cartItemUpdateSchema>;
