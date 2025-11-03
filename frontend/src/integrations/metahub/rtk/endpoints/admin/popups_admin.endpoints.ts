// =============================================================
// FILE: src/integrations/metahub/rtk/endpoints/admin/popups_admin.endpoints.ts
// =============================================================
import { baseApi } from "../../baseApi";
import type { FetchArgs } from "@reduxjs/toolkit/query";
import type {
  PopupAdminView,
  UnknownRow,
  DisplayFrequency,
} from "../../../db/types/popup";

// ---------- helpers ----------
const str = (v: unknown): string =>
  typeof v === "string" ? v : v == null ? "" : String(v);

const strOrNull = (v: unknown): string | null =>
  typeof v === "string" ? v : v == null ? null : String(v);

const num = (v: unknown, fallback = 0): number => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const bool = (v: unknown): boolean =>
  v === true || v === "true" || v === 1 || v === "1";

const toFreq = (v: unknown): DisplayFrequency => {
  const s = String(v ?? "").toLowerCase();
  return s === "once" || s === "daily" || s === "weekly" ? (s as DisplayFrequency) : "always";
};

// unknown → PopupAdminView
const toView = (x: unknown): PopupAdminView => {
  const r = (x && typeof x === "object" ? x : {}) as UnknownRow;

  const createdAt = typeof r["created_at"] === "string" ? (r["created_at"] as string) : undefined;
  const updatedAt = typeof r["updated_at"] === "string" ? (r["updated_at"] as string) : undefined;

  const startDate =
    typeof r["start_date"] === "string"
      ? (r["start_date"] as string)
      : (typeof r["start_at"] === "string" ? (r["start_at"] as string) : null);

  const endDate =
    typeof r["end_date"] === "string"
      ? (r["end_date"] as string)
      : (typeof r["end_at"] === "string" ? (r["end_at"] as string) : null);

  const buttonLink = strOrNull(r["button_link"]) ?? strOrNull(r["button_url"]);

  return {
    id: str(r["id"]),
    title: str(r["title"]),
    content: str(r["content"]),

    // Görsel alanları
    image_url: strOrNull(r["image_url"]),
    image_asset_id: strOrNull(r["image_asset_id"]),
    image_alt: strOrNull(r["image_alt"]),

    button_text: strOrNull(r["button_text"]),
    button_link: buttonLink ?? null,
    is_active: bool(r["is_active"]),

    display_frequency: toFreq(r["display_frequency"]),
    delay_seconds: num(r["delay_seconds"], 0),

    start_date: startDate,
    end_date: endDate,

    // UI’de var, DB’de yok
    product_id: strOrNull(r["product_id"]),
    coupon_code: strOrNull(r["coupon_code"]),
    display_pages: str(r["display_pages"] ?? "all"),
    priority: Number.isFinite(Number(r["priority"])) ? Number(r["priority"]) : null,
    duration_seconds: Number.isFinite(Number(r["duration_seconds"]))
      ? Number(r["duration_seconds"])
      : null,

    created_at: createdAt,
    updated_at: updatedAt,
  };
};

const BASE = "/admin/popups";

export const popupsAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listPopupsAdmin: b.query<PopupAdminView[], void>({
      query: (): FetchArgs => ({ url: BASE }),
      transformResponse: (res: unknown): PopupAdminView[] =>
        Array.isArray(res) ? (res as unknown[]).map(toView) : [],
      providesTags: (result) =>
        result
          ? [
              ...result.map((p) => ({ type: "Popups" as const, id: p.id })),
              { type: "Popups" as const, id: "LIST" },
            ]
          : [{ type: "Popups" as const, id: "LIST" }],
    }),

    getPopupAdminById: b.query<PopupAdminView, string>({
      query: (id): FetchArgs => ({ url: `${BASE}/${id}` }),
      transformResponse: (res: unknown): PopupAdminView => toView(res),
      providesTags: (_r, _e, id) => [{ type: "Popups", id }],
    }),

    createPopupAdmin: b.mutation<
      PopupAdminView,
      {
        title: string;
        content: string;

        // Görsel alanları
        image_url?: string | null;
        image_asset_id?: string | null;
        image_alt?: string | null;

        button_text?: string | null;
        button_link?: string | null;
        is_active?: boolean | 0 | 1 | "0" | "1" | "true" | "false";
        display_frequency?: DisplayFrequency;
        delay_seconds?: number;
        start_date?: string | null;
        end_date?: string | null;

        // UI alanları (BE ignore)
        product_id?: string | null;
        coupon_code?: string | null;
        display_pages?: string;
        priority?: number | null;
        duration_seconds?: number | null;
      }
    >({
      query: (body): FetchArgs => ({ url: BASE, method: "POST", body }),
      transformResponse: (res: unknown): PopupAdminView => toView(res),
      invalidatesTags: [{ type: "Popups", id: "LIST" }],
      async onQueryStarted(_b, { dispatch, queryFulfilled }) {
        try {
          const { data: created } = await queryFulfilled;
          dispatch(
            popupsAdminApi.util.updateQueryData(
              "listPopupsAdmin",
              undefined,
              (draft) => {
                draft.unshift(created);
              }
            )
          );
        } catch {
          /* no-op */
        }
      },
    }),

    updatePopupAdmin: b.mutation<
      PopupAdminView,
      {
        id: string;
        body: Partial<{
          title: string;
          content: string;

          image_url?: string | null;
          image_asset_id?: string | null;
          image_alt?: string | null;

          button_text?: string | null;
          button_link?: string | null;
          is_active?: boolean | 0 | 1 | "0" | "1" | "true" | "false";
          display_frequency?: DisplayFrequency;
          delay_seconds?: number;
          start_date?: string | null;
          end_date?: string | null;

          product_id?: string | null;
          coupon_code?: string | null;
          display_pages?: string;
          priority?: number | null;
          duration_seconds?: number | null;
        }>;
      }
    >({
      query: ({ id, body }): FetchArgs => ({ url: `${BASE}/${id}`, method: "PATCH", body }),
      transformResponse: (res: unknown): PopupAdminView => toView(res),
      invalidatesTags: (_r, _e, arg) => [
        { type: "Popups", id: arg.id },
        { type: "Popups", id: "LIST" },
      ],
      async onQueryStarted({ id, body }, { dispatch, queryFulfilled }) {
        // optimistic patch
        const patch = dispatch(
          popupsAdminApi.util.updateQueryData(
            "listPopupsAdmin",
            undefined,
            (draft) => {
              const it = draft.find((d) => d.id === id);
              if (!it) return;
              if (body.title !== undefined) it.title = body.title ?? it.title;
              if (body.content !== undefined) it.content = body.content ?? it.content;

              if (body.image_url !== undefined) it.image_url = body.image_url ?? null;
              if (body.image_asset_id !== undefined) it.image_asset_id = body.image_asset_id ?? null;
              if (body.image_alt !== undefined) it.image_alt = body.image_alt ?? null;

              if (body.button_text !== undefined) it.button_text = body.button_text ?? null;
              if (body.button_link !== undefined) it.button_link = body.button_link ?? null;

              if (body.is_active !== undefined) it.is_active = body.is_active === true || body.is_active === "true" || body.is_active === 1 || body.is_active === "1";

              if (body.display_frequency !== undefined) it.display_frequency = body.display_frequency ?? it.display_frequency;
              if (body.delay_seconds !== undefined) it.delay_seconds = body.delay_seconds ?? it.delay_seconds;
              if (body.start_date !== undefined) it.start_date = body.start_date ?? it.start_date;
              if (body.end_date !== undefined) it.end_date = body.end_date ?? it.end_date;
            }
          )
        );
        try {
          const { data: updated } = await queryFulfilled;
          dispatch(
            popupsAdminApi.util.updateQueryData("listPopupsAdmin", undefined, (draft) => {
              const i = draft.findIndex((d) => d.id === id);
              if (i >= 0) draft[i] = updated;
            })
          );
        } catch {
          patch.undo();
        }
      },
    }),

    deletePopupAdmin: b.mutation<void, string>({
      query: (id): FetchArgs => ({ url: `${BASE}/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Popups", id: "LIST" }],
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          popupsAdminApi.util.updateQueryData(
            "listPopupsAdmin",
            undefined,
            (draft) => {
              const i = draft.findIndex((d) => d.id === id);
              if (i >= 0) draft.splice(i, 1);
            }
          )
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
    }),
  }),
  overrideExisting: true,
});

export const {
  useListPopupsAdminQuery,
  useGetPopupAdminByIdQuery,
  useCreatePopupAdminMutation,
  useUpdatePopupAdminMutation,
  useDeletePopupAdminMutation,
} = popupsAdminApi;
