// src/modules/blog/schema.ts

import { sql } from "drizzle-orm";
import {
  mysqlTable, char, varchar, text, tinyint, datetime, index, uniqueIndex
} from "drizzle-orm/mysql-core";

export const blogPosts = mysqlTable(
  "blog_posts",
  {
    id: char("id", { length: 36 }).primaryKey().notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull(),
    excerpt: varchar("excerpt", { length: 500 }),
    content: text("content").notNull(),
    featured_image: varchar("featured_image", { length: 500 }),
    author: varchar("author", { length: 100 }),
    meta_title: varchar("meta_title", { length: 255 }),
    meta_description: varchar("meta_description", { length: 500 }),
    is_published: tinyint("is_published").notNull().default(0),
    published_at: datetime("published_at"),
    created_at: datetime("created_at", { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime("updated_at", { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`).$onUpdateFn(() => new Date()),
  },
  (t) => [
    uniqueIndex("blog_posts_slug_uq").on(t.slug),
    index("blog_posts_created_idx").on(t.created_at),
    index("blog_posts_published_idx").on(t.published_at),
    index("blog_posts_is_published_idx").on(t.is_published),
  ],
);

export type BlogPostRow = typeof blogPosts.$inferSelect;
export type NewBlogPostRow = typeof blogPosts.$inferInsert;

/** 🔧 Geriye dönük uyumluluk için alias (snake_case kullanan eski import’lar için) */
export { blogPosts as blog_posts };
