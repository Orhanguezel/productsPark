// modules/topbar/controller.ts
import type { RouteHandler } from 'fastify';
import { db } from '@/db/client';
import { and, asc, desc, eq } from 'drizzle-orm';
import { topbarSettings } from './schema';
// 👉 Yolunu projene göre düzelt
import { coupons } from '@/modules/coupons/schema';
import {
  topbarPublicListQuerySchema,
  type TopbarPublicListQuery,
} from './validation';

function toBool(v: unknown): boolean | undefined {
  if (v === true || v === 'true' || v === 1 || v === '1') return true;
  if (v === false || v === 'false' || v === 0 || v === '0') return false;
  return undefined;
}
function toInt(v: unknown): number | undefined {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

type RowWithCoupon = {
  top: typeof topbarSettings.$inferSelect;
  coup: { code: string | null } | null;
};

function mapRow(r: RowWithCoupon) {
  const tb = r.top;
  const code = r.coup?.code ?? null;
  return {
    id: tb.id,
    is_active: !!tb.is_active,
    message: tb.text,
    coupon_code: code,                     // <— public artık gerçek kupon kodu döner
    link_url: tb.link ?? null,
    link_text: tb.link ? 'Detaylar' : null,
    show_ticker: !!tb.show_ticker,
    created_at: tb.created_at ? new Date(tb.created_at).toISOString() : undefined,
    updated_at: tb.updated_at ? new Date(tb.updated_at).toISOString() : undefined,
  };
}

// "created_at|updated_at|is_active|text[.desc]"
function resolveOrder(order?: string) {
  const [col, dirRaw] = (order ?? '').split('.');
  const dir = dirRaw === 'desc' ? 'desc' : 'asc';
  const colRef =
    col === 'updated_at' ? topbarSettings.updated_at :
    col === 'is_active'  ? topbarSettings.is_active :
    col === 'text'       ? topbarSettings.text :
    topbarSettings.created_at;
  return { colRef, dir };
}

/** GET /topbar_settings (public) */
export const listTopbarSettings: RouteHandler<{ Querystring: TopbarPublicListQuery }> = async (req, reply) => {
  const q = topbarPublicListQuerySchema.parse(req.query ?? {}) as TopbarPublicListQuery;

  let qb = db
    .select({
      top: topbarSettings,
      coup: { code: coupons.code },
    })
    .from(topbarSettings)
    .leftJoin(coupons, eq(coupons.id, topbarSettings.coupon_id))
    .$dynamic();

  const conds: any[] = [];
  // Public default: sadece aktifler
  if (q.is_active === undefined) {
    conds.push(eq(topbarSettings.is_active, true));
  } else {
    const b = toBool(q.is_active);
    if (b !== undefined) conds.push(eq(topbarSettings.is_active, b));
  }

  if (conds.length === 1) qb = qb.where(conds[0]);
  else if (conds.length > 1) qb = qb.where(and(...conds));

  const { colRef, dir } = resolveOrder(q.order);
  qb = qb.orderBy(dir === 'desc' ? desc(colRef) : asc(colRef));

  const lim = toInt(q.limit);
  const off = toInt(q.offset);
  if (lim && lim > 0) qb = qb.limit(lim);
  if (off && off >= 0) qb = qb.offset(off);

  const rows = await qb;
  return reply.send(rows.map(mapRow));
};

/** GET /topbar_settings/:id (public) */
export const getTopbarSettingById: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  const { id } = req.params;
  const [row] = await db
    .select({ top: topbarSettings, coup: { code: coupons.code } })
    .from(topbarSettings)
    .leftJoin(coupons, eq(coupons.id, topbarSettings.coupon_id))
    .where(eq(topbarSettings.id, id))
    .limit(1);

  if (!row) return reply.code(404).send({ error: { message: 'not_found' } });
  return reply.send(mapRow(row));
};
