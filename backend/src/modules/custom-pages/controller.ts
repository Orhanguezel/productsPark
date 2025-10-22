import type { RouteHandler } from 'fastify';
import { randomUUID } from 'crypto';
import { db } from '@/db/client';
import { and, desc, eq, isNull, like, ne, sql } from 'drizzle-orm';
import {
  custom_pages,
  custom_page_revisions,
  type CustomPageInsert,
  type CustomPageRevisionInsert,
} from './schema';
import {
  customPageCreateSchema,
  customPageUpdateSchema,
} from './validation';

const now = () => new Date();

function getAuthUserId(req: any): string {
  const sub = req.user?.sub ?? req.user?.id ?? null;
  if (!sub) throw new Error('unauthorized');
  return String(sub);
}

// ---- helpers ----
function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    // türkçe karakterler için kabaca normalize
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

async function ensureSlugUnique(baseSlug: string, excludeId?: string): Promise<string> {
  let slug = baseSlug;
  let n = 1;
  // slug var mı kontrol et
  // (soft delete’lerde biz slug’ı “~deleted-xxxx” ile değiştiriyoruz; o yüzden uniq kontrolümüz net)
  while (true) {
    const rows = await db
      .select({ id: custom_pages.id })
      .from(custom_pages)
      .where(excludeId
        ? and(eq(custom_pages.slug, slug), ne(custom_pages.id, excludeId))
        : eq(custom_pages.slug, slug)
      )
      .limit(1);
    if (!rows.length) break;
    n += 1;
    slug = `${baseSlug}-${n}`;
  }
  return slug;
}

function toJsonText(v: unknown): string {
  if (typeof v === 'string') { JSON.parse(v); return v; }
  return JSON.stringify(v ?? {});
}

function fromJsonText<T = any>(s: string | null | undefined): T | null {
  if (!s) return null;
  try { return JSON.parse(s) as T; } catch { return null; }
}

// snapshot (revision) kaydı
async function createRevisionSnapshot(
  page: {
    id: string;
    title: string;
    slug: string;
    content: string;
    meta_title: string | null;
    meta_description: string | null;
    is_published: number;
  },
  editor_user_id?: string | null,
) {
  const [last] = await db
    .select({ version: custom_page_revisions.version })
    .from(custom_page_revisions)
    .where(eq(custom_page_revisions.page_id, page.id))
    .orderBy(desc(custom_page_revisions.version))
    .limit(1);

  const nextVer = (last?.version ?? 0) + 1;

  const revision: CustomPageRevisionInsert = {
    id: randomUUID(),
    page_id: page.id,
    version: nextVer,
    title: page.title,
    slug: page.slug,
    content: page.content,
    meta_title: page.meta_title,
    meta_description: page.meta_description,
    is_published: page.is_published,
    editor_user_id: editor_user_id ?? null,
    created_at: now(),
  };
  await db.insert(custom_page_revisions).values(revision);
  return nextVer;
}

/** ---------- PUBLIC ROUTES ---------- **/

// GET /pages → yayınlanmış & silinmemiş sayfalar
export const listPublishedPages: RouteHandler = async (req, reply) => {
  try {
    const q = (req.query as any)?.q as string | undefined;

    const where = q
      ? and(eq(custom_pages.is_published, 1), isNull(custom_pages.deleted_at), like(custom_pages.title, `%${q}%`))
      : and(eq(custom_pages.is_published, 1), isNull(custom_pages.deleted_at));

    const rows = await db.select().from(custom_pages).where(where).orderBy(desc(custom_pages.created_at));

    const shaped = rows.map((r) => ({
      id: r.id,
      title: r.title,
      slug: r.slug,
      meta_title: r.meta_title ?? null,
      meta_description: r.meta_description ?? null,
      created_at: r.created_at,
      updated_at: r.updated_at,
      is_published: r.is_published,
    }));

    return reply.send(shaped);
  } catch (e: any) {
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'pages_list_failed' } });
  }
};

// GET /pages/:slug → yayınlanmış & silinmemiş
export const getPublishedPageBySlug: RouteHandler = async (req, reply) => {
  const { slug } = req.params as { slug: string };
  try {
    const [row] = await db
      .select()
      .from(custom_pages)
      .where(and(eq(custom_pages.slug, slug), eq(custom_pages.is_published, 1), isNull(custom_pages.deleted_at)))
      .limit(1);

    if (!row) return reply.code(404).send({ error: { message: 'not_found' } });

    return reply.send({ ...row, content: fromJsonText(row.content) });
  } catch (e: any) {
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'page_get_failed' } });
  }
};

/** ---------- ADMIN ROUTES (auth gerekli) ---------- **/

// GET /custom_pages → tüm sayfalar (varsayılan: silinmemiş)
// query: q, is_published, include_deleted=1
export const listCustomPages: RouteHandler = async (req, reply) => {
  try {
    getAuthUserId(req);
    const { q, is_published, include_deleted } = (req.query as any) || {};
    const clauses: any[] = [];

    if (!include_deleted) clauses.push(isNull(custom_pages.deleted_at));
    if (typeof is_published !== 'undefined') {
      const val = String(is_published) === '1' ? 1 : 0;
      clauses.push(eq(custom_pages.is_published, val));
    }
    if (q) clauses.push(like(custom_pages.title, `%${q}%`));

    const where = clauses.length
      ? (clauses.length === 1 ? clauses[0] : (and as any)(...clauses))
      : undefined;

    const rows = await db.select().from(custom_pages).where(where).orderBy(desc(custom_pages.created_at));

    const shaped = rows.map((r) => ({ ...r, content: fromJsonText(r.content) }));
    return reply.send(shaped);
  } catch (e: any) {
    if (e?.message === 'unauthorized') return reply.code(401).send({ error: { message: 'unauthorized' } });
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'custom_pages_list_failed' } });
  }
};

// GET /custom_pages/:id
export const getCustomPage: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  try {
    getAuthUserId(req);
    const [row] = await db.select().from(custom_pages).where(eq(custom_pages.id, id)).limit(1);
    if (!row) return reply.code(404).send({ error: { message: 'not_found' } });
    return reply.send({ ...row, content: fromJsonText(row.content) });
  } catch (e: any) {
    if (e?.message === 'unauthorized') return reply.code(401).send({ error: { message: 'unauthorized' } });
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'custom_page_get_failed' } });
  }
};

// POST /custom_pages
export const createCustomPage: RouteHandler = async (req, reply) => {
  try {
    const userId = getAuthUserId(req);
    const input = customPageCreateSchema.parse(req.body || {});
    const id = randomUUID();

    let slug = input.slug && !input.auto_slug ? input.slug : slugifyTitle(input.title);
    slug = await ensureSlugUnique(slug);

    const isPub = typeof input.is_published === 'boolean' ? (input.is_published ? 1 : 0) : Number(input.is_published ?? 0);

    const toInsert: CustomPageInsert = {
      id,
      title: input.title,
      slug,
      content: toJsonText(input.content),
      meta_title: input.meta_title ?? null,
      meta_description: input.meta_description ?? null,
      is_published: isPub,
      created_at: now(),
      updated_at: now(),
      deleted_at: null,
    };

    await db.insert(custom_pages).values(toInsert);

    // v1 snapshot
    await createRevisionSnapshot(
      {
        id,
        title: toInsert.title,
        slug: toInsert.slug,
        content: toInsert.content,
        meta_title: toInsert.meta_title ?? null,
        meta_description: toInsert.meta_description ?? null,
        is_published: toInsert.is_published ?? 0,
      },
      userId,
    );

    const [row] = await db.select().from(custom_pages).where(eq(custom_pages.id, id)).limit(1);
    return reply.code(201).send({ ...row, content: fromJsonText(row.content) });
  } catch (e: any) {
    if (e?.name === 'ZodError')
      return reply.code(400).send({ error: { message: 'validation_error', details: e.issues } });
    if (e?.message === 'unauthorized')
      return reply.code(401).send({ error: { message: 'unauthorized' } });

    // uniq slug ihlalinde MySQL hatası dönebilir:
    if (String(e?.message || '').includes('ux_custom_pages_slug'))
      return reply.code(409).send({ error: { message: 'slug_exists' } });

    req.log.error(e);
    return reply.code(500).send({ error: { message: 'custom_page_create_failed' } });
  }
};

// PATCH /custom_pages/:id
export const updateCustomPage: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  try {
    const userId = getAuthUserId(req);
    const patch = customPageUpdateSchema.parse(req.body || {});

    const [row] = await db.select().from(custom_pages).where(eq(custom_pages.id, id)).limit(1);
    if (!row) return reply.code(404).send({ error: { message: 'not_found' } });

    // slug belirleme
    let newSlug: string | undefined = patch.slug;
    if (patch.auto_slug || (!patch.slug && patch.title)) {
      const base = slugifyTitle(patch.title ?? row.title);
      newSlug = await ensureSlugUnique(base, id);
    } else if (patch.slug) {
      newSlug = await ensureSlugUnique(patch.slug, id);
    }

    const updateData: Partial<CustomPageInsert> = {
      updated_at: now(),
    };
    if (patch.title !== undefined) updateData.title = patch.title;
    if (newSlug !== undefined) updateData.slug = newSlug;
    if (patch.content !== undefined) updateData.content = toJsonText(patch.content);
    if (patch.meta_title !== undefined) updateData.meta_title = patch.meta_title ?? null;
    if (patch.meta_description !== undefined) updateData.meta_description = patch.meta_description ?? null;
    if (patch.is_published !== undefined) {
      updateData.is_published =
        typeof patch.is_published === 'boolean' ? (patch.is_published ? 1 : 0) : Number(patch.is_published);
    }

    await db.update(custom_pages).set(updateData).where(eq(custom_pages.id, id));

    const [updated] = await db.select().from(custom_pages).where(eq(custom_pages.id, id)).limit(1);
    if (!updated) return reply.code(404).send({ error: { message: 'not_found' } });

    // yeni snapshot (post-update state)
    await createRevisionSnapshot(
      {
        id: updated.id,
        title: updated.title,
        slug: updated.slug,
        content: updated.content,
        meta_title: updated.meta_title ?? null,
        meta_description: updated.meta_description ?? null,
        is_published: updated.is_published ?? 0,
      },
      userId,
    );

    return reply.send({ ...updated, content: fromJsonText(updated.content) });
  } catch (e: any) {
    if (e?.name === 'ZodError')
      return reply.code(400).send({ error: { message: 'validation_error', details: e.issues } });
    if (e?.message === 'unauthorized')
      return reply.code(401).send({ error: { message: 'unauthorized' } });
    if (String(e?.message || '').includes('ux_custom_pages_slug'))
      return reply.code(409).send({ error: { message: 'slug_exists' } });
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'custom_page_update_failed' } });
  }
};

// DELETE /custom_pages/:id → SOFT DELETE
export const softDeleteCustomPage: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  try {
    getAuthUserId(req);

    const [row] = await db.select().from(custom_pages).where(eq(custom_pages.id, id)).limit(1);
    if (!row) return reply.code(404).send({ error: { message: 'not_found' } });
    if (row.deleted_at) return reply.code(204).send();

    // slug’ı serbest bırakmak için benzersiz bir suffix ile değiştir
    const tombstoneSlug = `${row.slug}~deleted-${row.id.slice(0, 8)}`;

    await db
      .update(custom_pages)
      .set({ deleted_at: now(), slug: tombstoneSlug, updated_at: now() })
      .where(eq(custom_pages.id, id));

    return reply.code(204).send();
  } catch (e: any) {
    if (e?.message === 'unauthorized')
      return reply.code(401).send({ error: { message: 'unauthorized' } });
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'custom_page_soft_delete_failed' } });
  }
};

// POST /custom_pages/:id/restore → soft-delete’i geri al
export const restoreCustomPage: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  try {
    const userId = getAuthUserId(req);

    const [row] = await db.select().from(custom_pages).where(eq(custom_pages.id, id)).limit(1);
    if (!row) return reply.code(404).send({ error: { message: 'not_found' } });
    if (!row.deleted_at) return reply.code(200).send({ ...row, content: fromJsonText(row.content) });

    // orijinal slug büyük ihtimalle row.slug’ın tombstone öncesi halidir.
    // tombstone pattern: "{original}~deleted-xxxxxxxx"
    const originalPart = row.slug.split('~deleted-')[0];
    const targetSlug = await ensureSlugUnique(originalPart, id);

    await db
      .update(custom_pages)
      .set({ deleted_at: null, slug: targetSlug, updated_at: now() })
      .where(eq(custom_pages.id, id));

    const [restored] = await db.select().from(custom_pages).where(eq(custom_pages.id, id)).limit(1);

    // restore sonrası da snapshot alabiliriz (opsiyonel):
    await createRevisionSnapshot(
      {
        id: restored!.id,
        title: restored!.title,
        slug: restored!.slug,
        content: restored!.content,
        meta_title: restored!.meta_title ?? null,
        meta_description: restored!.meta_description ?? null,
        is_published: restored!.is_published ?? 0,
      },
      userId,
    );

    return reply.send({ ...restored, content: fromJsonText(restored!.content) });
  } catch (e: any) {
    if (e?.message === 'unauthorized')
      return reply.code(401).send({ error: { message: 'unauthorized' } });
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'custom_page_restore_failed' } });
  }
};

// GET /custom_pages/:id/versions → liste
export const listRevisions: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  try {
    getAuthUserId(req);
    const rows = await db
      .select({
        version: custom_page_revisions.version,
        created_at: custom_page_revisions.created_at,
        editor_user_id: custom_page_revisions.editor_user_id,
        title: custom_page_revisions.title,
        slug: custom_page_revisions.slug,
        is_published: custom_page_revisions.is_published,
      })
      .from(custom_page_revisions)
      .where(eq(custom_page_revisions.page_id, id))
      .orderBy(desc(custom_page_revisions.version));

    return reply.send(rows);
  } catch (e: any) {
    if (e?.message === 'unauthorized')
      return reply.code(401).send({ error: { message: 'unauthorized' } });
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'revisions_list_failed' } });
  }
};

// GET /custom_pages/:id/versions/:version → tek revision içeriği
export const getRevision: RouteHandler = async (req, reply) => {
  const { id, version } = req.params as { id: string; version: string };
  try {
    getAuthUserId(req);
    const vno = Number(version);
    const [rev] = await db
      .select()
      .from(custom_page_revisions)
      .where(and(eq(custom_page_revisions.page_id, id), eq(custom_page_revisions.version, vno)))
      .limit(1);
    if (!rev) return reply.code(404).send({ error: { message: 'not_found' } });

    return reply.send({
      ...rev,
      content: fromJsonText(rev.content),
    });
  } catch (e: any) {
    if (e?.message === 'unauthorized')
      return reply.code(401).send({ error: { message: 'unauthorized' } });
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'revision_get_failed' } });
  }
};

// POST /custom_pages/:id/versions/:version/restore → belirtilen sürüme geri dön
export const restoreToRevision: RouteHandler = async (req, reply) => {
  const { id, version } = req.params as { id: string; version: string };
  try {
    const userId = getAuthUserId(req);
    const vno = Number(version);

    const [rev] = await db
      .select()
      .from(custom_page_revisions)
      .where(and(eq(custom_page_revisions.page_id, id), eq(custom_page_revisions.version, vno)))
      .limit(1);
    if (!rev) return reply.code(404).send({ error: { message: 'not_found' } });

    const [row] = await db.select().from(custom_pages).where(eq(custom_pages.id, id)).limit(1);
    if (!row) return reply.code(404).send({ error: { message: 'not_found' } });

    // slug çakışmasın:
    const safeSlug = await ensureSlugUnique(rev.slug, id);

    await db
      .update(custom_pages)
      .set({
        title: rev.title,
        slug: safeSlug,
        content: rev.content,
        meta_title: rev.meta_title,
        meta_description: rev.meta_description,
        is_published: rev.is_published,
        updated_at: now(),
        // deleted_at'ı dokunmuyoruz (zaten aktif olması beklenir)
      })
      .where(eq(custom_pages.id, id));

    const [updated] = await db.select().from(custom_pages).where(eq(custom_pages.id, id)).limit(1);

    // yeni bir snapshot daha (restore edilmiş hal)
    await createRevisionSnapshot(
      {
        id: updated!.id,
        title: updated!.title,
        slug: updated!.slug,
        content: updated!.content,
        meta_title: updated!.meta_title ?? null,
        meta_description: updated!.meta_description ?? null,
        is_published: updated!.is_published ?? 0,
      },
      userId,
    );

    return reply.send({ ...updated, content: fromJsonText(updated!.content) });
  } catch (e: any) {
    if (e?.message === 'unauthorized')
      return reply.code(401).send({ error: { message: 'unauthorized' } });
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'revision_restore_failed' } });
  }
};
