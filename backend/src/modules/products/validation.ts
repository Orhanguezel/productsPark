// =============================================================
// FILE: src/modules/products/validation.ts
// =============================================================

import { z } from "zod";

const tryParseJson = (v: unknown) => {
  if (typeof v !== "string") return v;
  const s = v.trim();
  if (!s) return v;
  try {
    return JSON.parse(s);
  } catch {
    return v;
  }
};

const jsonArray = <T extends z.ZodTypeAny>(item: T) =>
  z.preprocess(tryParseJson, z.array(item));

const jsonStringArray = () =>
  z.preprocess(tryParseJson, z.array(z.string()));


const toNullIfEmpty = (v: unknown) => {
  if (typeof v === "string" && v.trim() === "") return null;
  return v;
};

const nullableUuid = () =>
  z.preprocess(
    toNullIfEmpty,
    z.string().uuid().optional().nullable()
  );

const nullableUrl = () =>
  z.preprocess(
    toNullIfEmpty,
    z.string().url().max(500).optional().nullable()
  );

/** products */
/** products */
export const productCreateSchema = z.object({
  id: z.string().uuid().optional(),

  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255),

  description: z.string().optional().nullable(),
  short_description: z.string().max(500).optional().nullable(),

  category_id: z.string().uuid().optional().nullable(),

  price: z.coerce.number(),
  original_price: z.coerce.number().optional().nullable(),
  cost: z.coerce.number().optional().nullable(),

  // Legacy URL (korunuyor)
  image_url: nullableUrl(),

  // Yeni storage alanları
  featured_image: nullableUrl(),
  featured_image_asset_id: z.string().min(1).max(200).optional().nullable(),
  featured_image_alt: z.string().max(255).optional().nullable(),

  gallery_urls: jsonStringArray().optional().nullable(),
  gallery_asset_ids: jsonArray(z.string().min(1)).optional().nullable(),

  features: z.array(z.string()).optional().nullable(),

  rating: z.coerce.number().min(0).max(5).optional(),
  review_count: z.coerce.number().int().min(0).optional(),
  sales_count: z.coerce.number().int().min(0).optional(),

  product_type: z.string().max(50).optional().nullable(),
  delivery_type: z.enum(['manual', 'auto_stock', 'file', 'api']).optional().nullable(),

  custom_fields: jsonArray(
    z.object({
      id: z.string(),
      label: z.string(),
      type: z.enum(['text', 'email', 'phone', 'url', 'textarea']),
      placeholder: z.string().optional().nullable(),
      required: z.boolean().default(false),
    }),
  )
    .optional()
    .nullable(),

  quantity_options: jsonArray(
    z.object({
      quantity: z.coerce.number().int().min(0), // min(1) yerine min(0)
      price: z.coerce.number().min(0),
    }),
  )
    .optional()
    .nullable(),

  // ✅ Boş bırakılırsa null say
  api_provider_id: nullableUuid(),
  api_product_id: z.string().max(64).optional().nullable(),
  api_quantity: z.coerce.number().int().optional().nullable(),

  meta_title: z.string().max(255).optional().nullable(),
  meta_description: z.string().max(500).optional().nullable(),

  article_content: z.string().optional().nullable(),
  article_enabled: z.coerce.number().int().min(0).max(1).optional().default(0),

  // ✅ Boş bırakılırsa null say
  demo_url: nullableUrl(),
  demo_embed_enabled: z.coerce.number().int().min(0).max(1).optional().default(0),
  demo_button_text: z.string().max(100).optional().nullable(),

  badges: jsonArray(
    z.object({
      text: z.string(),
      icon: z.string().optional().nullable(),
      active: z.boolean(),
    }),
  )
    .optional()
    .nullable(),

  sku: z.string().max(100).optional().nullable(),
  stock_quantity: z.coerce.number().int().min(0).optional().default(0),

  is_active: z.coerce.number().int().min(0).max(1).optional().default(1),
  is_featured: z.coerce.number().int().min(0).max(1).optional().default(0),

  requires_shipping: z.coerce.number().int().min(0).max(1).optional().default(1),

  is_digital: z.coerce.number().int().min(0).max(1).optional().default(0),
  auto_delivery_enabled: z.coerce.number().int().min(0).max(1).optional().default(0),
  pre_order_enabled: z.coerce.number().int().min(0).max(1).optional().default(0),
  min_order: z.coerce.number().int().optional().nullable(),
  max_order: z.coerce.number().int().optional().nullable(),
  min_barem: z.coerce.number().int().optional().nullable(),
  max_barem: z.coerce.number().int().optional().nullable(),
  barem_step: z.coerce.number().int().optional().nullable(),
  tax_type: z.coerce.number().int().optional().nullable(),
});

export const productUpdateSchema = productCreateSchema.partial();


export type ProductCreateInput = z.infer<typeof productCreateSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;

/** product_faqs */
export const productFaqCreateSchema = z.object({
  id: z.string().uuid().optional(),
  product_id: z.string().uuid(),
  question: z.string().min(1).max(500),
  answer: z.string().min(1),
  display_order: z.coerce.number().int().min(0).optional().default(0),
  is_active: z.coerce.number().int().min(0).max(1).optional().default(1),
});
export const productFaqUpdateSchema = productFaqCreateSchema.partial();
export type ProductFaqCreateInput = z.infer<typeof productFaqCreateSchema>;
export type ProductFaqUpdateInput = z.infer<typeof productFaqUpdateSchema>;

/** product_options (şimdilik kullanılmıyor ama şema tam) */
export const productOptionCreateSchema = z.object({
  id: z.string().uuid().optional(),
  product_id: z.string().uuid(),
  option_name: z.string().min(1).max(100),
  option_values: z.array(z.string()).min(1),
});
export const productOptionUpdateSchema = productOptionCreateSchema.partial();
export type ProductOptionCreateInput = z.infer<typeof productOptionCreateSchema>;
export type ProductOptionUpdateInput = z.infer<typeof productOptionUpdateSchema>;

/** product_reviews */
export const productReviewCreateSchema = z.object({
  id: z.string().uuid().optional(),
  product_id: z.string().uuid(),
  user_id: z.string().uuid().optional().nullable(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().optional().nullable(),
  is_active: z.coerce.number().int().min(0).max(1).optional().default(1),
  customer_name: z.string().max(255).optional().nullable(),
  review_date: z.coerce.date().optional().nullable(),
});
export const productReviewUpdateSchema = productReviewCreateSchema.partial();
export type ProductReviewCreateInput = z.infer<typeof productReviewCreateSchema>;
export type ProductReviewUpdateInput = z.infer<typeof productReviewUpdateSchema>;

/** product_stock */
export const productStockCreateSchema = z.object({
  id: z.string().uuid().optional(),
  product_id: z.string().uuid(),
  stock_content: z.string().min(1).max(255), // FE/DB uyumlu alan
  is_used: z.coerce.number().int().min(0).max(1).optional().default(0),
  used_at: z.coerce.date().optional().nullable(),
  order_item_id: z.string().uuid().optional().nullable(),
});
export const productStockUpdateSchema = productStockCreateSchema.partial();
export type ProductStockCreateInput = z.infer<typeof productStockCreateSchema>;
export type ProductStockUpdateInput = z.infer<typeof productStockUpdateSchema>;

/* ----------------- SPEC ----------------- */
export const productSpecCreateSchema = z.object({
  id: z.string().uuid().optional(),
  product_id: z.string().uuid(),
  name: z.string().min(1).max(255),
  value: z.string().min(1),
  category: z.enum(["physical", "material", "service", "custom"]).default("custom"),
  order_num: z.coerce.number().int().min(0).optional().default(0),
});
export const productSpecUpdateSchema = productSpecCreateSchema.partial();
export type ProductSpecCreateInput = z.infer<typeof productSpecCreateSchema>;
export type ProductSpecUpdateInput = z.infer<typeof productSpecUpdateSchema>;
