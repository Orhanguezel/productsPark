import type { RouteHandler } from 'fastify';
import { db } from '@/db/client';
import { and, asc, desc, eq } from 'drizzle-orm';
import { topbarSettings } from './schema';

function toBool(v: unknown): boolean | undefined {
  if (v === true || v === 'true' || v === 1 || v === '1') return true;
  if (v === false || v === 'false' || v === 0 || v === '0') return false;
  return undefined;
}
function toInt(v: unknown): number | undefined {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function mapRow(r: typeof topbarSettings.$inferSelect) {
  return {
    // FE TopbarSettings tipine uygun dönüşüm:
    id: r.id,
    is_active: !!r.is_active,
    message: r.text,
    coupon_code: null as string | null, // DB'de yok → FE null
    link_url: r.link ?? null,
    link_text: r.link ? 'Detaylar' : null, // isterseniz null bırakın
    // ek meta:
    show_ticker: !!r.show_ticker,
    created_at: r.created_at ? new Date(r.created_at).toISOString() : undefined,
    updated_at: r.updated_at ? new Date(r.updated_at).toISOString() : undefined,
  };
}

/**
 * GET /topbar_settings
 * Desteklenen query: select(ignore), is_active, order(col(.asc|.desc)), limit, offset
 * FE çağrısı: ?select=*&is_active=1&limit=1
 */
export const listTopbarSettings: RouteHandler = async (req, reply) => {
  const q = (req.query || {}) as {
    select?: string;
    is_active?: string | number | boolean;
    order?: string; // ör: "created_at.desc"
    limit?: string | number;
    offset?: string | number;
  };

  let qb = db.select().from(topbarSettings).$dynamic();

  const conditions: unknown[] = [];
  if (q.is_active !== undefined) {
    const b = toBool(q.is_active);
    if (b !== undefined) conditions.push(eq(topbarSettings.is_active, b));
  }

  if (conditions.length === 1) qb = qb.where(conditions[0] as any);
  else if (conditions.length > 1) qb = qb.where(and(...(conditions as any)));

  // order
  if (q.order) {
    const [col, dirRaw] = q.order.split('.');
    const dir = dirRaw === 'desc' ? 'desc' : 'asc';
    const colRef =
      (topbarSettings as any)[col] ??
      topbarSettings.created_at; // default
    qb = qb.orderBy(dir === 'desc' ? desc(colRef) : asc(colRef));
  } else {
    qb = qb.orderBy(desc(topbarSettings.created_at));
  }

  const lim = toInt(q.limit);
  const off = toInt(q.offset);
  if (lim && lim > 0) qb = qb.limit(lim);
  if (off && off >= 0) qb = qb.offset(off);

  const rows = await qb;
  return reply.send(rows.map(mapRow));
};
