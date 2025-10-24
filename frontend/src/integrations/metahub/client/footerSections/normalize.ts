// src/integrations/metahub/db/normalizeTables.ts
import type { UnknownRow, FooterSectionView, FooterLink } from "./types";
import { toNumber, numOrNullish, toBool } from "@/integrations/metahub/core/normalize";


/** Yardımcılar (any yok) */
const toStrSafe = (x: unknown, fallback = ""): string =>
  typeof x === "string" ? x : fallback;

const toNumSafe = (x: unknown, fallback = 0): number => {
  if (typeof x === "number") return Number.isFinite(x) ? x : fallback;
  if (typeof x === "string") {
    const n = Number(x);
    return Number.isFinite(n) ? n : fallback;
  }
  return fallback;
};

const isFooterLink = (x: unknown): x is FooterLink => {
  if (!x || typeof x !== "object") return false;
  const obj = x as Record<string, unknown>;
  return typeof obj.label === "string" && typeof obj.href === "string";
};

/**
 * /footer_sections satırını UI'nin beklediği FooterSectionView tipine normalize eder.
 * - Parametre tipli: UnknownRow (any yok)
 * - Çıkış: FooterSectionView
 */
export function normalizeFooterSectionView(row: UnknownRow): FooterSectionView {
  // links string geldiyse JSON parse etmeyi dene, dizi ise type guard uygula
  let links: FooterLink[] = [];
  const rawLinks = (row as Record<string, unknown>).links;

  if (typeof rawLinks === "string") {
    try {
      const parsed = JSON.parse(rawLinks) as unknown;
      if (Array.isArray(parsed)) {
        links = parsed.filter(isFooterLink);
      }
    } catch {
      // yok say
    }
  } else if (Array.isArray(rawLinks)) {
    links = rawLinks.filter(isFooterLink);
  }

  return {
    id: toStrSafe((row as Record<string, unknown>).id),
    title: toStrSafe((row as Record<string, unknown>).title),
    display_order: toNumSafe((row as Record<string, unknown>).display_order, 0),
    is_active: Boolean(toBool((row as Record<string, unknown>).is_active)),
    locale: (row as Record<string, unknown>).locale as string | null | undefined ?? null,
    links,
    created_at: (row as Record<string, unknown>).created_at as string | undefined,
    updated_at: (row as Record<string, unknown>).updated_at as string | undefined,
  };
}
