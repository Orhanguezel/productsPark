// =============================================================
// FILE: src/modules/popups/admin.controller.ts
// =============================================================
import type { RouteHandler } from "fastify";
import { randomUUID } from "crypto";
import { z } from "zod";
import { db } from "@/db/client";
import { popups, type PopupRow, type PopupInsert } from "./schema";
import { asc, desc, eq } from "drizzle-orm";

/* ----------------------------- helpers ----------------------------- */

const boolLike = z.union([z.boolean(), z.literal(0), z.literal(1), z.string()]);
const freqEnum = z.enum(["always", "once", "daily", "weekly"]).optional();

// http(s) veya relative path kabul
const urlOrPath = z
  .string()
  .trim()
  .refine(
    (s: string) => s.length === 0 || s.startsWith("/") || /^https?:\/\//i.test(s),
    { message: "invalid url or path" }
  );

const createSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),

  image_url: z.string().url().nullable().optional(),
  image_asset_id: z.string().min(1).max(36).nullable().optional(), // uuid/char(36)
  image_alt: z.string().max(255).nullable().optional(),

  button_text: z.string().max(100).nullable().optional(),
  button_link: urlOrPath.nullable().optional(),

  is_active: boolLike.optional(),
  display_frequency: freqEnum,
  delay_seconds: z.number().int().min(0).max(600).nullable().optional(),
  start_date: z.union([z.string(), z.date()]).nullable().optional(),
  end_date: z.union([z.string(), z.date()]).nullable().optional(),

  // ▼ BE artık saklayacak
  product_id: z.string().min(1).max(36).nullable().optional(),
  coupon_code: z.string().max(64).nullable().optional(),
  display_pages: z.string().max(24).nullable().optional(), // örn: "all|home|products|categories"
  priority: z.number().int().nullable().optional(),
  duration_seconds: z.number().int().nullable().optional(),
});
const updateSchema = createSchema.partial();

const toBool = (v: unknown): boolean =>
  v === true || v === "true" || v === 1 || v === "1";

const toDateOrNull = (v: unknown): Date | null => {
  if (v == null) return null;
  if (v instanceof Date) return Number.isFinite(v.valueOf()) ? v : null;
  const d = new Date(String(v));
  return Number.isFinite(d.valueOf()) ? d : null;
};

const toIso = (d?: Date | string | null): string | null => {
  if (!d) return null;
  const dt = typeof d === "string" ? new Date(d) : d;
  return Number.isFinite(dt.valueOf()) ? dt.toISOString() : null;
};

function mapRow(r: PopupRow) {
  return {
    id: r.id,
    title: r.title ?? "",
    content: r.content ?? "",

    image_url: r.image_url ?? "",
    image_asset_id: r.image_asset_id ?? "",
    image_alt: r.image_alt ?? "",

    button_text: r.button_text ?? "",
    button_link: r.button_url ?? "",
    is_active: !!r.is_active,

    display_frequency: r.show_once ? "once" : "always",
    delay_seconds: Number(r.delay ?? 0),

    start_date: toIso(r.valid_from),
    end_date: toIso(r.valid_until),

    // ✅ DB alanları FE'ye geçir
    product_id: r.product_id ?? null,
    coupon_code: r.coupon_code ?? null,
    display_pages: r.display_pages ?? "all",
    priority: r.priority ?? null,
    duration_seconds: r.duration_seconds ?? null,

    created_at: toIso(r.created_at) ?? undefined,
    updated_at: toIso(r.updated_at) ?? undefined,
  };
}

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

/* ------------------------------- handlers ------------------------------- */

/** GET /admin/popups */
export const adminListPopups: RouteHandler = async (req, reply) => {
  const q = (req.query ?? {}) as Record<string, unknown>;
  const order = typeof q.order === "string" ? q.order : undefined;
  const { col, dir } = resolveOrder(order);

  const rows = await db
    .select()
    .from(popups)
    .orderBy(dir === "asc" ? asc(col) : desc(col));

  return reply.send(rows.map(mapRow));
};

/** GET /admin/popups/:id */
export const adminGetPopup: RouteHandler = async (req, reply) => {
  try {
    const { id } = (req.params as { id?: string }) ?? {};
    if (!id) return reply.code(400).send({ error: { message: "invalid_id" } });

    const [row] = await db.select().from(popups).where(eq(popups.id, id)).limit(1);
    if (!row) return reply.code(404).send({ error: { message: "not_found" } });

    return reply.send(mapRow(row));
  } catch (e) {
    (req as any)?.log?.error?.(e);
    return reply.code(500).send({ error: { message: "popup_get_failed" } });
  }
};

/** POST /admin/popups */
export const adminCreatePopup: RouteHandler = async (req, reply) => {
  try {
    const input = createSchema.parse(req.body ?? {});
    const id = randomUUID();

    await db.insert(popups).values({
      id,
      title: input.title,
      content: input.content,

      image_url: input.image_url ?? null,
      image_asset_id: input.image_asset_id ?? null,
      image_alt: input.image_alt ?? null,

      button_text: input.button_text ?? null,
      button_url: input.button_link && input.button_link.length > 0 ? input.button_link : null,

      is_active: input.is_active === undefined ? false : toBool(input.is_active),
      show_once: input.display_frequency === "once",
      delay: input.delay_seconds ?? 0,
      valid_from: toDateOrNull(input.start_date),
      valid_until: toDateOrNull(input.end_date),

      // ▼ yeni alanlar
      product_id: input.product_id ?? null,
      coupon_code: input.coupon_code ?? null,
      display_pages: input.display_pages ?? "all",
      priority: input.priority ?? null,
      duration_seconds: input.duration_seconds ?? null,
    } satisfies PopupInsert);

    const [row] = await db.select().from(popups).where(eq(popups.id, id)).limit(1);
    return reply.code(201).send(mapRow(row as PopupRow));
  } catch (e) {
    if (e instanceof z.ZodError) {
      return reply.code(400).send({ error: { message: "validation_error" } });
    }
    (req as any)?.log?.error?.(e);
    return reply.code(500).send({ error: { message: "popup_create_failed" } });
  }
};

/** PATCH /admin/popups/:id */
export const adminUpdatePopup: RouteHandler = async (req, reply) => {
  try {
    const { id } = (req.params as { id?: string }) ?? {};
    if (!id) return reply.code(400).send({ error: { message: "invalid_id" } });

    const patch = updateSchema.parse(req.body ?? {});
    const updates: Partial<PopupInsert> = {};

    if (patch.title !== undefined) updates.title = patch.title;
    if (patch.content !== undefined) updates.content = patch.content;

    if (patch.image_url !== undefined) updates.image_url = patch.image_url ?? null;
    if (patch.image_asset_id !== undefined) updates.image_asset_id = patch.image_asset_id ?? null;
    if (patch.image_alt !== undefined) updates.image_alt = patch.image_alt ?? null;

    if (patch.button_text !== undefined) updates.button_text = patch.button_text ?? null;
    if (patch.button_link !== undefined) {
      updates.button_url =
        patch.button_link && patch.button_link.length > 0 ? patch.button_link : null;
    }

    if (patch.is_active !== undefined) updates.is_active = toBool(patch.is_active);
    if (patch.display_frequency !== undefined) updates.show_once = patch.display_frequency === "once";
    if (patch.delay_seconds !== undefined) updates.delay = patch.delay_seconds ?? 0;
    if (patch.start_date !== undefined) updates.valid_from = toDateOrNull(patch.start_date);
    if (patch.end_date !== undefined) updates.valid_until = toDateOrNull(patch.end_date);

    // ▼ yeni alanlar
    if (patch.product_id !== undefined) updates.product_id = patch.product_id ?? null;
    if (patch.coupon_code !== undefined) updates.coupon_code = patch.coupon_code ?? null;
    if (patch.display_pages !== undefined) updates.display_pages = patch.display_pages ?? "all";
    if (patch.priority !== undefined) updates.priority = patch.priority ?? null;
    if (patch.duration_seconds !== undefined) updates.duration_seconds = patch.duration_seconds ?? null;

    await db.update(popups).set(updates).where(eq(popups.id, id));
    const [row] = await db.select().from(popups).where(eq(popups.id, id)).limit(1);

    if (!row) return reply.code(404).send({ error: { message: "not_found" } });
    return reply.send(mapRow(row));
  } catch (e) {
    if (e instanceof z.ZodError) {
      return reply.code(400).send({ error: { message: "validation_error" } });
    }
    (req as any)?.log?.error?.(e);
    return reply.code(500).send({ error: { message: "popup_update_failed" } });
  }
};

/** DELETE /admin/popups/:id */
export const adminDeletePopup: RouteHandler = async (req, reply) => {
  const { id } = (req.params as { id?: string }) ?? {};
  if (!id) return reply.code(400).send({ error: { message: "invalid_id" } });
  await db.delete(popups).where(eq(popups.id, id));
  return reply.code(204).send();
};
