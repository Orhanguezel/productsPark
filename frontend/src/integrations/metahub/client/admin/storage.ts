import { store } from "@/store";
import { storageAdminApi, type StorageAsset, type StorageListParams } from "@/integrations/metahub/rtk/endpoints/admin/storage_admin.endpoints";
import { normalizeError } from "@/integrations/metahub/core/errors";

export const storageAdmin = {
  async list(params?: StorageListParams) {
    try { const d = await store.dispatch(storageAdminApi.endpoints.listStorageAssetsAdmin.initiate(params)).unwrap(); return { data: d as StorageAsset[], error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as StorageAsset[] | null, error: { message } }; }
  },
  async get(id: string) {
    try { const d = await store.dispatch(storageAdminApi.endpoints.getStorageAssetAdmin.initiate(id)).unwrap(); return { data: d as StorageAsset, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as StorageAsset | null, error: { message } }; }
  },
  async upload(file: File, bucket?: string, folder?: string | null, metadata?: Record<string,string> | null) {
    try { const d = await store.dispatch(storageAdminApi.endpoints.uploadStorageAssetAdmin.initiate({ file, bucket, folder: folder ?? null, metadata: metadata ?? null })).unwrap(); return { data: d as StorageAsset, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as StorageAsset | null, error: { message } }; }
  },
  async update(id: string, body: { name?: string; folder?: string | null; metadata?: Record<string,string> | null }) {
    try { const d = await store.dispatch(storageAdminApi.endpoints.updateStorageAssetAdmin.initiate({ id, body })).unwrap(); return { data: d as StorageAsset, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as StorageAsset | null, error: { message } }; }
  },
  async remove(id: string) {
    try { await store.dispatch(storageAdminApi.endpoints.deleteStorageAssetAdmin.initiate(id)).unwrap(); return { ok: true as const }; }
    catch (e) { const { message } = normalizeError(e); return { ok: false as const, error: { message } } as const; }
  },
  async bulkRemove(ids: string[]) {
    try { const d = await store.dispatch(storageAdminApi.endpoints.bulkDeleteStorageAssetsAdmin.initiate({ ids })).unwrap(); return { data: d as { deleted: number }, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as { deleted: number } | null, error: { message } }; }
  },
};

export type { StorageAsset, StorageListParams };
