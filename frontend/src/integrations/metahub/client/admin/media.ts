
// -------------------------------------------------------------
// FILE: src/integrations/metahub/client/admin/media.ts (Facade)
// -------------------------------------------------------------
import { store as store2 } from "@/store";
import { normalizeError as normalizeError2 } from "@/integrations/metahub/core/errors";
import { mediaAdminApi, type MediaAsset, type MediaListParams, type UpdateAssetBody, type MediaMeta, type SignedUrlResp } from "@/integrations/metahub/rtk/endpoints/admin/media_admin.endpoints";

export const mediaAdmin = {
  async list(params?: MediaListParams) { try { const d = await store2.dispatch(mediaAdminApi.endpoints.listMediaAssetsAdmin.initiate(params)).unwrap(); return { data: d as MediaAsset[], error: null as null }; } catch (e) { const { message } = normalizeError2(e); return { data: null as MediaAsset[] | null, error: { message } }; } },
  async get(id: string) { try { const d = await store2.dispatch(mediaAdminApi.endpoints.getMediaAssetAdmin.initiate(id)).unwrap(); return { data: d as MediaAsset, error: null as null }; } catch (e) { const { message } = normalizeError2(e); return { data: null as MediaAsset | null, error: { message } }; } },
  async upload(file: File, folder?: string | null, metadata?: MediaMeta) { try { const d = await store2.dispatch(mediaAdminApi.endpoints.uploadMediaAssetAdmin.initiate({ file, folder: folder ?? null, metadata })).unwrap(); return { data: d as MediaAsset, error: null as null }; } catch (e) { const { message } = normalizeError2(e); return { data: null as MediaAsset | null, error: { message } }; } },
  async update(id: string, body: UpdateAssetBody) { try { const d = await store2.dispatch(mediaAdminApi.endpoints.updateMediaAssetAdmin.initiate({ id, body })).unwrap(); return { data: d as MediaAsset, error: null as null }; } catch (e) { const { message } = normalizeError2(e); return { data: null as MediaAsset | null, error: { message } }; } },
  async remove(id: string) { try { await store2.dispatch(mediaAdminApi.endpoints.deleteMediaAssetAdmin.initiate(id)).unwrap(); return { ok: true as const }; } catch (e) { const { message } = normalizeError2(e); return { ok: false as const, error: { message } } as const; } },
  async bulkRemove(ids: string[]) { try { const d = await store2.dispatch(mediaAdminApi.endpoints.bulkDeleteMediaAssetsAdmin.initiate({ ids })).unwrap(); return { data: d as { deleted: number }, error: null as null }; } catch (e) { const { message } = normalizeError2(e); return { data: null as { deleted: number } | null, error: { message } }; } },
  async signedUrl(id: string, variant?: "original" | "thumb" | "webp") { try { const d = await store2.dispatch(mediaAdminApi.endpoints.getSignedUrlMediaAdmin.initiate({ id, variant })).unwrap(); return { data: d as SignedUrlResp, error: null as null }; } catch (e) { const { message } = normalizeError2(e); return { data: null as SignedUrlResp | null, error: { message } }; } },
};

export type { MediaAsset, MediaListParams, UpdateAssetBody };