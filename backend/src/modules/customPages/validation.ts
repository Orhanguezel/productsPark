import { z } from 'zod';

const boolLike = z.union([
  z.boolean(),
  z.literal(0), z.literal(1),
  z.literal('0'), z.literal('1'),
  z.literal('true'), z.literal('false')
]);

// Create
export const menuItemCreateSchema = z.object({
  title: z.string().min(1).max(100),              // DB: label
  url: z.string().min(1).max(500),
  parent_id: z.string().uuid().nullable().optional(),
  position: z.number().int().min(0).optional(),   // DB: order_num
  order_num: z.number().int().min(0).optional(),  // alternatif isim
  is_active: boolLike.optional().default(true),

  // DB'de yok ama FE tipinde var; kabul edip yoksayarız:
  icon: z.string().nullable().optional(),
  section_id: z.string().uuid().nullable().optional(),
  href: z.string().nullable().optional(),
  slug: z.string().nullable().optional(),
  locale: z.string().nullable().optional(),
});

// Update (partial)
export const menuItemUpdateSchema = menuItemCreateSchema.partial();

// List query
export const menuItemListQuerySchema = z.object({
  select: z.string().optional(), // FE gönderiyor; yoksayacağız
  parent_id: z.string().uuid().nullable().optional(),
  is_active: boolLike.optional(),

  // FE’de kullanılabilen ama DB’de olmayan filtreler (yoksay):
  location: z.string().optional(),
  section_id: z.string().uuid().nullable().optional(),
  locale: z.string().optional(),

  // sıralama: display_order/position/order_num/created_at/updated_at
  order: z.string().optional(),

  limit: z.union([z.string(), z.number()]).optional(),
  offset: z.union([z.string(), z.number()]).optional(),
});

export type MenuItemCreateInput = z.infer<typeof menuItemCreateSchema>;
export type MenuItemUpdateInput = z.infer<typeof menuItemUpdateSchema>;
export type MenuItemListQuery = z.infer<typeof menuItemListQuerySchema>;
