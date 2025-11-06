// =============================================================
// FILE: src/integrations/metahub/rtk/endpoints/popups.endpoints.ts
// =============================================================
import { baseApi as baseApi_m4 } from "../baseApi";
import type { FetchArgs } from "@reduxjs/toolkit/query";
import type { Popup, PopupType } from "../../db/types/popup";

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

// BE bazen options'ı string (JSON) döndürebilir
export type ApiPopup = Omit<Popup, "options"> & {
  options?: string | Popup["options"]; // optional olduğundan undefined gelebilir
};

/** options’ı asla undefined bırakma: ya Record ya null. */
const normalizePopup = (p: ApiPopup): Popup => {
  // options'ı ayır, geri kalanını aynen al
  const { options: rawOptions, ...rest } = p;

  let normalizedOptions: Popup["options"] = null;
  if (rawOptions !== undefined) {
    if (typeof rawOptions === "string") {
      normalizedOptions = tryParse_m4<Popup["options"]>(rawOptions) ?? null;
    } else {
      // rawOptions zaten Record|null
      normalizedOptions = rawOptions ?? null;
    }
  }
  // options alanını explicit veriyoruz; undefined olmayacak
  const out: Popup = {
    ...rest,
    options: normalizedOptions,
  };
  return out;
};

const BASE = "/popups";

export const popupsApi = baseApi_m4.injectEndpoints({
  endpoints: (b) => ({
    listPopups: b.query<Popup[], { locale?: string; is_active?: BoolLike4; type?: PopupType }>({
      query: (params): FetchArgs => {
        // params içinde undefined’leri ayıkla (isteğe bağlı ama temiz):
        const qp: Record<string, unknown> = {};
        if (params?.locale !== undefined) qp.locale = params.locale;
        if (params?.is_active !== undefined) qp.is_active = params.is_active;
        if (params?.type !== undefined) qp.type = params.type;
        return { url: `${BASE}`, params: qp };
      },
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
      query: ({ key, locale }): FetchArgs => {
        const qp: Record<string,unknown> = {};
        if (locale !== undefined) qp.locale = locale;
        return { url: `${BASE}/by-key/${encodeURIComponent(key)}`, params: qp };
      },
      transformResponse: (res: unknown): Popup => normalizePopup(res as ApiPopup),
      providesTags: (_r, _e, { key }) => [{ type: "Popups", id: `KEY_${key}` }],
    }),
  }),
  overrideExisting: true,
});

export const { useListPopupsQuery, useGetPopupByKeyQuery } = popupsApi;
