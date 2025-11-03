
// =============================================================
// FILE: src/components/admin/settings/SeoSettingsCard.tsx
// =============================================================
"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Dispatch, SetStateAction } from "react";

type Props = { settings:any; setSettings: Dispatch<SetStateAction<any>> };
export default function SeoSettingsCard({ settings, setSettings }: Props) {
  return (
    <Card>
      <CardHeader><CardTitle>Sayfa SEO Ayarları</CardTitle></CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Ürünler - Başlık</Label>
          <Input value={settings.seo_products_title||""} onChange={(e)=>setSettings((s:any)=>({...s, seo_products_title:e.target.value}))} />
          <Label>Ürünler - Açıklama</Label>
          <Textarea rows={3} value={settings.seo_products_description||""} onChange={(e)=>setSettings((s:any)=>({...s, seo_products_description:e.target.value}))} />
        </div>
        <div className="space-y-2">
          <Label>Kategoriler - Başlık</Label>
          <Input value={settings.seo_categories_title||""} onChange={(e)=>setSettings((s:any)=>({...s, seo_categories_title:e.target.value}))} />
          <Label>Kategoriler - Açıklama</Label>
          <Textarea rows={3} value={settings.seo_categories_description||""} onChange={(e)=>setSettings((s:any)=>({...s, seo_categories_description:e.target.value}))} />
        </div>
      </CardContent>
    </Card>
  );
}
