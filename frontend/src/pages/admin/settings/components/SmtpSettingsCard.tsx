

// =============================================================
// FILE: src/components/admin/settings/SmtpSettingsCard.tsx
// =============================================================
"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { metahub } from "@/integrations/metahub/client";
import type { Dispatch, SetStateAction } from "react";

export default function SmtpSettingsCard({ settings, setSettings }: { settings:any; setSettings: Dispatch<SetStateAction<any>> }) {
  return (
    <Card>
      <CardHeader><CardTitle>SMTP Mail Ayarları</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Mail Sunucusu</Label>
            <Input value={settings.smtp_host} onChange={(e)=>setSettings((s:any)=>({...s, smtp_host:e.target.value}))} />
          </div>
          <div className="space-y-2">
            <Label>Port</Label>
            <Input type="number" value={settings.smtp_port} onChange={(e)=>setSettings((s:any)=>({...s, smtp_port:parseInt(e.target.value)}))} />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Switch checked={settings.smtp_ssl} onCheckedChange={(checked)=>setSettings((s:any)=>({...s, smtp_ssl:checked}))} />
              <Label>SSL Etkin</Label>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Kullanıcı Adı (Email)</Label>
            <Input type="email" value={settings.smtp_username} onChange={(e)=>setSettings((s:any)=>({...s, smtp_username:e.target.value}))} />
          </div>
          <div className="space-y-2">
            <Label>Şifre</Label>
            <Input type="password" value={settings.smtp_password} onChange={(e)=>setSettings((s:any)=>({...s, smtp_password:e.target.value}))} />
          </div>
          <div className="space-y-2">
            <Label>Gönderen Email</Label>
            <Input type="email" value={settings.smtp_from_email} onChange={(e)=>setSettings((s:any)=>({...s, smtp_from_email:e.target.value}))} />
          </div>
          <div className="space-y-2">
            <Label>Gönderen Adı</Label>
            <Input value={settings.smtp_from_name} onChange={(e)=>setSettings((s:any)=>({...s, smtp_from_name:e.target.value}))} />
          </div>
        </div>
        <div className="pt-4">
          <Button variant="outline" onClick={async()=>{
            try {
              const { data, error } = await metahub.functions.invoke("test-smtp");
              if (error) throw new Error((error as any).message||"Invoke error");
              if ((data as any)?.success) toast.success((data as any)?.message || "SMTP testi başarılı");
              else toast.error(((data as any)?.error)||"SMTP testi başarısız");
            } catch (err:any) { toast.error("SMTP testi başarısız: "+(err?.message||String(err))); }
          }}>Bağlantıyı Test Et</Button>
        </div>
      </CardContent>
    </Card>
  );
}
