// =============================================================
// FILE: src/integrations/metahub/rtk/endpoints/topbar_settings.endpoints.ts
// =============================================================
import { baseApi as baseApi_topbar } from "../baseApi";
import type {
  TopbarSetting,
  ApiTopbarSetting,
  TopbarPublicListParams,
} from "@/integrations/metahub/db/types/topbar";

const toBool = (v: unknown): boolean =>
  v === true || v === "true" || v === 1 || v === "1";

// BE (public) → FE normalize
const normalize = (r: ApiTopbarSetting): TopbarSetting => ({
  id: r.id,
  is_active: toBool(r.is_active),
  message: r.message ?? "",
  coupon_code: r.coupon_code ?? null,
  coupon_id: r.coupon_id ?? null,
  coupon_title: r.coupon_title ?? null,
  coupon_content_html: r.coupon_content_html ?? null,
  link_url: r.link_url ?? null,
  link_text: r.link_text ?? null,
  show_ticker: r.show_ticker == null ? false : toBool(r.show_ticker),
  created_at: r.created_at,
  updated_at: r.updated_at,
});

// FE public liste parametreleri → BE querystring
const toParams = (p?: TopbarPublicListParams | void) => {
  if (!p) return undefined;
  const params: Record<string, string> = {};
  if (typeof p.is_active === "boolean") {
    params.is_active = p.is_active ? "1" : "0";
  }
  if (p.order) {
    // BE tarafında "created_at.desc" gibi string bekliyoruz
    params.order = `created_at.${p.order}`;
  }
  if (p.limit != null) params.limit = String(p.limit);
  if (p.offset != null) params.offset = String(p.offset);
  return params;
};

const BASE = "/topbar_settings";

export const topbarSettingsApi = baseApi_topbar.injectEndpoints({
  endpoints: (b) => ({
    listTopbarSettings: b.query<TopbarSetting[], TopbarPublicListParams | void>({
      query: (q) => {
        const params = toParams(q);
        return params ? { url: BASE, params } : { url: BASE };
      },
      transformResponse: (res: unknown): TopbarSetting[] =>
        Array.isArray(res) ? (res as ApiTopbarSetting[]).map(normalize) : [],
      providesTags: (result) =>
        result
          ? [
              ...result.map((i) => ({ type: "TopbarSettings" as const, id: i.id })),
              { type: "TopbarSettings" as const, id: "LIST" },
            ]
          : [{ type: "TopbarSettings" as const, id: "LIST" }],
      keepUnusedDataFor: 60,
    }),

    /** Aktif ilk kaydı döndürür (yoksa null) */
    getActiveTopbar: b.query<TopbarSetting | null, void>({
      query: () => ({
        url: BASE,
        params: { is_active: 1, limit: 1 },
      }),
      transformResponse: (res: unknown): TopbarSetting | null => {
        const rows = Array.isArray(res)
          ? (res as ApiTopbarSetting[])
          : [];
        return rows.length ? normalize(rows[0]!) : null;
      },
      providesTags: [{ type: "TopbarSettings", id: "ACTIVE" }],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListTopbarSettingsQuery,
  useGetActiveTopbarQuery,
} = topbarSettingsApi;
