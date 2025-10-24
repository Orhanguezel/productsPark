// =============================================================
// FILE: src/integrations/metahub/db/normalizeTables.ts
// =============================================================
import type { UnknownRow, FooterSectionView, FooterLink } from "./types";
import { toNumber, numOrNullish, toBool } from "../core/normalize";

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


  // 🔹 CART ITEMS
  if (path === "/cart_items") {
    return rows.map((r) => {
      const c: Record<string, unknown> = { ...r };

      if ("quantity" in c) c.quantity = toNumber(c.quantity);
      if ("options" in c && typeof c.options === "string") {
        try { c.options = JSON.parse(c.options); } catch { /* ignore */ }
      }

      // join: products normalize (yalın)
      if (c.products && typeof c.products === "object") {
        const p = c.products as Record<string, unknown>;
        if ("price" in p)           p.price = toNumber(p.price);
        if ("stock_quantity" in p)  p.stock_quantity = numOrNullish(p.stock_quantity) ?? null;

        if ("quantity_options" in p && typeof p.quantity_options === "string") {
          try { p.quantity_options = JSON.parse(p.quantity_options as string); } catch { /* ignore */ }
        }
        if ("custom_fields" in p && typeof p.custom_fields === "string") {
          try { p.custom_fields = JSON.parse(p.custom_fields as string); } catch { /* ignore */ }
        }
      }

      return c as UnknownRow;
    });
  }

  // 🔹 COUPONS
  if (path === "/coupons") {
    return rows.map((r) => {
      const c: Record<string, unknown> = { ...r };

      // boolean
      if ("is_active" in c) {
        const b = toBool(c.is_active);
        if (b !== undefined) c.is_active = b;
      }

      // sayılar
      if ("discount_value" in c) c.discount_value = toNumber(c.discount_value);
      if ("max_discount" in c)  c.max_discount  = numOrNullish(c.max_discount) ?? null;
      if ("min_purchase" in c)  c.min_purchase  = toNumber(c.min_purchase);
      if (!("min_purchase" in c) && "min_order_total" in c) {
        c.min_purchase = toNumber(c.min_order_total);
      }

      // tarih alanları string kalır (backend ISO veriyorsa FE direkt kullanır)

      // dizi alanları JSON-string gelebilir
      if ("category_ids" in c && typeof c.category_ids === "string") {
        try { c.category_ids = JSON.parse(c.category_ids as string); } catch { /* ignore */ }
      }
      if ("product_ids" in c && typeof c.product_ids === "string") {
        try { c.product_ids = JSON.parse(c.product_ids as string); } catch { /* ignore */ }
      }

      // discount_type tekilleştirme (percentage/fixed)
      if ("discount_type" in c && typeof c.discount_type === "string") {
        const s = (c.discount_type as string).toLowerCase();
        c.discount_type = s === "percent" ? "percentage" : s === "amount" ? "fixed" : s;
      }

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




if (path === "/blog_posts") {
  return rows.map((r) => {
    const c: Record<string, unknown> = { ...r };

    // BE -> FE alan adları
    const title = typeof c.title === "string" ? c.title : "";
    const slug = typeof c.slug === "string" ? c.slug : "";
    const excerpt = typeof c.excerpt === "string" ? c.excerpt : "";
    const content = typeof c.content === "string" ? c.content : "";

    const author = typeof c.author === "string" ? c.author : "Admin";
    const featured = typeof c.featured_image === "string" ? c.featured_image : "";

    // boolean normalizasyonu
    const ip = c.is_published;
    const is_published =
      ip === true || ip === 1 || ip === "1" || ip === "true" ? true : false;

    // kategori yoksa "Genel"
    const category =
      typeof c.category === "string" && c.category.trim() ? c.category : "Genel";

    // okuma süresi
    const read_time = (() => {
      const stripped = (content as string).replace(/<[^>]*>/g, " ");
      const words = stripped.trim().split(/\s+/).filter(Boolean).length;
      const minutes = Math.max(1, Math.ceil(words / 220));
      return `${minutes} dk`;
    })();

    // FE alanlarına ata
    c.title = title;
    c.slug = slug;
    c.excerpt = excerpt;
    c.content = content;
    c.author_name = author;
    c.image_url = featured;
    c.is_published = is_published;
    c.category = category;
    c.read_time = read_time;

    // FE bekliyor ama DB’de yok → default false
    if (typeof c.is_featured !== "boolean") c.is_featured = false;

    // temizlik
    delete c.author;
    delete c.featured_image;

    return c as UnknownRow;
  });
}

if (path === "/custom_pages") {
  return rows.map((r) => {
    const c: Record<string, unknown> = { ...r };

    // zorunlu alanlar
    const title = typeof c.title === "string" ? c.title : "";
    const slug  = typeof c.slug  === "string" ? c.slug  : "";

    // content: JSON {"html": "..."} | düz string | content_html fallback
    const raw = c.content;
    const isObj = (x: unknown): x is Record<string, unknown> =>
      typeof x === "object" && x !== null;

    let html = "";
    if (typeof raw === "string") {
      try {
        const parsed = JSON.parse(raw) as unknown;
        html = isObj(parsed) && typeof parsed["html"] === "string" ? parsed["html"] : raw;
      } catch {
        html = raw;
      }
    } else if (isObj(raw) && typeof raw["html"] === "string") {
      html = raw["html"] as string;
    } else if (typeof c["content_html"] === "string") {
      html = c["content_html"] as string;
    }

    // boolean normalize
    const ip = c.is_published;
    const is_published = (ip === true || ip === 1 || ip === "1" || ip === "true");

    // meta alanları güvenceye al
    const metaTitle = typeof c.meta_title === "string" ? c.meta_title : null;
    const metaDesc  = typeof c.meta_description === "string" ? c.meta_description : null;

    c.title = title;
    c.slug  = slug;
    c.content = html;           // FE düz HTML bekliyor
    c.is_published = is_published;
    c.meta_title = metaTitle;
    c.meta_description = metaDesc;

    return c as import("./types").UnknownRow;
  });
}

// support_tickets — camel→snake alanları da karşıla
  if (path === "/support_tickets") {
    return rows.map((r) => {
      const c: Record<string, unknown> = { ...r };

      // camel → snake alias
      if (c.user_id === undefined && typeof c.userId === "string") c.user_id = c.userId;
      if (c.created_at === undefined && typeof c.createdAt === "string") c.created_at = c.createdAt;
      if (c.updated_at === undefined && typeof c.updatedAt === "string") c.updated_at = c.updatedAt;

      // boş status/priority normalize
      const s = (c.status as string) ?? "";
      const p = (c.priority as string) ?? "";
      c.status = (s && s.trim()) || "open";
      c.priority = (p && p.trim()) || "medium";

      // category her zaman mevcut olsun (UI bekliyor)
      if (typeof c.category === "undefined") c.category = null;

      return c as UnknownRow;
    });
  }

  // ticket_replies — camel→snake + boolean normalize
  if (path === "/ticket_replies") {
    return rows.map((r) => {
      const c: Record<string, unknown> = { ...r };

      // camel → snake alias
      if (c.ticket_id === undefined && typeof c.ticketId === "string") c.ticket_id = c.ticketId;
      if (c.user_id === undefined && (typeof c.userId === "string" || c.userId === null)) c.user_id = c.userId;
      if (c.created_at === undefined && typeof c.createdAt === "string") c.created_at = c.createdAt;

      // boolean normalize
      const v = c.is_admin ?? c.isAdmin;
      c.is_admin = v === true || v === 1 || v === "1" || v === "true";

      return c as UnknownRow;
    });
  }

// WALLET TRANSACTIONS
if (path === "/wallet_transactions") {
  return rows.map((r) => {
    const c: Record<string, unknown> = { ...r };
    if ("amount" in c) c.amount = Number(c.amount);
    if (!("description" in c) || typeof c.description !== "string") c.description = c.description ?? null;
    if ("order_id" in c && typeof c.order_id !== "string") c.order_id = c.order_id ? String(c.order_id) : null;
    return c as UnknownRow;
  });
}

// WALLET DEPOSIT REQUESTS
if (path === "/wallet_deposit_requests") {
  return rows.map((r) => {
    const c: Record<string, unknown> = { ...r };
    if ("amount" in c) c.amount = Number(c.amount);
    if (typeof c.payment_proof !== "string") c.payment_proof = c.payment_proof ?? null;
    if (typeof c.admin_notes  !== "string") c.admin_notes  = c.admin_notes  ?? null;
    if (typeof c.processed_at !== "string") c.processed_at = c.processed_at ?? null;
    if (typeof c.updated_at   !== "string") c.updated_at   = c.updated_at   ?? c.created_at;
    return c as UnknownRow;
  });
}

// ✅ PROFILES: string sayı → number, tip güvenliği
  if (path === "/profiles") {
    const toNum = (v: unknown): number => {
      if (typeof v === "number") return v;
      if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) return Number(v);
      return 0;
    };

    return rows.map((r) => {
      const c: Record<string, unknown> = { ...r };

      // normalize fields (varsa)
      if ("wallet_balance" in c) c.wallet_balance = toNum(c.wallet_balance);
      if (c.full_name != null) c.full_name = String(c.full_name);
      if (c.phone != null) c.phone = String(c.phone);

      return c as UnknownRow;
    });
  }












  return rows;
}


