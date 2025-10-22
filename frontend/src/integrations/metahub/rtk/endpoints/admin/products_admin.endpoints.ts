
// -------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/endpoints/products_admin.endpoints.ts
// -------------------------------------------------------------
import { baseApi } from "../../baseApi";

const toIso = (x: unknown): string => new Date(x as string | number | Date).toISOString();
const toNum = (x: unknown): number => (typeof x === "number" ? x : Number(x as unknown));
const toBool = (x: unknown): boolean => (typeof x === "boolean" ? x : Number(x as unknown) === 1);
const tryParse = <T>(x: unknown): T => { if (typeof x === "string") { try { return JSON.parse(x) as T; } catch {/* keep string */} } return x as T; };

export type ProductSEO = { title?: string | null; description?: string | null; keywords?: string[] | null };
export type ProductAttributes = Record<string, string | number | boolean | null>;

export type ProductAdmin = {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  barcode: string | null;
  category_id: string | null;
  price: number;
  original_price: number | null;
  currency: string;
  image_url: string | null;
  gallery: string[];                 // additional images
  short_description: string | null;
  description: string | null;        // rich text (HTML/MD)
  is_active: boolean;
  show_on_homepage: boolean;
  tags: string[];
  rating: number;
  review_count: number;
  attributes: ProductAttributes | null;
  seo: ProductSEO | null;
  created_at: string;
  updated_at: string;
};

export type ApiProductAdmin = Omit<ProductAdmin, "price" | "original_price" | "gallery" | "is_active" | "show_on_homepage" | "tags" | "attributes" | "seo" | "rating" | "review_count" | "created_at" | "updated_at"> & {
  price: number | string;
  original_price: number | string | null;
  gallery: string | string[] | null;         // JSON-string or array
  is_active: boolean | 0 | 1 | "0" | "1";
  show_on_homepage: boolean | 0 | 1 | "0" | "1";
  tags: string[] | string | null;            // JSON-string or array
  attributes: string | ProductAttributes | null;
  seo: string | ProductSEO | null;
  rating: number | string;
  review_count: number | string;
  created_at: string | number | Date;
  updated_at: string | number | Date;
};

const normalizeProduct = (p: ApiProductAdmin): ProductAdmin => ({
  ...p,
  price: toNum(p.price),
  original_price: p.original_price == null ? null : toNum(p.original_price),
  gallery: p.gallery == null ? [] : (Array.isArray(p.gallery) ? p.gallery.map(String) : tryParse<string[]>(p.gallery)),
  is_active: toBool(p.is_active),
  show_on_homepage: toBool(p.show_on_homepage),
  tags: p.tags == null ? [] : (Array.isArray(p.tags) ? p.tags.map(String) : tryParse<string[]>(p.tags)),
  attributes: p.attributes == null ? null : tryParse<ProductAttributes>(p.attributes),
  seo: p.seo == null ? null : tryParse<ProductSEO>(p.seo),
  rating: toNum(p.rating),
  review_count: toNum(p.review_count),
  created_at: toIso(p.created_at),
  updated_at: toIso(p.updated_at),
});

export type ProductsAdminListParams = {
  q?: string;                       // name/sku/slug search
  category_id?: string;
  is_active?: boolean;
  show_on_homepage?: boolean;
  min_price?: number; max_price?: number;
  limit?: number; offset?: number;
  sort?: "created_at" | "price" | "name" | "review_count" | "rating"; order?: "asc" | "desc";
};

export type UpsertProductBody = Omit<ProductAdmin, "id" | "created_at" | "updated_at" | "rating" | "review_count">;
export type PatchProductBody = Partial<UpsertProductBody>;

export const productsAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listProductsAdmin: b.query<ProductAdmin[], ProductsAdminListParams | void>({
      query: (params) => ({
        url: "/admin/products",
        params: params ? {
          ...params,
          is_active: params.is_active == null ? undefined : params.is_active ? 1 : 0,
          show_on_homepage: params.show_on_homepage == null ? undefined : params.show_on_homepage ? 1 : 0,
        } : undefined,
      }),
      transformResponse: (res: unknown): ProductAdmin[] => {
        if (Array.isArray(res)) return (res as ApiProductAdmin[]).map(normalizeProduct);
        const maybe = res as { data?: unknown };
        return Array.isArray(maybe?.data) ? (maybe.data as ApiProductAdmin[]).map(normalizeProduct) : [];
      },
      providesTags: (result) => result ? [
        ...result.map((p) => ({ type: "Product" as const, id: p.id })),
        { type: "Products" as const, id: "LIST" },
      ] : [{ type: "Products" as const, id: "LIST" }],
      keepUnusedDataFor: 60,
    }),

    getProductAdmin: b.query<ProductAdmin, string>({
      query: (id) => ({ url: `/admin/products/${id}` }),
      transformResponse: (res: unknown): ProductAdmin => normalizeProduct(res as ApiProductAdmin),
      providesTags: (_r, _e, id) => [{ type: "Product", id }],
    }),

    createProductAdmin: b.mutation<ProductAdmin, UpsertProductBody>({
      query: (body) => ({ url: "/admin/products", method: "POST", body }),
      transformResponse: (res: unknown): ProductAdmin => normalizeProduct(res as ApiProductAdmin),
      invalidatesTags: [{ type: "Products" as const, id: "LIST" }],
    }),

    updateProductAdmin: b.mutation<ProductAdmin, { id: string; body: PatchProductBody }>({
      query: ({ id, body }) => ({ url: `/admin/products/${id}`, method: "PATCH", body }),
      transformResponse: (res: unknown): ProductAdmin => normalizeProduct(res as ApiProductAdmin),
      invalidatesTags: (_r, _e, arg) => [{ type: "Product", id: arg.id }, { type: "Products", id: "LIST" }],
    }),

    deleteProductAdmin: b.mutation<{ ok: true }, string>({
      query: (id) => ({ url: `/admin/products/${id}`, method: "DELETE" }),
      transformResponse: () => ({ ok: true as const }),
      invalidatesTags: [{ type: "Products" as const, id: "LIST" }],
    }),

    bulkSetActiveAdmin: b.mutation<{ ok: true }, { ids: string[]; is_active: boolean }>({
      query: ({ ids, is_active }) => ({ url: "/admin/products/bulk/active", method: "POST", body: { ids, is_active: is_active ? 1 : 0 } }),
      transformResponse: () => ({ ok: true as const }),
      invalidatesTags: [{ type: "Products" as const, id: "LIST" }],
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
} = productsAdminApi;


