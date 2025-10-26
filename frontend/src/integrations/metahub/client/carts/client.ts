import { store } from "@/store";
import { normalizeError } from "@/integrations/metahub/core/errors";
import { cartItemsApi, type CartItem } from "@/integrations/metahub/rtk/endpoints/cart_items.endpoints";

export type { CartItem };
export type ListCartParams = Parameters<typeof cartItemsApi.endpoints.listCartItems.initiate>[0];

export const carts = {
  async list(params?: ListCartParams) {
    try {
      const p = params ?? {};
      const data = await store.dispatch(cartItemsApi.endpoints.listCartItems.initiate(p)).unwrap();
      return { data: data as CartItem[], error: null as null };
    } catch (e) {
      const { message } = normalizeError(e);
      return { data: null as CartItem[] | null, error: { message } };
    }
  },

  async getById(id: string) {
    try {
      const data = await store.dispatch(cartItemsApi.endpoints.getCartItemById.initiate(id)).unwrap();
      return { data: data as CartItem, error: null as null };
    } catch (e) {
      const { message } = normalizeError(e);
      return { data: null as CartItem | null, error: { message } };
    }
  },

  /** quantity_options varsa 1 say, yoksa quantity kadar */
  async count(user_id?: string) {
    const { data } = await this.list({ user_id, with: "products,products.categories", limit: 200 });
    if (!data) return 0;

    return data.reduce((sum, item) => {
      const hasQuantOpts =
        !!item.products?.quantity_options &&
        Array.isArray(item.products.quantity_options) &&
        item.products.quantity_options.length > 0;
      return sum + (hasQuantOpts ? 1 : item.quantity);
    }, 0);
  },
};
