// -------------------------------------------------------------
// FILE: src/modules/blog/admin.controller.ts
// FINAL — Admin Blog Controller (is_featured + asset resolve + safe parsing)
// Routes:
//   GET    /admin/blog_posts
//   GET    /admin/blog_posts/:id
//   POST   /admin/blog_posts
//   PUT    /admin/blog_posts/:id
//   PATCH  /admin/blog_posts/:id/publish
//   DELETE /admin/blog_posts/:id
//   POST   /admin/blog_posts/reorder (NO-OP unless display_order exists)
// -------------------------------------------------------------
import type { RouteHandler } from 'fastify';
import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

import {
  listBlogPosts,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  getBlogPostById,
} from './repository';

import { blogCreateSchema, blogUpdateSchema } from './validation';

import { db } from '@/db/client';
import { storageAssets } from '@/modules/storage/schema';
import { env } from '@/core/env';

/* ---------------- helpers ---------------- */

const to01 = (v: unknown): 0 | 1 => (v === true || v === 1 || v === '1' || v === 'true' ? 1 : 0);

const nowIf = (cond: boolean): Date | null => (cond ? new Date() : null);

const slugify = (s: string) =>
  s
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036F]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const encSeg = (s: string) => encodeURIComponent(s);
const encPath = (p: string) => p.split('/').map(encSeg).join('/');

function publicUrlOf(bucket: string, path: string, providerUrl?: string | null): string {
  if (providerUrl) return providerUrl;

  const cdnBase = (env.CDN_PUBLIC_BASE || '').replace(/\/+$/, '');
  if (cdnBase) return `${cdnBase}/${encSeg(bucket)}/${encPath(path)}`;

  const apiBase = (env.PUBLIC_API_BASE || '').replace(/\/+$/, '');
  return `${apiBase || ''}/storage/${encSeg(bucket)}/${encPath(path)}`;
}

async function resolveAssetUrl(assetId?: string | null): Promise<string | null> {
  if (!assetId) return null;

  const rows = await db.select().from(storageAssets).where(eq(storageAssets.id, assetId)).limit(1);
  const a = rows[0];
  if (!a) return null;

  return publicUrlOf(a.bucket, a.path, a.url as string | null);
}

function safeInt(v: unknown): number | undefined {
  if (v == null || v === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

/* ---------------- types ---------------- */

export type AdminListQuery = {
  order?: string; // e.g. "created_at.desc"
  sort?: 'created_at' | 'updated_at' | 'published_at';
  orderDir?: 'asc' | 'desc';
  limit?: string;
  offset?: string;
  is_published?: '0' | '1' | 'true' | 'false';
  is_featured?: '0' | '1' | 'true' | 'false';
  q?: string;
  slug?: string;
  category?: string;
};

/* ========================
 * LIST (GET /admin/blog_posts)
 * ======================== */
export const adminListPosts: RouteHandler<{ Querystring: AdminListQuery }> = async (req, reply) => {
  const q = req.query;

  const limit = safeInt(q.limit);
  const offset = safeInt(q.offset);

   const { items, total } = await listBlogPosts({
     orderParam: typeof q.order === 'string' ? q.order : undefined,
     sort: q.sort,
     order: q.orderDir,
     limit,
     offset,
     is_published: q.is_published,
     is_featured: q.is_featured,
     q: q.q,
     slug: q.slug,
     category: q.category,
   });

  reply.header('x-total-count', String(total));
  return reply.send(items);
};

/* ========================
 * GET BY ID (GET /admin/blog_posts/:id)
 * ======================== */
export const adminGetPost: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  const row = await getBlogPostById(req.params.id);
  if (!row) return reply.code(404).send({ error: { message: 'not_found' } });
  return reply.send(row);
};

/* ---------------- schemas ---------------- */

const publishToggleSchema = z.object({ is_published: z.coerce.boolean() });

/* ========================
 * CREATE (POST /admin/blog_posts)
 * ======================== */
export const adminCreatePost: RouteHandler = async (req, reply) => {
  try {
    const parsed = blogCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: { message: 'invalid_body', detail: parsed.error.flatten() },
      });
    }

    const b = parsed.data;

    const slug = (b.slug && b.slug.trim()) || slugify(b.title);
    const isPublished = !!b.is_published;
    const isFeatured = !!b.is_featured;

    // asset_id varsa url'yi oradan üret, yoksa body url kullan
    const assetUrl = await resolveAssetUrl(b.featured_image_asset_id ?? null);
    const finalUrl = assetUrl ?? b.featured_image ?? null;

    const row = await createBlogPost({
      id: randomUUID(),
      title: b.title,
      slug,

      excerpt: b.excerpt ?? null,
      content: b.content,
      category: b.category ?? null,

      featured_image: finalUrl,
      featured_image_asset_id: b.featured_image_asset_id ?? null,
      featured_image_alt: b.featured_image_alt ?? null,

      author: b.author ?? null,
      meta_title: b.meta_title ?? null,
      meta_description: b.meta_description ?? null,

      is_published: to01(isPublished),
      published_at: b.published_at ?? nowIf(isPublished),

      is_featured: to01(isFeatured),

      created_at: new Date(),
      updated_at: new Date(),
    });

    return reply.code(201).send(row);
  } catch (e: any) {
    if (e?.code === 'ER_DUP_ENTRY') {
      return reply.code(409).send({ error: { message: 'duplicate_slug' } });
    }
    req.log.error(e, 'adminCreatePost_failed');
    return reply.code(500).send({ error: { message: 'db_error' } });
  }
};

/* =========================
 * UPDATE (PUT /admin/blog_posts/:id)
 * ========================= */
export const adminUpdatePost: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  try {
    const parsed = blogUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: { message: 'invalid_body', detail: parsed.error.flatten() },
      });
    }

    const patchIn = parsed.data;

    // slug: explicit > title-derived
    const slug = patchIn.slug?.trim() ?? (patchIn.title ? slugify(patchIn.title) : undefined);

    // publish/unpublish -> published_at yönetimi
    let published_at: Date | null | undefined = patchIn.published_at ?? undefined;

    if (patchIn.is_published === true && patchIn.published_at === undefined) {
      published_at = nowIf(true);
    }
    if (patchIn.is_published === false && patchIn.published_at === undefined) {
      published_at = null;
    }

    // asset_id > featured_image > undefined (no change)
    const nextAssetId =
      patchIn.featured_image_asset_id === undefined
        ? undefined
        : patchIn.featured_image_asset_id ?? null;

    const nextUrl =
      nextAssetId !== undefined
        ? await resolveAssetUrl(nextAssetId)
        : patchIn.featured_image === undefined
        ? undefined
        : patchIn.featured_image ?? null;

    const updated = await updateBlogPost(req.params.id, {
      title: patchIn.title,
      slug,
      excerpt: patchIn.excerpt ?? null,
      content: patchIn.content,
      category: patchIn.category === undefined ? undefined : patchIn.category ?? null,

      featured_image: nextUrl,
      featured_image_asset_id: nextAssetId,
      featured_image_alt:
        patchIn.featured_image_alt === undefined ? undefined : patchIn.featured_image_alt ?? null,

      author: patchIn.author ?? null,
      meta_title: patchIn.meta_title ?? null,
      meta_description: patchIn.meta_description ?? null,

      is_published: patchIn.is_published === undefined ? undefined : to01(patchIn.is_published),
      published_at,

      is_featured: patchIn.is_featured === undefined ? undefined : to01(patchIn.is_featured),

      updated_at: new Date(),
    });

    if (!updated) return reply.code(404).send({ error: { message: 'not_found' } });
    return reply.send(updated);
  } catch (e: any) {
    if (e?.code === 'ER_DUP_ENTRY') {
      return reply.code(409).send({ error: { message: 'duplicate_slug' } });
    }
    req.log.error(e, 'adminUpdatePost_failed');
    return reply.code(500).send({ error: { message: 'db_error' } });
  }
};

/* =====================================
 * TOGGLE PUBLISH (PATCH /admin/blog_posts/:id/publish)
 * ===================================== */
export const adminTogglePublish: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  try {
    const parsed = publishToggleSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: { message: 'invalid_body', detail: parsed.error.flatten() },
      });
    }

    const is_published = parsed.data.is_published;

    const patched = await updateBlogPost(req.params.id, {
      is_published: to01(is_published),
      published_at: is_published ? new Date() : null,
      updated_at: new Date(),
    });

    if (!patched) return reply.code(404).send({ error: { message: 'not_found' } });
    return reply.send(patched);
  } catch (e) {
    (req as any).log?.error(e, 'adminTogglePublish_failed');
    return reply.code(500).send({ error: { message: 'db_error' } });
  }
};

/* ============================
 * DELETE (DELETE /admin/blog_posts/:id)
 * ============================ */
export const adminDeletePost: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  try {
    const exists = await getBlogPostById(req.params.id);
    if (!exists) return reply.code(404).send({ error: { message: 'not_found' } });

    await deleteBlogPost(req.params.id);
    return reply.code(204).send();
  } catch (e) {
    (req as any).log?.error(e, 'adminDeletePost_failed');
    return reply.code(500).send({ error: { message: 'db_error' } });
  }
};

/* ========================================
 * REORDER (POST /admin/blog_posts/reorder) — NO-OP
 * ======================================== */
const reorderSchema = z.object({
  items: z.array(z.object({ id: z.string().min(1), display_order: z.number().int() })),
});

export const adminReorderPosts: RouteHandler = async (req, reply) => {
  try {
    const parsed = reorderSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: { message: 'invalid_body', detail: parsed.error.flatten() },
      });
    }
    return reply.send({ ok: true });
  } catch (e) {
    (req as any).log?.error(e, 'adminReorderPosts_failed');
    return reply.code(500).send({ error: { message: 'db_error' } });
  }
};
