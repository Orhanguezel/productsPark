import { store } from "@/store";
import {
  topbarSettingsApi,
  type TopbarSetting,
} from "@/integrations/metahub/rtk/endpoints/topbar_settings.endpoints";

type BoolLike = 0 | 1 | boolean;
type ListParams = {
  is_active?: BoolLike;
  order?: string;
  limit?: number;
  offset?: number;
};

function toListParams(p?: Partial<ListParams> | null): ListParams {
  return {
    is_active:
      typeof p?.is_active === "boolean"
        ? p!.is_active
        : typeof p?.is_active === "number"
        ? (p!.is_active ? 1 : 0)
        : p?.is_active,
    order: typeof p?.order === "string" ? p.order : undefined,
    limit: typeof p?.limit === "number" ? p.limit : undefined,
    offset: typeof p?.offset === "number" ? p.offset : undefined,
  };
}

export const topbar_settings = {
  // Genel liste
  async list(params?: Partial<ListParams>) {
    try {
      const safe = toListParams(params ?? null);
      const data = await store
        .dispatch(topbarSettingsApi.endpoints.listTopbarSettings.initiate(safe))
        .unwrap();
      return { data: data as TopbarSetting[], error: null as null };
    } catch (e) {
      return { data: null as TopbarSetting[] | null, error: { message: "request_failed" } };
    }
  },

  // Aktif tek kayıt (varsa)
  async getActive() {
    try {
      const data = await store
        .dispatch(topbarSettingsApi.endpoints.getActiveTopbar.initiate())
        .unwrap();
      return { data: data as TopbarSetting | null, error: null as null };
    } catch (e) {
      return { data: null as TopbarSetting | null, error: { message: "request_failed" } };
    }
  },
};

export type { TopbarSetting } from "@/integrations/metahub/rtk/endpoints/topbar_settings.endpoints";
