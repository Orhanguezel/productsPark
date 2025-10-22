
// -------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/endpoints/settlements_admin.endpoints.ts
// -------------------------------------------------------------
import { baseApi as baseApi2 } from "../../baseApi";

const nToNumber = (x: unknown): number => (typeof x === "number" ? x : Number(x as unknown));
const nToIso = (x: unknown): string | null => (!x ? null : new Date(x as string | number | Date).toISOString());

export type SettlementStatus = "draft" | "generated" | "finalized" | "paid" | "cancelled";

export type Settlement = {
  id: string;
  period_start: string; // ISO
  period_end: string;   // ISO
  currency: string;
  gross_amount: number;     // minor
  refunds_amount: number;   // minor
  fees_amount: number;      // minor
  net_amount: number;       // minor
  status: SettlementStatus;
  created_at: string;       // ISO
  generated_at: string | null;
  finalized_at: string | null;
  paid_at: string | null;
  notes?: string | null;
};

export type ApiSettlement = Omit<Settlement, "gross_amount" | "refunds_amount" | "fees_amount" | "net_amount"> & {
  gross_amount: number | string;
  refunds_amount: number | string;
  fees_amount: number | string;
  net_amount: number | string;
};

const normalizeSettlement = (s: ApiSettlement): Settlement => ({
  ...s,
  gross_amount: nToNumber(s.gross_amount),
  refunds_amount: nToNumber(s.refunds_amount),
  fees_amount: nToNumber(s.fees_amount),
  net_amount: nToNumber(s.net_amount),
  generated_at: s.generated_at ? nToIso(s.generated_at) : null,
  finalized_at: s.finalized_at ? nToIso(s.finalized_at) : null,
  paid_at: s.paid_at ? nToIso(s.paid_at) : null,
  notes: (s.notes ?? null) as string | null,
});

export type SettlementLine = {
  id: string;
  settlement_id: string;
  type: "order" | "refund" | "fee" | "payout";
  ref_id: string;       // order_id/refund_id/payout_id
  description: string;
  amount: number;       // minor (positive adds to gross, negative subtracts)
  created_at: string;   // ISO
};

export type ApiSettlementLine = Omit<SettlementLine, "amount"> & { amount: number | string };
const normalizeLine = (l: ApiSettlementLine): SettlementLine => ({ ...l, amount: nToNumber(l.amount) });

export type SettlementListParams = {
  q?: string; // notes/id
  status?: SettlementStatus;
  period_from?: string; period_to?: string; // ISO
  currency?: string;
  limit?: number; offset?: number;
  sort?: "period_start" | "period_end" | "net_amount" | "status" | "created_at";
  order?: "asc" | "desc";
};

export type RegenerateSettlementBody = { include_refunds?: boolean; include_fees?: boolean };
export type SettlementsExportParams = SettlementListParams & { format?: "csv" | "xlsx" };
export type ExportResponse2 = { url: string; expires_at: string | null };

export const settlementsAdminApi = baseApi2.injectEndpoints({
  endpoints: (b) => ({
    listSettlementsAdmin: b.query<Settlement[], SettlementListParams | void>({
      query: (params) => ({ url: "/settlements", params }),
      transformResponse: (res: unknown): Settlement[] => {
        if (Array.isArray(res)) return (res as ApiSettlement[]).map(normalizeSettlement);
        const maybe = res as { data?: unknown };
        return Array.isArray(maybe?.data) ? (maybe.data as ApiSettlement[]).map(normalizeSettlement) : [];
      },
      providesTags: (result) => result ? [
        ...result.map((s) => ({ type: "Settlements" as const, id: s.id })),
        { type: "Settlements" as const, id: "LIST" },
      ] : [{ type: "Settlements" as const, id: "LIST" }],
    }),

    getSettlementAdminById: b.query<Settlement, string>({
      query: (id) => ({ url: `/settlements/${id}` }),
      transformResponse: (res: unknown): Settlement => normalizeSettlement(res as ApiSettlement),
      providesTags: (_r, _e, id) => [{ type: "Settlements", id }],
    }),

    listSettlementLinesAdmin: b.query<SettlementLine[], { id: string; limit?: number; offset?: number }>({
      query: ({ id, limit, offset }) => ({ url: `/settlements/${id}/lines`, params: { limit, offset } }),
      transformResponse: (res: unknown): SettlementLine[] => Array.isArray(res) ? (res as ApiSettlementLine[]).map(normalizeLine) : [],
      providesTags: (_r, _e, arg) => [{ type: "SettlementLines", id: arg.id }],
    }),

    finalizeSettlementAdmin: b.mutation<Settlement, string>({
      query: (id) => ({ url: `/settlements/${id}/finalize`, method: "POST" }),
      transformResponse: (res: unknown): Settlement => normalizeSettlement(res as ApiSettlement),
      invalidatesTags: (_r, _e, id) => [{ type: "Settlements", id }, { type: "Settlements", id: "LIST" }],
    }),

    regenerateSettlementAdmin: b.mutation<Settlement, { id: string; body?: RegenerateSettlementBody }>({
      query: ({ id, body }) => ({ url: `/settlements/${id}/regenerate`, method: "POST", body }),
      transformResponse: (res: unknown): Settlement => normalizeSettlement(res as ApiSettlement),
      invalidatesTags: (_r, _e, arg) => [{ type: "Settlements", id: arg.id }],
    }),

    exportSettlementsAdmin: b.mutation<ExportResponse2, SettlementsExportParams | void>({
      query: (params) => ({ url: `/settlements/export`, method: "GET", params }),
      transformResponse: (res: unknown): ExportResponse2 => {
        const r = res as { url?: unknown; expires_at?: unknown };
        return { url: String(r?.url ?? ""), expires_at: r?.expires_at ? nToIso(r.expires_at) : null };
      },
    }),
  }),
  overrideExisting: true,
});

export const {
  useListSettlementsAdminQuery,
  useGetSettlementAdminByIdQuery,
  useListSettlementLinesAdminQuery,
  useFinalizeSettlementAdminMutation,
  useRegenerateSettlementAdminMutation,
  useExportSettlementsAdminMutation,
} = settlementsAdminApi;
