import {
  mysqlTable, char, mysqlEnum, datetime, index, varchar
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const userRoles = mysqlTable(
  "user_roles",
  {
    id: char("id", { length: 36 }).primaryKey().notNull(),
    user_id: char("user_id", { length: 36 }).notNull(),
    role: mysqlEnum("role", ["admin", "moderator", "user"]).notNull().default("user"),
    created_at: datetime("created_at", { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  },
  (t) => [
    index("user_roles_user_id_idx").on(t.user_id),
    index("user_roles_role_idx").on(t.role),
  ]
);
