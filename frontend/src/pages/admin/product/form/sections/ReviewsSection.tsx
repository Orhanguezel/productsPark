// =============================================================
// FILE: src/components/admin/products/form/sections/ReviewsSection.tsx
// FINAL — strict TS safe + exactOptionalPropertyTypes friendly
// - Immutable updates (no mutation)
// - Keeps is_active as boolean in UI; tolerant for 0/1 coming from backend
// - Safe rating clamp + safe date fallback
// =============================================================
'use client';

import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

import type { ProductReviewInput } from '@/integrations/types';

type Props = {
  reviews: ProductReviewInput[];
  setReviews: React.Dispatch<React.SetStateAction<ProductReviewInput[]>>;
};

const clampInt = (n: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, Math.trunc(n)));

const todayISO = (): string => {
  // YYYY-MM-DD
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const toActiveBool = (v: unknown): boolean => v === true || v === 1 || v === '1' || v === 'true';

export default function ReviewsSection({ reviews, setReviews }: Props) {
  const update = (idx: number, patch: Partial<ProductReviewInput>) => {
    setReviews((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  const remove = (idx: number) => {
    setReviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const add = () => {
    const d = todayISO();

    // ReviewInput tipin ne olursa olsun, burada minimum alanları set ediyoruz.
    // id/display_order gibi alanlar varsa zaten opsiyonel olmalı; yoksa TS yakalar.
    setReviews((prev) => [
      ...prev,
      {
        customer_name: '',
        rating: 5,
        comment: '',
        review_date: d,
        is_active: true, // ✅ UI: boolean (mapper/BE 0/1 istiyorsa submitte dönüştürülür)
      } as ProductReviewInput,
    ]);
  };

  return (
    <div>
      <h3 className="font-semibold mb-4">Yorum Yönetimi</h3>

      {reviews.length === 0 && (
        <p className="text-sm text-muted-foreground mb-4">
          Henüz yorum yok. “Yeni Yorum Ekle” ile başlayın.
        </p>
      )}

      {reviews.map((review, index) => {
        const dateValue =
          typeof review.review_date === 'string' && review.review_date.trim()
            ? review.review_date
            : todayISO();

        const activeChecked = toActiveBool(
          (review as unknown as { is_active?: unknown }).is_active,
        );

        return (
          <div
            key={(review as any).id ?? `rev_${index}`}
            className="p-4 border rounded-lg space-y-3 mb-3"
          >
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor={`rev_name_${index}`}>Müşteri Adı</Label>
                <Input
                  id={`rev_name_${index}`}
                  value={review.customer_name}
                  onChange={(e) => update(index, { customer_name: e.target.value })}
                  placeholder="Ad Soyad"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`rev_rating_${index}`}>Puan (1-5)</Label>
                <Input
                  id={`rev_rating_${index}`}
                  type="number"
                  min={1}
                  max={5}
                  step={1}
                  value={review.rating}
                  onChange={(e) => {
                    const raw = Number.parseInt(e.target.value || '5', 10);
                    const next = clampInt(Number.isFinite(raw) ? raw : 5, 1, 5);
                    update(index, { rating: next });
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`rev_date_${index}`}>Tarih</Label>
                <Input
                  id={`rev_date_${index}`}
                  type="date"
                  value={dateValue}
                  onChange={(e) => update(index, { review_date: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`rev_comment_${index}`}>Yorum</Label>
              <Textarea
                id={`rev_comment_${index}`}
                value={review.comment}
                onChange={(e) => update(index, { comment: e.target.value })}
                rows={2}
                placeholder="Yorum metni..."
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  id={`rev_active_${index}`}
                  checked={activeChecked}
                  onCheckedChange={(v) => update(index, { is_active: v } as Partial<ProductReviewInput>)}
                  aria-checked={activeChecked}
                />
                <Label htmlFor={`rev_active_${index}`}>Aktif</Label>
              </div>

              <Button type="button" variant="destructive" size="sm" onClick={() => remove(index)}>
                Sil
              </Button>
            </div>
          </div>
        );
      })}

      <Button type="button" variant="outline" onClick={add}>
        Yeni Yorum Ekle
      </Button>
    </div>
  );
}
