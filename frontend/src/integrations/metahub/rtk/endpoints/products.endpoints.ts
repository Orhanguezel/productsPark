import { baseApi } from "../baseApi";

// --- Tipler (FE beklentisi) ---
export type CategoryBrief = { id: string; name: string; slug: string };
export type QuantityOption = { quantity: number; price: number };
export type Badge = { text: string; icon?: string | null; active: boolean };

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  category_id: string | null;
  price: number;
  original_price: number | null;
  cost: number | null;
  image_url: string | null;
  gallery_urls: string[] | null;
  features: string[] | null;
  rating: number;
  review_count: number;
  product_type?: string | null;
  delivery_type?: string | null;
  custom_fields?: Array<{
    id: string;
    label: string;
    type: "text" | "email" | "phone" | "url" | "textarea";
    placeholder?: string | null;
    required: boolean;
  }> | null;
  quantity_options?: QuantityOption[] | null;
  api_provider_id?: string | null;
  api_product_id?: string | null;
  api_quantity?: number | null;
  meta_title?: string | null;
  meta_description?: string | null;
  article_content?: string | null;
  article_enabled?: 0 | 1 | boolean;
  demo_url?: string | null;
  demo_embed_enabled?: 0 | 1 | boolean;
  demo_button_text?: string | null;
  badges?: Badge[] | null;
  sku?: string | null;
  stock_quantity: number;
  is_active: 0 | 1 | boolean;
  is_featured: 0 | 1 | boolean;
  requires_shipping: 0 | 1 | boolean;
  created_at: string;
  updated_at: string;
  categories?: CategoryBrief;
};

// --- Ham API tipi (BE alan adları + geriye dönük uyum) ---
type ApiProduct = Omit<
  Product,
  "price" | "original_price" | "gallery_urls" | "cost" | "rating" | "review_count"
> & {
  price: number | string;
  /** Yeni isimler */
  original_price?: number | string | null;
  gallery_urls?: string[] | string | null;
  /** Eski isimlerle geriye dönük uyum */
  compare_at_price?: number | string | null;
  images?: string[] | string | null;
  /** Opsiyonel sayısal alanlar string gelebilir */
  cost?: number | string | null;
  rating?: number | string | null;
  review_count?: number | string | null;
};

// ---------- helpers (typed) ----------
type NumericLike = number | string | null | undefined;

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

// ---------- normalize ----------
const normalizeProduct = (p: ApiProduct): Product => {
  // price
  const price = asNumber(p.price, 0);

  // original_price: yeni isim öncelikli, yoksa eski 'compare_at_price'
  const originalPrice =
    p.original_price !== undefined && p.original_price !== null
      ? asNumber(p.original_price, 0)
      : p.compare_at_price !== undefined && p.compare_at_price !== null
      ? asNumber(p.compare_at_price, 0)
      : null;

  // cost (opsiyonel)
  const cost = toNumOptional(p.cost);

  // gallery: yeni → eski → image_url fallback
  const gallery =
    parseArr(p.gallery_urls) ??
    parseArr(p.images) ??
    (typeof p.image_url === "string" && p.image_url.trim() ? [p.image_url] : null);

  // rating / review_count (defaults)
  const rating = p.rating === undefined || p.rating === null ? 5 : asNumber(p.rating, 5);
  const reviewCount =
    p.review_count === undefined || p.review_count === null
      ? 0
      : Math.max(0, Math.floor(asNumber(p.review_count, 0)));

  return {
    ...p,
    price,
    original_price: originalPrice,
    cost,
    gallery_urls: gallery,
    rating,
    review_count: reviewCount,
    delivery_type: p.delivery_type ?? "manual",
  };
};

// ---------- RTK endpoints ----------
export const productsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // GET /products (liste)
    listProducts: builder.query<
      Product[],
      {
        category_id?: string;
        is_active?: boolean | 0 | 1;
        q?: string;
        limit?: number;
        offset?: number;
        sort?: "price" | "rating" | "created_at";
        order?: "asc" | "desc";
        slug?: string; // opsiyonel; backend slug ile tekil ürün döndürürse aşağıda ele aldık
      }
    >({
      query: (params) => ({
        url: "/products",
        params: {
          ...params,
          // bool -> 0/1 coercion
          is_active:
            params?.is_active === undefined ? undefined : params.is_active ? 1 : 0,
        },
      }),
      transformResponse: (res: unknown): Product[] => {
        // BE bazı durumlarda slug ile tekil obje döndürebilir
        if (Array.isArray(res)) {
          return (res as ApiProduct[]).map(normalizeProduct).map((p) => {
            if ((!p.gallery_urls || p.gallery_urls.length === 0) && p.image_url) {
              return { ...p, gallery_urls: [p.image_url] };
            }
            return p;
          });
        }
        if (res && typeof res === "object") {
          const n = normalizeProduct(res as ApiProduct);
          return [
            (!n.gallery_urls || n.gallery_urls.length === 0) && n.image_url
              ? { ...n, gallery_urls: [n.image_url] }
              : n,
          ];
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
      transformResponse: (res: unknown): Product => {
        const n = normalizeProduct(res as ApiProduct);
        if ((!n.gallery_urls || n.gallery_urls.length === 0) && n.image_url) {
          return { ...n, gallery_urls: [n.image_url] };
        }
        return n;
      },
      providesTags: (r) =>
        r ? [{ type: "Product", id: r.id }] : [{ type: "Products", id: "LIST" }],
    }),

    // (Geri uyum) GET /products/:id
    getProductById: builder.query<Product, string>({
      query: (id) => ({ url: `/products/${encodeURIComponent(id)}` }),
      transformResponse: (res: unknown): Product => {
        const n = normalizeProduct(res as ApiProduct);
        if ((!n.gallery_urls || n.gallery_urls.length === 0) && n.image_url) {
          return { ...n, gallery_urls: [n.image_url] };
        }
        return n;
      },
      providesTags: (_r, _e, id) => [{ type: "Product", id }],
    }),

    // (Geri uyum) GET /products/by-slug/:slug  → tek ürün döner
    getProductBySlug: builder.query<Product, string>({
      // İstersen unified rota da kullanabilirsin: `/products/${slug}`
      query: (slug) => ({ url: `/products/by-slug/${encodeURIComponent(slug)}` }),
      transformResponse: (res: unknown): Product => {
        const n = normalizeProduct(res as ApiProduct);
        if ((!n.gallery_urls || n.gallery_urls.length === 0) && n.image_url) {
          return { ...n, gallery_urls: [n.image_url] };
        }
        return n;
      },
      providesTags: (r) =>
        r ? [{ type: "Product", id: r.id }] : [{ type: "Products", id: "LIST" }],
    }),

    // GET /product_faqs?product_id=&only_active=
    listProductFaqs: builder.query<
      Faq[],
      { product_id: string; only_active?: boolean | 0 | 1 }
    >({
      query: ({ product_id, only_active = true }) => ({
        url: "/product_faqs",
        params: { product_id, only_active: only_active ? 1 : 0 },
      }),
      providesTags: (_r, _e, arg) => [{ type: "Faqs", id: arg.product_id }],
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
      providesTags: (_r, _e, arg) => [{ type: "Reviews", id: arg.product_id }],
    }),

    // GET /product_options?product_id=
    listProductOptions: builder.query<ProductOption[], { product_id: string }>({
      query: ({ product_id }) => ({
        url: "/product_options",
        params: { product_id },
      }),
      providesTags: (_r, _e, arg) => [{ type: "Options", id: arg.product_id }],
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
        },
      }),
      providesTags: (_r, _e, arg) => [{ type: "Stock", id: arg.product_id }],
    }),
  }),
  overrideExisting: true,
});

// --- Alt tipler ---
export type Review = {
  id: string;
  product_id: string;
  user_id?: string | null;
  rating: number;
  comment?: string | null;
  is_active?: 0 | 1 | boolean;
  customer_name?: string | null;
  review_count?: never; // sadece type ayrımı için
  review_date: string;
  created_at: string;
  updated_at: string;
};

export type Faq = {
  id: string;
  product_id: string;
  question: string;
  answer: string;
  display_order: number;
  is_active: 0 | 1 | boolean;
  created_at: string;
  updated_at: string;
};

export type ProductOption = {
  id: string;
  product_id: string;
  option_name: string;
  option_values: string[];
  created_at: string;
  updated_at: string;
};

export type Stock = {
  id: string;
  product_id: string;
  code: string;
  is_used: 0 | 1 | boolean;
  used_at?: string | null;
  created_at: string;
  order_item_id?: string | null;
};

// Hooks
export const {
  useListProductsQuery,
  useGetProductQuery,        // ✅ birleşik (id veya slug)
  useGetProductByIdQuery,    // backward-compat
  useGetProductBySlugQuery,  // backward-compat
  useListProductFaqsQuery,
  useListProductReviewsQuery,
  useListProductOptionsQuery,
  useListProductStockQuery,
} = productsApi;
