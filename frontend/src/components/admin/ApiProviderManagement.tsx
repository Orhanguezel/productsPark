import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { metahub } from "@/integrations/metahub/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, RefreshCw } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";

interface ApiProvider {
  id: string;
  name: string;
  api_url: string;
  api_key: string;
  provider_type: string;
  is_active: boolean;
  created_at: string;
  balance?: number;
  currency?: string;
  last_balance_check?: string;
}

export const ApiProviderManagement = () => {
  const navigate = useNavigate();
  const [providers, setProviders] = useState<ApiProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshingBalance, setRefreshingBalance] = useState<string | null>(null);

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      const { data, error } = await metahub
        .from("api_providers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProviders(data || []);
    } catch (error) {
      console.error("Error fetching providers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("API sağlayıcıyı silmek istediğinizden emin misiniz?")) return;

    try {
      const { error } = await metahub
        .from("api_providers")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Başarılı", description: "API sağlayıcı silindi" });
      fetchProviders();
    } catch (error) {
      console.error("Error deleting provider:", error);
      toast({
        title: "Hata",
        description: "Silme işlemi sırasında bir hata oluştu",
        variant: "destructive",
      });
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await metahub
        .from("api_providers")
        .update({ is_active: !currentStatus })
        .eq("id", id);

      if (error) throw error;
      fetchProviders();
    } catch (error) {
      console.error("Error toggling status:", error);
    }
  };

  const refreshBalance = async (providerId: string, provider_type: string) => {
    setRefreshingBalance(providerId);
    try {
      const functionName = provider_type === 'smm' ? 'smm-api-balance' : 'turkpin-balance';
      const { data, error } = await metahub.functions.invoke(functionName, {
        body: { providerId },
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Bakiye Güncellendi",
          description: `Yeni bakiye: ${data.balance} ${data.currency}`,
        });
        fetchProviders();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Error refreshing balance:", error);
      toast({
        title: "Hata",
        description: "Bakiye güncellenirken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setRefreshingBalance(null);
    }
  };

  if (loading) return <div>Yükleniyor...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">SMM Panel API Yönetimi</h3>
        <Button onClick={() => navigate("/admin/api-providers/new")}>
          <Plus className="w-4 h-4 mr-2" />
          Yeni Sağlayıcı Ekle
        </Button>
      </div>

      {providers.length === 0 ? (
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
            {providers.map((provider) => (
              <TableRow key={provider.id}>
                <TableCell className="font-medium">{provider.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {provider.api_url}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {provider.balance?.toFixed(2) || '0.00'} {provider.currency || 'USD'}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => refreshBalance(provider.id, provider.provider_type)}
                      disabled={refreshingBalance === provider.id}
                    >
                      <RefreshCw className={`w-4 h-4 ${refreshingBalance === provider.id ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                  {provider.last_balance_check && (
                    <div className="text-xs text-muted-foreground">
                      Son güncelleme: {new Date(provider.last_balance_check).toLocaleString('tr-TR')}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <Switch
                    checked={provider.is_active}
                    onCheckedChange={() => toggleActive(provider.id, provider.is_active)}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/admin/api-providers/edit/${provider.id}`)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(provider.id)}
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
    </div>
  );
};