

// -------------------------------------------------------------
// FILE: src/integrations/metahub/hooks/admin/useCmsAdmin.ts
// -------------------------------------------------------------
import { useCallback, useMemo, useState } from "react";
import { metahub } from "@/integrations/metahub/client";
import type { Page, PageListParams, CreatePageBody, UpdatePageBody, Block, BlockListParams, CreateBlockBody, UpdateBlockBody, Menu, MenuItem, CreateMenuBody, UpdateMenuBody, Redirect, RedirectListParams, CreateRedirectBody, UpdateRedirectBody } from "@/integrations/metahub/client/admin/cms";
import { notifyError, notifySuccess } from "@/integrations/metahub/ui/toast/helpers";

// ---- PAGES ----
export function useCmsPagesAdmin(initial: PageListParams = { limit: 20, offset: 0, sort: "updated_at", order: "desc" }) {
  const [params, setParams] = useState<PageListParams>(initial);
  const q = metahub.useDebouncedValue(params.q ?? "", 300);
  const merged = useMemo(() => ({ ...params, q: q || undefined }), [params, q]);
  const { data, isLoading, error, refetch } = metahub.api.useListPagesAdminQuery(merged);
  const setPage = (page: number, size = params.limit ?? 20) => setParams((p) => ({ ...p, limit: size, offset: page * size }));
  const setSort = (sort: NonNullable<PageListParams["sort"]>, order: NonNullable<PageListParams["order"]>) => setParams((p) => ({ ...p, sort, order }));
  const setFilter = (patch: Partial<PageListParams>) => setParams((p) => ({ ...p, ...patch }));
  return { list: (data ?? []) as Page[], isLoading, error, refetch, params, setPage, setSort, setFilter };
}

export function useCmsPageDetail(idOrSlug: { id?: string; slug?: string }) {
  const byId = !!idOrSlug.id;
  const bySlug = !!idOrSlug.slug;
  const { data: byIdData, isLoading: l1 } = metahub.api.useGetPageAdminByIdQuery(idOrSlug.id as string, { skip: !byId });
  const { data: bySlugData, isLoading: l2 } = metahub.api.useGetPageAdminBySlugQuery(idOrSlug.slug as string, { skip: !bySlug });
  const item = (byId ? byIdData : bySlugData) ?? null;
  return { item: item as Page | null, isLoading: l1 || l2 };
}

export function useCmsPageMutations() {
  const [createMut] = metahub.api.useCreatePageAdminMutation();
  const [updateMut] = metahub.api.useUpdatePageAdminMutation();
  const [deleteMut] = metahub.api.useDeletePageAdminMutation();
  const [publishMut] = metahub.api.usePublishPageAdminMutation();
  const [unpublishMut] = metahub.api.useUnpublishPageAdminMutation();
  const [duplicateMut] = metahub.api.useDuplicatePageAdminMutation();

  const createPage = useCallback(async (body: CreatePageBody) => { try { const r = await createMut(body).unwrap(); notifySuccess("Sayfa oluşturuldu"); return { ok: true as const, id: r.id }; } catch (e) { notifyError("Sayfa oluşturulamadı", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; } }, [createMut]);
  const updatePage = useCallback(async (id: string, body: UpdatePageBody) => { try { await updateMut({ id, body }).unwrap(); notifySuccess("Sayfa güncellendi"); return { ok: true as const }; } catch (e) { notifyError("Güncelleme başarısız", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; } }, [updateMut]);
  const deletePage = useCallback(async (id: string) => { try { await deleteMut(id).unwrap(); notifySuccess("Sayfa silindi"); return { ok: true as const }; } catch (e) { notifyError("Silme başarısız", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; } }, [deleteMut]);
  const publishPage = useCallback(async (id: string) => { try { await publishMut(id).unwrap(); notifySuccess("Yayınlandı"); return { ok: true as const }; } catch (e) { notifyError("Yayınlama başarısız", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; } }, [publishMut]);
  const unpublishPage = useCallback(async (id: string) => { try { await unpublishMut(id).unwrap(); notifySuccess("Yayından alındı"); return { ok: true as const }; } catch (e) { notifyError("İşlem başarısız", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; } }, [unpublishMut]);
  const duplicatePage = useCallback(async (id: string) => { try { const r = await duplicateMut(id).unwrap(); notifySuccess("Kopya oluşturuldu"); return { ok: true as const, id: r.id }; } catch (e) { notifyError("Kopyalama başarısız", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; } }, [duplicateMut]);

  return { createPage, updatePage, deletePage, publishPage, unpublishPage, duplicatePage };
}

// ---- BLOCKS ----
export function useCmsBlocksAdmin(initial: BlockListParams = { limit: 20, offset: 0, sort: "updated_at", order: "desc" }) {
  const [params, setParams] = useState<BlockListParams>(initial);
  const q = metahub.useDebouncedValue(params.q ?? "", 300);
  const merged = useMemo(() => ({ ...params, q: q || undefined }), [params, q]);
  const { data, isLoading, error, refetch } = metahub.api.useListBlocksAdminQuery(merged);
  const setPage = (page: number, size = params.limit ?? 20) => setParams((p) => ({ ...p, limit: size, offset: page * size }));
  const setFilter = (patch: Partial<BlockListParams>) => setParams((p) => ({ ...p, ...patch }));
  return { list: (data ?? []) as Block[], isLoading, error, refetch, params, setPage, setFilter };
}

export function useCmsBlockMutations() {
  const [createMut] = metahub.api.useCreateBlockAdminMutation();
  const [updateMut] = metahub.api.useUpdateBlockAdminMutation();
  const [deleteMut] = metahub.api.useDeleteBlockAdminMutation();
  const createBlock = useCallback(async (body: CreateBlockBody) => { try { const r = await createMut(body).unwrap(); notifySuccess("Blok eklendi"); return { ok: true as const, id: r.id }; } catch (e) { notifyError("Blok eklenemedi", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; } }, [createMut]);
  const updateBlock = useCallback(async (id: string, body: UpdateBlockBody) => { try { await updateMut({ id, body }).unwrap(); notifySuccess("Blok güncellendi"); return { ok: true as const }; } catch (e) { notifyError("Güncelleme başarısız", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; } }, [updateMut]);
  const deleteBlock = useCallback(async (id: string) => { try { await deleteMut(id).unwrap(); notifySuccess("Blok silindi"); return { ok: true as const }; } catch (e) { notifyError("Silme başarısız", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; } }, [deleteMut]);
  return { createBlock, updateBlock, deleteBlock };
}

// ---- MENUS ----
export function useCmsMenusAdmin(initialQ = "") {
  const [q, setQ] = useState<string>(initialQ);
  const dq = metahub.useDebouncedValue(q, 300);
  const { data, isLoading, error, refetch } = metahub.api.useListMenusAdminQuery({ q: dq || undefined });
  return { list: (data ?? []) as Menu[], isLoading, error, refetch, q, setQ };
}

export function useCmsMenuDetail(id: string | null) {
  const skip = !id;
  const { data, isLoading, error, refetch } = metahub.api.useGetMenuAdminByIdQuery(id as string, { skip });
  return { item: (data ?? null) as Menu | null, isLoading, error, refetch };
}

export function useCmsMenuMutations() {
  const [createMut] = metahub.api.useCreateMenuAdminMutation();
  const [updateMut] = metahub.api.useUpdateMenuAdminMutation();
  const [updateItemsMut] = metahub.api.useUpdateMenuItemsAdminMutation();
  const [deleteMut] = metahub.api.useDeleteMenuAdminMutation();
  const createMenu = useCallback(async (body: CreateMenuBody) => { try { const r = await createMut(body).unwrap(); notifySuccess("Menü oluşturuldu"); return { ok: true as const, id: r.id }; } catch (e) { notifyError("Oluşturma başarısız", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; } }, [createMut]);
  const updateMenu = useCallback(async (id: string, body: UpdateMenuBody) => { try { await updateMut({ id, body }).unwrap(); notifySuccess("Menü güncellendi"); return { ok: true as const }; } catch (e) { notifyError("Güncellenemedi", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; } }, [updateMut]);
  const updateMenuItems = useCallback(async (id: string, items: MenuItem[]) => { try { await updateItemsMut({ id, items }).unwrap(); notifySuccess("Menü öğeleri kaydedildi"); return { ok: true as const }; } catch (e) { notifyError("Öğeler kaydedilemedi", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; } }, [updateItemsMut]);
  const deleteMenu = useCallback(async (id: string) => { try { await deleteMut(id).unwrap(); notifySuccess("Menü silindi"); return { ok: true as const }; } catch (e) { notifyError("Silme başarısız", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; } }, [deleteMut]);
  return { createMenu, updateMenu, updateMenuItems, deleteMenu };
}

// ---- REDIRECTS ----
export function useCmsRedirectsAdmin(initial: RedirectListParams = { limit: 20, offset: 0, sort: "created_at", order: "desc" }) {
  const [params, setParams] = useState<RedirectListParams>(initial);
  const q = metahub.useDebouncedValue(params.q ?? "", 300);
  const merged = useMemo(() => ({ ...params, q: q || undefined }), [params, q]);
  const { data, isLoading, error, refetch } = metahub.api.useListRedirectsAdminQuery(merged);
  const setPage = (page: number, size = params.limit ?? 20) => setParams((p) => ({ ...p, limit: size, offset: page * size }));
  const setFilter = (patch: Partial<RedirectListParams>) => setParams((p) => ({ ...p, ...patch }));
  return { list: (data ?? []) as Redirect[], isLoading, error, refetch, params, setPage, setFilter };
}

export function useCmsRedirectMutations() {
  const [createMut] = metahub.api.useCreateRedirectAdminMutation();
  const [updateMut] = metahub.api.useUpdateRedirectAdminMutation();
  const [deleteMut] = metahub.api.useDeleteRedirectAdminMutation();
  const [importMut] = metahub.api.useImportRedirectsAdminMutation();
  const [exportMut] = metahub.api.useExportRedirectsAdminMutation();

  const createRedirect = useCallback(async (body: CreateRedirectBody) => { try { const r = await createMut(body).unwrap(); notifySuccess("Yönlendirme eklendi"); return { ok: true as const, id: r.id }; } catch (e) { notifyError("Ekleme başarısız", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; } }, [createMut]);
  const updateRedirect = useCallback(async (id: string, body: UpdateRedirectBody) => { try { await updateMut({ id, body }).unwrap(); notifySuccess("Güncellendi"); return { ok: true as const }; } catch (e) { notifyError("Güncellenemedi", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; } }, [updateMut]);
  const deleteRedirect = useCallback(async (id: string) => { try { await deleteMut(id).unwrap(); notifySuccess("Silindi"); return { ok: true as const }; } catch (e) { notifyError("Silinemedi", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; } }, [deleteMut]);
  const importRedirects = useCallback(async (body: { items: ImportRedirectItem[] } | { csv: string }) => { try { const r = await importMut(body).unwrap(); notifySuccess(`${r.imported} kayıt içe aktarıldı`); return { ok: true as const, imported: r.imported }; } catch (e) { notifyError("İçe aktarma başarısız", undefined, e instanceof Error ? e.message : String(e)); return { ok: false as const }; } }, [importMut]);
  const exportRedirects = useCallback(async (params?: RedirectListParams) => { try { const r = await exportMut(params).unwrap(); notifySuccess("Dışa aktarma hazır"); return r; } catch (e) { notifyError("Dışa aktarma başarısız", undefined, e instanceof Error ? e.message : String(e)); return null; } }, [exportMut]);

  return { createRedirect, updateRedirect, deleteRedirect, importRedirects, exportRedirects };
}