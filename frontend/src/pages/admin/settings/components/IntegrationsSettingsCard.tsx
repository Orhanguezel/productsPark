'use client';

// =============================================================
// FINAL — Integrations Settings Card (parent SettingsPage compatible)
// - Accepts ANY parent settings model (T)
// - Safe read/write via Record<string, unknown>
// - no SiteSettings import
// - exactOptionalPropertyTypes friendly
// =============================================================

import * as React from 'react';
import type { ChangeEvent, Dispatch, SetStateAction } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

/* ------------------------------------------------------------------ */
/* Keys used by this card (must exist in site_settings keys)           */
/* ------------------------------------------------------------------ */

const INTEGRATION_KEYS = [
  'facebook_pixel_id',

  'google_client_id',
  'google_client_secret',

  'cloudinary_cloud_name',
  'cloudinary_folder',
  'cloudinary_api_key',
  'cloudinary_api_secret',
  'cloudinary_unsigned_preset',

  'facebook_url',
  'twitter_url',
  'instagram_url',
  'linkedin_url',
  'discord_webhook_url',
] as const;

type IntegrationKey = (typeof INTEGRATION_KEYS)[number];

/* ------------------------------------------------------------------ */
/* Props (generic)                                                    */
/* ------------------------------------------------------------------ */

type Props<T> = {
  settings: T;
  setSettings: Dispatch<SetStateAction<T>>;
};

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

const toStr = (v: unknown): string => (typeof v === 'string' ? v : v == null ? '' : String(v));

export default function IntegrationsSettingsCard<T>({ settings, setSettings }: Props<T>) {
  const dyn = settings as unknown as Record<string, unknown>;

  const handleChange =
    (key: IntegrationKey) =>
    (e: ChangeEvent<HTMLInputElement>): void => {
      const value = e.target.value;

      setSettings((prev) => {
        const out = { ...(prev as unknown as Record<string, unknown>) };
        out[key] = value;
        return out as unknown as T;
      });
    };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Analitik, OAuth & Entegrasyonlar</CardTitle>
      </CardHeader>

      <CardContent className="space-y-8">
        {/* Google Analytics & Facebook Pixel */}
        <section className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground">Analytics</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="facebook_pixel_id">Facebook Pixel ID</Label>
              <Input
                id="facebook_pixel_id"
                placeholder="XXXXXXXXXXXXXXX"
                value={toStr(dyn.facebook_pixel_id)}
                onChange={handleChange('facebook_pixel_id')}
              />
            </div>
          </div>
        </section>

        {/* Google OAuth */}
        <section className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground">Google OAuth (Giriş)</h3>

          <p className="text-xs text-muted-foreground">
            Buradaki değerler <code>site_settings</code> tablosundan okunur ve backend&apos;de
            Google ile giriş için kullanılır.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="google_client_id">Google Client ID</Label>
              <Input
                id="google_client_id"
                placeholder="4400....apps.googleusercontent.com"
                value={toStr(dyn.google_client_id)}
                onChange={handleChange('google_client_id')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="google_client_secret">Google Client Secret</Label>
              <Input
                id="google_client_secret"
                type="password"
                placeholder="GOCSPX-..."
                value={toStr(dyn.google_client_secret)}
                onChange={handleChange('google_client_secret')}
              />
            </div>
          </div>
        </section>

        {/* Cloudinary */}
        <section className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground">
            Cloudinary (Dosya Yükleme)
          </h3>

          <p className="text-xs text-muted-foreground">
            Bu ayarlar storage servisinde kullanılır. Boş bırakılırsa env değişkenlerine fallback
            yapılır.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cloudinary_cloud_name">Cloud Name</Label>
              <Input
                id="cloudinary_cloud_name"
                placeholder="my-cloud-name"
                value={toStr(dyn.cloudinary_cloud_name)}
                onChange={handleChange('cloudinary_cloud_name')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cloudinary_folder">Varsayılan Klasör</Label>
              <Input
                id="cloudinary_folder"
                placeholder="products"
                value={toStr(dyn.cloudinary_folder)}
                onChange={handleChange('cloudinary_folder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cloudinary_api_key">API Key</Label>
              <Input
                id="cloudinary_api_key"
                placeholder="xxxxxxxx"
                value={toStr(dyn.cloudinary_api_key)}
                onChange={handleChange('cloudinary_api_key')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cloudinary_api_secret">API Secret</Label>
              <Input
                id="cloudinary_api_secret"
                type="password"
                placeholder="yyyyyy"
                value={toStr(dyn.cloudinary_api_secret)}
                onChange={handleChange('cloudinary_api_secret')}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="cloudinary_unsigned_preset">Unsigned Upload Preset</Label>
              <Input
                id="cloudinary_unsigned_preset"
                placeholder="unsigned-upload"
                value={toStr(dyn.cloudinary_unsigned_preset)}
                onChange={handleChange('cloudinary_unsigned_preset')}
              />
            </div>
          </div>
        </section>

        {/* Social */}
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
                value={toStr(dyn.facebook_url)}
                onChange={handleChange('facebook_url')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="twitter_url">Twitter(X) URL</Label>
              <Input
                id="twitter_url"
                placeholder="https://x.com/..."
                value={toStr(dyn.twitter_url)}
                onChange={handleChange('twitter_url')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instagram_url">Instagram URL</Label>
              <Input
                id="instagram_url"
                placeholder="https://instagram.com/..."
                value={toStr(dyn.instagram_url)}
                onChange={handleChange('instagram_url')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="linkedin_url">LinkedIn URL</Label>
              <Input
                id="linkedin_url"
                placeholder="https://linkedin.com/company/..."
                value={toStr(dyn.linkedin_url)}
                onChange={handleChange('linkedin_url')}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="discord_webhook_url">Discord Webhook URL</Label>
              <Input
                id="discord_webhook_url"
                placeholder="https://discord.com/api/webhooks/..."
                value={toStr(dyn.discord_webhook_url)}
                onChange={handleChange('discord_webhook_url')}
              />
            </div>
          </div>
        </section>
      </CardContent>
    </Card>
  );
}
