
// -------------------------------------------------------------
// FILE: src/integrations/metahub/client/admin/inventory.ts (Facade)
// -------------------------------------------------------------
import { store as store2 } from "@/store";
import { normalizeError as nx } from "@/integrations/metahub/core/errors";
import { optionsAdminApi, type OptionGroup, type Variant, type OptionGroupsListParams, type VariantsListParams, type UpsertOptionGroupBody, type PatchOptionGroupBody, type UpsertVariantBody, type PatchVariantBody } from "@/integrations/metahub/rtk/endpoints/admin/options_admin.endpoints";
import { stockAdminApi, type StockItem, type StockListParams, type AdjustStockBody } from "@/integrations/metahub/rtk/endpoints/admin/stock_admin.endpoints";

export const inventoryAdmin = {
  // OPTION GROUPS
  async listOptionGroups(params: OptionGroupsListParams) { try { const d = await store2.dispatch(optionsAdminApi.endpoints.listOptionGroupsAdmin.initiate(params)).unwrap(); return { data: d as OptionGroup[], error: null as null }; } catch (e) { const { message } = nx(e); return { data: null as OptionGroup[] | null, error: { message } }; } },
  async createOptionGroup(body: UpsertOptionGroupBody) { try { const d = await store2.dispatch(optionsAdminApi.endpoints.createOptionGroupAdmin.initiate(body)).unwrap(); return { data: d as OptionGroup, error: null as null }; } catch (e) { const { message } = nx(e); return { data: null as OptionGroup | null, error: { message } }; } },
  async updateOptionGroup(id: string, body: PatchOptionGroupBody) { try { const d = await store2.dispatch(optionsAdminApi.endpoints.updateOptionGroupAdmin.initiate({ id, body })).unwrap(); return { data: d as OptionGroup, error: null as null }; } catch (e) { const { message } = nx(e); return { data: null as OptionGroup | null, error: { message } }; } },
  async deleteOptionGroup(id: string, product_id: string) { try { await store2.dispatch(optionsAdminApi.endpoints.deleteOptionGroupAdmin.initiate({ id, product_id })).unwrap(); return { ok: true as const }; } catch (e) { const { message } = nx(e); return { ok: false as const, error: { message } } as const; } },

  // VARIANTS
  async listVariants(params: VariantsListParams) { try { const d = await store2.dispatch(optionsAdminApi.endpoints.listVariantsAdmin.initiate(params)).unwrap(); return { data: d as Variant[], error: null as null }; } catch (e) { const { message } = nx(e); return { data: null as Variant[] | null, error: { message } }; } },
  async createVariant(body: UpsertVariantBody) { try { const d = await store2.dispatch(optionsAdminApi.endpoints.createVariantAdmin.initiate(body)).unwrap(); return { data: d as Variant, error: null as null }; } catch (e) { const { message } = nx(e); return { data: null as Variant | null, error: { message } }; } },
  async updateVariant(id: string, body: PatchVariantBody) { try { const d = await store2.dispatch(optionsAdminApi.endpoints.updateVariantAdmin.initiate({ id, body })).unwrap(); return { data: d as Variant, error: null as null }; } catch (e) { const { message } = nx(e); return { data: null as Variant | null, error: { message } }; } },
  async deleteVariant(id: string, product_id: string) { try { await store2.dispatch(optionsAdminApi.endpoints.deleteVariantAdmin.initiate({ id, product_id })).unwrap(); return { ok: true as const }; } catch (e) { const { message } = nx(e); return { ok: false as const, error: { message } } as const; } },

  // STOCK
  async listStock(params?: StockListParams) { try { const d = await store2.dispatch(stockAdminApi.endpoints.listStockAdmin.initiate(params)).unwrap(); return { data: d as StockItem[], error: null as null }; } catch (e) { const { message } = nx(e); return { data: null as StockItem[] | null, error: { message } }; } },
  async adjustStock(body: AdjustStockBody) { try { const d = await store2.dispatch(stockAdminApi.endpoints.adjustStockAdmin.initiate(body)).unwrap(); return { data: d as StockItem, error: null as null }; } catch (e) { const { message } = nx(e); return { data: null as StockItem | null, error: { message } }; } },
};

export type { OptionGroup, Variant, StockItem, StockListParams };