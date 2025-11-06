// -------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/endpoints/admin/products_admin.endpoints.ts
// -------------------------------------------------------------
import { baseApi } from "../../baseApi";
import type { FetchArgs } from "@reduxjs/toolkit/query";
import type {
  ProductAdmin,
  Review,
  FAQ,
  UsedStockItem,
  CategoryRow,
  ProductsAdminListParams,
  UpsertProductBody,
  PatchProductBody,
  ApiProduct,
} from "@/integrations/metahub/db/types/products";

const BASE = "/admin/products";
type QueryParams = Record<string, string | number | boolean | undefined>;

/* ---------- type guards & utils ---------- */
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
    return s.split(",").map((x) => x.trim()).filter(Boolean);
  }
  return null;
};

const toQueryParams = (params?: ProductsAdminListParams): QueryParams => {
  if (!params) return {};
  const qp: QueryParams = {};
  if (params.q) qp.q = params.q;
  if (params.category_id) qp.category_id = params.category_id;
  if (params.is_active !== undefined) qp.is_active = params.is_active ? 1 : 0;
  if (params.show_on_homepage !== undefined) qp.show_on_homepage = params.show_on_homepage ? 1 : 0;
  if (typeof params.min_price === "number") qp.min_price = params.min_price;
  if (typeof params.max_price === "number") qp.max_price = params.max_price;
  if (typeof params.limit === "number") qp.limit = params.limit;
  if (typeof params.offset === "number") qp.offset = params.offset;
  if (params.sort) qp.sort = params.sort;
  if (params.order) qp.order = params.order;
  return qp;
};

const normalizeAdminProduct = (p: ApiProduct): ProductAdmin => {
  const galleryUrls = toArray(p.gallery_urls) ?? toArray(p.images);
  return {
    id: String((p as { id: unknown }).id),
    name: String((p as { name?: unknown }).name ?? ""),
    slug: String((p as { slug?: unknown }).slug ?? ""),

    description: (p.description ?? null) as string | null,
    short_description: (p.short_description ?? null) as string | null,
    category_id: (p.category_id ?? null) as string | null,

    price: toNumber(p.price),
    original_price: toNullableNumber((p.original_price ?? p.compare_at_price) as unknown),
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
    delivery_type: (p.delivery_type as ProductAdmin["delivery_type"]),

    custom_fields: (p.custom_fields as ProductAdmin["custom_fields"]) ?? null,
    quantity_options: (p.quantity_options as ProductAdmin["quantity_options"]) ?? null,

    api_provider_id: (p.api_provider_id ?? null) as string | null,
    api_product_id: (p.api_product_id ?? null) as string | null,
    api_quantity: toNullableNumber(p.api_quantity as unknown),

    meta_title: (p.meta_title ?? null) as string | null,
    meta_description: (p.meta_description ?? null) as string | null,

    article_content: (p.article_content ?? null) as string | null,
    article_enabled: toBool(p.article_enabled ?? false) ? 1 : 0,
    demo_url: (p.demo_url ?? null) as string | null,
    demo_embed_enabled: toBool(p.demo_embed_enabled ?? false) ? 1 : 0,
    demo_button_text: (p.demo_button_text ?? null) as string | null,

    badges: (p.badges as ProductAdmin["badges"]) ?? null,

    sku: (p.sku ?? null) as string | null,
    stock_quantity: toNumber((p as { stock_quantity?: unknown }).stock_quantity),

    is_active: toBool(p.is_active ?? false) ? 1 : 0,
    is_featured: toBool(p.is_featured ?? false) ? 1 : 0,
    show_on_homepage: toBool(p.show_on_homepage ?? false) ? 1 : 0,
    is_digital: toBool(p.is_digital ?? true) ? 1 : 0,
    requires_shipping: toBool(p.requires_shipping ?? false) ? 1 : 0,

    epin_game_id: (p.epin_game_id ?? null) as string | null,
    epin_product_id: (p.epin_product_id ?? null) as string | null,
    auto_delivery_enabled: toBool(p.auto_delivery_enabled ?? false) ? 1 : 0,
    pre_order_enabled: toBool(p.pre_order_enabled ?? false) ? 1 : 0,

    min_order: toNullableNumber(p.min_order as unknown),
    max_order: toNullableNumber(p.max_order as unknown),
    min_barem: toNullableNumber(p.min_barem as unknown),
    max_barem: toNullableNumber(p.max_barem as unknown),
    barem_step: toNullableNumber(p.barem_step as unknown),

    tax_type: toNullableNumber(p.tax_type as unknown),

    file_url: (p.file_url ?? null) as string | null,

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
    updated_at: (p.updated_at ?? undefined) as string | undefined,

    categories: (p.categories as ProductAdmin["categories"]) ?? undefined,
  };
};

const toApiBody = (body: UpsertProductBody | PatchProductBody) => body;

/* ---------- API ---------- */
export const productsAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listProductsAdmin: b.query<ProductAdmin[], ProductsAdminListParams | void>({
      query: (params): FetchArgs => {
        const qp = params ? toQueryParams(params as ProductsAdminListParams) : {};
        return { url: `${BASE}`, params: qp } as FetchArgs;
      },
      transformResponse: (res: unknown): ProductAdmin[] => {
        const rows = pluckArray(res, ["data", "items", "rows", "result", "products"]);
        return rows
          .filter(isRecord)
          .map((x) => normalizeAdminProduct(x as unknown as ApiProduct));
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

    getProductAdmin: b.query<ProductAdmin, string>({
      query: (id) => ({ url: `${BASE}/${encodeURIComponent(id)}` } as FetchArgs),
      transformResponse: (res: unknown): ProductAdmin => {
        const obj = Array.isArray(res) ? (res[0] as unknown) : res;
        return normalizeAdminProduct(obj as ApiProduct);
      },
      providesTags: (_r, _e, id) => [{ type: "Product", id }],
      keepUnusedDataFor: 300,
    }),

    createProductAdmin: b.mutation<ProductAdmin, UpsertProductBody>({
      query: (body) =>
        ({ url: `${BASE}`, method: "POST", body: toApiBody(body) } as FetchArgs),
      transformResponse: (res: unknown): ProductAdmin =>
        normalizeAdminProduct(res as ApiProduct),
      invalidatesTags: [{ type: "Products", id: "LIST" }],
    }),

    updateProductAdmin: b.mutation<ProductAdmin, { id: string; body: PatchProductBody }>({
      query: ({ id, body }) =>
        ({ url: `${BASE}/${encodeURIComponent(id)}`, method: "PATCH", body: toApiBody(body) } as FetchArgs),
      transformResponse: (res: unknown): ProductAdmin =>
        normalizeAdminProduct(res as ApiProduct),
      invalidatesTags: (_r, _e, arg) => [
        { type: "Product", id: arg.id },
        { type: "Products", id: "LIST" },
      ],
    }),

    deleteProductAdmin: b.mutation<{ ok: true }, string>({
      query: (id) =>
        ({ url: `${BASE}/${encodeURIComponent(id)}`, method: "DELETE" } as FetchArgs),
      transformResponse: (): { ok: true } => ({ ok: true }),
      invalidatesTags: [{ type: "Products", id: "LIST" }],
    }),

    bulkSetActiveAdmin: b.mutation<{ ok: true }, { ids: string[]; is_active: boolean }>({
      query: ({ ids, is_active }) =>
        ({ url: `${BASE}/bulk/active`, method: "POST", body: { ids, is_active } } as FetchArgs),
      transformResponse: (): { ok: true } => ({ ok: true }),
      invalidatesTags: [{ type: "Products", id: "LIST" }],
    }),

    reorderProductsAdmin: b.mutation<{ ok: true }, Array<{ id: string; display_order: number }>>({
      query: (items) =>
        ({ url: `${BASE}/bulk/reorder`, method: "POST", body: { items } } as FetchArgs),
      transformResponse: (): { ok: true } => ({ ok: true }),
      invalidatesTags: [{ type: "Products", id: "LIST" }],
    }),

    toggleActiveProductAdmin: b.mutation<ProductAdmin, { id: string; is_active: boolean }>({
      query: ({ id, is_active }) =>
        ({ url: `${BASE}/${encodeURIComponent(id)}/active`, method: "PATCH", body: { is_active } } as FetchArgs),
      transformResponse: (res: unknown): ProductAdmin =>
        normalizeAdminProduct(res as ApiProduct),
      invalidatesTags: (_r, _e, a) => [
        { type: "Product", id: a.id },
        { type: "Products", id: "LIST" },
      ],
    }),

    toggleHomepageProductAdmin: b.mutation<ProductAdmin, { id: string; show_on_homepage: boolean }>({
      query: ({ id, show_on_homepage }) =>
        ({ url: `${BASE}/${encodeURIComponent(id)}/homepage`, method: "PATCH", body: { show_on_homepage } } as FetchArgs),
      transformResponse: (res: unknown): ProductAdmin =>
        normalizeAdminProduct(res as ApiProduct),
      invalidatesTags: (_r, _e, a) => [
        { type: "Product", id: a.id },
        { type: "Products", id: "LIST" },
      ],
    }),

    replaceReviewsAdmin: b.mutation<{ ok: true }, { id: string; reviews: Review[] }>({
      query: ({ id, reviews }) =>
        ({ url: `${BASE}/${encodeURIComponent(id)}/reviews`, method: "PUT", body: { reviews } } as FetchArgs),
      transformResponse: (): { ok: true } => ({ ok: true }),
      invalidatesTags: (_r, _e, a) => [
        { type: "Product", id: a.id },
        { type: "ProductReviews", id: a.id },
      ],
    }),

    replaceFaqsAdmin: b.mutation<{ ok: true }, { id: string; faqs: FAQ[] }>({
      query: ({ id, faqs }) =>
        ({ url: `${BASE}/${encodeURIComponent(id)}/faqs`, method: "PUT", body: { faqs } } as FetchArgs),
      transformResponse: (): { ok: true } => ({ ok: true }),
      invalidatesTags: (_r, _e, a) => [
        { type: "Product", id: a.id },
        { type: "ProductFAQs", id: a.id },
      ],
    }),

    setProductStockAdmin: b.mutation<{ updated_stock_quantity: number }, { id: string; lines: string[] }>({
      query: ({ id, lines }) =>
        ({ url: `${BASE}/${encodeURIComponent(id)}/stock`, method: "PUT", body: { lines } } as FetchArgs),
      transformResponse: (r: { updated_stock_quantity: number }) => r,
      invalidatesTags: (_r, _e, a) => [
        { type: "Product", id: a.id },
        { type: "Products", id: "LIST" },
      ],
    }),

    listUsedStockAdmin: b.query<UsedStockItem[], string>({
      query: (id) => ({ url: `${BASE}/${encodeURIComponent(id)}/stock/used` } as FetchArgs),
      transformResponse: (res: unknown): UsedStockItem[] => {
        const arr = pluckArray(res, ["data", "items", "rows", "stock"]);
        return arr.filter(isRecord).map((x) => x as unknown as UsedStockItem);
      },
      providesTags: (_r, _e, id) => [{ type: "Product", id }],
      keepUnusedDataFor: 60,
    }),

    listCategoriesAdmin: b.query<Pick<CategoryRow, "id" | "name" | "parent_id" | "is_featured">[], void>({
      query: () => ({ url: "/admin/categories", method: "GET" } as FetchArgs),
      keepUnusedDataFor: 300,
    }),
  }),
  overrideExisting: true,
});

export const {
  useListProductsAdminQuery,
  useGetProductAdminQuery,
  useCreateProductAdminMutation,
  useUpdateProductAdminMutation,
  useDeleteProductAdminMutation,
  useBulkSetActiveAdminMutation,
  useReorderProductsAdminMutation,
  useToggleActiveProductAdminMutation,
  useToggleHomepageProductAdminMutation,
  useReplaceReviewsAdminMutation,
  useReplaceFaqsAdminMutation,
  useSetProductStockAdminMutation,
  useListUsedStockAdminQuery,
  useListCategoriesAdminQuery,
} = productsAdminApi;
