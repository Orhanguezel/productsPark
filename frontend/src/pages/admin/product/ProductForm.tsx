// =============================================================
// FILE: src/components/admin/products/ProductForm.tsx
// FINAL — Admin Product Form (RTK + types aligned)
// - FIX: Responsive TabsList/TabsTrigger (no overlap, works all screens)
// - FIX: GalleryItem typing + type guard (no duplicate GalleryItem, no null in result)
// - FIX: setProductStock mutation arg is { id, lines } (no body wrapper)
// - FIX: UsedStockItem imported from product_stock.ts (single source of truth)
// =============================================================

'use client';

import * as React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { AdminLayout } from '@/components/admin/AdminLayout';
import { TurkpinSettings } from '@/components/admin/TurkpinSettings';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, ArrowLeft } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

import { buildSafeQuillModules, QUILL_FORMATS } from '@/components/common/safeQuill';

import {
  useGetProductAdminQuery,
  useCreateProductAdminMutation,
  useUpdateProductAdminMutation,
  useReplaceFaqsAdminMutation,
  useReplaceReviewsAdminMutation,
  useListApiProvidersQuery,
  useListProductFaqsQuery,
  useListProductReviewsQuery,
  useListProductStockAdminQuery,
  useCreateAssetAdminMutation,
  useListCategoriesAdminQuery,
  useToggleHomepageProductAdminMutation,
  useSetProductStockAdminMutation,
  useListUsedStockAdminQuery,
} from '@/integrations/hooks';

import type {
  ProductAdmin,
  CategoryRow,
  Badge,
  CustomField,
  QuantityOption,
  ApiProviderRow,
  ProductFaq,
  ProductFaqInput,
  ProductReview,
  ProductReviewInput,
  Stock,
  ProductDeliveryType,
  CommonProductPayload,
  CreateProductBody,
  UpdateProductBody,
  UsedStockItem,
} from '@/integrations/types';

import BasicInfo from './form/sections/BasicInfo';
import CategorySelect from './form/sections/CategorySelect';
import CustomizationSection from './form/sections/CustomizationSection';
import FaqSection from './form/sections/FaqSection';
import ReviewsSection from './form/sections/ReviewsSection';
import DeliverySection from './form/sections/DeliverySection';
import DemoSection from './form/sections/DemoSection';
import ArticleSection from './form/sections/ArticleSection';

/* ---------------- utils ---------------- */

const slugify = (v: string) =>
  (v || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const escapeHtml = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const safeFolder = (s: string) => (s || '').replace(/[^a-z0-9/_-]/g, '') || 'products';

type QuillEditor = {
  getSelection: (focus?: boolean) => { index: number } | null;
  clipboard: { dangerouslyPasteHTML: (index: number, html: string) => void };
  insertEmbed: (index: number, type: string, value: string, source?: string) => void;
  getLength: () => number;
  setSelection: (index: number, length: number) => void;
};

const isQuillEditor = (x: unknown): x is QuillEditor =>
  !!x &&
  typeof (x as QuillEditor).getSelection === 'function' &&
  typeof (x as QuillEditor).getLength === 'function' &&
  typeof (x as QuillEditor).insertEmbed === 'function' &&
  !!(x as QuillEditor).clipboard;

type UploadedAssetLike = {
  url?: string | null;
  id?: string | null;
  asset_id?: string | null;
};

// ✅ single GalleryItem definition (no duplicates)
// asset_id is required but can be null => predicate can narrow cleanly
type GalleryItem = {
  url: string;
  asset_id: string | null;
};

type GalleryUploadResult = GalleryItem | null;
const isGalleryItem = (x: GalleryUploadResult): x is GalleryItem => !!x && !!x.url;

const todayISO = (): string => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const to01 = (v: unknown): 0 | 1 => (v ? 1 : 0);
const toBool = (v: unknown): boolean => !!v;

/** Reviews view -> input mapper */
const mapReviewsToInput = (rows: ProductReview[]): ProductReviewInput[] =>
  (rows ?? []).map((r) => ({
    id: r.id,
    customer_name: r.customer_name ?? '',
    rating: Number(r.rating ?? 5) || 5,
    comment: r.comment ?? '',
    review_date: (r.review_date || todayISO()).slice(0, 10),
    is_active: r.is_active ? 1 : 0,
  }));

/** Faqs view -> input mapper */
const mapFaqsToInput = (rows: ProductFaq[]): ProductFaqInput[] =>
  (rows ?? []).map((f, i) => ({
    id: f.id,
    question: f.question ?? '',
    answer: f.answer ?? '',
    display_order: Number.isFinite(f.display_order) ? f.display_order : i,
    is_active: f.is_active ? 1 : 0,
  }));

/** Stock row -> code extraction tolerant */
const pickStockCode = (s: Stock): string => {
  const raw =
    typeof (s as { code?: unknown })?.code === 'string'
      ? (s as { code: string }).code
      : typeof (s as { stock_content?: unknown })?.stock_content === 'string'
        ? (s as { stock_content: string }).stock_content
        : '';
  return String(raw || '').trim();
};

/* -------- tolerant JSON parse (string or array) -------- */
function parseJsonArray<T>(v: unknown): T[] {
  if (Array.isArray(v)) return v as T[];
  if (typeof v === 'string') {
    const s = v.trim();
    if (!s) return [];
    try {
      const parsed = JSON.parse(s);
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

export default function ProductForm() {
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();

  const idParam = params.id;
  const isCreate = !idParam || idParam === 'new';
  const idParamSafe = idParam ?? '';

  const lastQuillRef = useRef<QuillEditor | null>(null);
  const contentImageInputRef = useRef<HTMLInputElement | null>(null);

  // ------------------ Queries ------------------
  const { data: product, isFetching: fetchingProduct } = useGetProductAdminQuery(
    idParam as string,
    {
      skip: isCreate,
    },
  );

  const { data: categories = [], isFetching: fetchingCategories } = useListCategoriesAdminQuery();

  const { data: apiProvidersRaw = [] } = useListApiProvidersQuery({ activeOnly: true });

  const { data: faqsRead = [], isFetching: fetchingFaqs } = useListProductFaqsQuery(
    { product_id: idParam as string, only_active: false },
    { skip: isCreate },
  );

  const { data: reviewsRead = [], isFetching: fetchingReviews } = useListProductReviewsQuery(
    { product_id: idParam as string, only_active: false },
    { skip: isCreate },
  );

  // ✅ Admin stock list (unused)
  const { data: unusedStock = [] } = useListProductStockAdminQuery(
    { id: idParam as string, params: { is_used: 0 } },
    { skip: isCreate },
  );

  // ✅ Used stock (admin) — hook expects { id, limit?, offset? }
  const { data: usedStock = [] } = useListUsedStockAdminQuery(
    { id: idParamSafe },
    { skip: isCreate },
  );

  // ------------------ Mutations ------------------
  const [createProduct, { isLoading: creating }] = useCreateProductAdminMutation();
  const [updateProduct, { isLoading: updating }] = useUpdateProductAdminMutation();

  const [replaceReviews, { isLoading: savingReviews }] = useReplaceReviewsAdminMutation();
  const [replaceFaqs, { isLoading: savingFaqs }] = useReplaceFaqsAdminMutation();
  const [setProductStock, { isLoading: savingStock }] = useSetProductStockAdminMutation();

  const [uploadAsset, { isLoading: uploading }] = useCreateAssetAdminMutation();

  const [toggleHomepageProduct, { isLoading: togglingHomepage }] =
    useToggleHomepageProductAdminMutation();

  // ------------------ Derived ------------------
  const apiProviders = useMemo<Array<Pick<ApiProviderRow, 'id' | 'name'>>>(() => {
    const arr = Array.isArray(apiProvidersRaw) ? (apiProvidersRaw as ApiProviderRow[]) : [];
    return arr
      .map((p) => ({ id: String(p?.id ?? ''), name: String(p?.name ?? '') }))
      .filter((x) => x.id && x.name);
  }, [apiProvidersRaw]);

  const parentCategories = useMemo(
    () =>
      (categories as Pick<CategoryRow, 'id' | 'name' | 'parent_id'>[]).filter((c) => !c.parent_id),
    [categories],
  );

  const [selectedParentId, setSelectedParentId] = useState<string>('');

  const subCategories = useMemo(
    () =>
      (categories as Pick<CategoryRow, 'id' | 'name' | 'parent_id'>[]).filter(
        (c) => !!selectedParentId && c.parent_id === selectedParentId,
      ),
    [categories, selectedParentId],
  );

  // ------------------ Local state ------------------
  const [loading, setLoading] = useState(false);
  const [isCopyMode, setIsCopyMode] = useState(false);

  const [reviews, setReviews] = useState<ProductReviewInput[]>([]);
  const [faqs, setFAQs] = useState<ProductFaqInput[]>([]);

  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [quantityOptions, setQuantityOptions] = useState<QuantityOption[]>([]);

  const [stockList, setStockList] = useState('');
  const [reviewCountDirty, setReviewCountDirty] = useState(false);

  const [formData, setFormData] = useState<Partial<ProductAdmin>>({
    name: '',
    slug: '',
    category_id: null,

    image_url: null,
    featured_image: null,
    featured_image_asset_id: null,
    featured_image_alt: null,
    gallery_urls: null,
    gallery_asset_ids: null,

    short_description: null,
    description: null,

    is_active: 1,
    show_on_homepage: 0,
    is_featured: 0,
    requires_shipping: 1,

    delivery_type: 'manual',
    file_url: null,

    api_provider_id: null,
    api_product_id: null,
    api_quantity: 1,

    demo_url: null,
    demo_embed_enabled: 0,
    demo_button_text: 'Demoyu İncele',

    epin_game_id: null,
    epin_product_id: null,
    auto_delivery_enabled: 0,

    min_order: 1,
    max_order: 0,
    min_barem: 0,
    max_barem: 0,
    barem_step: 0,
    pre_order_enabled: 0,
    tax_type: 0,

    article_content: null,
    article_enabled: 0,

    review_count: 0,
    price: 0,
    stock_quantity: 0,
  });

  // ----- hydrate on edit -----
  useEffect(() => {
    if (isCreate || !product) return;

    if (product.category_id) {
      const currentCat = (categories as CategoryRow[]).find((c) => c.id === product.category_id);
      if (currentCat?.parent_id) setSelectedParentId(currentCat.parent_id);
      else setSelectedParentId(product.category_id);
    }

    setFormData({
      ...product,
      is_active: to01(product.is_active),
      is_featured: to01(product.is_featured),
      show_on_homepage: to01(product.show_on_homepage),
      requires_shipping: to01(product.requires_shipping),
      article_enabled: to01(product.article_enabled),
      demo_embed_enabled: to01(product.demo_embed_enabled),
    });

    setCustomFields(parseJsonArray<CustomField>(product.custom_fields));
    setQuantityOptions(parseJsonArray<QuantityOption>(product.quantity_options));
    setBadges(parseJsonArray<Badge>(product.badges));

    setReviewCountDirty(false);
  }, [isCreate, product, categories]);

  // name -> slug auto until user touches slug
  const slugTouchedRef = useRef(false);
  useEffect(() => {
    if (!slugTouchedRef.current) {
      setFormData((s) => ({ ...s, slug: slugify(String(s.name || '')) }));
    }
  }, [formData.name]);

  // hydrate stock list when delivery_type auto_stock
  useEffect(() => {
    if (isCreate) return;

    const dt = (product?.delivery_type ?? formData.delivery_type) as ProductDeliveryType | null;
    if (dt !== 'auto_stock') return;

    const list = (unusedStock as Stock[]).flatMap((s) => {
      const t = pickStockCode(s);
      return t ? [t] : [];
    });

    if (list.length > 0) setStockList(list.join('\n'));
  }, [isCreate, product?.delivery_type, formData.delivery_type, unusedStock]);

  // hydrate reviews/faqs
  useEffect(() => {
    if (isCreate) return;
    setReviews(mapReviewsToInput(reviewsRead as ProductReview[]));
  }, [isCreate, reviewsRead]);

  useEffect(() => {
    if (isCreate) return;
    setFAQs(mapFaqsToInput(faqsRead as ProductFaq[]));
  }, [isCreate, faqsRead]);

  // ========================= Upload helpers =========================
  const STORAGE_BUCKET = 'products';

  const handleFeaturedUpload = async (file: File) => {
    try {
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Geçersiz',
          description: 'Lütfen görsel dosyası seçin.',
          variant: 'destructive',
        });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: 'Büyük Dosya', description: 'Maksimum 5MB.', variant: 'destructive' });
        return;
      }

      const folder = `products/${safeFolder(String(formData.slug || '') || slugify(String(formData.name || 'product')))}/cover`;

      const asset = await uploadAsset({
        file,
        bucket: STORAGE_BUCKET,
        folder,
        metadata: { module: 'products', type: 'cover' },
      }).unwrap();

      const url = (asset as UploadedAssetLike)?.url || '';
      const assetId =
        (asset as UploadedAssetLike)?.asset_id ?? (asset as UploadedAssetLike)?.id ?? '';

      if (!url) throw new Error('Yükleme başarısız (url yok)');

      setFormData((f) => ({
        ...f,
        featured_image: url,
        featured_image_asset_id: assetId || null,
        image_url: url || f.image_url || null,
      }));

      toast({ title: 'Yüklendi', description: 'Kapak görseli yüklendi.' });
    } catch (err: unknown) {
      const dataMsg =
        (err as { data?: { message?: string; error?: { message?: string } } })?.data?.message ||
        (err as { data?: { error?: { message?: string } } })?.data?.error?.message;
      toast({
        title: 'Hata',
        description: dataMsg || 'Görsel yüklenemedi.',
        variant: 'destructive',
      });
    }
  };

  const handleGalleryUpload = async (files: File[]): Promise<GalleryItem[]> => {
    try {
      const validFiles = (files ?? []).filter((file) => {
        if (!file.type.startsWith('image/')) {
          toast({
            title: 'Geçersiz',
            description: `${file.name} bir görsel dosyası değil.`,
            variant: 'destructive',
          });
          return false;
        }
        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: 'Büyük Dosya',
            description: `${file.name} maksimum 5MB.`,
            variant: 'destructive',
          });
          return false;
        }
        return true;
      });

      if (!validFiles.length) return [];

      const folder = `products/${safeFolder(String(formData.slug || '') || slugify(String(formData.name || 'product')))}/gallery`;

      const results: GalleryUploadResult[] = await Promise.all(
        validFiles.map(async (file) => {
          const asset = await uploadAsset({
            file,
            bucket: STORAGE_BUCKET,
            folder,
            metadata: { module: 'products', type: 'gallery' },
          }).unwrap();

          const url = (asset as UploadedAssetLike)?.url || '';
          const assetId =
            (asset as UploadedAssetLike)?.asset_id ?? (asset as UploadedAssetLike)?.id ?? '';

          if (!url) return null;

          const item: GalleryItem = {
            url,
            asset_id: assetId ? String(assetId) : null,
          };
          return item;
        }),
      );

      const uploaded = results.filter(isGalleryItem);

      if (uploaded.length) {
        toast({ title: 'Yüklendi', description: `${uploaded.length} galeri görseli yüklendi.` });
      }

      return uploaded;
    } catch (err: unknown) {
      const dataMsg =
        (err as { data?: { message?: string; error?: { message?: string } } })?.data?.message ||
        (err as { data?: { error?: { message?: string } } })?.data?.error?.message;
      toast({
        title: 'Hata',
        description: dataMsg || 'Galeri görseli yüklenemedi.',
        variant: 'destructive',
      });
      return [];
    }
  };

  const onPickContentImage: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0] || null;
    e.target.value = '';
    if (!file) return;

    try {
      const folder = `products/${safeFolder(String(formData.slug || '') || slugify(String(formData.name || 'product')))}/content`;

      const asset = await uploadAsset({
        file,
        bucket: STORAGE_BUCKET,
        folder,
        metadata: { module: 'products', type: 'content-image' },
      }).unwrap();

      const url = (asset as UploadedAssetLike)?.url || '';
      if (!url) throw new Error('Yükleme başarısız (url yok)');

      const q = lastQuillRef.current;
      if (!q) {
        toast({
          title: 'Editör bulunamadı',
          description: 'İçerik editörü hazır değil.',
          variant: 'destructive',
        });
        return;
      }

      const alt = window.prompt('Görsel alt metni (SEO için opsiyonel):') || '';
      const range = q.getSelection(true);
      const index = range ? range.index : q.getLength();

      if (alt.trim()) {
        const safeAlt = escapeHtml(alt.trim());
        const html = `<img src="${url}" alt="${safeAlt}" />`;
        q.clipboard.dangerouslyPasteHTML(index, html);
        q.setSelection(index + 1, 0);
      } else {
        q.insertEmbed(index, 'image', url, 'user');
        q.setSelection(index + 1, 0);
      }

      toast({ title: 'Görsel eklendi', description: 'İçeriğe görsel eklendi.' });
    } catch (err: unknown) {
      const dataMsg =
        (err as { data?: { message?: string; error?: { message?: string } } })?.data?.message ||
        (err as { data?: { error?: { message?: string } } })?.data?.error?.message;
      toast({
        title: 'Hata',
        description: dataMsg || 'İçerik görseli yüklenemedi.',
        variant: 'destructive',
      });
    }
  };

  const quillModules = useMemo(
    () =>
      buildSafeQuillModules(
        () => contentImageInputRef.current?.click(),
        (qUnknown) => {
          if (isQuillEditor(qUnknown)) lastQuillRef.current = qUnknown;

          // drag-drop image to editor disabled
          try {
            const qAny = qUnknown as unknown as { root?: HTMLElement };
            qAny?.root?.addEventListener?.('drop', (ev: DragEvent) => {
              const hasImg =
                !!ev.dataTransfer?.files?.length ||
                Array.from(ev.dataTransfer?.items ?? []).some(
                  (it) => it.kind === 'file' || (it.type || '').toLowerCase().startsWith('image/'),
                );
              if (hasImg) {
                ev.preventDefault();
                ev.stopPropagation();
              }
            });
          } catch {
            /* no-op */
          }
        },
      ),
    [],
  );

  // ========================= File upload (delivery_type=file) =========================

  const handleProductFileUpload = async (file: File) => {
    try {
      if (file.size > 50 * 1024 * 1024) {
        toast({ title: 'Büyük Dosya', description: 'Maksimum 50MB.', variant: 'destructive' });
        return;
      }

      const folder = `products/${safeFolder(String(formData.slug || '') || slugify(String(formData.name || 'product')))}/files`;

      const asset = await uploadAsset({
        file,
        bucket: STORAGE_BUCKET,
        folder,
        metadata: { module: 'products', type: 'file' },
      }).unwrap();

      const url = (asset as UploadedAssetLike)?.url || '';
      if (!url) throw new Error('Yükleme başarısız (url yok)');

      setFormData((fd) => ({ ...fd, file_url: url || null }));
      toast({ title: 'Yüklendi', description: 'Dosya yüklendi.' });
    } catch (e: unknown) {
      const dataMsg =
        (e as { data?: { message?: string; error?: { message?: string } } })?.data?.message ||
        (e as { data?: { error?: { message?: string } } })?.data?.error?.message;
      toast({
        title: 'Hata',
        description: dataMsg || 'Dosya yüklenemedi.',
        variant: 'destructive',
      });
    }
  };

  // ========================= Actions / Submit =========================

  const setField = <K extends keyof ProductAdmin>(key: K, val: ProductAdmin[K]) => {
    setFormData((f) => ({ ...f, [key]: val }));
    if (key === 'review_count') setReviewCountDirty(true);
  };

  const handleCopyProduct = () => {
    if (!product) return;
    setIsCopyMode(true);
    const ts = Date.now();
    setFormData((f) => ({
      ...f,
      slug: `${String(f.slug ?? product.slug).trim()}-kopya-${ts}`,
      name: `${String(f.name ?? product.name).trim()} (Kopya)`,
    }));
    toast({
      title: 'Kopyalama Modu',
      description: 'İstediğiniz değişiklikleri yapıp kaydedebilirsiniz.',
    });
  };

  const buildCommonPayload = (): CommonProductPayload => {
    const name = String(formData.name ?? '').trim();
    const slug = String(formData.slug ?? '').trim();

    const price = Number(formData.price ?? 0) || 0;
    const stock_quantity = Number(formData.stock_quantity ?? 0) || 0;
    const sales = Number(formData.sales_count ?? 0) || 0;

    const category_id =
      String(formData.category_id ?? '').trim() ||
      (selectedParentId ? selectedParentId : '') ||
      null;

    const out: CommonProductPayload = {
      name,
      slug,
      description: (formData.description ?? null) as string | null,
      short_description: (formData.short_description ?? null) as string | null,
      category_id,
      price,
      original_price: formData.original_price == null ? null : Number(formData.original_price) || 0,
      stock_quantity,
      sales_count: sales,

      image_url: (formData.image_url ?? null) as string | null,

      featured_image: (formData.featured_image ?? null) as string | null,
      featured_image_asset_id: (formData.featured_image_asset_id ?? null) as string | null,
      featured_image_alt: (formData.featured_image_alt ?? null) as string | null,

      gallery_urls: (formData.gallery_urls ?? null) as string[] | null,

      is_active: toBool(formData.is_active),
      show_on_homepage: toBool(formData.show_on_homepage),

      delivery_type: ((formData.delivery_type ?? 'manual') as ProductDeliveryType) || 'manual',

      custom_fields: customFields,
      badges,
      quantity_options: quantityOptions,
    };

    if (formData.file_url !== undefined) out.file_url = formData.file_url ?? null;

    if (formData.api_provider_id !== undefined)
      out.api_provider_id = formData.api_provider_id ?? null;
    if (formData.api_product_id !== undefined) out.api_product_id = formData.api_product_id ?? null;
    if (formData.api_quantity !== undefined) out.api_quantity = formData.api_quantity ?? null;

    if (formData.demo_url !== undefined) out.demo_url = formData.demo_url ?? null;
    if (formData.demo_button_text !== undefined)
      out.demo_button_text = formData.demo_button_text ?? null;
    if (formData.demo_embed_enabled !== undefined)
      out.demo_embed_enabled = to01(formData.demo_embed_enabled);

    if (formData.article_content !== undefined)
      out.article_content = formData.article_content ?? null;
    if (formData.article_enabled !== undefined)
      out.article_enabled = to01(formData.article_enabled);

    if (formData.requires_shipping !== undefined)
      out.requires_shipping = to01(formData.requires_shipping);

    if (formData.epin_game_id !== undefined) out.epin_game_id = formData.epin_game_id ?? null;
    if (formData.epin_product_id !== undefined)
      out.epin_product_id = formData.epin_product_id ?? null;
    if (formData.auto_delivery_enabled !== undefined)
      out.auto_delivery_enabled = to01(formData.auto_delivery_enabled);

    if (formData.min_order !== undefined) out.min_order = formData.min_order ?? null;
    if (formData.max_order !== undefined) out.max_order = formData.max_order ?? null;
    if (formData.min_barem !== undefined) out.min_barem = formData.min_barem ?? null;
    if (formData.max_barem !== undefined) out.max_barem = formData.max_barem ?? null;
    if (formData.barem_step !== undefined) out.barem_step = formData.barem_step ?? null;
    if (formData.pre_order_enabled !== undefined)
      out.pre_order_enabled = to01(formData.pre_order_enabled);
    if (formData.tax_type !== undefined) out.tax_type = formData.tax_type ?? null;

    return out;
  };

  const normalizeReviewCount = (raw: unknown): number => {
    if (raw === undefined || raw === null || raw === '') return 0;
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const deliveryType: ProductDeliveryType =
      ((formData.delivery_type ?? 'manual') as ProductDeliveryType) || 'manual';

    const reviewCountForCreate = normalizeReviewCount(formData.review_count);
    const reviewCountForUpdate = reviewCountDirty
      ? normalizeReviewCount(formData.review_count)
      : undefined;

    try {
      let productId: string | undefined = isCreate ? undefined : (idParam as string);
      const commonPayload = buildCommonPayload();

      if (isCreate || isCopyMode) {
        const createPayload: CreateProductBody = {
          ...commonPayload,
          review_count: reviewCountForCreate,
        };
        const created = await createProduct(createPayload).unwrap();
        productId = String((created as ProductAdmin)?.id || '');
      } else {
        const updatePayload: UpdateProductBody = {
          ...commonPayload,
          ...(reviewCountForUpdate !== undefined ? { review_count: reviewCountForUpdate } : {}),
        };
        await updateProduct({ id: idParam as string, body: updatePayload }).unwrap();
        productId = idParam as string;
      }

      if (!productId) throw new Error('Ürün ID alınamadı');

      // homepage toggle (compat)
      await toggleHomepageProduct({
        id: productId,
        show_on_homepage: toBool(formData.show_on_homepage),
      }).unwrap();

      // ✅ auto stock: replace lines — FINAL ({ id, lines })
      if (deliveryType === 'auto_stock') {
        const lines = stockList
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean);
        await setProductStock({ id: productId, lines }).unwrap();
      }

      const reviewsPayload: ProductReviewInput[] = reviews.map((r) => ({
        ...(r.id ? { id: r.id } : {}),
        customer_name: r.customer_name ?? '',
        rating: Number(r.rating ?? 5) || 5,
        comment: r.comment ?? '',
        review_date: (r.review_date || todayISO()).slice(0, 10),
        is_active:
          typeof r.is_active === 'boolean' ? (r.is_active ? 1 : 0) : r.is_active === 1 ? 1 : 0,
      }));

      const faqsPayload: ProductFaqInput[] = faqs.map((f, i) => ({
        ...(f.id ? { id: f.id } : {}),
        question: f.question ?? '',
        answer: f.answer ?? '',
        display_order: Number.isFinite(f.display_order) ? f.display_order : i,
        is_active:
          typeof f.is_active === 'boolean' ? (f.is_active ? 1 : 0) : f.is_active === 1 ? 1 : 0,
      }));

      await replaceReviews({ id: productId, reviews: reviewsPayload }).unwrap();
      await replaceFaqs({ id: productId, faqs: faqsPayload }).unwrap();

      toast({
        title: 'Başarılı',
        description: isCreate || isCopyMode ? 'Ürün oluşturuldu.' : 'Ürün güncellendi.',
      });
      navigate('/admin/products');
    } catch (err: unknown) {
      const dataMsg =
        (err as { data?: { message?: string; error?: { message?: string } } })?.data?.message ||
        (err as { data?: { error?: { message?: string } } })?.data?.error?.message;
      // eslint-disable-next-line no-console
      console.error(err);
      toast({
        title: 'Hata',
        description: dataMsg || 'Ürün kaydedilirken bir hata oluştu.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const busy =
    loading ||
    creating ||
    updating ||
    uploading ||
    savingFaqs ||
    savingReviews ||
    savingStock ||
    togglingHomepage;

  const busyFetch = fetchingProduct || fetchingReviews || fetchingFaqs || fetchingCategories;

  return (
    <AdminLayout
      title={isCopyMode ? 'Ürünü Kopyala' : isCreate ? 'Yeni Ürün Ekle' : 'Ürünü Düzenle'}
    >
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
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin/products')}>
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

              <Button type="submit" disabled={busy || busyFetch}>
                <Save className="mr-2 h-4 w-4" />
                {busy ? 'Kaydediliyor...' : isCreate || isCopyMode ? 'Oluştur' : 'Güncelle'}
              </Button>
            </CardHeader>

            <CardContent className="space-y-6">
              <BasicInfo
                formData={formData}
                setField={setField}
                quantityOptions={quantityOptions}
                onUploadFeatured={handleFeaturedUpload}
                onUploadGallery={handleGalleryUpload}
                uploading={uploading}
                quillModules={quillModules}
                quillFormats={QUILL_FORMATS}
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
                {/* ✅ RESPONSIVE TABS LIST (no overlap)
                    - mobile: horizontal scroll
                    - sm+: wraps nicely */}
                <TabsList
                  className={[
                    'w-full h-auto',
                    'flex items-center gap-1 p-1',
                    'overflow-x-auto',
                    'sm:flex-wrap sm:overflow-visible',
                  ].join(' ')}
                >
                  {/* Triggers: shrink-0 so they don't collapse and overlap; text scales down on xs */}
                  <TabsTrigger
                    value="customization"
                    className="shrink-0 whitespace-nowrap text-xs sm:text-sm"
                  >
                    Ürün Özelleştirme
                  </TabsTrigger>
                  <TabsTrigger
                    value="demo"
                    className="shrink-0 whitespace-nowrap text-xs sm:text-sm"
                  >
                    Demo & Önizleme
                  </TabsTrigger>
                  <TabsTrigger
                    value="faq"
                    className="shrink-0 whitespace-nowrap text-xs sm:text-sm"
                  >
                    Sıkça Sorulan Sorular
                  </TabsTrigger>
                  <TabsTrigger
                    value="reviews"
                    className="shrink-0 whitespace-nowrap text-xs sm:text-sm"
                  >
                    Müşteri Yorumları
                  </TabsTrigger>
                  <TabsTrigger
                    value="delivery"
                    className="shrink-0 whitespace-nowrap text-xs sm:text-sm"
                  >
                    Teslimat Ayarları
                  </TabsTrigger>
                  <TabsTrigger
                    value="turkpin"
                    className="shrink-0 whitespace-nowrap text-xs sm:text-sm"
                  >
                    EPIN
                  </TabsTrigger>
                  <TabsTrigger
                    value="article"
                    className="shrink-0 whitespace-nowrap text-xs sm:text-sm"
                  >
                    Makale Ayarı
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="customization" className="space-y-6 mt-6">
                  <CustomizationSection
                    quantityOptions={quantityOptions}
                    setQuantityOptions={setQuantityOptions}
                    customFields={customFields}
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
                    idParam={idParamSafe}
                    usedStock={(usedStock ?? []) as UsedStockItem[]}
                    apiProviders={apiProviders}
                    onUploadFile={handleProductFileUpload}
                    uploading={uploading}
                  />
                </TabsContent>

                <TabsContent value="turkpin" className="space-y-6 mt-6">
                  <TurkpinSettings formData={formData} setFormData={setFormData} />
                </TabsContent>

                <TabsContent value="article" className="space-y-6 mt-6">
                  <ArticleSection
                    formData={formData}
                    setField={setField}
                    quillModules={quillModules}
                    quillFormats={QUILL_FORMATS}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <div className="flex gap-2 justify-end mt-6">
            <Button type="button" variant="outline" onClick={() => navigate('/admin/products')}>
              İptal
            </Button>

            <Button type="submit" className="gradient-primary" disabled={busy || busyFetch}>
              {busy ? 'Kaydediliyor...' : isCreate || isCopyMode ? 'Oluştur' : 'Güncelle'}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
