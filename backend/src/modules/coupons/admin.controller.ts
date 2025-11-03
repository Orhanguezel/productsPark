import type { RouteHandler } from "fastify";
import { randomUUID } from "crypto";
import { z } from "zod";
import { db } from "@/db/client";
import { coupons, type CouponInsert, type CouponRow } from "./schema";
import { and, asc, desc, eq, like } from "drizzle-orm";

const dType = z.enum(["percentage", "fixed"]);
const boolLike = z.union([z.boolean(), z.literal(0), z.literal(1), z.string()]);

const toDecStr = (x: unknown): string => {
  const n = typeof x === "number" ? x : Number(x);
  return Number.isFinite(n) ? n.toFixed(2) : "0.00";
};
const toBool = (v: unknown): boolean =>
  v === true || v === "true" || v === 1 || v === "1";
const toBoolOptional = (v: unknown): boolean | undefined => {
  if (v === true || v === 1 || v === "1" || v === "true") return true;
  if (v === false || v === 0 || v === "0" || v === "false") return false;
  return undefined;
};
const toDateOrNull = (v: unknown): Date | null => {
  if (v == null) return null;
  if (v instanceof Date) return Number.isFinite(v.valueOf()) ? v : null;
  const d = new Date(String(v));
  return Number.isFinite(d.valueOf()) ? d : null;
};
const iso = (d?: Date | string | null): string | null => {
  if (!d) return null;
  const dt = typeof d === "string" ? new Date(d) : d;
  return Number.isFinite(dt.valueOf()) ? dt.toISOString() : null;
};

const mapRow = (r: CouponRow) => ({
  id: r.id,
  code: r.code,
  title: null,
  discount_type: r.discount_type === "percentage" ? "percentage" : "fixed",
  discount_value: Number(r.discount_value),
  min_purchase: r.min_purchase == null ? 0 : Number(r.min_purchase),
  max_discount: r.max_discount == null ? null : Number(r.max_discount),
  is_active: !!r.is_active,
  max_uses: r.usage_limit == null ? null : Number(r.usage_limit),
  used_count: r.used_count == null ? null : Number(r.used_count),
  valid_from: iso(r.valid_from),
  valid_until: iso(r.valid_until),
  applicable_to: "all" as const,
  category_ids: null,
  product_ids: null,
  created_at: iso(r.created_at),
  updated_at: iso(r.updated_at),
});

const listQuery = z.object({
  is_active: z.union([z.literal(0), z.literal(1), z.boolean()]).optional(),
  q: z.string().optional(),
  limit: z.coerce.number().int().positive().max(500).optional(),
  offset: z.coerce.number().int().nonnegative().optional(),
  sort: z.enum(["created_at", "updated_at"]).optional().default("created_at"),
  order: z.enum(["asc", "desc"]).optional().default("desc"),
});
type ListQuery = z.infer<typeof listQuery>;

function resolveOrder(s?: "created_at" | "updated_at", ord?: "asc" | "desc") {
  const dir = ord === "asc" ? "asc" : "desc";
  const col = s === "updated_at" ? coupons.updated_at : coupons.created_at;
  return { col, dir };
}

/** GET /admin/coupons */
export const adminListCoupons: RouteHandler = async (req, reply) => {
  const q = listQuery.parse((req.query ?? {}) as Record<string, unknown>);
  const { col, dir } = resolveOrder(q.sort, q.order);

  let qb = db.select().from(coupons).$dynamic();
  const where: unknown[] = [];

  const active = toBoolOptional(q.is_active as unknown);
  if (active !== undefined) where.push(eq(coupons.is_active, active));
  if (q.q && q.q.trim()) where.push(like(coupons.code, `%${q.q.trim()}%`));

  if (where.length === 1) qb = qb.where(where[0] as any);
  else if (where.length > 1) qb = qb.where(and(...(where as any)));

  qb = qb.orderBy(dir === "asc" ? asc(col) : desc(col));
  if (q.limit) qb = qb.limit(q.limit);
  if (q.offset) qb = qb.offset(q.offset);

  const rows = await qb;
  return reply.send(rows.map(mapRow));
};

/** GET /admin/coupons/:id */
export const adminGetCoupon: RouteHandler = async (req, reply) => {
  const { id } = (req.params as { id?: string }) ?? {};
  if (!id) return reply.code(400).send({ error: { message: "invalid_id" } });
  const [row] = await db.select().from(coupons).where(eq(coupons.id, id)).limit(1);
  if (!row) return reply.code(404).send({ error: { message: "not_found" } });
  return reply.send(mapRow(row));
};

/** POST /admin/coupons */
export const adminCreateCoupon: RouteHandler = async (req, reply) => {
  try {
    const input = z.object({
      code: z.string().min(1),
      discount_type: dType,
      discount_value: z.coerce.number().nonnegative(),
      min_purchase: z.coerce.number().nonnegative().nullable().optional(),
      max_discount: z.coerce.number().nonnegative().nullable().optional(),
      usage_limit: z.coerce.number().int().positive().nullable().optional(),
      valid_from: z.union([z.string(), z.date()]).nullable().optional(),
      valid_until: z.union([z.string(), z.date()]).nullable().optional(),
      is_active: boolLike.optional(),
      // ignore extras from FE:
      applicable_to: z.any().optional(),
      category_ids: z.any().optional(),
      product_ids: z.any().optional(),
      title: z.any().optional(),
    }).parse(req.body ?? {});

    const id = randomUUID();
    await db.insert(coupons).values({
      id,
      code: input.code,
      discount_type: input.discount_type,
      discount_value: toDecStr(input.discount_value),
      min_purchase: input.min_purchase == null ? null : toDecStr(input.min_purchase),
      max_discount: input.max_discount == null ? null : toDecStr(input.max_discount),
      usage_limit: input.usage_limit ?? null,
      used_count: 0,
      valid_from: toDateOrNull(input.valid_from),
      valid_until: toDateOrNull(input.valid_until),
      is_active: input.is_active === undefined ? true : toBool(input.is_active),
      // created_at/updated_at DB default
    } satisfies CouponInsert);

    const [row] = await db.select().from(coupons).where(eq(coupons.id, id)).limit(1);
    return reply.code(201).send(mapRow(row!));
  } catch (e) {
    if (e instanceof z.ZodError) {
      return reply.code(400).send({ error: { message: "validation_error", details: e.issues } });
    }
    (req as any)?.log?.error?.(e);
    return reply.code(500).send({ error: { message: "coupon_create_failed" } });
  }
};

/** PATCH /admin/coupons/:id */
export const adminUpdateCoupon: RouteHandler = async (req, reply) => {
  try {
    const { id } = (req.params as { id?: string }) ?? {};
    if (!id) return reply.code(400).send({ error: { message: "invalid_id" } });

    const patch = z.object({
      code: z.string().min(1).optional(),
      discount_type: dType.optional(),
      discount_value: z.coerce.number().nonnegative().optional(),
      min_purchase: z.coerce.number().nonnegative().nullable().optional(),
      max_discount: z.coerce.number().nonnegative().nullable().optional(),
      usage_limit: z.coerce.number().int().positive().nullable().optional(),
      valid_from: z.union([z.string(), z.date()]).nullable().optional(),
      valid_until: z.union([z.string(), z.date()]).nullable().optional(),
      is_active: boolLike.optional(),
      applicable_to: z.any().optional(),
      category_ids: z.any().optional(),
      product_ids: z.any().optional(),
      title: z.any().optional(),
    }).parse(req.body ?? {});

    const updates: Partial<CouponInsert> = {};
    if (patch.code            !== undefined) updates.code          = patch.code;
    if (patch.discount_type   !== undefined) updates.discount_type = patch.discount_type;
    if (patch.discount_value  !== undefined) updates.discount_value= toDecStr(patch.discount_value);
    if (patch.min_purchase    !== undefined) updates.min_purchase  = patch.min_purchase == null ? null : toDecStr(patch.min_purchase);
    if (patch.max_discount    !== undefined) updates.max_discount  = patch.max_discount == null ? null : toDecStr(patch.max_discount);
    if (patch.usage_limit     !== undefined) updates.usage_limit   = patch.usage_limit ?? null;
    if (patch.valid_from      !== undefined) updates.valid_from    = toDateOrNull(patch.valid_from);
    if (patch.valid_until     !== undefined) updates.valid_until   = toDateOrNull(patch.valid_until);
    if (patch.is_active       !== undefined) updates.is_active     = toBool(patch.is_active);

    await db.update(coupons).set(updates).where(eq(coupons.id, id));
    const [row] = await db.select().from(coupons).where(eq(coupons.id, id)).limit(1);
    if (!row) return reply.code(404).send({ error: { message: "not_found" } });
    return reply.send(mapRow(row));
  } catch (e) {
    if (e instanceof z.ZodError) {
      return reply.code(400).send({ error: { message: "validation_error", details: e.issues } });
    }
    (req as any)?.log?.error?.(e);
    return reply.code(500).send({ error: { message: "coupon_update_failed" } });
  }
};

/** POST /admin/coupons/:id/enable|disable */
export const adminToggleCoupon: RouteHandler = async (req, reply) => {
  const { id, action } = (req.params as { id?: string; action?: "enable" | "disable" }) ?? {};
  if (!id || !action) return reply.code(400).send({ error: { message: "invalid_params" } });
  await db.update(coupons).set({ is_active: action === "enable" }).where(eq(coupons.id, id));
  const [row] = await db.select().from(coupons).where(eq(coupons.id, id)).limit(1);
  if (!row) return reply.code(404).send({ error: { message: "not_found" } });
  return reply.send(mapRow(row));
};

/** DELETE /admin/coupons/:id */
export const adminDeleteCoupon: RouteHandler = async (req, reply) => {
  const { id } = (req.params as { id?: string }) ?? {};
  if (!id) return reply.code(400).send({ error: { message: "invalid_id" } });
  await db.delete(coupons).where(eq(coupons.id, id));
  return reply.code(204).send();
};
