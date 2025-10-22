// src/integrations/metahub/rtk/endpoints/products.endpoints.ts
import { baseApi } from "../baseApi";

// --- Tipler (backend yanıtıyla uyumlu) ---
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

export type Review = {
  id: string;
  product_id: string;
  user_id?: string | null;
  rating: number;
  comment?: string | null;
  is_active: 0 | 1 | boolean;
  customer_name?: string | null;
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

// --- Ham API tipi (bazı alanlar string/JSON-string gelebilir) ---
type ApiProduct = Omit<
  Product,
  | "price"
  | "original_price"
  | "cost"
  | "rating"
  | "gallery_urls"
  | "features"
  | "custom_fields"
  | "quantity_options"
  | "badges"
> & {
  price: number | string;
  original_price: number | string | null;
  cost: number | string | null;
  rating: number | string;
  gallery_urls: string[] | string | null;
  features: string[] | string | null;
  custom_fields: Product["custom_fields"] | string | null;
  quantity_options: QuantityOption[] | string | null;
  badges: Badge[] | string | null;
};

// küçük yardımcılar
type NullableNumber = number | null | undefined;
const toNumber = (x: unknown): number =>
  typeof x === "number" ? x : Number(x as unknown);

const numOrNullish = (x: unknown): NullableNumber =>
  x == null ? (x as null | undefined) : toNumber(x);

const tryParse = <T>(x: unknown): T => {
  if (typeof x === "string") {
    try {
      return JSON.parse(x) as T;
    } catch {
      // JSON değilse geleni olduğu gibi döndür (çağıran T'yi doğru seçecek)
      return x as unknown as T;
    }
  }
  return x as T;
};

const normalizeProduct = (p: ApiProduct): Product => ({
  ...p,
  price: toNumber(p.price),
  original_price: numOrNullish(p.original_price) ?? null,
  cost: numOrNullish(p.cost) ?? null,
  rating: toNumber(p.rating),
  gallery_urls: tryParse<string[] | null>(p.gallery_urls),
  features: tryParse<string[] | null>(p.features),
  custom_fields: tryParse<Product["custom_fields"]>(p.custom_fields),
  quantity_options: tryParse<QuantityOption[] | null>(p.quantity_options),
  badges: tryParse<Badge[] | null>(p.badges),
});

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
        slug?: string;
      }
    >({
      query: (params) => ({
        url: "/products",
        params: {
          ...params,
          is_active:
            params?.is_active === undefined
              ? undefined
              : (params.is_active ? 1 : 0),
        },
      }),
      transformResponse: (res: unknown): Product[] => {
        if (!Array.isArray(res)) return [];
        return (res as ApiProduct[]).map(normalizeProduct);
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((p) => ({ type: "Product" as const, id: p.id })),
              { type: "Products" as const, id: "LIST" },
            ]
          : [{ type: "Products" as const, id: "LIST" }],
    }),

    // GET /products/:id
    getProductById: builder.query<Product, string>({
      query: (id) => ({ url: `/products/${id}` }),
      transformResponse: (res: unknown): Product =>
        normalizeProduct(res as ApiProduct),
      providesTags: (_r, _e, id) => [{ type: "Product", id }],
    }),

    // GET /products/by-slug/:slug
    getProductBySlug: builder.query<Product, string>({
      query: (slug) => ({ url: `/products/by-slug/${slug}` }),
      transformResponse: (res: unknown): Product =>
        normalizeProduct(res as ApiProduct),
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

export const {
  useListProductsQuery,
  useGetProductByIdQuery,
  useGetProductBySlugQuery,
  useListProductFaqsQuery,
  useListProductReviewsQuery,
  useListProductOptionsQuery,
  useListProductStockQuery,
} = productsApi;
