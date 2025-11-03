// =============================================================
// FILE: src/pages/admin/FakeNotificationList.tsx
// =============================================================
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  useGetFakeNotificationSettingsQuery,
  useUpdateFakeNotificationSettingsMutation,
  useListFakeOrderNotificationsQuery,
  useDeleteFakeOrderNotificationMutation,
} from "@/integrations/metahub/rtk/endpoints/fake_notifications.endpoints";

export default function FakeNotificationList() {
  const nav = useNavigate();

  // --- Settings (admin) ---
  const { data: cfg, isLoading: cfgLoading } = useGetFakeNotificationSettingsQuery();
  const [updateCfg, { isLoading: saving }] = useUpdateFakeNotificationSettingsMutation();

  const [settings, setSettings] = useState({
    notification_display_duration: 5,
    notification_interval: 30,
    notification_delay: 10,
    fake_notifications_enabled: true,
  });

  useEffect(() => {
    if (cfg) setSettings(cfg);
  }, [cfg]);

  const handleSaveSettings = async () => {
    try {
      await updateCfg(settings).unwrap();
      toast.success("Ayarlar kaydedildi");
    } catch (err) {
      console.error(err);
      toast.error("Ayarlar kaydedilirken hata oluştu");
    }
  };

  // --- List (admin) ---
  const { data: rows = [], isLoading: listLoading } = useListFakeOrderNotificationsQuery({
    order: "created_at.desc",
  });
  const [del, { isLoading: deleting }] = useDeleteFakeOrderNotificationMutation();
  const [busy, setBusy] = useState<string | null>(null);

  const onDelete = async (id: string) => {
    if (!confirm("Kayıt silinsin mi?")) return;
    setBusy(id);
    try {
      await del(id).unwrap();
      toast.success("Kayıt silindi");
    } catch (e) {
      console.error(e);
      toast.error("Silme başarısız");
    } finally {
      setBusy(null);
    }
  };

  if (cfgLoading) {
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
        {/* ===== Durum ===== */}
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
                  Tüm aktif ürünler otomatik olarak rastgele sırayla bildirim olarak gösterilir.
                </p>
              </div>
              <Switch
                id="fake_notifications_enabled"
                checked={settings.fake_notifications_enabled}
                onCheckedChange={(checked) =>
                  setSettings((s) => ({ ...s, fake_notifications_enabled: checked }))
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* ===== Ayarlar ===== */}
        <Card>
          <CardHeader>
            <CardTitle>Bildirim Ayarları</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notification_display_duration">Görüntülenme Süresi (sn)</Label>
              <Input
                id="notification_display_duration"
                type="number"
                value={settings.notification_display_duration}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    notification_display_duration: Number(e.target.value),
                  }))
                }
                min={1}
              />
              <p className="text-xs text-muted-foreground">
                Bildirimin ekranda kaç saniye kalacağı.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notification_interval">Gösterim Aralığı (sn)</Label>
              <Input
                id="notification_interval"
                type="number"
                value={settings.notification_interval}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, notification_interval: Number(e.target.value) }))
                }
                min={10}
              />
              <p className="text-xs text-muted-foreground">Bildirimler arası bekleme süresi.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notification_delay">İlk Gösterim Gecikmesi (sn)</Label>
              <Input
                id="notification_delay"
                type="number"
                value={settings.notification_delay}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, notification_delay: Number(e.target.value) }))
                }
                min={0}
              />
              <p className="text-xs text-muted-foreground">
                Sayfa açıldıktan kaç saniye sonra ilk bildirim gösterilir.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={handleSaveSettings} disabled={saving}>
                {saving ? "Kaydediliyor..." : "Ayarları Kaydet"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ===== Liste ===== */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Fake Siparişler (Liste)</CardTitle>
            <Button onClick={() => nav("/admin/fake-orders/new")}>
              <Plus className="w-4 h-4 mr-2" />
              Yeni Kayıt
            </Button>
          </CardHeader>
          <CardContent>
            {listLoading ? (
              "Yükleniyor..."
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ürün</TableHead>
                    <TableHead>Müşteri</TableHead>
                    <TableHead>Konum</TableHead>
                    <TableHead>Zaman</TableHead>
                    <TableHead>Aktif</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{r.product_name}</TableCell>
                      <TableCell>{r.customer}</TableCell>
                      <TableCell>{r.location ?? "-"}</TableCell>
                      <TableCell>{r.time_ago}</TableCell>
                      <TableCell>{r.is_active ? "Evet" : "Hayır"}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => nav(`/admin/fake-orders/${r.id}`)}
                          className="mr-1"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(r.id)}
                          disabled={busy === r.id || deleting}
                          title="Sil"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}

                  {rows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                        Kayıt bulunamadı.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
