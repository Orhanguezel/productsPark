// src/modules/blog/controller.ts
import type { RouteHandler } from 'fastify';
import { randomUUID } from 'crypto';
import { db } from '@/db/client';
import { and, desc, eq, isNull, like, or, sql } from 'drizzle-orm';
import {
  blog_posts,
  blog_post_revisions,
  type BlogPostInsert,
  type BlogPostRevisionInsert,
} from './schema';
import {
  blogCreateSchema,
  blogUpdateSchema,
  blogPublishSchema,
  blogUnpublishSchema,
  blogRestoreSchema,
  blogRevertSchema,
} from './validation';

// ⬇️ EK: DB/Transaction ortak tipi
import type { MySql2Database } from 'drizzle-orm/mysql2';
import type { MySqlTransaction } from 'drizzle-orm/mysql-core';
type AnyTx = MySqlTransaction<any, any, any, any>;
type DbLike = MySql2Database<any> | AnyTx;

const now = () => new Date();

// TR uyumlu slug
function slugifyTR(str: string) {
  const map: Record<string, string> = {
    ç: 'c', Ç: 'c',
    ğ: 'g', Ğ: 'g',
    ı: 'i', I: 'i', İ: 'i',
    ö: 'o', Ö: 'o',
    ş: 's', Ş: 's',
    ü: 'u', Ü: 'u',
  };
  const replaced = str
    .replace(/[çÇğĞıİöÖşŞüÜ]/g, (m) => map[m] || m)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '');
  return replaced
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

// benzersiz slug (soft-delete edilmişleri hariç tut)
async function ensureUniqueSlug(base: string, excludeId?: string) {
  const likeExpr = `${base}-%`;
  const rows = await db
    .select({ id: blog_posts.id, slug: blog_posts.slug })
    .from(blog_posts)
    .where(
      and(
        or(eq(blog_posts.slug, base), like(blog_posts.slug, likeExpr as any)),
        isNull(blog_posts.deleted_at),
      ),
    );

  const used = new Set(rows.filter(r => !excludeId || r.id !== excludeId).map(r => r.slug));
  if (!used.has(base)) return base;

  let n = 2;
  while (used.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

// ⬇️ GÜNCELLEME: tx parametresi DbLike (DB veya Transaction)
async function nextRevisionNo(postId: string, tx: DbLike = db) {
  const rows = await tx
    .select()
    .from(blog_post_revisions)
    .where(eq(blog_post_revisions.post_id, postId))
    .orderBy(desc(blog_post_revisions.revision_no))
    .limit(1);
  const last = rows[0]?.revision_no ?? 0;
  return last + 1;
}

// ⬇️ GÜNCELLEME: tx parametresi DbLike (DB veya Transaction)
async function writeSnapshot(
  tx: DbLike,
  post: any,
  reason: string,
) {
  const rev: BlogPostRevisionInsert = {
    id: randomUUID(),
    post_id: post.id,
    revision_no: await nextRevisionNo(post.id, tx),
    reason,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt ?? null,
    content: post.content,
    featured_image: post.featured_image ?? null,
    author: post.author ?? null,
    meta_title: post.meta_title ?? null,
    meta_description: post.meta_description ?? null,
    is_published: post.is_published ?? 0,
    published_at: post.published_at ?? null,
    deleted_at: post.deleted_at ?? null,
    created_at: now(),
  };
  await tx.insert(blog_post_revisions).values(rev);
}

// --------- LIST
// GET /blog_posts?q=&published=1&page=1&limit=20&include_deleted=0
export const listPosts: RouteHandler = async (req, reply) => {
  try {
    const q = (req.query as any)?.q as string | undefined;
    const publishedParam = (req.query as any)?.published as string | undefined;
    const includeDeleted = (req.query as any)?.include_deleted as string | undefined;
    const page = Math.max(1, Number((req.query as any)?.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number((req.query as any)?.limit ?? 20)));
    const offset = (page - 1) * limit;

    const parts: any[] = [];
    if (!includeDeleted || includeDeleted === '0' || includeDeleted === 'false') {
      parts.push(isNull(blog_posts.deleted_at));
    }
    if (q) {
      parts.push(
        or(
          like(blog_posts.title, `%${q}%` as any),
          like(blog_posts.excerpt, `%${q}%` as any),
          like(blog_posts.author, `%${q}%` as any),
        )
      );
    }
    if (publishedParam === '1' || publishedParam === 'true') {
      parts.push(eq(blog_posts.is_published, 1 as any));
    } else if (publishedParam === '0' || publishedParam === 'false') {
      parts.push(eq(blog_posts.is_published, 0 as any));
    }
    const where = parts.length ? (parts.length === 1 ? parts[0] : and(...parts as any)) : undefined;

    const rows = await db
      .select()
      .from(blog_posts)
      .where(where as any)
      .orderBy(desc(blog_posts.published_at), desc(blog_posts.updated_at))
      .limit(limit)
      .offset(offset);

    return reply.send({ page, limit, count: rows.length, items: rows });
  } catch (e: any) {
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'blog_list_failed' } });
  }
};

// --------- GET BY ID (default: deleted hariç)
export const getPost: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  const includeDeleted = (req.query as any)?.include_deleted as string | undefined;
  try {
    const where = and(
      eq(blog_posts.id, id),
      (!includeDeleted || includeDeleted === '0' || includeDeleted === 'false')
        ? isNull(blog_posts.deleted_at)
        : sql`1=1`,
    );
    const [row] = await db.select().from(blog_posts).where(where).limit(1);
    if (!row) return reply.code(404).send({ error: { message: 'not_found' } });
    return reply.send(row);
  } catch (e: any) {
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'blog_get_failed' } });
  }
};

// --------- GET BY SLUG (public; deleted hariç)
export const getPostBySlug: RouteHandler = async (req, reply) => {
  const { slug } = req.params as { slug: string };
  try {
    const [row] = await db.select()
      .from(blog_posts)
      .where(and(eq(blog_posts.slug, slug), isNull(blog_posts.deleted_at)))
      .limit(1);
    if (!row) return reply.code(404).send({ error: { message: 'not_found' } });
    return reply.send(row);
  } catch (e: any) {
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'blog_get_failed' } });
  }
};

// --------- CREATE
export const createPost: RouteHandler = async (req, reply) => {
  try {
    const input = blogCreateSchema.parse(req.body || {});
    const id = randomUUID();

    const baseSlug = slugifyTR(input.slug || input.title);
    const finalSlug = await ensureUniqueSlug(baseSlug);

    const willPublish = !!input.is_published;
    const publishedAt = willPublish ? (input.published_at ?? now()) : null;

    await db.transaction(async (tx) => {
      const toInsert: BlogPostInsert = {
        id,
        title: input.title,
        slug: finalSlug,
        excerpt: input.excerpt ?? null,
        content: input.content,
        featured_image: input.featured_image ?? null,
        author: input.author ?? null,
        meta_title: input.meta_title ?? null,
        meta_description: input.meta_description ?? null,
        is_published: (willPublish ? 1 : 0) as any,
        published_at: publishedAt,
        created_at: now(),
        updated_at: now(),
        deleted_at: null,
      };
      await tx.insert(blog_posts).values(toInsert);

      // snapshot (create)
      const [created] = await tx.select().from(blog_posts).where(eq(blog_posts.id, id)).limit(1);
      await writeSnapshot(tx, created, input.revision_reason || 'create');
    });

    const [row] = await db.select().from(blog_posts).where(eq(blog_posts.id, id)).limit(1);
    return reply.code(201).send(row);
  } catch (e: any) {
    if (String(e?.message || '').includes('ux_blog_posts_slug')) {
      return reply.code(409).send({ error: { message: 'slug_exists' } });
    }
    if (e?.name === 'ZodError') {
      return reply.code(400).send({ error: { message: 'validation_error', details: e.issues } });
    }
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'blog_create_failed' } });
  }
};

// --------- UPDATE
export const updatePost: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  try {
    const patch = blogUpdateSchema.parse(req.body || {});

    await db.transaction(async (tx) => {
      const [current] = await tx.select().from(blog_posts).where(eq(blog_posts.id, id)).limit(1);
      if (!current || current.deleted_at) {
        return reply.code(404).send({ error: { message: 'not_found' } });
      }

      // snapshot (before update)
      await writeSnapshot(tx, current, patch.revision_reason || 'update');

      // slug aklı
      let finalSlug = current.slug;
      if (typeof patch.slug === 'string' && patch.slug.trim()) {
        finalSlug = await ensureUniqueSlug(slugifyTR(patch.slug), id);
      } else if (typeof patch.title === 'string' && patch.title.trim() && !patch.slug) {
        const base = slugifyTR(patch.title);
        finalSlug = current.slug === base ? current.slug : await ensureUniqueSlug(base, id);
      }

      // publish alanları
      let isPublished = current.is_published as unknown as number;
      let publishedAt = current.published_at ?? null;
      if (patch.is_published !== undefined) {
        isPublished = patch.is_published ? 1 : 0;
        if (isPublished && !publishedAt) {
          publishedAt = patch.published_at ?? now();
        }
        if (!isPublished) publishedAt = null;
      } else if (patch.published_at !== undefined) {
        publishedAt = patch.published_at;
      }

      await tx.update(blog_posts).set({
        title: patch.title ?? current.title,
        slug: finalSlug,
        excerpt: patch.excerpt ?? current.excerpt,
        content: patch.content ?? current.content,
        featured_image: patch.featured_image ?? current.featured_image,
        author: patch.author ?? current.author,
        meta_title: patch.meta_title ?? current.meta_title,
        meta_description: patch.meta_description ?? current.meta_description,
        is_published: isPublished as any,
        published_at: publishedAt,
        updated_at: now(),
      }).where(eq(blog_posts.id, id));
    });

    const [updated] = await db.select().from(blog_posts).where(eq(blog_posts.id, id)).limit(1);
    return reply.send(updated);
  } catch (e: any) {
    if (String(e?.message || '').includes('ux_blog_posts_slug')) {
      return reply.code(409).send({ error: { message: 'slug_exists' } });
    }
    if (e?.name === 'ZodError') {
      return reply.code(400).send({ error: { message: 'validation_error', details: e.issues } });
    }
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'blog_update_failed' } });
  }
};

// --------- SOFT DELETE
export const deletePost: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  try {
    await db.transaction(async (tx) => {
      const [current] = await tx.select().from(blog_posts).where(eq(blog_posts.id, id)).limit(1);
      if (!current || current.deleted_at) {
        return reply.code(404).send({ error: { message: 'not_found' } });
      }

      // snapshot (before delete)
      await writeSnapshot(tx, current, 'delete');

      const suffix = current.id.slice(0, 8);
      const deletedSlug = `${current.slug}--deleted--${suffix}`;

      await tx.update(blog_posts).set({
        deleted_at: now(),
        slug: deletedSlug,
        updated_at: now(),
      }).where(eq(blog_posts.id, id));
    });

    return reply.code(204).send();
  } catch (e: any) {
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'blog_delete_failed' } });
  }
};

// --------- RESTORE
export const restorePost: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  try {
    const input = blogRestoreSchema.parse(req.body || {});
    await db.transaction(async (tx) => {
      const [current] = await tx.select().from(blog_posts).where(eq(blog_posts.id, id)).limit(1);
      if (!current || !current.deleted_at) {
        return reply.code(404).send({ error: { message: 'not_found' } });
      }

      // snapshot (before restore)
      await writeSnapshot(tx, current, input.revision_reason || 'restore');

      let candidate =
        (input.slug && slugifyTR(input.slug))
        || current.slug.replace(/--deleted--[a-f0-9-]+$/i, '')
        || slugifyTR(current.title);

      candidate = await ensureUniqueSlug(candidate, id);

      await tx.update(blog_posts).set({
        slug: candidate,
        deleted_at: null,
        updated_at: now(),
      }).where(eq(blog_posts.id, id));
    });

    const [row] = await db.select().from(blog_posts).where(eq(blog_posts.id, id)).limit(1);
    return reply.send(row);
  } catch (e: any) {
    if (String(e?.message || '').includes('ux_blog_posts_slug')) {
      return reply.code(409).send({ error: { message: 'slug_exists' } });
    }
    if (e?.name === 'ZodError') {
      return reply.code(400).send({ error: { message: 'validation_error', details: e.issues } });
    }
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'blog_restore_failed' } });
  }
};

// --------- PUBLISH
export const publishPost: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  try {
    const { published_at, revision_reason } = blogPublishSchema.parse(req.body || {});
    await db.transaction(async (tx) => {
      const [row] = await tx.select().from(blog_posts).where(eq(blog_posts.id, id)).limit(1);
      if (!row || row.deleted_at) return reply.code(404).send({ error: { message: 'not_found' } });

      await writeSnapshot(tx, row, revision_reason || 'publish');

      await tx.update(blog_posts).set({
        is_published: 1 as any,
        published_at: published_at ?? now(),
        updated_at: now(),
      }).where(eq(blog_posts.id, id));
    });

    const [updated] = await db.select().from(blog_posts).where(eq(blog_posts.id, id)).limit(1);
    return reply.send(updated);
  } catch (e: any) {
    if (e?.name === 'ZodError') {
      return reply.code(400).send({ error: { message: 'validation_error', details: e.issues } });
    }
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'blog_publish_failed' } });
  }
};

// --------- UNPUBLISH
export const unpublishPost: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  try {
    const { revision_reason } = blogUnpublishSchema.parse(req.body || {});
    await db.transaction(async (tx) => {
      const [row] = await tx.select().from(blog_posts).where(eq(blog_posts.id, id)).limit(1);
      if (!row || row.deleted_at) return reply.code(404).send({ error: { message: 'not_found' } });

      await writeSnapshot(tx, row, revision_reason || 'unpublish');

      await tx.update(blog_posts).set({
        is_published: 0 as any,
        published_at: null,
        updated_at: now(),
      }).where(eq(blog_posts.id, id));
    });

    const [updated] = await db.select().from(blog_posts).where(eq(blog_posts.id, id)).limit(1);
    return reply.send(updated);
  } catch (e: any) {
    if (e?.name === 'ZodError') {
      return reply.code(400).send({ error: { message: 'validation_error', details: e.issues } });
    }
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'blog_unpublish_failed' } });
  }
};

// --------- REVISIONS: LIST
export const listRevisions: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  try {
    const rows = await db
      .select()
      .from(blog_post_revisions)
      .where(eq(blog_post_revisions.post_id, id))
      .orderBy(desc(blog_post_revisions.revision_no));
    return reply.send(rows);
  } catch (e: any) {
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'blog_revisions_list_failed' } });
  }
};

// --------- REVISIONS: GET ONE
export const getRevision: RouteHandler = async (req, reply) => {
  const { id, revNo } = req.params as { id: string; revNo: string };
  try {
    const no = Number(revNo);
    const [row] = await db
      .select()
      .from(blog_post_revisions)
      .where(and(eq(blog_post_revisions.post_id, id), eq(blog_post_revisions.revision_no, no)))
      .limit(1);
    if (!row) return reply.code(404).send({ error: { message: 'not_found' } });
    return reply.send(row);
  } catch (e: any) {
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'blog_revision_get_failed' } });
  }
};

// --------- REVISIONS: REVERT
export const revertToRevision: RouteHandler = async (req, reply) => {
  const { id, revNo } = req.params as { id: string; revNo: string };
  try {
    const input = blogRevertSchema.parse(req.body || {});
    await db.transaction(async (tx) => {
      const no = Number(revNo);
      const [rev] = await tx
        .select()
        .from(blog_post_revisions)
        .where(and(eq(blog_post_revisions.post_id, id), eq(blog_post_revisions.revision_no, no)))
        .limit(1);
      if (!rev) return reply.code(404).send({ error: { message: 'revision_not_found' } });

      const [current] = await tx.select().from(blog_posts).where(eq(blog_posts.id, id)).limit(1);
      if (!current) return reply.code(404).send({ error: { message: 'not_found' } });

      // snapshot (before revert)
      await writeSnapshot(tx, current, input.reason || `revert->${no}`);

      const desiredSlug = rev.slug;
      const finalSlug = await ensureUniqueSlug(desiredSlug, id);

      await tx.update(blog_posts).set({
        title: rev.title,
        slug: finalSlug,
        excerpt: rev.excerpt ?? null,
        content: rev.content,
        featured_image: rev.featured_image ?? null,
        author: rev.author ?? null,
        meta_title: rev.meta_title ?? null,
        meta_description: rev.meta_description ?? null,
        is_published: rev.is_published as any,
        published_at: rev.published_at ?? null,
        deleted_at: rev.deleted_at ?? null,
        updated_at: now(),
      }).where(eq(blog_posts.id, id));
    });

    const [updated] = await db.select().from(blog_posts).where(eq(blog_posts.id, id)).limit(1);
    return reply.send(updated);
  } catch (e: any) {
    if (String(e?.message || '').includes('ux_blog_posts_slug')) {
      return reply.code(409).send({ error: { message: 'slug_exists' } });
    }
    if (e?.name === 'ZodError') {
      return reply.code(400).send({ error: { message: 'validation_error', details: e.issues } });
    }
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'blog_revision_revert_failed' } });
  }
};
