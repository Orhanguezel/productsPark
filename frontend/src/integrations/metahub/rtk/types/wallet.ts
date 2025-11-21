// =============================================================
// FILE: src/integrations/metahub/db/types/wallet.ts
// =============================================================

export type WalletDepositStatus = "pending" | "approved" | "rejected" | string;

export interface WalletDepositRequest {
  id: string;
  user_id: string;
  amount: number;
  payment_method: string;
  payment_proof: string | null;
  status: WalletDepositStatus;
  admin_notes: string | null;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
}

// BE’den farklı adlarla gelebilene fallback
export interface ApiWalletDepositRequest
  extends Omit<
    WalletDepositRequest,
    "amount" | "payment_proof" | "admin_notes" | "processed_at"
  > {
  amount: number | string;
  payment_proof?: string | null;   // preferred
  proof_image_url?: string | null; // legacy
  admin_notes?: string | null;     // preferred
  admin_note?: string | null;      // legacy
  processed_at?: string | null;
}

export interface ListParams {
  user_id?: string;
  status?: WalletDepositStatus;
  limit?: number;
  offset?: number;
  order?: "asc" | "desc";
}



export type WalletTxnType = "deposit" | "withdrawal" | "purchase" | "refund";

export interface WalletTransaction {
  id: string;
  user_id: string;
  type: WalletTxnType;
  amount: number;
  description: string | null;
  order_id?: string | null;
  created_at: string;
}

export interface ApiWalletTransaction
  extends Omit<WalletTransaction, "amount" | "description"> {
  amount: number | string;
  description?: string | null;
}

export interface ListTxnParams {
  user_id?: string;
  limit?: number;
  offset?: number;
  order?: "asc" | "desc";
}

// eslint-safe query param tipi
export type QueryParamsStrict = Record<string, string | number | boolean>;

