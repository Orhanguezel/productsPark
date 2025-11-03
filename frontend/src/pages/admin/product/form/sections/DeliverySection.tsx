// =============================================================
// FILE: src/components/admin/products/form/sections/DeliverySection.tsx
// =============================================================
"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import UsedStockList from "./UsedStockList";
import type { ProductAdmin } from "@/integrations/metahub/db/types/products";

// ProductForm ile aynı tip:
export type ApiProvider = { id: string; name: string };

type Props = {
  formData: Partial<ProductAdmin>;
  setField: <K extends keyof ProductAdmin>(key: K, val: ProductAdmin[K] | any) => void;
  stockList: string;
  setStockList: (v: string) => void;
  idParam?: string;
  usedStock: any[];
  apiProviders: ApiProvider[]; // ← kesin tip
  onUploadFile: (file: File) => Promise<void>;
  uploading?: boolean;
};

export default function DeliverySection({
  formData,
  setField,
  stockList,
  setStockList,
  idParam,
  usedStock,
  apiProviders,
  onUploadFile,
  uploading,
}: Props) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Teslimat Tipi *</Label>
        <Select value={(formData.delivery_type as string) ?? "manual"} onValueChange={(v) => setField("delivery_type", v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="manual">Manuel Teslimat</SelectItem>
            <SelectItem value="auto_stock">Otomatik (Stok Listesi)</SelectItem>
            <SelectItem value="file">Dosya İndirme</SelectItem>
            <SelectItem value="api">API Entegrasyonu</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {formData.delivery_type === "manual" && "Admin manuel olarak teslim eder"}
          {formData.delivery_type === "auto_stock" && "Stoktan otomatik teslim edilir"}
          {formData.delivery_type === "file" && "Müşteri dosya indirebilir"}
          {formData.delivery_type === "api" && "API üzerinden otomatik teslim edilir"}
        </p>
      </div>

      {formData.delivery_type === "auto_stock" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Stok Listesi (Her satıra bir adet)</Label>
            <Textarea
              value={stockList}
              onChange={(e) => setStockList(e.target.value)}
              placeholder={"account1:password1\naccount2:password2\nXXXXX-XXXXX-XXXXX"}
              rows={8}
            />
            <p className="text-xs text-muted-foreground">
              {(stockList.match(/\n/g)?.length ?? 0) + (stockList ? 1 : 0)} adet stok girildi
            </p>
          </div>

          {!!idParam && usedStock.length > 0 && <UsedStockList list={usedStock as any[]} />}
        </div>
      )}

      {formData.delivery_type === "file" && (
        <div className="space-y-2">
          <Label>Ürün Dosyası (ZIP, RAR vb.)</Label>
          <Input
            type="file"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.currentTarget.value = ""; // aynı dosyayı tekrar seçebilelim
              if (file) await onUploadFile(file);
            }}
            disabled={uploading}
          />
          {formData.file_url && <p className="text-sm text-green-600">✓ Dosya yüklendi</p>}
        </div>
      )}

      {formData.delivery_type === "api" && (
        <>
          <div className="space-y-2">
            <Label>API Sağlayıcı *</Label>
            <Select value={(formData.api_provider_id as string) ?? ""} onValueChange={(v) => setField("api_provider_id", v)}>
              <SelectTrigger>
                <SelectValue placeholder="API sağlayıcı seçin" />
              </SelectTrigger>
              <SelectContent>
                {apiProviders.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">SMM panel sağlayıcınızı seçin</p>
          </div>
          <div className="space-y-2">
            <Label>API Ürün ID (Service ID) *</Label>
            <Input
              value={(formData.api_product_id as string) ?? ""}
              onChange={(e) => setField("api_product_id", e.target.value)}
              placeholder="Örn: 1234"
            />
            <p className="text-xs text-muted-foreground">API'deki service ID numarası</p>
          </div>
          <div className="space-y-2">
            <Label>API'ye Gönderilecek Adet *</Label>
            <Input
              inputMode="numeric"
              value={String(formData.api_quantity ?? 1)}
              onChange={(e) => setField("api_quantity", Number(e.target.value || 1))}
              placeholder="Örn: 100"
            />
            <p className="text-xs text-muted-foreground">Her sipariş için API'ye gönderilecek sabit miktar</p>
          </div>
        </>
      )}
    </div>
  );
}
