// src/modules/storage/_util.ts


import { env } from "@/core/env";

const encSeg = (s: string) => encodeURIComponent(s);
const encPath = (p: string) => p.split("/").map(encSeg).join("/");

/** Provider URL varsa onu kullan, yoksa CDN_PUBLIC_BASE > PUBLIC_API_BASE > /storage/... */
export function publicUrlOf(bucket: string, path: string, providerUrl?: string | null): string {
  if (providerUrl) return providerUrl;
  const cdnBase = (env.CDN_PUBLIC_BASE || "").replace(/\/+$/, "");
  if (cdnBase) return `${cdnBase}/${encSeg(bucket)}/${encPath(path)}`;
  const apiBase = (env.PUBLIC_API_BASE || "").replace(/\/+$/, "");
  return `${apiBase || ""}/storage/${encSeg(bucket)}/${encPath(path)}`;
}

export function publicUrlForAsset(asset: { bucket: string; path: string; url?: string | null }) {
  return publicUrlOf(asset.bucket, asset.path, asset.url ?? null);
}


export const stripLeadingSlashes = (s: string) => s.replace(/^\/+/, "");
export const normalizeFolder = (s?: string | null) => {
  if (!s) return null;
  let f = s.trim().replace(/^\/+|\/+$/g, "").replace(/\/{2,}/g, "/");
  return f.length ? f.slice(0, 255) : null;
};

export function chunk<T>(arr: T[], size = 100) {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}
