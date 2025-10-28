import { z } from 'zod';

const jsonArrayStr = z
  .string()
  .refine((s) => { try {
      const v = JSON.parse(s);
      return Array.isArray(v) && v.every((x) => typeof x === 'string');
    } catch { return false; }
  }, 'variables must be a JSON string of string[]');

const variablesUnion = z
  .union([z.array(z.string()), jsonArrayStr, z.null(), z.undefined()])
  .transform((v) => {
    if (v == null) return null;
    if (Array.isArray(v)) return JSON.stringify(v);
    // DB'den gelen "çifte JSON'lanmış" olasılığı için normalize etmeyi controller yapacak.
    return v; // string (JSON)
  });

export const emailTemplateCreateSchema = z.object({
  name: z.string().min(1).max(100),
  subject: z.string().min(1).max(255),
  body: z.string().min(1),
  variables: variablesUnion.optional().nullable(), // JSON string (string[]) ya da array
});

export const emailTemplateUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  subject: z.string().min(1).max(255).optional(),
  body: z.string().min(1).optional(),
  variables: variablesUnion.optional().nullable(),
});

export const renderByIdSchema = z.object({
  id: z.string().uuid(),
  params: z.record(z.any()).default({}),
});

export const renderByNameSchema = z.object({
  name: z.string().min(1).max(100),
  params: z.record(z.any()).default({}),
});

export type EmailTemplateCreateInput = z.infer<typeof emailTemplateCreateSchema>;
export type EmailTemplateUpdateInput = z.infer<typeof emailTemplateUpdateSchema>;
