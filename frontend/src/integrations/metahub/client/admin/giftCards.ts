
// -------------------------------------------------------------
// FILE: src/integrations/metahub/client/admin/giftCards.ts (Facade)
// -------------------------------------------------------------
import { store } from "@/store";
import { normalizeError } from "@/integrations/metahub/core/errors";
import {
  giftCardsAdminApi,
  type GiftCard,
  type GiftCardHistory,
  type ListParams,
  type CreateGiftCardBody,
  type RedeemGiftCardBody,
} from "@/integrations/metahub/rtk/endpoints/admin/gift_cards_admin.endpoints";

export const giftCardsAdmin = {
  async list(params?: ListParams) {
    try { const data = await store.dispatch(giftCardsAdminApi.endpoints.listGiftCardsAdmin.initiate(params)).unwrap(); return { data: data as GiftCard[], error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as GiftCard[] | null, error: { message } }; }
  },
  async getById(id: string) {
    try { const data = await store.dispatch(giftCardsAdminApi.endpoints.getGiftCardAdminById.initiate(id)).unwrap(); return { data: data as GiftCard, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as GiftCard | null, error: { message } }; }
  },
  async create(body: CreateGiftCardBody) {
    try { const data = await store.dispatch(giftCardsAdminApi.endpoints.createGiftCardAdmin.initiate(body)).unwrap(); return { data: data as GiftCard, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as GiftCard | null, error: { message } }; }
  },
  async activate(id: string) {
    try { const data = await store.dispatch(giftCardsAdminApi.endpoints.activateGiftCardAdmin.initiate(id)).unwrap(); return { data: data as GiftCard, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as GiftCard | null, error: { message } }; }
  },
  async deactivate(id: string) {
    try { const data = await store.dispatch(giftCardsAdminApi.endpoints.deactivateGiftCardAdmin.initiate(id)).unwrap(); return { data: data as GiftCard, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as GiftCard | null, error: { message } }; }
  },
  async redeem(id: string, body: RedeemGiftCardBody) {
    try { const data = await store.dispatch(giftCardsAdminApi.endpoints.redeemGiftCardAdmin.initiate({ id, body })).unwrap(); return { data: data as GiftCard, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as GiftCard | null, error: { message } }; }
  },
  async history(id: string, limit?: number, offset?: number) {
    try { const data = await store.dispatch(giftCardsAdminApi.endpoints.listGiftCardHistoryAdmin.initiate({ id, limit, offset })).unwrap(); return { data: data as GiftCardHistory[], error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as GiftCardHistory[] | null, error: { message } }; }
  },
};

export type { GiftCard, GiftCardHistory, ListParams, CreateGiftCardBody, RedeemGiftCardBody };
