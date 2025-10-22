
// -------------------------------------------------------------
// FILE: src/integrations/metahub/hooks/admin/useInventoryAdmin.ts
// -------------------------------------------------------------
import { useMemo, useState } from "react";
import { metahub as m } from "@/integrations/metahub/client";
import type { OptionGroup, Variant, StockItem, OptionGroupsListParams, VariantsListParams, StockListParams } from "@/integrations/metahub/client/admin/inventory";
import { notifySuccess as ok, notifyError as fail } from "@/integrations/metahub/ui/toast/helpers";

// OPTION GROUPS
export function useOptionGroups(product_id: string) {
  const { data, isLoading, error, refetch } = m.api.useListOptionGroupsAdminQuery({ product_id });
  return { list: (data ?? []) as OptionGroup[], isLoading, error, refetch };
}

export function useOptionGroupMutations() {
  const [createMut] = m.api.useCreateOptionGroupAdminMutation();
  const [updateMut] = m.api.useUpdateOptionGroupAdminMutation();
  const [deleteMut] = m.api.useDeleteOptionGroupAdminMutation();

  const create = async (body: Omit<OptionGroup, "id" | "created_at" | "updated_at">) => { try { await createMut(body).unwrap(); ok("Seçenek grubu oluşturuldu"); return { ok: true as const }; } catch { fail("Seçenek grubu oluşturulamadı"); return { ok: false as const }; } };
  const update = async (id: string, body: Partial<Omit<OptionGroup, "id" | "product_id" | "created_at" | "updated_at">>) => { try { await updateMut({ id, body }).unwrap(); ok("Seçenek grubu güncellendi"); return { ok: true as const }; } catch { fail("Seçenek grubu güncellenemedi"); return { ok: false as const }; } };
  const remove = async (id: string, product_id: string) => { try { await deleteMut({ id, product_id }).unwrap(); ok("Seçenek grubu silindi"); return { ok: true as const }; } catch { fail("Seçenek grubu silinemedi"); return { ok: false as const }; } };

  return { create, update, remove };
}

// VARIANTS
export function useVariants(product_id: string, is_active?: boolean) {
  const { data, isLoading, error, refetch } = m.api.useListVariantsAdminQuery({ product_id, is_active });
  return { list: (data ?? []) as Variant[], isLoading, error, refetch };
}

export function useVariantMutations() {
  const [createMut] = m.api.useCreateVariantAdminMutation();
  const [updateMut] = m.api.useUpdateVariantAdminMutation();
  const [deleteMut] = m.api.useDeleteVariantAdminMutation();

  const create = async (body: Omit<Variant, "id" | "created_at" | "updated_at">) => { try { await createMut(body).unwrap(); ok("Varyant oluşturuldu"); return { ok: true as const }; } catch { fail("Varyant oluşturulamadı"); return { ok: false as const }; } };
  const update = async (id: string, body: Partial<Omit<Variant, "id" | "product_id" | "created_at" | "updated_at">>) => { try { await updateMut({ id, body }).unwrap(); ok("Varyant güncellendi"); return { ok: true as const }; } catch { fail("Varyant güncellenemedi"); return { ok: false as const }; } };
  const remove = async (id: string, product_id: string) => { try { await deleteMut({ id, product_id }).unwrap(); ok("Varyant silindi"); return { ok: true as const }; } catch { fail("Varyant silinemedi"); return { ok: false as const }; } };

  return { create, update, remove };
}

// STOCK
export function useStock(initial: StockListParams = { limit: 100, offset: 0, sort: "updated_at", order: "desc" }) {
  const [params, setParams] = useState<StockListParams>(initial);
  const dq = m.useDebouncedValue(params.q ?? "", 300);
  const merged = useMemo(() => ({ ...params, q: dq || undefined }), [params, dq]);
  const { data, isLoading, error, refetch } = m.api.useListStockAdminQuery(merged);
  const setPage = (page: number, size = params.limit ?? 100) => setParams((p) => ({ ...p, limit: size, offset: page * size }));
  const setFilter = (patch: Partial<StockListParams>) => setParams((p) => ({ ...p, ...patch }));
  return { list: (data ?? []) as StockItem[], isLoading, error, refetch, params, setPage, setFilter };
}

export function useStockMutations() {
  const [adjustMut] = m.api.useAdjustStockAdminMutation();
  const adjust = async (body: { sku?: string; variant_id?: string; product_id?: string; delta: number; reason?: string }) => {
    try { await adjustMut(body).unwrap(); ok("Stok güncellendi"); return { ok: true as const }; }
    catch { fail("Stok güncellenemedi"); return { ok: false as const }; }
  };
  return { adjust };
}