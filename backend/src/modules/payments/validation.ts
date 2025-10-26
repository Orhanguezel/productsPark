import { z } from 'zod';
import type { PaymentRequestStatus, PaymentSessionStatus } from './types';

/** Query helpers */
export const listProvidersQuery = z
  .object({
    is_active: z.union([z.literal('1'), z.literal('0'), z.literal('true'), z.literal('false')]).optional(),
  })
  .partial();

export const listPaymentRequestsQuery = z
  .object({
    user_id: z.string().uuid().optional(),
    order_id: z.string().uuid().optional(),
    status: z.custom<PaymentRequestStatus>().optional(),
    limit: z.coerce.number().int().min(0).max(100).optional(),
    offset: z.coerce.number().int().min(0).optional(),
  })
  .partial();

/** Bodies */
export const createPaymentRequestBody = z.object({
  id: z.string().uuid().optional(),
  order_id: z.string().uuid(),
  user_id: z.string().uuid().nullable().optional(),
  amount: z.union([z.number(), z.string()]),
  currency: z.string().min(1).default('TRY'),
  payment_method: z.string().min(1),
  // URL zorunlu değil; dosya yolu da olabilir
  proof_image_url: z.string().min(1).nullable().optional(),
  status: z.custom<PaymentRequestStatus>().default('pending'),
  admin_notes: z.string().nullable().optional(),
  processed_at: z.string().nullable().optional(),
});

export const createPaymentSessionBody = z.object({
  provider_key: z.string().min(1),
  order_id: z.string().uuid().optional(),
  amount: z.union([z.number(), z.string()]),
  currency: z.string().min(1),
  success_url: z.string().url().optional(),
  cancel_url: z.string().url().optional(),
  return_url: z.string().url().optional(),
  customer: z
    .object({
      id: z.string().optional(),
      email: z.string().email().optional(),
      name: z.string().optional(),
    })
    .optional(),
  meta: z.record(z.unknown()).optional(),
});

export const sessionStatus = z.custom<PaymentSessionStatus>();

/** Tiny helpers (FE/BE normalize) */
export const toBool = (v: unknown): boolean | undefined => {
  if (v === undefined) return undefined;
  const s = String(v).toLowerCase();
  if (s === '1' || s === 'true') return true;
  if (s === '0' || s === 'false') return false;
  return undefined;
};

export const toNum = (x: unknown): number => {
  if (typeof x === 'number') return x;
  if (typeof x === 'string') {
    const n = Number(x.replace(',', '.'));
    return Number.isFinite(n) ? n : 0;
    }
  return Number(x ?? 0);
};
