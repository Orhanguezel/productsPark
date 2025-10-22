import { useState, useEffect } from "react";
import { metahub } from "@/integrations/metahub/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface TopbarData {
  id?: string;
  is_active: boolean;
  message: string;
  coupon_code?: string;
  link_url?: string;
  link_text?: string;
}

export const TopbarManagement = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<TopbarData>({
    is_active: true,
    message: "",
    coupon_code: "",
    link_url: "",
    link_text: "",
  });

  useEffect(() => {
    fetchTopbarSettings();
  }, []);

  const fetchTopbarSettings = async () => {
    const { data, error } = await metahub
      .from("topbar_settings")
      .select("*")
      .maybeSingle();

    if (error) {
      console.error("Error fetching topbar:", error);
      return;
    }

    if (data) {
      setFormData(data);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (formData.id) {
        // Update existing
        const { error } = await metahub
          .from("topbar_settings")
          .update({
            is_active: formData.is_active,
            message: formData.message,
            coupon_code: formData.coupon_code || null,
            link_url: formData.link_url || null,
            link_text: formData.link_text || null,
          })
          .eq("id", formData.id);

        if (error) throw error;
      } else {
        // Insert new
        const { data, error } = await metahub
          .from("topbar_settings")
          .insert([{
            is_active: formData.is_active,
            message: formData.message,
            coupon_code: formData.coupon_code || null,
            link_url: formData.link_url || null,
            link_text: formData.link_text || null,
          }])
          .select()
          .single();

        if (error) throw error;
        if (data) {
          setFormData({ ...formData, id: data.id });
        }
      }

      toast({
        title: "Başarılı",
        description: "Topbar ayarları kaydedildi",
      });
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Topbar Yönetimi</CardTitle>
        <CardDescription>
          Site genelinde gösterilecek üst duyuru çubuğunu yönetin
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <Label htmlFor="is_active">Aktif</Label>
          <Switch
            id="is_active"
            checked={formData.is_active}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, is_active: checked })
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="message">Mesaj *</Label>
          <Input
            id="message"
            value={formData.message}
            onChange={(e) =>
              setFormData({ ...formData, message: e.target.value })
            }
            placeholder="Örn: Yaz indirimi başladı! %50'ye varan indirimler"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="coupon_code">Kupon Kodu</Label>
          <Input
            id="coupon_code"
            value={formData.coupon_code}
            onChange={(e) =>
              setFormData({ ...formData, coupon_code: e.target.value })
            }
            placeholder="SUMMER50"
          />
          <p className="text-xs text-muted-foreground">
            Kullanıcılar kopyala butonuna tıklayarak kodu kopyalayabilir
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="link_url">Yönlendirme URL</Label>
            <Input
              id="link_url"
              value={formData.link_url}
              onChange={(e) =>
                setFormData({ ...formData, link_url: e.target.value })
              }
              placeholder="/products"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="link_text">Link Yazısı</Label>
            <Input
              id="link_text"
              value={formData.link_text}
              onChange={(e) =>
                setFormData({ ...formData, link_text: e.target.value })
              }
              placeholder="Hemen İncele"
            />
          </div>
        </div>

        <Button onClick={handleSave} disabled={loading}>
          {loading ? "Kaydediliyor..." : "Kaydet"}
        </Button>
      </CardContent>
    </Card>
  );
};
