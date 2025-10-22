

// =============================================================
// FILE: src/integrations/metahub/client/carts/client.ts
// =============================================================
import { store as store2 } from "@/store";
import { normalizeError as normalizeError2 } from "@/integrations/metahub/core/errors";
import { cartItemsApi, type CartItem } from "@/integrations/metahub/rtk/endpoints/cart_items.endpoints";

export type { CartItem };

export const carts = {
  async list(params?: Parameters<typeof cartItemsApi.endpoints.listCartItems.initiate>[0]) {
    try {
      const data = await store2.dispatch(cartItemsApi.endpoints.listCartItems.initiate(params ?? {})).unwrap();
      return { data: data as CartItem[], error: null as null };
    } catch (e) {
      const { message } = normalizeError2(e);
      return { data: null as CartItem[] | null, error: { message } };
    }
  },

  async getById(id: string) {
    try {
      const data = await store2.dispatch(cartItemsApi.endpoints.getCartItemById.initiate(id)).unwrap();
      return { data: data as CartItem, error: null as null };
    } catch (e) {
      const { message } = normalizeError2(e);
      return { data: null as CartItem | null, error: { message } };
    }
  },
};
