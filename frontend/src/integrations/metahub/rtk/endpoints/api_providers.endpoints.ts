// -------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/endpoints/api_providers.endpoints.ts
// -------------------------------------------------------------
import { baseApi as baseApi_api } from "../baseApi";

export type BoolLike = boolean | 0 | 1;

export type ApiProviderRow = {
  id: string;
  name: string;
  api_url: string;
  api_key: string;
  provider_type: string;    // "smm" vb.
  is_active: BoolLike;
  created_at?: string | null;
  updated_at?: string | null;
};

type ListParams = {
  activeOnly?: boolean;
  orderBy?: { field: "name" | "created_at" | "updated_at"; asc?: boolean };
};

const toBool = (v: BoolLike) => v === true || v === 1;

// Not: /admin/api-providers requireAuth -> baseApi header’ları ekliyor olmalı.
export const apiProvidersApi = baseApi_api.injectEndpoints({
  endpoints: (b) => ({
    listApiProviders: b.query<ApiProviderRow[], ListParams | void>({
      query: (params) => {
        const usp = new URLSearchParams();
        if (params?.activeOnly) usp.set("is_active", "1");
        if (params?.orderBy) {
          const dir = params.orderBy.asc === false ? "desc" : "asc";
          usp.set("order", `${params.orderBy.field}.${dir}`);
        } else {
          usp.set("order", "name.asc");
        }
        const qs = usp.toString();
        return { url: `/admin/api-providers${qs ? `?${qs}` : ""}` };
      },
      transformResponse: (rows: unknown): ApiProviderRow[] =>
        (Array.isArray(rows) ? rows : []).map((r) => ({
          ...r,
          is_active: toBool(r?.is_active),
        })),
      providesTags: (result) =>
        result
          ? [
              ...result.map((x) => ({ type: "ApiProviders" as const, id: x.id })),
              { type: "ApiProviders" as const, id: "LIST" },
            ]
          : [{ type: "ApiProviders" as const, id: "LIST" }],
    }),

    getApiProvider: b.query<ApiProviderRow, string>({
      query: (id) => ({ url: `/admin/api-providers/${id}` }),
      transformResponse: (r: ApiProviderRow) => ({
        ...r,
        is_active: toBool(r?.is_active),
      }),
      providesTags: (_r, _e, id) => [{ type: "ApiProviders", id }],
    }),

    createApiProvider: b.mutation<
      ApiProviderRow,
      Omit<ApiProviderRow, "id" | "created_at" | "updated_at">
    >({
      query: (body) => ({ url: `/admin/api-providers`, method: "POST", body }),
      invalidatesTags: [{ type: "ApiProviders", id: "LIST" }],
    }),

    updateApiProvider: b.mutation<ApiProviderRow, { id: string; patch: Partial<ApiProviderRow> }>({
      query: ({ id, patch }) => ({ url: `/admin/api-providers/${id}`, method: "PUT", body: patch }),
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
