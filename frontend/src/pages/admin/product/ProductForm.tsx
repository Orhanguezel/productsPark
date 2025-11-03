// =============================================================
// FILE: src/components/admin/products/ProductForm.tsx
// =============================================================
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { TurkpinSettings } from "@/components/admin/TurkpinSettings";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, ArrowLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";

// ---- RTK (Admin Products) ----
import {
  useGetProductAdminQuery,
  useCreateProductAdminMutation,
  useUpdateProductAdminMutation,
  useReplaceReviewsAdminMutation,
  useReplaceFaqsAdminMutation,
  useSetProductStockAdminMutation,
  useListUsedStockAdminQuery,
} from "@/integrations/metahub/rtk/endpoints/admin/products_admin.endpoints";
import { useListCategoriesAdminQuery } from "@/integrations/metahub/rtk/endpoints/admin/categories_admin.endpoints";

// ---- RTK (Api Providers - ayrı endpoint) ----
import { useListApiProvidersQuery } from "@/integrations/metahub/rtk/endpoints/api_providers.endpoints";

// ---- RTK (Public read-only) ----
import {
  useListProductFaqsQuery,
  useListProductReviewsQuery,
  useListProductStockQuery,
} from "@/integrations/metahub/rtk/endpoints/products.endpoints";

// ---- RTK (Storage - ADMIN) ----
import { useUploadStorageAssetAdminMutation } from "@/integrations/metahub/rtk/endpoints/admin/storage_admin.endpoints";

// ---- Types ----
import type {
  ProductAdmin,
  UpsertProductBody,
  PatchProductBody,
  FAQ as TFAQ,
  Review as TReview,
  CategoryRow,
} from "@/integrations/metahub/db/types/products";
import type { ReviewInput, FAQInput, CustomField, Badge } from "./form/types";

// ---- Sections ----
import BasicInfo from "./form/sections/BasicInfo";
import CategorySelect from "./form/sections/CategorySelect";
import CustomizationSection from "./form/sections/CustomizationSection";
import FaqSection from "./form/sections/FaqSection";
import ReviewsSection from "./form/sections/ReviewsSection";
import DeliverySection from "./form/sections/DeliverySection";
import DemoSection from "./form/sections/DemoSection";
import ArticleSection from "./form/sections/ArticleSection";

/* ---------------- utils ---------------- */
const slugify = (v: string) =>
  (v || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const escapeHtml = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const safeFolder = (s: string) => (s || "").replace(/[^a-z0-9/_-]/g, "") || "products";

/** Quill daraltıcıları */
type QuillEditor = {
  getSelection: (focus?: boolean) => { index: number } | null;
  clipboard: { dangerouslyPasteHTML: (index: number, html: string) => void };
  insertEmbed: (index: number, type: string, value: string, source?: string) => void;
  getLength: () => number;
  setSelection: (index: number, length: number) => void;
};
const isQuillEditor = (x: unknown): x is QuillEditor =>
  !!x &&
  typeof (x as QuillEditor).getSelection === "function" &&
  typeof (x as QuillEditor).insertEmbed === "function" &&
  typeof (x as QuillEditor).getLength === "function" &&
  !!(x as QuillEditor).clipboard;

type QuillToolbarThis = { quill?: unknown };
const getQuillFromThis = (ctx: unknown): QuillEditor | null => {
  const q = (ctx as QuillToolbarThis)?.quill;
  return isQuillEditor(q) ? q : null;
};

type UploadedAssetLike = {
  url?: string | null;
  id?: string | null;
  asset_id?: string | null;
  path?: string | null;
};

// ---- API Provider tipini burada sabitle (DeliverySection ile birebir) ----
export type ApiProvider = { id: string; name: string };

/* ========= Helper: her türlü input’u gerçek File’a çevir ========= */
type HasFiles = { files?: FileList | null };
type EventLike = { target?: HasFiles; currentTarget?: HasFiles };

async function normalizeToFile(input: string | Blob): Promise<File> {
  if (input instanceof File) return input;
  if (input instanceof Blob) return new File([input], "upload.bin", { type: input.type || "application/octet-stream" });
  // dataURL / URL
  const url = input;
  const res = await fetch(url);
  const blob = await res.blob();
  const nameGuess = url.split("/").pop()?.split("?")[0] || "upload.bin";
  return new File([blob], nameGuess, { type: blob.type || "application/octet-stream" });
}

export default function ProductForm() {
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const idParam = params.id;
  const isCreate = !idParam || idParam === "new";

  // ==================== NEW: slug touched + quill/content refs ====================
  const slugTouchedRef = useRef(false);
  const contentImageInputRef = useRef<HTMLInputElement | null>(null);

  // ------------------ Queries ------------------
  const { data: product, isFetching: fetchingProduct } = useGetProductAdminQuery(idParam as string, {
    skip: isCreate,
  });
  const { data: categories = [] } = useListCategoriesAdminQuery();

  // API Providers
  const { data: apiProvidersRaw = [] } = useListApiProvidersQuery({ activeOnly: true });

  type RawProvider =
    | { id?: string | number; provider_id?: string | number; name?: string; provider_name?: string }
    | null
    | undefined;

  const apiProviders: ApiProvider[] = useMemo(() => {
    const arr: RawProvider[] = Array.isArray(apiProvidersRaw) ? (apiProvidersRaw as RawProvider[]) : [];
    return arr
      .map((p) => ({
        id: String(p?.id ?? p?.provider_id ?? ""),
        name: String(p?.name ?? p?.provider_name ?? ""),
      }))
      .filter((x) => x.id && x.name);
  }, [apiProvidersRaw]);

  const { data: faqsRead = [], isFetching: fetchingFaqs } = useListProductFaqsQuery(
    { product_id: idParam as string, only_active: false },
    { skip: isCreate }
  );
  const { data: reviewsRead = [], isFetching: fetchingReviews } = useListProductReviewsQuery(
    { product_id: idParam as string, only_active: false },
    { skip: isCreate }
  );

  const { data: unusedStock = [] } = useListProductStockQuery(
    { product_id: idParam as string, is_used: 0 },
    { skip: isCreate }
  );

  const { data: usedStock = [] } = useListUsedStockAdminQuery(idParam as string, {
    skip: isCreate,
  });

  // ------------------ Mutations ------------------
  const [createProduct, { isLoading: creating }] = useCreateProductAdminMutation();
  const [updateProduct, { isLoading: updating }] = useUpdateProductAdminMutation();
  const [replaceReviews, { isLoading: savingReviews }] = useReplaceReviewsAdminMutation();
  const [replaceFaqs, { isLoading: savingFaqs }] = useReplaceFaqsAdminMutation();
  const [setProductStock, { isLoading: savingStock }] = useSetProductStockAdminMutation();

  const [uploadAsset, { isLoading: uploading }] = useUploadStorageAssetAdminMutation();

  // ------------------ Local UI State ------------------
  const [loading, setLoading] = useState(false);
  const [isCopyMode, setIsCopyMode] = useState(false);

  const parentCategories = useMemo(
    () => (categories as Pick<CategoryRow, "id" | "name" | "parent_id">[]).filter((c) => !c.parent_id),
    [categories]
  );
  const [selectedParentId, setSelectedParentId] = useState<string>("");

  const subCategories = useMemo(
    () =>
      (categories as Pick<CategoryRow, "id" | "name" | "parent_id">[]).filter(
        (c) => !!selectedParentId && c.parent_id === selectedParentId
      ),
    [categories, selectedParentId]
  );

  const [reviews, setReviews] = useState<ReviewInput[]>([]);
  const [faqs, setFAQs] = useState<FAQInput[]>([]);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [quantityOptions, setQuantityOptions] = useState<{ quantity: number; price: number }[]>([]);
  const [stockList, setStockList] = useState("");

  const [formData, setFormData] = useState<Partial<ProductAdmin>>({
    name: "",
    slug: "",
    price: 0,
    original_price: null,
    stock_quantity: 0,
    category_id: "",

    image_url: "",
    featured_image: null,
    featured_image_asset_id: null,
    featured_image_alt: null,
    gallery_urls: null,
    gallery_asset_ids: null,

    short_description: "",
    description: "",

    is_active: 1,
    show_on_homepage: 0,
    is_featured: 0,
    requires_shipping: 1,

    delivery_type: "manual",
    file_url: "",

    api_provider_id: "",
    api_product_id: "",
    api_quantity: 1,

    demo_url: "",
    demo_embed_enabled: 0,
    demo_button_text: "Demoyu İncele",

    epin_game_id: "",
    epin_product_id: "",
    auto_delivery_enabled: 0,

    min_order: 1,
    max_order: 0,
    min_barem: 0,
    max_barem: 0,
    barem_step: 0,
    pre_order_enabled: 0,
    tax_type: 0,

    review_count: 0,

    article_content: "",
    article_enabled: 0,
  });

  // ----- edit hydrate -----
  useEffect(() => {
    if (isCreate || !product) return;

    if (product.category_id) {
      const currentCat = (categories as CategoryRow[]).find((c) => c.id === product.category_id);
      if (currentCat?.parent_id) setSelectedParentId(currentCat.parent_id);
      else setSelectedParentId(product.category_id);
    }

    setFormData({
      ...product,
      is_active: (product.is_active ? 1 : 0) as 0 | 1,
      is_featured: (product.is_featured ? 1 : 0) as 0 | 1,
      show_on_homepage: "show_on_homepage" in product && product.show_on_homepage ? 1 : 0,
      requires_shipping: (product.requires_shipping ? 1 : 0) as 0 | 1,
      article_enabled: (product.article_enabled ? 1 : 0) as 0 | 1,
      demo_embed_enabled: (product.demo_embed_enabled ? 1 : 0) as 0 | 1,
    });

    setCustomFields((product.custom_fields as unknown as CustomField[]) ?? []);
    setQuantityOptions(product.quantity_options ?? []);
    setBadges((product.badges as Badge[]) ?? []);
    slugTouchedRef.current = true; // mevcut slug'ı ezme
  }, [isCreate, product, categories]);

  // name → slug (CategoryForm pattern)
  useEffect(() => {
    if (!slugTouchedRef.current) {
      setFormData((s) => ({ ...s, slug: slugify(String(s.name || "")) }));
    }
  }, [formData.name]);

  // ----- hydrate stock list -----
  useEffect(() => {
    if (isCreate) return;
    if ((product?.delivery_type ?? formData.delivery_type) !== "auto_stock") return;

    const list = (unusedStock ?? []).flatMap((s) => {
      if (s && typeof s === "object") {
        const obj = s as Record<string, unknown>;
        const code = typeof obj.stock_content === "string" ? obj.stock_content : typeof obj.code === "string" ? obj.code : "";
        return code.trim() ? [code.trim()] : [];
      }
      return [];
    });

    if (list.length > 0) setStockList(list.join("\n"));
  }, [isCreate, product?.delivery_type, formData.delivery_type, unusedStock]);

  // ========================= Upload helpers (CategoryForm-like) =========================
  const STORAGE_BUCKET = "products";

  const handleFeaturedUpload = async (file: File) => {
    try {
      if (!file.type.startsWith("image/")) {
        toast({ title: "Geçersiz", description: "Lütfen görsel dosyası seçin.", variant: "destructive" });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "Büyük Dosya", description: "Maksimum 5MB.", variant: "destructive" });
        return;
      }

      const folder = `products/${safeFolder((formData.slug as string) || slugify((formData.name as string) || "product"))}/cover`;

      const asset = await uploadAsset({
        file,
        bucket: STORAGE_BUCKET,
        folder,
        metadata: { module: "products", type: "cover" },
      }).unwrap();

      const url = (asset as UploadedAssetLike)?.url || "";
      const assetId = (asset as UploadedAssetLike)?.asset_id ?? (asset as UploadedAssetLike)?.id ?? "";

      if (!url) throw new Error("Yükleme başarısız (url yok)");

      setFormData((f) => ({
        ...f,
        featured_image: url,
        featured_image_asset_id: (assetId || null) as string | null,
        image_url: (url || f.image_url || null) as string | null, // legacy fallback
      }));

      toast({ title: "Yüklendi", description: "Kapak görseli yüklendi." });
    } catch (err: unknown) {
      const dataMsg =
        (err as { data?: { message?: string; error?: { message?: string } } })?.data?.message ||
        (err as { data?: { error?: { message?: string } } })?.data?.error?.message;
      toast({ title: "Hata", description: dataMsg || "Görsel yüklenemedi.", variant: "destructive" });
    }
  };

  // BasicInfo içinde event veya File gelebilir → union wrapper
  const onUploadFeatured = async (arg: File | EventLike) => {
    if (arg instanceof File) return handleFeaturedUpload(arg);
    const files = arg?.target?.files ?? arg?.currentTarget?.files;
    const file = files && files[0];
    if (file) return handleFeaturedUpload(file);
    toast({ title: "Dosya yok", description: "Bir görsel seçiniz.", variant: "destructive" });
  };

  // --- Quill içerik görseli: gizli input + ref (CategoryForm pattern)
  const onPickContentImage: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0] || null;
    e.target.value = ""; // aynı dosyayı tekrar seçebilmek için
    if (!file) return;
    try {
      const folder = `products/${safeFolder(
        (formData.slug as string) || slugify((formData.name as string) || "product")
      )}/content`;

      const asset = await uploadAsset({
        file,
        bucket: STORAGE_BUCKET,
        folder,
        metadata: { module: "products", type: "content-image" },
      }).unwrap();

      const url = (asset as UploadedAssetLike)?.url || "";
      if (!url) throw new Error("Yükleme başarısız (url yok)");

      // Quill'e embed: toolbar handler içinde selection yapılacak
      // burada sadece URL'i döndürüyoruz; handler index'e yerleştirecek.
      // Aşağıdaki handler, input tetiklendikten sonra embed eder.
      pendingContentImageUrl = url;
      toast({ title: "Görsel yüklendi", description: "Editöre eklendi.", variant: "default" });
    } catch (err: unknown) {
      const dataMsg =
        (err as { data?: { message?: string; error?: { message?: string } } })?.data?.message ||
        (err as { data?: { error?: { message?: string } } })?.data?.error?.message;
      toast({ title: "Hata", description: dataMsg || "İçerik görseli yüklenemedi.", variant: "destructive" });
    }
  };

  // Handler ile input click'i bağlamak için küçük state
  let pendingContentImageUrl: string | null = null;

  const makeQuillModules = useMemo(() => {
    return {
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
          image: function (this: unknown) {
            // CategoryForm’daki gibi gizli input’u tetikle
            contentImageInputRef.current?.click();
            // upload tamamlanınca URL pendingContentImageUrl'a gelir, şimdi embed et
            const q = getQuillFromThis(this);
            if (!q) return;
            // Embed’i küçük bir microtask gecikmesiyle yap
            queueMicrotask(() => {
              if (!pendingContentImageUrl) return;
              const url = pendingContentImageUrl;
              pendingContentImageUrl = null;

              const alt = window.prompt("Görsel alt metni (SEO için opsiyonel):") || "";
              const range = q.getSelection(true);
              const index = range ? range.index : q.getLength();

              if (alt.trim()) {
                const safeAlt = escapeHtml(alt.trim());
                const html = `<img src="${url}" alt="${safeAlt}" />`;
                q.clipboard.dangerouslyPasteHTML(index, html);
                q.setSelection(index + 1, 0);
              } else {
                q.insertEmbed(index, "image", url, "user");
                q.setSelection(index + 1, 0);
              }
            });
          },
        },
      },
    } as const;
  }, []);

  // ========================= Actions =========================
  const setField = <K extends keyof ProductAdmin>(key: K, val: ProductAdmin[K] | unknown) => {
    setFormData((f) => ({ ...f, [key]: val as ProductAdmin[K] }));
  };

  const handleCopyProduct = () => {
    if (!product) return;
    setIsCopyMode(true);
    const ts = Date.now();
    setFormData((f) => ({
      ...f,
      slug: `${(f.slug ?? product.slug).trim()}-kopya-${ts}`,
      name: `${(f.name ?? product.name).trim()} (Kopya)`,
    }));
    toast({ title: "Kopyalama Modu", description: "İstediğiniz değişiklikleri yapıp kaydedebilirsiniz." });
  };

  // ------------------ Submit ------------------
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const finalCategoryId =
      (formData.category_id as string) || (selectedParentId ? selectedParentId : null);

    const basePayload: UpsertProductBody & PatchProductBody = {
      name: String(formData.name ?? "").trim(),
      slug: String(formData.slug ?? "").trim(),

      price: Number(formData.price ?? 0),
      original_price: formData.original_price == null ? null : Number(formData.original_price),

      stock_quantity: Number(formData.stock_quantity ?? 0),
      category_id: (finalCategoryId as string) ?? null,

      short_description: (formData.short_description ?? null) as string | null,
      description: (formData.description ?? null) as string | null,

      image_url: (formData.image_url ?? null) as string | null,
      featured_image: (formData.featured_image ?? null) as string | null,
      featured_image_asset_id: (formData.featured_image_asset_id ?? null) as string | null,
      featured_image_alt: (formData.featured_image_alt ?? null) as string | null,
      gallery_urls: (formData.gallery_urls ?? null) as string[] | null,
      gallery_asset_ids: (formData.gallery_asset_ids ?? null) as string[] | null,

      is_active: !!formData.is_active,
      show_on_homepage: !!("show_on_homepage" in (formData as object) && (formData as Record<string, unknown>).show_on_homepage),
      is_featured: !!formData.is_featured,
      requires_shipping: !!formData.requires_shipping,

      delivery_type: (formData.delivery_type ?? "manual") as UpsertProductBody["delivery_type"],
      file_url: (formData.file_url ?? null) as string | null,

      api_provider_id: (formData.api_provider_id ?? null) as string | null,
      api_product_id: (formData.api_product_id ?? null) as string | null,
      api_quantity: formData.api_quantity == null ? null : Number(formData.api_quantity),

      article_content: (formData.article_content ?? null) as string | null,
      article_enabled: !!formData.article_enabled,
      demo_url: (formData.demo_url ?? null) as string | null,
      demo_embed_enabled: !!formData.demo_embed_enabled,
      demo_button_text: (formData.demo_button_text ?? null) as string | null,

      badges: (badges ?? null) as UpsertProductBody["badges"],
      custom_fields: (customFields ?? null) as UpsertProductBody["custom_fields"],
      quantity_options: (quantityOptions ?? null) as UpsertProductBody["quantity_options"],

      min_order: (formData.min_order ?? null) as number | null,
      max_order: (formData.max_order ?? null) as number | null,
      min_barem: (formData.min_barem ?? null) as number | null,
      max_barem: (formData.max_barem ?? null) as number | null,
      barem_step: (formData.barem_step ?? null) as number | null,

      tax_type: (formData.tax_type ?? null) as number | null,

      epin_game_id: (formData.epin_game_id ?? null) as string | null,
      epin_product_id: (formData.epin_product_id ?? null) as string | null,
      auto_delivery_enabled: !!formData.auto_delivery_enabled,
      pre_order_enabled: !!formData.pre_order_enabled,

      review_count: Number(formData.review_count ?? 0),
    };

    try {
      let productId = idParam as string | undefined;

      if (isCreate || isCopyMode) {
        const created = await createProduct(basePayload as UpsertProductBody).unwrap();
        productId = created.id;
      } else {
        await updateProduct({ id: idParam as string, body: basePayload as PatchProductBody }).unwrap();
        productId = idParam as string;
      }

      if ((formData.delivery_type ?? "manual") === "auto_stock" && productId) {
        const lines = stockList
          .split("\n")
          .map((s) => s.trim())
          .filter((s) => s.length > 0);
        await setProductStock({ id: productId, lines }).unwrap();
      }

      if (productId) {
        const reviewsPayload: TReview[] = reviews.map((r): TReview => ({
          id: r.id,
          product_id: productId!,
          customer_name: r.customer_name ?? "",
          rating: Number(r.rating ?? 5),
          comment: r.comment ?? "",
          review_date: r.review_date,
          is_active: r.is_active ? 1 : 0,
          created_at: undefined,
          updated_at: undefined,
        }));

        const faqsPayload: TFAQ[] = faqs.map((f, i): TFAQ => ({
          id: f.id,
          product_id: productId!,
          question: f.question,
          answer: f.answer,
          display_order: Number(f.display_order ?? i),
          is_active: f.is_active ? 1 : 0,
          created_at: undefined,
          updated_at: undefined,
        }));

        await replaceReviews({ id: productId, reviews: reviewsPayload }).unwrap();
        await replaceFaqs({ id: productId, faqs: faqsPayload }).unwrap();
      }

      toast({
        title: "Başarılı",
        description: isCreate || isCopyMode ? "Ürün oluşturuldu." : "Ürün güncellendi.",
      });
      navigate("/admin/products");
    } catch (err: unknown) {
      console.error(err);
      toast({ title: "Hata", description: "Ürün kaydedilirken bir hata oluştu.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // ========================== Render ==========================
  return (
    <AdminLayout title={isCopyMode ? "Ürünü Kopyala" : isCreate ? "Yeni Ürün Ekle" : "Ürünü Düzenle"}>
      {/* gizli input: Quill içerik görseli (CategoryForm gibi) */}
      <input
        ref={contentImageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onPickContentImage}
        disabled={uploading}
      />

      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin/products")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Geri
          </Button>

          {!isCreate && !isCopyMode && (
            <Button type="button" variant="outline" onClick={handleCopyProduct}>
              Ürünü Kopyala
            </Button>
          )}
        </div>

        <form onSubmit={onSubmit}>
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle>Temel Bilgiler</CardTitle>
              <Button
                type="submit"
                disabled={loading || creating || updating || savingFaqs || savingReviews || savingStock}
              >
                <Save className="mr-2 h-4 w-4" />
                {loading || creating || updating ? "Kaydediliyor..." : isCreate || isCopyMode ? "Oluştur" : "Güncelle"}
              </Button>
            </CardHeader>

            <CardContent className="space-y-6">
              <BasicInfo
                formData={formData}
                setField={setField}
                quantityOptions={quantityOptions}
                onUploadFeatured={onUploadFeatured}   // ← Event veya File gelebilir; içeride File’a indirgenir
                uploading={uploading}
                quillModules={makeQuillModules}       // ← toolbar “image” gizli inputu tetikler
              />

              <CategorySelect
                parentCategories={parentCategories}
                subCategories={subCategories}
                selectedParentId={selectedParentId}
                setSelectedParentId={setSelectedParentId}
                formData={formData}
                setField={setField}
              />
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardContent className="pt-6">
              <Tabs defaultValue="customization" className="w-full">
                <TabsList className="grid w-full grid-cols-7">
                  <TabsTrigger value="customization">Ürün Özelleştirme</TabsTrigger>
                  <TabsTrigger value="demo">Demo & Önizleme</TabsTrigger>
                  <TabsTrigger value="faq">Sıkça Sorulan Sorular</TabsTrigger>
                  <TabsTrigger value="reviews">Müşteri Yorumları</TabsTrigger>
                  <TabsTrigger value="delivery">Teslimat Ayarları</TabsTrigger>
                  <TabsTrigger value="turkpin">EPIN</TabsTrigger>
                  <TabsTrigger value="article">Makale Ayarı</TabsTrigger>
                </TabsList>

                <TabsContent value="customization" className="space-y-6 mt-6">
                  <CustomizationSection
                    quantityOptions={quantityOptions}
                    setQuantityOptions={setQuantityOptions}
                    customFields={setCustomFields ? customFields : []}
                    setCustomFields={setCustomFields}
                    badges={badges}
                    setBadges={setBadges}
                  />
                </TabsContent>

                <TabsContent value="demo" className="space-y-6 mt-6">
                  <DemoSection formData={formData} setField={setField} />
                </TabsContent>

                <TabsContent value="faq" className="space-y-4 mt-6">
                  <FaqSection faqs={faqs} setFAQs={setFAQs} />
                </TabsContent>

                <TabsContent value="reviews" className="space-y-4 mt-6">
                  <ReviewsSection reviews={reviews} setReviews={setReviews} />
                </TabsContent>

                <TabsContent value="delivery" className="space-y-6 mt-6">
                  <DeliverySection
                    formData={formData}
                    setField={setField}
                    stockList={stockList}
                    setStockList={setStockList}
                    idParam={idParam}
                    usedStock={(usedStock ?? []) as unknown[]}
                    apiProviders={apiProviders}
                    onUploadFile={async (arg) => {
                      // DeliverySection dosya yükleme: sadece File kabul et
                      const ev = arg as EventLike;
                      const files = ev?.target?.files ?? ev?.currentTarget?.files;
                      const f = (files && files[0]) || (arg as File);
                      if (!f) return;
                      // products/files klasörüne at
                      try {
                        if (f.size > 50 * 1024 * 1024) {
                          toast({ title: "Büyük Dosya", description: "Maksimum 50MB.", variant: "destructive" });
                          return;
                        }
                        const folder = `products/${safeFolder(
                          (formData.slug as string) || slugify((formData.name as string) || "product")
                        )}/files`;

                        const asset = await uploadAsset({
                          file: f,
                          bucket: STORAGE_BUCKET,
                          folder,
                          metadata: { module: "products", type: "file" },
                        }).unwrap();

                        const url = (asset as UploadedAssetLike)?.url || "";
                        if (!url) throw new Error("Yükleme başarısız (url yok)");
                        setFormData((fd) => ({ ...fd, file_url: (url || null) as string | null }));
                        toast({ title: "Yüklendi", description: "Dosya yüklendi." });
                      } catch (e: unknown) {
                        const dataMsg =
                          (e as { data?: { message?: string; error?: { message?: string } } })?.data?.message ||
                          (e as { data?: { error?: { message?: string } } })?.data?.error?.message;
                        toast({ title: "Hata", description: dataMsg || "Dosya yüklenemedi.", variant: "destructive" });
                      }
                    }}
                    uploading={uploading}
                  />
                </TabsContent>

                <TabsContent value="turkpin" className="space-y-6 mt-6">
                  <TurkpinSettings formData={formData} setFormData={setFormData} />
                </TabsContent>

                <TabsContent value="article" className="space-y-6 mt-6">
                  <ArticleSection formData={formData} setField={setField} quillModules={makeQuillModules} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <div className="flex gap-2 justify-end mt-6">
            <Button type="button" variant="outline" onClick={() => navigate("/admin/products")}>
              İptal
            </Button>
            <Button
              type="submit"
              className="gradient-primary"
              disabled={
                loading ||
                creating ||
                updating ||
                fetchingProduct ||
                fetchingReviews ||
                fetchingFaqs ||
                savingFaqs ||
                savingReviews ||
                savingStock
              }
            >
              {loading || creating || updating ? "Kaydediliyor..." : isCreate || isCopyMode ? "Oluştur" : "Güncelle"}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
