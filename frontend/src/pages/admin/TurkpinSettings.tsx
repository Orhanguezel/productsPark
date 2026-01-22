import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, RefreshCw, Save } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";

import {
  useListApiProvidersQuery,
  useCreateApiProviderMutation,
  useUpdateApiProviderMutation,
  useTurkpinBalanceMutation
} from "@/integrations/hooks";

const TurkpinSettings = () => {
  const [createProvider] = useCreateApiProviderMutation();
  const [updateProvider] = useUpdateApiProviderMutation();
  const [turkpinBalanceMutation] = useTurkpinBalanceMutation();

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

  const { data: providers, isLoading, refetch } = useListApiProvidersQuery({
    orderBy: { field: "name", asc: true },
  });

  const turkpin = (providers || []).find(
    (p) => p.name.toLowerCase() === "turkpin"
  );

  useEffect(() => {
    if (turkpin) {
      setFormData((prev) => ({
        ...prev,
        id: turkpin.id,
        name: turkpin.name,
        api_url: turkpin.api_url || "https://www.turkpin.net/api.php",
        api_key: turkpin.api_key || "",
        provider_type: "epin",
        is_active: turkpin.is_active,
        balance: Number(turkpin.balance ?? 0),
        currency: turkpin.currency ?? "TRY",
        username: (turkpin.api_key ?? "").split(":")[0] || "",
      }));
    }
  }, [turkpin]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        name: "Turkpin",
        provider_type: "epin",
        api_url: formData.api_url,
        api_key: formData.api_key,
        is_active: formData.is_active,
      };

      if (formData.id) {
        await updateProvider({ id: formData.id, patch: payload }).unwrap();
      } else {
        await createProvider(payload).unwrap();
      }

      toast({
        title: "Başarılı",
        description: "Turkpin ayarları kaydedildi",
      });
      refetch();
    } catch (e) {
      console.error(e);
      toast({
        title: "Hata",
        description: "Ayarlar kaydedilemedi",
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
      const result = await turkpinBalanceMutation({
        providerId: formData.id,
      }).unwrap();

      if (result?.success) {
        // local state’i de güncelle
        setFormData((prev) => ({
          ...prev,
          balance: result.balance ?? prev.balance,
          currency: result.currency ?? prev.currency,
        }));

        toast({
          title: "Başarılı",
          description: `Bakiye güncellendi: ${result.balance} ${result.currency}`,
        });
        refetch();
      } else {
        toast({
          title: "Hata",
          description: result?.error || "Bakiye güncellenemedi",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Balance refresh error:", err);
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
                {/* username / password -> api_key compose */}
                <div className="space-y-2">
                  <Label htmlFor="username">Kullanıcı Adı (E-posta)</Label>
                  <Input
                    id="username"
                    type="email"
                    value={formData.username}
                    onChange={(e) => {
                      const username = e.target.value;
                      setFormData((f) => ({
                        ...f,
                        username,
                        api_key: `${username}:${f.api_key.split(":")[1] || ""}`,
                      }));
                    }}
                    placeholder="api@turkpin.net"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Şifre</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.api_key.split(":")[1] || ""}
                    onChange={(e) => {
                      const password = e.target.value;
                      setFormData((f) => ({
                        ...f,
                        api_key: `${f.username}:${password}`,
                      }));
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
                    onChange={(e) =>
                      setFormData({ ...formData, api_url: e.target.value })
                    }
                    disabled
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_active: checked })
                    }
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
                      {turkpin?.last_balance_check && (
                        <p className="text-sm text-muted-foreground">
                          Son güncelleme:{" "}
                          {new Date(
                            turkpin.last_balance_check
                          ).toLocaleString("tr-TR")}
                        </p>
                      )}
                    </div>
                    <Button
                      onClick={refreshBalance}
                      disabled={refreshingBalance}
                      variant="outline"
                    >
                      <RefreshCw
                        className={`w-4 h-4 mr-2 ${
                          refreshingBalance ? "animate-spin" : ""
                        }`}
                      />
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
