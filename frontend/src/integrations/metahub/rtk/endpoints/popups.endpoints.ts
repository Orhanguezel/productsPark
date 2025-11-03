// =============================================================
// FILE: src/integrations/metahub/rtk/endpoints/popups.endpoints.ts
// =============================================================
import { baseApi as baseApi_m4 } from "../baseApi";
import type { FetchArgs } from "@reduxjs/toolkit/query";
import type { Popup } from "../../db/types/popup";

const tryParse_m4 = <T>(x: unknown): T => {
  if (typeof x === "string") {
    try {
      return JSON.parse(x) as T;
    } catch {
      /* noop */
    }
  }
  return x as T;
};

type BoolLike4 = 0 | 1 | boolean;
export type PopupType = "modal" | "drawer" | "banner" | "toast";

// BE bazen options'ı string (JSON) döndürebilir
export type ApiPopup = Omit<Popup, "options"> & {
  options?: string | Popup["options"];
};

const normalizePopup = (p: ApiPopup): Popup => ({
  ...p,
  options: p.options ? tryParse_m4<Popup["options"]>(p.options) : null,
});

const BASE = "/popups";

export const popupsApi = baseApi_m4.injectEndpoints({
  endpoints: (b) => ({
    listPopups: b.query<Popup[], { locale?: string; is_active?: BoolLike4; type?: PopupType }>({
      query: (params): FetchArgs => ({ url: `${BASE}`, params }),
      transformResponse: (res: unknown): Popup[] =>
        Array.isArray(res) ? (res as ApiPopup[]).map(normalizePopup) : [],
      providesTags: (result) =>
        result
          ? [
              ...result.map((p) => ({ type: "Popups" as const, id: p.id })),
              { type: "Popups" as const, id: "LIST" },
            ]
          : [{ type: "Popups" as const, id: "LIST" }],
    }),

    getPopupByKey: b.query<Popup, { key: string; locale?: string }>({
      query: ({ key, locale }): FetchArgs => ({ url: `${BASE}/by-key/${encodeURIComponent(key)}`, params: { locale } }),
      transformResponse: (res: unknown): Popup => normalizePopup(res as ApiPopup),
      providesTags: (_r, _e, { key }) => [{ type: "Popups", id: `KEY_${key}` }],
    }),
  }),
  overrideExisting: true,
});

export const { useListPopupsQuery, useGetPopupByKeyQuery } = popupsApi;
