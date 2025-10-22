import type { RouteHandler } from 'fastify';
import { randomUUID } from 'crypto';
import { db } from '@/db/client';
import { and, eq, isNull, lt, or, sql } from 'drizzle-orm';
import { coupons, type CouponInsert } from './schema';
import {
  couponCreateSchema,
  couponUpdateSchema,
  couponValidateSchema,
} from './validation';

const now = () => new Date();

function getAuthUserId(req: any): string {
  const sub = req.user?.sub ?? req.user?.id ?? null;
  if (!sub) throw new Error('unauthorized');
  return String(sub);
}

// ---- ortak: indirim hesaplama
function calcDiscount(params: {
  discount_type: 'percentage' | 'fixed';
  discount_value: string; // decimal string
  subtotal: string;       // decimal string
  max_discount?: string | null;
}) {
  const subtotalNum = Number(params.subtotal);
  const valueNum = Number(params.discount_value);
  let discount = 0;

  if (params.discount_type === 'percentage') {
    discount = (subtotalNum * valueNum) / 100;
  } else {
    discount = valueNum;
  }

  if (params.max_discount != null) {
    const cap = Number(params.max_discount);
    if (!Number.isNaN(cap)) {
      discount = Math.min(discount, cap);
    }
  }

  if (discount < 0) discount = 0;
  if (discount > subtotalNum) discount = subtotalNum;

  return discount.toFixed(2);
}

// ---- LIST
export const listCoupons: RouteHandler = async (req, reply) => {
  try {
    getAuthUserId(req); // basit koruma (rol ayrımı yapmıyoruz)
    const rows = await db.select().from(coupons);
    return reply.send(rows);
  } catch (e: any) {
    if (e?.message === 'unauthorized') return reply.code(401).send({ error: { message: 'unauthorized' } });
    req.log.error(e); return reply.code(500).send({ error: { message: 'coupons_list_failed' } });
  }
};

// ---- GET by id
export const getCoupon: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  try {
    getAuthUserId(req);
    const [row] = await db.select().from(coupons).where(eq(coupons.id, id)).limit(1);
    if (!row) return reply.code(404).send({ error: { message: 'not_found' } });
    return reply.send(row);
  } catch (e: any) {
    if (e?.message === 'unauthorized') return reply.code(401).send({ error: { message: 'unauthorized' } });
    req.log.error(e); return reply.code(500).send({ error: { message: 'coupon_get_failed' } });
  }
};

// ---- GET by code (exact match)
export const getCouponByCode: RouteHandler = async (req, reply) => {
  const { code } = req.params as { code: string };
  try {
    getAuthUserId(req);
    const [row] = await db.select().from(coupons).where(eq(coupons.code, code)).limit(1);
    if (!row) return reply.code(404).send({ error: { message: 'not_found' } });
    return reply.send(row);
  } catch (e: any) {
    if (e?.message === 'unauthorized') return reply.code(401).send({ error: { message: 'unauthorized' } });
    req.log.error(e); return reply.code(500).send({ error: { message: 'coupon_get_failed' } });
  }
};

// ---- CREATE
export const createCoupon: RouteHandler = async (req, reply) => {
  try {
    getAuthUserId(req);
    const body = couponCreateSchema.parse(req.body || {});
    const id = randomUUID();

    // code tekilliğini uygulamada kontrol et (DB'de unique yok)
    const [exists] = await db.select().from(coupons).where(eq(coupons.code, body.code)).limit(1);
    if (exists) {
      return reply.code(409).send({ error: { message: 'code_already_exists' } });
    }

    const row: CouponInsert = {
      id,
      code: body.code,
      discount_type: body.discount_type,
      discount_value: String(body.discount_value),
      min_purchase: body.min_purchase ?? null,
      max_discount: body.max_discount ?? null,
      usage_limit: body.usage_limit ?? null,
      used_count: 0,
      valid_from: body.valid_from ?? null,
      valid_until: body.valid_until ?? null,
      is_active: body.is_active ?? true,
      created_at: now(),
      updated_at: now(),
    };

    await db.insert(coupons).values(row);
    const [created] = await db.select().from(coupons).where(eq(coupons.id, id)).limit(1);
    return reply.code(201).send(created);
  } catch (e: any) {
    if (e?.name === 'ZodError') return reply.code(400).send({ error: { message: 'validation_error', details: e.issues } });
    if (e?.message === 'unauthorized') return reply.code(401).send({ error: { message: 'unauthorized' } });
    req.log.error(e); return reply.code(500).send({ error: { message: 'coupon_create_failed' } });
  }
};

// ---- UPDATE
export const updateCoupon: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  try {
    getAuthUserId(req);
    const patch = couponUpdateSchema.parse(req.body || {});
    // code çakışması önle
    if (patch.code) {
      const [conflict] = await db
        .select()
        .from(coupons)
        .where(and(eq(coupons.code, patch.code), sql`${coupons.id} <> ${id}`))
        .limit(1);
      if (conflict) return reply.code(409).send({ error: { message: 'code_already_exists' } });
    }

    await db
      .update(coupons)
      .set({ ...patch, updated_at: now() })
      .where(eq(coupons.id, id));

    const [row] = await db.select().from(coupons).where(eq(coupons.id, id)).limit(1);
    if (!row) return reply.code(404).send({ error: { message: 'not_found' } });
    return reply.send(row);
  } catch (e: any) {
    if (e?.name === 'ZodError') return reply.code(400).send({ error: { message: 'validation_error', details: e.issues } });
    if (e?.message === 'unauthorized') return reply.code(401).send({ error: { message: 'unauthorized' } });
    req.log.error(e); return reply.code(500).send({ error: { message: 'coupon_update_failed' } });
  }
};

// ---- DELETE
export const deleteCoupon: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  try {
    getAuthUserId(req);
    const res = await db.delete(coupons).where(eq(coupons.id, id));
    // bazı adapterlerde affectedRows yok; üst seviye 404 kontrolü:
    const [check] = await db.select().from(coupons).where(eq(coupons.id, id)).limit(1);
    if (check) {
      // silinmemiş
      return reply.code(500).send({ error: { message: 'coupon_delete_failed' } });
    }
    return reply.code(204).send();
  } catch (e: any) {
    if (e?.message === 'unauthorized') return reply.code(401).send({ error: { message: 'unauthorized' } });
    req.log.error(e); return reply.code(500).send({ error: { message: 'coupon_delete_failed' } });
  }
};

// ---- VALIDATE (önizleme) — indirim kuralları + tarih + limit + aktiflik
export const validateCoupon: RouteHandler = async (req, reply) => {
  try {
    // auth zorunlu tutmayabiliriz, ama diğer modüller uyumu için:
    getAuthUserId(req);

    const input = couponValidateSchema.parse(req.body || {});
    const [c] = await db.select().from(coupons).where(eq(coupons.code, input.code)).limit(1);
    if (!c) return reply.code(404).send({ valid: false, reason: 'not_found' });

    // aktif mi?
    if (!c.is_active) return reply.send({ valid: false, reason: 'inactive' });

    // tarih aralığı
    const nowDt = now();
    if (c.valid_from && nowDt < new Date(c.valid_from)) {
      return reply.send({ valid: false, reason: 'not_started' });
    }
    if (c.valid_until && nowDt > new Date(c.valid_until)) {
      return reply.send({ valid: false, reason: 'expired' });
    }

    // kullanım limiti
    if (c.usage_limit != null && c.used_count >= c.usage_limit) {
      return reply.send({ valid: false, reason: 'usage_limit_reached' });
    }

    // min purchase
    const subtotal = String(input.subtotal);
    if (c.min_purchase != null && Number(subtotal) < Number(c.min_purchase)) {
      return reply.send({ valid: false, reason: 'min_purchase_not_met', min_purchase: String(c.min_purchase) });
    }

    const discount = calcDiscount({
      discount_type: c.discount_type as 'percentage' | 'fixed',
      discount_value: String(c.discount_value),
      subtotal,
      max_discount: c.max_discount ? String(c.max_discount) : null,
    });

    const final_total = (Number(subtotal) - Number(discount)).toFixed(2);

    return reply.send({
      valid: true,
      code: c.code,
      discount_type: c.discount_type,
      discount_value: String(c.discount_value),
      max_discount: c.max_discount ? String(c.max_discount) : null,
      discount,
      subtotal: String(subtotal),
      final_total,
    });
  } catch (e: any) {
    if (e?.name === 'ZodError') return reply.code(400).send({ valid: false, reason: 'validation_error', details: e.issues });
    if (e?.message === 'unauthorized') return reply.code(401).send({ valid: false, reason: 'unauthorized' });
    req.log.error(e); return reply.code(500).send({ valid: false, reason: 'validate_failed' });
  }
};

// ---- REDEEM (atomik kullanım artırma)
// usage_limit kontrolüyle tek SQL UPDATE; uygun değilse 409 döner.
export const redeemCoupon: RouteHandler = async (req, reply) => {
  try {
    getAuthUserId(req);
    const { code } = req.body as { code?: string };
    if (!code) return reply.code(400).send({ error: { message: 'code_required' } });

    // koşulları JS'te tekrar kontrol ederek doğru mesaj döndürelim
    const [c] = await db.select().from(coupons).where(eq(coupons.code, code)).limit(1);
    if (!c) return reply.code(404).send({ error: { message: 'not_found' } });
    if (!c.is_active) return reply.code(409).send({ error: { message: 'inactive' } });

    const nowDt = now();
    if (c.valid_from && nowDt < new Date(c.valid_from)) {
      return reply.code(409).send({ error: { message: 'not_started' } });
    }
    if (c.valid_until && nowDt > new Date(c.valid_until)) {
      return reply.code(409).send({ error: { message: 'expired' } });
    }
    if (c.usage_limit != null && c.used_count >= c.usage_limit) {
      return reply.code(409).send({ error: { message: 'usage_limit_reached' } });
    }

    // atomik artırım: usage_limit NULL ya da used_count < usage_limit koşulu ile
    const res = await db
      .update(coupons)
      .set({ used_count: sql`${coupons.used_count} + 1`, updated_at: now() })
      .where(
        and(
          eq(coupons.code, code),
          or(isNull(coupons.usage_limit), lt(coupons.used_count, coupons.usage_limit!)),
        ),
      );

    // bazı adapterlerde res.affectedRows olmayabilir; değişimi tekrar oku
    const [after] = await db.select().from(coupons).where(eq(coupons.code, code)).limit(1);

    if (!after) return reply.code(404).send({ error: { message: 'not_found' } });
    if (c.usage_limit != null && after.used_count === c.used_count) {
      // artmadıysa limit sebebiyle reddedildi
      return reply.code(409).send({ error: { message: 'usage_limit_reached' } });
    }

    return reply.send(after);
  } catch (e: any) {
    if (e?.message === 'unauthorized') return reply.code(401).send({ error: { message: 'unauthorized' } });
    req.log.error(e); return reply.code(500).send({ error: { message: 'coupon_redeem_failed' } });
  }
};
