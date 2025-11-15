// ===================================================================
// FILE: src/modules/mail/router.ts
// ===================================================================

import type { FastifyInstance } from "fastify";
import { requireAuth } from "@/common/middleware/auth";
import {
  sendTestMail,
  sendMailHandler,
  sendOrderCreatedMailHandler,
} from "./controller";

const BASE = "/mail";

export async function registerMail(app: FastifyInstance) {
  // Test mail (örneğin sadece admin)
  app.post(`${BASE}/test`, { preHandler: [requireAuth] }, sendTestMail);

  // Genel mail gönderimi (örn: panelden kampanya, bilgilendirme vs)
  app.post(`${BASE}/send`, { preHandler: [requireAuth] }, sendMailHandler);

  // Sipariş oluşturma maili endpoint’i (order_received template'i ile)
  app.post(
    `${BASE}/order-created`,
    { preHandler: [requireAuth] },
    sendOrderCreatedMailHandler,
  );
}
