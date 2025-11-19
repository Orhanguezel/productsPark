// =============================================================
// FILE: src/hooks/useSeoSettings.ts
// =============================================================
import { useMemo } from "react";
import { useListSiteSettingsQuery } from "@/integrations/metahub/rtk/endpoints/site_settings.endpoints";

interface SeoSettings {
  site_title: string;
  site_description: string;
  seo_products_title: string;
  seo_products_description: string;
  seo_categories_title: string;
  seo_categories_description: string;
  seo_blog_title: string;
  seo_blog_description: string;
  seo_contact_title: string;
  seo_contact_description: string;
}

// DB boşsa kullanılacak fallback değerler
const defaultSettings: SeoSettings = {
  site_title: "Dijital Ürün Satış Scripti",
  site_description:
    "Dijital Ürün Satış Scripti yazılımı ile dijitalde öne çıkın",

  seo_products_title: "Tüm Ürünler - Dijimins",
  seo_products_description: "En popüler dijital ürünleri keşfedin",

  seo_categories_title: "Tüm Kategoriler - Dijimins",
  seo_categories_description: "Tüm ürün kategorilerimizi görüntüleyin",

  seo_blog_title: "Blog Yazıları - Dijimins",
  seo_blog_description: "Dijital ürünler hakkında güncel yazılar",

  seo_contact_title: "Bize Ulaşın - Dijimins",
  seo_contact_description: "Bizimle iletişime geçin",
};

export const useSeoSettings = () => {
  const { data, isLoading } = useListSiteSettingsQuery(undefined);

  const settings = useMemo<SeoSettings>(() => {
    if (!data || data.length === 0) {
      return defaultSettings;
    }

    const merged: Partial<SeoSettings> = {};

    for (const item of data) {
      const key = item.key as keyof SeoSettings;

      if (key in defaultSettings) {
        const val = item.value;

        if (typeof val === "string") {
          merged[key] = val;
        } else if (val != null) {
          // value_type json vs olsa bile burada string’e çevirip kullanıyoruz
          merged[key] = String(val) as SeoSettings[typeof key];
        }
      }
    }

    return {
      ...defaultSettings,
      ...merged,
    };
  }, [data]);

  return { settings, loading: isLoading };
};
