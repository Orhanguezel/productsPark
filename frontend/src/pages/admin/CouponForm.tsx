import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { metahub } from "@/integrations/metahub/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Checkbox } from "@/components/ui/checkbox";

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
}

export default function CouponForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [formData, setFormData] = useState({
    code: "",
    discount_type: "percentage" as "percentage" | "fixed",
    discount_value: 0,
    min_purchase: 0,
    max_uses: null as number | null,
    valid_from: new Date().toISOString().split("T")[0],
    valid_until: null as string | null,
    is_active: true,
    applicable_to: "all" as "all" | "category" | "product",
    category_ids: [] as string[],
    product_ids: [] as string[],
  });

  useEffect(() => {
    fetchCategories();
    fetchProducts();
    if (id) {
      fetchCoupon();
    }
  }, [id]);

  const fetchCategories = async () => {
    const { data, error } = await metahub
      .from("categories")
      .select("id, name")
      .order("name");

    if (error) {
      console.error(error);
    } else {
      setCategories(data || []);
    }
  };

  const fetchProducts = async () => {
    const { data, error } = await metahub
      .from("products")
      .select("id, name")
      .order("name");

    if (error) {
      console.error(error);
    } else {
      setProducts(data || []);
    }
  };

  const fetchCoupon = async () => {
    if (!id) return;

    const { data, error } = await metahub
      .from("coupons")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      toast.error("Kupon yüklenemedi");
      console.error(error);
      return;
    }

    setFormData({
      code: data.code,
      discount_type: data.discount_type as "percentage" | "fixed",
      discount_value: data.discount_value,
      min_purchase: data.min_purchase,
      max_uses: data.max_uses,
      valid_from: data.valid_from.split("T")[0],
      valid_until: data.valid_until ? data.valid_until.split("T")[0] : null,
      is_active: data.is_active,
      applicable_to: (data.applicable_to || "all") as "all" | "category" | "product",
      category_ids: data.category_ids || [],
      product_ids: data.product_ids || [],
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (id) {
        const { error } = await metahub
          .from("coupons")
          .update(formData)
          .eq("id", id);

        if (error) throw error;
        toast.success("Kupon güncellendi");
      } else {
        const { error } = await metahub.from("coupons").insert([formData]);

        if (error) throw error;
        toast.success("Kupon eklendi");
      }

      navigate("/admin/coupons");
    } catch (error) {
      toast.error("Kupon kaydedilemedi");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title={id ? "Kupon Düzenle" : "Yeni Kupon Ekle"}>
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
                    placeholder="SUMMER2024"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discount_type">İndirim Türü</Label>
                  <Select
                    value={formData.discount_type}
                    onValueChange={(value: "percentage" | "fixed") =>
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
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                        discount_value: parseFloat(e.target.value),
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
                        min_purchase: parseFloat(e.target.value),
                      })
                    }
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="max_uses">
                    Maksimum Kullanım (boş = sınırsız)
                  </Label>
                  <Input
                    id="max_uses"
                    type="number"
                    value={formData.max_uses || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        max_uses: e.target.value ? parseInt(e.target.value) : null,
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
                    onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="valid_until">
                  Bitiş Tarihi (boş = süresiz)
                </Label>
                <Input
                  id="valid_until"
                  type="date"
                  value={formData.valid_until || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      valid_until: e.target.value || null,
                    })
                  }
                />
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Uygulama Kapsamı</Label>
                  <Select
                    value={formData.applicable_to}
                    onValueChange={(value: "all" | "category" | "product") =>
                      setFormData({
                        ...formData,
                        applicable_to: value,
                        category_ids: value === "category" ? formData.category_ids : [],
                        product_ids: value === "product" ? formData.product_ids : [],
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
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
                              if (checked) {
                                setFormData({
                                  ...formData,
                                  category_ids: [...formData.category_ids, category.id],
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  category_ids: formData.category_ids.filter(
                                    (id) => id !== category.id
                                  ),
                                });
                              }
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
                              if (checked) {
                                setFormData({
                                  ...formData,
                                  product_ids: [...formData.product_ids, product.id],
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  product_ids: formData.product_ids.filter(
                                    (id) => id !== product.id
                                  ),
                                });
                              }
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
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_active: checked })
                  }
                />
                <Label htmlFor="is_active">Aktif</Label>
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/admin/coupons")}
                >
                  İptal
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Kaydediliyor..." : id ? "Güncelle" : "Ekle"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
