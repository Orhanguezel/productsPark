// =============================================================
// FILE: src/components/admin/products/form/sections/BasicInfo.tsx
// =============================================================
"use client";

import React, { useRef } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import type { ProductAdmin } from "@/integrations/metahub/db/types/products";
import { toNumber } from "../constants";

type Props = {
  formData: Partial<ProductAdmin>;
  setField: <K extends keyof ProductAdmin>(key: K, val: ProductAdmin[K] | any) => void;
  quantityOptions: { quantity: number; price: number }[];
  onUploadFeatured: (file: File) => Promise<void>;
  uploading?: boolean;
  /** Quill modülleri (paste/drop img bloklu handler) */
  quillModules: any;
  /** Quill format whitelist (bold/italic/list/link vs.) */
  quillFormats?: readonly string[];
};

export default function BasicInfo({
  formData,
  setField,
  quantityOptions,
  onUploadFeatured,
  uploading,
  quillModules,
  quillFormats,
}: Props) {
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const pickFeatured = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0] || null;
    e.currentTarget.value = ""; // aynı dosyayı tekrar seçebilmek için
    if (!file) return;

    if (!file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) return; // 5MB

    await onUploadFeatured(file);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Ürün Adı *</Label>
          <Input
            id="name"
            value={formData.name ?? ""}
            onChange={(e) => {
              const newName = e.target.value;
              const newSlug = newName
                .toLowerCase()
                .replace(/ğ/g, "g")
                .replace(/ü/g, "u")
                .replace(/ş/g, "s")
                .replace(/ı/g, "i")
                .replace(/ö/g, "o")
                .replace(/ç/g, "c")
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-+|-+$/g, "");
              setField("name", newName);
              setField("slug", newSlug);
            }}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="slug">Slug (URL) *</Label>
          <Input id="slug" value={formData.slug ?? ""} onChange={(e) => setField("slug", e.target.value)} required />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">Fiyat *</Label>
          <Input
            id="price"
            inputMode="decimal"
            value={String(formData.price ?? 0)}
            onChange={(e) => setField("price", toNumber(e.target.value))}
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
            value={formData.original_price ?? ""}
            onChange={(e) => setField("original_price", e.target.value === "" ? null : toNumber(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="stock_quantity">Stok *</Label>
          <Input
            id="stock_quantity"
            inputMode="numeric"
            value={String(formData.stock_quantity ?? 0)}
            onChange={(e) => setField("stock_quantity", Number(e.target.value || 0))}
            required
            disabled={(formData.delivery_type ?? "manual") === "auto_stock"}
          />
          {(formData.delivery_type ?? "manual") === "auto_stock" && (
            <p className="text-xs text-muted-foreground">Otomatik stokta miktar satır sayısından hesaplanır</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="review_count">Satış Sayısı</Label>
          <Input
            id="review_count"
            inputMode="numeric"
            value={String(formData.review_count ?? 0)}
            onChange={(e) => setField("review_count", Number(e.target.value || 0))}
            placeholder="Örn: 150"
          />
        </div>
      </div>

      {/* Featured image upload */}
      <div className="space-y-2">
        <Label htmlFor="image_upload">Ürün Görseli</Label>
        <p className="text-xs text-muted-foreground mb-2">Önerilen boyut: 800x600 (4:3)</p>

        <input
          ref={imageInputRef}
          id="image_upload"
          type="file"
          accept="image/*"
          onChange={pickFeatured}
          disabled={uploading}
          className="hidden"
        />

        <div className="flex items-center gap-3">
          <Input
            type="button"
            value={uploading ? "Yükleniyor..." : "Görsel Seç/Yükle"}
            onClick={() => imageInputRef.current?.click()}
            disabled={uploading}
            className="cursor-pointer"
          />
          {(formData.featured_image || formData.image_url) && (
            <img
              src={(formData.featured_image as string) ?? (formData.image_url as string)}
              alt={String(formData.featured_image_alt ?? "Önizleme")}
              className="w-16 h-16 object-cover rounded border"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "https://placehold.co/128x128?text=Image";
              }}
            />
          )}
        </div>

        <Input
          placeholder="Alt metin"
          value={formData.featured_image_alt ?? ""}
          onChange={(e) => setField("featured_image_alt", e.target.value)}
        />
      </div>

      {/* Short/Long description */}
      <div className="space-y-2">
        <Label htmlFor="short_description">Kısa Açıklama</Label>
        <Textarea
          id="short_description"
          value={(formData.short_description as string) ?? ""}
          onChange={(e) => setField("short_description", e.target.value)}
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label>Detaylı Açıklama</Label>
        <ReactQuill
          theme="snow"
          value={(formData.description as string) ?? ""}
          onChange={(value) => setField("description", value)}
          className="bg-background"
          modules={quillModules}
          formats={quillFormats as any}
        />
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Switch id="is_active" checked={!!formData.is_active} onCheckedChange={(v) => setField("is_active", v ? 1 : 0)} />
          <Label htmlFor="is_active">Aktif</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="show_on_homepage"
            checked={!!(formData as any).show_on_homepage}
            onCheckedChange={(v) => setField("show_on_homepage", v ? 1 : 0)}
          />
          <Label htmlFor="show_on_homepage">Anasayfada Göster</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch id="is_featured" checked={!!formData.is_featured} onCheckedChange={(v) => setField("is_featured", v ? 1 : 0)} />
          <Label htmlFor="is_featured">Featured</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="requires_shipping"
            checked={!!formData.requires_shipping}
            onCheckedChange={(v) => setField("requires_shipping", v ? 1 : 0)}
          />
          <Label htmlFor="requires_shipping">Shipping Gerekli</Label>
        </div>
      </div>
    </div>
  );
}
