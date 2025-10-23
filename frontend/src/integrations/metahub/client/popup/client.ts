// =============================================================
// FILE: src/integrations/metahub/client/popup/client.ts
// =============================================================
import { store } from "@/store";
import { normalizeError } from "@/integrations/metahub/core/errors";
import {
  popupsApi,
  type Popup as RtkPopup,
  type PopupType,
} from "@/integrations/metahub/rtk/endpoints/popups.endpoints";

type BoolLike = 0 | 1 | boolean;
type ListParams = { locale?: string; is_active?: BoolLike; type?: PopupType };

export type Popup = RtkPopup;

export const popups = {
  async list(params?: Partial<ListParams>) {
    try {
      const data = await store
        .dispatch(popupsApi.endpoints.listPopups.initiate(params ?? {}))
        .unwrap();
      return { data: data as Popup[], error: null as null };
    } catch (e) {
      const { message } = normalizeError(e);
      return { data: null as Popup[] | null, error: { message } };
    }
  },

  async byKey(key: string, locale?: string) {
    try {
      const data = await store
        .dispatch(popupsApi.endpoints.getPopupByKey.initiate({ key, locale }))
        .unwrap();
      return { data: data as Popup, error: null as null };
    } catch (e) {
      const { message } = normalizeError(e);
      return { data: null as Popup | null, error: { message } };
    }
  },
};
