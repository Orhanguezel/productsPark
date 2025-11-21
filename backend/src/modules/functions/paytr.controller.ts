// src/modules/functions/paytr.controller.ts

import type { FastifyReply, FastifyRequest } from "fastify";
import crypto from "crypto";
import { getPaytrConfig, type PaytrProviderConfig } from "@/modules/payments/service";

type PaytrBody = {
  email?: string;
  payment_amount?: number | string; // kuruş
  merchant_oid?: string;
  user_ip?: string;
  installment?: number | string;
  no_installment?: number | string;
  max_installment?: number | string;
  currency?: string; // 'TL'
  basket?: Array<[string, number, number]>; // [name, unit_price, qty]
  lang?: string;
};

const b64 = (s: string) => Buffer.from(s, "utf8").toString("base64");

function buildPaytrToken(body: PaytrBody, cfg: PaytrProviderConfig) {
  const merchant_id = cfg.merchantId;
  const merchant_key = cfg.merchantKey;
  const merchant_salt = cfg.merchantSalt;

  const email = String(body.email ?? "");
  const payment_amount = Number(body.payment_amount ?? 0); // kuruş
  const merchant_oid = String(
    body.merchant_oid ?? `OID_${Date.now()}`
  );
  const user_ip = String(body.user_ip ?? "127.0.0.1");
  const installment = Number(body.installment ?? 0);
  const no_installment = Number(body.no_installment ?? 1);
  const max_installment = Number(body.max_installment ?? 0);
  const currency = body.currency ?? "TL";
  const test_mode = Number(cfg.testMode ?? 1);

  const basketArr = Array.isArray(body.basket) ? body.basket : [];
  const user_basket = b64(JSON.stringify(basketArr));

  const hash_str =
    `${merchant_id}${user_ip}${merchant_oid}${email}` +
    `${payment_amount}${user_basket}${no_installment}${max_installment}` +
    `${currency}${test_mode}`;

  const paytr_token = crypto
    .createHmac("sha256", merchant_key)
    .update(hash_str + merchant_salt, "utf8")
    .digest("base64");

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
      lang: body.lang ?? "tr",
      merchant_ok_url: cfg.okUrl || "",
      merchant_fail_url: cfg.failUrl || "",
    },
    expires_in: 300,
  };
}

/** FE beklentisi: { success: boolean, token?: string, error?: string } */
export async function paytrGetToken(
  req: FastifyRequest<{ Body: PaytrBody }>,
  reply: FastifyReply
) {
  try {
    const cfg = await getPaytrConfig("paytr");
    const data = buildPaytrToken(req.body || {}, cfg);
    return reply.send({ success: true, token: data.token });
  } catch (e: any) {
    req.log.error(e, "paytr-get-token failed");
    return reply
      .code(500)
      .send({ success: false, error: "token_build_failed" });
  }
}

export async function paytrHavaleGetToken(
  req: FastifyRequest<{ Body: PaytrBody }>,
  reply: FastifyReply
) {
  try {
    // İstersen burada ayrı provider key kullanabilirsin: "paytr_havale"
    const cfg = await getPaytrConfig("paytr");
    const data = buildPaytrToken(req.body || {}, cfg);
    return reply.send({ success: true, token: data.token });
  } catch (e: any) {
    req.log.error(e, "paytr-havale-get-token failed");
    return reply
      .code(500)
      .send({ success: false, error: "token_build_failed" });
  }
}
