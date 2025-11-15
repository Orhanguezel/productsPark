// src/modules/faqs/repository.ts
// ===================================================================

import { db } from "@/db/client";
import { faqs, type FaqRow, type NewFaqRow } from "./schema";
import { and, asc, desc, eq, like, or, sql, type SQL } from "drizzle-orm";

/** güvenilir sıralama kolonları */
type Sortable = "created_at" | "updated_at" | "display_order";

export type ListParams = {
  orderParam?: string;
  sort?: Sortable;
  order?: "asc" | "desc";
  limit?: number;
  offset?: number;

  // dışarıdan 0/1/string gelebilir, içeride boolean'a çevireceğiz
  is_active?: boolean | 0 | 1 | "0" | "1" | "true" | "false";
  q?: string;
  slug?: string;
  category?: string;
};

const toBoolMaybe = (v: ListParams["is_active"]): boolean | undefined => {
  if (v === true || v === 1 || v === "1" || v === "true") return true;
  if (v === false || v === 0 || v === "0" || v === "false") return false;
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
    if (col && dir && (col === "created_at" || col === "updated_at" || col === "display_order")) {
      return { col, dir };
    }
  }
  if (sort && ord) return { col: sort, dir: ord };
  return null;
};

export async function listFaqs(params: ListParams) {
  try {
    const filters: SQL[] = [];

    const active = toBoolMaybe(params.is_active);
    if (active !== undefined) {
      filters.push(eq(faqs.is_active, active)); // 👈 boolean bekler
    }

    if (params.slug && params.slug.trim()) {
      filters.push(eq(faqs.slug, params.slug.trim()));
    }
    if (params.category && params.category.trim()) {
      filters.push(eq(faqs.category, params.category.trim()));
    }
    if (params.q && params.q.trim()) {
      const s = `%${params.q.trim()}%`;
      filters.push(
        or(
          like(faqs.question, s),
          like(faqs.slug, s),
          like(faqs.category, s),
          like(faqs.answer as unknown as any, s), // LONGTEXT LIKE
        ) as SQL
      );
    }

    const whereExpr: SQL | undefined = filters.length ? (and(...filters) as SQL) : undefined;

    const ord = parseOrder(params.orderParam, params.sort, params.order);
    const sortColMap = {
      created_at: faqs.created_at,
      updated_at: faqs.updated_at,
      display_order: faqs.display_order,
    } as const;

    const orderBy = ord
      ? ord.dir === "asc" ? asc(sortColMap[ord.col]) : desc(sortColMap[ord.col])
      : asc(faqs.display_order);

    const take = params.limit && params.limit > 0 ? params.limit : 50;
    const skip = params.offset && params.offset >= 0 ? params.offset : 0;

    const [items, cnt] = await Promise.all([
      db.select().from(faqs).where(whereExpr).orderBy(orderBy).limit(take).offset(skip),
      db.select({ c: sql<number>`COUNT(1)` }).from(faqs).where(whereExpr),
    ]);

    const total = cnt[0]?.c ?? 0;
    return { items, total };
  } catch {
    throw new Error("faqs_list_failed");
  }
}

export async function getFaqById(id: string) {
  const rows = await db.select().from(faqs).where(eq(faqs.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getFaqBySlug(slug: string) {
  const rows = await db.select().from(faqs).where(eq(faqs.slug, slug)).limit(1);
  return rows[0] ?? null;
}

export async function createFaq(values: NewFaqRow) {
  await db.insert(faqs).values(values);
  return getFaqById(values.id);
}

export async function updateFaq(id: string, patch: Partial<NewFaqRow>) {
  await db
    .update(faqs)
    .set({ ...patch, updated_at: new Date() })
    .where(eq(faqs.id, id));
  return getFaqById(id);
}

export async function deleteFaq(id: string): Promise<number> {
  const res = await db.delete(faqs).where(eq(faqs.id, id)).execute();

  // Drizzle MySQL için: OkPacket veya OkPacket[]
  const packet = Array.isArray(res) ? res[0] : res;

  const affected =
    packet && typeof (packet as any).affectedRows === "number"
      ? (packet as any).affectedRows
      : 0;

  return affected;
}

