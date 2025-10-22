
// -------------------------------------------------------------
// FILE: src/integrations/metahub/client/admin/reviews.ts (Facade)
// -------------------------------------------------------------
import { store } from "@/store";
import { normalizeError } from "@/integrations/metahub/core/errors";
import {
  reviewsAdminApi,
  type Review,
  type ListParams,
  type ReplyBody,
} from "@/integrations/metahub/rtk/endpoints/admin/reviews_admin.endpoints";

export const reviewsAdmin = {
  async list(params?: ListParams) {
    try { const data = await store.dispatch(reviewsAdminApi.endpoints.listReviewsAdmin.initiate(params)).unwrap(); return { data: data as Review[], error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as Review[] | null, error: { message } }; }
  },
  async getById(id: string) {
    try { const data = await store.dispatch(reviewsAdminApi.endpoints.getReviewAdminById.initiate(id)).unwrap(); return { data: data as Review, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as Review | null, error: { message } }; }
  },
  async approve(id: string) {
    try { const data = await store.dispatch(reviewsAdminApi.endpoints.approveReviewAdmin.initiate(id)).unwrap(); return { data: data as Review, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as Review | null, error: { message } }; }
  },
  async reject(id: string, reason?: string | null) {
    try { const data = await store.dispatch(reviewsAdminApi.endpoints.rejectReviewAdmin.initiate({ id, reason })).unwrap(); return { data: data as Review, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as Review | null, error: { message } }; }
  },
  async setVisible(id: string, is_visible: boolean) {
    try { const data = await store.dispatch(reviewsAdminApi.endpoints.toggleVisibleReviewAdmin.initiate({ id, is_visible })).unwrap(); return { data: data as Review, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as Review | null, error: { message } }; }
  },
  async setPinned(id: string, is_pinned: boolean) {
    try { const data = await store.dispatch(reviewsAdminApi.endpoints.togglePinnedReviewAdmin.initiate({ id, is_pinned })).unwrap(); return { data: data as Review, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as Review | null, error: { message } }; }
  },
  async remove(id: string) {
    try { const data = await store.dispatch(reviewsAdminApi.endpoints.deleteReviewAdmin.initiate(id)).unwrap(); return { data, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as { ok: true } | null, error: { message } }; }
  },
  async reply(id: string, body: ReplyBody) {
    try { const data = await store.dispatch(reviewsAdminApi.endpoints.replyReviewAdmin.initiate({ id, body })).unwrap(); return { data, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as { ok: true } | null, error: { message } }; }
  },
};

export type { Review, ListParams, ReplyBody };
