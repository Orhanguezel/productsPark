// =============================================================
// FILE: src/components/admin/products/form/sections/DeliverySection.tsx
// FINAL — DeliverySection
// - FIX: UsedStockItem import is from product_stock module (avoids barrel conflicts)
// - FIX: UsedStockList list prop now matches UsedStockItem[]
// =============================================================

'use client';

import * as React from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

import UsedStockList from './UsedStockList';

import type { ProductAdmin, UsedStockItem} from '@/integrations/types';

export type ApiProvider = { id: string; name: string };

type Props = {
  formData: Partial<ProductAdmin>;
  setField: <K extends keyof ProductAdmin>(key: K, val: ProductAdmin[K]) => void;

  stockList: string;
  setStockList: (v: string) => void;

  idParam?: string;
  usedStock: UsedStockItem[];

  apiProviders: ApiProvider[];
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
  const deliveryType = (formData.delivery_type as string) ?? 'manual';

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Teslimat Tipi *</Label>
        <Select value={deliveryType} onValueChange={(v) => setField('delivery_type', v as any)}>
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
          {deliveryType === 'manual' && 'Admin manuel olarak teslim eder'}
          {deliveryType === 'auto_stock' && 'Stoktan otomatik teslim edilir'}
          {deliveryType === 'file' && 'Müşteri dosya indirebilir'}
          {deliveryType === 'api' && 'API üzerinden otomatik teslim edilir'}
        </p>
      </div>

      {deliveryType === 'auto_stock' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Stok Listesi (Her satıra bir adet)</Label>
            <Textarea
              value={stockList}
              onChange={(e) => setStockList(e.target.value)}
              placeholder={'account1:password1\naccount2:password2\nXXXXX-XXXXX-XXXXX'}
              rows={8}
            />
            <p className="text-xs text-muted-foreground">
              {(stockList.match(/\n/g)?.length ?? 0) + (stockList ? 1 : 0)} adet stok girildi
            </p>
          </div>

          {!!idParam && usedStock.length > 0 && <UsedStockList list={usedStock} />}
        </div>
      )}

      {deliveryType === 'file' && (
        <div className="space-y-2">
          <Label>Ürün Dosyası (ZIP, RAR vb.)</Label>
          <Input
            type="file"
            onChange={async (e) => {
              const file = e.target.files?.[0] || null;
              e.currentTarget.value = '';
              if (file) await onUploadFile(file);
            }}
            disabled={uploading}
          />
          {formData.file_url && <p className="text-sm text-green-600">✓ Dosya yüklendi</p>}
        </div>
      )}

      {deliveryType === 'api' && (
        <>
          <div className="space-y-2">
            <Label>API Sağlayıcı *</Label>
            <Select
              value={(formData.api_provider_id as string) ?? ''}
              onValueChange={(v) => setField('api_provider_id', v as any)}
            >
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
              value={(formData.api_product_id as string) ?? ''}
              onChange={(e) => setField('api_product_id', e.target.value as any)}
              placeholder="Örn: 1234"
            />
            <p className="text-xs text-muted-foreground">API'deki service ID numarası</p>
          </div>

          <div className="space-y-2">
            <Label>API'ye Gönderilecek Adet *</Label>
            <Input
              inputMode="numeric"
              value={String(formData.api_quantity ?? 1)}
              onChange={(e) => setField('api_quantity', Number(e.target.value || 1) as any)}
              placeholder="Örn: 100"
            />
            <p className="text-xs text-muted-foreground">
              Her sipariş için API'ye gönderilecek sabit miktar
            </p>
          </div>
        </>
      )}
    </div>
  );
}
