import { z } from "zod";

export const cartItemListQuerySchema = z.object({
  user_id: z.string().uuid().optional(),
  with: z.string().optional(), // ör: "products,products.categories" (şimdilik opsiyonel)
  sort: z.enum(["created_at", "updated_at"]).optional().default("created_at"),
  order: z.enum(["asc", "desc"]).optional().default("desc"),
  limit: z.coerce.number().int().positive().max(500).optional(),
  offset: z.coerce.number().int().nonnegative().optional(),
});

export type CartItemListQuery = z.infer<typeof cartItemListQuerySchema>;

export const cartItemCreateSchema = z.object({
  user_id: z.string().uuid(),
  product_id: z.string().uuid(),
  quantity: z.coerce.number().int().min(1).default(1),
  options: z.record(z.unknown()).optional(), // JSON objesi
});

export type CartItemCreateInput = z.infer<typeof cartItemCreateSchema>;

export const cartItemUpdateSchema = z.object({
  quantity: z.coerce.number().int().min(1).optional(),
  options: z.record(z.unknown()).optional(),
});

export type CartItemUpdateInput = z.infer<typeof cartItemUpdateSchema>;
