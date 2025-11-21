// =============================================================
// FILE: src/integrations/metahub/rtk/endpoints/admin/custom_pages_admin.endpoints.ts
// =============================================================
import { baseApi } from "../../baseApi";
import type { FetchArgs } from "@reduxjs/toolkit/query";
import type {
  CustomPageView,
  UpsertCustomPageBody,
} from "../../types/customPages";

/* ---------- type guards ---------- */
const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;

const hasArray = <T = unknown>(
  o: unknown,
  key: string,
): o is Record<string, unknown> & { [k: string]: T[] } =>
  isRecord(o) && Array.isArray((o as Record<string, unknown>)[key]);

/* ---------- helpers ---------- */
const toBool = (x: unknown): boolean =>
  x === true || x === 1 || x === "1" || x === "true";

/** Bazı BE'ler { data: ... } döndürüyor → zarfı aç */
function unwrapData(raw: unknown): unknown {
  if (isRecord(raw) && "data" in raw) {
    const d = (raw as { data?: unknown }).data;
    return typeof d === "undefined" ? raw : d;
  }
  return raw;
}

/** html'i derinden çıkar (double-encoded JSON'ları da çöz) */
function extractHtmlDeep(rawField: unknown): string {
  if (rawField == null) return "";
  let cand: unknown = rawField;

  for (let i = 0; i < 4; i++) {
    // 1) object → html alanı
    if (isRecord(cand)) {
      const obj = cand as Record<string, unknown>;

      if (typeof obj.html === "string") {
        const s = obj.html.trim();
        if (s.startsWith("{") || s.startsWith("[")) {
          try { cand = JSON.parse(s); continue; } catch { return s; }
        }
        return s;
      }

      if (isRecord(obj.content) && typeof (obj.content as Record<string, unknown>).html === "string") {
        const s = ((obj.content as Record<string, unknown>).html as string).trim();
        if (s.startsWith("{") || s.startsWith("[")) {
          try { cand = JSON.parse(s); continue; } catch { return s; }
        }
        return s;
      }
    }

    // 2) string → JSON mu, düz HTML mi?
    if (typeof cand === "string") {
      const s = cand.trim();
      if (s.startsWith("{") || s.startsWith("[")) {
        try { cand = JSON.parse(s); continue; } catch { return s; }
      }
      return s;
    }

    break;
  }

  return typeof cand === "string" ? cand : "";
}

/** row→view */
const toView = (row: unknown): CustomPageView => {
  const base = unwrapData(row);
  const r = isRecord(base) ? base : {};

  const raw = ("content_html" in r ? r["content_html"] : r["content"]);

  const strOrNull = (v: unknown): string | null =>
    typeof v === "string" ? v : v == null ? null : String(v);

  return {
    id: String(r["id"] ?? ""),
    title: String(r["title"] ?? ""),
    slug: String(r["slug"] ?? ""),
    content: extractHtmlDeep(raw),

    // Görseller
    featured_image: strOrNull(r["featured_image"]),
    featured_image_asset_id: strOrNull(r["featured_image_asset_id"]),
    featured_image_alt: strOrNull(r["featured_image_alt"]),

    meta_title: typeof r["meta_title"] === "string" ? (r["meta_title"] as string) : null,
    meta_description: typeof r["meta_description"] === "string" ? (r["meta_description"] as string) : null,
    is_published: toBool(r["is_published"]),
    created_at: typeof r["created_at"] === "string" ? (r["created_at"] as string) : undefined,
    updated_at: typeof r["updated_at"] === "string" ? (r["updated_at"] as string) : undefined,
  };
};

/** Body map — CREATE (zorunlu alanları gönderir) */
const toApiBodyCreate = (b: UpsertCustomPageBody) => {
  const title = (b.title ?? "").trim();
  const slug = (b.slug ?? "").trim();
  const html = b.content ?? "";

  return {
    title,
    slug,
    // ÖNEMLİ: Sadece düz HTML gönderiyoruz; BE packContent(html) yapacak.
    content: html,
    featured_image: typeof b.featured_image === "string" ? b.featured_image : b.featured_image ?? null,
    featured_image_asset_id:
      typeof b.featured_image_asset_id === "string" ? b.featured_image_asset_id : b.featured_image_asset_id ?? null,
    featured_image_alt:
      typeof b.featured_image_alt === "string" ? b.featured_image_alt : b.featured_image_alt ?? null,
    meta_title: b.meta_title ?? null,
    meta_description: b.meta_description ?? null,
    is_published: typeof b.is_published === "boolean" ? b.is_published : undefined,
    locale: b.locale ?? null, // BE yoksayar
  };
};

/** Body map — PATCH (sadece verilen alanları yollar) */
const toApiBodyPatch = (b: Partial<UpsertCustomPageBody>) => {
  const out: Record<string, unknown> = {};

  if (typeof b.title === "string") out.title = b.title.trim();
  if (typeof b.slug === "string") out.slug = b.slug.trim();
  if (typeof b.content === "string") out.content = b.content;

  if ("featured_image" in (b ?? {})) out.featured_image = b.featured_image ?? null;
  if ("featured_image_asset_id" in (b ?? {})) out.featured_image_asset_id = b.featured_image_asset_id ?? null;
  if ("featured_image_alt" in (b ?? {})) out.featured_image_alt = b.featured_image_alt ?? null;

  if ("meta_title" in (b ?? {})) out.meta_title = b.meta_title ?? null;
  if ("meta_description" in (b ?? {})) out.meta_description = b.meta_description ?? null;
  if (typeof b.is_published === "boolean") out.is_published = b.is_published;
  if ("locale" in (b ?? {})) out.locale = b.locale ?? null; // BE yoksayar

  return out;
};

const BASE = "/admin/custom_pages";

export const customPagesAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listCustomPagesAdmin: b.query<
      CustomPageView[],
      { locale?: string; limit?: number; offset?: number } | void
    >({
      query: () => ({ url: `${BASE}` }),
      transformResponse: (res: unknown): CustomPageView[] => {
        const u = unwrapData(res);
        if (Array.isArray(u)) return u.map(toView);
        if (hasArray(u, "items")) return (u as { items: unknown[] }).items.map(toView);
        return [];
      },
      providesTags: (result) =>
        result
          ? [
            ...result.map((p) => ({ type: "CustomPages" as const, id: p.id })),
            { type: "CustomPages" as const, id: "LIST" },
          ]
          : [{ type: "CustomPages" as const, id: "LIST" }],
    }),

    getCustomPageAdminById: b.query<CustomPageView, string>({
      query: (id) => ({ url: `${BASE}/${id}` }),
      transformResponse: (res: unknown): CustomPageView => toView(res),
      providesTags: (_r, _e, id) => [{ type: "CustomPages", id }],
    }),

    createCustomPageAdmin: b.mutation<CustomPageView, UpsertCustomPageBody>({
      query: (body) => ({ url: `${BASE}`, method: "POST", body: toApiBodyCreate(body) }),
      transformResponse: (res: unknown): CustomPageView => toView(res),
      invalidatesTags: [{ type: "CustomPages", id: "LIST" }],
    }),

    updateCustomPageAdmin: b.mutation<
      CustomPageView,
      { id: string; body: Partial<UpsertCustomPageBody> }
    >({
      query: ({ id, body }) => ({ url: `${BASE}/${id}`, method: "PATCH", body: toApiBodyPatch(body) }),
      transformResponse: (res: unknown): CustomPageView => toView(res),
      invalidatesTags: (_r, _e, arg) => [
        { type: "CustomPages", id: arg.id },
        { type: "CustomPages", id: "LIST" },
      ],
    }),

    deleteCustomPageAdmin: b.mutation<{ ok: true }, string>({
      query: (id) => ({ url: `${BASE}/${id}`, method: "DELETE" }),
      transformResponse: (): { ok: true } => ({ ok: true }),
      invalidatesTags: (_r, _e, id) => [
        { type: "CustomPages", id },
        { type: "CustomPages", id: "LIST" },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListCustomPagesAdminQuery,
  useGetCustomPageAdminByIdQuery,
  useCreateCustomPageAdminMutation,
  useUpdateCustomPageAdminMutation,
  useDeleteCustomPageAdminMutation,
} = customPagesAdminApi;
