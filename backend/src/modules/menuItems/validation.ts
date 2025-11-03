import { z } from 'zod';

const boolLike = z.union([
  z.boolean(),
  z.literal(0), z.literal(1),
  z.literal('0'), z.literal('1'),
  z.literal('true'), z.literal('false'),
]);

// ---------- Public ----------
export const menuItemCreateSchema = z.object({
  title: z.string().min(1).max(100),
  url: z.string().min(1).max(500),
  parent_id: z.string().uuid().nullable().optional(),
  position: z.number().int().min(0).optional(),
  order_num: z.number().int().min(0).optional(),
  is_active: boolLike.optional().default(true),

  // FE tipinde var, DB’de yok → kabul/yoksay
  icon: z.string().nullable().optional(),
  section_id: z.string().uuid().nullable().optional(),
  href: z.string().nullable().optional(),
  slug: z.string().nullable().optional(),
  locale: z.string().nullable().optional(),
});
export const menuItemUpdateSchema = menuItemCreateSchema.partial();

export const menuItemListQuerySchema = z.object({
  select: z.string().optional(),
  parent_id: z.string().uuid().nullable().optional(),
  is_active: boolLike.optional(),
  location: z.string().optional(),
  section_id: z.string().uuid().nullable().optional(),
  locale: z.string().optional(),
  // "display_order|position|order_num|created_at|updated_at[.desc]"
  order: z.string().optional(),
  limit: z.union([z.string(), z.number()]).optional(),
  offset: z.union([z.string(), z.number()]).optional(),
});

// ---------- Admin ----------
export const adminMenuItemListQuerySchema = z.object({
  q: z.string().optional(),
  location: z.enum(['header', 'footer']).optional(),
  section_id: z.string().uuid().nullable().optional(),
  parent_id: z.string().uuid().nullable().optional(),
  is_active: boolLike.optional(),
  sort: z.enum(['display_order', 'created_at', 'title']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
  limit: z.coerce.number().int().min(1).max(1000).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export const adminMenuItemUpsertBase = z.object({
  title: z.string().min(1).max(100),
  url: z.string().nullable(),                       // DB: url (NOT NULL) — create'de boş stringe düşeceğiz
  type: z.enum(['page', 'custom']),
  page_id: z.string().uuid().nullable().optional(),
  parent_id: z.string().uuid().nullable().optional(),
  location: z.enum(['header', 'footer']),
  icon: z.string().max(64).nullable().optional(),
  section_id: z.string().uuid().nullable().optional(),
  is_active: boolLike.optional().default(true),
  display_order: z.number().int().min(0).optional(),
});

// Create: "custom" için url zorunlu (burada refine)
export const adminMenuItemCreateSchema = adminMenuItemUpsertBase.refine(
  (v) => v.type === 'custom' ? !!(v.url && v.url.trim().length > 0) : true,
  { message: 'url_required_for_custom', path: ['url'] }
);

// Update: partial (refine yok; alan göndermediyse zorlamayız)
export const adminMenuItemUpdateSchema = adminMenuItemUpsertBase.partial();

export const adminMenuItemReorderSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().uuid(),
      display_order: z.number().int().min(0),
    })
  ).min(1),
});

// ---------- Types ----------
export type MenuItemCreateInput = z.infer<typeof menuItemCreateSchema>;
export type MenuItemUpdateInput = z.infer<typeof menuItemUpdateSchema>;
export type MenuItemListQuery   = z.infer<typeof menuItemListQuerySchema>;

export type AdminMenuItemListQuery  = z.infer<typeof adminMenuItemListQuerySchema>;
export type AdminMenuItemCreate     = z.infer<typeof adminMenuItemCreateSchema>;
export type AdminMenuItemUpdate     = z.infer<typeof adminMenuItemUpdateSchema>;
export type AdminMenuItemReorder    = z.infer<typeof adminMenuItemReorderSchema>;
