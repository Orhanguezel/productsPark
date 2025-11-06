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
import type { FAQInput } from "@/integrations/metahub/db/types/products";

type Props = {
  faqs: FAQInput[];
  setFAQs: React.Dispatch<React.SetStateAction<FAQInput[]>>;
};

export default function FaqSection({ faqs, setFAQs }: Props) {
  const update = (idx: number, patch: Partial<FAQInput>) =>
    setFAQs((prev) => prev.map((f, i) => (i === idx ? { ...f, ...patch } : f)));

  const remove = (idx: number) => setFAQs((prev) => prev.filter((_, i) => i !== idx));

  const add = () =>
    setFAQs((prev) => [
      ...prev,
      { question: "", answer: "", display_order: prev.length, is_active: 1 },
    ]);

  return (
    <div>
      <h3 className="font-semibold mb-4">SSS Yönetimi</h3>

      {faqs.map((faq, index) => (
        <div key={index} className="p-4 border rounded-lg space-y-3 mb-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor={`faq_q_${index}`}>Soru</Label>
              <Input
                id={`faq_q_${index}`}
                value={faq.question}
                onChange={(e) => update(index, { question: e.target.value })}
                placeholder="Soru"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`faq_order_${index}`}>Sıralama</Label>
              <Input
                id={`faq_order_${index}`}
                type="number"
                value={faq.display_order}
                onChange={(e) => {
                  const val = Number.parseInt(e.target.value || "0", 10) || 0;
                  update(index, { display_order: val });
                }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`faq_a_${index}`}>Cevap</Label>
            <Textarea
              id={`faq_a_${index}`}
              value={faq.answer}
              onChange={(e) => update(index, { answer: e.target.value })}
              rows={3}
              placeholder="Cevap metni..."
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch
                id={`faq_active_${index}`}
                checked={!!faq.is_active}
                onCheckedChange={(v) => update(index, { is_active: v ? 1 : 0 })}
                aria-checked={!!faq.is_active}
              />
              <Label htmlFor={`faq_active_${index}`}>Aktif</Label>
            </div>
            <Button type="button" variant="destructive" size="sm" onClick={() => remove(index)}>
              Sil
            </Button>
          </div>
        </div>
      ))}

      <Button type="button" variant="outline" onClick={add}>
        Yeni SSS Ekle
      </Button>
    </div>
  );
}
