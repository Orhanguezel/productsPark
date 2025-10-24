// =============================================================
// FILE: src/integrations/metahub/client/coupons/client.ts
// =============================================================
import { store as store3 } from "@/store";
import { normalizeError as normalizeError3 } from "@/integrations/metahub/core/errors";
import { couponsApi, type Coupon } from "@/integrations/metahub/rtk/endpoints/coupons.endpoints";

export type { Coupon };

export const coupons = {
  async list(params?: Parameters<typeof couponsApi.endpoints.listCoupons.initiate>[0]) {
    try {
      const data = await store3
        .dispatch(couponsApi.endpoints.listCoupons.initiate(params ?? {}))
        .unwrap();
      return { data: data as Coupon[], error: null as null };
    } catch (e) {
      const { message } = normalizeError3(e);
      return { data: null as Coupon[] | null, error: { message } };
    }
  },

  async getByCode(code: string) {
    try {
      const data = await store3
        .dispatch(couponsApi.endpoints.getCouponByCode.initiate(code))
        .unwrap();
      return { data: data as Coupon | null, error: null as null };
    } catch (e) {
      const { message } = normalizeError3(e);
      return { data: null as Coupon | null, error: { message } };
    }
  },

  async getById(id: string) {
    try {
      const data = await store3
        .dispatch(couponsApi.endpoints.getCouponById.initiate(id))
        .unwrap();
      return { data: data as Coupon, error: null as null };
    } catch (e) {
      const { message } = normalizeError3(e);
      return { data: null as Coupon | null, error: { message } };
    }
  },
};
