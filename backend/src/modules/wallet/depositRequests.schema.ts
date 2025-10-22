import {
  mysqlTable, varchar, text, decimal, timestamp,
} from 'drizzle-orm/mysql-core';

export const walletDepositRequests = mysqlTable('wallet_deposit_requests', {
  id: varchar('id', { length: 36 }).primaryKey().notNull(),
  user_id: varchar('user_id', { length: 36 }).notNull(), // FK: auth.users(id)
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  payment_method: text('payment_method').notNull(),
  status: text('status').default('pending'),
  proof_image_url: text('proof_image_url'),
  admin_note: text('admin_note'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow().onUpdateNow(),
});
