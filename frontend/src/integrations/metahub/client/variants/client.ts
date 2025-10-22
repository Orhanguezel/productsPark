
// -------------------------------------------------------------
// FILE: src/integrations/metahub/client/variants/client.ts (Facade)
// -------------------------------------------------------------
import { store } from "@/store";
import { normalizeError } from "@/integrations/metahub/core/errors";
import { productVariantsApi, type Variant, type UpsertVariantBody } from "@/integrations/metahub/rtk/endpoints/product_variants.endpoints";

export type { Variant, UpsertVariantBody };

export const variants = {
  async list(params?: Parameters<typeof productVariantsApi.endpoints.listProductVariants.initiate>[0]) {
    try { const data = await store.dispatch(productVariantsApi.endpoints.listProductVariants.initiate(params ?? {})).unwrap(); return { data: data as Variant[], error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as Variant[] | null, error: { message } }; }
  },
  async getById(id: string) {
    try { const data = await store.dispatch(productVariantsApi.endpoints.getVariantById.initiate(id)).unwrap(); return { data: data as Variant, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as Variant | null, error: { message } }; }
  },
  async upsert(body: UpsertVariantBody) {
    try {
      if (body.id) {
        const data = await store.dispatch(productVariantsApi.endpoints.updateVariant.initiate({ id: body.id, patch: body })).unwrap();
        return { data: data as Variant, error: null as null };
      }
      const created = await store.dispatch(productVariantsApi.endpoints.createVariant.initiate(body as Omit<UpsertVariantBody, "id">)).unwrap();
      return { data: created as Variant, error: null as null };
    } catch (e) {
      const { message } = normalizeError(e);
      return { data: null as Variant | null, error: { message } };
    }
  },
  async remove(id: string, product_id: string) {
    try { await store.dispatch(productVariantsApi.endpoints.deleteVariant.initiate({ id, product_id })).unwrap(); return { data: { success: true } as const, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null, error: { message } }; }
  },
};
