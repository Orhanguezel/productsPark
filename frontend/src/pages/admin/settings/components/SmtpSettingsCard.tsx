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
import type { Dispatch, SetStateAction } from "react";
import type { SiteSettings } from "@/integrations/metahub/rtk/types/site";
import { useSendTestMailMutation } from "@/integrations/metahub/rtk/endpoints/mail.endpoints";

type Props = {
  settings: SiteSettings;
  setSettings: Dispatch<SetStateAction<SiteSettings>>;
};

export default function SmtpSettingsCard({ settings, setSettings }: Props) {
  const [sendTestMail, { isLoading: testing }] = useSendTestMailMutation();

  const handlePortChange = (value: string) => {
    const n = parseInt(value, 10);
    setSettings((s) => ({
      ...s,
      smtp_port: Number.isNaN(n) ? s.smtp_port : n,
    }));
  };

  const handleTestClick = async () => {
    try {
      // Test mail alıcısı: öncelik from_email, yoksa username, o da yoksa backend req.user.email
      const to =
        settings.smtp_from_email?.trim() ||
        settings.smtp_username?.trim() ||
        undefined;

      const res = await sendTestMail(to ? { to } : undefined).unwrap();

      if (res.ok) {
        toast.success(
          "Test maili gönderildi. Lütfen gelen kutunuzu kontrol edin.",
        );
      } else {
        toast.error("Test maili gönderilemedi (ok=false).");
      }
    } catch (err) {
      const e = err as { data?: { message?: string }; message?: string };
      console.error(err);
      toast.error(
        "SMTP testi başarısız: " +
        (e?.data?.message || e?.message || "Bilinmeyen hata"),
      );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>SMTP Mail Ayarları</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Mail gönderimleri bu ayarlara göre yapılır. Değişiklikten sonra{" "}
          <strong>önce kaydedip</strong> ardından test mail göndererek doğrulayın.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Mail Sunucusu (Host)</Label>
            <Input
              placeholder="srvm16.trwww.com"
              value={settings.smtp_host}
              onChange={(e) =>
                setSettings((s) => ({ ...s, smtp_host: e.target.value }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Port</Label>
            <Input
              type="number"
              placeholder={settings.smtp_ssl ? "465 (SSL)" : "587 (TLS)"}
              value={settings.smtp_port}
              onChange={(e) => handlePortChange(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              SSL açıkken genelde <strong>465</strong>, kapalıyken{" "}
              <strong>587</strong> kullanılır.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 mt-6">
              <Switch
                checked={settings.smtp_ssl}
                onCheckedChange={(checked) =>
                  setSettings((s) => ({ ...s, smtp_ssl: checked }))
                }
              />
              <Label>SSL (Güvenli bağlantı)</Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Kullanıcı Adı (E-posta)</Label>
            <Input
              type="email"
              placeholder="dijital@sosyalpaket.com"
              value={settings.smtp_username}
              onChange={(e) =>
                setSettings((s) => ({ ...s, smtp_username: e.target.value }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Şifre</Label>
            <Input
              type="password"
              value={settings.smtp_password}
              onChange={(e) =>
                setSettings((s) => ({ ...s, smtp_password: e.target.value }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Gönderen E-posta (From)</Label>
            <Input
              type="email"
              placeholder="dijital@sosyalpaket.com"
              value={settings.smtp_from_email}
              onChange={(e) =>
                setSettings((s) => ({ ...s, smtp_from_email: e.target.value }))
              }
            />
            <p className="text-xs text-muted-foreground">
              Müşterinin göreceği gönderen adresi. Genelde kullanıcı adı ile
              aynıdır.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Gönderen Adı</Label>
            <Input
              placeholder="Dijital Paket"
              value={settings.smtp_from_name}
              onChange={(e) =>
                setSettings((s) => ({ ...s, smtp_from_name: e.target.value }))
              }
            />
          </div>
        </div>

        <div className="pt-4 flex items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            Test mail, varsayılan olarak "Gönderen E-posta" adresine veya
            kullanıcı adına gönderilir. Eğer body'de to göndermezsen, backend
            giriş yapmış admin’in e-posta adresini kullanır.
          </p>

          <Button
            variant="outline"
            onClick={handleTestClick}
            disabled={testing}
          >
            {testing ? "Test Gönderiliyor..." : "Test Mail Gönder"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
