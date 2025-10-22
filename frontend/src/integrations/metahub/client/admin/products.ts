
// -------------------------------------------------------------
// FILE: src/integrations/metahub/client/admin/products.ts (Facade)
// -------------------------------------------------------------
import { store } from "@/store";
import { normalizeError } from "@/integrations/metahub/core/errors";
import {
  productsAdminApi,
  type Product,
  type ListParams,
  type UpsertProductBody,
} from "@/integrations/metahub/rtk/endpoints/admin/products_admin.endpoints";

export const productsAdmin = {
  async list(params?: ListParams) {
    try { const data = await store.dispatch(productsAdminApi.endpoints.listProductsAdmin.initiate(params)).unwrap(); return { data: data as Product[], error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as Product[] | null, error: { message } }; }
  },
  async getById(id: string) {
    try { const data = await store.dispatch(productsAdminApi.endpoints.getProductAdminById.initiate(id)).unwrap(); return { data: data as Product, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as Product | null, error: { message } }; }
  },
  async create(body: UpsertProductBody) {
    try { const data = await store.dispatch(productsAdminApi.endpoints.createProductAdmin.initiate(body)).unwrap(); return { data: data as Product, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as Product | null, error: { message } }; }
  },
  async update(id: string, body: UpsertProductBody) {
    try { const data = await store.dispatch(productsAdminApi.endpoints.updateProductAdmin.initiate({ id, body })).unwrap(); return { data: data as Product, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as Product | null, error: { message } }; }
  },
  async remove(id: string) {
    try { const data = await store.dispatch(productsAdminApi.endpoints.deleteProductAdmin.initiate(id)).unwrap(); return { data, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as { ok: true } | null, error: { message } }; }
  },
  async reorder(items: Array<{ id: string; display_order: number }>) {
    try { const data = await store.dispatch(productsAdminApi.endpoints.reorderProductsAdmin.initiate(items)).unwrap(); return { data, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as { ok: true } | null, error: { message } }; }
  },
  async setActive(id: string, is_active: boolean) {
    try { const data = await store.dispatch(productsAdminApi.endpoints.toggleActiveProductAdmin.initiate({ id, is_active })).unwrap(); return { data: data as Product, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as Product | null, error: { message } }; }
  },
  async setHomepage(id: string, show_on_homepage: boolean) {
    try { const data = await store.dispatch(productsAdminApi.endpoints.toggleHomepageProductAdmin.initiate({ id, show_on_homepage })).unwrap(); return { data: data as Product, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as Product | null, error: { message } }; }
  },
  // relations
  async attachVariant(product_id: string, variant_id: string) {
    try { const data = await store.dispatch(productsAdminApi.endpoints.attachVariantToProductAdmin.initiate({ product_id, variant_id })).unwrap(); return { data, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as { ok: true } | null, error: { message } }; }
  },
  async detachVariant(product_id: string, variant_id: string) {
    try { const data = await store.dispatch(productsAdminApi.endpoints.detachVariantFromProductAdmin.initiate({ product_id, variant_id })).unwrap(); return { data, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as { ok: true } | null, error: { message } }; }
  },
  async attachOption(product_id: string, option_id: string) {
    try { const data = await store.dispatch(productsAdminApi.endpoints.attachOptionToProductAdmin.initiate({ product_id, option_id })).unwrap(); return { data, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as { ok: true } | null, error: { message } }; }
  },
  async detachOption(product_id: string, option_id: string) {
    try { const data = await store.dispatch(productsAdminApi.endpoints.detachOptionFromProductAdmin.initiate({ product_id, option_id })).unwrap(); return { data, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as { ok: true } | null, error: { message } }; }
  },
};

export type { Product, ListParams, UpsertProductBody };


/*

// -------------------------------------------------------------
// FILE: src/integrations/metahub/client/admin/products.ts (Facade)
// -------------------------------------------------------------
import { store } from "@/store";
import { normalizeError } from "@/integrations/metahub/core/errors";
import { productsAdminApi, type ProductAdmin, type ProductsAdminListParams, type UpsertProductBody, type PatchProductBody } from "@/integrations/metahub/rtk/endpoints/products_admin.endpoints";

export const productsAdmin = {
  async list(params?: ProductsAdminListParams) {
    try { const d = await store.dispatch(productsAdminApi.endpoints.listProductsAdmin.initiate(params)).unwrap(); return { data: d as ProductAdmin[], error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as ProductAdmin[] | null, error: { message } }; }
  },
  async get(id: string) {
    try { const d = await store.dispatch(productsAdminApi.endpoints.getProductAdmin.initiate(id)).unwrap(); return { data: d as ProductAdmin, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as ProductAdmin | null, error: { message } }; }
  },
  async create(body: UpsertProductBody) {
    try { const d = await store.dispatch(productsAdminApi.endpoints.createProductAdmin.initiate(body)).unwrap(); return { data: d as ProductAdmin, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as ProductAdmin | null, error: { message } }; }
  },
  async update(id: string, body: PatchProductBody) {
    try { const d = await store.dispatch(productsAdminApi.endpoints.updateProductAdmin.initiate({ id, body })).unwrap(); return { data: d as ProductAdmin, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as ProductAdmin | null, error: { message } }; }
  },
  async remove(id: string) {
    try { await store.dispatch(productsAdminApi.endpoints.deleteProductAdmin.initiate(id)).unwrap(); return { ok: true as const }; }
    catch (e) { const { message } = normalizeError(e); return { ok: false as const, error: { message } } as const; }
  },
  async bulkSetActive(ids: string[], is_active: boolean) {
    try { await store.dispatch(productsAdminApi.endpoints.bulkSetActiveAdmin.initiate({ ids, is_active })).unwrap(); return { ok: true as const }; }
    catch (e) { const { message } = normalizeError(e); return { ok: false as const, error: { message } } as const; }
  },
};

export type { ProductAdmin, ProductsAdminListParams };

*/
