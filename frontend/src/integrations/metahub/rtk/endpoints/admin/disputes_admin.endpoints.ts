
// -------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/endpoints/disputes_admin.endpoints.ts
// -------------------------------------------------------------
import { baseApi as baseApi2 } from "../../baseApi";

// helpers (local)
const nToNumber = (x: unknown): number => (typeof x === "number" ? x : Number(x as unknown));
const nToBool = (x: unknown): boolean => {
  if (typeof x === "boolean") return x;
  if (typeof x === "number") return x !== 0;
  const s = String(x).toLowerCase();
  return s === "true" || s === "1";
};
const nToIso = (x: unknown): string | null => (!x ? null : new Date(x as string | number | Date).toISOString());

export type DisputeStatus = "needs_response" | "under_review" | "won" | "lost" | "closed";

export type Dispute = {
  id: string;
  payment_id: string;
  order_id: string | null;
  user_id: string | null;
  user_email: string | null;
  amount: number;            // minor units
  currency: string;
  reason_code: string | null;  // e.g. "fraudulent", "duplicate"
  status: DisputeStatus;
  due_by: string | null;       // ISO, deadline to respond
  assignee_id: string | null;
  created_at: string;          // ISO
  updated_at: string | null;   // ISO
  metadata?: Record<string, unknown> | null;
};

export type ApiDispute = Omit<Dispute, "amount" | "updated_at" | "due_by"> & {
  amount: number | string;
  updated_at: string | null;
  due_by: string | null;
};

const normalizeDispute = (d: ApiDispute): Dispute => ({
  ...d,
  order_id: (d.order_id ?? null) as string | null,
  user_id: (d.user_id ?? null) as string | null,
  user_email: (d.user_email ?? null) as string | null,
  assignee_id: (d.assignee_id ?? null) as string | null,
  amount: nToNumber(d.amount),
  updated_at: d.updated_at ? nToIso(d.updated_at) : null,
  due_by: d.due_by ? nToIso(d.due_by) : null,
  metadata: (d.metadata ?? null) as Record<string, unknown> | null,
});

export type DisputeEvidenceFile = {
  id: string;
  dispute_id: string;
  filename: string;
  mime_type: string;
  size: number;          // bytes
  url: string;           // signed URL
  uploaded_at: string;   // ISO
};

export type ApiEvidenceFile = Omit<DisputeEvidenceFile, "size"> & { size: number | string };
const normalizeEvidence = (f: ApiEvidenceFile): DisputeEvidenceFile => ({ ...f, size: nToNumber(f.size) });

export type DisputeNote = { id: string; dispute_id: string; author_id: string | null; message: string; visibility: "internal" | "public"; created_at: string };
export type ApiDisputeNote = DisputeNote;
const normalizeDisputeNote = (n: ApiDisputeNote): DisputeNote => ({ ...n });

export type DisputeListParams = {
  q?: string; // payment/order/email
  status?: DisputeStatus;
  payment_id?: string; user_id?: string; assignee_id?: string;
  created_from?: string; created_to?: string; // ISO
  due_from?: string; due_to?: string; // ISO
  min_amount?: number; max_amount?: number;
  limit?: number; offset?: number;
  sort?: "created_at" | "updated_at" | "due_by" | "amount" | "status";
  order?: "asc" | "desc";
};

export type AssignDisputeBody = { assignee_id: string | null };
export type SubmitEvidenceBody = { text?: string | null; files?: Array<{ filename: string; mime_type: string; content_base64: string }>; metadata?: Record<string, unknown> | null };

export type DisputesExportParams = DisputeListParams & { format?: "csv" | "xlsx" };
export type ExportResponse = { url: string; expires_at: string | null };

export const disputesAdminApi = baseApi2.injectEndpoints({
  endpoints: (b) => ({
    listDisputesAdmin: b.query<Dispute[], DisputeListParams | void>({
      query: (params) => ({ url: "/disputes", params }),
      transformResponse: (res: unknown): Dispute[] => {
        if (Array.isArray(res)) return (res as ApiDispute[]).map(normalizeDispute);
        const maybe = res as { data?: unknown };
        return Array.isArray(maybe?.data) ? (maybe.data as ApiDispute[]).map(normalizeDispute) : [];
      },
      providesTags: (result) => result ? [
        ...result.map((d) => ({ type: "Disputes" as const, id: d.id })),
        { type: "Disputes" as const, id: "LIST" },
      ] : [{ type: "Disputes" as const, id: "LIST" }],
      keepUnusedDataFor: 60,
    }),

    getDisputeAdminById: b.query<Dispute, string>({
      query: (id) => ({ url: `/disputes/${id}` }),
      transformResponse: (res: unknown): Dispute => normalizeDispute(res as ApiDispute),
      providesTags: (_r, _e, id) => [{ type: "Disputes", id }],
    }),

    assignDisputeAdmin: b.mutation<Dispute, { id: string; body: AssignDisputeBody }>({
      query: ({ id, body }) => ({ url: `/disputes/${id}/assign`, method: "POST", body }),
      transformResponse: (res: unknown): Dispute => normalizeDispute(res as ApiDispute),
      invalidatesTags: (_r, _e, arg) => [{ type: "Disputes", id: arg.id }, { type: "Disputes", id: "LIST" }],
    }),

    submitDisputeEvidenceAdmin: b.mutation<DisputeEvidenceFile[], { id: string; body: SubmitEvidenceBody }>({
      query: ({ id, body }) => ({ url: `/disputes/${id}/evidence`, method: "POST", body }),
      transformResponse: (res: unknown): DisputeEvidenceFile[] => Array.isArray(res) ? (res as ApiEvidenceFile[]).map(normalizeEvidence) : [],
      invalidatesTags: (_r, _e, arg) => [{ type: "Disputes", id: `EVD_${arg.id}` }],
    }),

    deleteDisputeEvidenceAdmin: b.mutation<{ ok: true }, { id: string; evidence_id: string }>({
      query: ({ id, evidence_id }) => ({ url: `/disputes/${id}/evidence/${evidence_id}`, method: "DELETE" }),
      transformResponse: () => ({ ok: true as const }),
      invalidatesTags: (_r, _e, arg) => [{ type: "Disputes", id: `EVD_${arg.id}` }],
    }),

    finalizeDisputeAdmin: b.mutation<Dispute, string>({
      query: (id) => ({ url: `/disputes/${id}/finalize`, method: "POST" }),
      transformResponse: (res: unknown): Dispute => normalizeDispute(res as ApiDispute),
      invalidatesTags: (_r, _e, id) => [{ type: "Disputes", id }, { type: "Disputes", id: "LIST" }],
    }),

    acceptDisputeAdmin: b.mutation<Dispute, { id: string; reason?: string | null }>({
      query: ({ id, reason }) => ({ url: `/disputes/${id}/accept`, method: "POST", body: { reason } }),
      transformResponse: (res: unknown): Dispute => normalizeDispute(res as ApiDispute),
      invalidatesTags: (_r, _e, arg) => [{ type: "Disputes", id: arg.id }, { type: "Disputes", id: "LIST" }],
    }),

    listDisputeEvidenceAdmin: b.query<DisputeEvidenceFile[], { id: string }>({
      query: ({ id }) => ({ url: `/disputes/${id}/evidence` }),
      transformResponse: (res: unknown): DisputeEvidenceFile[] => Array.isArray(res) ? (res as ApiEvidenceFile[]).map(normalizeEvidence) : [],
      providesTags: (_r, _e, arg) => [{ type: "Disputes", id: `EVD_${arg.id}` }],
    }),

    listDisputeNotesAdmin: b.query<DisputeNote[], { id: string; limit?: number; offset?: number }>({
      query: ({ id, limit, offset }) => ({ url: `/disputes/${id}/notes`, params: { limit, offset } }),
      transformResponse: (res: unknown): DisputeNote[] => Array.isArray(res) ? (res as ApiDisputeNote[]).map(normalizeDisputeNote) : [],
      providesTags: (_r, _e, arg) => [{ type: "Disputes", id: `NOTE_${arg.id}` }],
    }),

    addDisputeNoteAdmin: b.mutation<DisputeNote, { id: string; message: string; visibility?: "internal" | "public" }>({
      query: ({ id, message, visibility }) => ({ url: `/disputes/${id}/notes`, method: "POST", body: { message, visibility } }),
      transformResponse: (res: unknown): DisputeNote => normalizeDisputeNote(res as ApiDisputeNote),
      invalidatesTags: (_r, _e, arg) => [{ type: "Disputes", id: `NOTE_${arg.id}` }],
    }),

    exportDisputesAdmin: b.mutation<ExportResponse, DisputesExportParams | void>({
      query: (params) => ({ url: `/disputes/export`, method: "GET", params }),
      transformResponse: (res: unknown): ExportResponse => {
        const r = res as { url?: unknown; expires_at?: unknown };
        return { url: String(r?.url ?? ""), expires_at: r?.expires_at ? nToIso(r.expires_at) : null };
      },
    }),
  }),
  overrideExisting: true,
});

export const {
  useListDisputesAdminQuery,
  useGetDisputeAdminByIdQuery,
  useAssignDisputeAdminMutation,
  useSubmitDisputeEvidenceAdminMutation,
  useDeleteDisputeEvidenceAdminMutation,
  useFinalizeDisputeAdminMutation,
  useAcceptDisputeAdminMutation,
  useListDisputeEvidenceAdminQuery,
  useListDisputeNotesAdminQuery,
  useAddDisputeNoteAdminMutation,
  useExportDisputesAdminMutation,
} = disputesAdminApi;