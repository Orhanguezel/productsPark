// =============================================================
// FILE: src/pages/admin/BackupManagement.tsx
// =============================================================
import { useState, useMemo } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Download, Database, Loader2, RotateCcw, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// RTK: DB admin endpointleri
import {
  useExportSqlMutation,
  useExportJsonMutation,
  useListDbSnapshotsQuery,
  useCreateDbSnapshotMutation,
  useRestoreDbSnapshotMutation,
  useDeleteDbSnapshotMutation,
  type DbSnapshot,
} from "@/integrations/metahub/rtk/endpoints/admin/db_admin.endpoints";

export default function BackupManagement() {
  const { toast } = useToast();

  // --- Export state ---
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [exportSql] = useExportSqlMutation();
  const [exportJson] = useExportJsonMutation();

  // --- Snapshot state ---
  const {
    data: snapshots,
    isLoading: isSnapshotsLoading,
    refetch: refetchSnapshots,
  } = useListDbSnapshotsQuery();

  const [createSnapshot, { isLoading: isCreatingSnapshot }] =
    useCreateDbSnapshotMutation();
  const [restoreSnapshot] = useRestoreDbSnapshotMutation();
  const [deleteSnapshot] = useDeleteDbSnapshotMutation();

  const [snapshotLabel, setSnapshotLabel] = useState("");
  const [snapshotNote, setSnapshotNote] = useState("");
  const [busySnapshotId, setBusySnapshotId] = useState<string | null>(null);

  const hasSnapshots = useMemo(
    () => (snapshots?.length ?? 0) > 0,
    [snapshots]
  );

  const formatBytes = (size?: number | null) => {
    if (!size || size <= 0) return "-";
    const units = ["B", "KB", "MB", "GB", "TB"];
    let v = size;
    let i = 0;
    while (v >= 1024 && i < units.length - 1) {
      v /= 1024;
      i++;
    }
    return `${v.toFixed(1)} ${units[i]}`;
  };

  const formatDateTime = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString();
  };

  // ----------------- EXPORT HANDLER -----------------
  const handleBackup = async (selectedFormat: "json" | "sql") => {
    setIsBackingUp(true);
    try {
      const blob =
        selectedFormat === "sql"
          ? await exportSql().unwrap()
          : await exportJson().unwrap();

      const extension = selectedFormat === "sql" ? "sql" : "json";
      const filename = `database-backup-${new Date()
        .toISOString()
        .split("T")[0]}.${extension}`;

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Yedekleme Başarılı",
        description: `Veritabanı yedeği (${extension.toUpperCase()}) başarıyla indirildi.`,
      });
    } catch (err) {
      console.error("Backup error:", err);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Veritabanı yedeği alınırken bir hata oluştu.",
      });
    } finally {
      setIsBackingUp(false);
    }
  };

  // ----------------- SNAPSHOT HANDLERS -----------------
  const handleCreateSnapshot = async () => {
    try {
      await createSnapshot({
        label: snapshotLabel.trim() || undefined,
        note: snapshotNote.trim() || undefined,
      }).unwrap();

      setSnapshotLabel("");
      setSnapshotNote("");

      toast({
        title: "Snapshot oluşturuldu",
        description: "Veritabanı snapshot'ı başarıyla oluşturuldu.",
      });

      refetchSnapshots();
    } catch (err) {
      console.error("Create snapshot error:", err);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Snapshot oluşturulurken bir hata oluştu.",
      });
    }
  };

  const handleRestoreSnapshot = async (snap: DbSnapshot) => {
    const ok = window.confirm(
      `Bu snapshot'a geri dönmek istediğinize emin misiniz?\n\nLabel: ${snap.label || "-"}\nTarih: ${
        snap.created_at
      }\n\nNOT: Varolan veriler snapshot'taki durumla değiştirilecektir.`
    );
    if (!ok) return;

    setBusySnapshotId(snap.id);
    try {
      await restoreSnapshot({
        id: snap.id,
        truncateBefore: true,
        dryRun: false,
      }).unwrap();

      toast({
        title: "Snapshot restore edildi",
        description:
          "Veritabanı seçilen snapshot'a göre başarıyla geri yüklendi.",
      });
    } catch (err) {
      console.error("Restore snapshot error:", err);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Snapshot geri yüklenirken bir hata oluştu.",
      });
    } finally {
      setBusySnapshotId(null);
    }
  };

  const handleDeleteSnapshot = async (snap: DbSnapshot) => {
    const ok = window.confirm(
      `Bu snapshot'ı silmek istediğinize emin misiniz?\n\nLabel: ${
        snap.label || "-"
      }\nTarih: ${snap.created_at}`
    );
    if (!ok) return;

    setBusySnapshotId(snap.id);
    try {
      await deleteSnapshot({ id: snap.id }).unwrap();

      toast({
        title: "Snapshot silindi",
        description: "Snapshot başarıyla silindi.",
      });

      refetchSnapshots();
    } catch (err) {
      console.error("Delete snapshot error:", err);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Snapshot silinirken bir hata oluştu.",
      });
    } finally {
      setBusySnapshotId(null);
    }
  };

  return (
    <AdminLayout title="Veritabanı Yedekleme">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* --------- EXPORT CARD (JSON / SQL) --------- */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Veritabanı Yedeği (İndirme)
            </CardTitle>
            <CardDescription>
              Tüm veritabanı tablolarınızın tam yedeğini JSON veya SQL formatında
              indirin.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <h3 className="font-semibold">Yedekleme Hakkında</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Tüm tablolar ve veriler yedeklenir</li>
                <li>JSON: veri analizi ve geri yükleme scriptleri için uygundur</li>
                <li>SQL: veritabanına doğrudan yüklenebilir dump</li>
                <li>Yedek dosyası otomatik indirilir</li>
              </ul>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => handleBackup("json")}
                disabled={isBackingUp}
                size="lg"
                variant="outline"
                className="w-full"
              >
                {isBackingUp ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Yedekleniyor...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    JSON İndir
                  </>
                )}
              </Button>

              <Button
                onClick={() => handleBackup("sql")}
                disabled={isBackingUp}
                size="lg"
                className="w-full"
              >
                {isBackingUp ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Yedekleniyor...
                  </>
                ) : (
                  <>
                    <Database className="h-4 w-4" />
                    SQL İndir
                  </>
                )}
              </Button>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 p-4 rounded-lg">
              <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                ⚠️ Önemli Notlar
              </h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-yellow-700 dark:text-yellow-300">
                <li>Yedekleri güvenli bir yerde saklayın</li>
                <li>Düzenli yedekleme planı oluşturun</li>
                <li>Yedekler hassas bilgi içerebilir</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* --------- SNAPSHOT CARD --------- */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Snapshot Yönetimi
            </CardTitle>
            <CardDescription>
              Sunucu üzerinde saklanan tam veritabanı snapshot&apos;larını
              görüntüleyin, etiketleyin, geri yükleyin veya silin.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Snapshot oluşturma formu */}
            <div className="grid gap-3 md:grid-cols-[2fr,3fr,auto] items-end">
              <div className="space-y-1">
                <label className="text-sm font-medium">Label (isteğe bağlı)</label>
                <Input
                  value={snapshotLabel}
                  onChange={(e) => setSnapshotLabel(e.target.value)}
                  placeholder="Örn: Günlük otomatik yedek"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Not (isteğe bağlı)</label>
                <Textarea
                  value={snapshotNote}
                  onChange={(e) => setSnapshotNote(e.target.value)}
                  rows={2}
                  placeholder="Bu snapshot hakkında kısa açıklama..."
                />
              </div>
              <Button
                onClick={handleCreateSnapshot}
                disabled={isCreatingSnapshot}
                size="lg"
                className="w-full md:w-auto"
              >
                {isCreatingSnapshot ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Oluşturuluyor...
                  </>
                ) : (
                  <>
                    <Database className="h-4 w-4" />
                    Yeni Snapshot
                  </>
                )}
              </Button>
            </div>

            {/* Snapshot listesi (tablo) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold text-sm">Snapshot Listesi</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetchSnapshots()}
                  disabled={isSnapshotsLoading}
                >
                  {isSnapshotsLoading ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Yenileniyor...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="h-3 w-3" />
                      Yenile
                    </>
                  )}
                </Button>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr className="text-left">
                      <th className="px-3 py-2">Label</th>
                      <th className="px-3 py-2">Not</th>
                      <th className="px-3 py-2">Tarih</th>
                      <th className="px-3 py-2">Boyut</th>
                      <th className="px-3 py-2 text-right">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isSnapshotsLoading ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-3 py-4 text-center text-muted-foreground"
                        >
                          <div className="inline-flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Snapshotlar yükleniyor...
                          </div>
                        </td>
                      </tr>
                    ) : !hasSnapshots ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-3 py-4 text-center text-muted-foreground"
                        >
                          Henüz kayıtlı snapshot yok.
                        </td>
                      </tr>
                    ) : (
                      snapshots!.map((snap) => {
                        const loadingThisRow = busySnapshotId === snap.id;
                        return (
                          <tr
                            key={snap.id}
                            className="border-t hover:bg-muted/40 transition-colors"
                          >
                            <td className="px-3 py-2 align-top max-w-[200px]">
                              <div className="font-medium truncate">
                                {snap.label || "-"}
                              </div>
                              <div className="text-[11px] text-muted-foreground break-all">
                                {snap.filename}
                              </div>
                            </td>
                            <td className="px-3 py-2 align-top max-w-[260px]">
                              <div className="text-xs text-muted-foreground whitespace-pre-line line-clamp-3">
                                {snap.note || "-"}
                              </div>
                            </td>
                            <td className="px-3 py-2 align-top whitespace-nowrap">
                              {formatDateTime(snap.created_at)}
                            </td>
                            <td className="px-3 py-2 align-top whitespace-nowrap">
                              {formatBytes(snap.size_bytes ?? null)}
                            </td>
                            <td className="px-3 py-2 align-top">
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={loadingThisRow}
                                  onClick={() => handleRestoreSnapshot(snap)}
                                >
                                  {loadingThisRow ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <RotateCcw className="h-3 w-3" />
                                  )}
                                  <span className="ml-1">Geri Yükle</span>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  disabled={loadingThisRow}
                                  onClick={() => handleDeleteSnapshot(snap)}
                                >
                                  {loadingThisRow ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
