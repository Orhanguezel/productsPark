// =============================================================
// FILE: src/components/admin/products/ProductManagement.tsx
// =============================================================

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { Pencil, Trash2, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ---- RTK Admin endpoints ----
import {
  useListProductsAdminQuery,
  useCreateProductAdminMutation,
  useUpdateProductAdminMutation,
  useDeleteProductAdminMutation,
} from "@/integrations/metahub/rtk/endpoints/admin/products_admin.endpoints";
import { useListCategoriesAdminQuery } from "@/integrations/metahub/rtk/endpoints/admin/categories_admin.endpoints";

// ---- Types ----
import type {
  ProductAdmin,
  CategoryRow,
  UpsertProductBody,
  PatchProductBody,
} from "@/integrations/metahub/db/types/products";

type FormState = {
  name: string;
  slug: string;
  price: number;
  original_price: number;
  stock_quantity: number;
  category_id: string;
  image_url: string;
  short_description: string;
  description: string;
  is_active: boolean;
  show_on_homepage: boolean;
  review_count: number;
};

const initialFormState: FormState = {
  name: "",
  slug: "",
  price: 0,
  original_price: 0,
  stock_quantity: 0,
  category_id: "",
  image_url: "",
  short_description: "",
  description: "",
  is_active: true,
  show_on_homepage: false,
  review_count: 0,
};

export const ProductManagement = () => {
  // Server data (RTK)
  const {
    data: products = [],
    isFetching: loadingProducts,
    refetch: refetchProducts,
  } = useListProductsAdminQuery();
  const {
    data: categories = [],
    isFetching: loadingCategories,
  } = useListCategoriesAdminQuery();

  // Mutations
  const [createProduct, { isLoading: creating }] =
    useCreateProductAdminMutation();
  const [updateProduct, { isLoading: updating }] =
    useUpdateProductAdminMutation();
  const [deleteProduct, { isLoading: deleting }] =
    useDeleteProductAdminMutation();

  // Local UI state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductAdmin | null>(
    null
  );
  const [formData, setFormData] = useState<FormState>(initialFormState);

  const resetForm = () => {
    setEditingProduct(null);
    setFormData(initialFormState);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload: UpsertProductBody & Partial<PatchProductBody> = {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        price: Number(formData.price ?? 0),
        original_price:
          formData.original_price && !Number.isNaN(formData.original_price)
            ? Number(formData.original_price)
            : null,
        stock_quantity: Number(formData.stock_quantity ?? 0),
        category_id: formData.category_id || null,
        image_url: formData.image_url || null,
        short_description: formData.short_description || null,
        description: formData.description || null,
        is_active: !!formData.is_active,
        show_on_homepage: !!formData.show_on_homepage,
        review_count: Number(formData.review_count ?? 0),
      };

      if (editingProduct) {
        // UPDATE
        await updateProduct({
          id: editingProduct.id,
          body: payload as PatchProductBody,
        }).unwrap();
        toast({ title: "Başarılı", description: "Ürün güncellendi." });
      } else {
        // CREATE
        await createProduct(payload as UpsertProductBody).unwrap();
        toast({ title: "Başarılı", description: "Ürün oluşturuldu." });
      }

      setDialogOpen(false);
      resetForm();
      // RTK tags ile invalidate ediyorsan bu şart değil, ama garanti olsun:
      refetchProducts();
    } catch (error) {
      console.error("Error saving product:", error);
      toast({
        title: "Hata",
        description: "Ürün kaydedilirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu ürünü silmek istediğinizden emin misiniz?")) return;

    try {
      await deleteProduct(id).unwrap();
      toast({ title: "Başarılı", description: "Ürün silindi." });
      refetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      toast({
        title: "Hata",
        description: "Ürün silinirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (product: ProductAdmin) => {
    setEditingProduct(product);
    setFormData({
      name: product.name ?? "",
      slug: product.slug ?? "",
      price: Number(product.price ?? 0),
      original_price: Number(product.original_price ?? 0),
      stock_quantity: Number(product.stock_quantity ?? 0),
      category_id: (product.category_id as string) || "",
      image_url: (product.image_url as string) || "",
      short_description: (product.short_description as string) || "",
      description: (product as any).description || "",
      is_active: !!product.is_active,
      show_on_homepage: !!(product as any).show_on_homepage,
      review_count: Number((product as any).review_count ?? 0),
    });
    setDialogOpen(true);
  };

  const loading = loadingProducts || loadingCategories || creating || updating || deleting;

  if (loading) return <div>Yükleniyor...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Ürün Yönetimi</h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={resetForm}
              className="gradient-primary"
              disabled={creating || updating}
            >
              <Plus className="w-4 h-4 mr-2" />
              Yeni Ürün Ekle
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? "Ürünü Düzenle" : "Yeni Ürün Ekle"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Ürün Adı</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="slug">Slug (URL)</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value })
                  }
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Fiyat (₺)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        price: parseFloat(e.target.value || "0"),
                      })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="original_price">Eski Fiyat (₺)</Label>
                  <Input
                    id="original_price"
                    type="number"
                    step="0.01"
                    value={formData.original_price}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        original_price: parseFloat(e.target.value || "0"),
                      })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="stock_quantity">Stok Miktarı</Label>
                  <Input
                    id="stock_quantity"
                    type="number"
                    value={formData.stock_quantity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        stock_quantity: parseInt(e.target.value || "0", 10),
                      })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="category_id">Kategori</Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Kategori seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="review_count">Satış Sayısı</Label>
                  <Input
                    id="review_count"
                    type="number"
                    min={0}
                    value={formData.review_count}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        review_count: parseInt(e.target.value || "0", 10),
                      })
                    }
                    placeholder="Örn: 150"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="image_url">Görsel URL</Label>
                <Input
                  id="image_url"
                  value={formData.image_url}
                  onChange={(e) =>
                    setFormData({ ...formData, image_url: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="short_description">Kısa Açıklama</Label>
                <Textarea
                  id="short_description"
                  value={formData.short_description}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      short_description: e.target.value,
                    })
                  }
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="description">Detaylı Açıklama</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      description: e.target.value,
                    })
                  }
                  rows={5}
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
              {categories.find(
                (c: CategoryRow) =>
                  c.id === formData.category_id && !!(c as any).is_featured
              ) && (
                <div className="flex items-center space-x-2">
                  <Switch
                    id="show_on_homepage"
                    checked={formData.show_on_homepage}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        show_on_homepage: checked,
                      })
                    }
                  />
                  <Label htmlFor="show_on_homepage">
                    Bu Ürünü Anasayfada Göster (Kategori öne çıkan)
                  </Label>
                </div>
              )}
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false);
                    resetForm();
                  }}
                >
                  İptal
                </Button>
                <Button
                  type="submit"
                  className="gradient-primary"
                  disabled={creating || updating}
                >
                  {editingProduct ? "Güncelle" : "Oluştur"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ürün</TableHead>
            <TableHead>Kategori</TableHead>
            <TableHead>Fiyat</TableHead>
            <TableHead>Stok</TableHead>
            <TableHead>Durum</TableHead>
            <TableHead className="text-right">İşlemler</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell className="font-medium">{product.name}</TableCell>
              <TableCell>
                {product.categories?.name ?? (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>₺{Number(product.price ?? 0)}</TableCell>
              <TableCell>{product.stock_quantity ?? 0}</TableCell>
              <TableCell>
                {product.is_active ? (
                  <span className="text-green-600">Aktif</span>
                ) : (
                  <span className="text-red-600">Pasif</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(product)}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(product.id)}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
