// =============================================================
// FILE: src/integrations/metahub/db/types/wallet.ts
// =============================================================

export type WalletTransactionRow = {
  id: string;
  user_id: string;
  amount: number;
  type: "deposit" | "withdrawal" | "purchase" | "refund";
  description: string | null;
  order_id?: string | null;
  created_at: string;
};

export type WalletDepositRequestRow = {
  id: string;
  user_id: string;
  amount: number;
  payment_method: string;
  payment_proof?: string | null;
  status: "pending" | "approved" | "rejected" | string;
  admin_notes?: string | null;
  processed_at?: string | null;
  created_at: string;
  updated_at: string;
};
