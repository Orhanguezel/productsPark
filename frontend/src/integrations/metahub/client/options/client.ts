
// -------------------------------------------------------------
// FILE: src/integrations/metahub/client/options/client.ts (Facade)
// -------------------------------------------------------------
import { store as store2 } from "@/store";
import { normalizeError as nErr } from "@/integrations/metahub/core/errors";
import { productOptionsApi, type ProductOption, type ProductOptionValue, type UpsertOptionBody, type UpsertValueBody } from "@/integrations/metahub/rtk/endpoints/product_options.endpoints";

export type { ProductOption, ProductOptionValue, UpsertOptionBody, UpsertValueBody };

export const options = {
  async listByProduct(product_id: string) {
    try { const data = await store2.dispatch(productOptionsApi.endpoints.listProductOptions.initiate({ product_id })).unwrap(); return { data: data as ProductOption[], error: null as null }; }
    catch (e) { const { message } = nErr(e); return { data: null as ProductOption[] | null, error: { message } }; }
  },
  async values(option_id: string) {
    try { const data = await store2.dispatch(productOptionsApi.endpoints.listOptionValues.initiate({ option_id })).unwrap(); return { data: data as ProductOptionValue[], error: null as null }; }
    catch (e) { const { message } = nErr(e); return { data: null as ProductOptionValue[] | null, error: { message } }; }
  },
  async upsertOption(body: UpsertOptionBody) {
    try {
      if (body.id) {
        const data = await store2.dispatch(productOptionsApi.endpoints.updateOption.initiate({ id: body.id, patch: body })).unwrap();
        return { data: data as ProductOption, error: null as null };
      }
      const created = await store2.dispatch(productOptionsApi.endpoints.createOption.initiate(body as Omit<UpsertOptionBody, "id">)).unwrap();
      return { data: created as ProductOption, error: null as null };
    } catch (e) { const { message } = nErr(e); return { data: null as ProductOption | null, error: { message } }; }
  },
  async upsertValue(body: UpsertValueBody) {
    try {
      if (body.id) {
        const data = await store2.dispatch(productOptionsApi.endpoints.updateOptionValue.initiate({ id: body.id, patch: body })).unwrap();
        return { data: data as ProductOptionValue, error: null as null };
      }
      const created = await store2.dispatch(productOptionsApi.endpoints.createOptionValue.initiate(body as Omit<UpsertValueBody, "id">)).unwrap();
      return { data: created as ProductOptionValue, error: null as null };
    } catch (e) { const { message } = nErr(e); return { data: null as ProductOptionValue | null, error: { message } }; }
  },
  async removeOption(id: string, product_id: string) {
    try { await store2.dispatch(productOptionsApi.endpoints.deleteOption.initiate({ id, product_id })).unwrap(); return { data: { success: true } as const, error: null as null }; }
    catch (e) { const { message } = nErr(e); return { data: null, error: { message } }; }
  },
  async removeValue(id: string, option_id: string) {
    try { await store2.dispatch(productOptionsApi.endpoints.deleteOptionValue.initiate({ id, option_id })).unwrap(); return { data: { success: true } as const, error: null as null }; }
    catch (e) { const { message } = nErr(e); return { data: null, error: { message } }; }
  },
};
