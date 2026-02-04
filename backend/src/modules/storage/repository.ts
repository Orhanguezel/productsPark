// src/modules/storage/repository.ts
import { and, asc, desc, eq, inArray, like, sql as dsql } from 'drizzle-orm';
import { db } from '@/db/client';
import { storageAssets } from './schema';
import type { StorageListQuery } from './validation';

/** INSERT / UPDATE tipleri */
type StorageInsert = typeof storageAssets.$inferInsert;
type StorageUpdate = Partial<StorageInsert>;

/** MySQL dup guard */
export function isDup(err: unknown) {
  const e = err as { code?: unknown; errno?: unknown; cause?: any };
  const codes = [e?.code, e?.errno, e?.cause?.code, e?.cause?.errno];
  return codes.includes('ER_DUP_ENTRY') || codes.includes(1062);
}

/** WHERE */
function buildWhere(q: StorageListQuery) {
  return and(
    q.bucket ? eq(storageAssets.bucket, q.bucket) : dsql`1=1`,
    q.folder != null ? eq(storageAssets.folder, q.folder) : dsql`1=1`,
    q.mime ? like(storageAssets.mime, `${q.mime}%`) : dsql`1=1`,
    q.q ? like(storageAssets.name, `%${q.q}%`) : dsql`1=1`,
  );
}

/** ORDER */
const ORDER = {
  created_at: storageAssets.created_at,
  name: storageAssets.name,
  size: storageAssets.size,
} as const;

type OrderKey = keyof typeof ORDER;

function normalizeSortKey(v: unknown): OrderKey {
  if (typeof v !== 'string') return 'created_at';
  return v in ORDER ? (v as OrderKey) : 'created_at';
}

function parseOrder(q: StorageListQuery) {
  const sortKey = normalizeSortKey(q.sort);
  const order = q.order === 'asc' ? 'asc' : 'desc';
  return order === 'asc' ? asc(ORDER[sortKey]) : desc(ORDER[sortKey]);
}

/** List + count */
export async function listAndCount(q: StorageListQuery) {
  const where = buildWhere(q);

  const [{ total }] = await db
    .select({ total: dsql<number>`COUNT(*)` })
    .from(storageAssets)
    .where(where);

  const rows = await db
    .select()
    .from(storageAssets)
    .where(where)
    .orderBy(parseOrder(q))
    .limit(q.limit)
    .offset(q.offset);

  return { rows, total };
}

/** Tekil */
export async function getById(id: string) {
  const rows = await db.select().from(storageAssets).where(eq(storageAssets.id, id)).limit(1);
  return rows[0] ?? null;
}

/** Çoklu */
export async function getByIds(ids: string[]) {
  if (!ids.length) return [];
  return db.select().from(storageAssets).where(inArray(storageAssets.id, ids));
}

/** bucket+path */
export async function getByBucketPath(bucket: string, path: string) {
  const rows = await db
    .select()
    .from(storageAssets)
    .where(and(eq(storageAssets.bucket, bucket), eq(storageAssets.path, path)))
    .limit(1);
  return rows[0] ?? null;
}

/** ✅ INSERT — FULL MODEL (ZORUNLU ALANLAR VAR) */
export async function insert(values: StorageInsert) {
  await db.insert(storageAssets).values(values);
}

/** ✅ UPDATE — PARTIAL */
export async function updateById(id: string, sets: StorageUpdate) {
  await db.update(storageAssets).set(sets).where(eq(storageAssets.id, id));
}

/** Delete */
export async function deleteById(id: string) {
  await db.delete(storageAssets).where(eq(storageAssets.id, id));
}

export async function deleteManyByIds(ids: string[]) {
  if (!ids.length) return 0;
  await db.delete(storageAssets).where(inArray(storageAssets.id, ids));
  return ids.length;
}

/** Folder list */
export async function listFolders(): Promise<string[]> {
  const rows = await db
    .select({ folder: storageAssets.folder })
    .from(storageAssets)
    .where(dsql`${storageAssets.folder} IS NOT NULL`)
    .groupBy(storageAssets.folder);

  return rows.map((r) => (typeof r.folder === 'string' ? r.folder : '')).filter(Boolean);
}
