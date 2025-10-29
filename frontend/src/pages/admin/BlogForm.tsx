// FILE: src/pages/admin/blog/BlogForm.tsx  (konumunu kendi projene göre koru)
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { metahub } from "@/integrations/metahub/client"; // yalnızca storage için
import { blogAdmin } from "@/integrations/metahub/client/admin/blog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminLayout } from "@/components/admin/AdminLayout";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

type FormState = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  author_name: string;
  image_url: string;
  is_published: boolean;
  is_featured: boolean;
  display_order: number;
};

const initialState: FormState = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  category: "",
  author_name: "",
  image_url: "",
  is_published: false,
  is_featured: false,
  display_order: 0,
};

export default function BlogForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormState>(initialState);

  useEffect(() => {
  if (!id) return;

  // id’yi IIFE parametresi olarak geçirince TS burada string’e daraltıyor
  (async (pid: string) => {
    try {
      const { data, error } = await blogAdmin.getById(pid);
      if (error || !data) throw error ?? new Error("not_found");
      setFormData({
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt ?? "",
        content: data.content ?? "",
        category: data.category ?? "",
        author_name: data.author_name ?? "Admin",
        image_url: data.image_url ?? "",
        is_published: !!data.is_published,
        is_featured: !!data.is_featured,
        display_order: data.display_order ?? 0,
      });
    } catch (err) {
      console.error("Error fetching post:", err);
      toast({
        title: "Hata",
        description: "Blog yazısı yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  })(id);
}, [id]);


  const toUpsertBody = (s: FormState) => ({
    title: s.title,
    slug: s.slug,
    excerpt: s.excerpt || null,
    content: s.content || null,
    category: s.category || null,
    author_name: s.author_name || null, // admin endpoint toApiBody -> author
    image_url: s.image_url || null,     // admin endpoint toApiBody -> featured_image
    is_published: s.is_published,
    is_featured: s.is_featured,
    display_order: s.display_order,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (id) {
        const { error } = await blogAdmin.update(id, toUpsertBody(formData));
        if (error) throw error;
        toast({ title: "Başarılı", description: "Blog yazısı güncellendi." });
      } else {
        const { error } = await blogAdmin.create(toUpsertBody(formData));
        if (error) throw error;
        toast({ title: "Başarılı", description: "Blog yazısı oluşturuldu." });
      }
      navigate("/admin/blog");
    } catch (error) {
      console.error("Error saving blog post:", error);
      toast({
        title: "Hata",
        description: "Blog yazısı kaydedilirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title={id ? "Blog Yazısını Düzenle" : "Yeni Blog Yazısı"}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin/blog")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Geri
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Blog Yazısı Bilgileri</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Başlık *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
                <Label htmlFor="excerpt">Özet</Label>
                <Textarea
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>İçerik (HTML) *</Label>
                <ReactQuill
                  theme="snow"
                  value={formData.content}
                  onChange={(value) => setFormData({ ...formData, content: value })}
                  className="bg-background"
                  modules={{
                    toolbar: [
                      [{ header: [1, 2, 3, 4, 5, 6, false] }],
                      ["bold", "italic", "underline", "strike"],
                      [{ list: "ordered" }, { list: "bullet" }],
                      [{ color: [] }, { background: [] }],
                      ["link", "image"],
                      ["clean"],
                    ],
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Kategori *</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="author_name">Yazar Adı *</Label>
                  <Input
                    id="author_name"
                    value={formData.author_name}
                    onChange={(e) => setFormData({ ...formData, author_name: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="image_upload">Kapak Fotoğrafı</Label>
                <Input
                  id="image_upload"
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    const ext = file.name.split(".").pop();
                    const filePath = `${Date.now()}.${ext}`;

                    const { error: uploadError } = await metahub.storage
                      .from("blog-images")
                      .upload(filePath, file);

                    if (uploadError) {
                      toast({ title: "Hata", description: "Görsel yüklenirken hata oluştu.", variant: "destructive" });
                      return;
                    }
                    const { data } = metahub.storage.from("blog-images").getPublicUrl(filePath);
                    setFormData({ ...formData, image_url: data.publicUrl });
                    toast({ title: "Başarılı", description: "Kapak fotoğrafı yüklendi." });
                  }}
                />
                {formData.image_url && (
                  <img src={formData.image_url} alt="Preview" className="mt-2 w-full max-w-md rounded border" />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="is_published">Yayınla</Label>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="is_published"
                      checked={formData.is_published}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="is_featured">Öne Çıkan</Label>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="is_featured"
                      checked={formData.is_featured}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => navigate("/admin/blog")}>
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
