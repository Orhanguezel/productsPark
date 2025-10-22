// -------------------------------------------------------------
// FILE: src/integrations/metahub/client/site-settings/client.ts (Facade)
// -------------------------------------------------------------
import { store as store4 } from "@/store";
import { normalizeError as nErr3 } from "@/integrations/metahub/core/errors";
import {
  siteSettingsApi,
  type SiteSetting,
} from "@/integrations/metahub/rtk/endpoints/site_settings.endpoints";

export type { SiteSetting };

/** SiteSetting'in value alanını parametrize eden yardımcı tip */
type SiteSettingWith<T> = Omit<SiteSetting, "value"> & { value: T };

export const settings2 = {
  async list() {
    try {
      const data = await store4
        .dispatch(siteSettingsApi.endpoints.listSiteSettings.initiate({}))
        .unwrap();
      return { data: data as SiteSetting[], error: null as null };
    } catch (e) {
      const { message } = nErr3(e);
      return { data: null as SiteSetting[] | null, error: { message } };
    }
  },

  /** value tipini çağıran belirler; default: mevcut SiteSetting["value"] tipi */
  async getByKey<T = SiteSetting["value"]>(key: string) {
    try {
      const data = await store4
        .dispatch(siteSettingsApi.endpoints.getSiteSettingByKey.initiate(key))
        .unwrap();

      return {
        data: (data as SiteSetting | null) as SiteSettingWith<T> | null,
        error: null as null,
      };
    } catch (e) {
      const { message } = nErr3(e);
      return { data: null as SiteSettingWith<T> | null, error: { message } };
    }
  },
};
