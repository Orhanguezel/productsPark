import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Tipler & RTK endpoint'leri
import type { TopbarSetting } from "@/integrations/metahub/rtk/types/topbar";
import type { Coupon } from "@/integrations/metahub/rtk/types/coupon";
import {
  useListTopbarAdminQuery,
  useCreateTopbarAdminMutation,
  useUpdateTopbarAdminMutation,
} from "@/integrations/metahub/rtk/endpoints/admin/topbar_admin.endpoints";
import { useListCouponsAdminQuery } from "@/integrations/metahub/rtk/endpoints/admin/coupons_admin.endpoints";

type FormState = {
  id?: string;
  is_active: boolean;
  show_ticker: boolean;
  message: string;
  coupon_id: string | null;
  link_url: string;
};

const defaultForm: FormState = {
  is_active: true,
  show_ticker: false,
  message: "",
  coupon_id: null,
  link_url: "",
};

export const TopbarManagement = () => {
  const { toast } = useToast();

  // Admin tarafı: tek bir topbar kaydı gibi davranıyoruz → limit: 1
  const {
    data: topbarList,
    isLoading: isTopbarLoading,
    refetch: refetchTopbar,
  } = useListTopbarAdminQuery({ limit: 1 });

  const [createTopbar, { isLoading: isCreating }] =
    useCreateTopbarAdminMutation();
  const [updateTopbar, { isLoading: isUpdating }] =
    useUpdateTopbarAdminMutation();

  // Kupon listesi (admin kupon modülünden)
  const {
    data: coupons = [],
    isLoading: isCouponsLoading,
  } = useListCouponsAdminQuery();

  const [formData, setFormData] = useState<FormState>(defaultForm);

  // İlk kayıt geldiyse formu doldur
  useEffect(() => {
    const first = (topbarList ?? [])[0] as TopbarSetting | undefined;
    if (!first) {
      setFormData(defaultForm);
      return;
    }

    setFormData({
      id: first.id,
      is_active: first.is_active,
      show_ticker: !!first.show_ticker,
      message: first.message ?? "",
      coupon_id: first.coupon_id ?? null,
      link_url: first.link_url ?? "",
    });
  }, [topbarList]);

  const saving = isCreating || isUpdating;
  const loading = isTopbarLoading || isCouponsLoading;

  const handleSave = async () => {
    if (!formData.message.trim()) {
      toast({
        title: "Uyarı",
        description: "Mesaj alanı boş bırakılamaz.",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      // UpsertTopbarBody
      message: formData.message,
      is_active: formData.is_active,
      show_ticker: formData.show_ticker,
      coupon_id: formData.coupon_id,
      link_url: formData.link_url || null,
      // link_text / coupon_code DB'de olmadığı için göndermiyoruz
    };

    try {
      if (formData.id) {
        // Güncelle
        await updateTopbar({ id: formData.id, body: payload }).unwrap();
      } else {
        // Oluştur
        const created = await createTopbar(payload).unwrap();
        // Oluşan kaydın id'sini local state'e al
        setFormData((prev) => ({ ...prev, id: created.id }));
      }

      toast({
        title: "Başarılı",
        description: "Topbar ayarları kaydedildi.",
      });

      refetchTopbar();
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Hata",
        description: error?.message ?? "Topbar kaydedilirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  if (loading && !formData.id && !formData.message) {
    return <div>Yükleniyor...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Topbar Yönetimi</CardTitle>
        <CardDescription>
          Site genelinde gösterilecek üst duyuru çubuğunu yönetin.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Aktif / ticker switch'leri */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="is_active">Aktif</Label>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) =>
                setFormData((s) => ({ ...s, is_active: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="show_ticker">Yazı Kayan Şerit (ticker)</Label>
            <Switch
              id="show_ticker"
              checked={formData.show_ticker}
              onCheckedChange={(checked) =>
                setFormData((s) => ({ ...s, show_ticker: checked }))
              }
            />
          </div>
        </div>

        {/* Mesaj */}
        <div className="space-y-2">
          <Label htmlFor="message">Mesaj *</Label>
          <Input
            id="message"
            value={formData.message}
            onChange={(e) =>
              setFormData((s) => ({ ...s, message: e.target.value }))
            }
            placeholder="Örn: Yaz indirimi başladı! %50'ye varan indirimler"
          />
        </div>

        {/* Kupon seçimi (coupon_id ilişkisi) */}
        <div className="space-y-2">
          <Label htmlFor="coupon_id">Bağlı Kupon</Label>
          <Select
            value={formData.coupon_id ?? ""}
            onValueChange={(value) =>
              setFormData((s) => ({
                ...s,
                coupon_id: value === "" ? null : value,
              }))
            }
          >
            <SelectTrigger id="coupon_id">
              <SelectValue placeholder="Kupon seç (opsiyonel)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Kupon yok</SelectItem>
              {coupons.map((c: Coupon) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.code}{" "}
                  {c.discount_type === "percentage"
                    ? `(%${c.discount_value})`
                    : `(${c.discount_value} ₺)`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Burada seçilen kupon ID’si, topbar’da gösterilecek ve kullanıcıya
            önerilecek kuponla ilişkilendirilir.
          </p>
        </div>

        {/* Link alanları */}
        <div className="space-y-2">
          <Label htmlFor="link_url">Yönlendirme URL</Label>
          <Input
            id="link_url"
            value={formData.link_url}
            onChange={(e) =>
              setFormData((s) => ({ ...s, link_url: e.target.value }))
            }
            placeholder="/products"
          />
          <p className="text-xs text-muted-foreground">
            Topbar&apos;a tıklayan kullanıcı bu adrese yönlendirilir.
          </p>
        </div>

        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Kaydediliyor..." : "Kaydet"}
        </Button>
      </CardContent>
    </Card>
  );
};
