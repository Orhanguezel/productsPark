'use client';

// =============================================================
// FILE: src/pages/admin/settings/components/SeoGlobalSettingsCard.tsx
// FINAL — SEO Global / Robots / Analytics / Social / Schema / Hreflang / Sitemap / Assets
// FIX: JSON textarea values never show [object Object]
// - JSON-text keys are stringified on display
// - On change, value is stored as string (raw textarea)
// - exactOptionalPropertyTypes friendly
// =============================================================

import * as React from 'react';
import { useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { ImagePlus, X } from 'lucide-react';
import { toast } from 'sonner';
import { useCreateAssetAdminMutation } from '@/integrations/hooks';

type Props<T> = {
  settings: T;
  setSettings: Dispatch<SetStateAction<T>>;
};

type GlobalKey =
  | 'favicon_url'
  | 'logo_url'
  | 'apple_touch_icon'
  | 'robots_meta'
  | 'robots_txt_enabled'
  | 'robots_txt_content'
  | 'canonical_base_url'
  | 'hreflang_enabled'
  | 'hreflang_locales'
  | 'og_site_name'
  | 'og_default_image'
  | 'twitter_site'
  | 'twitter_card'
  | 'google_site_verification'
  | 'bing_site_verification'
  | 'schema_org_enabled'
  | 'schema_org_organization'
  | 'schema_org_website'
  | 'analytics_ga_id'
  | 'analytics_gtm_id'
  | 'facebook_pixel_id'
  | 'sitemap_enabled'
  | 'sitemap_base_url'
  | 'sitemap_urls'
  | 'custom_header_code'
  | 'custom_footer_code';

const JSON_TEXT_KEYS: ReadonlySet<GlobalKey> = new Set([
  'hreflang_locales',
  'schema_org_organization',
  'schema_org_website',
  'sitemap_urls',
]);

const toBoolish = (v: unknown): boolean => {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    return s === '1' || s === 'true' || s === 'yes' || s === 'on';
  }
  return false;
};

const toStr = (v: unknown): string => (typeof v === 'string' ? v : v == null ? '' : String(v));

const toJsonText = (v: unknown, fallback: string): string => {
  if (v == null) return fallback;
  if (typeof v === 'string') return v.trim() ? v : fallback;

  if (typeof v === 'object') {
    try {
      const s = JSON.stringify(v, null, 2);
      return s.trim() ? s : fallback;
    } catch {
      return fallback;
    }
  }

  const s = String(v);
  return s.trim() ? s : fallback;
};

function pickUrl(res: unknown): string | null {
  if (!res || typeof res !== 'object') return null;
  const r = res as Record<string, unknown>;
  return (
    (typeof r.url === 'string' ? r.url : null) ??
    (typeof r.public_url === 'string' ? r.public_url : null) ??
    (r.data && typeof (r.data as Record<string, unknown>).url === 'string'
      ? (r.data as Record<string, unknown>).url as string
      : null) ??
    (r.asset && typeof (r.asset as Record<string, unknown>).url === 'string'
      ? (r.asset as Record<string, unknown>).url as string
      : null) ??
    null
  );
}

function UploadField({
  id,
  label,
  value,
  onChange,
  onUpload,
  uploading,
  accept = 'image/*',
  description,
  previewSize = 'h-10',
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  onUpload: (file: File) => void;
  uploading: boolean;
  accept?: string;
  description?: string;
  previewSize?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
      <div className="flex gap-2">
        <Input
          id={id}
          placeholder="https://…"
          value={value}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
          disabled={uploading}
        />
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onChange('')}
            title="Temizle"
            disabled={uploading}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="flex items-end gap-3">
        {value ? (
          <img
            src={value}
            alt={label}
            className={`${previewSize} max-w-[120px] rounded border object-contain bg-white p-1`}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div
            className={`${previewSize} w-[120px] rounded border bg-muted flex items-center justify-center`}
          >
            <span className="text-xs text-muted-foreground">Önizleme yok</span>
          </div>
        )}
        <div>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onUpload(f);
              e.currentTarget.value = '';
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            <ImagePlus className="h-4 w-4 mr-2" />
            {uploading ? 'Yükleniyor…' : 'Dosya Yükle'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function FieldTitle({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function FieldArea({
  id,
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div className="space-y-2 md:col-span-2">
      <Label htmlFor={id}>{label}</Label>
      <Textarea
        id={id}
        rows={rows}
        value={value}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function FieldSwitch({
  id,
  label,
  checked,
  onCheckedChange,
  hint,
}: {
  id: string;
  label: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  hint?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border p-3">
      <div className="space-y-1">
        <Label htmlFor={id}>{label}</Label>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

export default function SeoGlobalSettingsCard<T>({ settings, setSettings }: Props<T>) {
  const dyn = settings as unknown as Record<string, unknown>;
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadAsset] = useCreateAssetAdminMutation();

  const setField =
    (key: GlobalKey) =>
    (value: unknown): void => {
      setSettings((prev) => {
        const out = { ...(prev as unknown as Record<string, unknown>) };

        // JSON text alanları: state içinde daima string tut
        if (JSON_TEXT_KEYS.has(key)) {
          out[key] = typeof value === 'string' ? value : toJsonText(value, '');
          return out as unknown as T;
        }

        out[key] = value;
        return out as unknown as T;
      });
    };

  const handleUpload = async (key: 'favicon_url' | 'logo_url' | 'apple_touch_icon', file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Dosya boyutu 5MB'dan küçük olmalıdır");
      return;
    }
    try {
      setUploading(key);
      const folder =
        key === 'favicon_url' ? 'favicons' :
        key === 'apple_touch_icon' ? 'icons' :
        'logos';
      const res = await uploadAsset({
        file,
        bucket: 'brand',
        folder,
        metadata: { module: 'seo', kind: key },
      }).unwrap();
      const url = pickUrl(res);
      if (!url) throw new Error('Yükleme tamamlandı ama URL alınamadı');
      setField(key)(url);
      toast.success('Görsel yüklendi');
    } catch (err) {
      console.error('Upload error:', err);
      toast.error(err instanceof Error ? err.message : 'Yükleme sırasında hata oluştu');
    } finally {
      setUploading(null);
    }
  };

  const getText = (k: GlobalKey): string => {
    const v = dyn[k];
    if (JSON_TEXT_KEYS.has(k)) {
      const fallback = k === 'sitemap_urls' || k === 'hreflang_locales' ? '[]' : '';
      return toJsonText(v, fallback);
    }
    return toStr(v);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>SEO Global / Robots / Analytics</CardTitle>
      </CardHeader>

      <CardContent className="space-y-10">
        {/* Assets */}
        <section className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground">Assets</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UploadField
              id="favicon_url"
              label="Favicon URL"
              description="Tarayıcı sekmesinde görünen simge (PNG, ICO, SVG — 32x32 önerilir)"
              value={getText('favicon_url')}
              onChange={(v) => setField('favicon_url')(v)}
              onUpload={(file) => handleUpload('favicon_url', file)}
              uploading={uploading === 'favicon_url'}
              accept="image/png,image/x-icon,image/svg+xml,.ico"
              previewSize="h-8"
            />
            <UploadField
              id="logo_url"
              label="Logo URL"
              description="SEO ve Open Graph için ana logo (şeffaf PNG önerilir)"
              value={getText('logo_url')}
              onChange={(v) => setField('logo_url')(v)}
              onUpload={(file) => handleUpload('logo_url', file)}
              uploading={uploading === 'logo_url'}
              previewSize="h-12"
            />
            <UploadField
              id="apple_touch_icon"
              label="Apple Touch Icon"
              description="iOS ana ekrana eklendiğinde görünecek ikon (PNG, 180x180 önerilir)"
              value={getText('apple_touch_icon')}
              onChange={(v) => setField('apple_touch_icon')(v)}
              onUpload={(file) => handleUpload('apple_touch_icon', file)}
              uploading={uploading === 'apple_touch_icon'}
              accept="image/png"
              previewSize="h-12"
            />
          </div>
        </section>

        {/* Robots */}
        <section className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground">Robots</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FieldTitle
              id="robots_meta"
              label="robots meta"
              value={getText('robots_meta') || 'index,follow'}
              onChange={(v) => setField('robots_meta')(v)}
              placeholder="index,follow | noindex,nofollow"
            />

            <FieldSwitch
              id="robots_txt_enabled"
              label="robots.txt aktif"
              checked={toBoolish(dyn.robots_txt_enabled)}
              onCheckedChange={(v) => setField('robots_txt_enabled')(v)}
              hint="Aktifse /robots.txt içeriği backend tarafından servis edilmelidir."
            />

            <FieldArea
              id="robots_txt_content"
              label="robots.txt içeriği"
              value={getText('robots_txt_content')}
              onChange={(v) => setField('robots_txt_content')(v)}
              placeholder={'User-agent: *\nDisallow:\n\nSitemap: /sitemap.xml\n'}
              rows={6}
            />
          </div>
        </section>

        {/* Canonical + Hreflang */}
        <section className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground">Canonical & Hreflang</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FieldTitle
              id="canonical_base_url"
              label="Canonical base URL"
              value={getText('canonical_base_url')}
              onChange={(v) => setField('canonical_base_url')(v)}
              placeholder="https://example.com"
            />

            <FieldSwitch
              id="hreflang_enabled"
              label="Hreflang aktif"
              checked={toBoolish(dyn.hreflang_enabled)}
              onCheckedChange={(v) => setField('hreflang_enabled')(v)}
              hint="Aktifse RouteSeoLinks hreflang link’lerini render eder."
            />

            <FieldArea
              id="hreflang_locales"
              label="Hreflang locales (JSON)"
              value={getText('hreflang_locales') || '[]'}
              onChange={(v) => setField('hreflang_locales')(v)}
              placeholder={'[\n  { "locale": "tr", "prefix": "" }\n]'}
              rows={6}
            />
          </div>
        </section>

        {/* Social */}
        <section className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground">Open Graph & Twitter</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FieldTitle
              id="og_site_name"
              label="og:site_name"
              value={getText('og_site_name')}
              onChange={(v) => setField('og_site_name')(v)}
              placeholder="Dijimins"
            />
            <FieldTitle
              id="og_default_image"
              label="og:image (default)"
              value={getText('og_default_image')}
              onChange={(v) => setField('og_default_image')(v)}
              placeholder="https://.../og.jpg"
            />
            <FieldTitle
              id="twitter_site"
              label="twitter:site"
              value={getText('twitter_site')}
              onChange={(v) => setField('twitter_site')(v)}
              placeholder="@site"
            />
            <FieldTitle
              id="twitter_card"
              label="twitter:card"
              value={getText('twitter_card') || 'summary_large_image'}
              onChange={(v) => setField('twitter_card')(v)}
              placeholder="summary_large_image"
            />
          </div>
        </section>

        {/* Verification */}
        <section className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground">Verification</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FieldTitle
              id="google_site_verification"
              label="Google Site Verification"
              value={getText('google_site_verification')}
              onChange={(v) => setField('google_site_verification')(v)}
            />
            <FieldTitle
              id="bing_site_verification"
              label="Bing Verification (msvalidate.01)"
              value={getText('bing_site_verification')}
              onChange={(v) => setField('bing_site_verification')(v)}
            />
          </div>
        </section>

        {/* Analytics */}
        <section className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground">Analytics</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FieldTitle
              id="analytics_ga_id"
              label="GA4 Measurement ID"
              value={getText('analytics_ga_id')}
              onChange={(v) => setField('analytics_ga_id')(v)}
              placeholder="G-XXXXXXXXXX"
            />
            <FieldTitle
              id="analytics_gtm_id"
              label="GTM Container ID"
              value={getText('analytics_gtm_id')}
              onChange={(v) => setField('analytics_gtm_id')(v)}
              placeholder="GTM-XXXXXXX"
            />
            <FieldTitle
              id="facebook_pixel_id"
              label="Facebook Pixel ID"
              value={getText('facebook_pixel_id')}
              onChange={(v) => setField('facebook_pixel_id')(v)}
              placeholder="1234567890"
            />
          </div>
        </section>

        {/* Schema.org */}
        <section className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground">Schema.org (JSON-LD)</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FieldSwitch
              id="schema_org_enabled"
              label="Schema.org aktif"
              checked={toBoolish(dyn.schema_org_enabled)}
              onCheckedChange={(v) => setField('schema_org_enabled')(v)}
            />

            <FieldArea
              id="schema_org_organization"
              label="Organization JSON"
              value={getText('schema_org_organization')}
              onChange={(v) => setField('schema_org_organization')(v)}
              placeholder={
                '{ "@context":"https://schema.org", "@type":"Organization", "name":"..." }'
              }
              rows={8}
            />

            <FieldArea
              id="schema_org_website"
              label="WebSite JSON"
              value={getText('schema_org_website')}
              onChange={(v) => setField('schema_org_website')(v)}
              placeholder={'{ "@context":"https://schema.org", "@type":"WebSite", "name":"..." }'}
              rows={8}
            />
          </div>
        </section>

        {/* Sitemap */}
        <section className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground">Sitemap</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FieldSwitch
              id="sitemap_enabled"
              label="Sitemap aktif"
              checked={toBoolish(dyn.sitemap_enabled)}
              onCheckedChange={(v) => setField('sitemap_enabled')(v)}
              hint="Aktifse /sitemap.xml backend tarafından üretilmeli."
            />

            <FieldTitle
              id="sitemap_base_url"
              label="Sitemap base URL"
              value={getText('sitemap_base_url')}
              onChange={(v) => setField('sitemap_base_url')(v)}
              placeholder="Boşsa canonical_base_url veya window.origin kullanılır"
            />

            <FieldArea
              id="sitemap_urls"
              label="Sitemap URLs (JSON)"
              value={getText('sitemap_urls') || '[]'}
              onChange={(v) => setField('sitemap_urls')(v)}
              placeholder={'[\n  { "path": "/", "changefreq": "daily", "priority": 1.0 }\n]'}
              rows={10}
            />
          </div>
        </section>

        {/* Custom Codes */}
        <section className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground">Custom Codes</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FieldArea
              id="custom_header_code"
              label="Custom Header Code"
              value={getText('custom_header_code')}
              onChange={(v) => setField('custom_header_code')(v)}
              placeholder="Head içine eklenecek script/meta"
              rows={8}
            />
            <FieldArea
              id="custom_footer_code"
              label="Custom Footer Code"
              value={getText('custom_footer_code')}
              onChange={(v) => setField('custom_footer_code')(v)}
              placeholder="Body sonunda çalıştırılacak script/html"
              rows={8}
            />
          </div>
        </section>
      </CardContent>
    </Card>
  );
}
