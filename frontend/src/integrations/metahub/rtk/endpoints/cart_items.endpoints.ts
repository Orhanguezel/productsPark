

// =============================================================
// FILE: src/integrations/metahub/rtk/endpoints/cart_items.endpoints.ts
// =============================================================
import { baseApi as baseApi2 } from "../baseApi";

const toNumber2 = (x: unknown): number => (typeof x === "number" ? x : Number(x as unknown));
const tryParse2 = <T>(x: unknown): T => {
  if (typeof x === "string") { try { return JSON.parse(x) as T; } catch { /* noop */ } }
  return x as T;
};

export type CartItem = {
  id: string;
  user_id?: string | null;
  session_id?: string | null;
  product_id: string;
  product_name?: string | null;
  qty: number;
  unit_price: number;
  currency?: string | null;
  selected_options?: Record<string, unknown> | null; // may arrive as JSON-string
  created_at?: string;
  updated_at?: string;
};

export type ApiCartItem = Omit<CartItem, "qty" | "unit_price" | "selected_options"> & {
  qty: number | string;
  unit_price: number | string;
  selected_options?: string | CartItem["selected_options"];
};

const normalizeCartItem = (c: ApiCartItem): CartItem => ({
  ...c,
  qty: toNumber2(c.qty),
  unit_price: toNumber2(c.unit_price),
  selected_options: c.selected_options ? tryParse2<CartItem["selected_options"]>(c.selected_options) : null,
});

export const cartItemsApi = baseApi2.injectEndpoints({
  endpoints: (b) => ({
    listCartItems: b.query<
      CartItem[],
      { user_id?: string; session_id?: string; limit?: number; offset?: number; sort?: "created_at" | "updated_at"; order?: "asc" | "desc" }
    >({
      query: (params) => ({ url: "/cart_items", params }),
      transformResponse: (res: unknown): CartItem[] => Array.isArray(res) ? (res as ApiCartItem[]).map(normalizeCartItem) : [],
      providesTags: (result) => result
        ? [...result.map((i) => ({ type: "CartItem" as const, id: i.id })), { type: "CartItems" as const, id: "LIST" }]
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
