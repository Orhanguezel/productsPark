import { useEffect, useState } from "react";
import { metahub } from "@/integrations/metahub/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface NotificationSettings {
  notification_display_duration: number;
  notification_interval: number;
  notification_delay: number;
  fake_notifications_enabled: boolean;
}

export default function FakeNotificationList() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>({
    notification_display_duration: 5,
    notification_interval: 30,
    notification_delay: 10,
    fake_notifications_enabled: true,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await metahub
        .from("site_settings")
        .select("*")
        .in("key", [
          "notification_display_duration",
          "notification_interval",
          "notification_delay",
          "fake_notifications_enabled",
        ]);

      if (error) throw error;

      const settingsObj = data.reduce((acc, item) => {
        if (item.key === "fake_notifications_enabled") {
          acc[item.key] = item.value === true || item.value === "true";
        } else {
          const numValue = typeof item.value === 'number' ? item.value : parseFloat(String(item.value));
          acc[item.key] = isNaN(numValue) ? 0 : numValue;
        }
        return acc;
      }, {} as any);

      setSettings({
        notification_display_duration: settingsObj.notification_display_duration || 5,
        notification_interval: settingsObj.notification_interval || 30,
        notification_delay: settingsObj.notification_delay || 10,
        fake_notifications_enabled: settingsObj.fake_notifications_enabled !== undefined ? settingsObj.fake_notifications_enabled : true,
      });
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);

      // Delete existing notification settings
      await metahub
        .from("site_settings")
        .delete()
        .in("key", [
          "notification_display_duration",
          "notification_interval",
          "notification_delay",
          "fake_notifications_enabled",
        ]);

      // Insert new settings
      const settingsArray = Object.entries(settings).map(([key, value]) => ({
        key,
        value,
      }));

      const { error } = await metahub.from("site_settings").insert(settingsArray);

      if (error) throw error;

      toast.success("Ayarlar kaydedildi");
    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast.error("Ayarlar kaydedilirken hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Fake Sipariş Bildirimleri">
        <div className="flex items-center justify-center py-8">
          <p>Yükleniyor...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Fake Sipariş Bildirimleri">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Bildirim Durumu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="fake_notifications_enabled" className="text-base">
                  Otomatik Bildirimler
                </Label>
                <p className="text-sm text-muted-foreground">
                  Tüm aktif ürünler otomatik olarak random sırayla bildirim olarak gösterilir
                </p>
              </div>
              <Switch
                id="fake_notifications_enabled"
                checked={settings.fake_notifications_enabled}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, fake_notifications_enabled: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bildirim Ayarları</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notification_display_duration">
                Görüntülenme Süresi (sn)
              </Label>
              <Input
                id="notification_display_duration"
                type="number"
                value={settings.notification_display_duration}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    notification_display_duration: parseFloat(e.target.value),
                  })
                }
                min={1}
              />
              <p className="text-xs text-muted-foreground">
                Bildirimin ekranda kaç saniye gözükeceği
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notification_interval">Gösterim Aralığı (sn)</Label>
              <Input
                id="notification_interval"
                type="number"
                value={settings.notification_interval}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    notification_interval: parseFloat(e.target.value),
                  })
                }
                min={10}
              />
              <p className="text-xs text-muted-foreground">
                Bildirimler arası bekleme süresi
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notification_delay">
                İlk Gösterim Gecikmesi (sn)
              </Label>
              <Input
                id="notification_delay"
                type="number"
                value={settings.notification_delay}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    notification_delay: parseFloat(e.target.value),
                  })
                }
                min={0}
              />
              <p className="text-xs text-muted-foreground">
                Sayfa açıldıktan kaç saniye sonra ilk bildirim gösterilecek
              </p>
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={handleSaveSettings} disabled={saving}>
                {saving ? "Kaydediliyor..." : "Ayarları Kaydet"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
