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
  OrderRow, OrderView
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
    const n = v.trim().replace(/\s+/g, "").replace(/\.(?=\d{3}(?:[.,]|$))/g, "").replace(",", ".");
    const num = Number(n);
    return Number.isFinite(num) ? num.toFixed(2) : "0.00";
  }
  return "0.00";
}

/** orders: FE→BE dönüşüm + eksik items’ı sessionStorage’tan üret */
function transformOrdersOut(obj: Record<string, unknown>): void {
  const rec: Record<string, unknown> = obj;

  // FE alan adlarını BE’ye çevir
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

  // payment_method normalize
  if ("payment_method" in rec) rec["payment_method"] = mapPaymentMethod(rec["payment_method"]);

  // BE kabul etmeyecek alanları temizle
  delete rec["user_id"];
  delete rec["customer_name"];
  delete rec["customer_email"];
  delete rec["customer_phone"];
  delete rec["coupon_id"];

  // Para alanlarını string’e sabitle
  if (rec["subtotal"] != null) rec["subtotal"] = asMoney(rec["subtotal"]);
  if (rec["discount"] != null) rec["discount"] = asMoney(rec["discount"]);
  if (rec["total"] != null) rec["total"] = asMoney(rec["total"]);

  // Items yoksa sessionStorage.checkoutData’dan üret
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
    } catch {
      // sess. storage yoksa/bozuksa sessiz geç
    }
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
    return obj;
  };
  return Array.isArray(payload) ? payload.map(apply) : apply(payload);
}

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

  // PromiseLike: then
  then<TResult1 = FetchResult<TRow[]>, TResult2 = never>(
    onfulfilled?: ((v: FetchResult<TRow[]>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(
      onfulfilled ?? ((v) => v as unknown as TResult1),
      onrejected ?? ((r) => { throw r; })
    ) as Promise<TResult1 | TResult2>;
  }

  /** URL builder + özel shımlar (profiles, orders tekil) */
  // ... sınıf QB içindeki buildUrl() içinde:

  private buildUrl(): { url: string; path: string; methodOverride?: "PUT" } | null {
    const logicalPath = TABLES[this.table as KnownTables];
    if (!logicalPath) return null;

    if (this.table === "profiles") {
      const pathForNormalize = "/profiles";
      const meUrl = joinUrl(BASE_URL, "/profiles/v1/me");
      const url = this._op === "select" ? `${meUrl}?${toQS({ select: this._select })}` : meUrl;
      return { url, path: pathForNormalize, methodOverride: this._op === "update" ? "PUT" : undefined };
    }

    const params: Record<string, unknown> = {};

    // 🔧 FIX: Daraltma yapmadan ifade et
    // select=* sadece SELECT'te ya da .select() çağrılmışsa (Prefer: return=representation)
    const wantSelectParam = this._op === "select" || this._preferReturn === "representation";
    if (wantSelectParam) params.select = this._select;

    // Filtreler: SELECT/UPDATE/DELETE için gerekli; INSERT’te değil
    const includeFilters = this._op === "select" || this._op === "update" || this._op === "delete";
    if (includeFilters) {
      for (const f of this._filters) {
        if (f.type === "eq") params[f.col] = f.val;
        if (f.type === "neq") params[`${f.col}!`] = f.val;
        if (f.type === "in") params[`${f.col}_in`] =
          (Array.isArray(f.val) ? f.val : []).map(String).join(",");
      }
    }

    // Sıralama/limit/range sadece SELECT’te
    if (this._op === "select") {
      if (this._order) params.order = this._order.ascending === false ? `${this._order.col}.desc` : `${this._order.col}.asc`;
      if (this._limit != null) params.limit = this._limit;
      if (this._range) { params.offset = this._range[0]; params.limit = (this._range[1] - this._range[0]) + 1; }
    }

    if (logicalPath === "/orders" && includeFilters) {
      const idEq = this._filters.find(f => f.type === "eq" && f.col === "id");
      if (idEq && typeof idEq.val === "string" && this._op === "select" && (this._limit === 1 || !!this._range)) {
        const qs = toQS({ select: this._select });
        const url = `${joinUrl(BASE_URL, `${logicalPath}/${encodeURIComponent(idEq.val)}`)}?${qs}`;
        return { url, path: logicalPath };
      }
    }

    const url = `${joinUrl(BASE_URL, logicalPath)}?${toQS(params)}`;
    return { url, path: logicalPath };
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
        const headers: Record<string, string> = {
          "content-type": "application/json",
          "accept": "application/json"
        };
        if (this._preferReturn) headers["Prefer"] = `return=${this._preferReturn}`;

        const payload = (this._insertPayload ?? {}) as UnknownRow | UnknownRow[];
        const bodyPayload: UnknownRow | UnknownRow[] = transformOutgoingPayload(path, payload);
        const res = await fetch(url, {
          method: "POST",
          credentials: "include",
          headers,
          body: JSON.stringify(bodyPayload),
        });
        if (!res.ok) return { data: null, error: { message: `request_failed_${res.status}`, status: res.status } };

        let json: unknown = null;
        try { json = await res.json(); } catch { json = null; }
        let data = this.parseBodyToRows(json) as TRow[] | null;
        if (data) data = normalizeTableRows(path, data as unknown as UnknownRow[]) as unknown as TRow[];
        return { data, error: null };
      }

      // UPDATE (profiles: PUT /profiles/v1/me)
      if (this._op === "update") {
        const headers: Record<string, string> = {
          "content-type": "application/json",
          "accept": "application/json"
        };
        if (this._preferReturn) headers["Prefer"] = `return=${this._preferReturn}`;

        const payload = (this._updatePayload ?? {}) as UnknownRow;
        let bodyPayload: unknown = transformOutgoingPayload(path, payload);
        if (path === "/profiles") {
          // URL /profiles/v1/me ama normalize path /profiles tutuldu
          bodyPayload = { profile: bodyPayload as Record<string, unknown> };
        }

        const res = await fetch(url, {
          method: methodOverride ?? "PATCH",
          credentials: "include",
          headers,
          body: JSON.stringify(bodyPayload),
        });
        if (!res.ok) return { data: null, error: { message: `request_failed_${res.status}`, status: res.status } };

        let json: unknown = null;
        try { json = await res.json(); } catch { json = null; }
        let data = this.parseBodyToRows(json) as TRow[] | null;
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

/** Exported builder */
export type FromPromise<TRow = unknown> =
  PromiseLike<FetchResult<TRow[]>> & QB<TRow>;

export function from<TName extends keyof typeof TABLES>(
  table: TName
): FromPromise<TableRow<TName>>;
export function from<TRow = unknown>(table: string): FromPromise<TRow>;
export function from(table: string): FromPromise<unknown> {
  return new QB<unknown>(table) as FromPromise<unknown>;
}

export type FromFn =
  (<TName extends keyof typeof TABLES>(table: TName) => FromPromise<TableRow<TName>>) &
  (<TRow = unknown>(table: string) => FromPromise<TRow>);
