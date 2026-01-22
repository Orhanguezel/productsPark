// =============================================================
// FILE: src/modules/wallet/schema.ts
// FINAL — Drizzle schema
// =============================================================

import {
  mysqlTable,
  char,
  varchar,
  decimal,
  text,
  datetime,
  mysqlEnum,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';
import { WALLET_DEPOSIT_STATUS, WALLET_TXN_TYPES } from './wallet.types';

export const walletDepositRequests = mysqlTable('wallet_deposit_requests', {
  id: char('id', { length: 36 }).primaryKey().notNull(),
  userId: char('user_id', { length: 36 }).notNull(),

  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  paymentMethod: varchar('payment_method', { length: 50 }).notNull(),
  paymentProof: varchar('payment_proof', { length: 500 }),

  status: mysqlEnum('status', WALLET_DEPOSIT_STATUS).notNull().default('pending'),
  adminNotes: text('admin_notes'),
  processedAt: datetime('processed_at', { fsp: 3 }),

  createdAt: datetime('created_at', { fsp: 3 })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP(3)`),

  updatedAt: datetime('updated_at', { fsp: 3 })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP(3)`)
    .$onUpdateFn(() => sql`CURRENT_TIMESTAMP(3)`),
});

export const walletTransactions = mysqlTable('wallet_transactions', {
  id: char('id', { length: 36 }).primaryKey().notNull(),
  userId: char('user_id', { length: 36 }).notNull(),

  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  type: mysqlEnum('type', WALLET_TXN_TYPES).notNull(),

  description: varchar('description', { length: 500 }),
  orderId: char('order_id', { length: 36 }),

  createdAt: datetime('created_at', { fsp: 3 })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP(3)`),
});

export type WalletDepositRequestRow = typeof walletDepositRequests.$inferSelect;
export type WalletTransactionRow = typeof walletTransactions.$inferSelect;
