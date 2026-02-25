// src/components/admin/ApiProviderManagement.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, RefreshCw, List } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  useListApiProvidersQuery,
  useDeleteApiProviderMutation,
  useUpdateApiProviderMutation,
  useCheckApiProviderBalanceMutation,
  useLazyListApiProviderServicesQuery,
} from "@/integrations/hooks";
import type { ApiProviderBalanceResponse } from "@/integrations/types";

export const ApiProviderManagement = () => {
  const navigate = useNavigate();

  const { data: providers, isLoading, refetch } = useListApiProvidersQuery({
    orderBy: { field: "created_at", asc: false },
  });

  const [deleteProvider] = useDeleteApiProviderMutation();
  const [updateProvider] = useUpdateApiProviderMutation();
  const [checkBalance, { isLoading: checking }] =
    useCheckApiProviderBalanceMutation();
  const [fetchServices, { isLoading: loadingServices }] =
    useLazyListApiProviderServicesQuery();

  const [servicesDialog, setServicesDialog] = useState<{
    open: boolean;
    providerName: string;
    services: Array<{ service: number; name: string; type: string; rate: string; min: string; max: string; category: string }>;
  }>({ open: false, providerName: '', services: [] });

  const [serviceSearch, setServiceSearch] = useState('');

  const handleDelete = async (id: string) => {
    if (!confirm("API sağlayıcıyı silmek istediğinizden emin misiniz?")) return;
    try {
      await deleteProvider(id).unwrap();
      toast({ title: "Başarılı", description: "API sağlayıcı silindi" });
      refetch();
    } catch (e) {
      console.error(e);
      toast({
        title: "Hata",
        description: "Silme işlemi başarısız",
        variant: "destructive",
      });
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    try {
      await updateProvider({ id, patch: { is_active: !current } }).unwrap();
      refetch();
    } catch (e) {
      console.error(e);
      toast({
        title: "Hata",
        description: "Durum güncellenemedi",
        variant: "destructive",
      });
    }
  };

  const refreshBalance = async (providerId: string) => {
    try {
      const r: ApiProviderBalanceResponse = await checkBalance({
        id: providerId,
      }).unwrap();

      toast({
        title: "Bakiye Güncellendi",
        description: `Yeni bakiye: ${r.balance ?? 0} ${r.currency ?? ""}`,
      });
      refetch();
    } catch (e: any) {
      // RTK error shape: { status, data }
      const msgKey = e?.data?.message ?? "";

      // User-friendly messages for known error keys
      const friendlyMessages: Record<string, string> = {
        provider_blocked_by_waf: "Sağlayıcı Cloudflare WAF tarafından engelleniyor. Sunucu IP adresinin sağlayıcı tarafından beyaz listeye alınması gerekiyor.",
        bad_provider_response: "Sağlayıcıdan geçersiz yanıt alındı.",
        missing_credentials: "Sağlayıcı kimlik bilgileri eksik.",
        provider_error: e?.data?.error ? `Sağlayıcı hatası: ${String(e.data.error).slice(0, 150)}` : "Sağlayıcı hatası.",
      };

      const description = friendlyMessages[msgKey] ?? msgKey || "Bilinmeyen hata";

      console.error("Error refreshing balance:", e);
      toast({
        title: "Bakiye Alınamadı",
        description,
        variant: "destructive",
      });
    }
  };

  const handleShowServices = async (providerId: string, providerName: string) => {
    try {
      const result = await fetchServices({ id: providerId }).unwrap();
      setServicesDialog({
        open: true,
        providerName,
        services: result.services ?? [],
      });
      setServiceSearch('');
    } catch (e: any) {
      const msg = e?.data?.message ?? 'Servis listesi alınamadı';
      toast({ title: 'Hata', description: msg, variant: 'destructive' });
    }
  };

  const filteredServices = servicesDialog.services.filter((s) => {
    if (!serviceSearch.trim()) return true;
    const q = serviceSearch.toLowerCase();
    return (
      String(s.service).includes(q) ||
      s.name?.toLowerCase().includes(q) ||
      s.category?.toLowerCase().includes(q)
    );
  });

  if (isLoading) return <div>Yükleniyor...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">SMM Panel API Yönetimi</h3>
        <Button onClick={() => navigate("/admin/api-providers/new")}>
          <Plus className="w-4 h-4 mr-2" />
          Yeni Sağlayıcı Ekle
        </Button>
      </div>

      {!providers?.length ? (
        <div className="text-center py-12 border rounded-lg">
          <p className="text-muted-foreground mb-4">
            Henüz SMM API sağlayıcı eklenmemiş
          </p>
          <Button onClick={() => navigate("/admin/api-providers/new")}>
            <Plus className="w-4 h-4 mr-2" />
            İlk Sağlayıcıyı Ekle
          </Button>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sağlayıcı Adı</TableHead>
              <TableHead>API URL</TableHead>
              <TableHead>Bakiye</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {providers.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {p.api_url}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {(p.balance ?? 0).toFixed(2)} {p.currency ?? "USD"}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => refreshBalance(p.id)}
                      disabled={checking}
                    >
                      <RefreshCw
                        className={`w-4 h-4 ${checking ? "animate-spin" : ""
                          }`}
                      />
                    </Button>
                  </div>
                  {p.last_balance_check && (
                    <div className="text-xs text-muted-foreground">
                      Son güncelleme:{" "}
                      {new Date(p.last_balance_check).toLocaleString("tr-TR")}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <Switch
                    checked={p.is_active}
                    onCheckedChange={() => toggleActive(p.id, p.is_active)}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleShowServices(p.id, p.name)}
                      disabled={loadingServices}
                      title="Servisleri Gör"
                    >
                      <List className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        navigate(`/admin/api-providers/edit/${p.id}`)
                      }
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(p.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={servicesDialog.open} onOpenChange={(open) => setServicesDialog((s) => ({ ...s, open }))}>
        <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{servicesDialog.providerName} — Servisler</DialogTitle>
          </DialogHeader>

          <Input
            placeholder="Servis ara (ID, isim veya kategori)..."
            value={serviceSearch}
            onChange={(e) => setServiceSearch(e.target.value)}
            className="mb-2"
          />

          <div className="overflow-auto flex-1">
            {filteredServices.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                {servicesDialog.services.length === 0 ? 'Servis bulunamadı' : 'Arama sonucu yok'}
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">ID</TableHead>
                    <TableHead>Servis Adı</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead className="w-24">Fiyat</TableHead>
                    <TableHead className="w-20">Min</TableHead>
                    <TableHead className="w-20">Max</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredServices.slice(0, 200).map((s) => (
                    <TableRow key={s.service}>
                      <TableCell className="font-mono text-xs">{s.service}</TableCell>
                      <TableCell className="text-sm">{s.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{s.category}</TableCell>
                      <TableCell className="text-sm">{s.rate}</TableCell>
                      <TableCell className="text-sm">{s.min}</TableCell>
                      <TableCell className="text-sm">{s.max}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            {filteredServices.length > 200 && (
              <p className="text-xs text-muted-foreground text-center py-2">
                {filteredServices.length} sonuçtan ilk 200 gösteriliyor
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
