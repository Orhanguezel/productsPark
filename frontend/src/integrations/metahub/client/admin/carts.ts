
// -------------------------------------------------------------
// FILE: src/integrations/metahub/client/admin/carts.ts (Facade)
// -------------------------------------------------------------
import { store } from "@/store";
import { normalizeError } from "@/integrations/metahub/core/errors";
import {
  cartsAdminApi,
  type Cart,
  type CartItem,
  type ListParams,
  type AddItemBody,
  type UpdateItemBody,
  type UpdateCartBody,
  type MergeBody,
  type ApplyCouponBody,
} from "@/integrations/metahub/rtk/endpoints/admin/carts_admin.endpoints";

export const cartsAdmin = {
  async list(params?: ListParams) {
    try { const data = await store.dispatch(cartsAdminApi.endpoints.listCartsAdmin.initiate(params)).unwrap(); return { data: data as Cart[], error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as Cart[] | null, error: { message } }; }
  },
  async getById(id: string) {
    try { const data = await store.dispatch(cartsAdminApi.endpoints.getCartAdminById.initiate(id)).unwrap(); return { data: data as Cart, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as Cart | null, error: { message } }; }
  },
  async items(id: string) {
    try { const data = await store.dispatch(cartsAdminApi.endpoints.listCartItemsAdmin.initiate(id)).unwrap(); return { data: data as CartItem[], error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as CartItem[] | null, error: { message } }; }
  },
  async addItem(id: string, body: AddItemBody) {
    try { const data = await store.dispatch(cartsAdminApi.endpoints.addCartItemAdmin.initiate({ id, body })).unwrap(); return { data: data as Cart, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as Cart | null, error: { message } }; }
  },
  async updateItem(id: string, item_id: string, body: UpdateItemBody) {
    try { const data = await store.dispatch(cartsAdminApi.endpoints.updateCartItemAdmin.initiate({ id, item_id, body })).unwrap(); return { data: data as Cart, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as Cart | null, error: { message } }; }
  },
  async removeItem(id: string, item_id: string) {
    try { const data = await store.dispatch(cartsAdminApi.endpoints.removeCartItemAdmin.initiate({ id, item_id })).unwrap(); return { data: data as Cart, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as Cart | null, error: { message } }; }
  },
  async clear(id: string) {
    try { const data = await store.dispatch(cartsAdminApi.endpoints.clearCartAdmin.initiate(id)).unwrap(); return { data: data as Cart, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as Cart | null, error: { message } }; }
  },
  async merge(target_id: string, source_id: string) {
    try { const data = await store.dispatch(cartsAdminApi.endpoints.mergeCartsAdmin.initiate({ target_id, source_id })).unwrap(); return { data: data as Cart, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as Cart | null, error: { message } }; }
  },
  async applyCoupon(id: string, body: ApplyCouponBody) {
    try { const data = await store.dispatch(cartsAdminApi.endpoints.applyCouponCartAdmin.initiate({ id, body })).unwrap(); return { data: data as Cart, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as Cart | null, error: { message } }; }
  },
  async removeCoupon(id: string) {
    try { const data = await store.dispatch(cartsAdminApi.endpoints.removeCouponCartAdmin.initiate(id)).unwrap(); return { data: data as Cart, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as Cart | null, error: { message } }; }
  },
  async updateCart(id: string, body: UpdateCartBody) {
    try { const data = await store.dispatch(cartsAdminApi.endpoints.updateCartAdmin.initiate({ id, body })).unwrap(); return { data: data as Cart, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as Cart | null, error: { message } }; }
  },
};

export type { Cart, CartItem, ListParams, AddItemBody, UpdateItemBody, UpdateCartBody, MergeBody, ApplyCouponBody };
