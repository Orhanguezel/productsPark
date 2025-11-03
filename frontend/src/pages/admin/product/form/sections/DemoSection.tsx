// =============================================================
// FILE: src/components/admin/products/form/sections/DemoSection.tsx
// =============================================================
"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import type { ProductAdmin } from "@/integrations/metahub/db/types/products";

type Props = {
  formData: Partial<ProductAdmin>;
  setField: <K extends keyof ProductAdmin>(key: K, val: ProductAdmin[K] | any) => void;
};

export default function DemoSection({ formData, setField }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Demo & Önizleme Ayarları</h3>
          <p className="text-sm text-muted-foreground">Ürününüz için canlı demo gösterimini yapılandırın.</p>
        </div>
        <Switch
          id="demo_active"
          checked={!!formData.demo_url}
          onCheckedChange={(checked) => {
            setField("demo_url", checked ? (formData.demo_url ?? "") : "");
            setField("demo_embed_enabled", checked ? formData.demo_embed_enabled : 0);
            setField("demo_button_text", checked ? (formData.demo_button_text ?? "Demoyu İncele") : "Demoyu İncele");
          }}
        />
      </div>

      {!!formData.demo_url || formData.demo_embed_enabled ? (
        <>
          <div className="space-y-2">
            <Label htmlFor="demo_url">Demo URL</Label>
            <Input
              id="demo_url"
              type="url"
              placeholder="https://demo.example.com"
              value={(formData.demo_url as string) ?? ""}
              onChange={(e) => setField("demo_url", e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="demo_embed_enabled"
              checked={!!formData.demo_embed_enabled}
              onCheckedChange={(v) => setField("demo_embed_enabled", v ? 1 : 0)}
            />
            <Label htmlFor="demo_embed_enabled">Sayfada iframe ile göster</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="demo_button_text">Demo Buton Metni</Label>
            <Input
              id="demo_button_text"
              placeholder="Demoyu İncele"
              value={(formData.demo_button_text as string) ?? ""}
              onChange={(e) => setField("demo_button_text", e.target.value)}
            />
          </div>

          {!!formData.demo_embed_enabled && !!formData.demo_url && (
            <div className="space-y-2">
              <Label>Demo Önizleme</Label>
              <div className="border rounded-lg overflow-hidden bg-muted">
                <iframe
                  src={formData.demo_url as string}
                  className="w-full h-[400px]"
                  sandbox="allow-scripts allow-same-origin"
                  title="Demo Önizleme"
                />
              </div>
              <p className="text-xs text-muted-foreground">Müşterilerin ürün detay sayfasında göreceği demo görünümü</p>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
