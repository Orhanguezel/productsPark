// -------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/endpoints/carts_admin.endpoints.ts
// -------------------------------------------------------------
import { baseApi } from "../../baseApi";
import type {
  AdminCartItem,
  AdminApiCartItem,
  AdminCart,
  AdminApiCart,
} from "@/integrations/metahub/rtk/types/cart";

// helpers
const toNumber = (x: unknown): number =>
  typeof x === "number" ? x : Number(x as unknown);

const tryParse = <T>(x: unknown): T => {
  if (typeof x === "string") {
    try {
      return JSON.parse(x) as T;
    } catch {
      /* keep */
    }
  }
  return x as T;
};

const toIso = (x: unknown): string | null => {
  if (!x) return null;
  const d = typeof x === "string" ? new Date(x) : (x as Date);
  return new Date(d).toISOString();
};

// Eski isimleri bozmamak için alias
export type CartItem = AdminCartItem;
export type ApiCartItem = AdminApiCartItem;
export type Cart = AdminCart;
export type ApiCart = AdminApiCart;

// normalize
const normalizeCartItem = (i: ApiCartItem): CartItem => ({
  ...i,
  sku: (i.sku ?? null) as string | null,
  variant_id: (i.variant_id ?? null) as string | null,
  image_url: (i.image_url ?? null) as string | null,
  qty: toNumber(i.qty),
  price: toNumber(i.price),
  subtotal: toNumber(i.subtotal),
  meta: i.meta
    ? typeof i.meta === "string"
      ? tryParse<Record<string, unknown>>(i.meta)
      : i.meta
    : null,
});

const normalizeCart = (c: ApiCart): Cart => ({
  ...c,
  user_id: (c.user_id ?? null) as string | null,
  user: c.user
    ? {
      id: c.user.id,
      email: c.user.email ?? null,
      name: c.user.name ?? null,
    }
    : null,
  items: Array.isArray(c.items)
    ? c.items.map(normalizeCartItem)
    : tryParse<ApiCartItem[]>(c.items).map(normalizeCartItem),
  subtotal: toNumber(c.subtotal),
  discount_total: toNumber(c.discount_total),
  total_price: toNumber(c.total_price),
  coupon_code: (c.coupon_code ?? null) as string | null,
  note: (c.note ?? null) as string | null,
  is_locked: (c.is_locked ?? false) as boolean,
  updated_at: c.updated_at ? toIso(c.updated_at) : null,
});

export type ListParams = {
  q?: string; // search in user email/name or id
  user_id?: string; // exact
  has_coupon?: boolean;
  is_guest?: boolean; // user_id is null
  min_total?: number;
  max_total?: number;
  starts_at?: string;
  ends_at?: string; // created_at range (ISO)
  limit?: number;
  offset?: number;
  sort?: "created_at" | "updated_at" | "total_price" | "subtotal";
  order?: "asc" | "desc";
  include?: Array<"user">;
};

export type AddItemBody = {
  product_id: string;
  variant_id?: string | null;
  qty: number;
  price?: number | null;
  meta?: Record<string, unknown> | null;
};
export type UpdateItemBody = {
  qty?: number;
  price?: number | null;
  meta?: Record<string, unknown> | null;
};
export type UpdateCartBody = {
  note?: string | null;
  currency?: string | null;
  lock?: boolean;
};
export type MergeBody = { target_id: string; source_id: string };
export type ApplyCouponBody = { code: string };

export const cartsAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listCartsAdmin: b.query<Cart[], ListParams | void>({
      query: (params) => ({ url: "/carts", params }),
      transformResponse: (res: unknown): Cart[] =>
        Array.isArray(res)
          ? (res as ApiCart[]).map(normalizeCart)
          : [],
      providesTags: (result) =>
        result
          ? [
            ...result.map((c) => ({
              type: "Carts" as const,
              id: c.id,
            })),
            { type: "Carts" as const, id: "LIST" },
          ]
          : [{ type: "Carts" as const, id: "LIST" }],
      keepUnusedDataFor: 60,
    }),

    getCartAdminById: b.query<Cart, string>({
      query: (id) => ({ url: `/carts/${id}` }),
      transformResponse: (res: unknown): Cart =>
        normalizeCart(res as ApiCart),
      providesTags: (_r, _e, id) => [{ type: "Carts", id }],
    }),

    listCartItemsAdmin: b.query<CartItem[], string>({
      query: (id) => ({ url: `/carts/${id}/items` }),
      transformResponse: (res: unknown): CartItem[] =>
        Array.isArray(res)
          ? (res as ApiCartItem[]).map(normalizeCartItem)
          : [],
      providesTags: (_r, _e, id) => [
        { type: "Carts", id: `ITEMS_${id}` },
      ],
    }),

    addCartItemAdmin: b.mutation<Cart, { id: string; body: AddItemBody }>({
      query: ({ id, body }) => ({
        url: `/carts/${id}/items`,
        method: "POST",
        body,
      }),
      transformResponse: (res: unknown): Cart =>
        normalizeCart(res as ApiCart),
      invalidatesTags: (_r, _e, arg) => [
        { type: "Carts", id: arg.id },
        { type: "Carts", id: `ITEMS_${arg.id}` },
        { type: "Carts", id: "LIST" },
      ],
    }),

    updateCartItemAdmin: b.mutation<
      Cart,
      { id: string; item_id: string; body: UpdateItemBody }
    >({
      query: ({ id, item_id, body }) => ({
        url: `/carts/${id}/items/${item_id}`,
        method: "PATCH",
        body,
      }),
      transformResponse: (res: unknown): Cart =>
        normalizeCart(res as ApiCart),
      invalidatesTags: (_r, _e, arg) => [
        { type: "Carts", id: arg.id },
        { type: "Carts", id: `ITEMS_${arg.id}` },
      ],
    }),

    removeCartItemAdmin: b.mutation<Cart, { id: string; item_id: string }>({
      query: ({ id, item_id }) => ({
        url: `/carts/${id}/items/${item_id}`,
        method: "DELETE",
      }),
      transformResponse: (res: unknown): Cart =>
        normalizeCart(res as ApiCart),
      invalidatesTags: (_r, _e, arg) => [
        { type: "Carts", id: arg.id },
        { type: "Carts", id: `ITEMS_${arg.id}` },
        { type: "Carts", id: "LIST" },
      ],
    }),

    clearCartAdmin: b.mutation<Cart, string>({
      query: (id) => ({ url: `/carts/${id}/clear`, method: "POST" }),
      transformResponse: (res: unknown): Cart =>
        normalizeCart(res as ApiCart),
      invalidatesTags: (_r, _e, id) => [
        { type: "Carts", id },
        { type: "Carts", id: `ITEMS_${id}` },
      ],
    }),

    mergeCartsAdmin: b.mutation<Cart, MergeBody>({
      query: ({ target_id, source_id }) => ({
        url: `/carts/${target_id}/merge`,
        method: "POST",
        body: { source_id },
      }),
      transformResponse: (res: unknown): Cart =>
        normalizeCart(res as ApiCart),
      invalidatesTags: (_r, _e, arg) => [
        { type: "Carts", id: arg.target_id },
        { type: "Carts", id: arg.source_id },
        { type: "Carts", id: "LIST" },
      ],
    }),

    applyCouponCartAdmin: b.mutation<
      Cart,
      { id: string; body: ApplyCouponBody }
    >({
      query: ({ id, body }) => ({
        url: `/carts/${id}/coupon`,
        method: "POST",
        body,
      }),
      transformResponse: (res: unknown): Cart =>
        normalizeCart(res as ApiCart),
      invalidatesTags: (_r, _e, arg) => [
        { type: "Carts", id: arg.id },
        { type: "Carts", id: "LIST" },
      ],
    }),

    removeCouponCartAdmin: b.mutation<Cart, string>({
      query: (id) => ({
        url: `/carts/${id}/coupon`,
        method: "DELETE",
      }),
      transformResponse: (res: unknown): Cart =>
        normalizeCart(res as ApiCart),
      invalidatesTags: (_r, _e, id) => [
        { type: "Carts", id },
        { type: "Carts", id: "LIST" },
      ],
    }),

    updateCartAdmin: b.mutation<
      Cart,
      { id: string; body: UpdateCartBody }
    >({
      query: ({ id, body }) => ({
        url: `/carts/${id}`,
        method: "PATCH",
        body,
      }),
      transformResponse: (res: unknown): Cart =>
        normalizeCart(res as ApiCart),
      invalidatesTags: (_r, _e, arg) => [
        { type: "Carts", id: arg.id },
        { type: "Carts", id: "LIST" },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListCartsAdminQuery,
  useGetCartAdminByIdQuery,
  useListCartItemsAdminQuery,
  useAddCartItemAdminMutation,
  useUpdateCartItemAdminMutation,
  useRemoveCartItemAdminMutation,
  useClearCartAdminMutation,
  useMergeCartsAdminMutation,
  useApplyCouponCartAdminMutation,
  useRemoveCouponCartAdminMutation,
  useUpdateCartAdminMutation,
} = cartsAdminApi;
