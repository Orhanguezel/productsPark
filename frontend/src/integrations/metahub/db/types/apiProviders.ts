// =============================================================
// FILE: src/integrations/metahub/db/types/apiProviders.ts
// =============================================================

// FE'nin backend "view" yanıtıyla birebir eşleşen tip (balance/currency opsiyonel)
export type ApiProvider = {
  id: string;
  name: string;
  provider_type: string;          // backend view alanı
  api_url: string | null;         // credentials.api_url’dan gelir
  api_key: string | null;         // credentials.api_key’den gelir
  is_active: boolean;             // backend boolean döner
  created_at: string;
  updated_at: string;
  credentials?: Record<string, unknown>;
  balance?: number | null;
  currency?: string | null;
  last_balance_check?: string | null;
};
