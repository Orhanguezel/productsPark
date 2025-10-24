// =============================================================
// FILE: src/integrations/metahub/db/from.ts
// (lean: tipler ve normalize ayrı dosyalarda)
// =============================================================

import { normalizeTableRows } from "./normalizeTables";
import type { KnownTables, TableRow, UnknownRow } from "./types";
export type { KnownTables, TableRow, UnknownRow } from "./types";
export type { ProductRow, CategoryRow, SiteSettingRow, MenuItemRow, FooterSectionRow, 
  PopupRow, UserRoleRow, TopbarSettingRow, BlogPostRow, CouponRow, CartItemRow,
  CustomPageView } from "./types";

/** BASE URL'ler */
const RAW_EDGE_URL =
  (import.meta.env.VITE_METAHUB_URL as string | undefined)?.replace(/\/+$/, "") ?? "";
const RAW_APP_URL =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, "") ?? "";

// /api fallback YOK.
export const EDGE_URL = RAW_EDGE_URL;
export const APP_URL = RAW_APP_URL;

// “app” base boşsa edge’e düş (tek origin senaryosu için)
const BASE_OF = {
  edge: EDGE_URL,
  app: APP_URL || EDGE_URL,
} as const;

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

/** Hangi tablo hangi BASE'e gidecek? */
type BaseKind = "edge" | "app";
type TableCfg = { path: string; base: BaseKind };

const TABLES: Record<KnownTables, TableCfg> = {
  // EDGE
  products: { path: "/products", base: "edge" },
  categories: { path: "/categories", base: "edge" },
  orders: { path: "/orders", base: "edge" },
  order_items: { path: "/order_items", base: "edge" },
  cart_items: { path: "/cart_items", base: "edge" },
  coupons: { path: "/coupons", base: "edge" },
  blog_posts: { path: "/blog_posts", base: "edge" },
  product_stock: { path: "/product_stock", base: "edge" },
  product_reviews: { path: "/product_reviews", base: "edge" },
  product_faqs: { path: "/product_faqs", base: "edge" },
  profiles: { path: "/profiles", base: "edge" },
  wallet_transactions: { path: "/wallet_transactions", base: "edge" },
  payment_requests: { path: "/payment_requests", base: "edge" },
  product_variants: { path: "/product_variants", base: "edge" },
  product_options: { path: "/product_options", base: "edge" },
  product_option_values: { path: "/product_option_values", base: "edge" },

  // APP
  site_settings: { path: "/site_settings", base: "app" },
  topbar_settings: { path: "/topbar_settings", base: "app" },
  popups: { path: "/popups", base: "app" },
  email_templates: { path: "/email_templates", base: "app" },
  menu_items: { path: "/menu_items", base: "app" },
  footer_sections: { path: "/footer_sections", base: "app" },
  custom_pages: { path: "/custom_pages", base: "app" },
  payment_providers: { path: "/payment_providers", base: "app" },
  payment_sessions: { path: "/payment_sessions", base: "app" },
  uploads: { path: "/storage/uploads", base: "app" },
  notifications: { path: "/notifications", base: "app" },
  activity_logs: { path: "/activity_logs", base: "app" },
  audit_events: { path: "/audit_events", base: "app" },
  telemetry_events: { path: "/telemetry/events", base: "app" },
  user_roles: { path: "/user_roles", base: "app" },
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

function boolTo01(v: unknown): 0 | 1 | undefined {
  if (typeof v === "boolean") return v ? 1 : 0;
  if (typeof v === "number") return v ? 1 : 0;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (["1", "true", "yes", "on"].includes(s)) return 1;
    if (["0", "false", "no", "off"].includes(s)) return 0;
  }
  return undefined;
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

  constructor(table: string) {
    this.table = table;
  }

  // "a, b ,c" -> "a,b,c"
  select(cols: string, opts?: SelectOpts) {
    this._select = cols.split(",").map(s => s.trim()).filter(Boolean).join(",");
    if (opts) this._selectOpts = opts;
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

  private async execute(): Promise<FetchResult<TRow[]>> {
    try {
      const cfg = TABLES[this.table as KnownTables];
      if (!cfg) return { data: null, error: { message: `unknown_table_${this.table}` } };

      const primaryBase = BASE_OF[cfg.base]; // ← app boşsa edge’e düşer
      const params: Record<string, unknown> = { select: this._select };

      for (const f of this._filters) {
        if (f.type === "eq") params[f.col] = f.col.startsWith("is_") ? (boolTo01(f.val) ?? f.val) : f.val;
        if (f.type === "neq") params[`${f.col}!`] = f.col.startsWith("is_") ? (boolTo01(f.val) ?? f.val) : f.val;
        if (f.type === "in") params[`${f.col}_in`] = (Array.isArray(f.val) ? f.val : []).map(String).join(",");
      }
      if (this._order) params.order = this._order.ascending === false ? `${this._order.col}.desc` : `${this._order.col}.asc`;
      if (this._limit != null) params.limit = this._limit;
      if (this._range) { params.offset = this._range[0]; params.limit = (this._range[1] - this._range[0]) + 1; }

      // SELECT
      if (this._op === "select") {
        // app tablolarda alternatif olarak edge'i de dene; edge tablolarda primary zaten edge
        const altBase = cfg.base === "app" ? EDGE_URL : (APP_URL || EDGE_URL);
        const bases = [primaryBase, altBase].filter(Boolean).filter((b, i, a) => a.indexOf(b) === i);

        let lastErr: ResultError | null = null;

        for (let i = 0; i < bases.length; i++) {
          const base = bases[i]!;
          const url = `${joinUrl(base, cfg.path)}?${toQS(params)}`;
          const res = await fetch(url, { credentials: "include" });

          // 404 → endpoint yok/opsiyonel: varsa diğer base'i dene; yoksa boş başarı dön.
          if (res.status === 404) {
            if (i < bases.length - 1) continue;
            return { data: [] as unknown as TRow[], error: null, count: 0 };
          }

          // Diğer hatalar → bir sonraki base'i dene; yoksa hata döndür
          if (!res.ok) {
            lastErr = { message: `request_failed_${res.status}`, status: res.status };
            if (i < bases.length - 1) continue;
            return { data: null, error: lastErr };
          }

          const count = this._selectOpts.head ? readCountFromHeaders(res) : undefined;
          const json: unknown = await res.json();
          const rowsUnknown: unknown =
            Array.isArray(json) ? json :
            json && typeof json === "object" ? (json as { data?: unknown }).data : null;

          let data = (Array.isArray(rowsUnknown) ? rowsUnknown : rowsUnknown ? [rowsUnknown] : null) as TRow[] | null;

          // 🔹 Tabloya özel normalizasyonlar (site_settings, products, vb.)
          if (data) {
            data = normalizeTableRows(cfg.path, data as unknown as UnknownRow[]) as unknown as TRow[];
          }

          return { data, error: null, count };
        }

        // Teorik olarak buraya düşmez
        return { data: null, error: lastErr ?? { message: "request_failed" } };
      }

      // INSERT
      const url = `${joinUrl(primaryBase, cfg.path)}?${toQS(params)}`;
      if (this._op === "insert") {
        const res = await fetch(url, {
          method: "POST",
          credentials: "include",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(this._insertPayload ?? {}),
        });
        if (!res.ok) return { data: null, error: { message: `request_failed_${res.status}`, status: res.status } };
        const json: unknown = await res.json();
        const rowsUnknown: unknown =
          Array.isArray(json) ? json :
          json && typeof json === "object" ? (json as { data?: unknown }).data : null;
        const data = (Array.isArray(rowsUnknown) ? rowsUnknown : rowsUnknown ? [rowsUnknown] : null) as TRow[] | null;
        return { data, error: null };
      }

      // UPDATE
      if (this._op === "update") {
        const res = await fetch(url, {
          method: "PATCH",
          credentials: "include",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(this._updatePayload ?? {}),
        });
        if (!res.ok) return { data: null, error: { message: `request_failed_${res.status}`, status: res.status } };
        const json: unknown = await res.json();
        const rowsUnknown: unknown =
          Array.isArray(json) ? json :
          json && typeof json === "object" ? (json as { data?: unknown }).data : null;
        const data = (Array.isArray(rowsUnknown) ? rowsUnknown : rowsUnknown ? [rowsUnknown] : null) as TRow[] | null;
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
export function from<TName extends keyof typeof TABLES>(table: TName): FromPromise<TableRow<TName>>;
export function from<TRow extends UnknownRow = UnknownRow>(table: string): FromPromise<TRow>;
export function from(table: string): FromPromise<UnknownRow> {
  return new QB<UnknownRow>(table) as unknown as FromPromise<UnknownRow>;
}
// overload’lı tip tanımı (export’la)
export type FromFn =
  (<TName extends keyof typeof TABLES>(table: TName) => FromPromise<TableRow<TName>>) &
  (<TRow extends UnknownRow = UnknownRow>(table: string) => FromPromise<TRow>);


