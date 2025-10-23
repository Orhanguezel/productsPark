import type { RouteHandler } from 'fastify';
import { db } from '@/db/client';
import { popups } from './schema';
import { and, asc, desc, eq, gt, lt } from 'drizzle-orm';
import { popupListQuerySchema, type PopupListQuery } from './validation';

/** FE/RTK tarafının beklediği "key" üretimi (title → slug) */
function slugifyKey(s: string): string {
  return s
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')       // diakritikleri sil
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')           // alfasayısal dışını tire yap
    .replace(/^-+|-+$/g, '')               // baş/son tireleri sil
    || 'popup';
}

/** unknown → boolean? */
function toBool(v: unknown): boolean | undefined {
  if (v === true || v === 'true' || v === 1 || v === '1') return true;
  if (v === false || v === 'false' || v === 0 || v === '0') return false;
  return undefined;
}

/** unknown → number? */
function toIntMaybe(v: unknown): number | undefined {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

/** DB row → FE/RTK uyumlu obje (PopupRow + RTK Popup union’ı) */
function mapRow(r: typeof popups.$inferSelect) {
  const nowIso = (d?: Date | string | null) =>
    d ? new Date(d as any).toISOString() : undefined;

  const key = r.title ? slugifyKey(r.title) : undefined;

  return {
    // RTK Popup alanları
    id: r.id,
    key,
    title: r.title ?? null,
    type: 'modal' as const,             // DB’de yok → varsayılan
    content_html: r.content ?? null,    // text’i HTML alanına da yansıtıyoruz
    options: null as Record<string, unknown> | null,
    is_active: !!r.is_active,
    start_at: nowIso(r.valid_from) ?? null,
    end_at: nowIso(r.valid_until) ?? null,
    locale: null as string | null,
    created_at: nowIso(r.created_at),
    updated_at: nowIso(r.updated_at),

    // FE CampaignPopup’un bekledikleri (PopupRow ile uyum)
    image_url: r.image_url ?? null,
    content: r.content ?? null,
    button_text: r.button_text ?? null,
    button_link: r.button_url ?? null,

    display_pages: 'all' as const,                      // DB’de yok → tüm sayfalar
    display_frequency: r.show_once ? 'once' : 'always', // show_once mapping
    delay_seconds: Number(r.delay ?? 0),
    duration_seconds: null as number | null,
    priority: null as number | null,
    coupon_code: null as string | null,
    product_id: null as string | null,
  };
}

/** "order" çöz — bilinmeyen sütunda created_at desc fallback */
function resolveOrder(order?: string) {
  if (!order) return { col: popups.created_at, dir: 'desc' as const };
  const [col, dirRaw] = order.split('.');
  const dir = dirRaw === 'asc' ? 'asc' : 'desc';

  switch (col) {
    case 'created_at':   return { col: popups.created_at, dir };
    case 'updated_at':   return { col: popups.updated_at, dir };
    case 'delay':        return { col: popups.delay, dir };
    // FE bazen priority gönderiyor; DB’de yok → created_at fallback
    case 'priority':     return { col: popups.created_at, dir };
    default:             return { col: popups.created_at, dir: 'desc' as const };
  }
}

/** GET /popups */
export const listPopups: RouteHandler = async (req, reply) => {
  const q = popupListQuerySchema.parse(req.query ?? {}) as PopupListQuery;

  const conds: any[] = [];

  // is_active filtresi
  if (q.is_active !== undefined) {
    const b = toBool(q.is_active);
    if (b !== undefined) conds.push(eq(popups.is_active, b));
  }

  // geçerlilik aralığı (varsa): now BETWEEN valid_from & valid_until, null’lar allow
  const now = new Date();
  // valid_from <= now (veya null)
  conds.push(and(
    // valid_from null ise koşul sağ
    // drizzle’da basitçe gt/lt ile null karşılaştırmayalım; sadece iki ayrı koşuldan birini eklemiyoruz.
    // burada iş mantığı basit kalsın: tarih filtrelerini zorunlu tutmayalım (aktiflik FE’de de kontrol ediliyor)
  ));

  let qb = db.select().from(popups).$dynamic();

  if (conds.length === 1) qb = qb.where(conds[0]);
  else if (conds.length > 1) qb = qb.where(and(...conds));

  const { col, dir } = resolveOrder(q.order);
  qb = qb.orderBy(dir === 'asc' ? asc(col) : desc(col));

  const lim = toIntMaybe(q.limit);
  const off = toIntMaybe(q.offset);
  if (lim && lim > 0) qb = qb.limit(lim);
  if (off && off >= 0) qb = qb.offset(off);

  const rows = await qb;
  return reply.send(rows.map(mapRow));
};

/** GET /popups/by-key/:key  (DB’de "key" alanı yok → title’dan slug türetip eşleştiriyoruz) */
export const getPopupByKey: RouteHandler = async (req, reply) => {
  const { key } = req.params as { key: string };
  const norm = String(key || '').trim().toLowerCase();

  // aktif olanlardan en yeniye bak
  const rows = await db
    .select()
    .from(popups)
    .where(eq(popups.is_active, true))
    .orderBy(desc(popups.created_at))
    .limit(50);

  const found = rows.find(r => slugifyKey(r.title ?? '') === norm);
  if (!found) return reply.code(404).send({ error: { message: 'not_found' } });

  return reply.send(mapRow(found));
};
