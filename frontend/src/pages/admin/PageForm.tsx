import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { metahub } from "@/integrations/metahub/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

export default function PageForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    content: "",
    meta_description: "",
    is_published: false,
  });

  useEffect(() => {
    if (id) {
      fetchPage();
    }
  }, [id]);

  const fetchPage = async () => {
    if (!id) return;

    try {
      const { data, error } = await metahub
        .from("custom_pages")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      setFormData({
        title: data.title,
        slug: data.slug,
        content: data.content,
        meta_description: data.meta_description || "",
        is_published: data.is_published,
      });
    } catch (error) {
      console.error("Error fetching page:", error);
      toast.error("Sayfa yüklenirken hata oluştu");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (id) {
        const { error } = await metahub
          .from("custom_pages")
          .update(formData)
          .eq("id", id);

        if (error) throw error;
        toast.success("Sayfa güncellendi");
      } else {
        const { error } = await metahub.from("custom_pages").insert([formData]);

        if (error) throw error;
        toast.success("Sayfa oluşturuldu");
      }

      navigate("/admin/pages");
    } catch (error: any) {
      console.error("Error saving page:", error);
      toast.error("Sayfa kaydedilirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title={id ? "Sayfayı Düzenle" : "Yeni Sayfa"}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin/pages")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Geri
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sayfa Bilgileri</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Sayfa Başlığı *</Label>
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
                    placeholder="ornek-sayfa"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    site.com/{formData.slug || "sayfa-adi"}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="meta_description">Meta Açıklama</Label>
                <Textarea
                  id="meta_description"
                  value={formData.meta_description}
                  onChange={(e) =>
                    setFormData({ ...formData, meta_description: e.target.value })
                  }
                  rows={2}
                  placeholder="SEO için sayfa açıklaması"
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

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_published"
                  checked={formData.is_published}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_published: checked })
                  }
                />
                <Label htmlFor="is_published">Yayınla</Label>
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/admin/pages")}
                >
                  İptal
                </Button>
                <Button type="submit" disabled={loading}>
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
