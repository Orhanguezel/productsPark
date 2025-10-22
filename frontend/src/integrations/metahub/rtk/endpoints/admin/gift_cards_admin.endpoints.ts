
// -------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/endpoints/gift_cards_admin.endpoints.ts
// -------------------------------------------------------------
import { baseApi } from "../../baseApi";

// helpers
const toNumber = (x: unknown): number => (typeof x === "number" ? x : Number(x as unknown));
const toNullableNumber = (x: unknown): number | null => (x == null ? null : toNumber(x));
const toBool = (x: unknown): boolean => {
  if (typeof x === "boolean") return x;
  if (typeof x === "number") return x !== 0;
  const s = String(x).toLowerCase();
  return s === "true" || s === "1";
};
const toIso = (x: unknown): string | null => {
  if (!x) return null;
  const d = typeof x === "string" ? new Date(x) : (x as Date);
  return new Date(d).toISOString();
};
const tryParse = <T>(x: unknown): T => {
  if (typeof x === "string") {
    try { return JSON.parse(x) as T; } catch { /* ignore */ }
  }
  return x as T;
};

export type GiftCardStatus = "inactive" | "active" | "redeemed" | "expired" | "blocked";

export type GiftCard = {
  id: string;
  code: string;                 // masked display is job of UI
  currency: string;             // TRY, USD, ...
  initial_value: number;        // created amount
  balance: number;              // remaining amount
  status: GiftCardStatus;
  is_test: boolean;
  assigned_to_user_id: string | null;
  assigned_to_email: string | null;
  expires_at: string | null;    // ISO
  last_redeemed_at: string | null; // ISO
  usage_count: number;          // total redemptions
  max_uses: number | null;      // optional cap
  metadata?: Record<string, unknown> | null;
  created_at: string;           // ISO
  updated_at: string | null;    // ISO
};

export type ApiGiftCard = Omit<GiftCard,
  | "initial_value" | "balance" | "is_test" | "usage_count" | "max_uses" | "expires_at" | "last_redeemed_at" | "updated_at"
> & {
  initial_value: number | string;
  balance: number | string;
  is_test: boolean | 0 | 1 | "0" | "1" | "true" | "false";
  usage_count: number | string;
  max_uses: number | string | null;
  expires_at: string | null;
  last_redeemed_at: string | null;
  updated_at: string | null;
};

const normalizeGiftCard = (g: ApiGiftCard): GiftCard => ({
  ...g,
  assigned_to_user_id: (g.assigned_to_user_id ?? null) as string | null,
  assigned_to_email: (g.assigned_to_email ?? null) as string | null,
  metadata: (g.metadata ?? null) as Record<string, unknown> | null,
  initial_value: toNumber(g.initial_value),
  balance: toNumber(g.balance),
  is_test: toBool(g.is_test),
  usage_count: toNumber(g.usage_count),
  max_uses: toNullableNumber(g.max_uses),
  expires_at: g.expires_at ? toIso(g.expires_at) : null,
  last_redeemed_at: g.last_redeemed_at ? toIso(g.last_redeemed_at) : null,
  updated_at: g.updated_at ? toIso(g.updated_at) : null,
});

export type GiftCardHistory = {
  id: string;
  gift_card_id: string;
  event_type: "create" | "activate" | "deactivate" | "redeem" | "expire" | "block" | "unblock" | "adjust" | "sync" | "error";
  amount_change: number;      // negative on redeem, positive on adjust
  balance_after: number;      // resulting balance
  message: string;
  raw?: Record<string, unknown> | null;
  created_at: string;         // ISO
};

export type ApiGiftCardHistory = Omit<GiftCardHistory, "amount_change" | "balance_after"> & {
  amount_change: number | string;
  balance_after: number | string;
};

const normalizeHistory = (h: ApiGiftCardHistory): GiftCardHistory => ({
  ...h,
  raw: (h.raw ?? null) as Record<string, unknown> | null,
  amount_change: toNumber(h.amount_change),
  balance_after: toNumber(h.balance_after),
});

export type ListParams = {
  q?: string; // search in code/email
  code?: string; // exact
  status?: GiftCardStatus;
  is_test?: boolean;
  assigned_to_user_id?: string;
  assigned_to_email?: string;
  min_balance?: number; max_balance?: number;
  expires_before?: string; expires_after?: string;
  limit?: number; offset?: number;
  sort?: "created_at" | "updated_at" | "balance" | "initial_value" | "expires_at" | "status";
  order?: "asc" | "desc";
};

export type CreateGiftCardBody = {
  initial_value: number;
  currency: string;
  generate_code?: boolean;         // if true, BE generates
  code?: string | null;            // optional manual code
  expires_at?: string | null;      // ISO
  assigned_to_user_id?: string | null;
  assigned_to_email?: string | null;
  is_active?: boolean;             // default false -> inactive until activate
  is_test?: boolean;
  metadata?: Record<string, unknown> | null;
};

export type RedeemGiftCardBody = { amount: number; order_id?: string | null; note?: string | null; idempotency_key?: string | null };

export const giftCardsAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listGiftCardsAdmin: b.query<GiftCard[], ListParams | void>({
      query: (params) => ({ url: "/gift-cards", params }),
      transformResponse: (res: unknown): GiftCard[] => {
        if (Array.isArray(res)) return (res as ApiGiftCard[]).map(normalizeGiftCard);
        const maybe = res as { data?: unknown };
        return Array.isArray(maybe?.data) ? (maybe.data as ApiGiftCard[]).map(normalizeGiftCard) : [];
      },
      providesTags: (result) => result ? [
        ...result.map((g) => ({ type: "GiftCards" as const, id: g.id })),
        { type: "GiftCards" as const, id: "LIST" },
      ] : [{ type: "GiftCards" as const, id: "LIST" }],
      keepUnusedDataFor: 60,
    }),

    getGiftCardAdminById: b.query<GiftCard, string>({
      query: (id) => ({ url: `/gift-cards/${id}` }),
      transformResponse: (res: unknown): GiftCard => normalizeGiftCard(res as ApiGiftCard),
      providesTags: (_r, _e, id) => [{ type: "GiftCards", id }],
    }),

    createGiftCardAdmin: b.mutation<GiftCard, CreateGiftCardBody>({
      query: (body) => ({ url: `/gift-cards`, method: "POST", body }),
      transformResponse: (res: unknown): GiftCard => normalizeGiftCard(res as ApiGiftCard),
      invalidatesTags: [{ type: "GiftCards", id: "LIST" }],
    }),

    activateGiftCardAdmin: b.mutation<GiftCard, string>({
      query: (id) => ({ url: `/gift-cards/${id}/activate`, method: "POST" }),
      transformResponse: (res: unknown): GiftCard => normalizeGiftCard(res as ApiGiftCard),
      invalidatesTags: (_r, _e, id) => [{ type: "GiftCards", id }, { type: "GiftCards", id: "LIST" }],
    }),

    deactivateGiftCardAdmin: b.mutation<GiftCard, string>({
      query: (id) => ({ url: `/gift-cards/${id}/deactivate`, method: "POST" }),
      transformResponse: (res: unknown): GiftCard => normalizeGiftCard(res as ApiGiftCard),
      invalidatesTags: (_r, _e, id) => [{ type: "GiftCards", id }, { type: "GiftCards", id: "LIST" }],
    }),

    redeemGiftCardAdmin: b.mutation<GiftCard, { id: string; body: RedeemGiftCardBody }>({
      query: ({ id, body }) => ({ url: `/gift-cards/${id}/redeem`, method: "POST", body }),
      transformResponse: (res: unknown): GiftCard => normalizeGiftCard(res as ApiGiftCard),
      invalidatesTags: (_r, _e, arg) => [{ type: "GiftCards", id: arg.id }, { type: "GiftCards", id: "LIST" }],
    }),

    listGiftCardHistoryAdmin: b.query<GiftCardHistory[], { id: string; limit?: number; offset?: number }>({
      query: ({ id, limit, offset }) => ({ url: `/gift-cards/${id}/history`, params: { limit, offset } }),
      transformResponse: (res: unknown): GiftCardHistory[] => Array.isArray(res) ? (res as ApiGiftCardHistory[]).map(normalizeHistory) : [],
      providesTags: (_r, _e, arg) => [{ type: "GiftCards", id: `HIST_${arg.id}` }],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListGiftCardsAdminQuery,
  useGetGiftCardAdminByIdQuery,
  useCreateGiftCardAdminMutation,
  useActivateGiftCardAdminMutation,
  useDeactivateGiftCardAdminMutation,
  useRedeemGiftCardAdminMutation,
  useListGiftCardHistoryAdminQuery,
} = giftCardsAdminApi;
