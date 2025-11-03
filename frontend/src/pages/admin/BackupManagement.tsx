// =============================================================
// FILE: src/pages/admin/BackupManagement.tsx
// =============================================================
import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Database, Loader2 } from "lucide-react";
import { metahub } from "@/integrations/metahub/client";
import { useToast } from "@/hooks/use-toast";

export default function BackupManagement() {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const { toast } = useToast();

  const handleBackup = async (selectedFormat: "json" | "sql") => {
    setIsBackingUp(true);
    try {
      // ✅ invoke sadece body alır; method yok.
      // ✅ Generic ile data tipini string olarak sabitledik.
      const { data, error } = await metahub.functions.invoke<string>(
        "backup-database",
        { body: { format: selectedFormat } }
      );

      if (error) throw error;

      // data string değilse (bazı backendler obje döndürebilir) stringify et
      const raw = data as unknown;
      const content =
        typeof raw === "string" ? raw : JSON.stringify(raw ?? {}, null, 2);

      const contentType =
        selectedFormat === "sql" ? "application/sql" : "application/json";
      const extension = selectedFormat === "sql" ? "sql" : "json";

      const blob = new Blob([content], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `database-backup-${new Date().toISOString().split("T")[0]}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Yedekleme Başarılı",
        description: "Veritabanı yedeği başarıyla indirildi.",
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

  return (
    <AdminLayout title="Veritabanı Yedekleme">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Veritabanı Yedeği
            </CardTitle>
            <CardDescription>
              Tüm veritabanı tablolarınızın tam yedeğini JSON veya SQL formatında indirin.
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
              <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">⚠️ Önemli Notlar</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-yellow-700 dark:text-yellow-300">
                <li>Yedekleri güvenli bir yerde saklayın</li>
                <li>Düzenli yedekleme planı oluşturun</li>
                <li>Yedekler hassas bilgi içerebilir</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
