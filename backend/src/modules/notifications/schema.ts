// ===================================================================
// FILE: src/modules/notifications/schema.ts
// FINAL — Notifications schema (DB: tinyint 0/1, app: helper Bool01)
// ===================================================================

import { mysqlTable, char, varchar, text, datetime, index, tinyint } from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

export type Bool01 = 0 | 1;

export const notifications = mysqlTable(
  'notifications',
  {
    id: char('id', { length: 36 }).primaryKey().notNull(),
    user_id: char('user_id', { length: 36 }).notNull(),

    title: varchar('title', { length: 255 }).notNull(),
    message: text('message').notNull(),
    type: varchar('type', { length: 50 }).notNull(),

    // DB: 0/1
    is_read: tinyint('is_read').notNull().default(0),

    created_at: datetime('created_at', { mode: 'date' })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    userIdx: index('idx_notifications_user_id').on(table.user_id),
    userReadIdx: index('idx_notifications_user_read').on(table.user_id, table.is_read),
  }),
);

export type NotificationRow = typeof notifications.$inferSelect;
export type NotificationInsert = typeof notifications.$inferInsert;

/**
 * Bildirim türleri için tavsiye edilen enum.
 * DB tarafında serbest string; burada union ile DX kolaylaştırıyoruz.
 */
export type NotificationType =
  | 'order_created'
  | 'order_paid'
  | 'order_failed'
  | 'system'
  | 'custom'
  | (string & {});
