import { store } from "@/store";
import { normalizeError } from "@/integrations/metahub/core/errors";
import {
  menuItemsApi,
  type MenuItem as ApiMenuItem,
} from "@/integrations/metahub/rtk/endpoints/menu_items.endpoints";

export type MenuItem = ApiMenuItem;

type BoolLike = 0 | 1 | boolean;
type ListParams = {
  locale?: string;
  is_active?: BoolLike;
  parent_id?: string | null;
  limit?: number;
  offset?: number;
  sort?: "position" | "created_at";
  order?: "asc" | "desc";
};

function coerceBoolLike(v: unknown): BoolLike | undefined {
  if (v == null) return undefined;
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v ? 1 : 0;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (["1", "true", "yes", "on"].includes(s)) return 1;
    if (["0", "false", "no", "off"].includes(s)) return 0;
  }
  return undefined;
}

function toListParams(p?: Partial<ListParams> | null): ListParams {
  return {
    locale: typeof p?.locale === "string" ? p!.locale : undefined,
    is_active: coerceBoolLike(p?.is_active),
    parent_id: typeof p?.parent_id === "string" || p?.parent_id === null ? p!.parent_id : undefined,
    limit: typeof p?.limit === "number" ? p!.limit : undefined,
    offset: typeof p?.offset === "number" ? p!.offset : undefined,
    sort: p?.sort === "position" || p?.sort === "created_at" ? p.sort : undefined,
    order: p?.order === "asc" || p?.order === "desc" ? p.order : undefined,
  };
}

export const menu_items = {
  /** Genel listeleme (parametre geçirilebilir) */
  async list(params?: Partial<ListParams>) {
    try {
      const safe = toListParams(params ?? null);
      const data = await store
        .dispatch(menuItemsApi.endpoints.listMenuItems.initiate(safe))
        .unwrap();
      return { data: data as ApiMenuItem[], error: null as null };
    } catch (e) {
      const { message } = normalizeError(e);
      return { data: null as ApiMenuItem[] | null, error: { message } };
    }
  },

  /** Sadece üst menüler (parent_id = null) */
  async listRoot(params?: Omit<ListParams, "parent_id">) {
    return this.list({ ...(params ?? {}), parent_id: null });
  },

  /** Belirli parent altında çocuklar */
  async listByParent(parent_id: string, params?: Omit<ListParams, "parent_id">) {
    return this.list({ ...(params ?? {}), parent_id });
  },
};
