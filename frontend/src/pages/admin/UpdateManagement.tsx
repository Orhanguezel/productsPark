import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { metahub } from "@/integrations/metahub/client";
import { useAuth } from "@/hooks/useAuth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RefreshCw, Download, AlertTriangle, CheckCircle, Clock, History } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";

interface UpdateInfo {
  updateAvailable: boolean;
  currentVersion: string;
  latestVersion?: string;
  releaseDate?: string;
  isCritical?: boolean;
  changelog?: string;
  estimatedTime?: string;
  error?: string;
}

interface UpdateHistory {
  id: string;
  from_version: string;
  to_version: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  error_message: string | null;
  changelog: string | null;
}

export default function UpdateManagement() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [updateHistory, setUpdateHistory] = useState<UpdateHistory[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      checkAdminStatus();
    } else if (!authLoading && !user) {
      navigate("/giris");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchCurrentVersion();
      fetchUpdateHistory();
    }
  }, [isAdmin]);

  const checkAdminStatus = async () => {
    if (!user) return;

    try {
      const { data, error } = await metahub
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (error || !data) {
        navigate("/");
        return;
      }

      setIsAdmin(true);
    } catch (error) {
      console.error("Error checking admin status:", error);
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentVersion = async () => {
    try {
      const { data, error } = await metahub
        .from("system_version")
        .select("version")
        .order("installed_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      setUpdateInfo({
        updateAvailable: false,
        currentVersion: data?.version || "1.0.0",
      });
    } catch (error) {
      console.error("Error fetching version:", error);
    }
  };

  const fetchUpdateHistory = async () => {
    try {
      const { data, error } = await metahub
        .from("update_history")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(10);

      if (error) throw error;

      setUpdateHistory(data || []);
    } catch (error) {
      console.error("Error fetching update history:", error);
    }
  };

  const checkForUpdates = async () => {
    setChecking(true);
    try {
      const { data, error } = await metahub.functions.invoke("check-updates");

      if (error) throw error;

      setUpdateInfo(data);

      if (data.updateAvailable) {
        toast({
          title: "Güncelleme Mevcut!",
          description: `Versiyon ${data.latestVersion} yüklenebilir.`,
        });
      } else {
        toast({
          title: "Sisteminiz Güncel",
          description: "En son versiyonu kullanıyorsunuz.",
        });
      }
    } catch (error: any) {
      console.error("Error checking updates:", error);
      toast({
        title: "Hata",
        description: error.message || "Güncelleme kontrolü yapılamadı.",
        variant: "destructive",
      });
    } finally {
      setChecking(false);
    }
  };

  const applyUpdate = async () => {
    if (!updateInfo?.latestVersion) return;

    setUpdating(true);
    setShowConfirmDialog(false);

    try {
      const { data, error } = await metahub.functions.invoke("apply-update", {
        body: { targetVersion: updateInfo.latestVersion },
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Güncelleme Başarılı!",
          description: `Sistem ${data.newVersion} versiyonuna güncellendi.`,
        });

        // Yenile
        await fetchCurrentVersion();
        await fetchUpdateHistory();
        setUpdateInfo(null);

        // Sayfayı yeniden yükle
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        throw new Error(data.error || "Güncelleme başarısız oldu");
      }
    } catch (error: any) {
      console.error("Error applying update:", error);
      toast({
        title: "Güncelleme Hatası",
        description: error.message || "Güncelleme uygulanamadı.",
        variant: "destructive",
      });
      await fetchUpdateHistory();
    } finally {
      setUpdating(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Yükleniyor...
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar activeTab="updates" onTabChange={() => { }} />

        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b flex items-center px-6 bg-background sticky top-0 z-10">
            <SidebarTrigger />
            <h1 className="text-2xl font-bold ml-4">Sistem Güncellemeleri</h1>
          </header>

          <main className="flex-1 p-6 overflow-auto">
            <div className="max-w-6xl mx-auto space-y-6">
              {/* Mevcut Versiyon */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Mevcut Versiyon</span>
                    <Badge variant="outline" className="text-lg px-4 py-1">
                      v{updateInfo?.currentVersion || "1.0.0"}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Sisteminizin şu anki versiyon bilgisi
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={checkForUpdates}
                    disabled={checking || updating}
                    className="w-full md:w-auto"
                  >
                    <RefreshCw className={`mr-2 h-4 w-4 ${checking ? "animate-spin" : ""}`} />
                    {checking ? "Kontrol Ediliyor..." : "Güncelleme Kontrolü Yap"}
                  </Button>
                </CardContent>
              </Card>

              {/* Güncelleme Bilgisi */}
              {updateInfo?.updateAvailable && (
                <Card className="border-primary">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Download className="h-5 w-5" />
                      Yeni Güncelleme Mevcut!
                      {updateInfo.isCritical && (
                        <Badge variant="destructive">Kritik</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      Versiyon {updateInfo.latestVersion} •{" "}
                      {new Date(updateInfo.releaseDate || "").toLocaleDateString("tr-TR")} •{" "}
                      Tahmini Süre: {updateInfo.estimatedTime}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {updateInfo.isCritical && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          Bu kritik bir güncelleme! Güvenlik ve kararlılık için en kısa sürede
                          güncellemeniz önerilir.
                        </AlertDescription>
                      </Alert>
                    )}

                    <div>
                      <h3 className="font-semibold mb-2">Değişiklikler:</h3>
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown>{updateInfo.changelog || ""}</ReactMarkdown>
                      </div>
                    </div>

                    <Separator />

                    <Button
                      onClick={() => setShowConfirmDialog(true)}
                      disabled={updating}
                      className="w-full"
                      size="lg"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      {updating ? "Güncelleme Uygulanıyor..." : "Güncellemeyi Uygula"}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {updateInfo?.error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{updateInfo.error}</AlertDescription>
                </Alert>
              )}

              {/* Güncelleme Geçmişi */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Güncelleme Geçmişi
                  </CardTitle>
                  <CardDescription>
                    Son yapılan güncelleme işlemleri
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {updateHistory.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      Henüz güncelleme işlemi yapılmamış.
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Eski Versiyon</TableHead>
                          <TableHead>Yeni Versiyon</TableHead>
                          <TableHead>Durum</TableHead>
                          <TableHead>Tarih</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {updateHistory.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.from_version}</TableCell>
                            <TableCell>{item.to_version}</TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  item.status === "completed"
                                    ? "default"
                                    : item.status === "failed"
                                      ? "destructive"
                                      : "secondary"
                                }
                              >
                                {item.status === "completed" && <CheckCircle className="mr-1 h-3 w-3" />}
                                {item.status === "failed" && <AlertTriangle className="mr-1 h-3 w-3" />}
                                {item.status === "in_progress" && <Clock className="mr-1 h-3 w-3" />}
                                {item.status === "completed"
                                  ? "Başarılı"
                                  : item.status === "failed"
                                    ? "Başarısız"
                                    : item.status === "rolled_back"
                                      ? "Geri Alındı"
                                      : "Devam Ediyor"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {new Date(item.started_at).toLocaleString("tr-TR")}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>

      {/* Onay Dialogu */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Güncellemeyi Onayla</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Sisteminiz <strong>v{updateInfo?.currentVersion}</strong> versiyonundan{" "}
                <strong>v{updateInfo?.latestVersion}</strong> versiyonuna güncellenecek.
              </p>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Önemli:</strong> Güncelleme sırasında:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Tüm kullanıcı ayarları korunacak</li>
                    <li>Mevcut siparişler ve veriler etkilenmeyecek</li>
                    <li>Otomatik yedekleme alınacak</li>
                    <li>Hata durumunda otomatik geri alma yapılacak</li>
                  </ul>
                </AlertDescription>
              </Alert>
              <p className="text-sm">
                Tahmini süre: <strong>{updateInfo?.estimatedTime}</strong>
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={applyUpdate}>
              Güncellemeyi Başlat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  );
}