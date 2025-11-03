// =============================================================
// FILE: src/components/admin/products/form/sections/FaqSection.tsx
// =============================================================
"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { FAQInput } from "../types";

type Props = {
  faqs: FAQInput[];
  setFAQs: React.Dispatch<React.SetStateAction<FAQInput[]>>;
};

export default function FaqSection({ faqs, setFAQs }: Props) {
  return (
    <div>
      <h3 className="font-semibold mb-4">SSS Yönetimi</h3>
      {faqs.map((faq, index) => (
        <div key={index} className="p-4 border rounded-lg space-y-3 mb-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Soru</Label>
              <Input
                value={faq.question}
                onChange={(e) => {
                  setFAQs((prev) => {
                    const next = [...prev];
                    next[index] = { ...next[index], question: e.target.value };
                    return next;
                  });
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Sıralama</Label>
              <Input
                type="number"
                value={faq.display_order}
                onChange={(e) => {
                  const val = Number.parseInt(e.target.value || "0", 10) || 0;
                  setFAQs((prev) => {
                    const next = [...prev];
                    next[index] = { ...next[index], display_order: val };
                    return next;
                  });
                }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Cevap</Label>
            <Textarea
              value={faq.answer}
              onChange={(e) => {
                setFAQs((prev) => {
                  const next = [...prev];
                  next[index] = { ...next[index], answer: e.target.value };
                  return next;
                });
              }}
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch
                checked={!!faq.is_active}
                onCheckedChange={(v) => {
                  setFAQs((prev) => {
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
                setFAQs((prev) => prev.filter((_, i) => i !== index))
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
          setFAQs((prev) => [
            ...prev,
            { question: "", answer: "", display_order: prev.length, is_active: 1 },
          ])
        }
      >
        Yeni SSS Ekle
      </Button>
    </div>
  );
}
