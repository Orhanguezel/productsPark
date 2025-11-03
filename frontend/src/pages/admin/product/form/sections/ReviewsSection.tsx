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
import type { ReviewInput } from "../types";

type Props = {
  reviews: ReviewInput[];
  setReviews: React.Dispatch<React.SetStateAction<ReviewInput[]>>;
};

export default function ReviewsSection({ reviews, setReviews }: Props) {
  return (
    <div>
      <h3 className="font-semibold mb-4">Yorum Yönetimi</h3>
      {reviews.map((review, index) => (
        <div key={index} className="p-4 border rounded-lg space-y-3 mb-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Müşteri Adı</Label>
              <Input
                value={review.customer_name}
                onChange={(e) => {
                  setReviews((prev) => {
                    const next = [...prev];
                    next[index] = { ...next[index], customer_name: e.target.value };
                    return next;
                  });
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Puan (1-5)</Label>
              <Input
                type="number"
                min="1"
                max="5"
                value={review.rating}
                onChange={(e) => {
                  const val = Number.parseInt(e.target.value || "5", 10) || 5;
                  setReviews((prev) => {
                    const next = [...prev];
                    next[index] = { ...next[index], rating: val };
                    return next;
                  });
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Tarih</Label>
              <Input
                type="date"
                value={review.review_date}
                onChange={(e) => {
                  setReviews((prev) => {
                    const next = [...prev];
                    next[index] = { ...next[index], review_date: e.target.value };
                    return next;
                  });
                }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Yorum</Label>
            <Textarea
              value={review.comment}
              onChange={(e) => {
                setReviews((prev) => {
                  const next = [...prev];
                  next[index] = { ...next[index], comment: e.target.value };
                  return next;
                });
              }}
              rows={2}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch
                checked={!!review.is_active}
                onCheckedChange={(v) => {
                  setReviews((prev) => {
                    const next = [...prev];
                    next[index] = { ...next[index], is_active: v ? 1 : 0 };
                    return next;
                  });
                }}
              />
              <Label>Aktif</Label>
            </div>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() =>
                setReviews((prev) => prev.filter((_, i) => i !== index))
              }
            >
              Sil
            </Button>
          </div>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={() =>
          setReviews((prev) => [
            ...prev,
            {
              customer_name: "",
              rating: 5,
              comment: "",
              review_date: new Date().toISOString().split("T")[0],
              is_active: 1,
            },
          ])
        }
      >
        Yeni Yorum Ekle
      </Button>
    </div>
  );
}
