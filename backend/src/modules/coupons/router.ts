import type { FastifyInstance } from "fastify";
import { listCoupons, getCouponById, getCouponByCode } from "./controller";

export async function registerCoupons(app: FastifyInstance) {
  app.get("/coupons", listCoupons);
  app.get("/coupons/:id", getCouponById);
  app.get("/coupons/by-code/:code", getCouponByCode);
}
