
// -------------------------------------------------------------
// FILE: src/integrations/metahub/client/admin/orders.ts (Facade)
// -------------------------------------------------------------
import { store } from "@/store";
import { normalizeError } from "@/integrations/metahub/core/errors";
import {
  ordersAdminApi
} from "@/integrations/metahub/rtk/endpoints/admin/orders_admin.endpoints";
import {
  type Order,
  type ListParams,
  type UpdateStatusBody,
  type RefundBody,
  type CancelBody,
  type FulfillmentBody,
  type OrderTimelineEvent,
  type AddNoteBody,
} from "@/integrations/metahub/db/types";

export const ordersAdmin = {
  async list(params?: ListParams) {
    try { const data = await store.dispatch(ordersAdminApi.endpoints.listOrdersAdmin.initiate(params)).unwrap(); return { data: data as Order[], error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as Order[] | null, error: { message } }; }
  },
  async getById(id: string) {
    try { const data = await store.dispatch(ordersAdminApi.endpoints.getOrderAdminById.initiate(id)).unwrap(); return { data: data as Order, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as Order | null, error: { message } }; }
  },
  async updateStatus(id: string, body: UpdateStatusBody) {
    try { const data = await store.dispatch(ordersAdminApi.endpoints.updateOrderStatusAdmin.initiate({ id, body })).unwrap(); return { data: data as Order, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as Order | null, error: { message } }; }
  },
  async cancel(id: string, body?: CancelBody) {
    try { const data = await store.dispatch(ordersAdminApi.endpoints.cancelOrderAdmin.initiate({ id, body })).unwrap(); return { data: data as Order, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as Order | null, error: { message } }; }
  },
  async refund(id: string, body: RefundBody) {
    try { const data = await store.dispatch(ordersAdminApi.endpoints.refundOrderAdmin.initiate({ id, body })).unwrap(); return { data: data as Order, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as Order | null, error: { message } }; }
  },
  async updateFulfillment(id: string, body: FulfillmentBody) {
    try { const data = await store.dispatch(ordersAdminApi.endpoints.updateOrderFulfillmentAdmin.initiate({ id, body })).unwrap(); return { data: data as Order, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as Order | null, error: { message } }; }
  },
  async timeline(id: string) {
    try { const data = await store.dispatch(ordersAdminApi.endpoints.listOrderTimelineAdmin.initiate(id)).unwrap(); return { data: data as OrderTimelineEvent[], error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as OrderTimelineEvent[] | null, error: { message } }; }
  },
  async addNote(id: string, body: AddNoteBody) {
    try { const data = await store.dispatch(ordersAdminApi.endpoints.addOrderNoteAdmin.initiate({ id, body })).unwrap(); return { data, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as { ok: true } | null, error: { message } }; }
  },
};

export type { Order, ListParams, UpdateStatusBody, RefundBody, CancelBody, FulfillmentBody, OrderTimelineEvent, AddNoteBody };
