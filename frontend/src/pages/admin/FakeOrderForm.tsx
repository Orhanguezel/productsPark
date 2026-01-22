// =============================================================
// FILE: src/pages/admin/fake-orders/FakeOrderForm.tsx
// =============================================================
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import {
  useGetFakeOrderNotificationQuery,
  useCreateFakeOrderNotificationMutation,
  useUpdateFakeOrderNotificationMutation,
} from "@/integrations/hooks";

type FormState = {
  product_name: string;
  customer: string;
  location: string | null;
  time_ago: string;
  is_active: boolean;
};

const EMPTY: FormState = {
  product_name: "",
  customer: "",
  location: "",
  time_ago: "3 dakika önce",
  is_active: true,
};

export default function FakeOrderForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const nav = useNavigate();

  const [form, setForm] = useState<FormState>(EMPTY);

  // Edit modundaysa kaydı çek
  const { data: row, isLoading: fetching } = useGetFakeOrderNotificationQuery(id as string, {
    skip: !isEdit,
  });

  const [createFn, { isLoading: creating }] = useCreateFakeOrderNotificationMutation();
  const [updateFn, { isLoading: updating }] = useUpdateFakeOrderNotificationMutation();
  const saving = creating || updating;

  useEffect(() => {
    if (row && isEdit) {
      setForm({
        product_name: row.product_name,
        customer: row.customer,
        location: row.location ?? "",
        time_ago: row.time_ago,
        is_active: row.is_active,
      });
    }
  }, [row, isEdit]);

  const title = useMemo(
    () => (isEdit ? "Fake Sipariş Düzenle" : "Yeni Fake Sipariş"),
    [isEdit]
  );

  const onChange = (key: keyof FormState, val: unknown) => {
    setForm((s) => ({ ...s, [key]: val as never }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      product_name: form.product_name.trim(),
      customer: form.customer.trim(),
      location: form.location ? String(form.location).trim() : null,
      time_ago: form.time_ago.trim(),
      is_active: !!form.is_active,
    };

    if (!payload.product_name) {
      toast.error("Ürün adı zorunlu");
      return;
    }
    if (!payload.customer) {
      toast.error("Müşteri adı zorunlu");
      return;
    }
    if (!payload.time_ago) {
      toast.error("Zaman bilgisi zorunlu (örn: 3 dakika önce)");
      return;
    }

    try {
      if (isEdit && id) {
        await updateFn({ id, patch: payload }).unwrap();
        toast.success("Kayıt güncellendi");
      } else {
        await createFn(payload).unwrap();
        toast.success("Kayıt oluşturuldu");
      }
      nav("/admin/fake-orders");
    } catch (err) {
      console.error(err);
      toast.error("Kaydetme sırasında bir hata oluştu");
    }
  };

  return (
    <AdminLayout title={title}>
      <form onSubmit={onSubmit}>
        <div className="mb-4">
          <Button type="button" variant="ghost" size="sm" onClick={() => nav(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Geri
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {fetching && isEdit ? (
              <div>Yükleniyor...</div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="product_name">Ürün Adı *</Label>
                  <Input
                    id="product_name"
                    value={form.product_name}
                    onChange={(e) => onChange("product_name", e.target.value)}
                    placeholder="Örn: Windows 11 Pro Lisans"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customer">Müşteri *</Label>
                  <Input
                    id="customer"
                    value={form.customer}
                    onChange={(e) => onChange("customer", e.target.value)}
                    placeholder="Örn: Ahmet Y."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Konum (opsiyonel)</Label>
                  <Input
                    id="location"
                    value={form.location ?? ""}
                    onChange={(e) => onChange("location", e.target.value)}
                    placeholder="İstanbul"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time_ago">Zaman Metni *</Label>
                  <Input
                    id="time_ago"
                    value={form.time_ago}
                    onChange={(e) => onChange("time_ago", e.target.value)}
                    placeholder="3 dakika önce"
                    required
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={form.is_active}
                    onCheckedChange={(v) => onChange("is_active", v)}
                  />
                  <Label htmlFor="is_active">Aktif</Label>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="submit" disabled={saving}>
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? "Kaydediliyor..." : "Kaydet"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => nav("/admin/fake-orders")}>
                    İptal
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </form>
    </AdminLayout>
  );
}
