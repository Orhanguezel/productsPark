// =============================================================
// FILE: src/integrations/metahub/db/from/qb.ts
// =============================================================
import type { FetchResult, Filter, FromPromise, Op, Order, SelectOpts } from "./types";
import type { UnknownRow } from "../types";

import { buildUrl } from "./qb/url/index";
import { runSelect } from "./qb/ops/selectOp";
import { runInsert } from "./qb/ops/insertOp";
import { runUpdate } from "./qb/ops/updateOp";
import { runDelete } from "./qb/ops/deleteOp";

export class QB<TRow = unknown> implements PromiseLike<FetchResult<TRow[]>> {
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

  private execute(): Promise<FetchResult<TRow[]>> {
    const built = buildUrl({
      table: this.table,
      op: this._op,
      select: this._select,
      preferReturn: this._preferReturn,
      filters: this._filters,
      order: this._order,
      limit: this._limit,
      range: this._range,
    });

    if (!built) return Promise.resolve({ data: null, error: { message: `unknown_table_${this.table}` } });

    if (this._op === "select")  return runSelect<TRow>(built, this._selectOpts);
    if (this._op === "insert")  return runInsert<TRow>(built, this._insertPayload, this._preferReturn);
    if (this._op === "update")  return runUpdate<TRow>(built, (this._updatePayload ?? {}) as Record<string, unknown>, this._preferReturn);
    if (this._op === "delete")  return runDelete<TRow>(built);

    return Promise.resolve({ data: null, error: { message: "unsupported_operation" } });
  }
}
