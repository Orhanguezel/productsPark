// =============================================================
// FILE: src/integrations/metahub/db/from.ts
// =============================================================

import { normalizeTableRows } from "./normalizeTables";
import type { KnownTables, TableRow, UnknownRow } from "./types";
export type { KnownTables, TableRow, UnknownRow } from "./types";
export type {
  ProductRow, CategoryRow, SiteSettingRow, MenuItemRow, FooterSectionRow,
  PopupRow, UserRoleRow, TopbarSettingRow, BlogPostRow, CouponRow, CartItemRow,
  CustomPageView, SupportTicketView, TicketReplyView, ProfileRow, WalletTransactionRow, WalletDepositRequestRow,
  OrderRow, OrderView, ApiProviderRow
} from "./types";

import { TABLES } from "./tables";

/** BASE URL */
const RAW_BASE_URL =
  ((import.meta.env.VITE_API_URL as string | undefined) ||
    (import.meta.env.VITE_METAHUB_URL as string | undefined) ||
    ""
  ).replace(/\/+$/, "");
export const BASE_URL = RAW_BASE_URL;
export const EDGE_URL = BASE_URL;
export const APP_URL = BASE_URL;

export type ResultError = { message: string; status?: number; raw?: unknown };
export type FetchResult<T> = { data: T | null; error: ResultError | null; count?: number };

/** helpers */
type Filter =
  | { type: "eq"; col: string; val: unknown }
  | { type: "neq"; col: string; val: unknown }
  | { type: "in"; col: string; val: unknown[] };
type Order = { col: string; ascending?: boolean };
type SelectOpts = { count?: "exact" | "planned" | "estimated"; head?: boolean };
type Op = "select" | "insert" | "update" | "delete";

function joinUrl(base: string, path: string): string {
  if (!base) return path;
  return `${base.replace(/\/+$/, "")}${path}`;
}
function toQS(params: Record<string, unknown>): string {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    usp.set(k, String(v));
  });
  return usp.toString();
}
function readCountFromHeaders(res: Response): number | undefined {
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
function buildAuthHeaders(extra?: Record<string, string>): HeadersInit {
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
  } catch { /* ignore */ }
  return headers;
}

async function readJson(res: Response) {
  const ct = res.headers.get("content-type") || "";
  const text = await res.text();
  if (ct.includes("application/json")) {
    try { return JSON.parse(text); } catch {/* ignore */}
  }
  try { return JSON.parse(text); } catch { return text; }
}

/** küçük yardımcı: body'den dizi çıkar */
function extractArray(payload: unknown): UnknownRow[] {
  if (Array.isArray(payload)) return payload as UnknownRow[];
  if (payload && typeof payload === "object" && "data" in (payload as Record<string, unknown>)) {
    const d = (payload as { data?: unknown }).data;
    if (Array.isArray(d)) return d as UnknownRow[];
  }
  return [];
}

/** payment method mapper */
function mapPaymentMethod(v: unknown): string | unknown {
  const s = String(v ?? "");
  if (s === "havale" || s === "eft") return "bank_transfer";
  if (s === "paytr_havale") return "paytr";
  return v;
}

/** Para normalize: number/"1 234,50"/"1.234,50" → "1234.50" */
function asMoney(v: unknown): string {
  if (typeof v === "number") return v.toFixed(2);
  if (typeof v === "string") {
    const n = v.trim().replace(/\s+/g, "")
      .replace(/\.(?=\d{3}(?:[.,]|$))/g, "")
      .replace(",", ".");
    const num = Number(n);
    return Number.isFinite(num) ? num.toFixed(2) : "0.00";
  }
  return "0.00";
}

/** orders: FE→BE dönüşüm + eksik items’ı sessionStorage’tan üret */
function transformOrdersOut(obj: Record<string, unknown>): void {
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
      const raw = typeof window !== "undefined" ? window.sessionStorage.getItem("checkoutData") : null;
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
    } catch { /* sessiz geç */ }
  }
}

/** order_items: FE→BE */
function transformOrderItemsOut(obj: Record<string, unknown>): void {
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
function transformPaymentRequestsOut(obj: Record<string, unknown>): void {
  const rec: Record<string, unknown> = obj;
  if ("payment_method" in rec) rec["payment_method"] = mapPaymentMethod(rec["payment_method"]);
}

/** categories: FE→BE — UI local alanları at, tip/nullable düzelt */
function transformCategoriesOut(obj: Record<string, unknown>): void {
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
function transformProductsOut(obj: Record<string, unknown>): void {
  const rec: Record<string, unknown> = obj;

  // İzinli alanlar (BE şemasıyla uyumlu)
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

  // UI-only / backend-dışı alanları kesin at
  const DROP = [
    "stock_list",
    "gallery_urls",
    "features",
    "images",
    "usedStock",
    "categories", // join objesi
    "demo_enabled" // FE toggle’dan derive ediliyor
  ];
  DROP.forEach((k) => { if (k in rec) delete rec[k]; });

  // Allowed dışındakileri temizle
  for (const k of Object.keys(rec)) {
    if (!ALLOWED.has(k)) delete rec[k];
  }

  // Trim strings
  if (typeof rec["name"] === "string") rec["name"] = (rec["name"] as string).trim();
  if (typeof rec["slug"] === "string") rec["slug"] = (rec["slug"] as string).trim();

  // Boş string → null
  const NULLABLE = ["image_url","file_url","short_description","description","demo_url","demo_button_text","epin_game_id","epin_product_id","article_content"];
  for (const k of NULLABLE) {
    if (rec[k] === "") rec[k] = null;
  }

  // Number normalize
  const toNum = (v: unknown, fb = 0) => (typeof v === "number" ? v : (v == null || v === "" ? fb : Number(v)));
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

  // Boolean normalize
  ["is_active","show_on_homepage","demo_embed_enabled","auto_delivery_enabled","pre_order_enabled","article_enabled"]
    .forEach((k) => { if (k in rec) rec[k] = toBool(rec[k]); });

  // delivery_type default
  if (typeof rec["delivery_type"] !== "string" || !rec["delivery_type"]) rec["delivery_type"] = "manual";

  // JSON alanları: boş array ise [], yoksa null
  const arrayOrNull = (v: unknown) => Array.isArray(v) ? v : (v == null ? null : v);
  if ("custom_fields" in rec) rec["custom_fields"] = arrayOrNull(rec["custom_fields"]);
  if ("badges" in rec) rec["badges"] = arrayOrNull(rec["badges"]);
  if ("quantity_options" in rec) rec["quantity_options"] = arrayOrNull(rec["quantity_options"]);
}

/** outgoing body transform */
function transformOutgoingPayload(
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
    return obj;
  };
  return Array.isArray(payload) ? payload.map(apply) : apply(payload);
}

/** ---------- SPECIAL QUERIES ---------- */

/** ApiProvidersQuery: /admin/api-providers GET proxy */
class ApiProvidersQuery implements PromiseLike<FetchResult<TableRow<"api_providers">[]>> {
  private _isActive?: boolean;
  private _order?: { col: string; ascending?: boolean };

  select(_cols?: string, _opts?: SelectOpts): this { return this; }
  eq(col: string, val: unknown): this {
    if (col === "is_active") {
      this._isActive = (val === true) || (val === 1) || (val === "1") || (val === "true");
    }
    return this;
  }
  neq(_col: string, _val: unknown): this { return this; }
  in(_col: string, _val: unknown[]): this { return this; }
  order(col: string, o?: { ascending?: boolean }): this { this._order = { col, ascending: o?.ascending }; return this; }
  limit(_n: number): this { return this; }
  range(_a: number, _b: number): this { return this; }
  insert(_v: UnknownRow | UnknownRow[]): this { return this; }
  update(_v: Partial<UnknownRow>): this { return this; }
  delete(): this { return this; }

  async single(): Promise<FetchResult<TableRow<"api_providers">>> {
    const r = await this.execute();
    const one = (r.data?.[0] ?? null) as TableRow<"api_providers"> | null;
    return { data: one, error: r.error, count: r.count };
  }
  async maybeSingle(): Promise<FetchResult<TableRow<"api_providers">>> { return this.single(); }

  then<TResult1 = FetchResult<TableRow<"api_providers">[]>, TResult2 = never>(
    onfulfilled?: ((value: FetchResult<TableRow<"api_providers">[]>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(
      (v) => (onfulfilled ? onfulfilled(v) : (v as unknown as TResult1)),
      (e) => { if (onrejected) return onrejected(e); throw e; }
    );
  }

  private async execute(): Promise<FetchResult<TableRow<"api_providers">[]>> {
    const q: Record<string, unknown> = {};
    if (this._isActive !== undefined) q.is_active = this._isActive ? 1 : 0;
    if (this._order) q.order = this._order.ascending === false ? `${this._order.col}.desc` : `${this._order.col}.asc`;

    const url = joinUrl(BASE_URL, "/admin/api-providers") + (Object.keys(q).length ? `?${toQS(q)}` : "");
    const res = await fetch(url, { credentials: "include", headers: buildAuthHeaders() });
    if (!res.ok) return { data: null, error: { message: `request_failed_${res.status}`, status: res.status } };

    const body = await readJson(res);
    const raw = extractArray(body);
    const data = raw.map((x) => ({
      ...x,
      is_active:
        x["is_active"] === true || x["is_active"] === 1 || x["is_active"] === "1" || x["is_active"] === "true",
    })) as TableRow<"api_providers">[];
    return { data, error: null };
  }
}

/** ---------- DEFAULT QB (real tables) ---------- */

class QB<TRow = unknown> implements PromiseLike<FetchResult<TRow[]>> {
  private table: string;
  private _select = "*";
  private _filters: Filter[] = [];
  private _order?: Order;
  private _limit?: number;
  private _range?: [number, number];
  private _selectOpts: SelectOpts = {};
  private _op: Op = "select";
  private _insertPayload?: UnknownRow | UnknownRow[];
  private _updatePayload?: Partial<UnknownRow>;
  private _preferReturn?: "representation" | "minimal";

  constructor(table: string) { this.table = table; }

  select(): this;
  select(cols: string, opts?: SelectOpts): this;
  select(cols?: string, opts?: SelectOpts): this {
    const given = (typeof cols === "string" ? cols : "").trim();
    this._select = given.length > 0
      ? given.split(",").map((s) => s.trim()).filter(Boolean).join(",")
      : "*";
    if (opts) this._selectOpts = opts;
    this._preferReturn = "representation";
    return this;
  }

  eq(col: string, val: unknown) { this._filters.push({ type: "eq", col, val }); return this; }
  neq(col: string, val: unknown) { this._filters.push({ type: "neq", col, val }); return this; }
  in(col: string, val: unknown[]) { this._filters.push({ type: "in", col, val }); return this; }
  order(col: string, o?: { ascending?: boolean }) { this._order = { col, ascending: o?.ascending }; return this; }
  limit(n: number) { this._limit = n; return this; }
  range(a: number, b: number) { this._range = [a, b]; return this; }
  insert(v: UnknownRow | UnknownRow[]) { this._op = "insert"; this._insertPayload = v; return this; }
  update(v: Partial<UnknownRow>) { this._op = "update"; this._updatePayload = v; return this; }
  delete() { this._op = "delete"; return this; }

  async single(): Promise<FetchResult<TRow>> {
    const isSelect = this._op === "select";
    const r = isSelect ? await this.limit(1).execute() : await this.execute();
    return { data: (r.data?.[0] ?? null) as TRow | null, error: r.error };
  }

  async maybeSingle(): Promise<FetchResult<TRow>> { return this.single(); }

  then<TResult1 = FetchResult<TRow[]>, TResult2 = never>(
    onfulfilled?: ((v: FetchResult<TRow[]>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(
      onfulfilled ?? ((v) => v as unknown as TResult1),
      onrejected ?? ((r) => { throw r; })
    ) as Promise<TResult1 | TResult2>;
  }

  /** URL builder + özel shımlar (profiles tekil, orders tekil, update/delete :id, products write→admin) */
  private buildUrl(): { url: string; path: string; methodOverride?: "PUT" } | null {
    const logicalPath = TABLES[this.table as KnownTables];
    if (!logicalPath) return null;

    // profiles özel endpoint
    if (this.table === "profiles") {
      const pathForNormalize = "/profiles";
      const meUrl = joinUrl(BASE_URL, "/profiles/v1/me");
      const url = this._op === "select" ? `${meUrl}?${toQS({ select: this._select })}` : meUrl;
      return { url, path: pathForNormalize, methodOverride: this._op === "update" ? "PUT" : undefined };
    }

    const params: Record<string, unknown> = {};

    const wantSelectParam = this._op === "select" || this._preferReturn === "representation";
    if (wantSelectParam) params.select = this._select;

    const includeFilters = this._op === "select" || this._op === "update" || this._op === "delete";
    if (includeFilters) {
      for (const f of this._filters) {
        if (f.type === "eq") params[f.col] = f.val;
        if (f.type === "neq") params[`${f.col}!`] = f.val;
        if (f.type === "in") params[`${f.col}_in`] =
          (Array.isArray(f.val) ? f.val : []).map(String).join(",");
      }
    }

    if (this._op === "select") {
      if (this._order) params.order = this._order.ascending === false ? `${this._order.col}.desc` : `${this._order.col}.asc`;
      if (this._limit != null) params.limit = this._limit;
      if (this._range) { params.offset = this._range[0]; params.limit = (this._range[1] - this._range[0]) + 1; }
    }

    // orders tekil GET (/:id)
    if (logicalPath === "/orders" && includeFilters) {
      const idEq = this._filters.find(f => f.type === "eq" && f.col === "id");
      if (idEq && typeof idEq.val === "string" && this._op === "select" && (this._limit === 1 || !!this._range)) {
        const qs = toQS({ select: this._select });
        const base = joinUrl(BASE_URL, `${logicalPath}/${encodeURIComponent(idEq.val)}`);
        const url = qs ? `${base}?${qs}` : base;
        return { url, path: logicalPath };
      }
    }

    // products write → admin override
    if (logicalPath === "/products") {
      // INSERT → /admin/products
      if (this._op === "insert") {
        const url = joinUrl(BASE_URL, "/admin/products");
        return { url, path: logicalPath };
      }
      // UPDATE/DELETE → /admin/products/:id (varsa), yoksa /admin/products?...
      if (this._op === "update" || this._op === "delete") {
        const idEq = this._filters.find(f => f.type === "eq" && f.col === "id");
        if (idEq && typeof idEq.val === "string") {
          const url = joinUrl(BASE_URL, `/admin/products/${encodeURIComponent(idEq.val)}`);
          return { url, path: logicalPath };
        }
        const base = joinUrl(BASE_URL, "/admin/products");
        const qs = toQS(params);
        const url = qs ? `${base}?${qs}` : base;
        return { url, path: logicalPath };
      }
    }

    // UPDATE/DELETE → RESTful /:id (id varsa)
    if ((this._op === "update" || this._op === "delete") && includeFilters) {
      const idEq = this._filters.find(f => f.type === "eq" && f.col === "id");
      if (idEq && typeof idEq.val === "string") {
        const url = joinUrl(BASE_URL, `${logicalPath}/${encodeURIComponent(idEq.val)}`);
        return { url, path: logicalPath };
      }
    }

    const base = joinUrl(BASE_URL, logicalPath);
    const qs = toQS(params);
    const url = qs ? `${base}?${qs}` : base;
    return { url, path: logicalPath };
  }

  private getHeadersForSelect(): HeadersInit {
    const headers = buildAuthHeaders();
    if (this._selectOpts.count) (headers as Record<string, string>)["Prefer"] = `count=${this._selectOpts.count}`;
    return headers;
  }

  private parseBodyToRows(json: unknown): UnknownRow[] | null {
    if (Array.isArray(json)) return json as UnknownRow[];
    if (json && typeof json === "object") {
      const obj = json as Record<string, unknown>;
      const payload = (Object.prototype.hasOwnProperty.call(obj, "data") ? obj["data"] : json) as unknown;
      if (Array.isArray(payload)) return payload as UnknownRow[];
      if (payload && typeof payload === "object") return [payload as UnknownRow];
      return null;
    }
    return null;
  }

  private async execute(): Promise<FetchResult<TRow[]>> {
    try {
      const built = this.buildUrl();
      if (!built) return { data: null, error: { message: `unknown_table_${this.table}` } };
      const { url, path, methodOverride } = built;

      // SELECT
      if (this._op === "select") {
        const res = await fetch(url, { credentials: "include", headers: this.getHeadersForSelect() });
        if (res.status === 404) return { data: [] as unknown as TRow[], error: null, count: 0 };
        if (!res.ok) return { data: null, error: { message: `request_failed_${res.status}`, status: res.status } };

        const count = readCountFromHeaders(res);
        let json: unknown = null;
        try { json = await res.json(); } catch { json = null; }
        let data = this.parseBodyToRows(json) as TRow[] | null;
        if (data) data = normalizeTableRows(path, data as unknown as UnknownRow[]) as unknown as TRow[];
        return { data, error: null, count };
      }

      // INSERT
      if (this._op === "insert") {
        const headers = buildAuthHeaders({
          "content-type": "application/json",
          "Prefer": `return=${this._preferReturn ?? "minimal"}`
        });

        // Transform payload
        let bodyPayload: UnknownRow | UnknownRow[] =
          transformOutgoingPayload(path, (this._insertPayload ?? {}) as UnknownRow | UnknownRow[]);

        // /products → tekil obje gönder (BE uyumu)
        if (path === "/products") {
          if (Array.isArray(bodyPayload)) {
            bodyPayload = bodyPayload.length === 1 ? bodyPayload[0] : bodyPayload.map((o) => o)[0] ?? {};
          }
        }

        // /categories için özel fallback'ler (mevcut davranış aynen korunuyor)
        let res = await fetch(url, {
          method: "POST",
          credentials: "include",
          headers,
          body: JSON.stringify(bodyPayload),
        });

        if (!res.ok && path === "/categories" && res.status === 400) {
          const original = Array.isArray(bodyPayload) ? bodyPayload[0] : (bodyPayload as Record<string, unknown>);
          const first = { ...original };

          if (first.description == null) first.description = "";
          if (first.is_active == null) first.is_active = true;
          if (first.is_featured == null) first.is_featured = false;
          if (first.display_order == null) first.display_order = 0;
          if (first.image_url == null) delete first.image_url;
          if (first.parent_id == null) delete first.parent_id;

          res = await fetch(url, {
            method: "POST",
            credentials: "include",
            headers,
            body: JSON.stringify(first),
          });

          if (!res.ok && res.status === 400) {
            const core = {
              name: String(first.name ?? ""),
              slug: String(first.slug ?? ""),
              description: String(first.description ?? ""),
              is_active: first.is_active === undefined ? true : !!first.is_active,
              ...(first.parent_id === null ? { parent_id: null } : {}),
            };
            res = await fetch(url, {
              method: "POST",
              credentials: "include",
              headers,
              body: JSON.stringify(core),
            });
          }
        }

        if (!res.ok) {
          if (res.status === 409) {
            return { data: null, error: { message: "duplicate_slug", status: 409 } };
          }
          return { data: null, error: { message: `request_failed_${res.status}`, status: res.status } };
        }

        let json: unknown = null;
        try { json = await res.json(); } catch { json = null; }
        let data = this.parseBodyToRows(json) as TRow[] | null;
        if (data) data = normalizeTableRows(path, data as unknown as UnknownRow[]) as unknown as TRow[];
        return { data, error: null };
      }

      // UPDATE (profiles → PUT; categories → PUT; diğerleri → PATCH)
      if (this._op === "update") {
        const headers = buildAuthHeaders({
          "content-type": "application/json",
          "Prefer": `return=${this._preferReturn ?? "minimal"}`
        });

        const originalPayload = (this._updatePayload ?? {}) as Record<string, unknown>;
        let bodyPayload: unknown = transformOutgoingPayload(path, originalPayload);
        const methodForThis =
          methodOverride ?? (path === "/categories" ? "PUT" : "PATCH");

        if (path === "/profiles") {
          bodyPayload = { profile: bodyPayload as Record<string, unknown> };
        }

        let res = await fetch(url, {
          method: methodForThis,
          credentials: "include",
          headers,
          body: JSON.stringify(bodyPayload),
        });

        if (path === "/categories" && !res.ok) {
          const status = res.status;

          // 5xx → slug’sız bir kez dene; sonra verify
          if (status >= 500) {
            if ("slug" in originalPayload) {
              const pNoSlug = { ...originalPayload };
              delete (pNoSlug as Record<string, unknown>).slug;
              const bNoSlug = transformOutgoingPayload(path, pNoSlug);
              const res2 = await fetch(url, {
                method: "PUT",
                credentials: "include",
                headers,
                body: JSON.stringify(bNoSlug),
              });
              if (res2.ok) res = res2;
            }
            if (!res.ok) {
              const idEq = this._filters.find(f => f.type === "eq" && f.col === "id");
              if (idEq && typeof idEq.val === "string") {
                const verifyUrl = joinUrl(BASE_URL, `/categories/${encodeURIComponent(idEq.val)}`);
                const verify = await fetch(verifyUrl, { credentials: "include", headers: buildAuthHeaders() });
                if (verify.ok) {
                  let json: unknown = null;
                  try { json = await verify.json(); } catch { json = null; }
                  let data = this.parseBodyToRows(json) as TRow[] | null;
                  if (data) data = normalizeTableRows(path, data as unknown as UnknownRow[]) as unknown as TRow[];
                  return { data, error: null };
                }
              }
              return { data: null, error: { message: `request_failed_${status}`, status } };
            }
          }

          // 400 → daraltarak tekrar dene
          if (status === 400) {
            if ("is_featured" in originalPayload || "display_order" in originalPayload) {
              const p1 = { ...originalPayload };
              delete p1.is_featured;
              delete p1.display_order;

              const b1: unknown = transformOutgoingPayload(path, p1);
              res = await fetch(url, {
                method: "PUT",
                credentials: "include",
                headers,
                body: JSON.stringify(b1),
              });
            }

            if (!res.ok && res.status === 400 && "slug" in originalPayload) {
              const p2 = { ...originalPayload };
              delete p2.slug;

              const b2: unknown = transformOutgoingPayload(path, p2);
              res = await fetch(url, {
                method: "PUT",
                credentials: "include",
                headers,
                body: JSON.stringify(b2),
              });
            }

            if (!res.ok) {
              if (res.status === 409) {
                return { data: null, error: { message: "duplicate_slug", status: 409 } };
              }
              return { data: null, error: { message: `request_failed_${res.status}`, status: res.status } };
            }
          }
        }

        if (!res.ok) {
          if (res.status === 409) {
            return { data: null, error: { message: "duplicate_slug", status: 409 } };
          }
          return { data: null, error: { message: `request_failed_${res.status}`, status: res.status } };
        }

        let json: unknown = null;
        try { json = await res.json(); } catch { json = null; }
        let data = this.parseBodyToRows(json) as TRow[] | null;
        if (data) data = normalizeTableRows(path, data as unknown as UnknownRow[]) as unknown as TRow[];
        return { data, error: null };
      }

      // DELETE
      if (this._op === "delete") {
        const headers = buildAuthHeaders();
        const res = await fetch(url, { method: "DELETE", credentials: "include", headers });
        if (!res.ok) return { data: null, error: { message: `request_failed_${res.status}`, status: res.status } };
        return { data: [] as unknown as TRow[], error: null };
      }

      return { data: null, error: { message: "unsupported_operation" } };
    } catch (e) {
      return { data: null, error: { message: "network_error", raw: e } };
    }
  }
}

/** Exported builder (structural type — hem QB hem special sınıflar uyuyor) */
export type FromPromise<TRow = unknown> =
  PromiseLike<FetchResult<TRow[]>> & {
    select(cols?: string, opts?: SelectOpts): FromPromise<TRow>;
    eq(col: string, val: unknown): FromPromise<TRow>;
    neq(col: string, val: unknown): FromPromise<TRow>;
    in(col: string, val: unknown[]): FromPromise<TRow>;
    order(col: string, o?: { ascending?: boolean }): FromPromise<TRow>;
    limit(n: number): FromPromise<TRow>;
    range(a: number, b: number): FromPromise<TRow>;
    insert(v: UnknownRow | UnknownRow[]): FromPromise<TRow>;
    update(v: Partial<UnknownRow>): FromPromise<TRow>;
    delete(): FromPromise<TRow>;
    single(): Promise<FetchResult<TRow>>;
    maybeSingle(): Promise<FetchResult<TRow>>;
  };

export function from<TName extends keyof typeof TABLES>(
  table: TName
): FromPromise<TableRow<TName>>;
export function from<TRow = unknown>(table: string): FromPromise<TRow>;
export function from(table: string): FromPromise<unknown> {
  switch (table) {
    case "api_providers":
      return new ApiProvidersQuery() as unknown as FromPromise<unknown>;
    // product_reviews / product_faqs için özel class kaldırıldı → düz QB kullanılacak
    default:
      return new QB<unknown>(table) as FromPromise<unknown>;
  }
}

export type FromFn =
  (<TName extends keyof typeof TABLES>(table: TName) => FromPromise<TableRow<TName>>) &
  (<TRow = unknown>(table: string) => FromPromise<TRow>);
