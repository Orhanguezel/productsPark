import { z } from "zod";
import { WALLET_DEPOSIT_STATUS, WALLET_TXN_TYPES } from "./wallet.types";

export const WdrListQuerySchema = z.object({
  select: z.string().optional(),          // opsiyonel; repository tüm kolonları döndürüyor
  user_id: z.string().uuid().optional(),
  status: z.enum(WALLET_DEPOSIT_STATUS).optional(),
  order: z.string().optional(),           // "created_at.desc" | ...
  limit: z.coerce.number().int().positive().optional(),
  offset: z.coerce.number().int().nonnegative().optional(),
});

export const WdrCreateBodySchema = z.object({
  user_id: z.string().uuid(),
  amount: z.union([z.number(), z.string()])
    .refine((v) => Number(v) > 0, "invalid_amount"),
  payment_method: z.string().min(1).default("havale"),
  payment_proof: z.string().url().nullable().optional(),
});

export const WdrPatchBodySchema = z.object({
  status: z.enum(WALLET_DEPOSIT_STATUS).optional(),
  admin_notes: z.string().nullable().optional(),
  payment_proof: z.string().url().nullable().optional(),
  processed_at: z.string().datetime().nullable().optional(),
});

export const WtxnListQuerySchema = z.object({
  select: z.string().optional(),
  user_id: z.string().uuid().optional(),
  type: z.enum(WALLET_TXN_TYPES).optional(),
  order: z.string().optional(),
  limit: z.coerce.number().int().positive().optional(),
  offset: z.coerce.number().int().nonnegative().optional(),
});
