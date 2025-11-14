// src/pages/admin/BlogForm.tsx

import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  useGetBlogPostAdminByIdQuery,
  useCreateBlogPostAdminMutation,
  useUpdateBlogPostAdminMutation,
} from "@/integrations/metahub/rtk/endpoints/admin/blog_admin.endpoints";
import {
  useUploadStorageAssetAdminMutation,
} from "@/integrations/metahub/rtk/endpoints/admin/storage_admin.endpoints";
import type { UpsertBlogBody } from "@/integrations/metahub/db/types/blog";
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
import "@/styles/richtext.css"; // wrap/responsive stiller

/* ---------------- utils ---------------- */
const slugify = (v: string) =>
  (v || "")
    .toLowerCase()
    .trim()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const stripHtml = (s: string) =>
  (s || "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();

const escapeHtml = (s: string) =>
  (s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/* ---------------- types ---------------- */
type FormState = {
  title: string;
  slug: string;
  excerpt: string;
  content_html: string;

  author_name: string;

  // Kapak görseli (legacy url + storage id)
  image_url: string;
  image_asset_id: string;
  image_alt: string;

  is_published: boolean;

  // legacy (opsiyonel)
  category: string;
  is_featured: boolean;
  display_order: number;
};

const initialState: FormState = {
  title: "",
  slug: "",
  excerpt: "",
  content_html: "",

  author_name: "Admin",

  image_url: "",
  image_asset_id: "",
  image_alt: "",

  is_published: false,

  category: "",
  is_featured: false,
  display_order: 0,
};

export default function BlogForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [formData, setFormData] = useState<FormState>(initialState);
  const slugTouchedRef = useRef(false);
  const quillRef = useRef<ReactQuill | null>(null);

  // image upload handler ref (Quill toolbar handler sabit kalsın diye)
  const inlineImageUploadRef = useRef<(file: File) => Promise<void> | void>();

  const { data: postData, isFetching } = useGetBlogPostAdminByIdQuery(
    id as string,
    { skip: !isEdit },
  );

  const [createPost, { isLoading: creating }] =
    useCreateBlogPostAdminMutation();
  const [updatePost, { isLoading: updating }] =
    useUpdateBlogPostAdminMutation();
  const [uploadAsset, { isLoading: uploading }] =
    useUploadStorageAssetAdminMutation();

  // ---- helper: güvenli field update (state'i asla sıfırlama) ----
  const updateField = <K extends keyof FormState>(
    key: K,
    value: FormState[K],
  ) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // ---- edit modunda veriyi forma bas ----
  useEffect(() => {
    if (!postData) return;

    setFormData({
      title: postData.title ?? "",
      slug: postData.slug ?? "",
      excerpt: (postData.excerpt as string) ?? "",
      content_html: (postData.content as string) ?? "",

      author_name: postData.author_name ?? "Admin",

      image_url: postData.image_url ?? "",
      image_asset_id: (postData as any).image_asset_id ?? "",
      image_alt: (postData as any).image_alt ?? "",

      is_published: !!postData.is_published,

      category: (postData as any).category ?? "",
      is_featured: !!(postData as any).is_featured,
      display_order: Number((postData as any).display_order ?? 0),
    });

    // mevcut slug'ı otomatik bozmayalım
    slugTouchedRef.current = true;
  }, [postData]);

  // ---- title değişince, slug elle dokunulmadıysa otomatik üret ----
  useEffect(() => {
    if (!formData.title) return;
    if (slugTouchedRef.current) return;

    setFormData((prev) => ({
      ...prev,
      slug: slugify(prev.title),
    }));
  }, [formData.title]);

  // SEO önizleme verileri
  const seoTitle = (formData.title || "").trim();
  const rawDesc = (formData.excerpt || stripHtml(formData.content_html)).trim();
  const seoDesc = rawDesc.slice(0, 160);
  const previewUrl =
    "/" + (formData.slug || slugify(formData.title) || "blog-yazisi");

  const loading = isFetching || creating || updating;

  /* --------------- FE -> BE body --------------- */
  const toUpsertBody = (s: FormState): UpsertBlogBody => ({
    title: s.title.trim(),
    slug: (s.slug || slugify(s.title)).trim(),
    excerpt: s.excerpt || null,
    content: s.content_html || null,

    image_url: s.image_url || null,
    image_asset_id: s.image_asset_id || null,
    image_alt: s.image_alt || null,

    author_name: s.author_name || null,
    is_published: !!s.is_published,

    // legacy
    category: s.category || null,
    is_featured: !!s.is_featured,
    display_order: Number(s.display_order ?? 0),
  });

  /* --------------- Kapak görseli yükleme --------------- */
  const handleCoverUpload = async (file: File) => {
    try {
      const folderSafe = (
        formData.slug ||
        slugify(formData.title) ||
        "posts"
      ).replace(/[^a-z0-9/_-]/g, "");
      const folder = `blog/${folderSafe}`;

      const asset = await uploadAsset({
        file,
        bucket: "blog",
        folder,
        metadata: { module: "blog", kind: "cover" },
      }).unwrap();

      setFormData((prev) => ({
        ...prev,
        image_url: asset.url ?? prev.image_url,
        image_asset_id: asset.id ?? prev.image_asset_id,
      }));

      toast.success("Kapak görseli yüklendi.");
    } catch (err: any) {
      console.error(err);
      toast.error("Görsel yüklenirken hata oluştu.");
    }
  };

  /* --------------- Quill içine görsel ekleme --------------- */
  const insertImageIntoQuill = (url: string, alt?: string) => {
    const q = quillRef.current?.getEditor();
    if (!q) return;

    if (alt && alt.trim()) {
      const safeAlt = escapeHtml(alt.trim());
      const html = `<img src="${url}" alt="${safeAlt}" />`;
      const range = q.getSelection(true);
      const index = range ? range.index : q.getLength();
      q.clipboard.dangerouslyPasteHTML(index, html);
      q.setSelection(index + 1, 0);
    } else {
      const range = q.getSelection(true);
      const index = range ? range.index : q.getLength();
      q.insertEmbed(index, "image", url, "user");
      q.setSelection(index + 1, 0);
    }
  };

  const handleInlineImageUpload = async (file: File) => {
    try {
      const folderSafe = (
        formData.slug ||
        slugify(formData.title) ||
        "posts"
      ).replace(/[^a-z0-9/_-]/g, "");
      const folder = `blog/${folderSafe}/inline`;

      const asset = await uploadAsset({
        file,
        bucket: "blog",
        folder,
        metadata: { module: "blog", kind: "inline" },
      }).unwrap();

      const alt =
        window.prompt("Görsel alt metni (SEO için opsiyonel):") || "";
      insertImageIntoQuill(asset.url || "", alt);
      toast.success("Görsel eklendi.");
    } catch (err: any) {
      console.error(err);
      toast.error("İçerik görseli yüklenirken hata oluştu.");
    }
  };

  // toolbar handler hep son handleInlineImageUpload fonksiyonunu kullansın
  useEffect(() => {
    inlineImageUploadRef.current = handleInlineImageUpload;
  }, [handleInlineImageUpload]);

  // Quill "image" toolbar butonu için handler
  const quillModules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, 4, 5, 6, false] }],
          ["bold", "italic", "underline", "strike"],
          [{ list: "ordered" }, { list: "bullet" }],
          [{ color: [] }, { background: [] }],
          ["link", "image"],
          ["clean"],
        ],
        handlers: {
          image: () => {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = "image/*";
            input.onchange = async () => {
              const file = (input.files && input.files[0]) || null;
              if (!file) return;
              if (inlineImageUploadRef.current) {
                await inlineImageUploadRef.current(file);
              }
            };
            input.click();
          },
        },
      },
    }),
    [],
  );

  const quillFormats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "list",
    "bullet",
    "color",
    "background",
    "link",
    "image",
  ];

  /* --------------- Submit --------------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const body = toUpsertBody(formData);
    if (!body.slug) {
      toast.error("Slug üretilemedi. Başlık veya slug giriniz.");
      return;
    }

    try {
      if (isEdit && id) {
        await updatePost({ id, body }).unwrap();
        toast.success("Blog yazısı güncellendi.");
      } else {
        await createPost(body).unwrap();
        toast.success("Blog yazısı oluşturuldu.");
      }
      navigate("/admin/blog");
    } catch (err: any) {
      console.error(err);
      toast.error("Kaydedilirken bir hata oluştu.");
    }
  };

  const wordCount = useMemo(
    () =>
      stripHtml(formData.content_html)
        .split(/\s+/)
        .filter(Boolean).length,
    [formData.content_html],
  );

  return (
    <AdminLayout
      title={isEdit ? "Blog Yazısını Düzenle" : "Yeni Blog Yazısı"}
    >
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/admin/blog")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Geri
          </Button>
        </div>

        {/* Form + Sağ Önizleme */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* FORM */}
          <Card className="lg:col-span-7">
            <CardHeader>
              <CardTitle>Blog Yazısı Bilgileri</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Başlık / Slug */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="title">Başlık *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) =>
                        updateField("title", e.target.value)
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug (URL) *</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => {
                        slugTouchedRef.current = true;
                        updateField("slug", e.target.value);
                      }}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      site.com/
                      {formData.slug ||
                        slugify(formData.title) ||
                        "blog-yazisi"}
                    </p>
                  </div>
                </div>

                {/* Özet */}
                <div className="space-y-2">
                  <Label htmlFor="excerpt">Özet</Label>
                  <Textarea
                    id="excerpt"
                    value={formData.excerpt}
                    onChange={(e) =>
                      updateField("excerpt", e.target.value)
                    }
                    rows={2}
                  />
                </div>

                {/* İçerik (inline image destekli) */}
                <div className="space-y-2">
                  <Label>İçerik (HTML) *</Label>

                  {/* Quill container: yatay taşmayı gizle, editor içinde wrap */}
                  <div className="overflow-hidden rounded border">
                    <ReactQuill
                      ref={quillRef as any}
                      theme="snow"
                      value={formData.content_html}
                      onChange={(value) =>
                        updateField("content_html", value)
                      }
                      className="bg-background richtext"
                      modules={quillModules}
                      formats={quillFormats}
                    />
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Metin, başlık, liste, bağlantı ve{" "}
                    <strong>görsel</strong> ekleyebilirsiniz.
                  </p>
                </div>

                {/* Kapak görseli */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="image_upload">Kapak Fotoğrafı</Label>
                    <Input
                      id="image_upload"
                      type="file"
                      accept="image/*"
                      disabled={uploading}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        await handleCoverUpload(file);
                      }}
                    />
                    {formData.image_url && (
                      <img
                        src={formData.image_url}
                        alt={formData.image_alt || "Kapak"}
                        className="mt-2 w-full max-w-md rounded border object-cover"
                      />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="image_alt">
                      Kapak Alt Metni (SEO)
                    </Label>
                    <Input
                      id="image_alt"
                      value={formData.image_alt}
                      onChange={(e) =>
                        updateField("image_alt", e.target.value)
                      }
                      placeholder='Örn: "Blog yazısı kapak görseli"'
                    />
                    {formData.image_asset_id && (
                      <p className="text-xs text-muted-foreground">
                        Asset ID: {formData.image_asset_id}
                      </p>
                    )}
                  </div>
                </div>

                {/* Yazar + (opsiyonel) kategori */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="author_name">Yazar Adı *</Label>
                    <Input
                      id="author_name"
                      value={formData.author_name}
                      onChange={(e) =>
                        updateField("author_name", e.target.value)
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">
                      Kategori (opsiyonel)
                    </Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) =>
                        updateField("category", e.target.value)
                      }
                      placeholder="Genel"
                    />
                  </div>
                </div>

                {/* Yayın durumu */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_published"
                      checked={!!formData.is_published}
                      onCheckedChange={(checked) =>
                        updateField("is_published", checked)
                      }
                    />
                    <Label htmlFor="is_published">Yayınla</Label>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {wordCount} kelime
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/admin/blog")}
                  >
                    İptal
                  </Button>
                  <Button
                    type="submit"
                    className="gradient-primary"
                    disabled={loading}
                  >
                    {loading
                      ? "Kaydediliyor..."
                      : isEdit
                      ? "Güncelle"
                      : "Oluştur"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Sağ: SEO & İçerik Önizleme */}
          <Card className="lg:col-span-5">
            <CardHeader>
              <CardTitle>Önizleme</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* SEO snippet */}
              <div className="rounded-lg border p-4">
                <div className="text-xs text-muted-foreground break-words overflow-wrap:anywhere">
                  {(typeof window !== "undefined"
                    ? window.location.origin
                    : "site.com") + previewUrl}
                </div>
                <div className="mt-1 text-base font-semibold leading-snug break-words overflow-wrap:anywhere">
                  {seoTitle || "Blog başlığı (örnek)"}
                </div>
                <div className="mt-1 text-sm text-muted-foreground break-words overflow-wrap:anywhere">
                  {seoDesc ||
                    "Meta açıklama veya içerik özeti burada görünecek."}
                </div>
              </div>

              {/* İçerik canlı önizleme */}
              <div className="rounded-lg border">
                <div className="border-b p-3 text-sm font-medium">
                  İçerik
                </div>
                <div className="prose max-w-none p-4 break-words overflow-wrap:anywhere">
                  <article
                    dangerouslySetInnerHTML={{
                      __html:
                        formData.content_html ||
                        "<p>Önizleme yok.</p>",
                    }}
                  />
                </div>
              </div>

              {/* Kapak görseli önizleme */}
              <div className="rounded-lg border">
                <div className="border-b p-3 text-sm font-medium">
                  Kapak Görseli
                </div>
                <div className="p-4">
                  {formData.image_url ? (
                    <img
                      src={formData.image_url}
                      alt={formData.image_alt || "Kapak"}
                      className="w-full max-w-lg rounded border object-cover"
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Görsel seçilmedi.
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
