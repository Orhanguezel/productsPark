// src/modules/api_providers/schema.ts
import { mysqlTable, char, varchar, json, tinyint, datetime, index } from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

export type ApiProviderCredentials = {
  api_url?: string;
  api_key?: string;
  balance?: number;
  currency?: string;
  last_balance_check?: string; // ISO
  [k: string]: unknown;
};

export const apiProviders = mysqlTable(
  'api_providers',
  {
    id: char('id', { length: 36 }).primaryKey().notNull(),
    name: varchar('name', { length: 100 }).notNull(),
    type: varchar('type', { length: 50 }).notNull(),
    credentials: json('credentials').$type<ApiProviderCredentials>().notNull(),
    is_active: tinyint('is_active').notNull().default(1),
    created_at: datetime('created_at', { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime('updated_at', { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .$onUpdateFn(() => sql`CURRENT_TIMESTAMP(3)`), // <-- önemli
  },
  (t) => [
    index('api_providers_active_idx').on(t.is_active),
    index('api_providers_type_idx').on(t.type),
    index('api_providers_name_idx').on(t.name),
  ]
);

export type ApiProviderRow = typeof apiProviders.$inferSelect;
export type NewApiProviderRow = typeof apiProviders.$inferInsert;

export type ApiProviderView = {
  id: string;
  name: string;
  provider_type: string;
  api_url: string | null;
  api_key: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  credentials?: ApiProviderCredentials;
  // FE’nin doğrudan okuyabilmesi için üstte de expose edelim:
  balance?: number | null;
  currency?: string | null;
  last_balance_check?: string | null;
};
