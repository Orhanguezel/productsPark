// src/components/admin/ApiProviderManagement.tsx
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, RefreshCw } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import {
  useListApiProvidersQuery,
  useDeleteApiProviderMutation,
  useUpdateApiProviderMutation,
  useCheckApiProviderBalanceMutation,
} from "@/integrations/metahub/rtk/endpoints/api_providers.endpoints";

export const ApiProviderManagement = () => {
  const navigate = useNavigate();

  const { data: providers, isLoading, refetch } = useListApiProvidersQuery(
    { orderBy: { field: "created_at", asc: false } }
  );
  const [deleteProvider] = useDeleteApiProviderMutation();
  const [updateProvider] = useUpdateApiProviderMutation();
  const [checkBalance, { isLoading: checking }] = useCheckApiProviderBalanceMutation();

  const handleDelete = async (id: string) => {
    if (!confirm("API sağlayıcıyı silmek istediğinizden emin misiniz?")) return;
    try {
      await deleteProvider(id).unwrap();
      toast({ title: "Başarılı", description: "API sağlayıcı silindi" });
    } catch (e) {
      console.error(e);
      toast({ title: "Hata", description: "Silme işlemi başarısız", variant: "destructive" });
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    try {
      await updateProvider({ id, patch: { is_active: !current } }).unwrap();
    } catch (e) {
      console.error(e);
      toast({ title: "Hata", description: "Durum güncellenemedi", variant: "destructive" });
    }
  };

  // inside refreshBalance
const refreshBalance = async (providerId: string) => {
  try {
    const r = await checkBalance({ id: providerId }).unwrap();
    toast({
      title: "Bakiye Güncellendi",
      description: `Yeni bakiye: ${r.balance ?? 0} ${r.currency ?? ""}`,
    });
    refetch();
  } catch (e: any) {
    // RTK error shape: { status, data }
    const msg = e?.data?.message ?? "Bilinmeyen hata";
    const raw = e?.data?.raw ? ` • Sağlayıcı: ${String(e.data.raw).slice(0,120)}` : "";
    const err = e?.data?.error ? ` • Hata: ${String(e.data.error).slice(0,120)}` : "";
    console.error("Error refreshing balance:", e);
    toast({
      title: "Hata",
      description: `${msg}${raw}${err}`,
      variant: "destructive",
    });
  }
};


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
          <p className="text-muted-foreground mb-4">Henüz SMM API sağlayıcı eklenmemiş</p>
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
                <TableCell className="text-sm text-muted-foreground">{p.api_url}</TableCell>
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
                      <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                  {p.last_balance_check && (
                    <div className="text-xs text-muted-foreground">
                      Son güncelleme: {new Date(p.last_balance_check).toLocaleString('tr-TR')}
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
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/api-providers/edit/${p.id}`)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(p.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};
