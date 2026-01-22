// src/modules/profiles/schema.ts

import { mysqlTable, char, varchar, text, datetime, foreignKey } from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';
import { users } from '@/modules/auth/schema';

/**
 * profiles.id = users.id (UUID)
 * Tüm alanlar opsiyonel.
 * NOT: wallet_balance BU TABLODA YOK (users tablosunda).
 */
export const profiles = mysqlTable(
  'profiles',
  {
    id: char('id', { length: 36 }).primaryKey().notNull(), // FK (users.id)

    full_name: text('full_name'),
    phone: varchar('phone', { length: 64 }),
    avatar_url: text('avatar_url'),

    address_line1: varchar('address_line1', { length: 255 }),
    address_line2: varchar('address_line2', { length: 255 }),
    city: varchar('city', { length: 128 }),
    country: varchar('country', { length: 128 }),
    postal_code: varchar('postal_code', { length: 32 }),

    // ---------------- social (optional) ----------------
    website_url: varchar('website_url', { length: 2048 }),
    instagram_url: varchar('instagram_url', { length: 2048 }),
    facebook_url: varchar('facebook_url', { length: 2048 }),
    x_url: varchar('x_url', { length: 2048 }), // Twitter/X
    linkedin_url: varchar('linkedin_url', { length: 2048 }),
    youtube_url: varchar('youtube_url', { length: 2048 }),
    tiktok_url: varchar('tiktok_url', { length: 2048 }),

    created_at: datetime('created_at', { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),

    updated_at: datetime('updated_at', { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .$onUpdateFn(() => new Date()),
  },
  (t) => [
    foreignKey({
      columns: [t.id],
      foreignColumns: [users.id],
      name: 'fk_profiles_id_users_id',
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
  ],
);

export type ProfileRow = typeof profiles.$inferSelect;
export type ProfileInsert = typeof profiles.$inferInsert;
