// =============================================================
// FILE: src/components/admin/products/form/sections/ArticleSection.tsx
// =============================================================
"use client";

import React from "react";
import ReactQuill from "react-quill";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { ProductAdmin } from "@/integrations/metahub/db/types/products";

type Props = {
  formData: Partial<ProductAdmin>;
  setField: <K extends keyof ProductAdmin>(key: K, val: ProductAdmin[K] | any) => void;
  quillModules: any;
};

export default function ArticleSection({ formData, setField, quillModules }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Switch id="article_enabled" checked={!!formData.article_enabled} onCheckedChange={(v) => setField("article_enabled", v ? 1 : 0)} />
        <Label htmlFor="article_enabled">Makale Alanını Aktif Et</Label>
      </div>
      <p className="text-sm text-muted-foreground">Ürün sayfasında scroll edilebilir makale içeriği</p>

      {!!formData.article_enabled && (
        <div className="space-y-2">
          <Label>Makale İçeriği</Label>
          <ReactQuill
            theme="snow"
            value={(formData.article_content as string) ?? ""}
            onChange={(v) => setField("article_content", v)}
            className="bg-background"
            modules={quillModules}
          />
        </div>
      )}
    </div>
  );
}
