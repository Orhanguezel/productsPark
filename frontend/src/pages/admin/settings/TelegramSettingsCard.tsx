

// =============================================================
// FILE: src/components/admin/settings/TelegramSettingsCard.tsx
// =============================================================
"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import type { Dispatch, SetStateAction } from "react";

export default function TelegramSettingsCard({ settings, setSettings }:{settings:any; setSettings:Dispatch<SetStateAction<any>>}){
  return (
    <Card>
      <CardHeader><CardTitle>Telegram Bildirim Ayarları</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2"><Label>Bot Token</Label><Input value={settings.telegram_bot_token} onChange={(e)=>setSettings((s:any)=>({...s, telegram_bot_token:e.target.value}))} /></div>
        <div className="space-y-2"><Label>Chat ID</Label><Input value={settings.telegram_chat_id} onChange={(e)=>setSettings((s:any)=>({...s, telegram_chat_id:e.target.value}))} /></div>
        <div className="space-y-4 border rounded p-4">
          <div className="flex items-center justify-between"><div><Label className="text-base font-medium">Yeni Sipariş Bildirimleri</Label></div><Switch checked={settings.new_order_telegram} onCheckedChange={(v)=>setSettings((s:any)=>({...s, new_order_telegram:v}))} /></div>
          <div className="space-y-2"><Label>Mesaj Şablonu</Label><Textarea rows={6} value={settings.telegram_template_new_order||""} onChange={(e)=>setSettings((s:any)=>({...s, telegram_template_new_order:e.target.value}))}/></div>
        </div>
      </CardContent>
    </Card>
  );
}
