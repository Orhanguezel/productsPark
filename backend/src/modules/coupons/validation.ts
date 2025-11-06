// src/modules/coupons/validation.ts
import { z } from "zod";

export const couponListQuerySchema = z.object({
  is_active: z.union([z.literal(0), z.literal(1), z.boolean()]).optional(),
  q: z.string().optional(), // code içinde arama
  limit: z.coerce.number().int().positive().max(500).optional(),
  offset: z.coerce.number().int().nonnegative().optional(),
  sort: z.enum(["created_at", "updated_at"]).optional().default("created_at"),
  order: z.enum(["asc", "desc"]).optional().default("desc"),
});

export type CouponListQuery = z.infer<typeof couponListQuerySchema>;
