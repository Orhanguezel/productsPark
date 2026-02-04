// ===================================================================
// FILE: src/modules/functions/paytr.controller.ts
// FINAL — PayTR functions controllers (REAL iframe token)
// - Validates body (minimal required fields)
// - Forces user_ip from request (x-forwarded-for / req.ip)
// - DEV fallback: PAYTR_DEV_USER_IP if private/loopback
// - Returns PayTR error message in response for debugging
// ===================================================================

import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { createPaytrToken, type PaytrBody } from '@/modules/functions/paytr/service';
import { getSiteSettingsMap } from '@/modules/siteSettings/service';

// -------------------- helpers --------------------

const isPrivateOrLoopback = (ip: string): boolean => {
  const s = String(ip ?? '').trim();
  if (!s) return true;
  if (s === '127.0.0.1' || s === '::1') return true;
  if (s.startsWith('10.')) return true;
  if (s.startsWith('192.168.')) return true;
  if (s.startsWith('172.')) {
    const p = s.split('.');
    const n = Number(p[1]);
    if (Number.isFinite(n) && n >= 16 && n <= 31) return true;
  }
  return false;
};

const getClientIp = (req: FastifyRequest): string => {
  const xfRaw = req.headers['x-forwarded-for'];
  const xf = typeof xfRaw === 'string' ? xfRaw : Array.isArray(xfRaw) ? xfRaw.join(',') : '';

  const first = xf.split(',')[0]?.trim();
  const ip = (first || req.ip || '').trim();

  return ip || '127.0.0.1';
};

// Minimal validation (PayTR token için kritik alanlar)
const BodySchema = z.object({
  email: z.string().email().optional(),
  user_ip: z.string().optional(),

  merchant_oid: z.string().min(3),
  payment_amount: z.union([z.number(), z.string()]),

  currency: z.string().optional(),
  basket: z.any().optional(),
  lang: z.string().optional(),

  installment: z.union([z.number(), z.string()]).optional(),
  no_installment: z.union([z.number(), z.string()]).optional(),
  max_installment: z.union([z.number(), z.string()]).optional(),

  user_name: z.string().optional(),
  user_address: z.string().optional(),
  user_phone: z.string().optional(),
});

// -------------------- handlers --------------------

export async function paytrGetToken(req: FastifyRequest<{ Body: PaytrBody }>, reply: FastifyReply) {
  const parsed = BodySchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return reply.code(400).send({
      success: false,
      error: 'validation_error',
      details: parsed.error.format(),
    });
  }

  const b = parsed.data as PaytrBody;

  // ✅ force user_ip from request (do NOT trust client)
  let user_ip = getClientIp(req);
  if (isPrivateOrLoopback(user_ip)) {
    let devIp = '';
    try {
      const map = await getSiteSettingsMap(['paytr_dev_user_ip'] as const);
      devIp = (map.get('paytr_dev_user_ip') ?? '').trim();
    } catch {
      // ignore; fallback to env
    }
    if (!devIp) devIp = (process.env.PAYTR_DEV_USER_IP ?? '').trim();
    if (devIp) user_ip = devIp;
  }

  try {
    const data = await createPaytrToken({
      ...b,
      user_ip,
      currency: b.currency ?? 'TL',
      // lang opsiyonel; PayTR destekliyor. Kullanmasan da göndermek zarar vermez.
      // İstersen tamamen kaldırabilirsin, ama parametre hatası bununla ilgili değil.
      lang: b.lang ?? 'tr',
    });

    // FE'nin beklediği shape
    return reply.send({
      success: true,
      token: data.token,
      iframe_url: data.iframe_url,
    });
  } catch (e: any) {
    const msg = String(e?.message || 'paytr_token_failed');

    // ✅ log real reason for backend debugging
    req.log.error(
      {
        err: msg,
        stack: e?.stack,
        // do not log secrets; only keys are safe
        body_keys: Object.keys(req.body || {}),
        user_ip,
      },
      'paytr-get-token failed',
    );

    // ✅ return message so FE/dev can see exact PayTR reason quickly
    return reply.code(502).send({
      success: false,
      error: msg, // << IMPORTANT: don't hide PayTR "Geçersiz parametre(ler)"
    });
  }
}

export async function paytrHavaleGetToken(
  req: FastifyRequest<{ Body: PaytrBody }>,
  reply: FastifyReply,
) {
  // şimdilik aynı token endpoint'i kullanıyorsun
  return paytrGetToken(req, reply);
}
