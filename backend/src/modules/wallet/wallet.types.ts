// Tek tip kaynağı

export const WALLET_DEPOSIT_STATUS = ["pending", "approved", "rejected"] as const;
export type WalletDepositStatus = typeof WALLET_DEPOSIT_STATUS[number];

export const WALLET_TXN_TYPES = ["deposit", "withdrawal", "purchase", "refund"] as const;
export type WalletTransactionType = typeof WALLET_TXN_TYPES[number];

export type WalletDepositRequest = {
  id: string;
  user_id: string;
  amount: number;                // FE/BE arası: her zaman number olarak normalize edeceğiz
  payment_method: string;
  payment_proof: string | null;
  status: WalletDepositStatus;
  admin_notes: string | null;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type WalletTransaction = {
  id: string;
  user_id: string;
  amount: number;                // normalize
  type: WalletTransactionType;
  description: string | null;
  order_id: string | null;
  created_at: string;
};
