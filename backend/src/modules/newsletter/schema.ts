// ===================================================================
// FILE: src/modules/newsletter/schema.ts
// FINAL — Newsletter schema (Single Language)
// - locale removed
// ===================================================================

import {
  mysqlTable,
  char,
  varchar,
  boolean,
  datetime,
  text,
  index,
  uniqueIndex,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

export const newsletterSubscribers = mysqlTable(
  'newsletter_subscribers',
  {
    id: char('id', { length: 36 }).primaryKey().notNull(),

    email: varchar('email', { length: 255 }).notNull(),

    // Eski INewsletter.verified → is_verified
    is_verified: boolean('is_verified').notNull().default(false),

    // JSON string olarak saklıyoruz (FE tarafında parse edilir)
    meta: text('meta').notNull(),

    // Unsubscribe olunca dolan alan
    unsubscribed_at: datetime('unsubscribed_at', { fsp: 3 }),

    created_at: datetime('created_at', { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime('updated_at', { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .$onUpdateFn(() => new Date()),
  },
  (t) => [
    uniqueIndex('ux_newsletter_email').on(t.email),
    index('newsletter_verified_idx').on(t.is_verified),
    index('newsletter_unsub_idx').on(t.unsubscribed_at),
    index('newsletter_created_idx').on(t.created_at),
    index('newsletter_updated_idx').on(t.updated_at),
  ],
);

export type NewsletterRow = typeof newsletterSubscribers.$inferSelect;
export type NewsletterInsert = typeof newsletterSubscribers.$inferInsert;
