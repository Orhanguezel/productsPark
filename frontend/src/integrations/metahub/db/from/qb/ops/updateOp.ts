// =============================================================
// FILE: src/integrations/metahub/db/from/qb/ops/updateOp.ts
// =============================================================
import { BASE_URL } from "../../constants";
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

export async function runUpdate<TRow>(
  built: BuiltUrl,
  originalPayload: Record<string, unknown> | undefined,
  preferReturn?: "representation" | "minimal"
): Promise<FetchResult<TRow[]>> {
  const headers = buildAuthHeaders({
    "content-type": "application/json",
    Prefer: `return=${preferReturn ?? "minimal"}`,
  });

  // ---- Güvenli payload hazırlığı + blog_posts için alan map'i (gerekirse) ----
  const prePayload: Record<string, unknown> = { ...(originalPayload ?? {}) };

  if (built.path === "/blog_posts") {
    // FE isimleri geldiyse BE isimlerine non-destructive map
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

  // 🔧 PUT gereken path'ler
  const mustPut = new Set<string>(["/categories", "/blog_posts"]);
  const methodForThis =
    built.methodOverride ?? (mustPut.has(built.path) ? "PUT" : "PATCH");

  // --- admin/custom_pages için ?id= → /:id hot-fix ---
  let requestUrl = built.url;
  if (built.path === "/admin/custom_pages") {
    const idQ = extractIdFromSearch(requestUrl);
    if (idQ) {
      try {
        const u = new URL(requestUrl, BASE_URL);
        u.pathname = `/admin/custom_pages/${encodeURIComponent(idQ)}`;
        u.searchParams.delete("id");
        u.searchParams.delete("custom_pages.id");
        requestUrl = u.toString();
      } catch {
        /* no-op */
      }
    }
  }

  let res = await fetch(requestUrl, {
    method: methodForThis,
    credentials: "include",
    headers,
    body: JSON.stringify(bodyPayload),
  });

  // ---- categories özel retry mantığı (mevcut davranışı koru) ----
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
            try {
              json = await verify.json();
            } catch {
              json = null;
            }
            let data = parseBodyToRows(json) as TRow[] | null;
            if (data)
              data = normalizeTableRows(
                built.path,
                data as unknown as UnknownRow[]
              ) as unknown as TRow[];
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
        if (res.status === 409)
          return { data: null, error: { message: "duplicate_slug", status: 409 } };
        return { data: null, error: { message: `request_failed_${res.status}`, status: res.status } };
      }
    }
  }

  if (!res.ok) {
    if (res.status === 409)
      return { data: null, error: { message: "duplicate_slug", status: 409 } };
    return { data: null, error: { message: `request_failed_${res.status}`, status: res.status } };
  }

  let json: unknown = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  let data = parseBodyToRows(json) as TRow[] | null;
  if (data)
    data = normalizeTableRows(
      built.path,
      data as unknown as UnknownRow[]
    ) as unknown as TRow[];
  return { data, error: null };
}
