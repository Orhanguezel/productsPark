// =============================================================
// FILE: src/pages/admin/settings/components/BrandMediaSettingsCard.tsx
// FINAL — Logo (light/dark) + Favicon yükleme & URL düzenleme
// - Cloudinary unsigned upload kullanır
// - site_settings key'leri: light_logo, dark_logo, favicon_url, logo_url
// =============================================================
'use client';

import { useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ImagePlus, Trash2, X, Image, Palette, Share2, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import { useGetSiteSettingByKeyQuery } from '@/integrations/hooks';
import type { Dispatch, SetStateAction } from 'react';

interface Props {
  settings: {
    light_logo: string;
    dark_logo: string;
    favicon_url: string;
    logo_url: string;
    og_default_image: string;
    apple_touch_icon: string;
    pwa_icon_192: string;
    pwa_icon_512: string;
    pwa_theme_color: string;
    pwa_background_color: string;
  };
  setSettings: Dispatch<SetStateAction<any>>;
}

// Cloudinary unsigned upload helper
async function uploadToCloudinary(
  file: File,
  cloudName: string,
  preset: string,
  folder: string,
): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', preset);
  formData.append('folder', folder);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Cloudinary yükleme hatası');
  }

  const data = await res.json();
  return data.secure_url as string;
}

// Tek bir medya alanı: önizleme + URL input + yükleme butonu + temizle
function MediaField({
  label,
  description,
  value,
  onChange,
  onUpload,
  uploading,
  accept = 'image/*',
  previewSize = 'h-16',
}: {
  label: string;
  description?: string;
  value: string;
  onChange: (url: string) => void;
  onUpload: (file: File) => void;
  uploading: boolean;
  accept?: string;
  previewSize?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}

      <div className="flex gap-2">
        <Input
          placeholder="https://…"
          value={value}
          onChange={(e) => onChange(e.target.value)}
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

      <div className="flex items-end gap-4">
        {/* Preview */}
        {value ? (
          <img
            src={value}
            alt={label}
            className={`${previewSize} max-w-[200px] rounded border object-contain bg-white p-1`}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div
            className={`${previewSize} w-[200px] rounded border bg-muted flex items-center justify-center`}
          >
            <span className="text-xs text-muted-foreground">Önizleme yok</span>
          </div>
        )}

        {/* Upload button */}
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

        {/* Remove */}
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange('')}
            disabled={uploading}
            className="text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Kaldır
          </Button>
        )}
      </div>
    </div>
  );
}

export default function BrandMediaSettingsCard({ settings, setSettings }: Props) {
  const [uploading, setUploading] = useState<string | null>(null);

  // Cloudinary config'i site_settings'den çek
  const { data: cloudNameSetting } = useGetSiteSettingByKeyQuery('cloudinary_cloud_name');
  const { data: presetSetting } = useGetSiteSettingByKeyQuery('cloudinary_unsigned_preset');
  const { data: folderSetting } = useGetSiteSettingByKeyQuery('cloudinary_folder');

  const cloudName =
    typeof cloudNameSetting?.value === 'string' && cloudNameSetting.value.trim()
      ? cloudNameSetting.value.trim()
      : '';
  const preset =
    typeof presetSetting?.value === 'string' && presetSetting.value.trim()
      ? presetSetting.value.trim()
      : '';
  const folder =
    typeof folderSetting?.value === 'string' && folderSetting.value.trim()
      ? folderSetting.value.trim()
      : 'brand';

  const update = (key: string, value: string) => {
    setSettings((prev: Record<string, unknown>) => ({ ...prev, [key]: value }));
  };

  const handleUpload = async (key: string, file: File) => {
    if (!cloudName || !preset) {
      toast.error('Cloudinary ayarları eksik. Entegrasyonlar sekmesinden yapılandırın.');
      return;
    }

    // Dosya boyut kontrolü (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Dosya boyutu 5MB'dan küçük olmalıdır");
      return;
    }

    try {
      setUploading(key);
      const url = await uploadToCloudinary(file, cloudName, preset, folder);
      update(key, url);
      toast.success('Görsel yüklendi');
    } catch (err) {
      console.error('Upload error:', err);
      toast.error(err instanceof Error ? err.message : 'Yükleme sırasında hata oluştu');
    } finally {
      setUploading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* ==================== Logo ==================== */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Logo Ayarları
          </CardTitle>
          <CardDescription>
            Sitenizde kullanılacak logo görselleri. Light ve dark tema için ayrı logo
            yükleyebilirsiniz.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <MediaField
            label="Light Tema Logosu"
            description="Açık arka plan üzerinde gösterilecek logo"
            value={settings.light_logo ?? ''}
            onChange={(url) => update('light_logo', url)}
            onUpload={(file) => handleUpload('light_logo', file)}
            uploading={uploading === 'light_logo'}
          />

          <div className="border-t pt-4">
            <MediaField
              label="Dark Tema Logosu"
              description="Koyu arka plan üzerinde gösterilecek logo"
              value={settings.dark_logo ?? ''}
              onChange={(url) => update('dark_logo', url)}
              onUpload={(file) => handleUpload('dark_logo', file)}
              uploading={uploading === 'dark_logo'}
            />
          </div>

          <div className="border-t pt-4">
            <MediaField
              label="Genel Logo URL (opsiyonel)"
              description="SEO ve Open Graph için kullanılan tek logo. Boş bırakılırsa light logo kullanılır."
              value={settings.logo_url ?? ''}
              onChange={(url) => update('logo_url', url)}
              onUpload={(file) => handleUpload('logo_url', file)}
              uploading={uploading === 'logo_url'}
            />
          </div>
        </CardContent>
      </Card>

      {/* ==================== Favicon ==================== */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="w-5 h-5" />
            Favicon
          </CardTitle>
          <CardDescription>
            Tarayıcı sekmesinde görünen küçük simge. PNG veya ICO formatı önerilir (32x32 veya 16x16
            px).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MediaField
            label="Favicon URL"
            value={settings.favicon_url ?? ''}
            onChange={(url) => update('favicon_url', url)}
            onUpload={(file) => handleUpload('favicon_url', file)}
            uploading={uploading === 'favicon_url'}
            accept="image/png,image/x-icon,image/svg+xml,image/ico,.ico"
            previewSize="h-10"
          />
        </CardContent>
      </Card>

      {/* ==================== Social Media / OG ==================== */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Social Media Görseli
          </CardTitle>
          <CardDescription>
            Facebook, Twitter vb. sosyal medya paylaşımlarında görünecek varsayılan görsel (Open
            Graph). Önerilen boyut: 1200x630 px.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MediaField
            label="OG Default Image"
            description="Sosyal medya paylaşımlarında varsayılan olarak kullanılacak görsel"
            value={settings.og_default_image ?? ''}
            onChange={(url) => update('og_default_image', url)}
            onUpload={(file) => handleUpload('og_default_image', file)}
            uploading={uploading === 'og_default_image'}
            previewSize="h-20"
          />
        </CardContent>
      </Card>

      {/* ==================== PWA / Mobil İkonlar ==================== */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            PWA / Mobil İkonlar
          </CardTitle>
          <CardDescription>
            Progressive Web App ve mobil cihazlar için kullanılacak ikonlar. Ana ekrana
            eklendiğinde görünecek simgeler.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <MediaField
            label="Apple Touch Icon"
            description="iOS cihazlarda ana ekrana eklendiğinde görünecek ikon (180x180 px)"
            value={settings.apple_touch_icon ?? ''}
            onChange={(url) => update('apple_touch_icon', url)}
            onUpload={(file) => handleUpload('apple_touch_icon', file)}
            uploading={uploading === 'apple_touch_icon'}
            accept="image/png"
            previewSize="h-12"
          />

          <div className="border-t pt-4">
            <MediaField
              label="PWA Icon (192x192)"
              description="PWA manifest için 192x192 boyutunda ikon"
              value={settings.pwa_icon_192 ?? ''}
              onChange={(url) => update('pwa_icon_192', url)}
              onUpload={(file) => handleUpload('pwa_icon_192', file)}
              uploading={uploading === 'pwa_icon_192'}
              accept="image/png"
              previewSize="h-12"
            />
          </div>

          <div className="border-t pt-4">
            <MediaField
              label="PWA Icon (512x512)"
              description="PWA manifest için 512x512 boyutunda ikon"
              value={settings.pwa_icon_512 ?? ''}
              onChange={(url) => update('pwa_icon_512', url)}
              onUpload={(file) => handleUpload('pwa_icon_512', file)}
              uploading={uploading === 'pwa_icon_512'}
              accept="image/png"
              previewSize="h-16"
            />
          </div>

          {/* PWA Colors */}
          <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pwa_theme_color">Tema Rengi</Label>
              <p className="text-xs text-muted-foreground">
                Tarayıcı araç çubuğu ve PWA üst bar rengi
              </p>
              <div className="flex gap-2">
                <Input
                  id="pwa_theme_color"
                  type="color"
                  value={settings.pwa_theme_color ?? '#000000'}
                  onChange={(e) => update('pwa_theme_color', e.target.value)}
                  className="w-16 h-10 p-1 cursor-pointer"
                />
                <Input
                  type="text"
                  value={settings.pwa_theme_color ?? '#000000'}
                  onChange={(e) => update('pwa_theme_color', e.target.value)}
                  placeholder="#000000"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pwa_background_color">Arka Plan Rengi</Label>
              <p className="text-xs text-muted-foreground">
                PWA splash screen ve yükleme ekranı arka plan rengi
              </p>
              <div className="flex gap-2">
                <Input
                  id="pwa_background_color"
                  type="color"
                  value={settings.pwa_background_color ?? '#ffffff'}
                  onChange={(e) => update('pwa_background_color', e.target.value)}
                  className="w-16 h-10 p-1 cursor-pointer"
                />
                <Input
                  type="text"
                  value={settings.pwa_background_color ?? '#ffffff'}
                  onChange={(e) => update('pwa_background_color', e.target.value)}
                  placeholder="#ffffff"
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
