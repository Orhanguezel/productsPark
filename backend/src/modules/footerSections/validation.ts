import { z } from "zod";

/** Link tipi */
export const footerLinkSchema = z.object({
  label: z.string().min(1).max(200),
  href: z.string().min(1).max(1000),
  external: z.boolean().optional(),
});

/** Create */
export const footerSectionCreateSchema = z.object({
  title: z.string().min(1).max(100),
  // links: JSON string veya array
  links: z
    .union([z.string().min(2), z.array(footerLinkSchema)])
    .transform((v) => (typeof v === "string" ? v : JSON.stringify(v))),
  order_num: z.coerce.number().int().min(0).default(0),
});

/** Update (partial) */
export const footerSectionUpdateSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  links: z
    .union([z.string().min(2), z.array(footerLinkSchema)])
    .transform((v) => (typeof v === "string" ? v : JSON.stringify(v)))
    .optional(),
  order_num: z.coerce.number().int().min(0).optional(),
});
