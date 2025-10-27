// -------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/endpoints/products_admin.endpoints.ts
// -------------------------------------------------------------
import { baseApi } from "../../baseApi";
import type {
  ProductRow,
  ProductFaqRow,
  ProductReviewRow,
  ProductStockRow,
  CategoryRow,
} from "@/integrations/metahub/db/types";

// Alias’lar (merkez tipleri FE admin için yeniden adlandırıyoruz)
export type ProductAdmin = ProductRow;
export type Review = ProductReviewRow;
export type FAQ = ProductFaqRow;

// Sipariş join’i ile kullanılan stok satırı (FE’de usedStock kartları için)
export type UsedStockItem = ProductStockRow & {
  order: {
    id: string;
    order_number: string;
    customer_name: string;
    customer_email?: string | null;
  } | null;
};

// List parametreleri (sade)
export type ProductsAdminListParams = {
  q?: string;
  category_id?: string;
  is_active?: boolean;
  show_on_homepage?: boolean;
  min_price?: number;
  max_price?: number;
  limit?: number;
  offset?: number;
  sort?: "created_at" | "price" | "name" | "review_count" | "rating";
  order?: "asc" | "desc";
};

// Upsert/Patch (rating hesaplanır; categories join olduğundan çıkarıldı)
export type UpsertProductBody = Omit<ProductRow, "id" | "created_at" | "updated_at" | "categories" | "rating">;
export type PatchProductBody = Partial<UpsertProductBody>;

// (Projede tiplenmemiş) API provider minimal tipi
export type ApiProviderRow = { id: string; name: string; is_active: boolean };

export const productsAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({

    // === PRODUCTS ===
    listProductsAdmin: b.query<ProductAdmin[], ProductsAdminListParams | void>({
      query: (params) => ({
        url: "/admin/products",
        params: params
          ? {
              ...params,
              // BE tarafı 0/1 bekliyorsa backend uyumlu; boolean destekliyorsa olduğu gibi gider
              is_active: params.is_active ?? undefined,
              show_on_homepage: params.show_on_homepage ?? undefined,
            }
          : undefined,
      }),
      transformResponse: (res: unknown): ProductAdmin[] => {
        if (Array.isArray(res)) return res as ProductAdmin[];
        const maybe = res as { data?: unknown };
        return Array.isArray(maybe?.data) ? (maybe.data as ProductAdmin[]) : [];
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
      query: (id) => ({ url: `/admin/products/${id}` }),
      transformResponse: (res: unknown): ProductAdmin =>
        (Array.isArray(res) ? (res[0] as ProductAdmin) : (res as ProductAdmin)),
      providesTags: (_r, _e, id) => [{ type: "Product", id }],
    }),

    createProductAdmin: b.mutation<ProductAdmin, UpsertProductBody>({
      query: (body) => ({ url: "/admin/products", method: "POST", body }),
      transformResponse: (res: unknown): ProductAdmin => res as ProductAdmin,
      invalidatesTags: [{ type: "Products" as const, id: "LIST" }],
    }),

    updateProductAdmin: b.mutation<ProductAdmin, { id: string; body: PatchProductBody }>({
      query: ({ id, body }) => ({ url: `/admin/products/${id}`, method: "PATCH", body }),
      transformResponse: (res: unknown): ProductAdmin => res as ProductAdmin,
      invalidatesTags: (_r, _e, arg) => [{ type: "Product", id: arg.id }, { type: "Products", id: "LIST" }],
    }),

    deleteProductAdmin: b.mutation<{ ok: true }, string>({
      query: (id) => ({ url: `/admin/products/${id}`, method: "DELETE" }),
      transformResponse: () => ({ ok: true as const }),
      invalidatesTags: [{ type: "Products" as const, id: "LIST" }],
    }),

    bulkSetActiveAdmin: b.mutation<{ ok: true }, { ids: string[]; is_active: boolean }>({
      query: ({ ids, is_active }) => ({
        url: "/admin/products/bulk/active",
        method: "POST",
        body: { ids, is_active },
      }),
      transformResponse: () => ({ ok: true as const }),
      invalidatesTags: [{ type: "Products" as const, id: "LIST" }],
    }),

    reorderProductsAdmin: b.mutation<{ ok: true }, Array<{ id: string; display_order: number }>>({
      query: (items) => ({ url: "/admin/products/bulk/reorder", method: "POST", body: { items } }),
      transformResponse: () => ({ ok: true as const }),
      invalidatesTags: [{ type: "Products" as const, id: "LIST" }],
    }),

    toggleActiveProductAdmin: b.mutation<ProductAdmin, { id: string; is_active: boolean }>({
      query: ({ id, is_active }) => ({
        url: `/admin/products/${id}/active`,
        method: "PATCH",
        body: { is_active },
      }),
      transformResponse: (res: unknown): ProductAdmin => res as ProductAdmin,
      invalidatesTags: (_r, _e, a) => [{ type: "Product", id: a.id }, { type: "Products", id: "LIST" }],
    }),

    toggleHomepageProductAdmin: b.mutation<ProductAdmin, { id: string; show_on_homepage: boolean }>({
      query: ({ id, show_on_homepage }) => ({
        url: `/admin/products/${id}/homepage`,
        method: "PATCH",
        body: { show_on_homepage },
      }),
      transformResponse: (res: unknown): ProductAdmin => res as ProductAdmin,
      invalidatesTags: (_r, _e, a) => [{ type: "Product", id: a.id }, { type: "Products", id: "LIST" }],
    }),

    // === RELATIONS (opsiyonel) ===
    attachVariantToProductAdmin: b.mutation<{ ok: true }, { product_id: string; variant_id: string }>({
      query: (body) => ({ url: "/admin/products/attach-variant", method: "POST", body }),
      transformResponse: () => ({ ok: true as const }),
      invalidatesTags: [{ type: "Products" as const, id: "LIST" }],
    }),
    detachVariantFromProductAdmin: b.mutation<{ ok: true }, { product_id: string; variant_id: string }>({
      query: (body) => ({ url: "/admin/products/detach-variant", method: "POST", body }),
      transformResponse: () => ({ ok: true as const }),
      invalidatesTags: [{ type: "Products" as const, id: "LIST" }],
    }),
    attachOptionToProductAdmin: b.mutation<{ ok: true }, { product_id: string; option_id: string }>({
      query: (body) => ({ url: "/admin/products/attach-option", method: "POST", body }),
      transformResponse: () => ({ ok: true as const }),
      invalidatesTags: [{ type: "Products" as const, id: "LIST" }],
    }),
    detachOptionFromProductAdmin: b.mutation<{ ok: true }, { product_id: string; option_id: string }>({
      query: (body) => ({ url: "/admin/products/detach-option", method: "POST", body }),
      transformResponse: () => ({ ok: true as const }),
      invalidatesTags: [{ type: "Products" as const, id: "LIST" }],
    }),

    // === REVIEWS / FAQS ===
    replaceReviewsAdmin: b.mutation<{ ok: true }, { id: string; reviews: Review[] }>({
      query: ({ id, reviews }) => ({ url: `/admin/products/${id}/reviews`, method: "PUT", body: { reviews } }),
      transformResponse: () => ({ ok: true as const }),
      invalidatesTags: (_r, _e, a) => [{ type: "Product", id: a.id }],
    }),
    replaceFaqsAdmin: b.mutation<{ ok: true }, { id: string; faqs: FAQ[] }>({
      query: ({ id, faqs }) => ({ url: `/admin/products/${id}/faqs`, method: "PUT", body: { faqs } }),
      transformResponse: () => ({ ok: true as const }),
      invalidatesTags: (_r, _e, a) => [{ type: "Product", id: a.id }],
    }),

    // === STOCK (auto_stock) ===
    setProductStockAdmin: b.mutation<{ updated_stock_quantity: number }, { id: string; lines: string[] }>({
      query: ({ id, lines }) => ({ url: `/admin/products/${id}/stock`, method: "PUT", body: { lines } }),
      transformResponse: (r: { updated_stock_quantity: number }) => r,
      invalidatesTags: (_r, _e, a) => [{ type: "Product", id: a.id }, { type: "Products", id: "LIST" }],
    }),

    listUsedStockAdmin: b.query<UsedStockItem[], string>({
      query: (id) => ({ url: `/admin/products/${id}/stock/used` }),
      transformResponse: (res: unknown): UsedStockItem[] => {
        const arr = Array.isArray(res) ? res : (res as { data?: unknown[] })?.data;
        return Array.isArray(arr) ? (arr as UsedStockItem[]) : [];
      },
      providesTags: (_r, _e, id) => [{ type: "Product", id }],
    }),

    // === CATEGORIES & API PROVIDERS ===
    listCategoriesAdmin: b.query<Pick<CategoryRow, "id" | "name" | "parent_id" | "is_featured">[], void>({
      query: () => ({ url: "/admin/categories", method: "GET" }),
    }),

    listApiProvidersAdmin: b.query<ApiProviderRow[], void>({
      query: () => ({ url: "/admin/api-providers?is_active=1", method: "GET" }),
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

  useAttachVariantToProductAdminMutation,
  useDetachVariantFromProductAdminMutation,
  useAttachOptionToProductAdminMutation,
  useDetachOptionFromProductAdminMutation,

  useReplaceReviewsAdminMutation,
  useReplaceFaqsAdminMutation,

  useSetProductStockAdminMutation,
  useListUsedStockAdminQuery,

  useListCategoriesAdminQuery,
  useListApiProvidersAdminQuery,
} = productsAdminApi;


