// =============================================================
// FILE: src/components/admin/products/form/sections/FaqSection.tsx
// FINAL — ProductFaqInput compatible (strict + exactOptionalPropertyTypes safe)
// - Uses ProductFaqInput (from product_faqs.ts)
// - Keeps is_active as boolean in UI (mapper converts to 0/1 for API)
// - Reindexes display_order on add/remove to keep stable ordering
// =============================================================
'use client';

import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

import type { ProductFaqInput } from '@/integrations/types';

type Props = {
  faqs: ProductFaqInput[];
  setFAQs: React.Dispatch<React.SetStateAction<ProductFaqInput[]>>;
};

const reindex = (items: ProductFaqInput[]): ProductFaqInput[] =>
  items.map((f, idx) => ({ ...f, display_order: idx }));

export default function FaqSection({ faqs, setFAQs }: Props) {
  const update = (idx: number, patch: Partial<ProductFaqInput>) => {
    setFAQs((prev) => prev.map((f, i) => (i === idx ? { ...f, ...patch } : f)));
  };

  const remove = (idx: number) => {
    setFAQs((prev) => reindex(prev.filter((_, i) => i !== idx)));
  };

  const add = () => {
    setFAQs((prev) =>
      reindex([
        ...prev,
        {
          question: '',
          answer: '',
          display_order: prev.length,
          is_active: true, // ✅ UI: boolean
        },
      ]),
    );
  };

  return (
    <div>
      <h3 className="font-semibold mb-4">SSS Yönetimi</h3>

      {faqs.map((faq, index) => (
        <div key={faq.id ?? `faq_${index}`} className="p-4 border rounded-lg space-y-3 mb-3">
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
                  const val = Number.parseInt(e.target.value || '0', 10);
                  update(index, { display_order: Number.isFinite(val) ? val : 0 });
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
                checked={faq.is_active === true || faq.is_active === 1}
                onCheckedChange={(v) => update(index, { is_active: v })}
                aria-checked={faq.is_active === true || faq.is_active === 1}
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
