// =============================================================
// FILE: src/integrations/metahub/client/api_providers/client.ts
// =============================================================
import { from, type FetchResult } from "../../db/from";
import type { ApiProviderRow } from "../../db/types";

export type ApiProvider = ApiProviderRow;

export const api_providers = {
  async list(params?: {
    activeOnly?: boolean;
    orderBy?: { field: "name" | "created_at" | "updated_at"; asc?: boolean };
  }): Promise<FetchResult<ApiProviderRow[]>> {
    let q = from("api_providers").select("*");
    if (params?.activeOnly) q = q.eq("is_active", true);
    if (params?.orderBy) {
      q = q.order(params.orderBy.field, { ascending: params.orderBy.asc !== false });
    }
    return await q; // PromiseLike -> await ile FetchResult<ApiProviderRow[]>
  },

  async getById(id: string): Promise<FetchResult<ApiProviderRow>> {
    return await from("api_providers").select("*").eq("id", id).limit(1).single();
  },
} as const;
