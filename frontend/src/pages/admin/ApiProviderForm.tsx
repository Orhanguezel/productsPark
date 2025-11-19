// src/pages/admin/ApiProviderForm.tsx

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  useGetApiProviderQuery,
  useCreateApiProviderMutation,
  useUpdateApiProviderMutation,
} from "@/integrations/metahub/rtk/endpoints/admin/api_providers.endpoints";

export default function ApiProviderForm() {
  const { id } = useParams();
  const navigate = useNavigate();

  // RTK hooks
  const { data: provider, isLoading: loadingProvider } = useGetApiProviderQuery(id as string, {
    skip: !id,
  });
  const [createProvider, { isLoading: creating }] = useCreateApiProviderMutation();
  const [updateProvider, { isLoading: updating }] = useUpdateApiProviderMutation();

  const [formData, setFormData] = useState({
    name: "",
    api_url: "",
    api_key: "",
    is_active: true,
  });

  // id varsa formu hydrate et
  useEffect(() => {
    if (provider) {
      setFormData({
        name: provider.name ?? "",
        api_url: provider.api_url ?? "",
        api_key: provider.api_key ?? "",
        is_active: provider.is_active ?? true,
      });
    }
  }, [provider]);

  const loading = loadingProvider || creating || updating;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload = {
        name: formData.name,
        api_url: formData.api_url,
        api_key: formData.api_key,
        provider_type: "smm", // default
        is_active: formData.is_active,
      };

      if (id) {
        await updateProvider({ id, patch: payload }).unwrap();
        toast({ title: "Başarılı", description: "API sağlayıcı güncellendi." });
      } else {
        await createProvider(payload).unwrap();
        toast({ title: "Başarılı", description: "API sağlayıcı eklendi." });
      }

      navigate("/admin/api-providers");
    } catch (error) {
      console.error("Error saving provider:", error);
      toast({
        title: "Hata",
        description: "API sağlayıcı kaydedilirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  return (
    <AdminLayout title={id ? "API Sağlayıcı Düzenle" : "Yeni API Sağlayıcı Ekle"}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin/api-providers")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Geri
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>API Sağlayıcı Bilgileri</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Sağlayıcı Adı *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Örn: Perfect Panel API"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="api_url">API URL *</Label>
                <Input
                  id="api_url"
                  type="url"
                  value={formData.api_url}
                  onChange={(e) => setFormData({ ...formData, api_url: e.target.value })}
                  placeholder="https://api.example.com/v2"
                  required
                />
                <p className="text-xs text-muted-foreground">SMM panel API endpoint URL'i</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="api_key">API Key *</Label>
                <Input
                  id="api_key"
                  type="password"
                  value={formData.api_key}
                  onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                  placeholder="API anahtarınızı girin"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  SMM panel tarafından sağlanan API anahtarı
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Aktif</Label>
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={loading}>
                  {loading ? "Kaydediliyor..." : id ? "Güncelle" : "Ekle"}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate("/admin/api-providers")}>
                  İptal
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bilgilendirme</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">SMM API Entegrasyonu</h4>
              <p className="text-sm text-muted-foreground mb-2">
                Sistem Perfect Panel benzeri SMM API’lerle uyumludur:
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>POST ile sipariş (action=add)</li>
                <li>Durum sorgu (action=status)</li>
                <li>Service ID ile ürün eşleştirme</li>
                <li>link / quantity parametreleri</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Nasıl Kullanılır?</h4>
              <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
                <li>Sağlayıcıyı burada ekleyin</li>
                <li>Üründe “API Entegrasyonu” teslimat tipini seçin</li>
                <li>Sağlayıcı + API service ID’yi girin</li>
                <li>Ürüne “Link/URL” custom field ekleyin</li>
                <li>Siparişler otomatik API’ye gider</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
