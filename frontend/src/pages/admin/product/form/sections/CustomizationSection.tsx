// =============================================================
// FILE: src/components/admin/products/form/sections/CustomizationSection.tsx
// =============================================================
"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Zap, Shield, Clock, Headphones, Sparkles, Plus } from "lucide-react";
import type { CustomField, Badge } from "@/integrations/metahub/rtk/types/products";

type Props = {
  quantityOptions: { quantity: number; price: number }[];
  setQuantityOptions: (v: { quantity: number; price: number }[]) => void;
  customFields: CustomField[];
  setCustomFields: (v: CustomField[]) => void;
  badges: Badge[];
  setBadges: (v: Badge[]) => void;
};

export default function CustomizationSection({
  quantityOptions,
  setQuantityOptions,
  customFields,
  setCustomFields,
  badges,
  setBadges,
}: Props) {
  return (
    <div className="space-y-6">
      {/* Quantity options */}
      <div>
        <h3 className="font-semibold mb-4">Minimum Sipariş Adet Seçenekleri</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Ürün için belirli adetler ve özel fiyatlar tanımlayın. Müşteriler bu adetlerden seçim yapacaktır.
        </p>
        {quantityOptions.map((option, index) => (
          <div key={index} className="p-3 border rounded-lg mb-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Adet</Label>
                <Input
                  type="number"
                  min="1"
                  value={option.quantity}
                  onChange={(e) => {
                    const next = [...quantityOptions];
                    next[index].quantity = parseInt(e.target.value) || 0;
                    setQuantityOptions(next);
                  }}
                  placeholder="Örn: 10"
                />
              </div>
              <div className="space-y-2">
                <Label>Fiyat</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={option.price}
                  onChange={(e) => {
                    const next = [...quantityOptions];
                    next[index].price = parseFloat(e.target.value) || 0;
                    setQuantityOptions(next);
                  }}
                  placeholder="Örn: 100"
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => setQuantityOptions(quantityOptions.filter((_, i) => i !== index))}
                >
                  Sil
                </Button>
              </div>
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => setQuantityOptions([...quantityOptions, { quantity: 0, price: 0 }])}>
          Yeni Adet Seçeneği Ekle
        </Button>

        {quantityOptions.length > 0 && (
          <div className="text-sm text-muted-foreground mt-4">
            <p className="font-medium">Önizleme:</p>
            {quantityOptions.map((opt, idx) => (
              <p key={idx}>• {opt.quantity} adet - {opt.price.toFixed(2)}</p>
            ))}
          </div>
        )}
      </div>

      {/* Custom fields */}
      <div className="border-t pt-6">
        <h3 className="font-semibold mb-4">Özel Müşteri Bilgi Alanları</h3>
        {customFields.map((field, index) => (
          <div key={field.id} className="p-4 border rounded-lg space-y-3 mb-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Alan Adı</Label>
                <Input
                  value={field.label}
                  onChange={(e) => {
                    const next = [...customFields];
                    next[index].label = e.target.value;
                    setCustomFields(next);
                  }}
                  placeholder="Örn: Mail Adresi"
                />
              </div>
              <div className="space-y-2">
                <Label>Alan Tipi</Label>
                <select
                  className="border rounded px-3 py-2 bg-background"
                  value={field.type}
                  onChange={(e) => {
                    const next = [...customFields];
                    next[index].type = e.target.value as any;
                    setCustomFields(next);
                  }}
                >
                  <option value="text">Metin</option>
                  <option value="email">E-Posta</option>
                  <option value="phone">Telefon</option>
                  <option value="url">Link/URL</option>
                </select>
              </div>
              <div className="flex items-center gap-2 pt-8">
                <Switch
                  checked={field.required}
                  onCheckedChange={(checked) => {
                    const next = [...customFields];
                    next[index].required = checked;
                    setCustomFields(next);
                  }}
                />
                <Label>Zorunlu</Label>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Placeholder</Label>
              <Input
                value={field.placeholder}
                onChange={(e) => {
                  const next = [...customFields];
                  next[index].placeholder = e.target.value;
                  setCustomFields(next);
                }}
              />
            </div>
            <Button type="button" variant="destructive" size="sm" onClick={() => setCustomFields(customFields.filter((_, i) => i !== index))}>
              Sil
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            setCustomFields([
              ...customFields,
              { id: `field_${Date.now()}`, label: "", type: "text", placeholder: "", required: false },
            ])
          }
        >
          Yeni Alan Ekle
        </Button>
      </div>

      {/* Badges */}
      <div className="border-t pt-6">
        <h3 className="font-semibold mb-4">Ürün Badge'leri</h3>
        <p className="text-sm text-muted-foreground mb-4">Ürün detay sayfasında gösterilecek özel badge'ler ekleyin</p>
        {badges.map((badge, index) => {
          const iconOptions: Array<{ name: Badge["icon"]; icon: any }> = [
            { name: "Zap", icon: Zap },
            { name: "Shield", icon: Shield },
            { name: "Clock", icon: Clock },
            { name: "Headphones", icon: Headphones },
            { name: "Sparkles", icon: Sparkles },
          ];
          const SelectedIcon = iconOptions.find((o) => o.name === badge.icon)?.icon || Zap;

          return (
            <div key={index} className="p-4 border rounded-lg space-y-3 mb-3">
              <div className="grid grid-cols-4 gap-3">
                <div className="space-y-2">
                  <Label>Badge Metni</Label>
                  <Input
                    value={badge.text}
                    onChange={(e) => {
                      const next = [...badges];
                      next[index].text = e.target.value;
                      setBadges(next);
                    }}
                    placeholder="Örn: Anında Teslimat"
                  />
                </div>
                <div className="space-y-2">
                  <Label>İkon</Label>
                  <select
                    className="border rounded px-3 py-2 bg-background"
                    value={badge.icon}
                    onChange={(e) => {
                      const next = [...badges];
                      next[index].icon = e.target.value as Badge["icon"];
                      setBadges(next);
                    }}
                  >
                    {iconOptions.map((o) => (
                      <option key={o.name} value={o.name}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Önizleme</Label>
                  <div className="flex items-center gap-2 p-2 border rounded bg-muted/50">
                    <SelectedIcon className="w-4 h-4" />
                    <span className="text-sm">{badge.text || "Badge Metni"}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Durum</Label>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={badge.active}
                      onCheckedChange={(v) => {
                        const next = [...badges];
                        next[index].active = v;
                        setBadges(next);
                      }}
                    />
                    <Label className="text-sm">{badge.active ? "Aktif" : "Pasif"}</Label>
                  </div>
                </div>
              </div>
              <Button type="button" variant="destructive" size="sm" onClick={() => setBadges(badges.filter((_, i) => i !== index))}>
                <Trash2 className="h-4 w-4 mr-2" />
                Sil
              </Button>
            </div>
          );
        })}
        <Button type="button" variant="outline" onClick={() => setBadges([...badges, { text: "", icon: "Zap", active: true }])}>
          <Plus className="h-4 w-4 mr-2" />
          Yeni Badge Ekle
        </Button>
      </div>
    </div>
  );
}
