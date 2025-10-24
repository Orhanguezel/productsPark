// src/integrations/metahub/client/footerSections/client.ts
import { store } from "@/store";
import { normalizeError } from "@/integrations/metahub/core/errors";
import {
  footerSectionsApi,
  type FooterSection as ApiNormalizedFooterSection,
} from "@/integrations/metahub/rtk/endpoints/footer_sections.endpoints";
import { normalizeFooterSectionView } from "./normalize";
import type { FooterSectionView } from "./types";

export type { FooterSectionView };

export const footer_sections = {
  async list(
    params?: Parameters<
      typeof footerSectionsApi.endpoints.listFooterSections.initiate
    >[0],
  ) {
    try {
      const apiRows: ApiNormalizedFooterSection[] = await store
        .dispatch(
          footerSectionsApi.endpoints.listFooterSections.initiate(params ?? {}),
        )
        .unwrap();

      // any yok: UnknownRow kabul eden normalizer'a doğrudan veriyoruz
      const items: FooterSectionView[] = apiRows.map((r) => normalizeFooterSectionView(r));

      return { data: items, error: null as null };
    } catch (e) {
      const { message } = normalizeError(e);
      return { data: null as FooterSectionView[] | null, error: { message } };
    }
  },
};
