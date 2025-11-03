

// =============================================================
// FILE: src/components/admin/settings/IntegrationsSettingsCard.tsx
// =============================================================
"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { Dispatch, SetStateAction } from "react";

export default function IntegrationsSettingsCard({ settings, setSettings }:{settings:any; setSettings:Dispatch<SetStateAction<any>>}){
  return (
    <Card>
      <CardHeader><CardTitle>Analitik & Entegrasyonlar</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Google Analytics ID</Label><Input value={settings.google_analytics_id} onChange={(e)=>setSettings((s:any)=>({...s, google_analytics_id:e.target.value}))} placeholder="G-XXXXXXXXXX" /></div>
          <div className="space-y-2"><Label>Facebook Pixel ID</Label><Input value={settings.facebook_pixel_id} onChange={(e)=>setSettings((s:any)=>({...s, facebook_pixel_id:e.target.value}))} /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Facebook URL</Label><Input value={settings.facebook_url} onChange={(e)=>setSettings((s:any)=>({...s, facebook_url:e.target.value}))} /></div>
          <div className="space-y-2"><Label>Twitter URL</Label><Input value={settings.twitter_url} onChange={(e)=>setSettings((s:any)=>({...s, twitter_url:e.target.value}))} /></div>
          <div className="space-y-2"><Label>Instagram URL</Label><Input value={settings.instagram_url} onChange={(e)=>setSettings((s:any)=>({...s, instagram_url:e.target.value}))} /></div>
          <div className="space-y-2"><Label>LinkedIn URL</Label><Input value={settings.linkedin_url} onChange={(e)=>setSettings((s:any)=>({...s, linkedin_url:e.target.value}))} /></div>
        </div>
      </CardContent>
    </Card>
  );
}
