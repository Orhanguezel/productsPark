// =============================================================
// FILE: src/modules/popups/schema.ts
// =============================================================
import {
  mysqlTable,
  char,
  varchar,
  text,
  int,
  tinyint,
  datetime,
  index,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const popups = mysqlTable(
  "popups",
  {
    id: char("id", { length: 36 }).primaryKey().notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    content: text("content").notNull(),

    /** Eski alan (URL) – GERİYE DÖNÜK UYUMLULUK */
    image_url: varchar("image_url", { length: 500 }),

    /** Yeni alanlar: storage ile bağ */
    image_asset_id: char("image_asset_id", { length: 36 }),
    image_alt: varchar("image_alt", { length: 255 }),

    button_text: varchar("button_text", { length: 100 }),
    button_url: varchar("button_url", { length: 500 }),

    // TINYINT(1) → boolean
    is_active: tinyint("is_active").notNull().default(0).$type<boolean>(),
    show_once: tinyint("show_once").notNull().default(0).$type<boolean>(),

    // saniye cinsinden gecikme
    delay: int("delay").notNull().default(0),

    // null olabilir (kampanya takvimi)
    valid_from: datetime("valid_from", { fsp: 3 }),
    valid_until: datetime("valid_until", { fsp: 3 }),

    created_at: datetime("created_at", { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime("updated_at", { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .$onUpdateFn(() => new Date()),
  },
  (t) => [
    index("popups_active_idx").on(t.is_active),
    index("popups_valid_from_idx").on(t.valid_from),
    index("popups_valid_until_idx").on(t.valid_until),
    index("popups_created_idx").on(t.created_at),
    index("popups_image_asset_idx").on(t.image_asset_id),
  ]
);

export type PopupRow = typeof popups.$inferSelect;
export type PopupInsert = typeof popups.$inferInsert;
