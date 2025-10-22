import type { FastifyInstance } from 'fastify';
import { requireAuth } from '@/common/middleware/auth';
import {
  listCoupons,
  getCoupon,
  getCouponByCode,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
  redeemCoupon,
} from './controller';

export async function registerCoupons(app: FastifyInstance) {
  // Yönetim / okuma
  app.get('/coupons', { preHandler: [requireAuth] }, listCoupons);
  app.get('/coupons/:id', { preHandler: [requireAuth] }, getCoupon);
  app.get('/coupons/by-code/:code', { preHandler: [requireAuth] }, getCouponByCode);

  // CRUD
  app.post('/coupons', { preHandler: [requireAuth] }, createCoupon);
  app.patch('/coupons/:id', { preHandler: [requireAuth] }, updateCoupon);
  app.delete('/coupons/:id', { preHandler: [requireAuth] }, deleteCoupon);

  // İşlevsel uçlar
  app.post('/coupons/validate', { preHandler: [requireAuth] }, validateCoupon);
  app.post('/coupons/redeem', { preHandler: [requireAuth] }, redeemCoupon);
}
