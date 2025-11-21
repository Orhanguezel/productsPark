// =============================================================
// FILE: src/integrations/metahub/db/from/qb/ops/updateOp.ts
// =============================================================
import { BASE_URL } from "../../../../rtk/constants";
import { buildAuthHeaders, joinUrl } from "../../http";
import { normalizeTableRows } from "../../../normalizeTables";
import { parseBodyToRows } from "../parser";
import { transformOutgoingPayload } from "../../transforms";
import type { BuiltUrl } from "../url";
import type { FetchResult } from "../../types";
import type { UnknownRow } from "../../../types";

function extractIdFromUrl(u: string): string | null {
  try {
    const url = new URL(u, "http://x");
    const parts = url.pathname.split("/").filter(Boolean);
    return parts.length ? parts[parts.length - 1] : null;
  } catch {
    return null;
  }
}

function extractIdFromSearch(u: string): string | null {
  try {
    const url = new URL(u, BASE_URL);
    return url.searchParams.get("id") ?? url.searchParams.get("custom_pages.id");
  } catch {
    return null;
  }
}

// 🔎 site_settings için ?key=... yakala
function extractKeyFromSearch(u: string): string | null {
  try {
    const url = new URL(u, BASE_URL);
    return url.searchParams.get("key");
  } catch {
    return null;
  }
}

function detectValueType(v: unknown): "string" | "number" | "boolean" | "json" {
  if (typeof v === "boolean") return "boolean";
  if (typeof v === "number") return "number";
  if (v !== null && typeof v === "object") return "json";
  return "string";
}

export async function runUpdate<TRow>(
  built: BuiltUrl,
  originalPayload: Record<string, unknown> | undefined,
  preferReturn?: "representation" | "minimal"
): Promise<FetchResult<TRow[]>> {
  const headers = buildAuthHeaders({
    "content-type": "application/json",
    Prefer: `return=${preferReturn ?? "minimal"}`,
  });

  // ---- Güvenli payload hazırlığı + alan map'leri ----
  const prePayload: Record<string, unknown> = { ...(originalPayload ?? {}) };

  if (built.path === "/blog_posts") {
    if (prePayload.author === undefined && prePayload.author_name !== undefined) {
      prePayload.author = prePayload.author_name;
    }
    if (prePayload.featured_image === undefined && prePayload.image_url !== undefined) {
      prePayload.featured_image = prePayload.image_url;
    }
  }

  let bodyPayload: unknown = transformOutgoingPayload(built.path, prePayload);

  if (built.path === "/profiles") {
    bodyPayload = { profile: bodyPayload as Record<string, unknown> };
  }

  // 🔧 PUT gereken path'ler (default davranış)
  const mustPut = new Set<string>(["/categories", "/blog_posts"]);
  let methodForThis: "PUT" | "PATCH" = built.methodOverride ?? (mustPut.has(built.path) ? "PUT" : "PATCH");

  // ---- URL hazırlığı (fetch'ten ÖNCE mutlak) ----
  let requestUrl = built.url;

  // admin/custom_pages için ?id= → /:id hot-fix
  if (built.path === "/admin/custom_pages") {
    const idQ = extractIdFromSearch(requestUrl);
    if (idQ) {
      try {
        const u = new URL(requestUrl, BASE_URL);
        u.pathname = `/admin/custom_pages/${encodeURIComponent(idQ)}`;
        u.searchParams.delete("id");
        u.searchParams.delete("custom_pages.id");
        requestUrl = u.toString();
      } catch { /* no-op */ }
    }
  }

  // ✅ /orders update → /admin/orders/:id/status yönlendirmesi
  if (built.path === "/orders") {
    const idFromUrl = extractIdFromUrl(requestUrl);
    const idFromQuery = extractIdFromSearch(requestUrl);
    const id = idFromUrl || idFromQuery;

    // Durum/nota dönük update ise status endpoint'i kullan
    if (id && ("status" in prePayload || "note" in prePayload || "payment_status" in prePayload)) {
      try {
        const u = new URL(requestUrl, BASE_URL);
        u.pathname = `/admin/orders/${encodeURIComponent(id)}/status`;
        u.search = ""; // gereksiz select/qs yok
        requestUrl = u.toString();

        // BE zod: { status, note } -> güvenli body gönder
        const safe: Record<string, unknown> = {};
        if (prePayload.status !== undefined) safe.status = prePayload.status;
        if (prePayload.note !== undefined) safe.note = prePayload.note;
        bodyPayload = safe;
      } catch { /* no-op */ }
    }
  }

  // ✅ NEW: site_settings → /admin/site_settings/:key (PUT + {key,value,value_type})
  if (built.path === "/admin/site_settings" || built.path === "/site_settings") {
    const keyQ = extractKeyFromSearch(requestUrl);
    const keyFromBody = typeof prePayload.key === "string" ? prePayload.key : null;
    const key = keyQ || keyFromBody;
    if (key) {
      try {
        const u = new URL(requestUrl, BASE_URL);
        u.pathname = `/admin/site_settings/${encodeURIComponent(key)}`;
        u.search = "";
        requestUrl = u.toString();

        // update({ value: ... }) veya doğrudan alanlar gelebilir
        const bodyValue = Object.prototype.hasOwnProperty.call(prePayload, "value")
          ? (prePayload as Record<string, unknown>).value
          : prePayload;

        bodyPayload = {
          key,
          value: bodyValue,
          value_type: detectValueType(bodyValue),
        };

        methodForThis = "PUT";
      } catch { /* no-op */ }
    }
  }

  // ---- İSTEK ----
  let res = await fetch(requestUrl, {
    method: methodForThis,
    credentials: "include",
    headers,
    body: JSON.stringify(bodyPayload),
  });

  // (Not: /payment_requests bloğu mevcut kodda fetch sonrası yazılmıştı; dokunmuyoruz)
  // ✅ NEW: /payment_requests → /admin/payment_requests/:id/status
  if (built.path === "/payment_requests") {
    const id = extractIdFromUrl(requestUrl) || extractIdFromSearch(requestUrl);
    // sadece durum/not güncellemeleri status endpoint’ine gider
    if (id && ("status" in prePayload || "admin_note" in prePayload)) {
      try {
        const u = new URL(requestUrl, BASE_URL);
        u.pathname = `/admin/payment_requests/${encodeURIComponent(id)}/status`;
        u.search = "";
        requestUrl = u.toString();

        const safe: Record<string, unknown> = {};
        if (prePayload.status !== undefined) safe.status = prePayload.status;
        if (prePayload.admin_note !== undefined) safe.admin_note = prePayload.admin_note;
        bodyPayload = safe;
      } catch {/* no-op */ }
    }
  }

  // ---- /categories için mevcut retry mantığı ----
  if (built.path === "/categories" && !res.ok) {
    const status = res.status;

    if (status >= 500) {
      if (originalPayload && "slug" in originalPayload!) {
        const pNoSlug = { ...(originalPayload as Record<string, unknown>) };
        delete pNoSlug.slug;
        const bNoSlug = transformOutgoingPayload(built.path, pNoSlug);
        const res2 = await fetch(built.url, {
          method: "PUT",
          credentials: "include",
          headers,
          body: JSON.stringify(bNoSlug),
        });
        if (res2.ok) res = res2;
      }

      if (!res.ok) {
        const id = extractIdFromUrl(built.url);
        if (id) {
          const verifyUrl = joinUrl(BASE_URL, `/categories/${encodeURIComponent(id)}`);
          const verify = await fetch(verifyUrl, {
            credentials: "include",
            headers: buildAuthHeaders(),
          });
          if (verify.ok) {
            let json: unknown = null;
            try { json = await verify.json(); } catch { json = null; }
            let data = parseBodyToRows(json) as TRow[] | null;
            if (data) data = normalizeTableRows(built.path, data as unknown as UnknownRow[]) as unknown as TRow[];
            return { data, error: null };
          }
        }
        return { data: null, error: { message: `request_failed_${status}`, status } };
      }
    }

    if (status === 400 && originalPayload) {
      if ("is_featured" in originalPayload || "display_order" in originalPayload) {
        const p1 = { ...(originalPayload as Record<string, unknown>) };
        delete p1.is_featured;
        delete p1.display_order;
        const b1: unknown = transformOutgoingPayload(built.path, p1);
        res = await fetch(built.url, {
          method: "PUT",
          credentials: "include",
          headers,
          body: JSON.stringify(b1),
        });
      }

      if (!res.ok && res.status === 400 && "slug" in (originalPayload as Record<string, unknown>)) {
        const p2 = { ...(originalPayload as Record<string, unknown>) };
        delete p2.slug;
        const b2: unknown = transformOutgoingPayload(built.path, p2);
        res = await fetch(built.url, {
          method: "PUT",
          credentials: "include",
          headers,
          body: JSON.stringify(b2),
        });
      }

      if (!res.ok) {
        if (res.status === 409) return { data: null, error: { message: "duplicate_slug", status: 409 } };
        return { data: null, error: { message: `request_failed_${res.status}`, status: res.status } };
      }
    }
  }

  // ---- Genel hata ----
  if (!res.ok) {
    if (res.status === 409) return { data: null, error: { message: "duplicate_slug", status: 409 } };
    return { data: null, error: { message: `request_failed_${res.status}`, status: res.status } };
  }

  // ---- Cevabı normalize et ----
  let json: unknown = null;
  try { json = await res.json(); } catch { json = null; }

  let data = parseBodyToRows(json) as TRow[] | null;
  if (data) data = normalizeTableRows(built.path, data as unknown as UnknownRow[]) as unknown as TRow[];
  return { data, error: null };
}
