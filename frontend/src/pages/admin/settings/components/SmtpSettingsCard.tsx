// =============================================================
// FILE: src/components/admin/settings/SmtpSettingsCard.tsx
// FINAL — SMTP Settings Card (+ send test mail)
// - shadcn/ui
// - exactOptionalPropertyTypes friendly
// - SettingsPage form model compatible (NOT SiteSettings)
// =============================================================
'use client';

import * as React from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';

import { toast } from 'sonner';

import type { Dispatch, SetStateAction } from 'react';
import { useSendTestMailMutation } from '@/integrations/hooks';

// ---- Local, model-safe types (match SettingsPage defaultSettings keys) ----
type SmtpSettingsShape = {
  smtp_host?: string | null;
  smtp_port?: number | string | null;
  smtp_ssl?: boolean | string | number | null;

  smtp_username?: string | null;
  smtp_password?: string | null;

  smtp_from_email?: string | null;
  smtp_from_name?: string | null;

  [k: string]: unknown;
};

type Props<T extends SmtpSettingsShape = SmtpSettingsShape> = {
  settings: T;
  setSettings: Dispatch<SetStateAction<T>>;
};

function toCleanString(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : '';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return '';
}

function toPortMaybe(v: string): number | null {
  const s = String(v ?? '').trim();
  if (!s) return null;
  const n = Number.parseInt(s, 10);
  if (Number.isNaN(n) || n <= 0) return null;
  return n;
}

function toBoolish(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const s = value.trim().toLowerCase();
    return s === '1' || s === 'true' || s === 'yes' || s === 'on';
  }
  return false;
}

export default function SmtpSettingsCard<T extends SmtpSettingsShape>({
  settings,
  setSettings,
}: Props<T>) {
  const [sendTestMail, { isLoading: testing }] = useSendTestMailMutation();

  const dyn = settings as Record<string, unknown>;

  const smtpHost = toCleanString(dyn.smtp_host);
  const smtpPortNum =
    typeof dyn.smtp_port === 'number'
      ? dyn.smtp_port
      : typeof dyn.smtp_port === 'string'
      ? toPortMaybe(dyn.smtp_port) ?? 0
      : 0;

  const smtpSsl = toBoolish(dyn.smtp_ssl);

  const smtpUsername = toCleanString(dyn.smtp_username);
  const smtpPassword = toCleanString(dyn.smtp_password);
  const smtpFromEmail = toCleanString(dyn.smtp_from_email);
  const smtpFromName = toCleanString(dyn.smtp_from_name);

  const setString = (key: string, v: string) => {
    setSettings((prev) => {
      const out = { ...(prev as Record<string, unknown>) };
      out[key] = v;
      return out as T;
    });
  };

  const setNumberOrNull = (key: string, v: number | null) => {
    setSettings((prev) => {
      const out = { ...(prev as Record<string, unknown>) };
      out[key] = v;
      return out as T;
    });
  };

  const setBool = (key: string, v: boolean) => {
    setSettings((prev) => {
      const out = { ...(prev as Record<string, unknown>) };
      out[key] = v;
      return out as T;
    });
  };

  const handleTestClick = async () => {
    try {
      // Öncelik: from_email, yoksa username, yoksa backend req.user.email (auth varsa)
      const to =
        (smtpFromEmail && smtpFromEmail.trim()) ||
        (smtpUsername && smtpUsername.trim()) ||
        undefined;

      const res = await sendTestMail(to ? { to } : undefined).unwrap();

      if (res.ok) {
        toast.success('Test maili gönderildi. Lütfen gelen kutunuzu kontrol edin.');
      } else {
        toast.error(
          res.message ? `Test maili gönderilemedi: ${res.message}` : 'Test maili gönderilemedi.',
        );
      }
    } catch (err) {
      const e = err as { data?: { message?: string }; message?: string };
      toast.error(`SMTP testi başarısız: ${e?.data?.message || e?.message || 'Bilinmeyen hata'}`);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>SMTP Mail Ayarları</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Mail gönderimleri bu ayarlara göre yapılır. Değişiklikten sonra{' '}
          <strong>önce kaydedip</strong> ardından test mail göndererek doğrulayın.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="smtp_host">Mail Sunucusu (Host)</Label>
            <Input
              id="smtp_host"
              placeholder="srvm16.trwww.com"
              value={smtpHost}
              onChange={(e) => setString('smtp_host', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="smtp_port">Port</Label>
            <Input
              id="smtp_port"
              type="number"
              placeholder={smtpSsl ? '465 (SSL)' : '587 (TLS)'}
              value={smtpPortNum ? String(smtpPortNum) : ''}
              onChange={(e) => {
                const p = toPortMaybe(e.target.value);
                setNumberOrNull('smtp_port', p);
              }}
            />
            <p className="text-xs text-muted-foreground">
              SSL açıkken genelde <strong>465</strong>, kapalıyken <strong>587</strong> kullanılır.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 mt-6">
              <Switch
                id="smtp_ssl"
                checked={smtpSsl}
                onCheckedChange={(checked) => setBool('smtp_ssl', checked)}
              />
              <Label htmlFor="smtp_ssl">SSL (Güvenli bağlantı)</Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="smtp_username">Kullanıcı Adı (E-posta)</Label>
            <Input
              id="smtp_username"
              type="email"
              placeholder="dijital@sosyalpaket.com"
              value={smtpUsername}
              onChange={(e) => setString('smtp_username', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="smtp_password">Şifre</Label>
            <Input
              id="smtp_password"
              type="password"
              value={smtpPassword}
              onChange={(e) => setString('smtp_password', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="smtp_from_email">Gönderen E-posta (From)</Label>
            <Input
              id="smtp_from_email"
              type="email"
              placeholder="dijital@sosyalpaket.com"
              value={smtpFromEmail}
              onChange={(e) => setString('smtp_from_email', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Müşterinin göreceği gönderen adresi. Genelde kullanıcı adı ile aynıdır.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="smtp_from_name">Gönderen Adı</Label>
            <Input
              id="smtp_from_name"
              placeholder="Dijital Paket"
              value={smtpFromName}
              onChange={(e) => setString('smtp_from_name', e.target.value)}
            />
          </div>
        </div>

        <div className="pt-4 flex items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            Test mail, varsayılan olarak "Gönderen E-posta" adresine veya kullanıcı adına
            gönderilir. Eğer body'de to göndermezsen, backend giriş yapmış admin’in e-posta adresini
            kullanır (auth varsa).
          </p>

          <Button variant="outline" onClick={handleTestClick} disabled={testing}>
            {testing ? 'Test Gönderiliyor...' : 'Test Mail Gönder'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
