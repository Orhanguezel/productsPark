// =============================================================
// FILE: src/integrations/metahub/db/from.ts
// Tek origin: tüm tablolar aynı BASE_URL üzerinden istenir.
// (lean: tipler ve normalize ayrı dosyalarda)
// =============================================================

import { normalizeTableRows } from "./normalizeTables";
import type { KnownTables, TableRow, UnknownRow } from "./types";
export type { KnownTables, TableRow, UnknownRow } from "./types";
export type {
  ProductRow, CategoryRow, SiteSettingRow, MenuItemRow, FooterSectionRow,
  PopupRow, UserRoleRow, TopbarSettingRow, BlogPostRow, CouponRow, CartItemRow,
  CustomPageView, SupportTicketView, TicketReplyView, ProfileRow, WalletTransactionRow, WalletDepositRequestRow,
  OrderRow, OrderItemRow
} from "./types";

/** BASE URL — tek merkez */
const RAW_BASE_URL =
  ((import.meta.env.VITE_API_URL as string | undefined) ||
   (import.meta.env.VITE_METAHUB_URL as string | undefined) ||
   ""
  ).replace(/\/+$/, "");

export const BASE_URL = RAW_BASE_URL;

// Eski isimlerle uyumluluk (dışarıdan import varsa kırılmasın)
export const EDGE_URL = BASE_URL;
export const APP_URL  = BASE_URL;

export type ResultError = { message: string; status?: number; raw?: unknown };
export type FetchResult<T> = { data: T | null; error: ResultError | null; count?: number };

/** Query parçaları */
type Filter =
  | { type: "eq"; col: string; val: unknown }
  | { type: "neq"; col: string; val: unknown }
  | { type: "in"; col: string; val: unknown[] };

type Order = { col: string; ascending?: boolean };
type SelectOpts = { count?: "exact" | "planned" | "estimated"; head?: boolean };
type Op = "select" | "insert" | "update" | "delete";

/** Tabloların yol map'i (hepsi aynı BASE_URL’e gider) */
const TABLES: Record<KnownTables, string> = {
  // products & relatives
  products: "/products",
  product_stock: "/product_stock",
  product_reviews: "/product_reviews",
  product_faqs: "/product_faqs",
  product_variants: "/product_variants",
  product_options: "/product_options",
  product_option_values: "/product_option_values",

  // content
  categories: "/categories",
  blog_posts: "/blog_posts",
  custom_pages: "/custom_pages",

  // commerce
  orders: "/orders",
  order_items: "/order_items",
  cart_items: "/cart_items",
  coupons: "/coupons",
  wallet_deposit_requests: "/wallet_deposit_requests",
  payment_requests: "/payment_requests",
  payment_providers: "/payment_providers",
  payment_sessions: "/payment_sessions",
  wallet_transactions: "/wallet_transactions",

  // site config
  site_settings: "/site_settings",
  topbar_settings: "/topbar_settings",
  popups: "/popups",
  email_templates: "/email_templates",
  menu_items: "/menu_items",
  footer_sections: "/footer_sections",
  uploads: "/storage/uploads",

  // user & ops
  profiles: "/profiles",
  notifications: "/notifications",
  activity_logs: "/activity_logs",
  audit_events: "/audit_events",
  telemetry_events: "/telemetry/events",
  user_roles: "/user_roles",
  support_tickets: "/support_tickets",
  ticket_replies: "/ticket_replies",
};

function joinUrl(base: string, path: string): string {
  if (!base) return path; // base boşsa relative path (aynı origin)
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

class QB<TRow extends UnknownRow = UnknownRow> implements PromiseLike<FetchResult<TRow[]>> {
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
  private _preferReturn?: "representation" | "minimal"; // insert/update dönüş tercih

  constructor(table: string) {
    this.table = table;
  }

  // OVERLOADS: argümansız veya string ile
  select(): this;
  select(cols: string, opts?: SelectOpts): this;
  select(cols?: string, opts?: SelectOpts): this {
    const given = (typeof cols === "string" ? cols : "").trim();
    this._select = given.length > 0
      ? given.split(",").map(s => s.trim()).filter(Boolean).join(",")
      : "*";
    if (opts) this._selectOpts = opts;

    // insert/update sonrası .select() çağrılırsa oluşturulan kaydı istemek için
    this._preferReturn = "representation";
    return this;
  }

  eq(col: string, val: unknown)  { this._filters.push({ type: "eq",  col, val }); return this; }
  neq(col: string, val: unknown) { this._filters.push({ type: "neq", col, val }); return this; }
  in(col: string, val: unknown[]) { this._filters.push({ type: "in", col, val }); return this; }
  order(col: string, o?: { ascending?: boolean }) { this._order = { col, ascending: o?.ascending }; return this; }
  limit(n: number) { this._limit = n; return this; }
  range(a: number, b: number) { this._range = [a, b]; return this; }
  insert(v: UnknownRow | UnknownRow[]) { this._op = "insert"; this._insertPayload = v; return this; }
  update(v: Partial<UnknownRow>) { this._op = "update"; this._updatePayload = v; return this; }
  delete() { this._op = "delete"; return this; }

  async single(): Promise<FetchResult<TRow>> {
    const r = await this.limit(1).execute();
    return { data: (r.data?.[0] ?? null) as TRow | null, error: r.error };
  }
  async maybeSingle(): Promise<FetchResult<TRow>> { return this.single(); }

  then<TResult1 = FetchResult<TRow[]>, TResult2 = never>(
    onfulfilled?: ((v: FetchResult<TRow[]>) => TResult1 | Promise<TResult1>) | null,
    onrejected?: ((r: unknown) => TResult2 | Promise<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(
      onfulfilled as (value: FetchResult<TRow[]>) => TResult1,
      onrejected as (reason: unknown) => TResult2
    );
  }

  private buildUrl(): { url: string; path: string } | null {
    const path = TABLES[this.table as KnownTables];
    if (!path) return null;

    const params: Record<string, unknown> = { select: this._select };

    // 🔹 SADE (legacy) FİLTRE FORMAT
    //  - eq   → col=value
    //  - neq  → col! (veya backend'e göre col!=) = value
    //  - in   → col_in=a,b,c
    //
    // Not: boolean’ları 0/1’e çevirmiyoruz; true/false olarak gönderiyoruz.
    for (const f of this._filters) {
      if (f.type === "eq")  params[f.col] = f.val;               // ör: is_active=true
      if (f.type === "neq") params[`${f.col}!`] = f.val;         // ör: status!=cancelled (BE eşlemesine göre)
      if (f.type === "in")  params[`${f.col}_in`] = (Array.isArray(f.val) ? f.val : []).map(String).join(",");
    }

    if (this._order) params.order = this._order.ascending === false ? `${this._order.col}.desc` : `${this._order.col}.asc`;
    if (this._limit != null) params.limit = this._limit;
    if (this._range) { params.offset = this._range[0]; params.limit = (this._range[1] - this._range[0]) + 1; }

    const url = `${joinUrl(BASE_URL, path)}?${toQS(params)}`;
    return { url, path };
  }

  private getHeadersForSelect(): HeadersInit {
    const headers: Record<string, string> = {};
    if (this._selectOpts.count) headers["Prefer"] = `count=${this._selectOpts.count}`;
    return headers;
  }

  private parseBodyToRows(json: unknown): UnknownRow[] | null {
    if (Array.isArray(json)) return json as UnknownRow[];
    if (json && typeof json === "object") {
      const obj = json as Record<string, unknown>;
      // data varsa onu, yoksa objenin kendisini tekil kayıt olarak al
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
      const { url, path } = built;

      if (this._op === "select") {
        const res = await fetch(url, { credentials: "include", headers: this.getHeadersForSelect() });

        if (res.status === 404) {
          // Tek backend: 404'te boş data döndürüyoruz (eski davranış)
          return { data: [] as unknown as TRow[], error: null, count: 0 };
        }
        if (!res.ok) {
          return { data: null, error: { message: `request_failed_${res.status}`, status: res.status } };
        }

        const count = this._selectOpts.head ? readCountFromHeaders(res) : readCountFromHeaders(res);

        let json: unknown = null;
        try { json = await res.json(); } catch { json = null; }

        let data = this.parseBodyToRows(json) as (TRow[] | null);

        if (data) {
          data = normalizeTableRows(path, data as unknown as UnknownRow[]) as unknown as TRow[];
        }

        return { data, error: null, count };
      }

      // INSERT
      if (this._op === "insert") {
        const headers: Record<string, string> = { "content-type": "application/json" };
        if (this._preferReturn) headers["Prefer"] = `return=${this._preferReturn}`;

        const res = await fetch(url, {
          method: "POST",
          credentials: "include",
          headers,
          body: JSON.stringify(this._insertPayload ?? {}),
        });
        if (!res.ok) return { data: null, error: { message: `request_failed_${res.status}`, status: res.status } };

        let json: unknown = null;
        try { json = await res.json(); } catch { json = null; }

        let data = this.parseBodyToRows(json) as (TRow[] | null);
        if (data) data = normalizeTableRows(path, data as unknown as UnknownRow[]) as unknown as TRow[];
        return { data, error: null };
      }

      // UPDATE
      if (this._op === "update") {
        const headers: Record<string, string> = { "content-type": "application/json" };
        if (this._preferReturn) headers["Prefer"] = `return=${this._preferReturn}`;

        const res = await fetch(url, {
          method: "PATCH",
          credentials: "include",
          headers,
          body: JSON.stringify(this._updatePayload ?? {}),
        });
        if (!res.ok) return { data: null, error: { message: `request_failed_${res.status}`, status: res.status } };

        let json: unknown = null;
        try { json = await res.json(); } catch { json = null; }

        let data = this.parseBodyToRows(json) as (TRow[] | null);
        if (data) data = normalizeTableRows(path, data as unknown as UnknownRow[]) as unknown as TRow[];
        return { data, error: null };
      }

      // DELETE
      if (this._op === "delete") {
        const res = await fetch(url, { method: "DELETE", credentials: "include" });
        if (!res.ok) return { data: null, error: { message: `request_failed_${res.status}`, status: res.status } };
        return { data: [] as unknown as TRow[], error: null };
      }

      return { data: null, error: { message: "unsupported_operation" } };
    } catch (e) {
      return { data: null, error: { message: "network_error", raw: e } };
    }
  }
}

/** PromiseLike + builder birleşimi */
export type FromPromise<TRow extends UnknownRow = UnknownRow> =
  PromiseLike<FetchResult<TRow[]>> & QB<TRow>;

/** OVERLOADS — spesifik overload ÖNCE, genel overload SONRA */
export function from<TName extends keyof typeof TABLES>(
  table: TName
): FromPromise<TableRow<TName> & UnknownRow>;
export function from<TRow extends UnknownRow = UnknownRow>(table: string): FromPromise<TRow>;
export function from(table: string): FromPromise<UnknownRow> {
  return new QB<UnknownRow>(table) as unknown as FromPromise<UnknownRow>;
}

// overload’lı tip tanımı (export’la)
export type FromFn =
  (<TName extends keyof typeof TABLES>(table: TName) => FromPromise<TableRow<TName> & UnknownRow>) &
  (<TRow extends UnknownRow = UnknownRow>(table: string) => FromPromise<TRow>);
