import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
// NOT: Kupon CRUD artık RTK üzerinden
import {
  useGetCouponAdminByIdQuery,
  useCreateCouponAdminMutation,
  useUpdateCouponAdminMutation,
} from "@/integrations/metahub/rtk/endpoints/admin/coupons_admin.endpoints";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Checkbox } from "@/components/ui/checkbox";

// Kategori/Ürün listesi için hâlâ mevcut datayı kullanıyorsan bu iki import'u koruyabilirsin.
// İstersen bunları da RTK'ya taşıyabiliriz.
import { metahub } from "@/integrations/metahub/client";

type DiscountType = "percentage" | "fixed";
type Scope = "all" | "category" | "product";

interface Category { id: string; name: string; }
interface Product  { id: string; name: string; }

type FormState = {
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  min_purchase: number;
  max_uses: number | null;          // UI alan adı
  valid_from: string;               // YYYY-MM-DD
  valid_until: string | null;       // YYYY-MM-DD | null
  is_active: boolean;
  applicable_to: Scope;
  category_ids: string[];
  product_ids: string[];
};

const todayStr = () => new Date().toISOString().split("T")[0];

const defaults: FormState = {
  code: "",
  discount_type: "percentage",
  discount_value: 0,
  min_purchase: 0,
  max_uses: null,
  valid_from: todayStr(),
  valid_until: null,
  is_active: true,
  applicable_to: "all",
  category_ids: [],
  product_ids: [],
};

export default function CouponForm() {
  const { id } = useParams<{ id?: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();

  // RTK hooks
  const { data, isFetching, isLoading, isSuccess } = useGetCouponAdminByIdQuery(id!, {
    skip: !isEdit,
    refetchOnMountOrArgChange: true,
  });
  const [createCoupon, { isLoading: isCreating }] = useCreateCouponAdminMutation();
  const [updateCoupon, { isLoading: isUpdating }] = useUpdateCouponAdminMutation();

  // Kategori/ürün (opsiyonel)
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [formData, setFormData] = useState<FormState>(defaults);
  const saving = isCreating || isUpdating;

  // Opsiyonel: kategori/ürünleri doldur
  useEffect(() => {
    (async () => {
      const [cats, prods] = await Promise.all([
        metahub.from("categories").select("id, name").order("name"),
        metahub.from("products").select("id, name").order("name"),
      ]);
      if (!cats.error) setCategories(cats.data || []);
      if (!prods.error) setProducts(prods.data || []);
    })();
  }, []);

  // Edit modunda formu doldur
  useEffect(() => {
    if (!isEdit) { setFormData(defaults); return; }
    if (isFetching || isLoading) return;
    if (isSuccess && data) {
      setFormData({
        code: data.code ?? "",
        discount_type: data.discount_type ?? "percentage",
        discount_value: Number(data.discount_value ?? 0),
        min_purchase: Number(data.min_purchase ?? 0),
        max_uses: data.max_uses ?? null,
        valid_from: data.valid_from ? new Date(data.valid_from).toISOString().split("T")[0] : todayStr(),
        valid_until: data.valid_until ? new Date(data.valid_until).toISOString().split("T")[0] : null,
        is_active: !!data.is_active,
        applicable_to: (data.applicable_to as Scope) ?? "all",
        category_ids: data.category_ids ?? [],
        product_ids: data.product_ids ?? [],
      });
    }
  }, [isEdit, isFetching, isLoading, isSuccess, data]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // RTK admin API payload (backend `usage_limit` bekliyor)
    const payload = {
      code: formData.code.trim(),
      discount_type: formData.discount_type,
      discount_value: Number(formData.discount_value),
      min_purchase: Number.isFinite(formData.min_purchase) ? formData.min_purchase : 0,
      usage_limit: formData.max_uses ?? null,
      valid_from: formData.valid_from || null,       // "YYYY-MM-DD" string
      valid_until: formData.valid_until || null,     // "YYYY-MM-DD" string | null
      is_active: formData.is_active,
      // BE şu an ignore ediyor ama geleceğe hazır:
      applicable_to: formData.applicable_to,
      category_ids: formData.category_ids.length ? formData.category_ids : null,
      product_ids: formData.product_ids.length ? formData.product_ids : null,
    };

    try {
      if (isEdit && id) {
        await updateCoupon({ id, body: payload }).unwrap();
        toast.success("Kupon güncellendi");
      } else {
        await createCoupon(payload).unwrap();
        toast.success("Kupon oluşturuldu");
      }
      navigate("/admin/coupons");
    } catch (err: unknown) {
      console.error(err);
      toast.error("Kupon kaydedilemedi");
    }
  };

  return (
    <AdminLayout title={isEdit ? "Kupon Düzenle" : "Yeni Kupon Ekle"}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin/coupons")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Geri
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Kupon Bilgileri</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Kupon Kodu *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
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
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Yüzde (%)</SelectItem>
                      <SelectItem value="fixed">Sabit Tutar (₺)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discount_value">
                    İndirim Değeri * {formData.discount_type === "percentage" ? "(%)" : "(₺)"}
                  </Label>
                  <Input
                    id="discount_value"
                    type="number"
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) })}
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
                    onChange={(e) => setFormData({ ...formData, min_purchase: parseFloat(e.target.value) })}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="max_uses">Maksimum Kullanım (boş = sınırsız)</Label>
                  <Input
                    id="max_uses"
                    type="number"
                    value={formData.max_uses ?? ""}
                    onChange={(e) =>
                      setFormData({ ...formData, max_uses: e.target.value ? parseInt(e.target.value) : null })
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
                    onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="valid_until">Bitiş Tarihi (boş = süresiz)</Label>
                <Input
                  id="valid_until"
                  type="date"
                  value={formData.valid_until ?? ""}
                  onChange={(e) => setFormData({ ...formData, valid_until: e.target.value || null })}
                />
              </div>

              {/* Kapsam alanı (BE şimdilik ignore ediyor, FE için bırakıldı) */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Uygulama Kapsamı</Label>
                  <Select
                    value={formData.applicable_to}
                    onValueChange={(value: Scope) =>
                      setFormData({
                        ...formData,
                        applicable_to: value,
                        category_ids: value === "category" ? formData.category_ids : [],
                        product_ids: value === "product" ? formData.product_ids : [],
                      })
                    }
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tüm Site</SelectItem>
                      <SelectItem value="category">Belirli Kategoriler</SelectItem>
                      <SelectItem value="product">Belirli Ürünler</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.applicable_to === "category" && (
                  <div className="space-y-2">
                    <Label>Kategoriler</Label>
                    <div className="border rounded-md p-4 max-h-48 overflow-y-auto">
                      {categories.map((category) => (
                        <div key={category.id} className="flex items-center space-x-2 mb-2">
                          <Checkbox
                            id={`cat-${category.id}`}
                            checked={formData.category_ids.includes(category.id)}
                            onCheckedChange={(checked) => {
                              setFormData((s) => ({
                                ...s,
                                category_ids: checked
                                  ? [...s.category_ids, category.id]
                                  : s.category_ids.filter((x) => x !== category.id),
                              }));
                            }}
                          />
                          <Label htmlFor={`cat-${category.id}`} className="cursor-pointer">
                            {category.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {formData.applicable_to === "product" && (
                  <div className="space-y-2">
                    <Label>Ürünler</Label>
                    <div className="border rounded-md p-4 max-h-48 overflow-y-auto">
                      {products.map((product) => (
                        <div key={product.id} className="flex items-center space-x-2 mb-2">
                          <Checkbox
                            id={`prod-${product.id}`}
                            checked={formData.product_ids.includes(product.id)}
                            onCheckedChange={(checked) => {
                              setFormData((s) => ({
                                ...s,
                                product_ids: checked
                                  ? [...s.product_ids, product.id]
                                  : s.product_ids.filter((x) => x !== product.id),
                              }));
                            }}
                          />
                          <Label htmlFor={`prod-${product.id}`} className="cursor-pointer">
                            {product.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Aktif</Label>
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => navigate("/admin/coupons")}>
                  İptal
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Kaydediliyor..." : isEdit ? "Güncelle" : "Ekle"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
