// =============================================================
// FILE: src/integrations/metahub/db/normalizeTables.ts
// =============================================================
import { toNumber, numOrNullish, toBool } from "../core/normalize";
import type { UnknownRow } from "./types";

/**
 * Farklı tablolar için gelen ham satırları normalize eder.
 * Not: Bu fonksiyon sadece SELECT akışında çağrılır.
 */
export function normalizeTableRows(path: string, rows: UnknownRow[]): UnknownRow[] {
  if (!Array.isArray(rows)) return rows;

  // /site_settings: value alanı JSON-string gelebilir
  if (path === "/site_settings") {
    return rows.map((r) => {
      const clone: UnknownRow = { ...r };
      if (typeof clone["value"] === "string") {
        try { clone["value"] = JSON.parse(clone["value"] as string); } catch { /* ignore */ }
      }
      return clone;
    });
  }

  if (path === "/menu_items") {
  return rows.map((r) => {
    const c: Record<string, unknown> = { ...r };

    // title → string
    if (typeof c.title !== "string") c.title = String(c.title ?? "");

    // url/href alias
    const rawUrl  = typeof c.url  === "string" ? c.url  : undefined;
    const rawHref = typeof c.href === "string" ? c.href : undefined;
    c.url = rawUrl ?? rawHref ?? "#";

    // 🔧 icon → string | null (undefined bırakma)
    c.icon = typeof c.icon === "string" ? c.icon : null;

    // section_id → string | null
    c.section_id = typeof c.section_id === "string" ? c.section_id : null;

    // position → number | null
    if (c.position != null) {
      const n = Number(c.position as unknown);
      c.position = Number.isFinite(n) ? n : null;
    }

    // is_active → boolean
    const b = toBool(c.is_active);
    c.is_active = b === undefined ? false : b;

    return c as UnknownRow;
  });
}

// 🔸 POPUPS
  if (path === "/popups") {
    return rows.map((r) => {
      const c: Record<string, unknown> = { ...r };

      // string'ler
      if ("title" in c && c.title != null && typeof c.title !== "string") {
        c.title = String(c.title);
      }
      if ("display_pages" in c && c.display_pages != null && typeof c.display_pages !== "string") {
        c.display_pages = String(c.display_pages);
      }
      if ("display_frequency" in c && c.display_frequency != null && typeof c.display_frequency !== "string") {
        c.display_frequency = String(c.display_frequency);
      }

      // boolean
      if ("is_active" in c) {
        const b = toBool(c.is_active);
        if (b !== undefined) c.is_active = b;
      }

      // sayılar
      if ("delay_seconds" in c)           c.delay_seconds    = numOrNullish(c.delay_seconds) ?? null;
      if ("duration_seconds" in c)        c.duration_seconds = numOrNullish(c.duration_seconds) ?? null;
      if ("priority" in c)                c.priority         = numOrNullish(c.priority) ?? null;

      // nested product join sayıları
      if (c.products && typeof c.products === "object") {
        const p = c.products as Record<string, unknown>;
        if ("price" in p)           p.price = toNumber(p.price);
        if ("original_price" in p)  p.original_price = numOrNullish(p.original_price) ?? null;
      }

      return c as UnknownRow;
    });
  }

  // /products: sayılar ve booleanlar normalize edilir
  if (path === "/products") {
    return rows.map((r) => {
      const c: Record<string, unknown> = { ...r };

      // boolean
      if ("is_active" in c) {
        const b = toBool(c.is_active);
        if (b !== undefined) c.is_active = b;
      }

      // sayılar
      if ("price" in c) c.price = toNumber(c.price);
      if ("original_price" in c) c.original_price = (numOrNullish(c.original_price) ?? null);
      if ("rating" in c) c.rating = toNumber(c.rating);

      return c as UnknownRow;
    });
  }

  // product_reviews: rating → number, is_active → boolean
if (path === "/product_reviews") {
  return rows.map((r) => {
    const c: Record<string, unknown> = { ...r };
    if ("rating" in c) c.rating = toNumber(c.rating);
    if ("is_active" in c) {
      const b = toBool(c.is_active);
      if (b !== undefined) c.is_active = b;
    }
    return c as UnknownRow;
  });
}

// product_faqs: display_order → number, is_active → boolean
if (path === "/product_faqs") {
  return rows.map((r) => {
    const c: Record<string, unknown> = { ...r };
    if ("display_order" in c) c.display_order = toNumber(c.display_order);
    if ("is_active" in c) {
      const b = toBool(c.is_active);
      if (b !== undefined) c.is_active = b;
    }
    return c as UnknownRow;
  });
}


// 🔹 FOOTER SECTIONS
  if (path === "/footer_sections") {
    return rows.map((r) => {
      const c: Record<string, unknown> = { ...r };

      // title → string
      if (typeof c.title !== "string") c.title = String(c.title ?? "");

      // display_order → number (yoksa 0)
      const n = Number(c.display_order as unknown);
      c.display_order = Number.isFinite(n) ? n : 0;

      // is_active → boolean
      const b = toBool(c.is_active);
      c.is_active = b === undefined ? false : b;

      return c as UnknownRow;
    });
  }

if (path === "/topbar_settings") {
  return rows.map((r) => {
    const c: Record<string, unknown> = { ...r };

    // BE -> FE alan adları
    c.message = typeof c.text === "string" ? c.text : (c.message ?? "");
    c.link_url = typeof c.link === "string" ? c.link : (c.link_url ?? null);
    if (c.link_url && typeof c.link_text !== "string") {
      c.link_text = "Detaylar"; // isterseniz null bırakın
    }

    // boolean normalizasyonu
    if ("is_active" in c) {
      const v = c.is_active;
      c.is_active = (v === true || v === 1 || v === "1" || v === "true");
    }
    if ("show_ticker" in c) {
      const v = c.show_ticker;
      c.show_ticker = (v === true || v === 1 || v === "1" || v === "true");
    }

    // gereksiz kaynak alanları temiz (opsiyonel)
    delete c.text;
    delete c.link;

    // opsiyoneller
    if (!("coupon_code" in c)) c.coupon_code = null;

    return c as unknown as UnknownRow;
  });
}




























  return rows;
}


