
// =============================================================
// FILE: src/components/admin/settings/PaymentSettingsCard.tsx
// =============================================================
"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import type { Dispatch, SetStateAction } from "react";

type Props = { settings:any; setSettings:Dispatch<SetStateAction<any>>; origin:string; savingProvider?:boolean };
export default function PaymentSettingsCard({ settings, setSettings, origin, savingProvider }:Props){
  return (
    <Card>
      <CardHeader><CardTitle>Ödeme Yöntemleri (PayTR Köprüsü)</CardTitle></CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4 border-b pb-4">
          <h3 className="text-lg font-semibold">PayTR Entegrasyonu</h3>
          <div className="space-y-4 pl-4 border-l-2 border-muted">
            <h4 className="font-medium">Mağaza Bilgileri</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Merchant ID</Label><Input value={settings.paytr_merchant_id} onChange={(e)=>setSettings((s:any)=>({...s, paytr_merchant_id:e.target.value}))}/></div>
              <div className="space-y-2"><Label>Merchant Key</Label><Input type="password" value={settings.paytr_merchant_key} onChange={(e)=>setSettings((s:any)=>({...s, paytr_merchant_key:e.target.value}))}/></div>
              <div className="space-y-2"><Label>Merchant Salt</Label><Input type="password" value={settings.paytr_merchant_salt} onChange={(e)=>setSettings((s:any)=>({...s, paytr_merchant_salt:e.target.value}))}/></div>
            </div>
            <div className="flex items-center gap-2"><Switch id="paytr_test_mode" checked={settings.paytr_test_mode!==false} onCheckedChange={(checked)=>setSettings((s:any)=>({...s, paytr_test_mode:checked}))}/><Label htmlFor="paytr_test_mode">Test Modu</Label></div>
          </div>
          <div className="space-y-4 pl-4 border-l-2 border-muted mt-4">
            <div className="flex items-center gap-2"><Switch id="paytr_enabled" checked={settings.paytr_enabled} onCheckedChange={(checked)=>setSettings((s:any)=>({...s, paytr_enabled:checked}))}/><Label htmlFor="paytr_enabled" className="font-medium">Kredi Kartı ile Ödeme</Label></div>
            {settings.paytr_enabled && (
              <div className="space-y-2 pl-6">
                <Label htmlFor="paytr_commission">Ödeme Komisyonu (%)</Label>
                <Input id="paytr_commission" type="number" min="0" max="100" step="0.01" value={settings.paytr_commission} onChange={(e)=>setSettings((s:any)=>({...s, paytr_commission:parseFloat(e.target.value)||0}))} />
              </div>
            )}
          </div>
          <div className="space-y-4 pl-4 border-l-2 border-muted mt-4">
            <div className="flex items-center gap-2"><Switch id="paytr_havale_enabled" checked={settings.paytr_havale_enabled} onCheckedChange={(checked)=>setSettings((s:any)=>({...s, paytr_havale_enabled:checked}))}/><Label htmlFor="paytr_havale_enabled" className="font-medium">Havale/EFT ile Ödeme</Label></div>
            {settings.paytr_havale_enabled && (
              <div className="space-y-2 pl-6">
                <Label htmlFor="paytr_havale_commission">Komisyon (%)</Label>
                <Input id="paytr_havale_commission" type="number" min="0" max="100" step="0.01" value={settings.paytr_havale_commission} onChange={(e)=>setSettings((s:any)=>({...s, paytr_havale_commission:parseFloat(e.target.value)||0}))} />
              </div>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-4">PayTR Bildirim URL: <code className="bg-muted px-2 py-1 rounded">{origin}/functions/v1/paytr-callback</code></p>
          {savingProvider && <p className="text-xs text-muted-foreground">PayTR durumu yükleniyor…</p>}
        </div>
      </CardContent>
    </Card>
  );
}
