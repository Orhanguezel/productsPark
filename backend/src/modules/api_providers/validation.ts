// src/modules/api_providers/validation.ts

import { z } from "zod";

const toAbsoluteUrl = (s: string) => {
  const raw = String(s || '').trim();
  if (!raw) return raw;
  try { new URL(raw); return raw; }
  catch { return `https://${raw.replace(/^\/*/, '')}`; }
};

export const ListQuerySchema = z.object({
  is_active: z.union([z.string(), z.number(), z.boolean()]).optional(),
  order: z.string().optional(), // "name.asc" | "desc" vs.
});

export const IdParamSchema = z.object({
  id: z.string().length(36, "id must be 36-char uuid"),
});

export const CreateBodySchema = z.object({
  name: z.string().min(1),
  provider_type: z.string().default("smm"),
  api_url: z.string().min(1)
    .transform(toAbsoluteUrl)
    .refine((v: string) => { try { new URL(v); return true; } catch { return false; } }, "Invalid url"),
  api_key: z.string().min(1),
  is_active: z.boolean().optional().default(true),
  credentials: z.record(z.unknown()).optional(),
});

export const UpdateBodySchema = CreateBodySchema.partial();
