// =============================================================
// FILE: src/components/admin/products/form/sections/BasicInfo.tsx
// FINAL — Basic Info + Cover + Gallery (multi)
// - CoverImageSection stays
// - MultiImageSection: gallery_urls + gallery_asset_ids (index preserved)
// - exactOptionalPropertyTypes-safe
// =============================================================

'use client';

import React, { useEffect, useMemo, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

import { CoverImageSection } from '@/components/common/CoverImageSection';
import { MultiImageSection, type GalleryItem } from '@/components/common/MultiImageSection';

import type { ProductAdmin } from '@/integrations/types';

type Props = {
  formData: Partial<ProductAdmin>;
  setField: <K extends keyof ProductAdmin>(key: K, val: ProductAdmin[K]) => void;

  quantityOptions: { quantity: number; price: number }[];
  onUploadFeatured: (file: File) => Promise<void>;

  onUploadGallery: (files: File[]) => Promise<GalleryItem[]>;

  uploading?: boolean;

  quillModules: unknown;
  quillFormats?: readonly string[];
};

export default function BasicInfo({
  formData,
  setField,
  quantityOptions,
  onUploadFeatured,
  onUploadGallery,
  uploading,
  quillModules,
  quillFormats,
}: Props) {
  const [previewNonce, setPreviewNonce] = useState<number>(() => Date.now());

  useEffect(() => {
    setPreviewNonce(Date.now());
  }, [
    formData.featured_image,
    formData.image_url,
    formData.featured_image_asset_id,
    formData.gallery_urls,
    formData.gallery_asset_ids,
  ]);


  const numericValue = (val: unknown) => (val === undefined || val === null ? '' : String(val));

  const parseNumber = (raw: string): number => {
    const n = Number(String(raw).replace(',', '.'));
    return Number.isFinite(n) ? n : 0;
  };

  const handleNumericChange = <K extends keyof ProductAdmin>(key: K, raw: string) => {
    if (raw === '') {
      if (key === 'original_price') setField(key, null as ProductAdmin[K]);
      else setField(key, 0 as ProductAdmin[K]);
      return;
    }
    setField(key, parseNumber(raw) as ProductAdmin[K]);
  };

  const rawImageUrl =
    (typeof formData.featured_image === 'string' && formData.featured_image.trim()
      ? formData.featured_image.trim()
      : typeof formData.image_url === 'string' && formData.image_url.trim()
        ? formData.image_url.trim()
        : '') || '';

  const previewUrl = useMemo(() => {
    if (!rawImageUrl) return '';
    const sep = rawImageUrl.includes('?') ? '&' : '?';
    const v = formData.featured_image_asset_id
      ? String(formData.featured_image_asset_id)
      : String(previewNonce);
    return `${rawImageUrl}${sep}v=${encodeURIComponent(v)}`;
  }, [rawImageUrl, formData.featured_image_asset_id, previewNonce]);

  // ✅ gallery controlled values
  const galleryUrls = useMemo((): string[] => {
    const v = formData.gallery_urls as unknown;
    if (!Array.isArray(v)) return [];
    return v.map((x) => (typeof x === 'string' ? x.trim() : '')).filter(Boolean);
  }, [formData.gallery_urls]);

  const galleryAssetIds = useMemo((): (string | null)[] | null => {
    const v = formData.gallery_asset_ids as unknown;
    if (!Array.isArray(v)) return null;

    const arr: (string | null)[] = v.map((x) => {
      if (typeof x !== 'string') return null;
      const t = x.trim();
      return t ? t : null;
    });

    return arr.some(Boolean) ? arr : null;
  }, [formData.gallery_asset_ids]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Ürün Adı *</Label>
          <Input
            id="name"
            value={formData.name ?? ''}
            onChange={(e) => {
              const newName = e.target.value;

              const newSlug = newName
                .toLowerCase()
                .replace(/ğ/g, 'g')
                .replace(/ü/g, 'u')
                .replace(/ş/g, 's')
                .replace(/ı/g, 'i')
                .replace(/ö/g, 'o')
                .replace(/ç/g, 'c')
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '');

              setField('name', newName as ProductAdmin['name']);
              setField('slug', newSlug as ProductAdmin['slug']);
            }}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">Slug (URL) *</Label>
          <Input
            id="slug"
            value={formData.slug ?? ''}
            onChange={(e) => setField('slug', e.target.value as ProductAdmin['slug'])}
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">Fiyat *</Label>
          <Input
            id="price"
            inputMode="decimal"
            value={numericValue(formData.price)}
            onChange={(e) => handleNumericChange('price', e.target.value)}
            required
            disabled={(quantityOptions ?? []).length > 0}
          />
          {(quantityOptions ?? []).length > 0 && (
            <p className="text-xs text-muted-foreground">Adet seçenekleri kullanılıyor</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="original_price">Eski Fiyat</Label>
          <Input
            id="original_price"
            inputMode="decimal"
            value={numericValue(formData.original_price)}
            onChange={(e) => {
              const v = e.target.value;
              if (v === '') {
                setField('original_price', null as ProductAdmin['original_price']);
                return;
              }
              setField('original_price', parseNumber(v) as ProductAdmin['original_price']);
            }}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="stock_quantity">Stok *</Label>
          <Input
            id="stock_quantity"
            inputMode="numeric"
            value={numericValue(formData.stock_quantity)}
            onChange={(e) => handleNumericChange('stock_quantity', e.target.value)}
            required
            disabled={(formData.delivery_type ?? 'manual') === 'auto_stock'}
          />
          {(formData.delivery_type ?? 'manual') === 'auto_stock' && (
            <p className="text-xs text-muted-foreground">
              Otomatik stokta miktar satır sayısından hesaplanır
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="sales_count">Satış Sayısı</Label>
          <Input
            id="sales_count"
            inputMode="numeric"
            value={numericValue(formData.sales_count)}
            onChange={(e) => handleNumericChange('sales_count', e.target.value)}
            placeholder="Örn: 150"
          />

          <p className="text-xs text-muted-foreground">
            Ürün kartında “x Satış” olarak gösterilir. (Elle girilir)
          </p>
        </div>
      </div>
      {/* ✅ Cover (tekli) */}
      <CoverImageSection
        title="Ürün Görseli"
        coverId={
          typeof formData.featured_image_asset_id === 'string'
            ? formData.featured_image_asset_id
            : undefined
        }
        stagedCoverId={
          typeof formData.featured_image_asset_id === 'string'
            ? formData.featured_image_asset_id
            : undefined
        }
        imageUrl={rawImageUrl}
        previewUrl={previewUrl}
        showUrlPreview={true}
        showStoragePreview={false}
        alt={String(formData.featured_image_alt ?? '')}
        saving={!!uploading}
        trigger="button"
        inputId="product-cover"
        onPickFile={async (file) => {
          if (!file.type.startsWith('image/')) return;
          if (file.size > 5 * 1024 * 1024) return;

          await onUploadFeatured(file);
          setPreviewNonce(Date.now());
        }}
        onRemove={() => {
          setField('featured_image', null as ProductAdmin['featured_image']);
          setField('featured_image_asset_id', null as ProductAdmin['featured_image_asset_id']);
          setField('image_url', null as ProductAdmin['image_url']);
          setPreviewNonce(Date.now());
        }}
        onUrlChange={(url) => {
          const t = url.trim();
          const val = t ? t : null;
          setField('image_url', val as ProductAdmin['image_url']);
          setField('featured_image', val as ProductAdmin['featured_image']);
          setPreviewNonce(Date.now());
        }}
        onAltChange={(alt) =>
          setField('featured_image_alt', alt as ProductAdmin['featured_image_alt'])
        }
      />
      {/* ✅ Gallery (çoklu) */}
      <MultiImageSection
        title="Ürün Galerisi (çoklu görsel)"
        urls={galleryUrls}
        assetIds={galleryAssetIds}
        saving={!!uploading}
        showStoragePreview={true}
        inputId="product-gallery"
        onUpload={onUploadGallery}
        onChange={({ urls, assetIds }) => {
          setField('gallery_urls', (urls.length ? urls : null) as ProductAdmin['gallery_urls']);
          setField(
            'gallery_asset_ids',
            (assetIds && assetIds.some(Boolean)
              ? assetIds
              : null) as unknown as ProductAdmin['gallery_asset_ids'],
          );
        }}
      />
      <div className="space-y-2">
        <Label>Detaylı Açıklama</Label>
        <ReactQuill
          theme="snow"
          value={(formData.description as string) ?? ''}
          onChange={(value) => setField('description', value as ProductAdmin['description'])}
          className="bg-background"
          modules={quillModules as never}
          formats={quillFormats as never}
        />
      </div>
      <div className="flex items-center gap-6 flex-wrap">
        <div className="flex items-center gap-2">
          <Switch
            id="is_active"
            checked={!!formData.is_active}
            onCheckedChange={(v) => setField('is_active', (v ? 1 : 0) as ProductAdmin['is_active'])}
          />
          <Label htmlFor="is_active">Aktif</Label>
        </div>

        <div className="flex items-center gap-2">
          <Switch
            id="show_on_homepage"
            checked={!!formData.show_on_homepage}
            onCheckedChange={(v) =>
              setField('show_on_homepage', (v ? 1 : 0) as ProductAdmin['show_on_homepage'])
            }
          />
          <Label htmlFor="show_on_homepage">Anasayfada Göster</Label>
        </div>

        <div className="flex items-center gap-2">
          <Switch
            id="requires_shipping"
            checked={!!formData.requires_shipping}
            onCheckedChange={(v) =>
              setField('requires_shipping', (v ? 1 : 0) as ProductAdmin['requires_shipping'])
            }
          />
          <Label htmlFor="requires_shipping">Shipping Gerekli</Label>
        </div>
      </div>
    </div>
  );
}
