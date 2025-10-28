import { db } from "@/db/client";
import { footerSections, type FooterSectionRow, type NewFooterSectionRow } from "./schema";
import { and, asc, desc, eq, like, sql, type SQL } from "drizzle-orm";

export type ListParams = {
  q?: string;                 // title araması
  limit?: number;
  offset?: number;
  order?: "asc" | "desc";     // order_num yönü
};

export async function listFooterSections(params: ListParams) {
  const whereParts: SQL[] = [];

  if (params.q && params.q.trim()) {
    const s = `%${params.q.trim()}%`;
    whereParts.push(like(footerSections.title, s));
  }

  let whereSQL: SQL = sql`1=1`;

  const take = params.limit && params.limit > 0 ? params.limit : 100;
  const skip = params.offset && params.offset >= 0 ? params.offset : 0;

  const orderBy =
    (params.order ?? "asc") === "asc"
      ? [asc(footerSections.order_num), asc(footerSections.created_at)]
      : [desc(footerSections.order_num), desc(footerSections.created_at)];

  const [items, cnt] = await Promise.all([
    db.select().from(footerSections).where(whereSQL).orderBy(...orderBy).limit(take).offset(skip),
    db.select({ c: sql<number>`COUNT(1)` }).from(footerSections).where(whereSQL),
  ]);

  return { items, total: cnt[0]?.c ?? 0 };
}

export async function getFooterSectionById(id: string) {
  const rows = await db.select().from(footerSections).where(eq(footerSections.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function createFooterSection(values: NewFooterSectionRow) {
  await db.insert(footerSections).values(values);
  return getFooterSectionById(values.id);
}

export async function updateFooterSection(id: string, patch: Partial<NewFooterSectionRow>) {
  await db.update(footerSections).set({ ...patch, updated_at: new Date() }).where(eq(footerSections.id, id));
  return getFooterSectionById(id);
}

export async function deleteFooterSection(id: string) {
  const res = await db.delete(footerSections).where(eq(footerSections.id, id)).execute();
  const affected =
    typeof (res as unknown as { affectedRows?: number }).affectedRows === "number"
      ? (res as unknown as { affectedRows: number }).affectedRows
      : 0;
  return affected;
}
