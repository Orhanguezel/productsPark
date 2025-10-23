import { z } from 'zod';

const boolLike = z.union([z.boolean(), z.literal(0), z.literal(1), z.string()]);

export const popupListQuerySchema = z.object({
  // FE/RTK param uyumu
  locale: z.string().optional(),
  is_active: boolLike.optional(),
  type: z.enum(['modal', 'drawer', 'banner', 'toast']).optional(),

  // from.ts 'order' desteği: "priority.desc" vb — bilinmeyeni fallback’leyeceğiz
  order: z.string().optional(),

  limit: z.union([z.string(), z.number()]).optional(),
  offset: z.union([z.string(), z.number()]).optional(),

  // select paramı FE uyumu için kabul; kullanılmayacak
  select: z.string().optional(),
});

export type PopupListQuery = z.infer<typeof popupListQuerySchema>;
