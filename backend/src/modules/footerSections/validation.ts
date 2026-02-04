// ----------------------------------------------------------------------
// FILE: src/modules/footer_sections/validation.ts
// ----------------------------------------------------------------------
import { z } from "zod";

/** Link tipi (public/admin ortak) */
export const footerLinkSchema = z.object({
  label: z.string().min(1).max(200),
  href: z.string().min(1).max(1000),
  external: z.boolean().optional(),
});

/* -------------------- Public -------------------- */

export const footerSectionCreateSchema = z.object({
  title: z.string().min(1).max(100),
  // links: JSON string veya array -> string'e dönüştürüyoruz
  links: z
    .union([z.string().min(2), z.array(footerLinkSchema)])
    .transform((v: string | typeof footerLinkSchema["_type"][]) => (typeof v === "string" ? v : JSON.stringify(v))),
  order_num: z.coerce.number().int().min(0).default(0),
  is_active: z.coerce.boolean().default(true),
});

export const footerSectionUpdateSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  links: z
    .union([z.string().min(2), z.array(footerLinkSchema)])
    .transform((v: string | typeof footerLinkSchema["_type"][]) => (typeof v === "string" ? v : JSON.stringify(v)))
    .optional(),
  order_num: z.coerce.number().int().min(0).optional(),
  is_active: z.coerce.boolean().optional(),
});

export const footerSectionListQuerySchema = z.object({
  q: z.string().optional(),
  is_active: z
    .union([z.literal("1"), z.literal("0"), z.literal("true"), z.literal("false")])
    .transform((v: "1" | "0" | "true" | "false") => v === "1" || v === "true")
    .optional(),
  order: z.enum(["asc", "desc"]).optional(), // order_num yönü
  limit: z.coerce.number().int().min(1).max(1000).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

/* -------------------- Admin -------------------- */

export const adminFooterSectionListQuerySchema = z.object({
  q: z.string().optional(),
  is_active: z
    .union([z.literal("1"), z.literal("0"), z.literal("true"), z.literal("false")])
    .transform((v: "1" | "0" | "true" | "false") => v === "1" || v === "true")
    .optional(),
  sort: z.enum(["display_order", "created_at", "title"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
  limit: z.coerce.number().int().min(1).max(1000).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

const adminFooterSectionUpsertBase = z.object({
  title: z.string().min(1).max(100),
  links: z
    .union([z.string().min(2), z.array(footerLinkSchema)])
    .transform((v: string | typeof footerLinkSchema["_type"][]) => (typeof v === "string" ? v : JSON.stringify(v)))
    .nullable()
    .optional(),
  display_order: z.coerce.number().int().min(0).optional(),
  is_active: z.coerce.boolean().optional(), // ✅ eklendi
});

// Create: links boş string olmasın
export const adminFooterSectionCreateSchema = adminFooterSectionUpsertBase.refine(
  (v: z.infer<typeof adminFooterSectionUpsertBase>) => v.links == null || (typeof v.links === "string" ? v.links.trim().length > 0 : true),
  { path: ["links"], message: "links_required_or_valid_json" }
);

// Update: partial
export const adminFooterSectionUpdateSchema = adminFooterSectionUpsertBase.partial();

export const adminFooterSectionReorderSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().uuid(),
        display_order: z.coerce.number().int().min(0),
      })
    )
    .min(1),
});

/* -------------------- Types -------------------- */
export type FooterSectionCreateInput = z.infer<typeof footerSectionCreateSchema>;
export type FooterSectionUpdateInput = z.infer<typeof footerSectionUpdateSchema>;
export type FooterSectionListQuery = z.infer<typeof footerSectionListQuerySchema>;

export type AdminFooterSectionListQuery = z.infer<typeof adminFooterSectionListQuerySchema>;
export type AdminFooterSectionCreate = z.infer<typeof adminFooterSectionCreateSchema>;
export type AdminFooterSectionUpdate = z.infer<typeof adminFooterSectionUpdateSchema>;
export type AdminFooterSectionReorder = z.infer<typeof adminFooterSectionReorderSchema>;
