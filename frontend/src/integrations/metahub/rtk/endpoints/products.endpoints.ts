// =============================================================
// FILE: src/integrations/metahub/rtk/endpoints/products.endpoints.ts
// =============================================================
import { baseApi } from "../baseApi";
import type {
  Product,
  ApiProduct,
  FAQ,
  Review,
  ProductOption,
  Stock,
} from "@/integrations/metahub/db/types/products";

// ---------- helpers (typed) ----------
type NumericLike = number | string | null | undefined;
type BoolLike = boolean | 0 | 1 | "0" | "1" | null | undefined;
type QueryParams = Record<string, string | number | boolean | undefined>;

const asNumber = (v: NumericLike, fallback = 0): number => {
  if (typeof v === "number") return Number.isFinite(v) ? v : fallback;
  if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) {
    return Number(v);
  }
  return fallback;
};

const toNumOptional = (v: NumericLike): number | null => {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) {
    return Number(v);
  }
  return null;
};

const parseArr = (v: unknown): string[] | null => {
  if (Array.isArray(v)) return v.map(String).filter(Boolean);
  if (typeof v === "string") {
    const s = v.trim();
    if (!s) return null;
    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
    } catch {
      /* fall through to CSV split */
    }
    return s.split(",").map((x) => x.trim()).filter(Boolean);
  }
  return null;
};

const asBool = (v: BoolLike, fallback = false): boolean | 0 | 1 => {
  if (v === true || v === 1 || v === "1") return 1;
  if (v === false || v === 0 || v === "0") return 0;
  if (typeof v === "boolean") return v ? 1 : 0;
  return fallback ? 1 : 0;
};

// ---------- normalize ----------
const normalizeProduct = (p: ApiProduct): Product => {
  const price = asNumber(p.price, 0);

  // original_price: yeni isim öncelikli, yoksa legacy 'compare_at_price'
  const originalPrice =
    p.original_price !== undefined && p.original_price !== null
      ? asNumber(p.original_price, 0)
      : p.compare_at_price !== undefined && p.compare_at_price !== null
      ? asNumber(p.compare_at_price, 0)
      : null;

  const cost = toNumOptional(p.cost);

  // gallery: yeni → legacy → image_url fallback
  const gallery =
    parseArr(p.gallery_urls) ??
    parseArr(p.images) ??
    (typeof p.image_url === "string" && p.image_url.trim() ? [p.image_url] : null);

  const galleryAssetIds = parseArr(p.gallery_asset_ids);
  const features = parseArr(p.features);

  // booleans
  const isActive = asBool(p.is_active, true);
  const isFeatured = asBool(p.is_featured ?? 0, false);
  const requiresShipping = asBool(p.requires_shipping ?? 1, true);
  const articleEnabled = asBool(p.article_enabled ?? 0, false);
  const demoEmbedEnabled = asBool(p.demo_embed_enabled ?? 0, false);

  // rating / review_count
  const rating = p.rating === undefined || p.rating === null ? 5 : asNumber(p.rating, 5);
  const reviewCount =
    p.review_count === undefined || p.review_count === null
      ? 0
      : Math.max(0, Math.floor(asNumber(p.review_count, 0)));

  const featuredImage =
    (typeof p.featured_image === "string" && p.featured_image.trim() && p.featured_image) ||
    (typeof p.image_url === "string" && p.image_url.trim() && p.image_url) ||
    (Array.isArray(gallery) && gallery.length > 0 ? gallery[0] : null);

  const product: Product = {
    id: p.id,
    name: p.name,
    slug: p.slug,

    description: p.description ?? null,
    short_description: p.short_description ?? null,
    category_id: p.category_id ?? null,

    price,
    original_price: originalPrice,
    cost,

    image_url: typeof p.image_url === "string" ? p.image_url : null,
    featured_image: featuredImage ?? null,
    featured_image_asset_id: p.featured_image_asset_id ?? null,
    featured_image_alt: p.featured_image_alt ?? null,
    gallery_urls: gallery,
    gallery_asset_ids: galleryAssetIds,

    features,

    rating,
    review_count: reviewCount,

    product_type: p.product_type ?? null,
    delivery_type: (p.delivery_type as Product["delivery_type"]) ?? "manual",

    custom_fields: p.custom_fields ?? null,
    quantity_options: p.quantity_options ?? null,

    api_provider_id: p.api_provider_id ?? null,
    api_product_id: p.api_product_id ?? null,
    api_quantity: p.api_quantity ?? null,

    meta_title: p.meta_title ?? null,
    meta_description: p.meta_description ?? null,

    article_content: p.article_content ?? null,
    article_enabled: articleEnabled,
    demo_url: p.demo_url ?? null,
    demo_embed_enabled: demoEmbedEnabled,
    demo_button_text: p.demo_button_text ?? null,

    badges: p.badges ?? null,

    sku: p.sku ?? null,
    stock_quantity: (p as unknown as { stock_quantity?: number }).stock_quantity ?? 0,

    is_active: isActive,
    is_featured: isFeatured,
    requires_shipping: requiresShipping,

    created_at: p.created_at ?? "",
    updated_at: p.updated_at ?? p.created_at ?? "",

    categories: p.categories
      ? { id: p.categories.id, name: p.categories.name, slug: p.categories.slug }
      : undefined,
  };

  // gallery boşsa image_url'ü fallback olarak ekle
  if ((!product.gallery_urls || product.gallery_urls.length === 0) && product.image_url) {
    product.gallery_urls = [product.image_url];
  }

  return product;
};

// ---------- RTK endpoints ----------
export const productsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // GET /products (liste)
    listProducts: builder.query<
      Product[],
      | {
          category_id?: string;
          is_active?: boolean | 0 | 1;
          q?: string;
          limit?: number;
          offset?: number;
          sort?: "price" | "rating" | "created_at";
          order?: "asc" | "desc";
          slug?: string;
        }
      | void
    >({
      query: (params) => {
        const q: { url: string; params?: QueryParams } = { url: "/products" };
        if (params) {
          q.params = {
            ...params,
            is_active:
              params.is_active === undefined ? undefined : params.is_active ? 1 : 0,
          };
        }
        return q;
      },
      transformResponse: (res: unknown): Product[] => {
        if (Array.isArray(res)) {
          return (res as ApiProduct[]).map(normalizeProduct);
        }
        if (res && typeof res === "object") {
          return [normalizeProduct(res as ApiProduct)];
        }
        return [];
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((p) => ({ type: "Product" as const, id: p.id })),
              { type: "Products" as const, id: "LIST" },
            ]
          : [{ type: "Products" as const, id: "LIST" }],
    }),

    // ✅ Birleşik detay: GET /products/:idOrSlug
    getProduct: builder.query<Product, string>({
      query: (idOrSlug) => ({ url: `/products/${encodeURIComponent(idOrSlug)}` }),
      transformResponse: (res: unknown): Product => normalizeProduct(res as ApiProduct),
      providesTags: (r) =>
        r ? [{ type: "Product", id: r.id }] : [{ type: "Products", id: "LIST" }],
    }),

    // (Backward compat) GET /products/by-slug/:slug
    getProductBySlug: builder.query<Product, string>({
      query: (slug) => ({ url: `/products/by-slug/${encodeURIComponent(slug)}` }),
      transformResponse: (res: unknown): Product => normalizeProduct(res as ApiProduct),
      providesTags: (r) =>
        r ? [{ type: "Product", id: r.id }] : [{ type: "Products", id: "LIST" }],
    }),

    // (Backward compat) GET /products/:id
    getProductById: builder.query<Product, string>({
      query: (id) => ({ url: `/products/${encodeURIComponent(id)}` }),
      transformResponse: (res: unknown): Product => normalizeProduct(res as ApiProduct),
      providesTags: (_r, _e, id) => [{ type: "Product", id }],
    }),

    // GET /product_faqs?product_id=&only_active=
    listProductFaqs: builder.query<
      FAQ[],
      { product_id: string; only_active?: boolean | 0 | 1 }
    >({
      query: ({ product_id, only_active = true }) => ({
        url: "/product_faqs",
        params: { product_id, only_active: only_active ? 1 : 0 },
      }),
      transformResponse: (res: unknown): FAQ[] => {
        if (Array.isArray(res)) return res as FAQ[];
        const maybe = res as { data?: unknown[] };
        return Array.isArray(maybe?.data) ? (maybe.data as FAQ[]) : [];
      },
      providesTags: (_r, _e, arg) => [{ type: "Faqs" as const, id: arg.product_id }],
    }),

    // GET /product_reviews?product_id=&only_active=
    listProductReviews: builder.query<
      Review[],
      { product_id: string; only_active?: boolean | 0 | 1 }
    >({
      query: ({ product_id, only_active = true }) => ({
        url: "/product_reviews",
        params: { product_id, only_active: only_active ? 1 : 0 },
      }),
      transformResponse: (res: unknown): Review[] => {
        if (Array.isArray(res)) return res as Review[];
        const maybe = res as { data?: unknown[] };
        return Array.isArray(maybe?.data) ? (maybe.data as Review[]) : [];
      },
      providesTags: (_r, _e, arg) => [{ type: "Reviews" as const, id: arg.product_id }],
    }),

    // GET /product_options?product_id=
    listProductOptions: builder.query<ProductOption[], { product_id: string }>({
      query: ({ product_id }) => ({
        url: "/product_options",
        params: { product_id },
      }),
      transformResponse: (res: unknown): ProductOption[] => {
        const arr = Array.isArray(res) ? res : (res as { data?: unknown[] })?.data;
        if (!Array.isArray(arr)) return [];
        return (arr as ProductOption[]).map((opt) => {
          const raw = (opt as unknown as { option_values?: unknown }).option_values;
          const values = Array.isArray(raw) ? raw as string[] : parseArr(raw) ?? [];
          return { ...opt, option_values: values };
        });
      },
      providesTags: (_r, _e, arg) => [{ type: "Options" as const, id: arg.product_id }],
    }),

    // GET /product_stock?product_id=&is_used=
    listProductStock: builder.query<
      Stock[],
      { product_id: string; is_used?: boolean | 0 | 1 }
    >({
      query: ({ product_id, is_used }) => ({
        url: "/product_stock",
        params: {
          product_id,
          ...(is_used === undefined ? {} : { is_used: is_used ? 1 : 0 }),
        } as QueryParams,
      }),
      transformResponse: (res: unknown): Stock[] => {
        const arr = Array.isArray(res) ? res : (res as { data?: unknown[] })?.data;
        if (!Array.isArray(arr)) return [];
        return (arr as Stock[]).map((s) => {
          if (s.code && !s.stock_content) return s;
          if (s.stock_content && !s.code) return { ...s, code: s.stock_content };
          return s;
        });
      },
      providesTags: (_r, _e, arg) => [{ type: "Stock" as const, id: arg.product_id }],
    }),
  }),
  overrideExisting: true,
});

// Hooks
export const {
  useListProductsQuery,
  useGetProductQuery,       
  useGetProductByIdQuery,   
  useGetProductBySlugQuery, 
  useListProductFaqsQuery,
  useListProductReviewsQuery,
  useListProductOptionsQuery,
  useListProductStockQuery,
} = productsApi;
