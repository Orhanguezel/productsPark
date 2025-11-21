// =============================================================
// FILE: src/components/admin/settings/SeoSettingsCard.tsx
// =============================================================
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Dispatch, SetStateAction } from "react";
import type { SiteSettings } from "@/integrations/metahub/rtk/types/site";

type Props = {
  settings: SiteSettings;
  setSettings: Dispatch<SetStateAction<SiteSettings>>;
};

export default function SeoSettingsCard({ settings, setSettings }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sayfa SEO Ayarları</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Ürünler SEO */}
        <div className="space-y-2">
          <Label>Ürünler - Başlık</Label>
          <Input
            value={settings.seo_products_title || ""}
            onChange={(e) =>
              setSettings((s) => ({
                ...s,
                seo_products_title: e.target.value,
              }))
            }
          />
          <Label>Ürünler - Açıklama</Label>
          <Textarea
            rows={3}
            value={settings.seo_products_description || ""}
            onChange={(e) =>
              setSettings((s) => ({
                ...s,
                seo_products_description: e.target.value,
              }))
            }
          />
        </div>

        {/* Kategoriler SEO */}
        <div className="space-y-2">
          <Label>Kategoriler - Başlık</Label>
          <Input
            value={settings.seo_categories_title || ""}
            onChange={(e) =>
              setSettings((s) => ({
                ...s,
                seo_categories_title: e.target.value,
              }))
            }
          />
          <Label>Kategoriler - Açıklama</Label>
          <Textarea
            rows={3}
            value={settings.seo_categories_description || ""}
            onChange={(e) =>
              setSettings((s) => ({
                ...s,
                seo_categories_description: e.target.value,
              }))
            }
          />
        </div>

        {/* Blog SEO */}
        <div className="space-y-2">
          <Label>Blog - Başlık</Label>
          <Input
            value={settings.seo_blog_title || ""}
            onChange={(e) =>
              setSettings((s) => ({
                ...s,
                seo_blog_title: e.target.value,
              }))
            }
          />
          <Label>Blog - Açıklama</Label>
          <Textarea
            rows={3}
            value={settings.seo_blog_description || ""}
            onChange={(e) =>
              setSettings((s) => ({
                ...s,
                seo_blog_description: e.target.value,
              }))
            }
          />
        </div>

        {/* İletişim SEO */}
        <div className="space-y-2">
          <Label>İletişim - Başlık</Label>
          <Input
            value={settings.seo_contact_title || ""}
            onChange={(e) =>
              setSettings((s) => ({
                ...s,
                seo_contact_title: e.target.value,
              }))
            }
          />
          <Label>İletişim - Açıklama</Label>
          <Textarea
            rows={3}
            value={settings.seo_contact_description || ""}
            onChange={(e) =>
              setSettings((s) => ({
                ...s,
                seo_contact_description: e.target.value,
              }))
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}
