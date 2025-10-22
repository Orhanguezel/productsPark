
// -------------------------------------------------------------
// FILE: src/integrations/metahub/client/admin/categories.ts (Facade)
// -------------------------------------------------------------
import { store } from "@/store";
import { normalizeError } from "@/integrations/metahub/core/errors";
import {
  categoriesAdminApi,
  type Category,
  type ListParams,
  type UpsertCategoryBody,
} from "@/integrations/metahub/rtk/endpoints/admin/categories_admin.endpoints";

export const categoriesAdmin = {
  async list(params?: ListParams) {
    try { const data = await store.dispatch(categoriesAdminApi.endpoints.listCategoriesAdmin.initiate(params)).unwrap(); return { data: data as Category[], error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as Category[] | null, error: { message } }; }
  },
  async getById(id: string) {
    try { const data = await store.dispatch(categoriesAdminApi.endpoints.getCategoryAdminById.initiate(id)).unwrap(); return { data: data as Category, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as Category | null, error: { message } }; }
  },
  async getBySlug(slug: string) {
    try { const data = await store.dispatch(categoriesAdminApi.endpoints.getCategoryAdminBySlug.initiate(slug)).unwrap(); return { data: (data ?? null) as Category | null, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as Category | null, error: { message } }; }
  },
  async create(body: UpsertCategoryBody) {
    try { const data = await store.dispatch(categoriesAdminApi.endpoints.createCategoryAdmin.initiate(body)).unwrap(); return { data: data as Category, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as Category | null, error: { message } }; }
  },
  async update(id: string, body: UpsertCategoryBody) {
    try { const data = await store.dispatch(categoriesAdminApi.endpoints.updateCategoryAdmin.initiate({ id, body })).unwrap(); return { data: data as Category, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as Category | null, error: { message } }; }
  },
  async remove(id: string) {
    try { const data = await store.dispatch(categoriesAdminApi.endpoints.deleteCategoryAdmin.initiate(id)).unwrap(); return { data, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as { ok: true } | null, error: { message } }; }
  },
  async reorder(items: Array<{ id: string; display_order: number }>) {
    try { const data = await store.dispatch(categoriesAdminApi.endpoints.reorderCategoriesAdmin.initiate(items)).unwrap(); return { data, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as { ok: true } | null, error: { message } }; }
  },
  async setActive(id: string, is_active: boolean) {
    try { const data = await store.dispatch(categoriesAdminApi.endpoints.toggleActiveCategoryAdmin.initiate({ id, is_active })).unwrap(); return { data: data as Category, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as Category | null, error: { message } }; }
  },
  async setFeatured(id: string, is_featured: boolean) {
    try { const data = await store.dispatch(categoriesAdminApi.endpoints.toggleFeaturedCategoryAdmin.initiate({ id, is_featured })).unwrap(); return { data: data as Category, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as Category | null, error: { message } }; }
  },
};

export type { Category, ListParams, UpsertCategoryBody };