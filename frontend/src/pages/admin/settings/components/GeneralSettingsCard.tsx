'use client';

// =============================================================
// FINAL — General Settings Card (parent SettingsPage compatible)
// - Accepts ANY parent settings model (T)
// - Safe read/write via Record<string, unknown>
// - exactOptionalPropertyTypes friendly
// =============================================================

import * as React from 'react';
import type { Dispatch, SetStateAction } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export type ThemeMode = 'user_choice' | 'dark_only' | 'light_only';

type Props<T> = {
  settings: T;
  setSettings: Dispatch<SetStateAction<T>>;
};

const toStr = (v: unknown): string => (typeof v === 'string' ? v : v == null ? '' : String(v));

const toThemeMode = (v: unknown): ThemeMode => {
  const s = String(v ?? '');
  if (s === 'dark_only' || s === 'light_only' || s === 'user_choice') return s;
  return 'user_choice';
};

export default function GeneralSettingsCard<T>({ settings, setSettings }: Props<T>) {
  const dyn = settings as unknown as Record<string, unknown>;

  const siteTitle = toStr(dyn.site_title);
  const siteDescription = toStr(dyn.site_description);
  const themeMode = toThemeMode(dyn.theme_mode);

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
            value={siteTitle}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const value = e.target.value;
              setSettings((prev) => {
                const out = { ...(prev as unknown as Record<string, unknown>) };
                out.site_title = value;
                return out as unknown as T;
              });
            }}
          />
        </div>

        {/* Site Açıklaması */}
        <div className="space-y-2">
          <Label htmlFor="site_description">Site Açıklaması</Label>
          <Textarea
            id="site_description"
            rows={3}
            value={siteDescription}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
              const value = e.target.value;
              setSettings((prev) => {
                const out = { ...(prev as unknown as Record<string, unknown>) };
                out.site_description = value;
                return out as unknown as T;
              });
            }}
          />
        </div>

        {/* Tema Modu */}
        <div className="space-y-2">
          <Label htmlFor="theme_mode">Dark/Light Mod Ayarı</Label>
          <Select
            value={themeMode}
            onValueChange={(v: ThemeMode) => {
              setSettings((prev) => {
                const out = { ...(prev as unknown as Record<string, unknown>) };
                out.theme_mode = v;
                return out as unknown as T;
              });
            }}
          >
            <SelectTrigger id="theme_mode">
              <SelectValue placeholder="Tema seçin" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="user_choice">Kullanıcı Karar Versin</SelectItem>
              <SelectItem value="dark_only">Sadece Dark</SelectItem>
              <SelectItem value="light_only">Sadece Light</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
