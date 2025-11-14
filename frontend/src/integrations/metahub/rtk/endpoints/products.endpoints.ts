// -------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/endpoints/products.endpoints.ts
// (Public products)
// -------------------------------------------------------------
import { baseApi } from "../baseApi";
import type { FetchArgs } from "@reduxjs/toolkit/query";
import type {
  Product,
  ApiProduct,
  ProductsAdminListParams,
} from "@/integrations/metahub/db/types/products";

const BASE = "/products";

type ProductsListParams = Omit<
  ProductsAdminListParams,
  "show_on_homepage" | "sort"
> & {
  sort?: "price" | "rating" | "created_at";
  slug?: string;
  /** Guest sepet için çoklu id filtresi */
  ids?: string[];
};

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

const toNumber = (x: unknown): number => {
  if (typeof x === "number") return x;
  const n = Number(x as unknown);
  return Number.isFinite(n) ? n : 0;
};

const toNullableNumber = (x: unknown): number | null => {
  if (x === null || x === undefined || x === "") return null;
  const n = Number(x as unknown);
  return Number.isFinite(n) ? n : null;
};

const toBool = (x: unknown): boolean => {
  if (typeof x === "boolean") return x;
  if (typeof x === "number") return x !== 0;
  const s = String(x ?? "").toLowerCase();
  return s === "true" || s === "1";
};

const toArray = (v: unknown): string[] | null => {
  if (v == null) return null;
  if (Array.isArray(v)) return v.map(String).filter(Boolean);
  if (typeof v === "string") {
    const s = v.trim();
    if (!s) return null;
    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) return parsed.map((x) => String(x)).filter(Boolean);
    } catch {
      /* csv fallback */
    }
    return s
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
  }
  return null;
};

const toQueryParams = (params?: ProductsListParams): QueryParams => {
  if (!params) return {};
  const qp: QueryParams = {};
  if (params.q) qp.q = params.q;
  if (params.category_id) qp.category_id = params.category_id;
  if (params.is_active !== undefined) qp.is_active = params.is_active ? 1 : 0;
  if (typeof params.min_price === "number") qp.min_price = params.min_price;
  if (typeof params.max_price === "number") qp.max_price = params.max_price;
  if (typeof params.limit === "number") qp.limit = params.limit;
  if (typeof params.offset === "number") qp.offset = params.offset;
  if (params.sort) qp.sort = params.sort;
  if (params.order) qp.order = params.order;
  if (params.slug) qp.slug = params.slug;
  // 👇 Guest sepeti için çoklu id
  if (params.ids && params.ids.length > 0) {
    qp.ids = params.ids.join(",");
  }
  return qp;
};

const normalizePublicProduct = (p: ApiProduct): Product => {
  const galleryUrls = toArray(p.gallery_urls) ?? toArray(p.images);

  return {
    id: String((p as { id: unknown }).id),
    name: String((p as { name?: unknown }).name ?? ""),
    slug: String((p as { slug?: unknown }).slug ?? ""),

    description: (p.description ?? null) as string | null,
    short_description: (p.short_description ?? null) as string | null,
    category_id: (p.category_id ?? null) as string | null,

    price: toNumber(p.price),
    original_price: toNullableNumber(
      (p.original_price ?? p.compare_at_price) as unknown
    ),
    cost: toNullableNumber(p.cost as unknown),

    image_url: (p.image_url ?? null) as string | null,
    featured_image: (p.featured_image ?? p.image_url ?? null) as string | null,
    featured_image_asset_id: (p.featured_image_asset_id ?? null) as string | null,
    featured_image_alt: (p.featured_image_alt ?? p.name ?? null) as string | null,

    gallery_urls: galleryUrls,
    gallery_asset_ids: toArray(p.gallery_asset_ids),
    features: toArray(p.features),

    rating: toNumber(p.rating ?? 0),
    review_count: toNumber(p.review_count ?? 0),

    product_type: (p.product_type ?? null) as string | null,
    delivery_type: p.delivery_type as Product["delivery_type"],

    custom_fields: (p.custom_fields as Product["custom_fields"]) ?? null,
    quantity_options: (p.quantity_options as Product["quantity_options"]) ?? null,

    api_provider_id: (p.api_provider_id ?? null) as string | null,
    api_product_id: (p.api_product_id ?? null) as string | null,
    api_quantity: toNullableNumber(p.api_quantity as unknown),

    meta_title: (p.meta_title ?? null) as string | null,
    meta_description: (p.meta_description ?? null) as string | null,

    article_content: (p.article_content ?? null) as string | null,
    article_enabled: (toBool(p.article_enabled ?? false) ? 1 : 0) as
      | 0
      | 1
      | boolean,
    demo_url: (p.demo_url ?? null) as string | null,
    demo_embed_enabled: (toBool(p.demo_embed_enabled ?? false) ? 1 : 0) as
      | 0
      | 1
      | boolean,
    demo_button_text: (p.demo_button_text ?? null) as string | null,

    badges: (p.badges as Product["badges"]) ?? null,

    sku: (p.sku ?? null) as string | null,
    stock_quantity: toNumber((p as { stock_quantity?: unknown }).stock_quantity),

    is_active: (toBool(p.is_active ?? false) ? 1 : 0) as 0 | 1 | boolean,
    is_featured: (toBool(p.is_featured ?? false) ? 1 : 0) as 0 | 1 | boolean,
    requires_shipping: (toBool(p.requires_shipping ?? false) ? 1 : 0) as
      | 0
      | 1
      | boolean,

    // genişletmeler
    brand_id: (p.brand_id ?? null) as string | null,
    vendor: (p.vendor ?? null) as string | null,
    barcode: (p.barcode ?? null) as string | null,
    gtin: (p.gtin ?? null) as string | null,
    mpn: (p.mpn ?? null) as string | null,
    weight_grams: toNullableNumber(p.weight_grams as unknown),
    size_length_mm: toNullableNumber(p.size_length_mm as unknown),
    size_width_mm: toNullableNumber(p.size_width_mm as unknown),
    size_height_mm: toNullableNumber(p.size_height_mm as unknown),

    created_at: String(p.created_at ?? ""),
    updated_at: String(p.updated_at ?? "") || String(p.created_at ?? ""),

    categories: p.categories
      ? {
          id: String(p.categories.id),
          name: String(p.categories.name),
          slug: (p.categories.slug ?? null) as string | null,
        }
      : undefined,
  };
};

export const productsApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listProducts: b.query<Product[], ProductsListParams | void>({
      query: (params): FetchArgs => {
        const qp = params ? toQueryParams(params) : {};
        return { url: BASE, params: qp } as FetchArgs;
      },
      transformResponse: (res: unknown): Product[] => {
        const rows = pluckArray(res, ["data", "items", "rows", "result", "products"]);
        return rows.filter(isRecord).map((x) => normalizePublicProduct(x as ApiProduct));
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((p) => ({ type: "Product" as const, id: p.id })),
              { type: "Products" as const, id: "PUBLIC_LIST" },
            ]
          : [{ type: "Products" as const, id: "PUBLIC_LIST" }],
      keepUnusedDataFor: 60,
    }),

    getProduct: b.query<Product, string>({
      query: (idOrSlug): FetchArgs => ({
        url: `${BASE}/${encodeURIComponent(idOrSlug)}`,
      }),
      transformResponse: (res: unknown): Product => {
        const obj = Array.isArray(res) ? (res[0] as unknown) : res;
        return normalizePublicProduct(obj as ApiProduct);
      },
      providesTags: (_r, _e, idOrSlug) => [
        { type: "Product" as const, id: idOrSlug },
      ],
      keepUnusedDataFor: 300,
    }),

    getProductBySlug: b.query<Product, string>({
      query: (slug): FetchArgs => ({
        url: `${BASE}/by-slug/${encodeURIComponent(slug)}`,
      }),
      transformResponse: (res: unknown): Product =>
        normalizePublicProduct(res as ApiProduct),
      providesTags: (_r, _e, slug) => [
        { type: "Product" as const, id: slug },
      ],
      keepUnusedDataFor: 300,
    }),
  }),
  overrideExisting: true,
});

export const {
  useListProductsQuery,
  useGetProductQuery,
  useGetProductBySlugQuery,
} = productsApi;
