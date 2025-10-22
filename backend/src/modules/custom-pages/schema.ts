import {
  mysqlTable,
  char,
  varchar,
  text,
  tinyint,
  datetime,
  uniqueIndex,
  int,
  index,
} from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

export const custom_pages = mysqlTable(
  'custom_pages',
  {
    id: char('id', { length: 36 }).primaryKey().notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull(),
    // LONGTEXT + CHECK JSON_VALID(content) DB tarafında; burada text kolonuna yazarız.
    content: text('content').notNull(),
    meta_title: varchar('meta_title', { length: 255 }),
    meta_description: varchar('meta_description', { length: 500 }),
    is_published: tinyint('is_published', { unsigned: true }).notNull().default(0),

    created_at: datetime('created_at', { fsp: 0 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updated_at: datetime('updated_at', { fsp: 0 }).notNull(),
    // Soft-delete için:
    deleted_at: datetime('deleted_at', { fsp: 0 }),
  },
  (t) => ({
    uxSlug: uniqueIndex('ux_custom_pages_slug').on(t.slug),
    ixDeletedAt: index('ix_custom_pages_deleted_at').on(t.deleted_at),
  }),
);

export const custom_page_revisions = mysqlTable(
  'custom_page_revisions',
  {
    id: char('id', { length: 36 }).primaryKey().notNull(),
    page_id: char('page_id', { length: 36 }).notNull(),
    version: int('version', { unsigned: true }).notNull(),

    title: varchar('title', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull(),
    content: text('content').notNull(),
    meta_title: varchar('meta_title', { length: 255 }),
    meta_description: varchar('meta_description', { length: 500 }),
    is_published: tinyint('is_published', { unsigned: true }).notNull().default(0),

    // opsiyonel: düzenleyen kullanıcıyı izlemek istersen:
    editor_user_id: char('editor_user_id', { length: 36 }),

    created_at: datetime('created_at', { fsp: 0 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => ({
    uxPageVersion: uniqueIndex('ux_page_version').on(t.page_id, t.version),
    ixPage: index('ix_cpr_page_id').on(t.page_id),
  }),
);

export const customPagesRelations = relations(custom_pages, ({ many }) => ({
  revisions: many(custom_page_revisions),
}));

export const revisionsRelations = relations(custom_page_revisions, ({}) => ({}));

export type CustomPageRow = typeof custom_pages.$inferSelect;
export type CustomPageInsert = typeof custom_pages.$inferInsert;

export type CustomPageRevisionRow = typeof custom_page_revisions.$inferSelect;
export type CustomPageRevisionInsert = typeof custom_page_revisions.$inferInsert;
