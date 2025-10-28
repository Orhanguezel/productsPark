import {
  mysqlTable,
  char,
  varchar,
  text,
  datetime,
  uniqueIndex,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

export const email_templates = mysqlTable(
  'email_templates',
  {
    id: char('id', { length: 36 }).primaryKey().notNull(),
    name: varchar('name', { length: 100 }).notNull(),
    subject: varchar('subject', { length: 255 }).notNull(),
    body: text('body').notNull(),
    // DB tarafında LONGTEXT + CHECK JSON_VALID(variables)
    // Drizzle'da text kullanıyoruz; uygulama katmanı JSON string garanti edecek.
    variables: text('variables'), // JSON string (string[]), nullable
    created_at: datetime('created_at', { fsp: 0 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updated_at: datetime('updated_at', { fsp: 0 }).notNull(),
  },
  (t) => ({
    // İstersen uniq tut: schema'da zorunlu değil; varsa çakışmayı 409 döndürüyoruz.
    uxName: uniqueIndex('ux_email_templates_name').on(t.name),
  }),
);

export type EmailTemplateRow = typeof email_templates.$inferSelect;
export type EmailTemplateInsert = typeof email_templates.$inferInsert;
