import { sql } from 'drizzle-orm';
import {
  mysqlTable,
  char,
  varchar,
  text,
  tinyint,
  datetime,
  index,
  uniqueIndex,
} from 'drizzle-orm/mysql-core';

export const blogPosts = mysqlTable(
  'blog_posts',
  {
    id: char('id', { length: 36 }).primaryKey().notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull(),
    excerpt: varchar('excerpt', { length: 500 }),
    content: text('content').notNull(),

    // ✅ NEW
    category: varchar('category', { length: 120 }), // nullable

    /** Eski alan (URL) – GERİYE DÖNÜK UYUMLULUK */
    featured_image: varchar('featured_image', { length: 500 }),

    /** Yeni alanlar: storage ile bağ */
    featured_image_asset_id: char('featured_image_asset_id', { length: 36 }),
    featured_image_alt: varchar('featured_image_alt', { length: 255 }),

    author: varchar('author', { length: 100 }),
    meta_title: varchar('meta_title', { length: 255 }),
    meta_description: varchar('meta_description', { length: 500 }),
    is_published: tinyint('is_published').notNull().default(0),
    is_featured: tinyint('is_featured').notNull().default(0),
    published_at: datetime('published_at'),
    created_at: datetime('created_at', { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime('updated_at', { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .$onUpdateFn(() => new Date()),
  },
  (t) => [
    uniqueIndex('blog_posts_slug_uq').on(t.slug),
    index('blog_posts_created_idx').on(t.created_at),
    index('blog_posts_published_idx').on(t.published_at),
    index('blog_posts_is_published_idx').on(t.is_published),
    index('blog_posts_featured_asset_idx').on(t.featured_image_asset_id),
    index('blog_posts_is_featured_idx').on(t.is_featured),

    // ✅ NEW
    index('blog_posts_category_idx').on(t.category),
  ],
);

export type BlogPostRow = typeof blogPosts.$inferSelect;
export type NewBlogPostRow = typeof blogPosts.$inferInsert;

/** 🔧 Geriye dönük uyumluluk için alias (snake_case kullanan eski import’lar için) */
export { blogPosts as blog_posts };
