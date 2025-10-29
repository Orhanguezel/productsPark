// =============================================================
// FILE: src/integrations/metahub/db/normalizers/_shared.ts
// =============================================================
export const num = (v: unknown, fb = 0): number => {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) return Number(v);
  return fb;
};

export const stripQuery = (p: string) => p.split("?")[0] || p;

export const isProductsPath = (p: string) => {
  const s = stripQuery(p);
  return (
    s === "/products" ||
    s.startsWith("/products/") ||
    s === "/products/by-slug" ||
    s.startsWith("/products/by-slug/")
  );
};

export const asNumber = (v: unknown, fallback = 0): number => {
  if (typeof v === "number") return Number.isFinite(v) ? v : fallback;
  if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) return Number(v);
  return fallback;
};

export const asNumberOrNull = (v: unknown): number | null => {
  if (v == null) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) return Number(v);
  return null;
};

export const parseStringArray = (v: unknown): string[] | null => {
  if (Array.isArray(v)) return v.map(String).filter(Boolean);
  if (typeof v === "string") {
    const s = v.trim();
    if (!s) return null;
    try {
      const parsed = JSON.parse(s) as unknown;
      if (Array.isArray(parsed)) return (parsed as unknown[]).map(String).filter(Boolean);
    } catch { /* CSV fallback */ }
    const arr = s.split(",").map((x) => x.trim()).filter(Boolean);
    return arr.length ? arr : null;
  }
  return null;
};

export const boolLike = (v: unknown): boolean =>
  v === true || v === 1 || v === "1" || v === "true";

export const firstDefined = (obj: Record<string, unknown>, keys: string[]): unknown => {
  for (const k of keys) {
    if (Object.prototype.hasOwnProperty.call(obj, k) && obj[k] !== undefined) {
      return obj[k];
    }
  }
  return undefined;
};

export const deleteKeyIfExists = (obj: Record<string, unknown>, key: string) => {
  if (Object.prototype.hasOwnProperty.call(obj, key)) {
    delete obj[key];
  }
};
