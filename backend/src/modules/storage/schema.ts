import {
  mysqlTable,
  char,
  varchar,
  text,
  int,
  bigint,
  json,
  datetime,
  uniqueIndex,
  index,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

/** storage_assets — tenantsiz */
export const storageAssets = mysqlTable(
  "storage_assets",
  {
    id: char("id", { length: 36 }).notNull().primaryKey(),
    user_id: char("user_id", { length: 36 }),

    name: varchar("name", { length: 255 }).notNull(),
    bucket: varchar("bucket", { length: 64 }).notNull(),
    path: varchar("path", { length: 512 }).notNull(),
    folder: varchar("folder", { length: 255 }),

    mime: varchar("mime", { length: 127 }).notNull(),
    size: bigint("size", { mode: "number", unsigned: true }).notNull(),

    width: int("width", { unsigned: true }),
    height: int("height", { unsigned: true }),

    /** Provider absolute URL (Cloudinary secure_url) */
    url: text("url"),
    /** Opsiyonel hash */
    hash: varchar("hash", { length: 64 }),

    metadata: json("metadata").$type<Record<string, string> | null>().default(null),

    created_at: datetime("created_at", { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime("updated_at", { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`),
  },
  (t) => ({
    uniq_bucket_path: uniqueIndex("uniq_bucket_path").on(t.bucket, t.path),
    idx_bucket: index("idx_storage_bucket").on(t.bucket),
    idx_folder: index("idx_storage_folder").on(t.folder),
    idx_created: index("idx_storage_created").on(t.created_at),
  })
);

export type StorageAsset = typeof storageAssets.$inferSelect;
export type NewStorageAsset = typeof storageAssets.$inferInsert;
