// -------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/endpoints/cart_items.endpoints.ts
// (Public cart items /cart_items)
// -------------------------------------------------------------
import { baseApi } from "../baseApi";
import type {
  PublicCartItemProduct,
  PublicApiCartItemProduct,
  PublicCartItem,
  PublicApiCartItem,
} from "@/integrations/metahub/db/types/cart";

/* utils */
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
    try {
      return JSON.parse(x) as T;
    } catch {
      /* noop */
    }
  }
  return x as T;
};

/* type alias'lar (eski export isimlerini koru) */
export type CartItemProduct = PublicCartItemProduct;
type ApiCartItemProduct = PublicApiCartItemProduct;

export type CartItem = PublicCartItem;
export type ApiCartItem = PublicApiCartItem;

/* normalize */
const normalizeProduct = (
  p?: ApiCartItemProduct | null
): CartItemProduct | null => {
  if (!p) return null;

  const parsedCustomFields =
    typeof p.custom_fields === "string"
      ? tryJson<ReadonlyArray<Record<string, unknown>>>(p.custom_fields)
      : Array.isArray(p.custom_fields)
      ? p.custom_fields
      : null;

  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: toFiniteNumber(p.price),
    image_url: p.image_url ?? null,
    delivery_type: p.delivery_type ?? null,
    stock_quantity:
      p.stock_quantity == null ? null : toFiniteNumber(p.stock_quantity),
    custom_fields: parsedCustomFields,
    quantity_options: tryJson<CartItemProduct["quantity_options"]>(
      p.quantity_options
    ),
    api_provider_id: p.api_provider_id ?? null,
    api_product_id: p.api_product_id ?? null,
    api_quantity:
      p.api_quantity == null ? null : toFiniteNumber(p.api_quantity),
    category_id: p.category_id ?? null,
    categories: p.categories
      ? {
          id: p.categories.id ?? "",
          name: p.categories.name ?? "",
        }
      : null,
  };
};

const normalizeCartItem = (c: ApiCartItem): CartItem => ({
  id: c.id,
  user_id: c.user_id ?? null,
  product_id: c.product_id,
  quantity: toFiniteNumber(c.quantity),
  selected_options: c.selected_options
    ? tryJson<Record<string, unknown>>(c.selected_options)
    : null,
  created_at: c.created_at,
  updated_at: c.updated_at,
  products: normalizeProduct(c.products),
});

/* endpoints */
export const cartItemsApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listCartItems: b.query<
      CartItem[],
      {
        user_id?: string;
        with?: string;
        limit?: number;
        offset?: number;
        sort?: "created_at" | "updated_at";
        order?: "asc" | "desc";
      }
    >({
      query: (params) => ({ url: "/cart_items", params }),
      transformResponse: (res: unknown): CartItem[] =>
        Array.isArray(res)
          ? (res as ApiCartItem[]).map(normalizeCartItem)
          : [],
      providesTags: (result) =>
        result
          ? [
              ...result.map((i) => ({
                type: "CartItem" as const,
                id: i.id,
              })),
              { type: "CartItems" as const, id: "LIST" },
            ]
          : [{ type: "CartItems" as const, id: "LIST" }],
    }),

    getCartItemById: b.query<CartItem, string>({
      query: (id) => ({ url: `/cart_items/${id}` }),
      transformResponse: (res: unknown): CartItem =>
        normalizeCartItem(res as ApiCartItem),
      providesTags: (_r, _e, id) => [{ type: "CartItem", id }],
    }),

    /** POST /cart_items */
    createCartItem: b.mutation<
      CartItem,
      {
        user_id: string;
        product_id: string;
        quantity: number;
        selected_options?: Record<string, unknown> | null;
      }
    >({
      query: (body) => ({
        url: "/cart_items",
        method: "POST",
        body,
      }),
      transformResponse: (res: unknown): CartItem =>
        normalizeCartItem(res as ApiCartItem),
      invalidatesTags: (result) =>
        result
          ? [
              { type: "CartItem" as const, id: result.id },
              { type: "CartItems" as const, id: "LIST" },
            ]
          : [{ type: "CartItems" as const, id: "LIST" }],
    }),

    /** PATCH /cart_items/:id */
    updateCartItem: b.mutation<
      CartItem,
      {
        id: string;
        quantity?: number;
        selected_options?: Record<string, unknown> | null;
      }
    >({
      query: ({ id, ...body }) => ({
        url: `/cart_items/${id}`,
        method: "PATCH",
        body,
      }),
      transformResponse: (res: unknown): CartItem =>
        normalizeCartItem(res as ApiCartItem),
      invalidatesTags: (_r, _e, arg) => [
        { type: "CartItem" as const, id: arg.id },
        { type: "CartItems" as const, id: "LIST" },
      ],
    }),

    /** DELETE /cart_items/:id */
    deleteCartItem: b.mutation<{ ok: true }, string>({
      query: (id) => ({
        url: `/cart_items/${id}`,
        method: "DELETE",
      }),
      // BE 204 döndürüyor, biz sadece ok:true dönüyoruz
      transformResponse: (): { ok: true } => ({ ok: true }),
      invalidatesTags: (_r, _e, id) => [
        { type: "CartItem" as const, id },
        { type: "CartItems" as const, id: "LIST" },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListCartItemsQuery,
  useGetCartItemByIdQuery,
  useCreateCartItemMutation,
  useUpdateCartItemMutation,
  useDeleteCartItemMutation,
} = cartItemsApi;
