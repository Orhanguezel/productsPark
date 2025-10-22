import {
  mysqlTable, varchar, text, json, timestamp,
} from 'drizzle-orm/mysql-core';

export const productOptions = mysqlTable('product_options', {
  id: varchar('id', { length: 36 }).primaryKey().notNull(),
  product_id: varchar('product_id', { length: 36 }).notNull(), // FK: products.id
  option_name: text('option_name').notNull(),
  option_values: json('option_values').$type<string[]>().notNull(), // TEXT[] -> JSON
  created_at: timestamp('created_at').defaultNow(),
});
