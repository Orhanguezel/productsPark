import type { RouteHandler } from "fastify";
import { and, asc, desc, eq, like } from "drizzle-orm";
import { db } from "@/db/client";
import { coupons, type CouponRow } from "./schema";
import { couponListQuerySchema, type CouponListQuery } from "./validation";

const toNum = (x: unknown): number => {
  if (typeof x === "number") return Number.isFinite(x) ? x : 0;
  const n = Number(x as unknown);
  return Number.isFinite(n) ? n : 0;
};
const toBool01 = (x: unknown): boolean | undefined => {
  if (x === 1 || x === "1" || x === true || x === "true") return true;
  if (x === 0 || x === "0" || x === false || x === "false") return false;
  return undefined;
};
const iso = (d?: Date | string | null): string | null => {
  if (!d) return null;
  const dt = d instanceof Date ? d : new Date(String(d));
  return Number.isFinite(dt.valueOf()) ? dt.toISOString() : null;
};

function mapRow(r: CouponRow) {
  return {
    id: r.id,
    code: r.code,
    // 🆕 Başlık ve içerik
    title: r.title ?? null,
    content_html: r.content_html ?? null,

    discount_type: r.discount_type === "percentage" ? "percentage" : "fixed",
    discount_value: toNum(r.discount_value),
    min_purchase: r.min_purchase == null ? 0 : toNum(r.min_purchase),
    max_discount: r.max_discount == null ? null : toNum(r.max_discount),
    is_active: !!r.is_active,
    max_uses: r.usage_limit == null ? null : toNum(r.usage_limit),
    used_count: r.used_count == null ? null : toNum(r.used_count),
    valid_from: iso(r.valid_from),
    valid_until: iso(r.valid_until),
    applicable_to: "all" as const,
    category_ids: null,
    product_ids: null,
    created_at: iso(r.created_at),
    updated_at: iso(r.updated_at),
  };
}

/** GET /coupons */
export const listCoupons: RouteHandler = async (req, reply) => {
  const q = couponListQuerySchema.parse(req.query || {}) as CouponListQuery;

  let qb = db.select().from(coupons).$dynamic();
  const where: unknown[] = [];

  const active = toBool01(q.is_active as unknown);
  if (active !== undefined) where.push(eq(coupons.is_active, active));

  if (q.q && q.q.trim()) where.push(like(coupons.code, `%${q.q.trim()}%`));

  if (where.length === 1) qb = qb.where(where[0] as any);
  else if (where.length > 1) qb = qb.where(and(...(where as any)));

  qb = qb.orderBy(
    q.order === "asc" ? asc((coupons as any)[q.sort]) : desc((coupons as any)[q.sort]),
  );
  if (q.limit && q.limit > 0) qb = qb.limit(q.limit);
  if (q.offset && q.offset >= 0) qb = qb.offset(q.offset);

  const rows = await qb;
  return reply.send(rows.map(mapRow));
};

/** GET /coupons/:id */
export const getCouponById: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  const rows = await db.select().from(coupons).where(eq(coupons.id, id)).limit(1);
  if (!rows.length) return reply.code(404).send({ error: { message: "not_found" } });
  return reply.send(mapRow(rows[0]));
};

/** GET /coupons/by-code/:code */
export const getCouponByCode: RouteHandler = async (req, reply) => {
  const { code } = req.params as { code: string };
  const rows = await db.select().from(coupons).where(eq(coupons.code, code)).limit(1);
  if (!rows.length) return reply.code(404).send({ error: { message: "not_found" } });
  return reply.send(mapRow(rows[0]));
};
