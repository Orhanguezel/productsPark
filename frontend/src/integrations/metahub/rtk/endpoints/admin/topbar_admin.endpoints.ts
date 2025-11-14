// ----------------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/endpoints/admin/topbar_admin.endpoints.ts
// ----------------------------------------------------------------------
import { baseApi } from "../../baseApi";
import type {
  TopbarSetting,
  AdminTopbarListParams,
  UpsertTopbarBody,
  ApiTopbarAdminRow,
  BoolLike,
} from "@/integrations/metahub/db/types/topbar";

const toBool = (v: unknown): boolean =>
  v === true || v === 1 || v === "1" || v === "true";

// FE görünümü (Admin'de de TopbarSetting'i kullanıyoruz)
type TopbarSettingAdminView = TopbarSetting;

/** Admin liste parametrelerini BE querystring'ine çevir */
const toParams = (p?: AdminTopbarListParams | void) => {
  if (!p) return undefined;
  const params: Record<string, string> = {};
  if (p.q) params.q = p.q;
  if (typeof p.is_active === "boolean") {
    params.is_active = p.is_active ? "1" : "0";
  }
  if (p.sort) {
    // FE: "message" -> BE: "text"
    params.sort = p.sort === "message" ? "text" : p.sort;
  }
  if (p.order) params.order = p.order;
  if (p.limit != null) params.limit = String(p.limit);
  if (p.offset != null) params.offset = String(p.offset);
  return params;
};

// BE body tipi
type UpsertTopbarBodyApi = {
  text: string;
  link: string | null;
  is_active: BoolLike;
  show_ticker: BoolLike;
  coupon_id: string | null;
};

// FE upsert body → BE body dönüştürücü
type UpsertTopbarBodyWithCoupon = UpsertTopbarBody & { coupon_id?: string | null };

const toApiBody = (b: UpsertTopbarBodyWithCoupon): UpsertTopbarBodyApi => ({
  text: b.message.trim(),
  link: b.link_url ?? null,
  is_active: !!b.is_active,
  show_ticker: !!b.show_ticker,
  coupon_id: b.coupon_id ?? null,
});

/** BE -> FE normalize */
const normalize = (r: ApiTopbarAdminRow): TopbarSettingAdminView => ({
  id: r.id,
  is_active: toBool(r.is_active),
  message: r.text,
  coupon_id: r.coupon_id ?? null,
  // Admin listte doğrudan dönmüyoruz ama type'ta var:
  coupon_code: typeof r.coupon_code === "string" ? r.coupon_code : null,
  link_url: r.link ?? null,
  // Admin'de BE link_text dönmediği için FE'de sabit istersen "Detaylar" verebilirsin;
  // ama burada admin ekranı için çok gerekmediğinden null bırakıyoruz.
  link_text: null,
  show_ticker: toBool(r.show_ticker),
  created_at: r.created_at,
  updated_at: r.updated_at,
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
      transformResponse: (res: unknown): TopbarSettingAdminView =>
        normalize(res as ApiTopbarAdminRow),
      providesTags: (_r, _e, id) => [{ type: "TopbarSettings", id }],
    }),

    createTopbarAdmin: b.mutation<TopbarSettingAdminView, UpsertTopbarBodyWithCoupon>({
      query: (body) => ({
        url: BASE,
        method: "POST",
        body: toApiBody(body),
      }),
      transformResponse: (res: unknown): TopbarSettingAdminView =>
        normalize(res as ApiTopbarAdminRow),
      invalidatesTags: [
        { type: "TopbarSettings", id: "LIST" },
        { type: "TopbarSettings", id: "ACTIVE" },
      ],
    }),

    updateTopbarAdmin: b.mutation<
      TopbarSettingAdminView,
      { id: string; body: UpsertTopbarBodyWithCoupon }
    >({
      query: ({ id, body }) => ({
        url: `${BASE}/${id}`,
        method: "PATCH",
        body: toApiBody(body),
      }),
      transformResponse: (res: unknown): TopbarSettingAdminView =>
        normalize(res as ApiTopbarAdminRow),
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
