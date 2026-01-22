// -------------------------------------------------------------
// FILE: src/modules/blog/controller.ts
// FINAL — Blog Controller (list/get/getBySlug/create/update/delete)
// -------------------------------------------------------------
import type { RouteHandler } from 'fastify';
import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';

import {
  listBlogPosts,
  getBlogPostById,
  getBlogPostBySlug,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
} from './repository';

import { db } from '@/db/client';
import { storageAssets } from '@/modules/storage/schema';
import { env } from '@/core/env';

/* ---------------- types ---------------- */

type ListQuery = {
  order?: string;
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

type CreateBody = {
  title: string;
  slug?: string;
  excerpt?: string | null;
  content: string;
  category?: string | null;

  featured_image?: string | null; // URL
  featured_image_asset_id?: string | null; // storage id
  featured_image_alt?: string | null;

  author?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;

  is_published?: boolean;
  published_at?: string | null;

  is_featured?: boolean;
};

type PatchBody = Partial<CreateBody>;

/* ---------------- helpers ---------------- */

const to01 = (v: unknown): 0 | 1 => (v === true || v === 1 || v === '1' || v === 'true' ? 1 : 0);

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

const slugifyLoose = (s: string) =>
  s
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036F]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/* ---------------- handlers ---------------- */

export const listPosts: RouteHandler<{ Querystring: ListQuery }> = async (req, reply) => {
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

export const getPost: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  const row = await getBlogPostById(req.params.id);
  if (!row) return reply.code(404).send({ error: { message: 'not_found' } });
  return reply.send(row);
};


export const getPostBySlug: RouteHandler<{ Params: { slug: string } }> = async (req, reply) => {
  const row = await getBlogPostBySlug(req.params.slug);
  if (!row) return reply.code(404).send({ error: { message: 'not_found' } });
  return reply.send(row);
};

export const getPostBySlugHandler: RouteHandler<{ Params: { slug: string } }> = async (
  req,
  reply,
) => {
  const row = await getBlogPostBySlug(req.params.slug);
  if (!row) return reply.code(404).send({ error: { message: 'not_found' } });
  return reply.send(row);
};

export const createPost: RouteHandler<{ Body: CreateBody }> = async (req, reply) => {
  const b = req.body;

  if (!b?.title || !b?.content) {
    return reply.code(400).send({ error: { message: 'missing_required_fields' } });
  }

  const slug = (b.slug && b.slug.trim()) || slugifyLoose(b.title);

  const assetUrl = await resolveAssetUrl(b.featured_image_asset_id ?? null);
  const finalUrl = assetUrl ?? b.featured_image ?? null;

  const publishedAt = b.published_at ? new Date(b.published_at) : null;
  const isPublished = !!b.is_published;

  const row = await createBlogPost({
    id: randomUUID(),
    title: b.title,
    slug,
    excerpt: b.excerpt ?? null,
    content: b.content,
    category: b.category ? String(b.category).trim() || null : null,

    featured_image: finalUrl,
    featured_image_asset_id: b.featured_image_asset_id ?? null,
    featured_image_alt: b.featured_image_alt ?? null,

    author: b.author ?? null,
    meta_title: b.meta_title ?? null,
    meta_description: b.meta_description ?? null,

    is_published: to01(isPublished),
    published_at: publishedAt ?? (isPublished ? new Date() : null),

    is_featured: to01(!!b.is_featured),

    created_at: new Date(),
    updated_at: new Date(),
  });

  return reply.code(201).send(row);
};

export const updatePost: RouteHandler<{ Params: { id: string }; Body: PatchBody }> = async (
  req,
  reply,
) => {
  const b = req.body ?? {};

  const nextAssetId =
    b.featured_image_asset_id === undefined ? undefined : b.featured_image_asset_id ?? null;

  const nextUrl =
    nextAssetId !== undefined
      ? await resolveAssetUrl(nextAssetId)
      : b.featured_image === undefined
      ? undefined
      : b.featured_image ?? null;

  const published_at =
    b.published_at === undefined ? undefined : b.published_at ? new Date(b.published_at) : null;

  const patched = await updateBlogPost(req.params.id, {
    title: b.title,
    slug: b.slug,

    excerpt: b.excerpt ?? null,
    content: b.content,
    category:
      b.category === undefined ? undefined : b.category ? String(b.category).trim() || null : null,

    featured_image: nextUrl,
    featured_image_asset_id: nextAssetId,
    featured_image_alt:
      b.featured_image_alt === undefined ? undefined : b.featured_image_alt ?? null,

    author: b.author ?? null,
    meta_title: b.meta_title ?? null,
    meta_description: b.meta_description ?? null,

    is_published: typeof b.is_published === 'boolean' ? to01(b.is_published) : undefined,
    published_at,

    is_featured: typeof b.is_featured === 'boolean' ? to01(b.is_featured) : undefined,

    updated_at: new Date(),
  });

  if (!patched) return reply.code(404).send({ error: { message: 'not_found' } });
  return reply.send(patched);
};

export const deletePost: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  const affected = await deleteBlogPost(req.params.id);
  if (!affected) return reply.code(404).send({ error: { message: 'not_found' } });
  return reply.code(204).send();
};
