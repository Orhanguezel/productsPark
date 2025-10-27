// =============================================================
// FILE: src/integrations/metahub/db/normalizeTables.ts
// =============================================================
import type { UnknownRow, ProductRow } from "./types";
import { toNumber, numOrNullish, toBool } from "../core/normalize";


const num = (v: unknown, fb = 0): number => {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) return Number(v);
  return fb;
};

/**
 * path yardımcıları
 */
const stripQuery = (p: string) => p.split("?")[0] || p;
const isProductsPath = (p: string) => {
  const s = stripQuery(p);
  // /products           -> liste
  // /products/xxx       -> tekil (id ya da slug)
  // /products/by-slug   -> liste/tekil için legacy
  // /products/by-slug/xxx -> tekil legacy
  return (
    s === "/products" ||
    s.startsWith("/products/") ||
    s === "/products/by-slug" ||
    s.startsWith("/products/by-slug/")
  );
};

const asNumber = (v: unknown, fallback = 0): number => {
  if (typeof v === "number") return Number.isFinite(v) ? v : fallback;
  if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) return Number(v);
  return fallback;
};
const asNumberOrNull = (v: unknown): number | null => {
  if (v == null) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) return Number(v);
  return null;
};
const parseStringArray = (v: unknown): string[] | null => {
  if (Array.isArray(v)) return v.map(String).filter(Boolean);
  if (typeof v === "string") {
    const s = v.trim();
    if (!s) return null;
    try {
      const parsed = JSON.parse(s) as unknown;
      if (Array.isArray(parsed)) return (parsed as unknown[]).map(String).filter(Boolean);
    } catch {
      // CSV fallback
    }
    const arr = s.split(",").map((x) => x.trim()).filter(Boolean);
    return arr.length ? arr : null;
  }
  return null;
};
const boolLike = (v: unknown): boolean =>
  v === true || v === 1 || v === "1" || v === "true";

/** küçük yardımcılar (any yok) */
const firstDefined = (obj: Record<string, unknown>, keys: string[]): unknown => {
  for (const k of keys) {
    if (Object.prototype.hasOwnProperty.call(obj, k) && obj[k] !== undefined) {
      return obj[k];
    }
  }
  return undefined;
};
const deleteKeyIfExists = (obj: Record<string, unknown>, key: string) => {
  if (Object.prototype.hasOwnProperty.call(obj, key)) {
    delete obj[key];
  }
};

/**
 * Farklı tablolar için gelen ham satırları normalize eder.
 * Not: Bu fonksiyon sadece SELECT akışında çağrılır.
 */
export function normalizeTableRows(path: string, rows: UnknownRow[]): UnknownRow[] {
  if (path === "/categories") {
    return rows.map((r) => {
      const row = r as Record<string, unknown>;
      return {
        ...row,
        description: row.description ?? null,
        image_url: row.image_url ?? null,
        icon: row.icon ?? null,
        parent_id: row.parent_id ?? null,
        // ✅ boolean normalize
        is_active: !!(row.is_active ?? 1),
        is_featured: !!(row.is_featured ?? 0),
        display_order: Number(row.display_order ?? 0),
        // ✅ FE-only alanları güvenli default ile sağla (TS2339 fix)
        article_content: (row ).article_content ?? "",
        article_enabled: !!((row ).article_enabled ?? false),
      };
    });
  }

  if (path === "/menu_items") {
    return rows.map((r) => {
      const c: Record<string, unknown> = { ...r };

      // title → string
      if (typeof c.title !== "string") c.title = String(c.title ?? "");

      // url/href alias
      const rawUrl = typeof c.url === "string" ? c.url : undefined;
      const rawHref = typeof c.href === "string" ? c.href : undefined;
      c.url = rawUrl ?? rawHref ?? "#";

      // icon → string | null (undefined bırakma)
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
      if ("delay_seconds" in c) c.delay_seconds = numOrNullish(c.delay_seconds) ?? null;
      if ("duration_seconds" in c) c.duration_seconds = numOrNullish(c.duration_seconds) ?? null;
      if ("priority" in c) c.priority = numOrNullish(c.priority) ?? null;

      // nested product join sayıları
      if (c.products && typeof c.products === "object") {
        const p = c.products as Record<string, unknown>;
        if ("price" in p) p.price = toNumber(p.price);
        if ("original_price" in p) p.original_price = numOrNullish(p.original_price) ?? null;
      }

      return c as UnknownRow;
    });
  }

  // ---------- PRODUCTS (liste + tekil tüm rotalar) ----------
  if (isProductsPath(path)) {
    return rows.map((r: ProductRow | UnknownRow) => {
      const c: Record<string, unknown> = { ...(r as Record<string, unknown>) };

      // sayısallar
      c.price = asNumber(c.price, 0);

      const hasOriginal = Object.prototype.hasOwnProperty.call(c, "original_price");
      const hasCompare = Object.prototype.hasOwnProperty.call(c, "compare_at_price");
      const origVal = hasOriginal
        ? (c["original_price"] as unknown)
        : hasCompare
        ? (c["compare_at_price"] as unknown)
        : null;
      c.original_price = origVal != null ? asNumber(origVal, 0) : null;

      c.cost = asNumberOrNull(c.cost);
      c.rating = c.rating != null ? asNumber(c.rating, 5) : 5;
      c.review_count =
        c.review_count != null ? Math.max(0, Math.floor(asNumber(c.review_count, 0))) : 0;

      // stok (varsa int'e indir)
      if ("stock_quantity" in c) {
        const sq = asNumber(c.stock_quantity, 0);
        c.stock_quantity = Math.max(0, Math.floor(sq));
      }

      // galeriler (boş diziye de fallback uygula)
      const galleryA = parseStringArray(c.gallery_urls);
      const galleryB = parseStringArray(c.images);
      let gallery = galleryA ?? galleryB ?? null;
      if (
        (!gallery || gallery.length === 0) &&
        typeof c.image_url === "string" &&
        c.image_url.trim()
      ) {
        gallery = [c.image_url as string];
      }
      c.gallery_urls = gallery;

      // boole’ler
      c.is_active = boolLike(c.is_active);
      c.is_featured = boolLike(c.is_featured);
      c.requires_shipping = boolLike(c.requires_shipping);
      c.article_enabled = boolLike(c.article_enabled);
      c.demo_embed_enabled = boolLike(c.demo_embed_enabled);

      // JSON-string alanlar
      const tryParse = <T>(x: unknown): T | null => {
        if (x == null) return null;
        if (typeof x === "string") {
          try {
            return JSON.parse(x) as T;
          } catch {
            return null;
          }
        }
        return x as T;
      };
      c.quantity_options = tryParse<Array<{ quantity: number; price: number }>>(c.quantity_options);
      c.badges = tryParse<Array<{ text: string; icon?: string | null; active: boolean }>>(c.badges);
      c.custom_fields = tryParse<
        Array<{ id: string; label: string; type: string; placeholder?: string | null; required: boolean }>
      >(c.custom_fields);

      // kategori objesi (join edilmişse)
      if (c.categories && typeof c.categories === "object") {
        const k = c.categories as Record<string, unknown>;
        c.categories = {
          id: typeof k.id === "string" ? k.id : String(k.id ?? ""),
          name: typeof k.name === "string" ? k.name : "",
          slug: typeof k.slug === "string" ? k.slug : "", // undefined bırakmayalım
        };
      }

      return c as unknown as import("./types").UnknownRow;
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

      // FE/BE isim birliği → selected_options (string geldiyse parse et)
      if ("selected_options" in c && typeof c.selected_options === "string") {
        try {
          c.selected_options = JSON.parse(c.selected_options) as unknown;
        } catch {
          /* ignore */
        }
      }

      // join: products normalize
      if (c.products && typeof c.products === "object") {
        const p = c.products as Record<string, unknown>;
        if ("price" in p) p.price = toNumber(p.price);
        if ("stock_quantity" in p) p.stock_quantity = numOrNullish(p.stock_quantity) ?? null;

        if ("quantity_options" in p && typeof p.quantity_options === "string") {
          try {
            p.quantity_options = JSON.parse(p.quantity_options) as unknown;
          } catch {
            /* ignore */
          }
        }
        if ("custom_fields" in p && typeof p.custom_fields === "string") {
          try {
            p.custom_fields = JSON.parse(p.custom_fields) as unknown;
          } catch {
            /* ignore */
          }
        }
      }

      return c as UnknownRow;
    });
  }

   // --- /orders → UI alanları (OrderView) ---
  if (path === "/orders") {
    return rows.map((r) => {
      const c: Record<string, unknown> = { ...r };

      // zorunlu stringler (UI required)
      c.customer_name  = typeof c.customer_name  === "string" ? c.customer_name  : "";
      c.customer_email = typeof c.customer_email === "string" ? c.customer_email : "";
      c.customer_phone = c.customer_phone ?? null;

      // sayılar: DB alanlarından türet
      const subtotal = num(c["subtotal"] ?? c["total_amount"], 0);
      const discount = num(c["discount"] ?? c["discount_amount"], 0);
      const total    = num(c["total"]    ?? c["final_amount"], 0);

      c.total_amount    = subtotal;
      c.discount_amount = discount;
      c.final_amount    = total;

      // durumlar
      c.status         = typeof c.status === "string" ? c.status : "pending";
      c.payment_status = typeof c.payment_status === "string" ? c.payment_status : "pending";
      c.payment_method = (c.payment_method ?? null) as string | null;

      if (typeof c.notes !== "string") c.notes = c.notes ?? null;

      // kaynak alanları temizle
      delete c["subtotal"];
      delete c["discount"];
      delete c["total"];

      return c as UnknownRow;
    });
  }

  // --- /order_items → UI alanları (OrderItemView) ---
  if (path === "/order_items") {
    return rows.map((r) => {
      const c: Record<string, unknown> = { ...r };

      const unit = num(c["price"] ?? c["product_price"], 0);
      const ttl  = num(c["total"] ?? c["total_price"], 0);

      c.product_price = unit;
      c.total_price   = ttl;

      if ("options" in c && typeof c.options === "string") {
        try { c.options = JSON.parse(c.options as string); } catch { /* ignore */ }
      }
      if ("options" in c && c.selected_options === undefined) {
        c.selected_options = c.options as Record<string, string> | null;
      }
      if (c.selected_options === undefined) c.selected_options = null;

      if (typeof c.delivery_status !== "string") c.delivery_status = c.delivery_status ?? "pending";

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
      if ("max_discount" in c) c.max_discount = numOrNullish(c.max_discount) ?? null;
      if ("min_purchase" in c) c.min_purchase = toNumber(c.min_purchase);
      if (!("min_purchase" in c) && "min_order_total" in c) {
        c.min_purchase = toNumber(c.min_order_total);
      }

      // dizi alanları JSON-string gelebilir
      if ("category_ids" in c && typeof c.category_ids === "string") {
        try {
          c.category_ids = JSON.parse(c.category_ids) as unknown;
        } catch {
          /* ignore */
        }
      }
      if ("product_ids" in c && typeof c.product_ids === "string") {
        try {
          c.product_ids = JSON.parse(c.product_ids) as unknown;
        } catch {
          /* ignore */
        }
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
        c.link_text = "Detaylar";
      }

      // boolean normalizasyonu
      if ("is_active" in c) {
        const v = c.is_active;
        c.is_active = v === true || v === 1 || v === "1" || v === "true";
      }
      if ("show_ticker" in c) {
        const v = c.show_ticker;
        c.show_ticker = v === true || v === 1 || v === "1" || v === "true";
      }

      // gereksiz kaynak alanları temiz (opsiyonel)
      deleteKeyIfExists(c, "text");
      deleteKeyIfExists(c, "link");

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
      const is_published = ip === true || ip === 1 || ip === "1" || ip === "true";

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
      deleteKeyIfExists(c, "author");
      deleteKeyIfExists(c, "featured_image");

      return c as UnknownRow;
    });
  }

  if (path === "/custom_pages") {
    return rows.map((r) => {
      const c: Record<string, unknown> = { ...r };

      // zorunlu alanlar
      const title = typeof c.title === "string" ? c.title : "";
      const slug = typeof c.slug === "string" ? c.slug : "";

      // content: JSON {"html": "..."} | düz string | content_html fallback
      const raw = c.content;
      const isObj = (x: unknown): x is Record<string, unknown> =>
        typeof x === "object" && x !== null;

      let html = "";
      if (typeof raw === "string") {
        try {
          const parsed = JSON.parse(raw) as unknown;
          html = isObj(parsed) && typeof parsed["html"] === "string" ? (parsed["html"] as string) : raw;
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
      const is_published = ip === true || ip === 1 || ip === "1" || ip === "true";

      // meta alanları güvenceye al
      const metaTitle = typeof c.meta_title === "string" ? c.meta_title : null;
      const metaDesc = typeof c.meta_description === "string" ? c.meta_description : null;

      c.title = title;
      c.slug = slug;
      c.content = html; // FE düz HTML bekliyor
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
      const cr = c as Record<string, unknown>;
      if (c.user_id === undefined && typeof cr.userId === "string") c.user_id = cr.userId;
      if (c.created_at === undefined && typeof cr.createdAt === "string") c.created_at = cr.createdAt;
      if (c.updated_at === undefined && typeof cr.updatedAt === "string") c.updated_at = cr.updatedAt;

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
      const cr = c as Record<string, unknown>;

      // camel → snake alias
      if (c.ticket_id === undefined && typeof cr.ticketId === "string") c.ticket_id = cr.ticketId;
      if (c.user_id === undefined && (typeof cr.userId === "string" || cr.userId === null))
        c.user_id = cr.userId as string | null;
      if (c.created_at === undefined && typeof cr.createdAt === "string") c.created_at = cr.createdAt;

      // boolean normalize
      const v = cr.is_admin ?? cr.isAdmin;
      c.is_admin = v === true || v === 1 || v === "1" || v === "true";

      return c as UnknownRow;
    });
  }

  // WALLET TRANSACTIONS
  if (path === "/wallet_transactions") {
    return rows.map((r) => {
      const c: Record<string, unknown> = { ...r };
      if ("amount" in c) c.amount = Number(c.amount);
      if (!("description" in c) || typeof c.description !== "string")
        c.description = c.description ?? null;
      if ("order_id" in c && typeof c.order_id !== "string")
        c.order_id = c.order_id ? String(c.order_id) : null;
      return c as UnknownRow;
    });
  }

  // WALLET DEPOSIT REQUESTS
  if (path === "/wallet_deposit_requests") {
    return rows.map((r) => {
      const c: Record<string, unknown> = { ...r };
      if ("amount" in c) c.amount = Number(c.amount);
      if (typeof c.payment_proof !== "string") c.payment_proof = c.payment_proof ?? null;
      if (typeof c.admin_notes !== "string") c.admin_notes = c.admin_notes ?? null;
      if (typeof c.processed_at !== "string") c.processed_at = c.processed_at ?? null;
      if (typeof c.updated_at !== "string") c.updated_at = c.updated_at ?? c.created_at;
      return c as UnknownRow;
    });
  }

  // ✅ PROFILES
  if (path === "/profiles") {
    const toNum = (v: unknown): number => {
      if (typeof v === "number") return v;
      if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) return Number(v);
      return 0;
    };

    return rows.map((r) => {
      const c: Record<string, unknown> = { ...r };
      if ("wallet_balance" in c) c.wallet_balance = toNum(c.wallet_balance);
      if (c.full_name != null) c.full_name = String(c.full_name);
      if (c.phone != null) c.phone = String(c.phone);
      return c as UnknownRow;
    });
  }


if (path === "/categories") {
  return rows.map((r) => {
    const c: Record<string, unknown> = { ...r };
    const b = (x: unknown) => x === true || x === 1 || x === "1" || x === "true";
    const n = (x: unknown) => (typeof x === "number" ? x : Number(x ?? 0)) || 0;

    c.is_featured = b(c.is_featured);
    c.is_active = b(c.is_active); // varsa
    c.display_order = n(c.display_order);

    return c as unknown as import("./types").UnknownRow;
  });
}














  return rows;
}
