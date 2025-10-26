// =============================================================
// FILE: src/integrations/metahub/client/orders/client.ts
// =============================================================
import { store } from "@/store";
import { ordersApi } from "@/integrations/metahub/rtk/endpoints/orders.endpoints";
import type { OrderView as Order } from "@/integrations/metahub/db/types";
import {
  callEndpoint,
  type RTKSubscription,
} from "@/integrations/metahub/rtk/helpers/callEndpoint";

export type { Order };

export const orders = {
  list(params?: Parameters<typeof ordersApi.endpoints.listOrders.initiate>[0]) {
    return callEndpoint<Order[]>(() => {
      const action = ordersApi.endpoints.listOrders.initiate(params ?? {}, { subscribe: false });
      const dispatchUnknown = store.dispatch as unknown as (a: unknown) => unknown;
      return dispatchUnknown(action) as unknown as RTKSubscription<Order[]>;
    });
  },

  getById(id: string) {
    return callEndpoint<Order>(() => {
      const action = ordersApi.endpoints.getOrderById.initiate(id, { subscribe: false });
      const dispatchUnknown = store.dispatch as unknown as (a: unknown) => unknown;
      return dispatchUnknown(action) as unknown as RTKSubscription<Order>;
    });
  },

  listByUser(userId: string) {
    return callEndpoint<Order[]>(() => {
      const action = ordersApi.endpoints.listOrdersByUser.initiate(userId, { subscribe: false });
      const dispatchUnknown = store.dispatch as unknown as (a: unknown) => unknown;
      return dispatchUnknown(action) as unknown as RTKSubscription<Order[]>;
    });
  },
} as const;
