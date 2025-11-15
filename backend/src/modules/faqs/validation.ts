import { z } from "zod";

export const boolLike = z.union([
  z.boolean(),
  z.literal(0), z.literal(1),
  z.literal("0"), z.literal("1"),
  z.literal("true"), z.literal("false"),
]);

/** LIST query (admin/public aynı) */
export const faqListQuerySchema = z.object({
  order: z.string().optional(),
  sort: z.enum(["created_at", "updated_at", "display_order"]).optional(),
  orderDir: z.enum(["asc", "desc"]).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  offset: z.coerce.number().int().min(0).optional(),
  is_active: boolLike.optional(),
  q: z.string().optional(),
  slug: z.string().optional(),
  category: z.string().optional(),
  select: z.string().optional(),
});
export type FaqListQuery = z.infer<typeof faqListQuerySchema>;

/** CREATE/UPSERT body */
export const upsertFaqBodySchema = z.object({
  question: z.string().min(1).max(500).trim(),
  slug: z
    .string()
    .min(1).max(255)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug sadece küçük harf, rakam ve tire içermelidir")
    .trim(),
  answer: z.string().min(1),

  category: z.string().max(255).nullable().optional(),
  is_active: boolLike.optional().default(true),
  display_order: z.coerce.number().int().min(0).optional(),

  /** DB’de olmayan alan; gönderilirse controller’da yoksayılır */
  locale: z.string().max(10).nullable().optional(),
});
export type UpsertFaqBody = z.infer<typeof upsertFaqBodySchema>;

/** PATCH body */
export const patchFaqBodySchema = upsertFaqBodySchema.partial();
export type PatchFaqBody = z.infer<typeof patchFaqBodySchema>;
