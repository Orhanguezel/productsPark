import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { metahub } from "@/integrations/metahub/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

export default function CategoryForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Array<{ id: string, name: string }>>([]);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    image_url: "",
    is_featured: false,
    display_order: 0,
    parent_id: null as string | null,
    article_content: "",
    article_enabled: false,
  });

  useEffect(() => {
    fetchCategories();
    if (id) {
      fetchCategory();
    }
  }, [id]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await metahub
        .from("categories")
        .select("id, name")
        .order("name");

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchCategory = async () => {
    if (!id) return;

    try {
      const { data, error } = await metahub
        .from("categories")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      setFormData({
        name: data.name,
        slug: data.slug,
        description: data.description || "",
        image_url: data.image_url || "",
        is_featured: data.is_featured || false,
        display_order: data.display_order || 0,
        parent_id: data.parent_id || null,
        article_content: data.article_content || "",
        article_enabled: data.article_enabled || false,
      });
    } catch (error) {
      console.error("Error fetching category:", error);
      toast({
        title: "Hata",
        description: "Kategori yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Clean up formData to ensure empty strings are converted to null for UUID fields
      const cleanedFormData = {
        ...formData,
        parent_id: formData.parent_id || null,
      };

      if (id) {
        const { error } = await metahub
          .from("categories")
          .update(cleanedFormData)
          .eq("id", id);

        if (error) throw error;
        toast({ title: "Başarılı", description: "Kategori güncellendi." });
      } else {
        const { error } = await metahub.from("categories").insert([cleanedFormData]);

        if (error) throw error;
        toast({ title: "Başarılı", description: "Kategori oluşturuldu." });
      }

      navigate("/admin/categories");
    } catch (error) {
      console.error("Error saving category:", error);
      toast({
        title: "Hata",
        description: "Kategori kaydedilirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title={id ? "Kategoriyi Düzenle" : "Yeni Kategori Ekle"}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin/categories")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Geri
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Kategori Bilgileri</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Kategori Adı *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug (URL) *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="parent_id">Üst Kategori</Label>
                <Select
                  value={formData.parent_id || "none"}
                  onValueChange={(value) => setFormData({ ...formData, parent_id: value === "none" ? null : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Üst kategori seçin (opsiyonel)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Yok (Ana Kategori)</SelectItem>
                    {categories.filter(c => c.id !== id).map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Açıklama</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="image_upload">Kategori Görseli</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Önerilen boyut: 800x600 piksel (4:3 oran)
                </p>
                <Input
                  id="image_upload"
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    const fileExt = file.name.split('.').pop();
                    const fileName = `${Date.now()}.${fileExt}`;
                    const filePath = `${fileName}`;

                    const { error: uploadError } = await metahub.storage
                      .from('product-images')
                      .upload(filePath, file);

                    if (uploadError) {
                      toast({ title: "Hata", description: "Görsel yüklenirken hata oluştu.", variant: "destructive" });
                      return;
                    }

                    const { data } = metahub.storage.from('product-images').getPublicUrl(filePath);
                    setFormData({ ...formData, image_url: data.publicUrl });
                    toast({ title: "Başarılı", description: "Görsel yüklendi." });
                  }}
                />
                {formData.image_url && (
                  <img src={formData.image_url} alt="Preview" className="mt-2 w-full max-w-md rounded border" />
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_featured"
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                />
                <Label htmlFor="is_featured">Anasayfada Öne Çıkan Kategori</Label>
              </div>

              {formData.is_featured && (
                <div className="space-y-2 pl-6 border-l-2 border-primary/20">
                  <Label htmlFor="display_order">
                    Anasayfa Sırası
                    <span className="text-xs text-muted-foreground ml-2">
                      (Küçük numara üstte gösterilir: 1, 2, 3...)
                    </span>
                  </Label>
                  <Input
                    id="display_order"
                    type="number"
                    min="0"
                    value={formData.display_order}
                    onChange={(e) => setFormData({
                      ...formData,
                      display_order: parseInt(e.target.value) || 0
                    })}
                    placeholder="Örn: 1"
                    className="max-w-xs"
                  />
                </div>
              )}


              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="article_enabled"
                    checked={formData.article_enabled}
                    onCheckedChange={(checked) => setFormData({ ...formData, article_enabled: checked })}
                  />
                  <Label htmlFor="article_enabled">Makale Alanını Aktif Et</Label>
                </div>

                {formData.article_enabled && (
                  <div className="space-y-2">
                    <Label>Makale İçeriği</Label>
                    <ReactQuill
                      theme="snow"
                      value={formData.article_content}
                      onChange={(value) => setFormData({ ...formData, article_content: value })}
                      className="bg-background"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/admin/categories")}
                >
                  İptal
                </Button>
                <Button type="submit" className="gradient-primary" disabled={loading}>
                  {loading ? "Kaydediliyor..." : id ? "Güncelle" : "Oluştur"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
