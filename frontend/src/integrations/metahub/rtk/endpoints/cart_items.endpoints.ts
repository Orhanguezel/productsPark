// =============================================================
// FILE: src/integrations/metahub/rtk/endpoints/cart_items.endpoints.ts
// =============================================================
import { baseApi as baseApi2 } from "../baseApi";

const toFiniteNumber = (x: unknown): number => {
  if (typeof x === "number") return Number.isFinite(x) ? x : 0;
  if (typeof x === "string") {
    const n = Number(x);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
};

const tryJson = <T>(x: unknown): T | null => {
  if (x == null) return null;
  if (typeof x === "string") {
    try { return JSON.parse(x) as T; } catch { /* noop */ }
  }
  return x as T;
};

export type CartItemProduct = {
  id: string;
  name: string;
  slug: string;
  price: number;
  image_url: string | null;
  delivery_type?: string | null;
  stock_quantity?: number | null;
  custom_fields?: ReadonlyArray<Record<string, unknown>> | null;
  quantity_options?: { quantity: number; price: number }[] | null;
  api_provider_id?: string | null;
  api_product_id?: string | null;
  api_quantity?: number | null;
  category_id?: string | null;
  categories?: { id: string; name: string } | null;
};

type ApiCartItemProduct =
  Omit<CartItemProduct, "price" | "stock_quantity" | "quantity_options" | "custom_fields" | "categories"> & {
    price?: number | string | null;
    stock_quantity?: number | string | null;
    quantity_options?: string | CartItemProduct["quantity_options"];
    custom_fields?: string | ReadonlyArray<Record<string, unknown>> | null;
    categories?: { id?: string; name?: string } | null;
  };

export type CartItem = {
  id: string;
  user_id?: string | null;
  product_id: string;
  quantity: number;
  options?: Record<string, unknown> | null;
  created_at?: string;
  updated_at?: string;
  // join:
  products?: CartItemProduct | null;
};

export type ApiCartItem = Omit<CartItem, "quantity" | "options" | "products"> & {
  quantity: number | string;
  options?: string | CartItem["options"];
  products?: ApiCartItemProduct | null;
};

const normalizeProduct = (p?: ApiCartItemProduct | null): CartItemProduct | null => {
  if (!p) return null;

  const parsedCustomFields =
    typeof p.custom_fields === "string"
      ? tryJson<ReadonlyArray<Record<string, unknown>>>(p.custom_fields)
      : (Array.isArray(p.custom_fields) ? p.custom_fields : null);

  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: toFiniteNumber(p.price),
    image_url: p.image_url ?? null,
    delivery_type: p.delivery_type ?? null,
    stock_quantity: p.stock_quantity == null ? null : toFiniteNumber(p.stock_quantity),
    custom_fields: parsedCustomFields,
    quantity_options: tryJson<CartItemProduct["quantity_options"]>(p.quantity_options),
    api_provider_id: p.api_provider_id ?? null,
    api_product_id: p.api_product_id ?? null,
    api_quantity: p.api_quantity == null ? null : toFiniteNumber(p.api_quantity),
    category_id: p.category_id ?? null,
    categories: p.categories ? { id: p.categories.id ?? "", name: p.categories.name ?? "" } : null,
  };
};

const normalizeCartItem = (c: ApiCartItem): CartItem => ({
  id: c.id,
  user_id: c.user_id ?? null,
  product_id: c.product_id,
  quantity: toFiniteNumber(c.quantity),
  options: c.options ? tryJson<Record<string, unknown>>(c.options) : null,
  created_at: c.created_at,
  updated_at: c.updated_at,
  products: normalizeProduct(c.products),
});

export const cartItemsApi = baseApi2.injectEndpoints({
  endpoints: (b) => ({
    listCartItems: b.query<
      CartItem[],
      {
        user_id?: string;
        with?: string; // ör: "products,products.categories"
        limit?: number;
        offset?: number;
        sort?: "created_at" | "updated_at";
        order?: "asc" | "desc";
      }
    >({
      query: (params) => ({ url: "/cart_items", params }),
      transformResponse: (res: unknown): CartItem[] =>
        Array.isArray(res) ? (res as ApiCartItem[]).map(normalizeCartItem) : [],
      providesTags: (result) =>
        result
          ? [
              ...result.map((i) => ({ type: "CartItem" as const, id: i.id })),
              { type: "CartItems" as const, id: "LIST" },
            ]
          : [{ type: "CartItems" as const, id: "LIST" }],
    }),

    getCartItemById: b.query<CartItem, string>({
      query: (id) => ({ url: `/cart_items/${id}` }),
      transformResponse: (res: unknown): CartItem => normalizeCartItem(res as ApiCartItem),
      providesTags: (_r, _e, id) => [{ type: "CartItem", id }],
    }),
  }),
  overrideExisting: true,
});

export const { useListCartItemsQuery, useGetCartItemByIdQuery } = cartItemsApi;
