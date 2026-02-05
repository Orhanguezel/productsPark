

// =============================================================
// FILE: src/components/admin/settings/FooterSettingsCard.tsx
// =============================================================
"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Dispatch, SetStateAction } from "react";

export default function FooterSettingsCard({ settings, setSettings }:{settings:any; setSettings:Dispatch<SetStateAction<any>>}){
  return (
    <Card>
      <CardHeader><CardTitle>Footer Ayarları</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2"><Label>Şirket Adı</Label><Input value={settings.footer_company_name||""} onChange={(e)=>setSettings((s:any)=>({...s, footer_company_name:e.target.value}))} placeholder="Dijital Market"/></div>
        <div className="space-y-2"><Label>Açıklama</Label><Textarea rows={3} value={settings.footer_description||""} onChange={(e)=>setSettings((s:any)=>({...s, footer_description:e.target.value}))} placeholder="Kısa açıklama..."/></div>
        <div className="space-y-2"><Label>Copyright</Label><Input value={settings.footer_copyright||""} onChange={(e)=>setSettings((s:any)=>({...s, footer_copyright:e.target.value}))} placeholder="© 2025 Dijital Market"/></div>
        <div className="space-y-2"><Label>E‑posta</Label><Input type="email" value={settings.contact_email||""} onChange={(e)=>setSettings((s:any)=>({...s, footer_email:e.target.value}))} /></div>
        <div className="space-y-2"><Label>Telefon</Label><Input value={settings.footer_phone||""} onChange={(e)=>setSettings((s:any)=>({...s, footer_phone:e.target.value}))} /></div>
        <div className="space-y-2"><Label>Adres</Label><Textarea rows={2} value={settings.footer_address||""} onChange={(e)=>setSettings((s:any)=>({...s, footer_address:e.target.value}))} /></div>
      </CardContent>
    </Card>
  );
}