// =============================================================
// FILE: src/pages/admin/custom-pages/PageForm.tsx
// =============================================================
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Upload, X } from "lucide-react";
import { toast } from "sonner";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

import {
  useGetCustomPageAdminByIdQuery,
  useListCustomPagesAdminQuery,
  useCreateCustomPageAdminMutation,
  useUpdateCustomPageAdminMutation,
} from "@/integrations/metahub/rtk/endpoints/admin/custom_pages_admin.endpoints";
import { useCreateAssetAdminMutation } from "@/integrations/metahub/rtk/endpoints/admin/storage_admin.endpoints";
import type { UpsertCustomPageBody } from "@/integrations/metahub/db/types/customPages";

/* ---------------- helpers ---------------- */
const slugify = (v: string) =>
  (v || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

const stripHtml = (s: string) =>
  (s || "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();

const clamp = (n: number, min: number, max: number) =>
  Math.min(Math.max(n, min), max);

const pickUrlAndId = (res: any) => {
  const url =
    res?.url ||
    res?.public_url ||
    res?.data?.url ||
    res?.asset?.url ||
    res?.file?.url ||
    null;

  const id =
    res?.asset_id ||
    res?.id ||
    res?.data?.id ||
    res?.asset?.id ||
    res?.file?.id ||
    null;

  return { url, id };
};

/* ---------------- types ---------------- */
type FormState = {
  title: string;
  slug: string;
  content_html: string;
  meta_title: string;
  meta_description: string;
  is_published: boolean;

  // Kapak görseli
  featured_image: string;
  featured_image_asset_id: string;
  featured_image_alt: string;
};

export default function PageForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  // Detay + liste (slug çakışması kontrolü için)
  const { data: pageData, isFetching } = useGetCustomPageAdminByIdQuery(
    id as string,
    { skip: !isEdit },
  );
  const { data: list = [] } = useListCustomPagesAdminQuery();

  const [createPage, { isLoading: creating }] =
    useCreateCustomPageAdminMutation();
  const [updatePage, { isLoading: updating }] =
    useUpdateCustomPageAdminMutation();

  // Storage upload
  const [uploadAsset, { isLoading: uploadingAny }] =
    useCreateAssetAdminMutation();

  // Kullanıcı slug’ı elle dokundu mu?
  const slugTouchedRef = useRef(false);

  // Quill ref (image embed için)
  const quillRef = useRef<ReactQuill | null>(null);

  // Kapak görseli yükleme input ref
  const coverInputRef = useRef<HTMLInputElement | null>(null);

  // Quill görsel yükleme input ref
  const quillImageInputRef = useRef<HTMLInputElement | null>(null);

  const [formData, setFormData] = useState<FormState>({
    title: "",
    slug: "",
    content_html: "",
    meta_title: "",
    meta_description: "",
    is_published: false,
    featured_image: "",
    featured_image_asset_id: "",
    featured_image_alt: "",
  });

  const loading = isFetching || creating || updating;

  // Edit modunda formu doldur
  useEffect(() => {
    if (!pageData) return;
    setFormData((prev) => ({
      ...prev,
      title: pageData.title ?? "",
      slug: pageData.slug ?? "",
      content_html: pageData.content ?? "",
      meta_title: pageData.meta_title ?? "",
      meta_description: pageData.meta_description ?? "",
      is_published: !!pageData.is_published,
      featured_image: (pageData as any).featured_image ?? "",
      featured_image_asset_id:
        (pageData as any).featured_image_asset_id ?? "",
      featured_image_alt: (pageData as any).featured_image_alt ?? "",
    }));
    // edit ekranına ilk girişte otomatik slug güncellenmesin
    slugTouchedRef.current = true;
  }, [pageData]);

  // Başlık değişirse ve slug'a elle dokunulmamışsa otomatik slug üret
  useEffect(() => {
    if (!slugTouchedRef.current && formData.title) {
      setFormData((s) => ({ ...s, slug: slugify(s.title) }));
    }
  }, [formData.title]);

  const existingSlugs = useMemo(() => {
    const set = new Set<string>();
    for (const p of list) {
      if (!p.slug) continue;
      if (isEdit && p.id === id) continue; // kendisini hariç tut
      set.add(p.slug);
    }
    return set;
  }, [list, isEdit, id]);

  const slugError =
    formData.slug.trim().length === 0
      ? "Slug boş olamaz"
      : existingSlugs.has(formData.slug.trim())
      ? "Bu slug zaten kullanılıyor"
      : "";

  // SEO snippet veri seti
  const seoTitle = (formData.meta_title || formData.title || "").trim();
  const rawDesc = (
    formData.meta_description || stripHtml(formData.content_html)
  ).trim();
  const seoDesc = rawDesc.slice(0, 160);
  const previewUrl =
    "/" + (formData.slug || slugify(formData.title) || "sayfa-adi");

  /* ---------------- Upload helpers ---------------- */
  const validateImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Lütfen bir görsel seçin.");
      return false;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Maksimum 5MB dosya yükleyebilirsiniz.");
      return false;
    }
    return true;
  };

  // ✅ Artık component içinde, uploadAsset hook'unu kullanıyor
  const uploadToStorage = async (
    file: File,
    folder: string,
    kind: "cover" | "content",
  ) => {
    const res: any = await uploadAsset({
      file,
      bucket: "pages",
      folder,
      metadata: { module: "custom_page", kind },
    }).unwrap();

    const { url, id } = pickUrlAndId(res);
    if (!url) throw new Error("upload_failed_no_url");
    return { url, id };
  };

  /* ---------------- Quill toolbar (image handler) ---------------- */
  const modules = useMemo(
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
            // Dosya seçtir → storage’a yükle → embed
            quillImageInputRef.current?.click();
          },
        },
      },
    }),
    [],
  );

  /* ---------------- Kapak görseli upload ---------------- */
  const [uploadingCover, setUploadingCover] = useState(false);

  const handleCoverFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!validateImageFile(file)) {
      if (coverInputRef.current) coverInputRef.current.value = "";
      return;
    }
    setUploadingCover(true);
    try {
      const { url, id } = await uploadToStorage(
        file,
        "custom_pages/covers",
        "cover",
      );
      setFormData((s) => ({
        ...s,
        featured_image: url,
        featured_image_asset_id: id || s.featured_image_asset_id,
      }));
      toast.success("Kapak görseli yüklendi");
    } catch (err) {
      console.error(err);
      toast.error("Kapak görseli yüklenemedi");
    } finally {
      setUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = "";
    }
  };

  /* ---------------- Quill içi görsel upload ---------------- */
  const [uploadingQuillImg, setUploadingQuillImg] = useState(false);

  const handleQuillImageFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!validateImageFile(file)) {
      if (quillImageInputRef.current) quillImageInputRef.current.value = "";
      return;
    }
    setUploadingQuillImg(true);
    try {
      const { url } = await uploadToStorage(
        file,
        "custom_pages/content",
        "content",
      );
      const quill = quillRef.current?.getEditor();
      if (quill) {
        const range = quill.getSelection(true);
        const index = range ? range.index : 0;
        quill.insertEmbed(index, "image", url, "user");
        quill.setSelection(index + 1, 0);
      }
      toast.success("Görsel eklendi");
    } catch (err) {
      console.error(err);
      toast.error("Görsel yüklenemedi");
    } finally {
      setUploadingQuillImg(false);
      if (quillImageInputRef.current) quillImageInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const normalizedSlug = formData.slug
      ? slugify(formData.slug)
      : slugify(formData.title);

    if (!normalizedSlug) {
      toast.error("Slug üretilemedi. Başlık veya slug giriniz.");
      return;
    }
    if (existingSlugs.has(normalizedSlug)) {
      toast.error("Bu slug zaten kullanılıyor.");
      return;
    }

    const body: UpsertCustomPageBody = {
      title: formData.title.trim(),
      slug: normalizedSlug,
      content: formData.content_html,
      meta_title: formData.meta_title.trim() || null,
      meta_description: formData.meta_description.trim() || null,
      is_published: !!formData.is_published,
      locale: null,

      featured_image: formData.featured_image || null,
      featured_image_asset_id: formData.featured_image_asset_id || null,
      featured_image_alt: formData.featured_image_alt || null,
    };

    try {
      if (isEdit && id) {
        await updatePage({ id, body }).unwrap();
        toast.success("Sayfa güncellendi");
      } else {
        await createPage(body).unwrap();
        toast.success("Sayfa oluşturuldu");
      }
      navigate("/admin/pages");
    } catch (err: unknown) {
      console.error(err);
      toast.error("Kaydetme sırasında bir hata oluştu");
    }
  };

  return (
    <AdminLayout title={isEdit ? "Sayfayı Düzenle" : "Yeni Sayfa"}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/admin/pages")}
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
              <CardTitle>Sayfa Bilgileri</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Başlık / Slug */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="title">Sayfa Başlığı *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      İçerik ve SEO başlıklarında kullanılacaktır.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug (URL) *</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => {
                        slugTouchedRef.current = true;
                        setFormData({
                          ...formData,
                          slug: e.target.value,
                        });
                      }}
                      placeholder="ornek-sayfa"
                      required
                    />
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        site.com/
                        {formData.slug ||
                          slugify(formData.title) ||
                          "sayfa-adi"}
                      </p>
                      {slugError && (
                        <p className="text-xs text-red-600">
                          {slugError}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* SEO Alanları */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="meta_title">Meta Başlık</Label>
                    <Input
                      id="meta_title"
                      value={formData.meta_title}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          meta_title: e.target.value,
                        })
                      }
                      placeholder="Google sonuçlarında görünecek başlık"
                    />
                    <p className="text-xs text-muted-foreground">
                      {clamp(seoTitle.length, 0, 60)} / 60
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="meta_description">
                      Meta Açıklama
                    </Label>
                    <Textarea
                      id="meta_description"
                      value={formData.meta_description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          meta_description: e.target.value,
                        })
                      }
                      rows={2}
                      placeholder="SEO için sayfa açıklaması (önerilen 140–160 karakter)"
                    />
                    <p className="text-xs text-muted-foreground">
                      {clamp(
                        (formData.meta_description || "").length,
                        0,
                        160,
                      )}{" "}
                      / 160
                    </p>
                  </div>
                </div>

                {/* KAPAK GÖRSELİ */}
                <div className="space-y-2">
                  <Label>Kapak Görseli</Label>

                  {!formData.featured_image ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Input
                          placeholder="https://... (opsiyonel)"
                          value={formData.featured_image}
                          onChange={(e) =>
                            setFormData((s) => ({
                              ...s,
                              featured_image: e.target.value,
                            }))
                          }
                        />
                        <p className="text-xs text-muted-foreground">
                          URL girebilir veya aşağıdan dosya yükleyebilirsiniz.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <input
                          ref={coverInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleCoverFileChange}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          disabled={uploadingCover || uploadingAny}
                          onClick={() =>
                            coverInputRef.current?.click()
                          }
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          {uploadingCover || uploadingAny
                            ? "Yükleniyor..."
                            : "Dosyadan Yükle"}
                        </Button>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            placeholder="Asset ID (opsiyonel)"
                            value={formData.featured_image_asset_id}
                            onChange={(e) =>
                              setFormData((s) => ({
                                ...s,
                                featured_image_asset_id:
                                  e.target.value,
                              }))
                            }
                          />
                          <Input
                            placeholder="Alt metin (opsiyonel)"
                            value={formData.featured_image_alt}
                            onChange={(e) =>
                              setFormData((s) => ({
                                ...s,
                                featured_image_alt: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="relative border rounded-lg overflow-hidden">
                        <img
                          src={formData.featured_image}
                          alt={
                            formData.featured_image_alt || "Önizleme"
                          }
                          className="w-full h-48 object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src =
                              "https://placehold.co/800x400?text=Image";
                          }}
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2"
                          onClick={() =>
                            setFormData((s) => ({
                              ...s,
                              featured_image: "",
                              featured_image_asset_id: "",
                              featured_image_alt: "",
                            }))
                          }
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          placeholder="Asset ID (opsiyonel)"
                          value={formData.featured_image_asset_id}
                          onChange={(e) =>
                            setFormData((s) => ({
                              ...s,
                              featured_image_asset_id: e.target.value,
                            }))
                          }
                        />
                        <Input
                          placeholder="Alt metin (opsiyonel)"
                          value={formData.featured_image_alt}
                          onChange={(e) =>
                            setFormData((s) => ({
                              ...s,
                              featured_image_alt: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* İçerik */}
                <div className="space-y-2">
                  <Label>İçerik (HTML) *</Label>

                  {/* Quill dosya inputu (gizli) */}
                  <input
                    ref={quillImageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleQuillImageFileChange}
                  />

                  <ReactQuill
                    ref={quillRef}
                    theme="snow"
                    value={formData.content_html}
                    onChange={(value) =>
                      setFormData({
                        ...formData,
                        content_html: value,
                      })
                    }
                    className="bg-background"
                    modules={modules}
                  />
                  <p className="text-xs text-muted-foreground">
                    Bağlantı ve görsel ekleyebilirsiniz. Görseller
                    storage’a yüklenip URL olarak gömülür.
                    {uploadingQuillImg && " (Görsel yükleniyor…)"}
                  </p>
                </div>

                {/* Yayın Durumu */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_published"
                      checked={!!formData.is_published}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          is_published: checked,
                        })
                      }
                    />
                    <Label htmlFor="is_published">Yayınla</Label>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {
                      stripHtml(formData.content_html)
                        .split(/\s+/)
                        .filter(Boolean).length
                    }{" "}
                    kelime
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/admin/pages")}
                  >
                    İptal
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || !!slugError}
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

          {/* SEO + Canlı Önizleme */}
          <Card className="lg:col-span-5">
            <CardHeader>
              <CardTitle>Önizleme</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Google benzeri snippet */}
              <div className="rounded-lg border p-4">
                <div className="text-xs text-muted-foreground">
                  {(typeof window !== "undefined"
                    ? window.location.origin
                    : "site.com") + previewUrl}
                </div>
                <div className="mt-1 text-base font-semibold leading-snug">
                  {seoTitle || "Sayfa başlığı (örnek)"}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {seoDesc ||
                    "Meta açıklama veya içerik özeti burada görünecek."}
                </div>
              </div>

              {/* Kapak + içerik canlı önizleme */}
              <div className="rounded-lg border overflow-hidden">
                {formData.featured_image && (
                  <img
                    src={formData.featured_image}
                    alt={
                      formData.featured_image_alt || "Kapak"
                    }
                    className="w-full h-40 object-cover border-b"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display =
                        "none";
                    }}
                  />
                )}
                <div className="border-b p-3 text-sm font-medium">
                  İçerik
                </div>
                <div className="prose max-w-none p-4">
                  <article
                    dangerouslySetInnerHTML={{
                      __html:
                        formData.content_html ||
                        "<p>Önizleme yok.</p>",
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
