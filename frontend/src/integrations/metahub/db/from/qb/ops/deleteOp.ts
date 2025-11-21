// =============================================================
// FILE: src/integrations/metahub/db/from/qb/ops/deleteOp.ts
// =============================================================
import { BASE_URL } from "../../../../rtk/constants";
import { buildAuthHeaders } from "../../http";
import type { BuiltUrl } from "../url";
import type { FetchResult } from "../../types";

/** utils */
const isUuid = (s: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);

function lastOf(arr: string[]): string {
  return arr.length ? arr[arr.length - 1] : "";
}

function extractIdFromUrl(u: string): string | null {
  try {
    const url = new URL(u, "http://x");
    const parts = url.pathname.split("/").filter(Boolean);
    const last = lastOf(parts);
    return isUuid(last) ? last : null;
  } catch {
    return null;
  }
}

function extractIdFromSearch(u: string): string | null {
  try {
    const url = new URL(u, BASE_URL);
    // hem ?id= hem de ?custom_pages.id= destekle
    const viaId = url.searchParams.get("id");
    if (viaId) return viaId;
    const viaScoped = url.searchParams.get("custom_pages.id");
    return viaScoped;
  } catch {
    return null;
  }
}

const isCustomPagesEndpoint = (p: string): boolean =>
  /^\/(custom_pages|admin\/custom_pages)(\/|$)/.test(p);

function swapAdminPath(path: string): string {
  if (path.indexOf("/admin/") === 0) {
    return path.replace(/^\/admin\//, "/");
  }
  return "/admin" + (path.indexOf("/") === 0 ? "" : "/") + path;
}

export async function runDelete<TRow>(built: BuiltUrl): Promise<FetchResult<TRow[]>> {
  const headers = buildAuthHeaders();
  const origPath = built.path;
  const isCustom = isCustomPagesEndpoint(origPath);

  // 1) URL’i normalize et: ?id= → /:id
  let requestUrl = built.url;
  if (isCustom) {
    const qId = extractIdFromSearch(requestUrl);
    if (qId) {
      try {
        const u = new URL(requestUrl, BASE_URL);
        u.pathname = origPath + "/" + encodeURIComponent(qId);
        u.search = "";
        requestUrl = u.toString();
      } catch {
        /* no-op */
      }
    }
  }

  // 2) İlk deneme
  let res = await fetch(requestUrl, {
    method: "DELETE",
    credentials: "include",
    headers,
  });

  // 3) 404 ise: alternatif path ile bir daha dene (admin<->public)
  if (!res.ok && res.status === 404 && isCustom) {
    const id = extractIdFromUrl(requestUrl) || extractIdFromSearch(requestUrl);
    if (id) {
      try {
        const alt = new URL(requestUrl, BASE_URL);
        alt.pathname = swapAdminPath(origPath) + "/" + encodeURIComponent(id);
        alt.search = "";
        const resAlt = await fetch(alt.toString(), {
          method: "DELETE",
          credentials: "include",
          headers,
        });

        if (resAlt.ok) {
          res = resAlt;
        } else if (resAlt.status === 404) {
          // 3.b) doğrulama GET'i (zaten silinmişse başarı say)
          const verify = new URL(requestUrl, BASE_URL);
          verify.pathname = origPath + "/" + encodeURIComponent(id);
          verify.search = "";
          const vv = await fetch(verify.toString(), { credentials: "include", headers });

          if (vv.status === 404) {
            // kaynak yok → silinmiş kabul et
            return { data: [] as unknown as TRow[], error: null };
          }

          const verifyAlt = new URL(requestUrl, BASE_URL);
          verifyAlt.pathname = swapAdminPath(origPath) + "/" + encodeURIComponent(id);
          verifyAlt.search = "";
          const vv2 = await fetch(verifyAlt.toString(), { credentials: "include", headers });

          if (vv2.status === 404) {
            return { data: [] as unknown as TRow[], error: null };
          }

          // hâlâ bulunuyor → gerçek 404/diğer hata
          res = resAlt;
        } else {
          res = resAlt;
        }
      } catch {
        /* no-op; res olduğu gibi dönecek */
      }
    }
  }

  if (!res.ok) {
    return { data: null, error: { message: "request_failed_" + String(res.status), status: res.status } };
  }

  // 204/200 → başarı
  return { data: [] as unknown as TRow[], error: null };
}
