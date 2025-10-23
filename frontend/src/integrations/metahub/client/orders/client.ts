// =============================================================
// FILE: src/integrations/metahub/client/orders/client.ts
// =============================================================
import { store } from "@/store";
import { ordersApi, type Order } from "@/integrations/metahub/rtk/endpoints/orders.endpoints";
import { callEndpoint } from "@/integrations/metahub/rtk/helpers/callEndpoint";

export type { Order };

export const orders = {
  list(params?: Parameters<typeof ordersApi.endpoints.listOrders.initiate>[0]) {
    return callEndpoint<Order[]>(() =>
      store.dispatch(
        ordersApi.endpoints.listOrders.initiate(params ?? {}, { subscribe: false })
      )
    );
  },

  getById(id: string) {
    return callEndpoint<Order>(() =>
      store.dispatch(
        ordersApi.endpoints.getOrderById.initiate(id, { subscribe: false })
      )
    );
  },

  listByUser(userId: string) {
    return callEndpoint<Order[]>(() =>
      store.dispatch(
        ordersApi.endpoints.listOrdersByUser.initiate(userId, { subscribe: false })
      )
    );
  },
} as const;
