import type { Filter, Op, Order } from "../../types";

export type BuiltUrl = { url: string; path: string; methodOverride?: "PUT" };

export type BuildUrlCtx = {
  table: string;
  op: Op;
  select: string;
  preferReturn?: "representation" | "minimal";
  filters: Filter[];
  order?: Order;
  limit?: number;
  range?: [number, number];
};
