// =============================================================
// FILE: src/integrations/metahub/db/from.ts
// =============================================================

import { BASE_URL, EDGE_URL, APP_URL } from "./from/constants";
import { QB } from "./from/qb";
import { ApiProvidersQuery } from "./from/special.apiProviders";

import type { FromPromise, FetchResult, ResultError } from "./from/types";
export type { FromPromise, FetchResult, ResultError } from "./from/types";

export { BASE_URL, EDGE_URL, APP_URL } from "./from/constants";

import type { KnownTables, TableRow, UnknownRow } from "./types";
export type { KnownTables, TableRow, UnknownRow } from "./types";
export type {
  ProductRow, CategoryRow, SiteSettingRow, MenuItemRow, FooterSectionRow,
  PopupRow, UserRoleRow, TopbarSettingRow, BlogPostRow, CouponRow, CartItemRow,
  CustomPageView, SupportTicketView, TicketReplyView, ProfileRow, WalletTransactionRow, WalletDepositRequestRow,
  OrderRow, OrderView, ApiProviderRow,
} from "./types";

import { TABLES } from "./tables";

/** Exported builder overloads */
export function from<TName extends keyof typeof TABLES>(
  table: TName
): FromPromise<TableRow<TName>>;
export function from<TRow = unknown>(table: string): FromPromise<TRow>;
export function from(table: string): FromPromise<unknown> {
  switch (table) {
    case "api_providers":
      return new ApiProvidersQuery() as unknown as FromPromise<unknown>;
    default:
      return new QB<unknown>(table) as FromPromise<unknown>;
  }
}

/** Convenience type (eski export ile uyumlu) */
export type FromFn =
  (<TName extends keyof typeof TABLES>(table: TName) => FromPromise<TableRow<TName>>) &
  (<TRow = unknown>(table: string) => FromPromise<TRow>);
