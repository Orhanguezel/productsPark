import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import ReactQuill, { Quill } from "react-quill";
import "react-quill/dist/quill.snow.css";

import {
  useListCategoriesAdminQuery,
  useGetCategoryAdminByIdQuery,
  useCreateCategoryAdminMutation,
  useUpdateCategoryAdminMutation,
} from "@/integrations/metahub/rtk/endpoints/admin/categories_admin.endpoints";

// 🔹 STORAGE: tekli create hook
import { useCreateAssetAdminMutation } from "@/integrations/metahub/rtk/endpoints/admin/storage_admin.endpoints";

import type { UpsertCategoryBody } from "@/integrations/metahub/db/types/categories";

/* helpers */
const slugify = (v: string) =>
  (v || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

const stripHtml = (s: string) =>
  s.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
const clamp = (n: number, min: number, max: number) =>
  Math.min(Math.max(n, min), max);

type FormState = {
  name: string;
  slug: string;
  description: string;

  // Kapak görseli
  image_url: string; // public url (legacy fallback)
  image_asset_id: string; // storage id (yeni)
  image_alt: string; // alt text

  icon: string;
  parent_id: string | null;
  is_active: boolean;
  is_featured: boolean;
  display_order: number;
  seo_title: string;
  seo_description: string;

  // Makale alanı (kategori sayfası için)
  article_enabled: boolean;
  article_content: string;
};

export default function CategoryForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const { data: allCats = [] } = useListCategoriesAdminQuery();
  const { data: cat, isFetching } = useGetCategoryAdminByIdQuery(
    id as string,
    { skip: !isEdit }
  );

  const [createCat, { isLoading: creating }] =
    useCreateCategoryAdminMutation();
  const [updateCat, { isLoading: updating }] =
    useUpdateCategoryAdminMutation();

  // 🔹 STORAGE: tekli create
  const [uploadAsset, { isLoading: uploading }] =
    useCreateAssetAdminMutation();

  const slugTouchedRef = useRef(false);
  const quillRef = useRef<ReactQuill | null>(null);
  const contentImageInputRef = useRef<HTMLInputElement | null>(null);

  const [formData, setFormData] = useState<FormState>({
    name: "",
    slug: "",
    description: "",

    image_url: "",
    image_asset_id: "",
    image_alt: "",

    icon: "",
    parent_id: null,
    is_active: true,
    is_featured: false,
    display_order: 0,
    seo_title: "",
    seo_description: "",
    article_enabled: false,
    article_content: "",
  });

  // Upload sonrası insert edeceğimiz index (cursor veya son)
  const [pendingImageIndex, setPendingImageIndex] = useState<number | null>(
    null
  );

  // edit modunda doldur
  useEffect(() => {
    if (!cat) return;
    setFormData({
      name: cat.name || "",
      slug: cat.slug || "",
      description: cat.description || "",

      image_url: cat.image_url || "",
      image_asset_id: (cat as any).image_asset_id ?? "",
      image_alt: (cat as any).image_alt ?? "",

      icon: cat.icon || "",
      parent_id: cat.parent_id || null,
      is_active: !!cat.is_active,
      is_featured: !!cat.is_featured,
      display_order: cat.display_order ?? 0,
      seo_title: (cat as any).seo_title || "",
      seo_description: (cat as any).seo_description || "",
      article_enabled: !!((cat as any).article_enabled ?? false),
      article_content: (cat as any).article_content || "",
    });
    slugTouchedRef.current = true; // mevcut slug'ı ezme
  }, [cat]);

  // isim → slug
  useEffect(() => {
    if (!slugTouchedRef.current) {
      setFormData((s) => ({ ...s, slug: slugify(s.name) }));
    }
  }, [formData.name]);

  const parentOptions = useMemo(
    () => allCats.filter((c) => c.id !== id),
    [allCats, id]
  );

  const loading = isFetching || creating || updating || uploading;

  const toUpsertBody = (s: FormState): UpsertCategoryBody => ({
    name: s.name.trim(),
    slug: (s.slug || slugify(s.name)).trim(),
    description: s.description.trim() || null,

    // kapak görseli
    image_url: s.image_url || null, // legacy fallback
    image_asset_id: s.image_asset_id || null, // storage id
    image_alt: s.image_alt || null,

    icon: s.icon || null,
    parent_id: s.parent_id || null,
    is_active: !!s.is_active,
    is_featured: !!s.is_featured,
    display_order: Number.isFinite(s.display_order) ? s.display_order : 0,
    seo_title: s.seo_title.trim() || null,
    seo_description: s.seo_description.trim() || null,

    article_enabled: !!s.article_enabled,
    article_content: s.article_content || null,
  });

  // Kapak görseli upload
  const handleCoverUpload = async (file: File) => {
    try {
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Geçersiz dosya",
          description: "Lütfen bir görsel dosyası seçin.",
          variant: "destructive",
        });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Dosya çok büyük",
          description: "Maksimum 5MB olabilir.",
          variant: "destructive",
        });
        return;
      }

      const folderSafe = (
        formData.slug ||
        slugify(formData.name) ||
        "categories"
      ).replace(/[^a-z0-9/_-]/g, "");
      const folder = `categories/${folderSafe}/cover`;

      const asset = await uploadAsset({
        file,
        bucket: "categories",
        folder,
        metadata: { module: "categories", type: "cover" },
      }).unwrap();

      setFormData((s) => ({
        ...s,
        image_url: (asset as any).url ?? s.image_url,
        image_asset_id: (asset as any).id ?? s.image_asset_id,
      }));

      toast({
        title: "Başarılı",
        description: "Kapak görseli yüklendi.",
      });
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Hata",
        description: "Kapak görseli yüklenirken hata oluştu.",
        variant: "destructive",
      });
    }
  };

  // İçerik içine görsel ekleme (Quill image handler) → index hesaplıyor
  const handleInsertContentImage = () => {
    const quill = quillRef.current?.getEditor?.();
    if (!quill || !contentImageInputRef.current) return;

    const range = quill.getSelection(true);
    const index = range ? range.index : quill.getLength();

    setPendingImageIndex(index);
    contentImageInputRef.current.click();
  };

  // Editor içindeki görsellere tıklayınca o görseli sil (çöp ikonuna tıklanmış gibi)
  useEffect(() => {
    const editor = quillRef.current?.getEditor?.();
    if (!editor) return;

    const root = editor.root as HTMLElement;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target || target.tagName !== "IMG") return;

      e.preventDefault();
      e.stopPropagation();

      const blot = Quill.find(target) as any;
      if (!blot || typeof blot.offset !== "function") return;

      const index = blot.offset(editor.scroll);
      if (typeof index !== "number") return;

      editor.deleteText(index, 1, "user");
      toast({
        title: "Silindi",
        description: "Görsel içerikten kaldırıldı.",
      });
    };

    root.addEventListener("click", handleClick);
    return () => {
      root.removeEventListener("click", handleClick);
    };
  }, []);

  const onPickContentImage = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // aynı dosyayı tekrar seçebilmek için temizle
    if (!file) return;
    try {
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Geçersiz dosya",
          description: "Lütfen bir görsel dosyası seçin.",
          variant: "destructive",
        });
        return;
      }

      const folderSafe = (
        formData.slug ||
        slugify(formData.name) ||
        "categories"
      ).replace(/[^a-z0-9/_-]/g, "");
      const folder = `categories/${folderSafe}/content`;

      const asset = await uploadAsset({
        file,
        bucket: "categories",
        folder,
        metadata: { module: "categories", type: "content-image" },
      }).unwrap();

      const url = (asset as any).url;
      if (!url) {
        throw new Error("Asset url yok");
      }

      const quill = quillRef.current?.getEditor?.();
      if (!quill) return;

      let index = pendingImageIndex;
      if (index == null) {
        const range = quill.getSelection(true);
        index = range ? range.index : quill.getLength();
      }

      quill.insertEmbed(index, "image", url, "user");
      quill.setSelection(index + 1, 0, "user");

      setPendingImageIndex(null);

      toast({
        title: "Görsel eklendi",
        description: "İçerik alanına görsel yerleştirildi.",
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Hata",
        description: "İçerik görseli yüklenemedi.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = toUpsertBody(formData);
    if (!body.slug) {
      toast({
        title: "Hata",
        description: "Slug üretilemedi. İsim veya slug giriniz.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isEdit && id) {
        await updateCat({ id, body }).unwrap();
        toast({ title: "Başarılı", description: "Kategori güncellendi." });
      } else {
        await createCat(body).unwrap();
        toast({ title: "Başarılı", description: "Kategori oluşturuldu." });
      }
      navigate("/admin/categories");
    } catch (err) {
      console.error(err);
      toast({
        title: "Hata",
        description: "Kategori kaydedilirken bir sorun oluştu.",
        variant: "destructive",
      });
    }
  };

  /* ---------------- SEO ÖNİZLEME LOGİĞİ ---------------- */

  const seoTitle = (formData.seo_title || formData.name || "").trim();

  // Öncelik:
  // 1) SEO açıklama
  // 2) Kısa açıklama
  // 3) Makale içeriğinin strip edilmiş hali
  const rawDescSource =
    (formData.seo_description || "").trim() ||
    (formData.description || "").trim() ||
    stripHtml(formData.article_content || "");

  const seoDesc = rawDescSource.slice(0, 160);

  const previewUrl =
    "/" + (formData.slug || slugify(formData.name) || "kategori");

  /* ----------------------- RENDER ----------------------- */

  return (
    <AdminLayout title={isEdit ? "Kategoriyi Düzenle" : "Yeni Kategori"}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/admin/categories")}
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
              <CardTitle>Kategori Bilgileri</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Ad / Slug */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Kategori Adı *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
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
                        setFormData({
                          ...formData,
                          slug: e.target.value,
                        });
                      }}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      {(typeof window !== "undefined"
                        ? window.location.origin
                        : "site.com") + previewUrl}
                    </p>
                  </div>
                </div>

                {/* Parent */}
                <div className="space-y-2">
                  <Label htmlFor="parent">Üst Kategori</Label>
                  <select
                    id="parent"
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    value={formData.parent_id || "none"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        parent_id:
                          e.target.value === "none" ? null : e.target.value,
                      })
                    }
                  >
                    <option value="none">Yok (Ana Kategori)</option>
                    {parentOptions.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Açıklama */}
                <div className="space-y-2">
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

                {/* Kapak görseli upload */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="image_upload">Kapak Görseli</Label>
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
                    <Label htmlFor="image_alt">Kapak Alt Metni (SEO)</Label>
                    <Input
                      id="image_alt"
                      value={formData.image_alt}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          image_alt: e.target.value,
                        })
                      }
                      placeholder='Örn: "Kategori temsili görsel"'
                    />
                    {formData.image_asset_id && (
                      <p className="text-xs text-muted-foreground">
                        Asset ID: {formData.image_asset_id}
                      </p>
                    )}
                  </div>
                </div>

                {/* Durum & Öne Çıkan & Sıra */}
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(v) =>
                        setFormData({ ...formData, is_active: v })
                      }
                    />
                    <Label htmlFor="is_active">Aktif</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="is_featured"
                      checked={formData.is_featured}
                      onCheckedChange={(v) =>
                        setFormData({ ...formData, is_featured: v })
                      }
                    />
                    <Label htmlFor="is_featured">Öne Çıkan</Label>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="display_order">Sıra</Label>
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
                    />
                  </div>
                </div>

                {/* SEO */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="seo_title">SEO Başlık</Label>
                    <Input
                      id="seo_title"
                      value={formData.seo_title}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          seo_title: e.target.value,
                        })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      {clamp(
                        (formData.seo_title || formData.name || "").length,
                        0,
                        60
                      )}{" "}
                      / 60
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="seo_description">SEO Açıklama</Label>
                    <Textarea
                      id="seo_description"
                      rows={2}
                      value={formData.seo_description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          seo_description: e.target.value,
                        })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      {clamp(
                        (formData.seo_description || "").length,
                        0,
                        160
                      )}{" "}
                      / 160
                    </p>
                  </div>
                </div>

                {/* Makale alanı */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="article_enabled"
                      checked={formData.article_enabled}
                      onCheckedChange={(v) =>
                        setFormData({
                          ...formData,
                          article_enabled: v,
                        })
                      }
                    />
                    <Label htmlFor="article_enabled">
                      Kategori Makale İçeriği
                    </Label>
                  </div>

                  {formData.article_enabled && (
                    <>
                      

                      <div className="space-y-2">
                        <Label>Makale İçeriği (HTML)</Label>
                        <div className="category-article-editor">
                          <ReactQuill
                            ref={quillRef as any}
                            theme="snow"
                            value={formData.article_content}
                            onChange={(value) =>
                              setFormData({
                                ...formData,
                                article_content: value,
                              })
                            }
                            className="bg-background"
                            modules={{
                              toolbar: [
                                [
                                  {
                                    header: [
                                      1, 2, 3, 4, 5, 6, false,
                                    ],
                                  },
                                ],
                                [
                                  "bold",
                                  "italic",
                                  "underline",
                                  "strike",
                                ],
                                [
                                  { list: "ordered" },
                                  { list: "bullet" },
                                ],
                                [
                                  { color: [] },
                                  { background: [] },
                                ],
                                ["link", "image"],
                                ["clean"],
                              ],
                            }}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/admin/categories")}
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

          {/* SAĞ: Önizlemeler */}
          <Card className="lg:col-span-5">
            <CardHeader>
              <CardTitle>Önizleme</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* SEO snippet */}
              <div className="rounded-lg border p-4">
                <div className="text-xs text-muted-foreground">
                  {(typeof window !== "undefined"
                    ? window.location.origin
                    : "site.com") + previewUrl}
                </div>
                <div className="mt-1 text-base font-semibold leading-snug">
                  {seoTitle || "Kategori başlığı (örnek)"}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {seoDesc ||
                    "Meta açıklama veya içerik özeti burada görünecek."}
                </div>
              </div>

              {/* KISA AÇIKLAMA ÖNİZLEME */}
              <div className="rounded-lg border">
                <div className="border-b p-3 text-sm font-medium">
                  Kısa Açıklama Önizleme
                </div>
                <div className="p-4 text-sm text-muted-foreground">
                  {formData.description.trim()
                    ? formData.description
                    : "Kısa açıklama girilmedi."}
                </div>
              </div>

              {/* İçerik canlı önizleme */}
              {formData.article_enabled && (
                <div className="rounded-lg border">
                  <div className="border-b p-3 text-sm font-medium">
                    İçerik Önizleme
                  </div>
                  <div className="prose max-w-none p-4">
                    <article
                      dangerouslySetInnerHTML={{
                        __html:
                          formData.article_content ||
                          "<p>Önizleme yok.</p>",
                      }}
                    />
                  </div>
                </div>
              )}

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
