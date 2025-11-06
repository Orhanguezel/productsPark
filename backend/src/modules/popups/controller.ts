// =============================================================
// FILE: src/modules/popups/controller.ts
// =============================================================
import type { RouteHandler } from "fastify";
import { db } from "@/db/client";
import { popups } from "./schema";
import { and, asc, desc, eq, gte, lte, or, isNull } from "drizzle-orm";
import { popupListQuerySchema, type PopupListQuery } from "./validation";

/** FE/RTK tarafının beklediği "key" üretimi (title → slug) */
function slugifyKey(s: string): string {
  return (
    s
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "popup"
  );
}
function toBool(v: unknown): boolean | undefined {
  if (v === true || v === "true" || v === 1 || v === "1") return true;
  if (v === false || v === "false" || v === 0 || v === "0") return false;
  return undefined;
}
function toIntMaybe(v: unknown): number | undefined {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}
function nowIso(v?: Date | string | null) {
  return v ? new Date(v as unknown as string).toISOString() : undefined;
}

function mapRow(r: typeof popups.$inferSelect) {
  const key = r.title ? slugifyKey(r.title) : undefined;
  return {
    id: r.id,
    key,
    title: r.title ?? null,

    // FE CampaignPopup alanları
    type: "modal" as const,
    content_html: r.content ?? null,
    options: null as Record<string, unknown> | null,

    is_active: !!r.is_active,
    start_at: nowIso(r.valid_from) ?? null,
    end_at: nowIso(r.valid_until) ?? null,
    locale: null as string | null,
    created_at: nowIso(r.created_at),
    updated_at: nowIso(r.updated_at),

    // Görsel alanları
    image_url: r.image_url ?? null,
    image_asset_id: r.image_asset_id ?? null,
    image_alt: r.image_alt ?? null,

    // FE convenience
    content: r.content ?? null,
    button_text: r.button_text ?? null,
    button_link: r.button_url ?? null,

    // ▼ tablo alanlarından besle
    display_pages: r.display_pages ?? "all",
    display_frequency: r.show_once ? "once" : "always",
    delay_seconds: Number(r.delay ?? 0),
    duration_seconds: r.duration_seconds ?? null,
    priority: r.priority ?? null,
    coupon_code: r.coupon_code ?? null,
    product_id: r.product_id ?? null,
  };
}

/** "order" çöz — bilinmeyen sütunda created_at desc fallback */
function resolveOrder(order?: string) {
  if (!order) return { col: popups.created_at, dir: "desc" as const };
  const [col, dirRaw] = order.split(".");
  const dir = dirRaw === "asc" ? "asc" : "desc";
  switch (col) {
    case "created_at": return { col: popups.created_at, dir };
    case "updated_at": return { col: popups.updated_at, dir };
    case "delay":      return { col: popups.delay, dir };
    case "priority":   return { col: (popups as any).priority, dir }; // schema'da varsa
    default:           return { col: popups.created_at, dir: "desc" as const };
  }
}

/** GET /popups */
export const listPopups: RouteHandler = async (req, reply) => {
  const q = popupListQuerySchema.parse(req.query ?? {}) as PopupListQuery;

  const conds = [] as Array<
    ReturnType<typeof and> | ReturnType<typeof eq> | ReturnType<typeof or>
  >;

  // is_active filtresi (opsiyonel)
  if (q.is_active !== undefined) {
    const b = toBool(q.is_active);
    if (b !== undefined) conds.push(eq(popups.is_active, b));
  }

  // now BETWEEN valid_from & valid_until (null ise geçir)
  const now = new Date();
  const timeWindow = and(
    or(isNull(popups.valid_from), lte(popups.valid_from, now)),
    or(isNull(popups.valid_until), gte(popups.valid_until, now))
  );
  conds.push(timeWindow);

  let qb = db.select().from(popups).$dynamic();
  if (conds.length === 1) qb = qb.where(conds[0]!);
  else if (conds.length > 1) qb = qb.where(and(...conds));

  const { col, dir } = resolveOrder(q.order);
  qb = qb.orderBy(dir === "asc" ? asc(col) : desc(col));

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
  const norm = String(key || "").trim().toLowerCase();

  // aktif olanlardan en yeniye bak
  const rows = await db
    .select()
    .from(popups)
    .where(eq(popups.is_active, true))
    .orderBy(desc(popups.created_at))
    .limit(50);

  const found = rows.find((r) => slugifyKey(r.title ?? "") === norm);
  if (!found) return reply.code(404).send({ error: { message: "not_found" } });

  return reply.send(mapRow(found));
};
