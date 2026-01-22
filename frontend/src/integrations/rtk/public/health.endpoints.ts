
// -------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/endpoints/health.endpoints.ts
// -------------------------------------------------------------
import { baseApi } from '@/integrations/baseApi';

export type Health = { ok: true; version?: string; time?: string } | { ok: false; error: string };

export const healthApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getHealth: b.query<Health, void>({
      query: () => ({ url: "/__health" }),
      transformResponse: (res: unknown): Health => res as Health,
      providesTags: [{ type: "Health" as const, id: "SVC" }],
      keepUnusedDataFor: 10,
    }),
  }),
  overrideExisting: true,
});

export const { useGetHealthQuery } = healthApi;