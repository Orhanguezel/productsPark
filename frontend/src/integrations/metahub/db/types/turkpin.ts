// =============================================================
// FILE: src/integrations/metahub/db/types/turkpin.ts
// =============================================================

export type TurkpinListType = "epin" | "topup";

export type TurkpinGame = {
  id: string;
  name: string;
};

export type TurkpinProduct = {
  id: string;
  name: string;
  price: number;
  stock: number;
  min_order: number;
  max_order: number;
  tax_type: number;
  pre_order: boolean;
  min_barem?: number;
  max_barem?: number;
  barem_step?: number;
};

export type TurkpinGameListResult = {
  success: boolean;
  games?: TurkpinGame[];
  error?: string;
};

export type TurkpinProductListResult = {
  success: boolean;
  products?: TurkpinProduct[];
  error?: string;
};
