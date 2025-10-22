import { z } from 'zod';

const contentJsonString = z
  .string()
  .refine((s) => { try { JSON.parse(s); return true; } catch { return false; } }, 'content must be a valid JSON string');
const contentObject = z.record(z.any());

export const customPageCreateSchema = z.object({
  title: z.string().min(1).max(255),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(), // yoksa otomatik üretilecek
  auto_slug: z.boolean().optional(), // true ise slug verilse bile title’dan üretilir
  content: z.union([contentJsonString, contentObject]),
  meta_title: z.string().max(255).optional().nullable(),
  meta_description: z.string().max(500).optional().nullable(),
  is_published: z.union([z.coerce.number().int().min(0).max(1), z.boolean()]).optional().default(0),
});

export const customPageUpdateSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  auto_slug: z.boolean().optional(), // title değiştiyse ve auto_slug true ise slug yeniden üretilecek
  content: z.union([contentJsonString, contentObject]).optional(),
  meta_title: z.string().max(255).optional().nullable(),
  meta_description: z.string().max(500).optional().nullable(),
  is_published: z.union([z.coerce.number().int().min(0).max(1), z.boolean()]).optional(),
});

export type CustomPageCreateInput = z.infer<typeof customPageCreateSchema>;
export type CustomPageUpdateInput = z.infer<typeof customPageUpdateSchema>;
