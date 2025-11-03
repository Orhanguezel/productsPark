import type { FastifyInstance } from "fastify";
import { requireAuth } from "@/common/middleware/auth";
import {
  adminListCoupons,
  adminGetCoupon,
  adminCreateCoupon,
  adminUpdateCoupon,
  adminDeleteCoupon,
  adminToggleCoupon,
} from "./admin.controller";

export async function registerCouponsAdmin(app: FastifyInstance) {
  const base = "/admin/coupons";
  app.get(base,                    { preHandler: [requireAuth] }, adminListCoupons);
  app.get(`${base}/:id`,           { preHandler: [requireAuth] }, adminGetCoupon);
  app.post(base,                   { preHandler: [requireAuth] }, adminCreateCoupon);
  app.patch(`${base}/:id`,         { preHandler: [requireAuth] }, adminUpdateCoupon);
  app.post(`${base}/:id/:action`,  { preHandler: [requireAuth] }, adminToggleCoupon);
  app.delete(`${base}/:id`,        { preHandler: [requireAuth] }, adminDeleteCoupon);
}
