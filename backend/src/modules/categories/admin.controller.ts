// FILE: src/modules/categories/admin.controller.ts
import type { RouteHandler } from "fastify";
import { randomUUID } from "crypto";
import { db } from "@/db/client";
import { categories } from "./schema";
import { eq, sql } from "drizzle-orm";
import {
  categoryCreateSchema,
  categoryUpdateSchema,
  type CategoryCreateInput,
  type CategoryUpdateInput,
} from "./validation";
import { buildInsertPayload, buildUpdatePayload } from "./controller";
import { storageAssets } from "@/modules/storage/schema";
import { env } from "@/core/env";

// ===== Storage URL helpers (blog ile aynı desen) =====
const encSeg = (s: string) => encodeURIComponent(s);
const encPath = (p: string) => p.split("/").map(encSeg).join("/");
function publicUrlOf(
  bucket: string,
  path: string,
  providerUrl?: string | null
): string {
  if (providerUrl) return providerUrl;
  const cdnBase = (env.CDN_PUBLIC_BASE || "").replace(/\/+$/, "");
  if (cdnBase) return `${cdnBase}/${encSeg(bucket)}/${encPath(path)}`;
  const apiBase = (env.PUBLIC_API_BASE || "").replace(/\/+$/, "");
  return `${apiBase || ""}/storage/${encSeg(bucket)}/${encPath(path)}`;
}
async function resolveAssetUrl(
  assetId?: string | null
): Promise<string | null> {
  if (!assetId) return null;
  const rows = await db
    .select()
    .from(storageAssets)
    .where(eq(storageAssets.id, assetId))
    .limit(1);
  const a = rows[0];
  if (!a) return null;
  return publicUrlOf(a.bucket, a.path, (a as any).url ?? null);
}

// ===== boolLike helper =====
const boolFromLike = (v: unknown | undefined): boolean | undefined => {
  if (v === undefined) return undefined;
  if (v === true || v === 1 || v === "1") return true;
  if (v === false || v === 0 || v === "0") return false;
  if (typeof v === "string") {
    const s = v.toLowerCase().trim();
    if (["true", "yes", "y", "on"].includes(s)) return true;
    if (["false", "no", "n", "off"].includes(s)) return false;
  }
  return undefined;
};

// ===== MySQL hata yardımcıları =====
function isDup(err: any) {
  const code = err?.code ?? err?.errno;
  return code === "ER_DUP_ENTRY" || code === 1062;
}
function isFk(err: any) {
  const code = err?.code ?? err?.errno;
  return code === "ER_NO_REFERENCED_ROW_2" || code === 1452;
}

/** POST /categories (admin) */
export const adminCreateCategory: RouteHandler<{
  Body: CategoryCreateInput;
}> = async (req, reply) => {
  const parsed = categoryCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return reply
      .code(400)
      .send({
        error: { message: "invalid_body", issues: parsed.error.flatten() },
      });
  }

  // Temel payload (SEO dahil) 👉 buildInsertPayload
  const payload = buildInsertPayload(parsed.data);

  // Makale alanları
  const artEnabled = boolFromLike(parsed.data.article_enabled);
  (payload as any).article_enabled = artEnabled ?? false;
  (payload as any).article_content =
    parsed.data.article_content ?? null;

  // Storage asset varsa URL’yi çöz ve image_url’a yaz
  if (parsed.data.image_asset_id !== undefined) {
    const finalUrl = await resolveAssetUrl(
      parsed.data.image_asset_id as string | null
    );
    payload.image_url = finalUrl ?? payload.image_url ?? null;
  }
  (payload as any).image_asset_id = (parsed.data
    .image_asset_id ?? null) as string | null;
  (payload as any).image_alt = (parsed.data.image_alt ?? null) as
    | string
    | null;

  // Kendini ebeveyn yapmayı önle
  if (payload.parent_id && payload.parent_id === payload.id) {
    payload.parent_id = null;
  }

  try {
    await db.insert(categories).values(payload as any);
  } catch (err: any) {
    if (isDup(err))
      return reply.code(409).send({ error: { message: "duplicate_slug" } });
    if (isFk(err))
      return reply
        .code(400)
        .send({ error: { message: "invalid_parent_id" } });
    return reply
      .code(500)
      .send({
        error: {
          message: "db_error",
          detail: String(err?.message ?? err),
        },
      });
  }

  const [row] = await db
    .select()
    .from(categories)
    .where(eq(categories.id, payload.id))
    .limit(1);
  return reply.code(201).send(row);
};

/** PUT /categories/:id (admin) */
export const adminPutCategory: RouteHandler<{
  Params: { id: string };
  Body: CategoryUpdateInput;
}> = async (req, reply) => {
  const { id } = req.params;

  const parsed = categoryUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return reply
      .code(400)
      .send({
        error: { message: "invalid_body", issues: parsed.error.flatten() },
      });
  }

  // Ham set (SEO dahil) 👉 buildUpdatePayload
  const set = buildUpdatePayload(parsed.data);

  // Makale alanları
  if ("article_enabled" in parsed.data) {
    const artEnabled = boolFromLike(parsed.data.article_enabled);
    if (artEnabled !== undefined) {
      (set as any).article_enabled = artEnabled;
    }
  }
  if ("article_content" in parsed.data) {
    (set as any).article_content =
      parsed.data.article_content ?? null;
  }

  // Görsel alanları (öncelik asset_id)
  let nextAssetId: string | null | undefined = undefined;
  if ("image_asset_id" in parsed.data) {
    nextAssetId = (parsed.data.image_asset_id ?? null) as string | null;
    (set as any).image_asset_id = nextAssetId;
    const urlFromAsset = await resolveAssetUrl(nextAssetId);
    (set as any).image_url =
      urlFromAsset ?? ((set as any).image_url ?? null);
  }
  if ("image_alt" in parsed.data) {
    (set as any).image_alt =
      (parsed.data.image_alt ?? null) as string | null;
  }
  if ("image_url" in parsed.data && nextAssetId === undefined) {
    (set as any).image_url =
      (parsed.data.image_url ?? null) as string | null;
  }

  // Kendine bağlanmayı önle
  if ("parent_id" in set && (set as any).parent_id === id) {
    (set as any).parent_id = null;
  }

  try {
    await db
      .update(categories)
      .set(set as any)
      .where(eq(categories.id, id));
  } catch (err: any) {
    if (isDup(err))
      return reply.code(409).send({ error: { message: "duplicate_slug" } });
    if (isFk(err))
      return reply
        .code(400)
        .send({ error: { message: "invalid_parent_id" } });
    return reply
      .code(500)
      .send({
        error: {
          message: "db_error",
          detail: String(err?.message ?? err),
        },
      });
  }

  const rows = await db
    .select()
    .from(categories)
    .where(eq(categories.id, id))
    .limit(1);
  if (!rows.length)
    return reply.code(404).send({ error: { message: "not_found" } });
  return reply.send(rows[0]);
};

/** PATCH /categories/:id (admin) */
export const adminPatchCategory: RouteHandler<{
  Params: { id: string };
  Body: CategoryUpdateInput;
}> = async (req, reply) => {
  const { id } = req.params;

  const parsed = categoryUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return reply
      .code(400)
      .send({
        error: { message: "invalid_body", issues: parsed.error.flatten() },
      });
  }

  const set = buildUpdatePayload(parsed.data);

  // Makale alanları
  if ("article_enabled" in parsed.data) {
    const artEnabled = boolFromLike(parsed.data.article_enabled);
    if (artEnabled !== undefined) {
      (set as any).article_enabled = artEnabled;
    }
  }
  if ("article_content" in parsed.data) {
    (set as any).article_content =
      parsed.data.article_content ?? null;
  }

  // Görsel alanları
  let nextAssetId: string | null | undefined = undefined;
  if ("image_asset_id" in parsed.data) {
    nextAssetId = (parsed.data.image_asset_id ?? null) as string | null;
    (set as any).image_asset_id = nextAssetId;
    const urlFromAsset = await resolveAssetUrl(nextAssetId);
    (set as any).image_url =
      urlFromAsset ?? ((set as any).image_url ?? null);
  }
  if ("image_alt" in parsed.data) {
    (set as any).image_alt =
      (parsed.data.image_alt ?? null) as string | null;
  }
  if ("image_url" in parsed.data && nextAssetId === undefined) {
    (set as any).image_url =
      (parsed.data.image_url ?? null) as string | null;
  }

  if ("parent_id" in set && (set as any).parent_id === id) {
    (set as any).parent_id = null;
  }

  try {
    await db
      .update(categories)
      .set(set as any)
      .where(eq(categories.id, id));
  } catch (err: any) {
    if (isDup(err))
      return reply.code(409).send({ error: { message: "duplicate_slug" } });
    if (isFk(err))
      return reply
        .code(400)
        .send({ error: { message: "invalid_parent_id" } });
    return reply
      .code(500)
      .send({
        error: {
          message: "db_error",
          detail: String(err?.message ?? err),
        },
      });
  }

  const rows = await db
    .select()
    .from(categories)
    .where(eq(categories.id, id))
    .limit(1);
  if (!rows.length)
    return reply.code(404).send({ error: { message: "not_found" } });
  return reply.send(rows[0]);
};


/** DELETE /categories/:id (admin) — değişmedi */
export const adminDeleteCategory: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  const { id } = req.params;
  await db.delete(categories).where(eq(categories.id, id));
  return reply.code(204).send();
};

/** POST /categories/reorder (admin) — değişmedi (updated_at SQL) */
export const adminReorderCategories: RouteHandler<{
  Body: { items: Array<{ id: string; display_order: number }> };
}> = async (req, reply) => {
  const items = Array.isArray(req.body?.items) ? req.body.items : [];
  if (!items.length) return reply.send({ ok: true });

  for (const it of items) {
    const n = Number(it.display_order) || 0;
    await db
      .update(categories)
      .set({
        display_order: n,
        updated_at: sql`CURRENT_TIMESTAMP(3)`,
      })
      .where(eq(categories.id, it.id));
  }
  return reply.send({ ok: true });
};

/** Toggle’lar — değişmedi */
export const adminToggleActive: RouteHandler<{
  Params: { id: string };
  Body: { is_active: boolean };
}> = async (req, reply) => {
  const { id } = req.params;
  const v = !!req.body?.is_active;
  await db
    .update(categories)
    .set({ is_active: v, updated_at: sql`CURRENT_TIMESTAMP(3)` })
    .where(eq(categories.id, id));
  const rows = await db
    .select()
    .from(categories)
    .where(eq(categories.id, id))
    .limit(1);
  if (!rows.length)
    return reply.code(404).send({ error: { message: 'not_found' } });
  return reply.send(rows[0]);
};

export const adminToggleFeatured: RouteHandler<{
  Params: { id: string };
  Body: { is_featured: boolean };
}> = async (req, reply) => {
  const { id } = req.params;
  const v = !!req.body?.is_featured;
  await db
    .update(categories)
    .set({ is_featured: v, updated_at: sql`CURRENT_TIMESTAMP(3)` })
    .where(eq(categories.id, id));
  const rows = await db
    .select()
    .from(categories)
    .where(eq(categories.id, id))
    .limit(1);
  if (!rows.length)
    return reply.code(404).send({ error: { message: 'not_found' } });
  return reply.send(rows[0]);
};

