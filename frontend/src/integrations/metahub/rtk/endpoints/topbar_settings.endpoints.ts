import { baseApi as baseApi_topbar } from "../baseApi";

type BoolLike = 0 | 1 | boolean;

export type TopbarSetting = {
  id: string;
  is_active: boolean;
  message: string;
  coupon_code?: string | null;
  link_url?: string | null;
  link_text?: string | null;
  show_ticker?: boolean;
  created_at?: string;
  updated_at?: string;
};

type ApiTopbarSetting = {
  id: string;
  is_active?: BoolLike;
  message?: string | null;
  coupon_code?: string | null;
  link_url?: string | null;
  link_text?: string | null;
  show_ticker?: BoolLike;
  created_at?: string;
  updated_at?: string;
};

const toBool = (v: unknown): boolean =>
  v === true || v === "true" || v === 1 || v === "1";

const normalize = (r: ApiTopbarSetting): TopbarSetting => ({
  id: r.id,
  is_active: toBool(r.is_active),
  message: r.message ?? "",
  coupon_code: r.coupon_code ?? null,
  link_url: r.link_url ?? null,
  link_text: r.link_text ?? null,
  show_ticker: r.show_ticker == null ? false : toBool(r.show_ticker),
  created_at: r.created_at,
  updated_at: r.updated_at,
});

type ListArgs = {
  is_active?: BoolLike;
  order?: string;
  limit?: number;
  offset?: number;
};

export const topbarSettingsApi = baseApi_topbar.injectEndpoints({
  endpoints: (b) => ({
    // ❗ params opsiyonel; yoksa {} gönderiyoruz
    listTopbarSettings: b.query<TopbarSetting[], ListArgs | undefined>({
      query: (params) => ({
        url: "/topbar_settings",
        params: params ?? {}, // <-- kritik değişiklik
      }),
      transformResponse: (res: unknown): TopbarSetting[] =>
        Array.isArray(res) ? (res as ApiTopbarSetting[]).map(normalize) : [],
      providesTags: (result) =>
        result
          ? [
              ...result.map((i) => ({ type: "TopbarSetting" as const, id: i.id })),
              { type: "TopbarSettings" as const, id: "LIST" },
            ]
          : [{ type: "TopbarSettings" as const, id: "LIST" }],
    }),

    getActiveTopbar: b.query<TopbarSetting | null, void>({
      query: () => ({
        url: "/topbar_settings",
        params: { is_active: 1, limit: 1 },
      }),
      transformResponse: (res: unknown): TopbarSetting | null => {
        const rows = Array.isArray(res) ? (res as ApiTopbarSetting[]) : [];
        return rows.length ? normalize(rows[0]!) : null;
      },
      providesTags: (_r) => [{ type: "TopbarSettings", id: "ACTIVE" }],
    }),
  }),
  overrideExisting: true,
});

export const { useListTopbarSettingsQuery, useGetActiveTopbarQuery } =
  topbarSettingsApi;
