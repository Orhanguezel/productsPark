import { z } from "zod";

export const couponListQuerySchema = z.object({
  is_active: z
    .union([z.string(), z.number(), z.boolean()])
    .transform((v: unknown) => v === true || v === 1 || v === '1' || v === 'true')
    .optional(),
  q: z.string().optional(), // code içinde arama
  limit: z.coerce.number().int().positive().max(500).optional(),
  offset: z.coerce.number().int().nonnegative().optional(),
  sort: z.enum(["created_at", "updated_at"]).optional().default("created_at"),
  order: z.enum(["asc", "desc"]).optional().default("desc"),
});

export type CouponListQuery = z.infer<typeof couponListQuerySchema>;
