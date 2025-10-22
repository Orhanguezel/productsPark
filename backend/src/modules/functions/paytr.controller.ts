import type { FastifyReply, FastifyRequest } from 'fastify';
import crypto from 'crypto';
import { env } from '@/core/env';

type PaytrBody = {
  email?: string;
  payment_amount?: number | string;
  merchant_oid?: string;
  user_ip?: string;
  installment?: number | string;
  no_installment?: number | string;
  max_installment?: number | string;
  currency?: string;
  basket?: any[];
  lang?: string;
};

const b64 = (s: string) => Buffer.from(s, 'utf8').toString('base64');

function buildPaytrToken(body: PaytrBody) {
  const merchant_id = env.PAYTR.MERCHANT_ID || 'xxxx';
  const merchant_key = env.PAYTR.MERCHANT_KEY || 'xxxx';
  const merchant_salt = env.PAYTR.MERCHANT_SALT || 'xxxx';

  const email = String(body.email ?? '');
  const payment_amount = Number(body.payment_amount ?? 0); // kuruş
  const merchant_oid = String(body.merchant_oid ?? `OID_${Date.now()}`);
  const user_ip = String(body.user_ip ?? '127.0.0.1');
  const installment = Number(body.installment ?? 0);
  const no_installment = Number(body.no_installment ?? 1);
  const max_installment = Number(body.max_installment ?? 0);
  const currency = body.currency ?? 'TL';
  const test_mode = Number(env.PAYTR.TEST_MODE ?? 1);

  const basketArr = Array.isArray(body.basket) ? body.basket : [];
  const user_basket = b64(JSON.stringify(basketArr));

  const hash_str =
    `${merchant_id}${user_ip}${merchant_oid}${email}` +
    `${payment_amount}${user_basket}${no_installment}${max_installment}` +
    `${currency}${test_mode}`;

  const paytr_token = crypto
    .createHmac('sha256', merchant_key)
    .update(hash_str + merchant_salt, 'utf8')
    .digest('base64');

  return {
    token: paytr_token,
    forward_payload: {
      merchant_id,
      user_ip,
      merchant_oid,
      email,
      payment_amount,
      user_basket,
      no_installment,
      max_installment,
      currency,
      test_mode,
      paytr_token,
      installment,
      lang: body.lang ?? 'tr',
      merchant_ok_url: env.PAYTR.OK_URL || '',
      merchant_fail_url: env.PAYTR.FAIL_URL || '',
    },
    expires_in: 300,
  };
}

export async function paytrGetToken(
  req: FastifyRequest<{ Body: PaytrBody }>,
  reply: FastifyReply,
) {
  const data = buildPaytrToken(req.body || {});
  return reply.send({ data });
}

export async function paytrHavaleGetToken(
  req: FastifyRequest<{ Body: PaytrBody }>,
  reply: FastifyReply,
) {
  const data = buildPaytrToken(req.body || {});
  return reply.send({ data });
}
