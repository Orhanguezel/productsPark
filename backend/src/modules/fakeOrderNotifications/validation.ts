import { z } from "zod";

export const IdParamSchema = z.object({ id: z.string().min(1) });

export const ListQuerySchema = z.object({
  is_active: z.union([z.string(), z.number(), z.boolean()]).optional(),
  q: z.string().trim().min(1).max(255).optional(),
  order: z.string().optional(),   // "created_at.desc"
  limit: z.coerce.number().int().min(1).max(200).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export const CreateBodySchema = z.object({
  product_name: z.string().trim().min(1),
  customer: z.string().trim().min(1).max(100),
  location: z.string().trim().min(1).max(100).optional().nullable(),
  time_ago: z.string().trim().min(1).max(50),
  is_active: z.boolean().optional().default(true),
});

export const UpdateBodySchema = CreateBodySchema.partial().refine(
  (v) => Object.keys(v).length > 0,
  { message: "empty_body" }
);

