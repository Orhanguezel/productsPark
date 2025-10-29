// =============================================================
// FILE: src/integrations/metahub/db/from/transforms.ts
// =============================================================
import type { UnknownRow } from "../types";

/** payment method mapper */
export function mapPaymentMethod(v: unknown): string | unknown {
  const s = String(v ?? "");
  if (s === "havale" || s === "eft") return "bank_transfer";
  if (s === "paytr_havale") return "paytr";
  return v;
}

/** Para normalize: number/"1 234,50"/"1.234,50" → "1234.50" */
export function asMoney(v: unknown): string {
  if (typeof v === "number") return v.toFixed(2);
  if (typeof v === "string") {
    const n = v
      .trim()
      .replace(/\s+/g, "")
      .replace(/\.(?=\d{3}(?:[.,]|$))/g, "")
      .replace(",", ".");
    const num = Number(n);
    return Number.isFinite(num) ? num.toFixed(2) : "0.00";
  }
  return "0.00";
}

/** orders: FE→BE dönüşüm + eksik items’ı sessionStorage’tan üret */
export function transformOrdersOut(obj: Record<string, unknown>): void {
  const rec: Record<string, unknown> = obj;

  if ("total_amount" in rec) {
    if (!("subtotal" in rec)) rec["subtotal"] = rec["total_amount"];
    delete rec["total_amount"];
  }
  if ("discount_amount" in rec) {
    if (!("discount" in rec)) rec["discount"] = rec["discount_amount"];
    delete rec["discount_amount"];
  }
  if ("final_amount" in rec) {
    if (!("total" in rec)) rec["total"] = rec["final_amount"];
    delete rec["final_amount"];
  }

  if ("payment_method" in rec) rec["payment_method"] = mapPaymentMethod(rec["payment_method"]);

  delete rec["user_id"];
  delete rec["customer_name"];
  delete rec["customer_email"];
  delete rec["customer_phone"];
  delete rec["coupon_id"];

  if (rec["subtotal"] != null) rec["subtotal"] = asMoney(rec["subtotal"]);
  if (rec["discount"] != null) rec["discount"] = asMoney(rec["discount"]);
  if (rec["total"] != null) rec["total"] = asMoney(rec["total"]);

  const itemsUnknown = rec["items"];
  const hasNoItems =
    !("items" in rec) ||
    !Array.isArray(itemsUnknown) ||
    (Array.isArray(itemsUnknown) && itemsUnknown.length === 0);

  if (hasNoItems) {
    try {
      const raw =
        typeof window !== "undefined"
          ? window.sessionStorage.getItem("checkoutData")
          : null;
      if (raw) {
        type CheckoutItem = {
          quantity: number;
          selected_options?: Record<string, unknown> | null;
          products: { id: string; name: string; price: number };
        };
        type CheckoutData = { cartItems?: CheckoutItem[] } | null;

        const cd: CheckoutData = JSON.parse(raw) as CheckoutData;
        const cartItems: CheckoutItem[] = cd?.cartItems ?? [];
        if (cartItems.length > 0) {
          rec["items"] = cartItems.map((ci) => {
            const priceNum = Number(ci.products?.price ?? 0);
            const qtyNum = Number(ci.quantity ?? 1);
            const totalNum = priceNum * qtyNum;
            return {
              product_id: ci.products.id,
              product_name: ci.products.name,
              quantity: qtyNum,
              price: asMoney(priceNum),
              total: asMoney(totalNum),
              options: ci.selected_options ?? null,
            } as Record<string, unknown>;
          });
        }
      }
    } catch {
      /* sessiz geç */
    }
  }
}

/** order_items: FE→BE */
export function transformOrderItemsOut(obj: Record<string, unknown>): void {
  const rec: Record<string, unknown> = obj;

  if ("product_price" in rec && !("price" in rec)) {
    rec["price"] = rec["product_price"];
    delete rec["product_price"];
  }
  if ("total_price" in rec && !("total" in rec)) {
    rec["total"] = rec["total_price"];
    delete rec["total_price"];
  }
  if ("selected_options" in rec && !("options" in rec)) {
    rec["options"] = rec["selected_options"];
    delete rec["selected_options"];
  }
  if (rec["price"] != null) rec["price"] = asMoney(rec["price"]);
  if (rec["total"] != null) rec["total"] = asMoney(rec["total"]);
}

/** payment_requests: FE→BE */
export function transformPaymentRequestsOut(obj: Record<string, unknown>): void {
  const rec: Record<string, unknown> = obj;
  if ("payment_method" in rec) rec["payment_method"] = mapPaymentMethod(rec["payment_method"]);
}

/** categories: FE→BE — UI local alanları at, tip/nullable düzelt */
export function transformCategoriesOut(obj: Record<string, unknown>): void {
  const rec: Record<string, unknown> = obj;

  // UI-only
  delete rec["article_content"];
  delete rec["article_enabled"];

  // Trim
  if (typeof rec["name"] === "string") rec["name"] = (rec["name"] as string).trim();
  if (typeof rec["slug"] === "string") rec["slug"] = (rec["slug"] as string).trim();

  // Boş stringleri null’a çevir
  const nullableStrings = ["description", "image_url", "icon", "seo_title", "seo_description"];
  for (const k of nullableStrings) {
    if (rec[k] === "") rec[k] = null;
  }

  // parent_id ""/undefined → null
  if (rec["parent_id"] === "" || rec["parent_id"] === undefined) {
    rec["parent_id"] = null;
  }

  // Tip güvenliği
  if ("display_order" in rec) rec["display_order"] = Number(rec["display_order"] ?? 0);
  if ("is_featured" in rec) rec["is_featured"] = !!rec["is_featured"];
  if ("is_active" in rec) rec["is_active"] = !!rec["is_active"];

  // Bazı ortamlarda NULL kabul etmeyen kolonlara null göndermeyelim
  const maybeNotNullInDb = ["image_url", "parent_id"];
  for (const k of maybeNotNullInDb) {
    if (rec[k] === null) delete rec[k];
  }
}

/** products: FE→BE — UI-only alanları at, tip normalize */
export function transformProductsOut(obj: Record<string, unknown>): void {
  const rec: Record<string, unknown> = obj;

  const ALLOWED = new Set<string>([
    "name","slug","price","original_price","stock_quantity","category_id","image_url",
    "short_description","description","is_active","show_on_homepage","delivery_type",
    "file_url","api_provider_id","api_product_id","api_quantity",
    "demo_url","demo_embed_enabled","demo_button_text",
    "epin_game_id","epin_product_id","auto_delivery_enabled",
    "min_order","max_order","min_barem","max_barem","barem_step","pre_order_enabled",
    "tax_type","review_count","article_content","article_enabled",
    "custom_fields","badges","quantity_options"
  ]);

  const DROP = ["stock_list","gallery_urls","features","images","usedStock","categories","demo_enabled"];
  DROP.forEach((k) => { if (k in rec) delete rec[k]; });

  for (const k of Object.keys(rec)) {
    if (!ALLOWED.has(k)) delete rec[k];
  }

  if (typeof rec["name"] === "string") rec["name"] = (rec["name"] as string).trim();
  if (typeof rec["slug"] === "string") rec["slug"] = (rec["slug"] as string).trim();

  const NULLABLE = ["image_url","file_url","short_description","description","demo_url","demo_button_text","epin_game_id","epin_product_id","article_content"];
  for (const k of NULLABLE) {
    if (rec[k] === "") rec[k] = null;
  }

  const toNum = (v: unknown, fb = 0) =>
    typeof v === "number" ? v : v == null || v === "" ? fb : Number(v);
  const toInt = (v: unknown, fb = 0) => {
    const n = toNum(v, fb);
    return Number.isFinite(n) ? Math.trunc(n) : fb;
  };
  const toBool = (v: unknown) => v === true || v === 1 || v === "1" || v === "true";

  if ("price" in rec) rec["price"] = toNum(rec["price"], 0);
  if ("original_price" in rec && rec["original_price"] != null) rec["original_price"] = toNum(rec["original_price"], 0);
  if ("stock_quantity" in rec) rec["stock_quantity"] = toInt(rec["stock_quantity"], 0);
  if ("api_quantity" in rec) rec["api_quantity"] = toInt(rec["api_quantity"], 1);
  if ("min_order" in rec) rec["min_order"] = toInt(rec["min_order"], 1);
  if ("max_order" in rec) rec["max_order"] = toInt(rec["max_order"], 0);
  if ("min_barem" in rec) rec["min_barem"] = toInt(rec["min_barem"], 0);
  if ("max_barem" in rec) rec["max_barem"] = toInt(rec["max_barem"], 0);
  if ("barem_step" in rec) rec["barem_step"] = toInt(rec["barem_step"], 0);
  if ("tax_type" in rec) rec["tax_type"] = toInt(rec["tax_type"], 0);
  if ("review_count" in rec) rec["review_count"] = toInt(rec["review_count"], 0);

  ["is_active","show_on_homepage","demo_embed_enabled","auto_delivery_enabled","pre_order_enabled","article_enabled"].forEach(
    (k) => {
      if (k in rec) rec[k] = toBool(rec[k]);
    }
  );

  if (typeof rec["delivery_type"] !== "string" || !rec["delivery_type"]) rec["delivery_type"] = "manual";

  const arrayOrNull = (v: unknown) => (Array.isArray(v) ? v : v == null ? null : v);
  if ("custom_fields" in rec) rec["custom_fields"] = arrayOrNull(rec["custom_fields"]);
  if ("badges" in rec) rec["badges"] = arrayOrNull(rec["badges"]);
  if ("quantity_options" in rec) rec["quantity_options"] = arrayOrNull(rec["quantity_options"]);
}

/** blog_posts: FE→BE — küçük normalize */
export function transformBlogPostsOut(obj: Record<string, unknown>): void {
  const rec: Record<string, unknown> = obj;

  ["excerpt", "content", "image_url", "category"].forEach((k) => {
    if (rec[k] === "") rec[k] = null;
  });

  if ("author_name" in rec && !("author" in rec)) {
    rec["author"] = rec["author_name"];
  }

  if ("is_published" in rec) rec["is_published"] = !!rec["is_published"];
  if ("is_featured" in rec) rec["is_featured"] = !!rec["is_featured"];

  if ("read_time" in rec) delete rec["read_time"];
}

/** custom_pages: FE→BE — public path için (gerekirse) */
export function transformCustomPagesOut(obj: Record<string, unknown>): void {
  const rec: Record<string, unknown> = obj;

  // trim zorunlular
  if (typeof rec["title"] === "string") rec["title"] = (rec["title"] as string).trim();
  if (typeof rec["slug"] === "string") rec["slug"] = (rec["slug"] as string).trim();

  // boş string → null
  ["meta_title", "meta_description"].forEach((k) => {
    if (rec[k] === "") rec[k] = null;
  });

  // content: hem content_html hem content (JSON) gönder
  const html =
    typeof rec["content_html"] === "string"
      ? (rec["content_html"] as string)
      : typeof rec["content"] === "string"
      ? (rec["content"] as string)
      : "";

  rec["content_html"] = html;
  try {
    rec["content"] = JSON.stringify({ html });
  } catch {
    rec["content"] = html;
  }

  // boolean
  if ("is_published" in rec) {
    const v = rec["is_published"];
    rec["is_published"] = v === true || v === 1 || v === "1" || v === "true";
  }
}

/** custom_pages: FE→BE — ADMIN path için özel dönüşüm */
export function transformCustomPagesAdminOut(obj: Record<string, unknown>): void {
  const p: Record<string, unknown> = obj;

  if (typeof p["title"] === "string") p["title"] = (p["title"] as string).trim();
  if (typeof p["slug"] === "string") p["slug"] = (p["slug"] as string).trim();

  // content_html geldiyse content JSON’a çevir
  if (typeof p["content_html"] === "string") {
    p["content"] = JSON.stringify({ html: p["content_html"] as string });
  } else if (typeof p["content"] === "string") {
    // FE bazen düz HTML'i content içinde göndermiş olabilir
    p["content"] = JSON.stringify({ html: p["content"] as string });
  }

  // meta_* undefined/"" ise null gönder
  if (p["meta_title"] === undefined || p["meta_title"] === "") p["meta_title"] = null;
  if (p["meta_description"] === undefined || p["meta_description"] === "") p["meta_description"] = null;

  // boolean → 0/1
  if ("is_published" in p) {
    const ip = p["is_published"];
    p["is_published"] = ip === true || ip === 1 || ip === "1" || ip === "true" ? 1 : 0;
  }

  // id’yi body’den at (update’da path’te, create’te BE üretiyor)
  delete p["id"];
}

/** tek entry point: path’e göre outbound body dönüştür */
export function transformOutgoingPayload(
  path: string,
  payload: UnknownRow | UnknownRow[]
): UnknownRow | UnknownRow[] {
  const apply = (o: UnknownRow): UnknownRow => {
    const obj: Record<string, unknown> = { ...o };
    if (path === "/orders") transformOrdersOut(obj);
    if (path === "/order_items") transformOrderItemsOut(obj);
    if (path === "/payment_requests") transformPaymentRequestsOut(obj);
    if (path === "/categories") transformCategoriesOut(obj);
    if (path === "/products") transformProductsOut(obj);
    if (path === "/blog_posts") transformBlogPostsOut(obj);

    // public vs admin path ayrımı
    if (path === "/custom_pages") {
      transformCustomPagesOut(obj);
    } else if (path === "/admin/custom_pages" || path.startsWith("/admin/custom_pages/")) {
      transformCustomPagesAdminOut(obj);
    }
    return obj;
  };

  return Array.isArray(payload) ? payload.map(apply) : apply(payload);
}
