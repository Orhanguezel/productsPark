// ===================================================================
// FILE: src/modules/mail/controller.ts
// FINAL — Controller sadece tetikler
// ===================================================================

import type { RouteHandler } from 'fastify';
import { sendMailSchema, orderCreatedMailSchema } from './validation';
import { sendMailRaw } from './service';
import { sendTemplatedEmail } from '@/modules/email-templates/mailer';

/**
 * Test mail
 * POST /mail/test
 */
export const sendTestMail: RouteHandler = async (req, reply) => {
  try {
    const body = (req.body ?? {}) as { to?: string };
    if (!body.to) {
      return reply.code(400).send({ message: 'to_required' });
    }

    await sendTemplatedEmail({
      to: body.to,
      key: 'smtp_test',
      params: {
        now: new Date().toLocaleString('tr-TR'),
      },
      allowMissing: true,
    });

    return reply.send({ ok: true });
  } catch (e: any) {
    req.log.error(e);
    return reply.code(500).send({ message: 'mail_test_failed' });
  }
};

/**
 * Generic send (admin panel)
 * POST /mail/send
 */
export const sendMailHandler: RouteHandler = async (req, reply) => {
  try {
    const body = sendMailSchema.parse(req.body ?? {});
    await sendMailRaw(body);
    return reply.code(201).send({ ok: true });
  } catch (e: any) {
    req.log.error(e);
    return reply.code(500).send({ message: 'mail_send_failed' });
  }
};

/**
 * Order created mail
 * POST /mail/order-created
 */
export const sendOrderCreatedMailHandler: RouteHandler = async (req, reply) => {
  try {
    const data = orderCreatedMailSchema.parse(req.body ?? {});

    await sendTemplatedEmail({
      to: data.to,
      key: 'order_received',
      locale: data.locale,
      params: {
        customer_name: data.customer_name,
        order_number: data.order_number,
        final_amount: data.final_amount,
        status: data.status,
        site_name: data.site_name,
      },
    });

    return reply.code(201).send({ ok: true });
  } catch (e: any) {
    req.log.error(e);
    return reply.code(500).send({ message: 'order_created_mail_failed' });
  }
};
