import { z } from "zod";

export const boolLike = z.union([
  z.boolean(),
  z.literal(0), z.literal(1),
  z.literal("0"), z.literal("1"),
  z.literal("true"), z.literal("false"),
]);

/** LIST query (admin/public aynı) */
export const customPageListQuerySchema = z.object({
  order: z.string().optional(),
  sort: z.enum(["created_at", "updated_at"]).optional(),
  orderDir: z.enum(["asc", "desc"]).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  offset: z.coerce.number().int().min(0).optional(),
  is_published: boolLike.optional(),
  q: z.string().optional(),
  slug: z.string().optional(),
  select: z.string().optional(),
});
export type CustomPageListQuery = z.infer<typeof customPageListQuerySchema>;

/** CREATE / UPSERT body */
export const upsertCustomPageBodySchema = z.object({
  title: z.string().min(1).max(255).trim(),
  slug: z
    .string()
    .min(1).max(255)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug sadece küçük harf, rakam ve tire içermelidir")
    .trim(),
  /** düz HTML (repo.packContent ile {"html": "..."}’a sarılır) */
  content: z.string().min(1),

  /** Görsel alanları */
  featured_image: z.string().url().nullable().optional(),
  featured_image_asset_id: z.string().length(36).nullable().optional(),
  featured_image_alt: z.string().max(255).nullable().optional(),

  meta_title: z.string().max(255).nullable().optional(),
  meta_description: z.string().max(500).nullable().optional(),
  is_published: boolLike.optional().default(false),

  /** DB’de sütun yok; gönderilirse controller’da yoksayılır */
  locale: z.string().max(10).nullable().optional(),
});
export type UpsertCustomPageBody = z.infer<typeof upsertCustomPageBodySchema>;

/** PATCH body (hepsi opsiyonel) */
export const patchCustomPageBodySchema = upsertCustomPageBodySchema.partial();
export type PatchCustomPageBody = z.infer<typeof patchCustomPageBodySchema>;
