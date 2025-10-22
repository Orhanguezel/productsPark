import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { metahub } from "@/integrations/metahub/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, RefreshCw, Save } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";

const TurkpinSettings = () => {
  const [saving, setSaving] = useState(false);
  const [refreshingBalance, setRefreshingBalance] = useState(false);
  const [formData, setFormData] = useState({
    id: "",
    name: "Turkpin",
    api_url: "https://www.turkpin.net/api.php",
    api_key: "",
    provider_type: "epin" as const,
    is_active: true,
    balance: 0,
    currency: "TRY",
    username: "",
  });


  const { data: provider, isLoading, refetch } = useQuery({
    queryKey: ["turkpin-provider"],
    queryFn: async () => {
      const { data, error } = await metahub
        .from("api_providers")
        .select("*")
        .eq("provider_type", "epin")
        .eq("name", "Turkpin")
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });

  useEffect(() => {
    if (provider) {
      setFormData({
        id: provider.id,
        name: provider.name,
        api_url: provider.api_url,
        api_key: provider.api_key,
        provider_type: "epin",
        is_active: provider.is_active,
        balance: provider.balance || 0,
        currency: provider.currency || "TRY",
        username: provider.api_key?.split(':')[0] || "",
      });
    }
  }, [provider]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const dataToSave = {
        name: formData.name,
        api_url: formData.api_url,
        api_key: formData.api_key,
        provider_type: formData.provider_type,
        is_active: formData.is_active,
      };

      if (formData.id) {
        const { error } = await metahub
          .from("api_providers")
          .update(dataToSave)
          .eq("id", formData.id);

        if (error) throw error;
      } else {
        const { error } = await metahub
          .from("api_providers")
          .insert([dataToSave]);

        if (error) throw error;
      }

      toast({
        title: "Başarılı",
        description: "Turkpin ayarları kaydedildi",
      });
      refetch();
    } catch (error) {
      console.error("Save error:", error);
      toast({
        title: "Hata",
        description: "Ayarlar kaydedilirken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };


  const refreshBalance = async () => {
    if (!formData.id) {
      toast({
        title: "Uyarı",
        description: "Önce Turkpin ayarlarını kaydedin",
        variant: "destructive",
      });
      return;
    }

    setRefreshingBalance(true);
    try {
      const { data, error } = await metahub.functions.invoke('turkpin-balance', {
        body: { providerId: formData.id }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Başarılı",
          description: `Bakiye güncellendi: ${data.balance} ${data.currency}`,
        });
        refetch();
      } else {
        toast({
          title: "Hata",
          description: data.error || "Bakiye güncellenemedi",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Balance refresh error:", error);
      toast({
        title: "Hata",
        description: "Bakiye güncellenirken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setRefreshingBalance(false);
    }
  };

  return (
    <AdminLayout title="Turkpin Ayarları">
      <div className="space-y-6">
        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle>API Bilgileri</CardTitle>
                <CardDescription>
                  Turkpin API bağlantı bilgilerini girin
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Kullanıcı Adı (E-posta)</Label>
                  <Input
                    id="username"
                    type="email"
                    value={formData.username}
                    onChange={(e) => {
                      const username = e.target.value;
                      setFormData({
                        ...formData,
                        username,
                        api_key: `${username}:${formData.api_key.split(':')[1] || ''}`
                      });
                    }}
                    placeholder="api@turkpin.net"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Şifre</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.api_key.split(':')[1] || ""}
                    onChange={(e) => {
                      const password = e.target.value;
                      setFormData({
                        ...formData,
                        api_key: `${formData.username}:${password}`
                      });
                    }}
                    placeholder="Turkpin şifreniz"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="api_url">API URL</Label>
                  <Input
                    id="api_url"
                    type="text"
                    value={formData.api_url}
                    onChange={(e) => setFormData({ ...formData, api_url: e.target.value })}
                    disabled
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Aktif</Label>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Kaydediliyor...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Kaydet
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {formData.id && (
              <Card>
                <CardHeader>
                  <CardTitle>Bakiye Bilgisi</CardTitle>
                  <CardDescription>
                    Turkpin hesap bakiyenizi görüntüleyin
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">
                        {formData.balance} {formData.currency}
                      </p>
                      {provider?.last_balance_check && (
                        <p className="text-sm text-muted-foreground">
                          Son güncelleme: {new Date(provider.last_balance_check).toLocaleString('tr-TR')}
                        </p>
                      )}
                    </div>
                    <Button
                      onClick={refreshBalance}
                      disabled={refreshingBalance}
                      variant="outline"
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${refreshingBalance ? 'animate-spin' : ''}`} />
                      Bakiyeyi Güncelle
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default TurkpinSettings;
