import { useState, useEffect } from "react";
import { metahub } from "@/integrations/metahub/client";

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

const defaultSettings: SeoSettings = {
  site_title: "ProductSpark Flow",
  site_description: "Dijital Ürün Satış Platformu",
  seo_products_title: "Ürünler | ProductSpark Flow",
  seo_products_description: "En popüler dijital ürünleri keşfedin",
  seo_categories_title: "Kategoriler | ProductSpark Flow",
  seo_categories_description: "Tüm ürün kategorilerimizi görüntüleyin",
  seo_blog_title: "Blog | ProductSpark Flow",
  seo_blog_description: "Dijital ürünler hakkında güncel yazılar",
  seo_contact_title: "İletişim | ProductSpark Flow",
  seo_contact_description: "Bizimle iletişime geçin",
};

export const useSeoSettings = () => {
  const [settings, setSettings] = useState<SeoSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();

    // Subscribe to real-time updates
    const channel = metahub
      .channel('seo-settings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'site_settings',
        },
        (payload) => {
          console.log('SEO settings changed:', payload);
          // Refetch all settings when any change occurs
          fetchSettings();
        }
      )
      .subscribe();

    return () => {
      metahub.removeChannel(channel);
    };
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await metahub
        .from("site_settings")
        .select("key, value")
        .in("key", [
          "site_title",
          "site_description",
          "seo_products_title",
          "seo_products_description",
          "seo_categories_title",
          "seo_categories_description",
          "seo_blog_title",
          "seo_blog_description",
          "seo_contact_title",
          "seo_contact_description",
        ]);

      if (error) throw error;

      const settingsObj: Partial<SeoSettings> = {};
      data?.forEach((item) => {
        settingsObj[item.key as keyof SeoSettings] = item.value as string;
      });

      setSettings({ ...defaultSettings, ...settingsObj });
    } catch (error) {
      console.error("Error fetching SEO settings:", error);
    } finally {
      setLoading(false);
    }
  };

  return { settings, loading };
};
