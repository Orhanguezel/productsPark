// modules/topbar/validation.ts
import { z } from "zod";

const boolLike = z.union([
  z.boolean(),
  z.literal(0),
  z.literal(1),
  z.literal("0"),
  z.literal("1"),
  z.literal("true"),
  z.literal("false"),
]);

/* Public */
export const topbarPublicListQuerySchema = z.object({
  select: z.string().optional(), // şimdilik kullanılmıyor ama future-proof
  is_active: boolLike.optional(),
  // "created_at.desc" gibi
  order: z.string().optional(),
  limit: z.union([z.string(), z.number()]).optional(),
  offset: z.union([z.string(), z.number()]).optional(),
});
export type TopbarPublicListQuery = z.infer<typeof topbarPublicListQuerySchema>;

/* Admin */
export const adminTopbarListQuerySchema = z.object({
  q: z.string().optional(),
  is_active: boolLike.optional(),
  sort: z.enum(["created_at", "updated_at", "is_active", "text"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
  limit: z.coerce.number().int().min(1).max(1000).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});
export type AdminTopbarListQuery = z.infer<typeof adminTopbarListQuerySchema>;

const adminTopbarUpsertBase = z.object({
  text: z.string().min(1).max(255),
  link: z.string().max(500).nullable().optional(),
  coupon_id: z.string().uuid().nullable().optional(),
  is_active: boolLike.optional().default(false),
  show_ticker: boolLike.optional().default(false),
});

export const adminTopbarCreateSchema = adminTopbarUpsertBase;
export type AdminTopbarCreate = z.infer<typeof adminTopbarCreateSchema>;

export const adminTopbarUpdateSchema = adminTopbarUpsertBase.partial();
export type AdminTopbarUpdate = z.infer<typeof adminTopbarUpdateSchema>;
