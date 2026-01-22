// =============================================================
// FILE: src/components/admin/products/form/sections/CustomizationSection.tsx
// FINAL — Custom fields select fix (shadcn Select) + stable defaults
// - Uses QuantityOption from integrations/types
// =============================================================
'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { Trash2, Zap, Shield, Clock, Headphones, Sparkles, Plus } from 'lucide-react';

import type { CustomField, Badge, QuantityOption } from '@/integrations/types';

type Props = {
  quantityOptions: QuantityOption[];
  setQuantityOptions: (v: QuantityOption[]) => void;

  customFields: CustomField[];
  setCustomFields: (v: CustomField[]) => void;

  badges: Badge[];
  setBadges: (v: Badge[]) => void;
};

const ICONS = { Zap, Shield, Clock, Headphones, Sparkles } as const;
type BadgeIconName = keyof typeof ICONS;

const BADGE_ICON_OPTIONS: ReadonlyArray<BadgeIconName> = [
  'Zap',
  'Shield',
  'Clock',
  'Headphones',
  'Sparkles',
] as const;
const DEFAULT_BADGE_ICON: BadgeIconName = 'Zap';

const CUSTOM_FIELD_TYPES: Array<{ value: CustomField['type']; label: string }> = [
  { value: 'text', label: 'Metin' },
  { value: 'email', label: 'E-Posta' },
  { value: 'phone', label: 'Telefon' },
  { value: 'url', label: 'Link/URL' },
  { value: 'textarea', label: 'Textarea' },
];

const isCustomFieldType = (v: unknown): v is CustomField['type'] =>
  typeof v === 'string' && CUSTOM_FIELD_TYPES.some((t) => t.value === v);

const toInt = (v: string): number => {
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : 0;
};

const toFloat = (v: string): number => {
  const n = Number.parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};

const isBadgeIconName = (v: unknown): v is BadgeIconName =>
  typeof v === 'string' && BADGE_ICON_OPTIONS.includes(v as BadgeIconName);

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
          Ürün için belirli adetler ve özel fiyatlar tanımlayın. Müşteriler bu adetlerden seçim
          yapacaktır.
        </p>

        {quantityOptions.map((option, index) => (
          <div key={index} className="p-3 border rounded-lg mb-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Adet</Label>
                <Input
                  type="number"
                  min={1}
                  value={option.quantity}
                  onChange={(e) => {
                    const quantity = toInt(e.target.value);
                    setQuantityOptions(
                      quantityOptions.map((it, i) => (i === index ? { ...it, quantity } : it)),
                    );
                  }}
                  placeholder="Örn: 10"
                />
              </div>

              <div className="space-y-2">
                <Label>Fiyat</Label>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  value={option.price}
                  onChange={(e) => {
                    const price = toFloat(e.target.value);
                    setQuantityOptions(
                      quantityOptions.map((it, i) => (i === index ? { ...it, price } : it)),
                    );
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

        <Button
          type="button"
          variant="outline"
          onClick={() => setQuantityOptions([...quantityOptions, { quantity: 0, price: 0 }])}
        >
          Yeni Adet Seçeneği Ekle
        </Button>
      </div>

      {/* Custom fields */}
      <div className="border-t pt-6">
        <h3 className="font-semibold mb-4">Özel Müşteri Bilgi Alanları</h3>

        {customFields.map((field, index) => {
          const typeValue: CustomField['type'] = isCustomFieldType(field.type)
            ? field.type
            : 'text';

          return (
            <div key={String(field.id ?? index)} className="p-4 border rounded-lg space-y-3 mb-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>Alan Adı</Label>
                  <Input
                    value={field.label}
                    onChange={(e) => {
                      const label = e.target.value;
                      setCustomFields(
                        customFields.map((it, i) => (i === index ? { ...it, label } : it)),
                      );
                    }}
                    placeholder="Örn: Mail Adresi"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Alan Tipi</Label>
                  <Select
                    value={typeValue}
                    onValueChange={(v) => {
                      const nextType: CustomField['type'] = isCustomFieldType(v) ? v : 'text';
                      setCustomFields(
                        customFields.map((it, i) => (i === index ? { ...it, type: nextType } : it)),
                      );
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seçiniz" />
                    </SelectTrigger>
                    <SelectContent>
                      {CUSTOM_FIELD_TYPES.map((t) => (
                        <SelectItem key={String(t.value)} value={String(t.value)}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2 pt-8">
                  <Switch
                    checked={!!field.required}
                    onCheckedChange={(required) => {
                      setCustomFields(
                        customFields.map((it, i) => (i === index ? { ...it, required } : it)),
                      );
                    }}
                  />
                  <Label>Zorunlu</Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Placeholder</Label>
                <Input
                  value={field.placeholder ?? ''}
                  onChange={(e) => {
                    const placeholder = e.target.value;
                    setCustomFields(
                      customFields.map((it, i) =>
                        i === index
                          ? { ...it, placeholder: placeholder.trim() ? placeholder : null }
                          : it,
                      ),
                    );
                  }}
                />
              </div>

              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => setCustomFields(customFields.filter((_, i) => i !== index))}
              >
                Sil
              </Button>
            </div>
          );
        })}

        <Button
          type="button"
          variant="outline"
          onClick={() =>
            setCustomFields([
              ...customFields,
              {
                id: `field_${Date.now()}`,
                label: '',
                type: 'text',
                placeholder: null,
                required: false,
              },
            ])
          }
        >
          Yeni Alan Ekle
        </Button>
      </div>

      {/* Badges */}
      <div className="border-t pt-6">
        <h3 className="font-semibold mb-4">Ürün Badge&apos;leri</h3>

        {badges.map((badge, index) => {
          const iconValue: BadgeIconName = isBadgeIconName(badge.icon)
            ? badge.icon
            : DEFAULT_BADGE_ICON;
          const SelectedIcon = ICONS[iconValue] ?? Zap;

          return (
            <div key={index} className="p-4 border rounded-lg space-y-3 mb-3">
              <div className="grid grid-cols-4 gap-3">
                <div className="space-y-2">
                  <Label>Badge Metni</Label>
                  <Input
                    value={badge.text}
                    onChange={(e) => {
                      const text = e.target.value;
                      setBadges(badges.map((it, i) => (i === index ? { ...it, text } : it)));
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label>İkon</Label>
                  <Select
                    value={iconValue}
                    onValueChange={(v) => {
                      const icon: string | null = isBadgeIconName(v) ? v : DEFAULT_BADGE_ICON;
                      setBadges(badges.map((it, i) => (i === index ? { ...it, icon } : it)));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BADGE_ICON_OPTIONS.map((name) => (
                        <SelectItem key={name} value={name}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Önizleme</Label>
                  <div className="flex items-center gap-2 p-2 border rounded bg-muted/50">
                    <SelectedIcon className="w-4 h-4" />
                    <span className="text-sm">{badge.text || 'Badge Metni'}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Durum</Label>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={!!badge.active}
                      onCheckedChange={(active) => {
                        setBadges(badges.map((it, i) => (i === index ? { ...it, active } : it)));
                      }}
                    />
                    <Label className="text-sm">{badge.active ? 'Aktif' : 'Pasif'}</Label>
                  </div>
                </div>
              </div>

              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => setBadges(badges.filter((_, i) => i !== index))}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Sil
              </Button>
            </div>
          );
        })}

        <Button
          type="button"
          variant="outline"
          onClick={() =>
            setBadges([...badges, { text: '', icon: DEFAULT_BADGE_ICON, active: true }])
          }
        >
          <Plus className="h-4 w-4 mr-2" />
          Yeni Badge Ekle
        </Button>
      </div>
    </div>
  );
}
