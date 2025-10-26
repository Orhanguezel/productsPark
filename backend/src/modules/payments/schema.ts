import {
  mysqlTable,
  char,
  varchar,
  tinyint,
  decimal,
  datetime,
  text,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

export const paymentProviders = mysqlTable('payment_providers', {
  id: char('id', { length: 36 }).primaryKey().notNull(),
  key: varchar('key', { length: 64 }).notNull(),
  displayName: varchar('display_name', { length: 128 }).notNull(),
  isActive: tinyint('is_active').notNull().default(1),

  // MariaDB/Drizzle JSON cast sorunlarına girmemek için TEXT tutuyoruz.
  // (İçeriği controller’da JSON.parse ile objeye çeviriyoruz.)
  publicConfig: text('public_config'),

  createdAt: datetime('created_at', { fsp: 3 })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP(3)`),
  updatedAt: datetime('updated_at', { fsp: 3 })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP(3)`),
});

export const paymentRequests = mysqlTable('payment_requests', {
  id: char('id', { length: 36 }).primaryKey().notNull(),
  orderId: char('order_id', { length: 36 }).notNull(),
  userId: char('user_id', { length: 36 }),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 10 }).notNull().default('TRY'),
  paymentMethod: varchar('payment_method', { length: 50 }).notNull(),
  paymentProof: varchar('payment_proof', { length: 500 }),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  adminNotes: text('admin_notes'),
  processedAt: datetime('processed_at', { fsp: 3 }),
  createdAt: datetime('created_at', { fsp: 3 })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP(3)`),
  updatedAt: datetime('updated_at', { fsp: 3 })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP(3)`),
});

export const paymentSessions = mysqlTable('payment_sessions', {
  id: char('id', { length: 36 }).primaryKey().notNull(),
  providerKey: varchar('provider_key', { length: 64 }).notNull(),
  orderId: char('order_id', { length: 36 }),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 10 }).notNull().default('TRY'),
  status: varchar('status', { length: 32 }).notNull(),
  clientSecret: varchar('client_secret', { length: 255 }),
  iframeUrl: varchar('iframe_url', { length: 500 }),
  redirectUrl: varchar('redirect_url', { length: 500 }),

  // ⬇ JSON yerine TEXT — insert’te CAST(JSON) hatasını bitirir.
  extra: text('extra'),

  createdAt: datetime('created_at', { fsp: 3 })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP(3)`),
  updatedAt: datetime('updated_at', { fsp: 3 })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP(3)`),
});
