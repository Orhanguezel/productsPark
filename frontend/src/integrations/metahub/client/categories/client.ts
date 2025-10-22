// src/integrations/metahub/categories/client.ts
import { store } from "@/store";
import { normalizeError } from "@/integrations/metahub/core/errors";
import {
  categoriesApi,
  type Category as ApiCategory,
} from "@/integrations/metahub/rtk/endpoints/categories.endpoints";
import {
  setSelectedId as setCategorySelectedId,
  reset as resetCategoriesState,
} from "@/integrations/metahub/rtk/slices/categories/slice";

export type Category = ApiCategory;

export const categories = {
  async list() {
    try {
      const data = await store
        .dispatch(categoriesApi.endpoints.listCategories.initiate())
        .unwrap();
      return { data: data as ApiCategory[], error: null as null };
    } catch (e) {
      const { message } = normalizeError(e);
      return { data: null as ApiCategory[] | null, error: { message } };
    }
  },

  async getById(id: string) {
    try {
      store.dispatch(setCategorySelectedId(id));
      const data = await store
        .dispatch(categoriesApi.endpoints.getCategoryById.initiate(id)) // <-- string
        .unwrap();
      return { data: data as ApiCategory, error: null as null };
    } catch (e) {
      const { message } = normalizeError(e);
      return { data: null as ApiCategory | null, error: { message } };
    }
  },

  reset() {
    store.dispatch(resetCategoriesState());
  },
};
