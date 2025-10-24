import { db } from "@/db/client";
import { customPages, type CustomPageRow, type NewCustomPageRow } from "./schema";
import { and, asc, desc, eq, like, or, sql, type SQL } from "drizzle-orm";

/** Sadece güvenilir sıralama kolonları */
type Sortable = "created_at" | "updated_at";

export type ListParams = {
  /** Supabase-benzeri: "created_at.desc" */
  orderParam?: string;
  /** Alternatif: sort & order */
  sort?: Sortable;
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
    if (col && dir && (col === "created_at" || col === "updated_at")) {
      return { col, dir };
    }
  }
  if (sort && ord) return { col: sort, dir: ord };
  return null;
};

/** JSON string saklayan content alanı için yardımcı */
export const packContent = (html: string): string => JSON.stringify({ html });

/** list */
export async function listCustomPages(params: ListParams) {
  try {
    const filters: SQL[] = [];

    const pub = to01(params.is_published);
    if (pub !== undefined) filters.push(eq(customPages.is_published, pub));

    if (params.slug && params.slug.trim()) {
      filters.push(eq(customPages.slug, params.slug.trim()));
    }

    if (params.q && params.q.trim()) {
      const s = `%${params.q.trim()}%`;
      // Not: meta_title/meta_description NULL olabilir; LIKE NULL false döner, sorun değil.
      const titleLike = like(customPages.title, s);
      const slugLike  = like(customPages.slug, s);
      const metaTitleLike = like(customPages.meta_title, s);
      const metaDescLike  = like(customPages.meta_description, s);
      filters.push(or(titleLike, slugLike, metaTitleLike, metaDescLike) as SQL);
    }

    // <-- HATA BURADAYDI: filters hiç uygulanmıyordu.
    const whereExpr: SQL | undefined = filters.length ? (and(...filters) as SQL) : undefined;

    const ord = parseOrder(params.orderParam, params.sort, params.order);
    const orderBy = ord
      ? ord.dir === "asc" ? asc(customPages[ord.col]) : desc(customPages[ord.col])
      : desc(customPages.created_at);

    const take = params.limit && params.limit > 0 ? params.limit : 50;
    const skip = params.offset && params.offset >= 0 ? params.offset : 0;

    const [items, cnt] = await Promise.all([
      db.select().from(customPages).where(whereExpr).orderBy(orderBy).limit(take).offset(skip),
      db.select({ c: sql<number>`COUNT(1)` }).from(customPages).where(whereExpr),
    ]);

    const total = cnt[0]?.c ?? 0;
    return { items, total };
  } catch (e) {
    // Controller üstünde yakalanıp 500 + sabit mesaj dönsün
    throw new Error("custom_pages_list_failed");
  }
}

/** get by id */
export async function getCustomPageById(id: string) {
  const rows = await db.select().from(customPages).where(eq(customPages.id, id)).limit(1);
  return rows[0] ?? null;
}

/** get by slug */
export async function getCustomPageBySlug(slug: string) {
  const rows = await db.select().from(customPages).where(eq(customPages.slug, slug)).limit(1);
  return rows[0] ?? null;
}

/** create */
export async function createCustomPage(values: NewCustomPageRow) {
  await db.insert(customPages).values(values);
  return getCustomPageById(values.id);
}

/** update */
export async function updateCustomPage(id: string, patch: Partial<NewCustomPageRow>) {
  await db
    .update(customPages)
    .set({ ...patch, updated_at: new Date() })
    .where(eq(customPages.id, id));
  return getCustomPageById(id);
}

/** delete (hard) */
export async function deleteCustomPage(id: string) {
  const res = await db.delete(customPages).where(eq(customPages.id, id)).execute();
  const affected =
    typeof (res as unknown as { affectedRows?: number }).affectedRows === "number"
      ? (res as unknown as { affectedRows: number }).affectedRows
      : 0;
  return affected;
}
