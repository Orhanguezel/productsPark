// =============================================================
// FILE: src/components/admin/settings/GeneralSettingsCard.tsx
// =============================================================
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Dispatch, SetStateAction } from "react";
import type { SiteSettings } from "@/integrations/metahub/rtk/types/site";

type Props = {
  settings: SiteSettings;
  setSettings: Dispatch<SetStateAction<SiteSettings>>;
};

export default function GeneralSettingsCard({ settings, setSettings }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Genel Ayarlar</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Site Başlığı */}
        <div className="space-y-2">
          <Label htmlFor="site_title">Site Başlığı</Label>
          <Input
            id="site_title"
            value={settings.site_title ?? ""}
            onChange={(e) =>
              setSettings((s) => ({
                ...s,
                site_title: e.target.value,
              }))
            }
          />
        </div>

        {/* Site Açıklaması */}
        <div className="space-y-2">
          <Label htmlFor="site_description">Site Açıklaması</Label>
          <Textarea
            id="site_description"
            rows={3}
            value={settings.site_description ?? ""}
            onChange={(e) =>
              setSettings((s) => ({
                ...s,
                site_description: e.target.value,
              }))
            }
          />
        </div>

        {/* Tema Modu */}
        <div className="space-y-2">
          <Label htmlFor="theme_mode">Dark/Light Mod Ayarı</Label>
          <Select
            value={settings.theme_mode}
            onValueChange={(v: SiteSettings["theme_mode"]) =>
              setSettings((s) => ({
                ...s,
                theme_mode: v,
              }))
            }
          >
            <SelectTrigger id="theme_mode">
              <SelectValue placeholder="Tema seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user_choice">
                Kullanıcı Karar Versin
              </SelectItem>
              <SelectItem value="dark_only">Sadece Dark</SelectItem>
              <SelectItem value="light_only">Sadece Light</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
