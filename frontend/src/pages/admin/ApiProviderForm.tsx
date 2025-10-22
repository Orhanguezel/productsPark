import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { metahub } from "@/integrations/metahub/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminLayout } from "@/components/admin/AdminLayout";

export default function ApiProviderForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    api_url: "",
    api_key: "",
    is_active: true,
  });

  useEffect(() => {
    if (id) {
      fetchProvider();
    }
  }, [id]);

  const fetchProvider = async () => {
    if (!id) return;

    try {
      const { data, error } = await metahub
        .from("api_providers")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      setFormData({
        name: data.name,
        api_url: data.api_url,
        api_key: data.api_key,
        is_active: data.is_active,
      });
    } catch (error) {
      console.error("Error fetching provider:", error);
      toast({
        title: "Hata",
        description: "API sağlayıcı yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const providerData = {
        name: formData.name,
        api_url: formData.api_url,
        api_key: formData.api_key,
        provider_type: "smm", // Sabit olarak SMM
        is_active: formData.is_active,
      };

      if (id) {
        const { error } = await metahub
          .from("api_providers")
          .update(providerData)
          .eq("id", id);

        if (error) throw error;
        toast({ title: "Başarılı", description: "API sağlayıcı güncellendi." });
      } else {
        const { error } = await metahub
          .from("api_providers")
          .insert([providerData]);

        if (error) throw error;
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
    } finally {
      setLoading(false);
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
                <p className="text-xs text-muted-foreground">
                  SMM panel API endpoint URL'i
                </p>
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
                  {loading ? "Kaydediliyor..." : (id ? "Güncelle" : "Ekle")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/admin/api-providers")}
                >
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
                Bu sistem Perfect Panel benzeri SMM API'leri ile uyumludur. API'nizin aşağıdaki özellikleri desteklediğinden emin olun:
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>POST metodu ile sipariş oluşturma (action=add)</li>
                <li>Sipariş durumu sorgulama (action=status)</li>
                <li>Service ID ile ürün tanımlama</li>
                <li>Link, quantity parametreleri</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Nasıl Kullanılır?</h4>
              <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
                <li>API sağlayıcısını buradan ekleyin</li>
                <li>Ürün eklerken/düzenlerken "Teslimat Tipi" olarak "API Entegrasyonu" seçin</li>
                <li>Bu sağlayıcıyı ve API ürün ID'sini seçin</li>
                <li>Ürüne "Link/URL" tipinde custom field ekleyin</li>
                <li>Siparişler otomatik olarak API'ye gönderilir</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}