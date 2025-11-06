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

/* ---------------- type guards & helpers ---------------- */
type NumericLike = number | string | null | undefined;
type BoolLike = boolean | 0 | 1 | "0" | "1" | null | undefined;
type QueryParams = Record<string, string | number | boolean | undefined>;

const isRecord = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);

const pluckArray = (res: unknown, keys: string[]): unknown[] => {
  if (Array.isArray(res)) return res;
  if (isRecord(res)) {
    for (const k of keys) {
      const v = res[k];
      if (Array.isArray(v)) return v;
    }
  }
  return [];
};

const asNumber = (v: NumericLike, fallback = 0): number => {
  if (typeof v === "number") return Number.isFinite(v) ? v : fallback;
  if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) return Number(v);
  return fallback;
};
const toNumOptional = (v: NumericLike): number | null => {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) return Number(v);
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
      /* csv fallback */
    }
    return s.split(",").map((x) => x.trim()).filter(Boolean);
  }
  return null;
};
const asBool01 = (v: BoolLike, fallback = false): 0 | 1 => {
  if (v === true || v === 1 || v === "1") return 1;
  if (v === false || v === 0 || v === "0") return 0;
  return fallback ? 1 : 0;
};

/* ---------------- normalize (Product) ---------------- */
const normalizeProduct = (p: ApiProduct): Product => {
  const price = asNumber(p.price, 0);

  const originalPrice =
    p.original_price != null
      ? asNumber(p.original_price, 0)
      : p.compare_at_price != null
      ? asNumber(p.compare_at_price, 0)
      : null;

  const cost = toNumOptional(p.cost);

  const gallery =
    parseArr(p.gallery_urls) ??
    parseArr(p.images) ??
    (typeof p.image_url === "string" && p.image_url.trim() ? [p.image_url] : null);

  const galleryAssetIds = parseArr(p.gallery_asset_ids);
  const features = parseArr(p.features);

  const isActive = asBool01(p.is_active, true);
  const isFeatured = asBool01(p.is_featured ?? 0, false);
  const requiresShipping = asBool01(p.requires_shipping ?? 1, true);
  const articleEnabled = asBool01(p.article_enabled ?? 0, false);
  const demoEmbedEnabled = asBool01(p.demo_embed_enabled ?? 0, false);

  const rating = p.rating == null ? 5 : asNumber(p.rating, 5);
  const reviewCount =
    p.review_count == null ? 0 : Math.max(0, Math.floor(asNumber(p.review_count, 0)));

  const featuredImage =
    (typeof p.featured_image === "string" && p.featured_image.trim() && p.featured_image) ||
    (typeof p.image_url === "string" && p.image_url.trim() && p.image_url) ||
    (Array.isArray(gallery) && gallery.length > 0 ? gallery[0] : null);

  const stockQ = (p as unknown as { stock_quantity?: NumericLike }).stock_quantity;

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
    stock_quantity: asNumber(stockQ, 0),

    is_active: isActive,
    is_featured: isFeatured,
    requires_shipping: requiresShipping,

    created_at: p.created_at ?? "",
    updated_at: p.updated_at ?? p.created_at ?? "",

    categories: p.categories
      ? { id: p.categories.id, name: p.categories.name, slug: p.categories.slug }
      : undefined,
  };

  if ((!product.gallery_urls || product.gallery_urls.length === 0) && product.image_url) {
    product.gallery_urls = [product.image_url];
  }
  return product;
};

/* ---------------- mapping helpers (no-any) ---------------- */
const toFAQ = (x: unknown): FAQ => {
  if (!isRecord(x)) {
    return {
      id: "",
      product_id: "",
      question: "",
      answer: "",
      display_order: 0,
      is_active: 1,
      created_at: "",
      updated_at: "",
    };
  }
  return {
    id: String(x.id ?? ""),
    product_id: String(x.product_id ?? ""),
    question: String(x.question ?? ""),
    answer: String(x.answer ?? ""),
    display_order: asNumber(x.display_order as NumericLike, 0),
    is_active: asBool01(x.is_active as BoolLike),
    created_at: String(x.created_at ?? ""),
    updated_at: String(x.updated_at ?? ""),
  };
};

const toReview = (x: unknown): Review => {
  if (!isRecord(x)) {
    return {
      id: "",
      product_id: "",
      customer_name: "",
      rating: 5,
      comment: "",
      review_date: "",
      is_active: 1,
      created_at: "",
      updated_at: "",
    };
  }
  const rd = String(x.review_date ?? x.created_at ?? "");
  return {
    id: String(x.id ?? ""),
    product_id: String(x.product_id ?? ""),
    customer_name: String(x.customer_name ?? ""),
    rating: asNumber(x.rating as NumericLike, 5),
    comment: String(x.comment ?? ""),
    review_date: rd,
    is_active: asBool01(x.is_active as BoolLike),
    created_at: String(x.created_at ?? ""),
    updated_at: String(x.updated_at ?? ""),
  };
};

const toOption = (x: unknown): ProductOption => {
  if (!isRecord(x)) {
    return { id: "", product_id: "", option_name: "", option_values: [], created_at: "", updated_at: "" };
  }
  const raw = x.option_values as unknown;
  const values = Array.isArray(raw) ? raw.map((v) => String(v)) : parseArr(raw) ?? [];
  return {
    id: String(x.id ?? ""),
    product_id: String(x.product_id ?? ""),
    option_name: String(x.option_name ?? ""),
    option_values: values,
    created_at: String(x.created_at ?? ""),
    updated_at: String(x.updated_at ?? ""),
  };
};

const toStock = (x: unknown): Stock => {
  if (!isRecord(x)) {
    return {
      id: "",
      product_id: "",
      code: "",
      stock_content: "",
      is_used: 0,
      used_at: null,
      created_at: "",
      order_item_id: null,
    };
  }
  const rawCode = (x.code as unknown) ?? (x.stock_content as unknown) ?? "";
  const code = typeof rawCode === "string" ? rawCode : String(rawCode ?? "");
  return {
    id: String(x.id ?? ""),
    product_id: String(x.product_id ?? ""),
    code,
    stock_content: String(x.stock_content ?? code),
    is_used: asBool01(x.is_used as BoolLike),
    used_at: (x.used_at as string | null | undefined) ?? null,
    created_at: String(x.created_at ?? ""),
    order_item_id: (x.order_item_id as string | null | undefined) ?? null,
  };
};

/* ---------------- RTK endpoints ---------------- */
export const productsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // GET /products
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
              params.is_active === undefined ? undefined : (params.is_active ? 1 : 0),
          };
        }
        return q;
      },
      transformResponse: (res: unknown): Product[] => {
        const arr = pluckArray(res, ["data", "items", "rows", "result", "products"]);
        if (arr.length) return (arr as unknown[]).map((x) => normalizeProduct(x as ApiProduct));
        if (Array.isArray(res)) return (res as unknown[]).map((x) => normalizeProduct(x as ApiProduct));
        return [];
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((p) => ({ type: "Product" as const, id: p.id })),
              { type: "Products" as const, id: "LIST" },
            ]
          : [{ type: "Products" as const, id: "LIST" }],
      keepUnusedDataFor: 60,
    }),

    // GET /products/:idOrSlug
    getProduct: builder.query<Product, string>({
      query: (idOrSlug) => ({ url: `/products/${encodeURIComponent(idOrSlug)}` }),
      transformResponse: (res: unknown): Product => normalizeProduct(res as ApiProduct),
      providesTags: (r) =>
        r ? [{ type: "Product", id: r.id }] : [{ type: "Products", id: "LIST" }],
      keepUnusedDataFor: 300,
    }),

    // Backward compat
    getProductBySlug: builder.query<Product, string>({
      query: (slug) => ({ url: `/products/by-slug/${encodeURIComponent(slug)}` }),
      transformResponse: (res: unknown): Product => normalizeProduct(res as ApiProduct),
      providesTags: (r) =>
        r ? [{ type: "Product", id: r.id }] : [{ type: "Products", id: "LIST" }],
      keepUnusedDataFor: 300,
    }),

    getProductById: builder.query<Product, string>({
      query: (id) => ({ url: `/products/${encodeURIComponent(id)}` }),
      transformResponse: (res: unknown): Product => normalizeProduct(res as ApiProduct),
      providesTags: (_r, _e, id) => [{ type: "Product", id }],
      keepUnusedDataFor: 300,
    }),

    // GET /product_faqs
    listProductFaqs: builder.query<FAQ[], { product_id: string; only_active?: boolean | 0 | 1 }>({
      query: ({ product_id, only_active = 1 }) => ({
        url: "/product_faqs",
        params: { product_id, only_active: only_active ? 1 : 0, is_active: only_active ? 1 : 0 },
      }),
      transformResponse: (res: unknown): FAQ[] => {
        const arr = pluckArray(res, ["data", "items", "rows", "faqs"]);
        return (arr as unknown[]).map(toFAQ);
      },
      providesTags: (_r, _e, arg) => [{ type: "Faqs" as const, id: arg.product_id }],
      keepUnusedDataFor: 60,
    }),

    // GET /product_reviews
    listProductReviews: builder.query<Review[], { product_id: string; only_active?: boolean | 0 | 1 }>({
      query: ({ product_id, only_active = 1 }) => ({
        url: "/product_reviews",
        params: { product_id, only_active: only_active ? 1 : 0, is_active: only_active ? 1 : 0 },
      }),
      transformResponse: (res: unknown): Review[] => {
        const arr = pluckArray(res, ["data", "items", "rows", "reviews"]);
        return (arr as unknown[]).map(toReview);
      },
      providesTags: (_r, _e, arg) => [{ type: "Reviews" as const, id: arg.product_id }],
      keepUnusedDataFor: 60,
    }),

    // GET /product_options
    listProductOptions: builder.query<ProductOption[], { product_id: string }>({
      query: ({ product_id }) => ({ url: "/product_options", params: { product_id } }),
      transformResponse: (res: unknown): ProductOption[] => {
        const arr = pluckArray(res, ["data", "items", "rows", "options"]);
        return (arr as unknown[]).map(toOption);
      },
      providesTags: (_r, _e, arg) => [{ type: "Options" as const, id: arg.product_id }],
      keepUnusedDataFor: 60,
    }),

    // GET /product_stock
    listProductStock: builder.query<Stock[], { product_id: string; is_used?: boolean | 0 | 1 }>({
      query: ({ product_id, is_used }) => ({
        url: "/product_stock",
        params: {
          product_id,
          ...(is_used === undefined ? {} : { is_used: is_used ? 1 : 0 }),
        } as QueryParams,
      }),
      transformResponse: (res: unknown): Stock[] => {
        const arr = pluckArray(res, ["data", "items", "rows", "stock"]);
        return (arr as unknown[]).map(toStock);
      },
      providesTags: (_r, _e, arg) => [{ type: "Stock" as const, id: arg.product_id }],
      keepUnusedDataFor: 60,
    }),
  }),
  overrideExisting: true,
});

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
