// src/pages/admin/custom-pages/PageForm.tsx
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

type FormState = {
  title: string;
  slug: string;
  content_html: string; 
  meta_description: string;
  is_published: boolean;
};

const toBool = (v: unknown): boolean =>
  v === true || v === 1 || v === "1" || v === "true";

const extractHtml = (raw: unknown): string => {
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (parsed && typeof parsed === "object" && typeof (parsed as any).html === "string") {
        return (parsed as any).html as string;
      }
      return raw; // zaten düz HTML string olabilir
    } catch {
      return raw; // parse edilemeyen düz string
    }
  }
  if (raw && typeof raw === "object" && typeof (raw as any).html === "string") {
    return (raw as any).html as string;
  }
  return "";
};

export default function PageForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormState>({
    title: "",
    slug: "",
    content_html: "",
    meta_description: "",
    is_published: false,
  });

  useEffect(() => {
    if (id) void fetchPage();
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
        title: data.title ?? "",
        slug: data.slug ?? "",
        content_html: extractHtml(data.content),
        meta_description: data.meta_description ?? "",
        is_published: toBool(data.is_published),
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
      // slug normalize
      const normalizedSlug = (formData.slug || formData.title)
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");

      // BE create/update gövdesi
      const body = {
        title: formData.title.trim(),
        slug: normalizedSlug,
        content_html: formData.content_html, // kritik alan
        meta_description:
          formData.meta_description?.trim() ? formData.meta_description.trim() : null,
        is_published: !!formData.is_published,
      };

      if (id) {
        // PATCH /custom_pages/:id
        const { error } = await metahub.from("custom_pages").update(body).eq("id", id);
        if (error) throw error;
        toast.success("Sayfa güncellendi");
      } else {
        // POST /custom_pages
        const { error } = await metahub.from("custom_pages").insert([body]);
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
                  value={formData.content_html}
                  onChange={(value) => setFormData({ ...formData, content_html: value })}
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
                  checked={!!formData.is_published}
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
