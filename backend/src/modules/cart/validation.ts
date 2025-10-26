// src/modules/cart/validation.ts
import { z } from "zod";

export const cartItemListQuerySchema = z.object({
  id: z.string().optional(),          // tekil id ile filtreleme
  user_id: z.string().optional(),
  product_id: z.string().optional(),  // ✅ FE’nin kullandığı filtre
  with: z.string().optional(),
  sort: z.enum(["created_at", "updated_at"]).optional().default("created_at"),
  order: z.enum(["asc", "desc"]).optional().default("desc"),
  limit: z.coerce.number().int().positive().max(500).optional(),
  offset: z.coerce.number().int().nonnegative().optional(),
});
export type CartItemListQuery = z.infer<typeof cartItemListQuerySchema>;

/** Seçenek gövdesi */
const optionsShape = z.record(z.unknown()).nullable().optional();

/** Supabase tarzı id’leri tolere et */
const idLike = z.string().uuid().or(z.string().min(8));

export const cartItemCreateSchema = z.object({
  user_id: idLike,
  product_id: idLike,
  quantity: z.coerce.number().int().min(1).default(1),
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
