// =============================================================
// FILE: src/integrations/metahub/db/from/special.apiProviders.ts
// =============================================================
import { BASE_URL } from "../../rtk/constants";
import { buildAuthHeaders, extractArray, joinUrl, readJson, toQS } from "./http";
import type { FetchResult, FromPromise, SelectOpts } from "./types";
import type { TableRow } from "../types";
import { normalizeTableRows } from "../normalizeTables";

export class ApiProvidersQuery implements PromiseLike<FetchResult<TableRow<"api_providers">[]>> {
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
    insert(_v: Record<string, unknown> | Record<string, unknown>[]): this { return this; }
    update(_v: Partial<Record<string, unknown>>): this { return this; }
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

        // Aynı davranış için normalizeTableRows kullanıyoruz
        const data = normalizeTableRows("/api_providers", raw) as TableRow<"api_providers">[];
        return { data, error: null };
    }
}
