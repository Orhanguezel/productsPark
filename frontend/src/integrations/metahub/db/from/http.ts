// =============================================================
// FILE: src/integrations/metahub/db/from/http.ts
// =============================================================
import type { FetchResult } from "./types";

export function joinUrl(base: string, path: string): string {
  if (!base) return path;
  const b = base.replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${b}${p}`;
}

export function toQS(params: Record<string, unknown>): string {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    if (Array.isArray(v)) {
      // Çoklu param desteği: ?k=a&k=b
      v.forEach((item) => usp.append(k, String(item)));
    } else if (typeof v === "object") {
      // Basit object için JSON.stringify (örn: filter objesi)
      usp.set(k, JSON.stringify(v));
    } else {
      usp.set(k, String(v));
    }
  });
  return usp.toString();
}

export function readCountFromHeaders(res: Response): number | undefined {
  const xTotal = res.headers.get("x-total-count");
  if (xTotal && !Number.isNaN(Number(xTotal))) return Number(xTotal);
  const cr = res.headers.get("content-range");
  if (cr) {
    const m = cr.match(/\/(\d+)$/);
    if (m && m[1] && !Number.isNaN(Number(m[1]))) return Number(m[1]);
  }
  return undefined;
}

/** Tüm istekler için ortak auth header’ları hazırla */
export function buildAuthHeaders(extra?: Record<string, string>): HeadersInit {
  const headers: Record<string, string> = {
    accept: "application/json",
    ...(extra ?? {}),
  };
  try {
    const lsToken =
      typeof window !== "undefined" ? window.localStorage.getItem("metahub:token") : null;
    const envToken = (import.meta.env.VITE_API_TOKEN as string | undefined) || null;
    const token = lsToken || envToken;
    if (token) headers["Authorization"] = `Bearer ${token}`;
  } catch {
    /* ignore */
  }
  return headers;
}

export async function readJson(res: Response) {
  const ct = res.headers.get("content-type") || "";
  const text = await res.text();
  if (ct.includes("application/json")) {
    try {
      return JSON.parse(text);
    } catch {
      /* ignore */
    }
  }
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/** küçük yardımcı: body'den dizi çıkar */
export function extractArray(payload: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(payload)) return payload as Array<Record<string, unknown>>;
  if (payload && typeof payload === "object" && "data" in (payload as Record<string, unknown>)) {
    const d = (payload as { data?: unknown }).data;
    if (Array.isArray(d)) return d as Array<Record<string, unknown>>;
  }
  return [];
}
