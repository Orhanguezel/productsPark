// src/integrations/metahub/rtk/endpoints/api_providers.endpoints.ts

import { baseApi } from "../baseApi";
import type { ApiProvider } from "../../db/types/apiProviders";

type ListParams = {
  activeOnly?: boolean;
  orderBy?: { field: "name" | "created_at" | "updated_at"; asc?: boolean };
};

const toStr = (v: unknown) => (typeof v === "string" ? v : String(v ?? ""));
const toBool = (v: unknown) =>
  v === true || v === 1 || v === "1" || v === "true";
const toOptNum = (v: unknown) => (v == null ? null : Number(v));
const toOptStr = (v: unknown) => (v == null ? null : toStr(v));
const toOptRec = (v: unknown) =>
  typeof v === "object" && v !== null ? (v as Record<string, unknown>) : undefined;

// Backend view satırının gevşek tipi (any yok)
type ApiProviderRaw = Partial<{
  id: unknown;
  name: unknown;
  provider_type: unknown;
  type: unknown;
  api_url: unknown;
  api_key: unknown;
  is_active: unknown;
  created_at: unknown;
  updated_at: unknown;
  credentials: unknown;
  balance: unknown;
  currency: unknown;
  last_balance_check: unknown;
}>;

/** Backend view yanıtını güvenli şekilde normalize et (any YOK) */
function normalize(row: unknown): ApiProvider {
  const r = (row ?? {}) as ApiProviderRaw;
  return {
    id: toStr(r.id),
    name: toStr(r.name),
    provider_type: toStr(r.provider_type ?? r.type),
    api_url: toOptStr(r.api_url),
    api_key: toOptStr(r.api_key),
    is_active: toBool(r.is_active),
    created_at: toStr(r.created_at),
    updated_at: toStr(r.updated_at),
    credentials: toOptRec(r.credentials),
    balance: toOptNum(r.balance),
    currency: toOptStr(r.currency),
    last_balance_check: toOptStr(r.last_balance_check),
  };
}

export const apiProvidersApi = baseApi.injectEndpoints({
  endpoints: (b) => ({

    // params artık optional; union 'void' kalktı → TS2339 biter
    listApiProviders: b.query<ApiProvider[], ListParams | undefined>({
      query: (params) => {
        const p: ListParams = params ?? {};
        const usp = new URLSearchParams();
        if (p.activeOnly) usp.set("is_active", "1");
        if (p.orderBy) {
          const dir = p.orderBy.asc === false ? "desc" : "asc";
          usp.set("order", `${p.orderBy.field}.${dir}`);
        } else {
          usp.set("order", "name.asc");
        }
        const qs = usp.toString();
        return { url: `/admin/api-providers${qs ? `?${qs}` : ""}` };
      },
      transformResponse: (rows: unknown): ApiProvider[] =>
        (Array.isArray(rows) ? rows : []).map(normalize),
      providesTags: (result) =>
        result
          ? [
              ...result.map((x) => ({ type: "ApiProviders" as const, id: x.id })),
              { type: "ApiProviders" as const, id: "LIST" },
            ]
          : [{ type: "ApiProviders" as const, id: "LIST" }],
    }),

    getApiProvider: b.query<ApiProvider, string>({
      query: (id) => ({ url: `/admin/api-providers/${id}` }),
      transformResponse: (r: unknown) => normalize(r),
      providesTags: (_r, _e, id) => [{ type: "ApiProviders", id }],
    }),

    createApiProvider: b.mutation<
      ApiProvider,
      {
        name: string;
        provider_type?: string; // "smm" | "epin" vs (default: smm)
        api_url: string;
        api_key: string;
        is_active?: boolean;
        credentials?: Record<string, unknown>;
      }
    >({
      query: (body) => ({ url: `/admin/api-providers`, method: "POST", body }),
      transformResponse: (r: unknown) => normalize(r),
      invalidatesTags: [{ type: "ApiProviders", id: "LIST" }],
    }),

    updateApiProvider: b.mutation<
      ApiProvider,
      {
        id: string;
        patch: Partial<{
          name: string;
          provider_type: string;
          api_url: string;
          api_key: string;
          is_active: boolean;
          credentials: Record<string, unknown>;
        }>;
      }
    >({
      query: ({ id, patch }) => ({
        url: `/admin/api-providers/${id}`,
        method: "PUT",
        body: patch,
      }),
      transformResponse: (r: unknown) => normalize(r),
      invalidatesTags: (_r, _e, { id }) => [
        { type: "ApiProviders", id },
        { type: "ApiProviders", id: "LIST" },
      ],
    }),

    deleteApiProvider: b.mutation<{ ok: true }, string>({
      query: (id) => ({ url: `/admin/api-providers/${id}`, method: "DELETE" }),
      transformResponse: () => ({ ok: true }),
      invalidatesTags: [{ type: "ApiProviders", id: "LIST" }],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListApiProvidersQuery,
  useGetApiProviderQuery,
  useCreateApiProviderMutation,
  useUpdateApiProviderMutation,
  useDeleteApiProviderMutation,
} = apiProvidersApi;
