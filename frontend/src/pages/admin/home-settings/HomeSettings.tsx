// =============================================================
// FILE: src/pages/admin/HomeSettings.tsx
// =============================================================
import { useEffect, useRef, useState, useCallback } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { toast } from "sonner";

import {
  useListSiteSettingsAdminQuery,
  useBulkUpsertSiteSettingsAdminMutation,
  type UpsertSettingBody, // ✅ tip import
} from "@/integrations/metahub/rtk/endpoints/admin/site_settings_admin.endpoints";

import {
  defaultHomeSettings,
  coerceToHomeSettingsShape,
  type HomeSettings,
} from "./components/config";

import { HeroSectionCard } from "./components/HeroSectionCard";
import { FeaturedSectionCard } from "./components/FeaturedSectionCard";
import { HowItWorksSectionCard } from "./components/HowItWorksSectionCard";
import { FaqSectionCard } from "./components/FaqSectionCard";
import { BlogSectionCard } from "./components/BlogSectionCard";
import { ScrollContentSectionCard } from "./components/ScrollContentSectionCard";

import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";

export default function HomeSettings() {
  const [settings, setSettings] = useState<HomeSettings>(defaultHomeSettings);

  // Aktif tab (hero, featured, how, faq, blog, scroll)
  const [activeTab, setActiveTab] = useState<
    "hero" | "featured" | "how" | "faq" | "blog" | "scroll"
  >("hero");

  // home_ prefix’li tüm ayarları admin uçtan çek
  const {
    data: list = [],
    isLoading: isListLoading,
  } = useListSiteSettingsAdminQuery({
    prefix: "home_",
    sort: "key",
    order: "asc",
  });

  // İlk hydrate sadece 1 kere – refetch sırasında form değerleri ezilmesin
  const hydratedOnce = useRef(false);

  useEffect(() => {
    if (hydratedOnce.current) return;
    if (!list.length) return;

    const map: Record<string, unknown> = {};
    for (const row of list) {
      map[row.key] = row.value;
    }

    // 🔥 Default + server map → coerce
    //  - defaultHomeSettings: tip/gövde
    //  - map: DB’den gelen gerçek değerler (hero görseli dahil)
    setSettings(
      coerceToHomeSettingsShape(
        {
          ...defaultHomeSettings,
          ...map,
        },
        map
      )
    );

    hydratedOnce.current = true;
  }, [list]);

  const [bulkUpsert, { isLoading: isSaving }] =
    useBulkUpsertSiteSettingsAdminMutation();

  const handleSave = async () => {
    try {
      const items: UpsertSettingBody[] = Object.entries(settings).map(
        ([key, value]) => ({
          key,
          value,
          // value_type / group / description opsiyonel, BE default'ları kullanır
        })
      );

      await bulkUpsert({ items }).unwrap();
      toast.success("Tüm ana sayfa ayarları başarıyla kaydedildi!");
    } catch (e: unknown) {
      console.error("Bulk upsert error:", e);
      toast.error("Ayarlar kaydedilirken hata oluştu");
    }
  };

  const loading = isListLoading && !hydratedOnce.current;

  // Child card’lara prop olarak verdiğimiz update fonksiyonu
  const updateSettings = useCallback(
    (patch: Partial<HomeSettings>) => {
      setSettings((prev) => ({ ...prev, ...patch }));
    },
    []
  );

  return (
    <AdminLayout title="Ana Sayfa Ayarları">
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <p>Yükleniyor...</p>
        </div>
      ) : (
        <div className="space-y-6">
          <Tabs
            value={activeTab}
            onValueChange={(v) =>
              setActiveTab(
                v as "hero" | "featured" | "how" | "faq" | "blog" | "scroll"
              )
            }
          >
            <TabsList className="w-full flex flex-wrap gap-2 mb-4">
              <TabsTrigger value="hero">Hero</TabsTrigger>
              <TabsTrigger value="featured">Öne Çıkanlar</TabsTrigger>
              <TabsTrigger value="how">Nasıl Çalışır</TabsTrigger>
              <TabsTrigger value="faq">SSS</TabsTrigger>
              <TabsTrigger value="blog">Blog</TabsTrigger>
              <TabsTrigger value="scroll">Makale Alanı</TabsTrigger>
            </TabsList>

            <TabsContent value="hero" className="mt-4 space-y-6">
              <HeroSectionCard
                settings={settings}
                onChange={updateSettings}
              />
            </TabsContent>

            <TabsContent value="featured" className="mt-4 space-y-6">
              <FeaturedSectionCard
                settings={settings}
                onChange={updateSettings}
              />
            </TabsContent>

            <TabsContent value="how" className="mt-4 space-y-6">
              <HowItWorksSectionCard
                settings={settings}
                onChange={updateSettings}
              />
            </TabsContent>

            <TabsContent value="faq" className="mt-4 space-y-6">
              <FaqSectionCard
                settings={settings}
                onChange={updateSettings}
              />
            </TabsContent>

            <TabsContent value="blog" className="mt-4 space-y-6">
              <BlogSectionCard
                settings={settings}
                onChange={updateSettings}
              />
            </TabsContent>

            {/* ScrollContentSectionCard sadece tab açılınca mount olur */}
            <TabsContent value="scroll" className="mt-4 space-y-6">
              <ScrollContentSectionCard
                settings={settings}
                onChange={updateSettings}
              />
            </TabsContent>
          </Tabs>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isSaving} className="gap-2">
              <Save className="w-4 h-4" />
              {isSaving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
            </Button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
