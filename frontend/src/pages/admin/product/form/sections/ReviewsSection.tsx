// =============================================================
// FILE: src/components/admin/products/form/sections/ReviewsSection.tsx
// =============================================================
"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { ReviewInput } from "@/integrations/metahub/db/types/products";

type Props = {
  reviews: ReviewInput[];
  setReviews: React.Dispatch<React.SetStateAction<ReviewInput[]>>;
};

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const today = () => new Date().toISOString().split("T")[0];

export default function ReviewsSection({ reviews, setReviews }: Props) {
  const update = (idx: number, patch: Partial<ReviewInput>) =>
    setReviews((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));

  const remove = (idx: number) => setReviews((prev) => prev.filter((_, i) => i !== idx));

  const add = () =>
    setReviews((prev) => [
      ...prev,
      { customer_name: "", rating: 5, comment: "", review_date: today(), is_active: 1 },
    ]);

  return (
    <div>
      <h3 className="font-semibold mb-4">Yorum Yönetimi</h3>

      {reviews.length === 0 && (
        <p className="text-sm text-muted-foreground mb-4">
          Henüz yorum yok. “Yeni Yorum Ekle” ile başlayın.
        </p>
      )}

      {reviews.map((review, index) => (
        <div key={review.id ?? index} className="p-4 border rounded-lg space-y-3 mb-3">
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
                  const next = clamp(Number.parseInt(e.target.value || "5", 10) || 5, 1, 5);
                  update(index, { rating: next });
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`rev_date_${index}`}>Tarih</Label>
              <Input
                id={`rev_date_${index}`}
                type="date"
                value={review.review_date || today()}
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
                checked={!!review.is_active}
                onCheckedChange={(v) => update(index, { is_active: v ? 1 : 0 })}
                aria-checked={!!review.is_active}
              />
              <Label htmlFor={`rev_active_${index}`}>Aktif</Label>
            </div>

            <Button type="button" variant="destructive" size="sm" onClick={() => remove(index)}>
              Sil
            </Button>
          </div>
        </div>
      ))}

      <Button type="button" variant="outline" onClick={add}>
        Yeni Yorum Ekle
      </Button>
    </div>
  );
}
