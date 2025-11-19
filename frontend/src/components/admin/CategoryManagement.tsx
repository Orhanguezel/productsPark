// =============================================================
// FILE: src/components/admin/AdminPanel/CategoryManagement.tsx
// (RTK tabanlı, kısa açıklama ön izlemeli)
// =============================================================

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
  useListCategoriesAdminQuery,
  useCreateCategoryAdminMutation,
  useUpdateCategoryAdminMutation,
  useDeleteCategoryAdminMutation,
} from "@/integrations/metahub/rtk/endpoints/admin/categories_admin.endpoints";

import type {
  Category as CategoryModel,
  UpsertCategoryBody,
} from "@/integrations/metahub/db/types/categories";

type FormState = {
  name: string;
  slug: string;
  description: string;
  image_url: string;
  is_featured: boolean;
  display_order: number;
};

const defaultForm: FormState = {
  name: "",
  slug: "",
  description: "",
  image_url: "",
  is_featured: false,
  display_order: 0,
};

export const CategoryManagement = () => {
  const {
    data: categories = [],
    isLoading,
    refetch,
  } = useListCategoriesAdminQuery();

  const [createCategory, { isLoading: creating }] =
    useCreateCategoryAdminMutation();
  const [updateCategory, { isLoading: updating }] =
    useUpdateCategoryAdminMutation();
  const [deleteCategory, { isLoading: deleting }] =
    useDeleteCategoryAdminMutation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<CategoryModel | null>(null);
  const [formData, setFormData] = useState<FormState>(defaultForm);

  const saving = creating || updating;

  const resetForm = () => {
    setEditingCategory(null);
    setFormData(defaultForm);
  };

  const handleEdit = (category: CategoryModel) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || "",
      image_url: category.image_url || "",
      is_featured: category.is_featured ?? false,
      display_order: category.display_order ?? 0,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload: UpsertCategoryBody = {
      name: formData.name.trim(),
      slug: formData.slug.trim(),
      description: formData.description.trim() || null,
      image_url: formData.image_url.trim() || null,
      is_featured: formData.is_featured,
      display_order: formData.display_order,
    };

    try {
      if (editingCategory) {
        await updateCategory({
          id: editingCategory.id,
          body: payload,
        }).unwrap();
        toast({
          title: "Başarılı",
          description: "Kategori güncellendi.",
        });
      } else {
        await createCategory(payload).unwrap();
        toast({
          title: "Başarılı",
          description: "Kategori oluşturuldu.",
        });
      }

      setDialogOpen(false);
      resetForm();
      refetch();
    } catch (error) {
      console.error("Error saving category:", error);
      toast({
        title: "Hata",
        description: "Kategori kaydedilirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu kategoriyi silmek istediğinizden emin misiniz?")) return;

    try {
      await deleteCategory(id).unwrap();
      toast({
        title: "Başarılı",
        description: "Kategori silindi.",
      });
      refetch();
    } catch (error) {
      console.error("Error deleting category:", error);
      toast({
        title: "Hata",
        description: "Kategori silinirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) return <div>Yükleniyor...</div>;

  return (
    <div className="space-y-4">
      {/* Üst bar */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Kategori Yönetimi</h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                resetForm();
                setDialogOpen(true);
              }}
              className="gradient-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Yeni Kategori Ekle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? "Kategoriyi Düzenle" : "Yeni Kategori Ekle"}
              </DialogTitle>
            </DialogHeader>

            {/* FORM */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Kategori Adı</Label>
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

              <div>
                <Label htmlFor="description">Kısa Açıklama</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      description: e.target.value,
                    })
                  }
                  rows={3}
                />
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

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_featured"
                  checked={formData.is_featured}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      is_featured: checked,
                    })
                  }
                />
                <Label htmlFor="is_featured">
                  Anasayfada Öne Çıkan Kategori
                </Label>
              </div>

              {formData.is_featured && (
                <div className="space-y-2 pl-6 border-l-2 border-primary/20">
                  <Label htmlFor="display_order">
                    Anasayfa Sırası
                    <span className="text-xs text-muted-foreground ml-2">
                      (Küçük numara üstte: 1, 2, 3...)
                    </span>
                  </Label>
                  <Input
                    id="display_order"
                    type="number"
                    min={0}
                    value={formData.display_order}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        display_order: parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder="Örn: 1"
                    className="max-w-xs"
                  />
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
                  disabled={saving}
                >
                  {editingCategory ? "Güncelle" : "Oluştur"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* TABLO */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Kategori</TableHead>
            <TableHead>Kısa Açıklama</TableHead>
            <TableHead>Ürün Sayısı</TableHead>
            <TableHead className="text-right">İşlemler</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.map((category) => {
            const shortDesc =
              (category.description || "").length > 80
                ? `${category.description?.slice(0, 80)}…`
                : category.description || "—";

            const productCount = (category as any).product_count ?? 0;

            return (
              <TableRow key={category.id}>
                <TableCell className="font-medium">
                  {category.name}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {shortDesc}
                </TableCell>
                <TableCell>{productCount}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(category)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(category.id)}
                    disabled={deleting}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
