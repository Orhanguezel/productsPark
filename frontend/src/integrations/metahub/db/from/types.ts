

  // =============================================================
// FILE: src/integrations/metahub/db/from/types.ts
// =============================================================
export type ResultError = { message: string; status?: number; raw?: unknown };
export type FetchResult<T> = { data: T | null; error: ResultError | null; count?: number };

export type Filter =
  | { type: "eq"; col: string; val: unknown }
  | { type: "neq"; col: string; val: unknown }
  | { type: "in"; col: string; val: unknown[] };

export type Order = { col: string; ascending?: boolean };
export type SelectOpts = { count?: "exact" | "planned" | "estimated"; head?: boolean };
export type Op = "select" | "insert" | "update" | "delete";

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
    insert(v: Record<string, unknown> | Record<string, unknown>[]): FromPromise<TRow>;
    update(v: Partial<Record<string, unknown>>): FromPromise<TRow>;
    delete(): FromPromise<TRow>;
    single(): Promise<FetchResult<TRow>>;
    maybeSingle(): Promise<FetchResult<TRow>>;
  };

