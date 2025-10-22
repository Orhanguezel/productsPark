import {
  mysqlTable, varchar, text, timestamp, uniqueIndex,
} from 'drizzle-orm/mysql-core';

/**
 * app_role enum'unu MariaDB'de TEXT ile temsil ediyoruz (minimum şart).
 * İstersen ENUM tanımlayıp strict'e çekebiliriz.
 */
export const userRoles = mysqlTable('user_roles', {
  id: varchar('id', { length: 36 }).primaryKey().notNull(),
  user_id: varchar('user_id', { length: 36 }).notNull(), // FK: auth.users(id)
  role: text('role').notNull().default('user'),
  created_at: timestamp('created_at').defaultNow(),
}, (t) => ({
  uxUserRole: uniqueIndex('ux_user_roles_user_id_role').on(t.user_id, t.role),
}));



