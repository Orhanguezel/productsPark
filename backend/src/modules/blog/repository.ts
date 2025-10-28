// src/modules/blog/repository.ts
import { db } from "@/db/client";
import { blogPosts, type BlogPostRow, type NewBlogPostRow } from "./schema";
import { and, asc, desc, eq, like, or, sql, type SQL } from "drizzle-orm";

/** Sadece izin verdiğimiz sıralama kolonları (tip güvenliği için) */
type Sortable = "created_at" | "updated_at" | "published_at";

export type ListParams = {
  orderParam?: string;               // "created_at.desc"
  sort?: Sortable;                   // alternatif
  order?: "asc" | "desc";
  limit?: number;
  offset?: number;

  is_published?: boolean | 0 | 1 | "0" | "1" | "true" | "false";
  q?: string;
  slug?: string;
};

const to01 = (v: ListParams["is_published"]): 0 | 1 | undefined => {
  if (v === true || v === 1 || v === "1" || v === "true") return 1;
  if (v === false || v === 0 || v === "0" || v === "false") return 0;
  return undefined;
};

const parseOrder = (
  orderParam?: string,
  sort?: ListParams["sort"],
  ord?: ListParams["order"],
): { col: Sortable; dir: "asc" | "desc" } | null => {
  if (orderParam) {
    const m = orderParam.match(/^([a-zA-Z0-9_]+)\.(asc|desc)$/);
    const col = m?.[1] as Sortable | undefined;
    const dir = m?.[2] as "asc" | "desc" | undefined;
    if (col && dir && ["created_at", "updated_at", "published_at"].includes(col)) {
      return { col, dir };
    }
  }
  if (sort && ord) return { col: sort, dir: ord };
  return null;
};

export async function listBlogPosts(params: ListParams) {
  const whereParts: SQL[] = [];

  const pub = to01(params.is_published);
  if (pub !== undefined) whereParts.push(eq(blogPosts.is_published, pub));
  if (params.slug) whereParts.push(eq(blogPosts.slug, params.slug));

  if (params.q && params.q.trim()) {
    const s = `%${params.q.trim()}%`;
    const titleLike: SQL   = like(blogPosts.title, s);
    const excerptLike: SQL = like(blogPosts.excerpt, s);
    const authorLike: SQL  = like(blogPosts.author, s);
    // or(...) sonucunu açıkça SQL'e daralt
    const searchCond: SQL  = or(titleLike, excerptLike, authorLike) as SQL;
    whereParts.push(searchCond);
  }

  // ✅ TERNARY KULLANMA: önce default ata, sonra gerekirse and(...) ile değiştir
  let whereSQL: SQL = sql`1=1`;
  if (whereParts.length > 0) {
    whereSQL = and(...whereParts) as SQL;
  }

  const ord = parseOrder(params.orderParam, params.sort, params.order);
  const sortMap = {
    created_at: blogPosts.created_at,
    updated_at: blogPosts.updated_at,
    published_at: blogPosts.published_at,
  } as const;

  const orderBy =
    ord != null
      ? ord.dir === "asc"
        ? asc(sortMap[ord.col])
        : desc(sortMap[ord.col])
      : desc(blogPosts.created_at);

  const take = params.limit && params.limit > 0 ? params.limit : 50;
  const skip = params.offset && params.offset >= 0 ? params.offset : 0;

  const [items, cnt] = await Promise.all([
    db.select().from(blogPosts).where(whereSQL).orderBy(orderBy).limit(take).offset(skip),
    db.select({ c: sql<number>`COUNT(1)` }).from(blogPosts).where(whereSQL),
  ]);

  const total = cnt[0]?.c ?? 0;
  return { items, total };
}

export async function getBlogPostById(id: string) {
  const rows = await db.select().from(blogPosts).where(eq(blogPosts.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getBlogPostBySlug(slug: string) {
  const rows = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug)).limit(1);
  return rows[0] ?? null;
}

export async function createBlogPost(values: NewBlogPostRow) {
  // MySQL: returning() yok → ekle ve sonra oku
  await db.insert(blogPosts).values(values);
  return getBlogPostById(values.id);
}

export async function updateBlogPost(id: string, patch: Partial<NewBlogPostRow>) {
  await db
    .update(blogPosts)
    .set({ ...patch, updated_at: new Date() })
    .where(eq(blogPosts.id, id));
  return getBlogPostById(id);
}

export async function deleteBlogPost(id: string) {
  const res = await db.delete(blogPosts).where(eq(blogPosts.id, id)).execute();
  const affected =
    typeof (res as unknown as { affectedRows?: number }).affectedRows === "number"
      ? (res as unknown as { affectedRows: number }).affectedRows
      : 0;
  return affected;
}
