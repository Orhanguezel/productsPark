// =============================================================
// FILE: src/pages/admin/settings/components/IntegrationsSettingsCard.tsx
// =============================================================
"use client";

import type { Dispatch, SetStateAction, ChangeEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { SiteSettings } from "@/integrations/metahub/rtk/types/site";

type Props = {
  settings: SiteSettings;
  setSettings: Dispatch<SetStateAction<SiteSettings>>;
};

export default function IntegrationsSettingsCard({ settings, setSettings }: Props) {
  const handleChange =
    (key: keyof SiteSettings) =>
      (e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSettings((prev) => ({
          ...prev,
          [key]: value,
        }));
      };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Analitik, OAuth & Entegrasyonlar</CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Google Analytics & Facebook Pixel */}
        <section className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground">
            Analytics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="google_analytics_id">Google Analytics ID</Label>
              <Input
                id="google_analytics_id"
                placeholder="G-XXXXXXXXXX"
                value={settings.google_analytics_id ?? ""}
                onChange={handleChange("google_analytics_id")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="facebook_pixel_id">Facebook Pixel ID</Label>
              <Input
                id="facebook_pixel_id"
                placeholder="XXXXXXXXXXXXXXX"
                value={settings.facebook_pixel_id ?? ""}
                onChange={handleChange("facebook_pixel_id")}
              />
            </div>
          </div>
        </section>

        {/* Google OAuth */}
        <section className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground">
            Google OAuth (Giriş)
          </h3>
          <p className="text-xs text-muted-foreground">
            Buradaki değerler <code>site_settings</code> tablosundan okunur ve
            backend&apos;de Google ile giriş için kullanılır.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="google_client_id">Google Client ID</Label>
              <Input
                id="google_client_id"
                placeholder="4400....apps.googleusercontent.com"
                value={settings.google_client_id ?? ""}
                onChange={handleChange("google_client_id")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="google_client_secret">Google Client Secret</Label>
              <Input
                id="google_client_secret"
                type="password"
                placeholder="GOCSPX-..."
                value={settings.google_client_secret ?? ""}
                onChange={handleChange("google_client_secret")}
              />
            </div>
          </div>
        </section>

        {/* Cloudinary / Dosya Yükleme */}
        <section className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground">
            Cloudinary (Dosya Yükleme)
          </h3>
          <p className="text-xs text-muted-foreground">
            Bu ayarlar storage servisinde kullanılır. Boş bırakılırsa env
            değişkenlerine fallback yapılır.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cloudinary_cloud_name">Cloud Name</Label>
              <Input
                id="cloudinary_cloud_name"
                placeholder="my-cloud-name"
                value={settings.cloudinary_cloud_name ?? ""}
                onChange={handleChange("cloudinary_cloud_name")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cloudinary_folder">Varsayılan Klasör</Label>
              <Input
                id="cloudinary_folder"
                placeholder="products"
                value={settings.cloudinary_folder ?? ""}
                onChange={handleChange("cloudinary_folder")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cloudinary_api_key">API Key</Label>
              <Input
                id="cloudinary_api_key"
                placeholder="xxxxxxxx"
                value={settings.cloudinary_api_key ?? ""}
                onChange={handleChange("cloudinary_api_key")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cloudinary_api_secret">API Secret</Label>
              <Input
                id="cloudinary_api_secret"
                type="password"
                placeholder="yyyyyy"
                value={settings.cloudinary_api_secret ?? ""}
                onChange={handleChange("cloudinary_api_secret")}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="cloudinary_unsigned_preset">
                Unsigned Upload Preset
              </Label>
              <Input
                id="cloudinary_unsigned_preset"
                placeholder="unsigned-upload"
                value={settings.cloudinary_unsigned_preset ?? ""}
                onChange={handleChange("cloudinary_unsigned_preset")}
              />
            </div>
          </div>
        </section>

        {/* Sosyal Medya & Diğer */}
        <section className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground">
            Sosyal Medya & Diğer Entegrasyonlar
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="facebook_url">Facebook URL</Label>
              <Input
                id="facebook_url"
                placeholder="https://facebook.com/..."
                value={settings.facebook_url ?? ""}
                onChange={handleChange("facebook_url")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="twitter_url">Twitter(X) URL</Label>
              <Input
                id="twitter_url"
                placeholder="https://x.com/..."
                value={settings.twitter_url ?? ""}
                onChange={handleChange("twitter_url")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instagram_url">Instagram URL</Label>
              <Input
                id="instagram_url"
                placeholder="https://instagram.com/..."
                value={settings.instagram_url ?? ""}
                onChange={handleChange("instagram_url")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkedin_url">LinkedIn URL</Label>
              <Input
                id="linkedin_url"
                placeholder="https://linkedin.com/company/..."
                value={settings.linkedin_url ?? ""}
                onChange={handleChange("linkedin_url")}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="discord_webhook_url">Discord Webhook URL</Label>
              <Input
                id="discord_webhook_url"
                placeholder="https://discord.com/api/webhooks/..."
                value={settings.discord_webhook_url ?? ""}
                onChange={handleChange("discord_webhook_url")}
              />
            </div>
          </div>
        </section>
      </CardContent>
    </Card>
  );
}
