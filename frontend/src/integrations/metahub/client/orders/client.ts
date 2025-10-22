
// =============================================================
// FILE: src/integrations/metahub/client/orders/client.ts
// =============================================================
import { store } from "@/store";
import { normalizeError } from "@/integrations/metahub/core/errors";
import { ordersApi, type Order } from "@/integrations/metahub/rtk/endpoints/orders.endpoints";

export type { Order };

export const orders = {
  async list(params?: Parameters<typeof ordersApi.endpoints.listOrders.initiate>[0]) {
    try {
      const data = await store.dispatch(ordersApi.endpoints.listOrders.initiate(params ?? {})).unwrap();
      return { data: data as Order[], error: null as null };
    } catch (e) {
      const { message } = normalizeError(e);
      return { data: null as Order[] | null, error: { message } };
    }
  },

  async getById(id: string) {
    try {
      const data = await store.dispatch(ordersApi.endpoints.getOrderById.initiate(id)).unwrap();
      return { data: data as Order, error: null as null };
    } catch (e) {
      const { message } = normalizeError(e);
      return { data: null as Order | null, error: { message } };
    }
  },

  async listByUser(userId: string) {
    try {
      const data = await store.dispatch(ordersApi.endpoints.listOrdersByUser.initiate(userId)).unwrap();
      return { data: data as Order[], error: null as null };
    } catch (e) {
      const { message } = normalizeError(e);
      return { data: null as Order[] | null, error: { message } };
    }
  },
};
