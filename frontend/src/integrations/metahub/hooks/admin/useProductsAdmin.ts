
// -------------------------------------------------------------
// FILE: src/integrations/metahub/hooks/admin/useProductsAdmin.ts
// -------------------------------------------------------------
import { useCallback, useMemo, useState } from "react";
import { metahub } from "@/integrations/metahub/client";
import type { Product, ListParams, UpsertProductBody } from "@/integrations/metahub/client/admin/products";
import { notifyError, notifySuccess } from "@/integrations/metahub/ui/toast/helpers";

export function useProductsAdmin(initial: ListParams = { limit: 20, offset: 0, sort: "display_order", order: "asc" }) {
  const [params, setParams] = useState<ListParams>(initial);
  const q = metahub.useDebouncedValue(params.q ?? "", 300);

  const merged = useMemo(() => ({ ...params, q: q || undefined }), [params, q]);
  const { data, isLoading, error, refetch } = metahub.api.useListProductsAdminQuery(merged);

  const setPage = (page: number, size = params.limit ?? 20) => setParams((p) => ({ ...p, limit: size, offset: page * size }));
  const setSort = (sort: NonNullable<ListParams["sort"]>, order: NonNullable<ListParams["order"]>) => setParams((p) => ({ ...p, sort, order }));
  const setFilter = (patch: Partial<ListParams>) => setParams((p) => ({ ...p, ...patch }));

  return { list: data ?? [], isLoading, error, refetch, params, setPage, setSort, setFilter };
}

export function usePersistProduct() {
  const [createP] = metahub.api.useCreateProductAdminMutation();
  const [updateP] = metahub.api.useUpdateProductAdminMutation();

  const save = useCallback(async (payload: { id?: string } & UpsertProductBody) => {
    try {
      if (payload.id) {
        const { id, ...body } = payload;
        const res = await updateP({ id, body }).unwrap();
        notifySuccess("Ürün güncellendi");
        return { ok: true as const, data: res };
      } else {
        const res = await createP(payload).unwrap();
        notifySuccess("Ürün oluşturuldu");
        return { ok: true as const, data: res };
      }
    } catch (e: unknown) {
      notifyError("Ürün kaydedilemedi", undefined, e instanceof Error ? e.message : String(e));
      return { ok: false as const };
    }
  }, [createP, updateP]);

  return { save };
}

export function useDeleteProduct() {
  const [deleteP] = metahub.api.useDeleteProductAdminMutation();
  const remove = useCallback(async (id: string) => {
    try { await deleteP(id).unwrap(); notifySuccess("Ürün silindi"); return { ok: true as const }; }
    catch (e) { notifyError("Ürün silinemedi", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [deleteP]);
  return { remove };
}

export function useReorderProducts() {
  const [reorder] = metahub.api.useReorderProductsAdminMutation();
  const apply = useCallback(async (items: Array<{ id: string; display_order: number }>) => {
    try { await reorder(items).unwrap(); notifySuccess("Sıralama güncellendi"); return { ok: true as const }; }
    catch (e) { notifyError("Sıralama güncellenemedi", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [reorder]);
  return { apply };
}

export function useToggleProductFlags() {
  const [toggleActive] = metahub.api.useToggleActiveProductAdminMutation();
  const [toggleHome] = metahub.api.useToggleHomepageProductAdminMutation();

  const setActive = useCallback(async (id: string, is_active: boolean) => {
    try { await toggleActive({ id, is_active }).unwrap(); notifySuccess("Aktiflik güncellendi"); return { ok: true as const }; }
    catch (e) { notifyError("Aktiflik güncellenemedi", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [toggleActive]);

  const setHomepage = useCallback(async (id: string, show_on_homepage: boolean) => {
    try { await toggleHome({ id, show_on_homepage }).unwrap(); notifySuccess("Anasayfa durumu güncellendi"); return { ok: true as const }; }
    catch (e) { notifyError("Anasayfa durumu güncellenemedi", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [toggleHome]);

  return { setActive, setHomepage };
}

export function useProductRelations(productId: string) {
  const [attachVar] = metahub.api.useAttachVariantToProductAdminMutation();
  const [detachVar] = metahub.api.useDetachVariantFromProductAdminMutation();
  const [attachOpt] = metahub.api.useAttachOptionToProductAdminMutation();
  const [detachOpt] = metahub.api.useDetachOptionFromProductAdminMutation();

  const attachVariant = useCallback(async (variant_id: string) => {
    try { await attachVar({ product_id: productId, variant_id }).unwrap(); notifySuccess("Varyant eklendi"); return { ok: true as const }; }
    catch (e) { notifyError("Varyant eklenemedi", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [productId, attachVar]);

  const detachVariant = useCallback(async (variant_id: string) => {
    try { await detachVar({ product_id: productId, variant_id }).unwrap(); notifySuccess("Varyant çıkarıldı"); return { ok: true as const }; }
    catch (e) { notifyError("Varyant çıkarılamadı", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [productId, detachVar]);

  const attachOption = useCallback(async (option_id: string) => {
    try { await attachOpt({ product_id: productId, option_id }).unwrap(); notifySuccess("Opsiyon eklendi"); return { ok: true as const }; }
    catch (e) { notifyError("Opsiyon eklenemedi", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [productId, attachOpt]);

  const detachOption = useCallback(async (option_id: string) => {
    try { await detachOpt({ product_id: productId, option_id }).unwrap(); notifySuccess("Opsiyon çıkarıldı"); return { ok: true as const }; }
    catch (e) { notifyError("Opsiyon çıkarılamadı", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; }
  }, [productId, detachOpt]);

  return { attachVariant, detachVariant, attachOption, detachOption };
}


/*


// -------------------------------------------------------------
// FILE: src/integrations/metahub/hooks/admin/useProductsAdmin.ts
// -------------------------------------------------------------
import { useMemo, useState } from "react";
import { metahub } from "@/integrations/metahub/client";
import type { ProductAdmin, ProductsAdminListParams } from "@/integrations/metahub/client/admin/products";
import { notifySuccess, notifyError } from "@/integrations/metahub/ui/toast/helpers";

export function useProductsAdmin(initial: ProductsAdminListParams = { limit: 50, offset: 0, sort: "created_at", order: "desc" }) {
  const [params, setParams] = useState<ProductsAdminListParams>(initial);
  const dq = metahub.useDebouncedValue(params.q ?? "", 300);
  const merged = useMemo(() => ({ ...params, q: dq || undefined }), [params, dq]);
  const { data, isLoading, error, refetch } = metahub.api.useListProductsAdminQuery(merged);
  const setPage = (page: number, size = params.limit ?? 50) => setParams((p) => ({ ...p, limit: size, offset: page * size }));
  const setFilter = (patch: Partial<ProductsAdminListParams>) => setParams((p) => ({ ...p, ...patch }));
  return { list: (data ?? []) as ProductAdmin[], isLoading, error, refetch, params, setPage, setFilter };
}

export function useProductDetail(id: string | null) {
  const skip = !id; const { data, isLoading, refetch } = metahub.api.useGetProductAdminQuery(id as string, { skip });
  return { item: (data ?? null) as ProductAdmin | null, isLoading, refetch };
}

export function useProductMutations() {
  const [createMut] = metahub.api.useCreateProductAdminMutation();
  const [updateMut] = metahub.api.useUpdateProductAdminMutation();
  const [deleteMut] = metahub.api.useDeleteProductAdminMutation();
  const [bulkActiveMut] = metahub.api.useBulkSetActiveAdminMutation();

  const create = async (body: Omit<ProductAdmin, "id" | "created_at" | "updated_at" | "rating" | "review_count">) => {
    try { await createMut(body).unwrap(); notifySuccess("Ürün oluşturuldu"); return { ok: true as const }; }
    catch { notifyError("Ürün oluşturulamadı"); return { ok: false as const }; }
  };
  const update = async (id: string, body: Partial<Omit<ProductAdmin, "id" | "created_at" | "updated_at" | "rating" | "review_count">>) => {
    try { await updateMut({ id, body }).unwrap(); notifySuccess("Ürün güncellendi"); return { ok: true as const }; }
    catch { notifyError("Ürün güncellenemedi"); return { ok: false as const }; }
  };
  const remove = async (id: string) => { try { await deleteMut(id).unwrap(); notifySuccess("Ürün silindi"); return { ok: true as const }; } catch { notifyError("Ürün silinemedi"); return { ok: false as const }; } };
  const bulkSetActive = async (ids: string[], is_active: boolean) => { try { await bulkActiveMut({ ids, is_active }).unwrap(); notifySuccess("Durum güncellendi"); return { ok: true as const }; } catch { notifyError("Durum güncellenemedi"); return { ok: false as const }; } };

  return { create, update, remove, bulkSetActive };
}

*/
