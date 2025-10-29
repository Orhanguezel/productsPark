// =============================================================
// FILE: src/integrations/metahub/db/types/apiProviders.ts
// =============================================================

export type ApiProviderRow = {
  id: string;
  name: string;
  code?: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};
