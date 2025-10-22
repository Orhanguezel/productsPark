import { z } from 'zod';

export const discountTypes = ['percentage', 'fixed'] as const;

const dec2 = z.union([
  z.string().regex(/^-?\d+(\.\d{1,2})?$/),
  z.number().finite(),
]).transform(v => (typeof v === 'number' ? v.toFixed(2) : v));

export const couponCreateSchema = z.object({
  code: z.string().max(50),
  discount_type: z.enum(discountTypes),
  discount_value: dec2,
  min_purchase: dec2.optional().nullable(),
  max_discount: dec2.optional().nullable(),
  usage_limit: z.coerce.number().int().min(1).optional().nullable(),
  valid_from: z.coerce.date().optional().nullable(),
  valid_until: z.coerce.date().optional().nullable(),
  is_active: z.coerce.boolean().optional().default(true),
});

export const couponUpdateSchema = couponCreateSchema.partial();

export const couponValidateSchema = z.object({
  code: z.string().max(50),
  subtotal: dec2, // sepetteki ara toplam
});
