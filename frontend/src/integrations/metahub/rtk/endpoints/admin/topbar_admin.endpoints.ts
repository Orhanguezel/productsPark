// ----------------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/endpoints/admin/topbar_admin.endpoints.ts
// ----------------------------------------------------------------------
import { baseApi } from "../../baseApi";
import type {
  TopbarSetting,
  AdminTopbarListParams,
  UpsertTopbarBody,
} from "@/integrations/metahub/db/types/topbar";

type BoolLike = boolean | 0 | 1 | "0" | "1" | "true" | "false";
const toBool = (v: unknown): boolean =>
  v === true || v === 1 || v === "1" || v === "true";

// --- Admin row (BE) ---
type ApiTopbarAdminRow = {
  id: string;
  text: string;
  link: string | null;
  coupon_id?: string | null;
  coupon_code?: string | null;
  is_active: BoolLike;
  show_ticker: BoolLike;
  created_at?: string;
  updated_at?: string;
};

// FE görünümü (TopbarSetting + opsiyonel alanlar)
type TopbarSettingAdminView = TopbarSetting & {
  coupon_id?: string | null;
  coupon_code?: string | null;
};

// BE -> FE normalizasyon
const normalize = (r: ApiTopbarAdminRow): TopbarSettingAdminView => ({
  id: r.id,
  is_active: toBool(r.is_active),
  message: r.text,
  coupon_id: r.coupon_id ?? null,
  coupon_code: typeof r.coupon_code === "string" ? r.coupon_code : null,
  link_url: r.link ?? null,
  link_text: r.link ? "Detaylar" : null,
  show_ticker: toBool(r.show_ticker),
  created_at: r.created_at,
  updated_at: r.updated_at,
});

const toParams = (p?: AdminTopbarListParams | void) => {
  if (!p) return undefined;
  const params: Record<string, string> = {};
  if (p.q) params.q = p.q;
  if (typeof p.is_active === "boolean") params.is_active = String(p.is_active ? 1 : 0);
  if (p.sort) params.sort = p.sort;
  if (p.order) params.order = p.order;
  if (p.limit != null) params.limit = String(p.limit);
  if (p.offset != null) params.offset = String(p.offset);
  return params;
};

// FE form -> BE body
type UpsertTopbarBodyApi = {
  text: string;
  link: string | null;
  is_active: boolean;
  show_ticker: boolean;
  coupon_id: string | null;
};
// Upsert body genişletmesi
type UpsertTopbarBodyWithCoupon = UpsertTopbarBody & { coupon_id?: string | null };

const toApiBody = (b: UpsertTopbarBodyWithCoupon): UpsertTopbarBodyApi => ({
  text: b.message.trim(),
  link: b.link_url ?? null,
  is_active: !!b.is_active,
  show_ticker: !!b.show_ticker,
  coupon_id: b.coupon_id ?? null,
});

const BASE = "/admin/topbar_settings";

export const topbarAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listTopbarAdmin: b.query<TopbarSettingAdminView[], AdminTopbarListParams | void>({
      query: (q) => {
        const params = toParams(q);
        return params ? { url: BASE, params } : { url: BASE };
      },
      transformResponse: (res: unknown): TopbarSettingAdminView[] =>
        Array.isArray(res) ? (res as ApiTopbarAdminRow[]).map(normalize) : [],
      providesTags: (result) =>
        result
          ? [
              ...result.map((i) => ({ type: "TopbarSettings" as const, id: i.id })),
              { type: "TopbarSettings" as const, id: "LIST" },
            ]
          : [{ type: "TopbarSettings" as const, id: "LIST" }],
      keepUnusedDataFor: 60,
    }),

    getTopbarAdminById: b.query<TopbarSettingAdminView, string>({
      query: (id) => ({ url: `${BASE}/${id}` }),
      transformResponse: (res: unknown): TopbarSettingAdminView => normalize(res as ApiTopbarAdminRow),
      providesTags: (_r, _e, id) => [{ type: "TopbarSettings", id }],
    }),

    createTopbarAdmin: b.mutation<TopbarSettingAdminView, UpsertTopbarBodyWithCoupon>({
      query: (body) => ({ url: BASE, method: "POST", body: toApiBody(body) }),
      transformResponse: (res: unknown): TopbarSettingAdminView => normalize(res as ApiTopbarAdminRow),
      invalidatesTags: [
        { type: "TopbarSettings", id: "LIST" },
        { type: "TopbarSettings", id: "ACTIVE" },
      ],
    }),

    updateTopbarAdmin: b.mutation<TopbarSettingAdminView, { id: string; body: UpsertTopbarBodyWithCoupon }>({
      query: ({ id, body }) => ({ url: `${BASE}/${id}`, method: "PATCH", body: toApiBody(body) }),
      transformResponse: (res: unknown): TopbarSettingAdminView => normalize(res as ApiTopbarAdminRow),
      invalidatesTags: (_r, _e, arg) => [
        { type: "TopbarSettings", id: arg.id },
        { type: "TopbarSettings", id: "LIST" },
        { type: "TopbarSettings", id: "ACTIVE" },
      ],
    }),

    deleteTopbarAdmin: b.mutation<{ ok: true }, string>({
      query: (id) => ({ url: `${BASE}/${id}`, method: "DELETE" }),
      transformResponse: (): { ok: true } => ({ ok: true }),
      invalidatesTags: (_r, _e, id) => [
        { type: "TopbarSettings", id },
        { type: "TopbarSettings", id: "LIST" },
        { type: "TopbarSettings", id: "ACTIVE" },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListTopbarAdminQuery,
  useGetTopbarAdminByIdQuery,
  useCreateTopbarAdminMutation,
  useUpdateTopbarAdminMutation,
  useDeleteTopbarAdminMutation,
} = topbarAdminApi;
