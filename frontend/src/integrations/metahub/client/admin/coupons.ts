
// -------------------------------------------------------------
// FILE: src/integrations/metahub/client/admin/coupons.ts (Facade)
// -------------------------------------------------------------
import { store } from "@/store";
import { normalizeError } from "@/integrations/metahub/core/errors";
import {
  couponsAdminApi,
  type Coupon,
  type CouponListParams,
  type CreateCouponBody,
  type UpdateCouponBody,
  type CouponUsage,
  type CouponStats,
  type CouponsExportParams,
  type ExportResponse,
} from "@/integrations/metahub/rtk/endpoints/admin/coupons_admin.endpoints";

export const couponsAdmin = {
  async list(params?: CouponListParams) {
    try { const data = await store.dispatch(couponsAdminApi.endpoints.listCouponsAdmin.initiate(params)).unwrap(); return { data: data as Coupon[], error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as Coupon[] | null, error: { message } }; }
  },
  async getById(id: string) {
    try { const data = await store.dispatch(couponsAdminApi.endpoints.getCouponAdminById.initiate(id)).unwrap(); return { data: data as Coupon, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as Coupon | null, error: { message } }; }
  },
  async create(body: CreateCouponBody) {
    try { const data = await store.dispatch(couponsAdminApi.endpoints.createCouponAdmin.initiate(body)).unwrap(); return { data: data as Coupon, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as Coupon | null, error: { message } }; }
  },
  async update(id: string, body: UpdateCouponBody) {
    try { const data = await store.dispatch(couponsAdminApi.endpoints.updateCouponAdmin.initiate({ id, body })).unwrap(); return { data: data as Coupon, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as Coupon | null, error: { message } }; }
  },
  async toggle(id: string, active: boolean) {
    try { const data = await store.dispatch(couponsAdminApi.endpoints.toggleCouponAdmin.initiate({ id, active })).unwrap(); return { data: data as Coupon, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as Coupon | null, error: { message } }; }
  },
  async delete(id: string) {
    try { await store.dispatch(couponsAdminApi.endpoints.deleteCouponAdmin.initiate(id)).unwrap(); return { ok: true as const, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { ok: false as const, error: { message } }; }
  },
  async usage(id: string, limit?: number, offset?: number) {
    try { const data = await store.dispatch(couponsAdminApi.endpoints.listCouponUsageAdmin.initiate({ id, limit, offset })).unwrap(); return { data: data as CouponUsage[], error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as CouponUsage[] | null, error: { message } }; }
  },
  async stats(id: string) {
    try { const data = await store.dispatch(couponsAdminApi.endpoints.couponStatsAdmin.initiate(id)).unwrap(); return { data: data as CouponStats, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as CouponStats | null, error: { message } }; }
  },
  async export(params?: CouponsExportParams) {
    try { const data = await store.dispatch(couponsAdminApi.endpoints.exportCouponsAdmin.initiate(params)).unwrap(); return { data: data as ExportResponse, error: null as null }; }
    catch (e) { const { message } = normalizeError(e); return { data: null as ExportResponse | null, error: { message } }; }
  },
};

export type { Coupon, CouponListParams, CreateCouponBody, UpdateCouponBody, CouponUsage, CouponStats, CouponsExportParams, ExportResponse };

// -------------------------------------------------------------