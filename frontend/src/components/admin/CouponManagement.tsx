// =============================================================
// FILE: src/components/admin/AdminPanel/CouponManagement.tsx
// =============================================================

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  useListCouponsAdminQuery,
  useCreateCouponAdminMutation,
  useUpdateCouponAdminMutation,
  useDeleteCouponAdminMutation,
} from "@/integrations/metahub/rtk/endpoints/admin/coupons_admin.endpoints";
import type {
  Coupon,
  DiscountType,
  CreateCouponBody,
} from "@/integrations/metahub/rtk/types/coupon";

type FormState = {
  code: string;
  title: string;
  content_html: string;
  discount_type: DiscountType;
  discount_value: number;
  min_purchase: number;
  max_uses: number | null;
  valid_from: string; // YYYY-MM-DD
  valid_until: string | null; // YYYY-MM-DD | null
  is_active: boolean;
};

const todayStr = () => new Date().toISOString().split("T")[0];

const makeDefaultForm = (): FormState => ({
  code: "",
  title: "",
  content_html: "",
  discount_type: "percentage",
  discount_value: 0,
  min_purchase: 0,
  max_uses: null,
  valid_from: todayStr(),
  valid_until: null,
  is_active: true,
});

export function CouponManagement() {
  const { data: coupons = [], isLoading, refetch } =
    useListCouponsAdminQuery();
  const [createCoupon, { isLoading: isCreating }] =
    useCreateCouponAdminMutation();
  const [updateCoupon, { isLoading: isUpdating }] =
    useUpdateCouponAdminMutation();
  const [deleteCoupon, { isLoading: isDeleting }] =
    useDeleteCouponAdminMutation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState<FormState>(makeDefaultForm);

  const saving = isCreating || isUpdating;

  const resetForm = () => {
    setEditingCoupon(null);
    setFormData(makeDefaultForm());
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code ?? "",
      title: coupon.title ?? "",
      content_html: coupon.content_html ?? "",
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      min_purchase: coupon.min_purchase,
      max_uses: coupon.max_uses ?? null,
      valid_from: coupon.valid_from
        ? coupon.valid_from.split("T")[0]
        : todayStr(),
      valid_until: coupon.valid_until
        ? coupon.valid_until.split("T")[0]
        : null,
      is_active: coupon.is_active,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu kuponu silmek istediğinizden emin misiniz?")) return;
    try {
      await deleteCoupon(id).unwrap();
      toast.success("Kupon silindi");
      refetch();
    } catch (err) {
      console.error(err);
      toast.error("Kupon silinemedi");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const discountValue = Number(formData.discount_value) || 0;
    const minPurchase = Number(formData.min_purchase) || 0;

    const payload: CreateCouponBody = {
      code: formData.code.trim(),
      title: formData.title.trim() || null,
      content_html: formData.content_html.trim() || null,
      discount_type: formData.discount_type,
      discount_value: discountValue,
      min_purchase: minPurchase,
      max_discount: null,
      usage_limit: formData.max_uses ?? null,
      valid_from: formData.valid_from || null,
      valid_until: formData.valid_until || null,
      is_active: formData.is_active,
      // Bu inline yönetim “tüm site” kuponları için
      applicable_to: "all",
      category_ids: null,
      product_ids: null,
    };

    try {
      if (editingCoupon) {
        await updateCoupon({ id: editingCoupon.id, body: payload }).unwrap();
        toast.success("Kupon güncellendi");
      } else {
        await createCoupon(payload).unwrap();
        toast.success("Kupon eklendi");
      }
      setDialogOpen(false);
      resetForm();
      refetch();
    } catch (err) {
      console.error(err);
      toast.error(
        editingCoupon ? "Kupon güncellenemedi" : "Kupon eklenemedi",
      );
    }
  };

  if (isLoading) {
    return <div>Yükleniyor...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Kupon Yönetimi</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                resetForm();
                setDialogOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Yeni Kupon
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCoupon ? "Kupon Düzenle" : "Yeni Kupon Ekle"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Başlık & içerik metni */}
              <div className="space-y-2">
                <Label htmlFor="title">Kupon Başlığı</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Örn: İlk sipariş indirimi"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content_html">İçerik / Açıklama</Label>
                <Textarea
                  id="content_html"
                  rows={3}
                  value={formData.content_html}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      content_html: e.target.value,
                    })
                  }
                  placeholder="Sipariş özetinde gösterilecek metni yazın."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Kupon Kodu *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        code: e.target.value.toUpperCase(),
                      })
                    }
                    required
                    placeholder="SUMMER2025"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discount_type">İndirim Türü</Label>
                  <Select
                    value={formData.discount_type}
                    onValueChange={(value: DiscountType) =>
                      setFormData({ ...formData, discount_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Yüzde (%)</SelectItem>
                      <SelectItem value="fixed">Sabit Tutar (₺)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discount_value">
                    İndirim Değeri *
                    {formData.discount_type === "percentage" && " (%)"}
                    {formData.discount_type === "fixed" && " (₺)"}
                  </Label>
                  <Input
                    id="discount_value"
                    type="number"
                    value={formData.discount_value}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discount_value: parseFloat(e.target.value || "0"),
                      })
                    }
                    required
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="min_purchase">Minimum Alışveriş (₺)</Label>
                  <Input
                    id="min_purchase"
                    type="number"
                    value={formData.min_purchase}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        min_purchase: parseFloat(e.target.value || "0"),
                      })
                    }
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_uses">
                    Maksimum Kullanım (boş = sınırsız)
                  </Label>
                  <Input
                    id="max_uses"
                    type="number"
                    value={formData.max_uses ?? ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        max_uses: e.target.value
                          ? parseInt(e.target.value, 10)
                          : null,
                      })
                    }
                    min="1"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valid_from">Başlangıç Tarihi</Label>
                  <Input
                    id="valid_from"
                    type="date"
                    value={formData.valid_from}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        valid_from: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valid_until">
                    Bitiş Tarihi (boş = süresiz)
                  </Label>
                  <Input
                    id="valid_until"
                    type="date"
                    value={formData.valid_until ?? ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        valid_until: e.target.value || null,
                      })
                    }
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
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false);
                  }}
                >
                  İptal
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving
                    ? "Kaydediliyor..."
                    : editingCoupon
                      ? "Güncelle"
                      : "Ekle"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Kod</TableHead>
            <TableHead>İndirim</TableHead>
            <TableHead>Min. Alışveriş</TableHead>
            <TableHead>Kullanım</TableHead>
            <TableHead>Geçerlilik</TableHead>
            <TableHead>Durum</TableHead>
            <TableHead>İşlemler</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {coupons.map((coupon) => (
            <TableRow key={coupon.id}>
              <TableCell className="font-mono font-bold">
                {coupon.code}
              </TableCell>
              <TableCell>
                {coupon.discount_type === "percentage"
                  ? `%${coupon.discount_value}`
                  : `₺${coupon.discount_value}`}
              </TableCell>
              <TableCell>₺{coupon.min_purchase}</TableCell>
              <TableCell>
                {coupon.used_count ?? 0}
                {coupon.max_uses ? ` / ${coupon.max_uses}` : " / ∞"}
              </TableCell>
              <TableCell>
                <div className="text-xs">
                  {coupon.valid_from
                    ? new Date(
                      coupon.valid_from,
                    ).toLocaleDateString("tr-TR")
                    : "-"}
                  {coupon.valid_until && (
                    <>
                      {" - "}
                      {new Date(
                        coupon.valid_until,
                      ).toLocaleDateString("tr-TR")}
                    </>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <span
                  className={`px-2 py-1 rounded text-xs ${coupon.is_active
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                    }`}
                >
                  {coupon.is_active ? "Aktif" : "Pasif"}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(coupon)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(coupon.id)}
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {coupons.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8">
                Kupon bulunamadı.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
