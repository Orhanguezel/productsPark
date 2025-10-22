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
import { sql } from 'drizzle-orm';

export const blog_posts = mysqlTable(
  'blog_posts',
  {
    id: char('id', { length: 36 }).primaryKey().notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull(),
    excerpt: varchar('excerpt', { length: 500 }),
    content: text('content').notNull(),
    featured_image: varchar('featured_image', { length: 500 }),
    author: varchar('author', { length: 100 }),
    meta_title: varchar('meta_title', { length: 255 }),
    meta_description: varchar('meta_description', { length: 500 }),
    is_published: tinyint('is_published').notNull().default(0),
    published_at: datetime('published_at', { fsp: 0 }),
    created_at: datetime('created_at', { fsp: 0 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updated_at: datetime('updated_at', { fsp: 0 }).notNull(),
    // SOFT DELETE
    deleted_at: datetime('deleted_at', { fsp: 0 }),
  },
  (t) => ({
    // aktif kayıtlar için benzersiz slug kısıtı sürsün; soft-delete'te slug'ı serbest bırakıyoruz
    uxSlug: uniqueIndex('ux_blog_posts_slug').on(t.slug),
    ixDeletedAt: index('ix_blog_posts_deleted_at').on(t.deleted_at),
    ixPublishedAt: index('ix_blog_posts_published_at').on(t.published_at),
  }),
);

export type BlogPostRow = typeof blog_posts.$inferSelect;
export type BlogPostInsert = typeof blog_posts.$inferInsert;

// ------- REVISIONS -------
// Her değişiklikte snapshot tutar.
export const blog_post_revisions = mysqlTable(
  'blog_post_revisions',
  {
    id: char('id', { length: 36 }).primaryKey().notNull(),
    post_id: char('post_id', { length: 36 }).notNull(),
    revision_no: int('revision_no').notNull(), // 1,2,3...
    reason: varchar('reason', { length: 255 }), // 'create' | 'update' | 'publish' | 'unpublish' | 'delete' | 'restore' | 'revert'

    // snapshot fields
    title: varchar('title', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull(),
    excerpt: varchar('excerpt', { length: 500 }),
    content: text('content').notNull(),
    featured_image: varchar('featured_image', { length: 500 }),
    author: varchar('author', { length: 100 }),
    meta_title: varchar('meta_title', { length: 255 }),
    meta_description: varchar('meta_description', { length: 500 }),
    is_published: tinyint('is_published').notNull().default(0),
    published_at: datetime('published_at', { fsp: 0 }),
    deleted_at: datetime('deleted_at', { fsp: 0 }),

    created_at: datetime('created_at', { fsp: 0 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => ({
    ixPost: index('ix_blog_post_revisions_post').on(t.post_id),
    uxPostRev: uniqueIndex('ux_blog_post_revisions_post_rev').on(t.post_id, t.revision_no),
  }),
);

export type BlogPostRevisionRow = typeof blog_post_revisions.$inferSelect;
export type BlogPostRevisionInsert = typeof blog_post_revisions.$inferInsert;
