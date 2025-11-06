// =============================================================
// FILE: src/modules/products/schema.ts
// =============================================================
import {
  mysqlTable, char, varchar, text, int, tinyint, decimal, datetime, json,
  index, uniqueIndex, foreignKey,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm"; // 👈 ORM-level relations
import { categories } from "@/modules/categories/schema";

// 💡 Storage tablo importu (FK zorlamıyoruz; ORM-level iki alternatif ilişki açıyoruz)
import { storageAssets } from "@/modules/storage/schema"; // id, provider_public_id, url, mime, width, height, ...

export const products = mysqlTable(
  "products",
  {
    id: char("id", { length: 36 }).primaryKey().notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull(),

    description: text("description"),
    short_description: varchar("short_description", { length: 500 }),

    category_id: char("category_id", { length: 36 }),

    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    original_price: decimal("original_price", { precision: 10, scale: 2 }),
    cost: decimal("cost", { precision: 10, scale: 2 }),

    /** Legacy alan (geriye dönük) */
    image_url: varchar("image_url", { length: 500 }),

    /** Yeni kapak (storage ile ilişkili) */
    featured_image: varchar("featured_image", { length: 500 }),                 // URL
    featured_image_asset_id: varchar("featured_image_asset_id", { length: 200 }), // public_id veya asset id
    featured_image_alt: varchar("featured_image_alt", { length: 255 }),

    /** Galeri (legacy + yeni asset id’ler) */
    gallery_urls: json("gallery_urls").$type<string[]>(),                        // ✅ tiplendi
    gallery_asset_ids: json("gallery_asset_ids").$type<string[]>(),              // ✅ tiplendi

    /** Esnek alanlar */
    features: json("features").$type<Record<string, unknown> | unknown[]>(),
    badges: json("badges").$type<Record<string, unknown> | unknown[] | null>(),
    custom_fields: json("custom_fields").$type<Record<string, unknown> | null>(),
    quantity_options: json("quantity_options").$type<Record<string, unknown> | null>(),

    rating: decimal("rating", { precision: 3, scale: 2 }).notNull().default("5.00"),
    review_count: int("review_count").notNull().default(0),

    product_type: varchar("product_type", { length: 50 }),
    delivery_type: varchar("delivery_type", { length: 50 }),

    api_provider_id: char("api_provider_id", { length: 36 }),
    api_product_id: varchar("api_product_id", { length: 64 }),
    api_quantity: int("api_quantity"),

    meta_title: varchar("meta_title", { length: 255 }),
    meta_description: varchar("meta_description", { length: 500 }),

    article_content: text("article_content"),
    article_enabled: tinyint("article_enabled").notNull().default(0),

    demo_url: varchar("demo_url", { length: 500 }),
    demo_embed_enabled: tinyint("demo_embed_enabled").notNull().default(0),
    demo_button_text: varchar("demo_button_text", { length: 100 }),

    sku: varchar("sku", { length: 100 }),
    stock_quantity: int("stock_quantity").notNull().default(0),
    is_active: tinyint("is_active").notNull().default(1),
    is_featured: tinyint("is_featured").notNull().default(0),
    is_digital: tinyint("is_digital").notNull().default(0),
    requires_shipping: tinyint("requires_shipping").notNull().default(1),

    // FE ilave alanlar
    file_url: varchar("file_url", { length: 500 }),
    epin_game_id: varchar("epin_game_id", { length: 64 }),
    epin_product_id: varchar("epin_product_id", { length: 64 }),
    auto_delivery_enabled: tinyint("auto_delivery_enabled").notNull().default(0),
    pre_order_enabled: tinyint("pre_order_enabled").notNull().default(0),
    min_order: int("min_order"),
    max_order: int("max_order"),
    min_barem: int("min_barem"),
    max_barem: int("max_barem"),
    barem_step: int("barem_step"),
    tax_type: int("tax_type"),

    created_at: datetime("created_at", { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime("updated_at", { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .$onUpdateFn(() => new Date()),
  },
  (t) => [
    uniqueIndex("products_slug_uq").on(t.slug),
    index("products_category_id_idx").on(t.category_id),
    index("products_sku_idx").on(t.sku),
    index("products_active_idx").on(t.is_active),
    // Sık sorgular için kompozit index’ler:
    index("products_cat_active_created_idx").on(t.category_id, t.is_active, t.created_at),
    index("products_slug_active_idx").on(t.slug, t.is_active),
    // storage ilişkisi için index (public_id gibi uzun değerler için prefix index, DDL’de 191)
    index("products_featured_asset_idx").on(t.featured_image_asset_id),

    foreignKey({
      columns: [t.category_id],
      foreignColumns: [categories.id],
      name: "fk_products_category",
    })
      .onDelete("set null")
      .onUpdate("cascade"),
  ]
);

/* ==== ORM-level relations (FK zorlaması yok) ==== */
export const productsRelations = relations(products, ({ one }) => ({
  category: one(categories, {
    fields: [products.category_id],
    references: [categories.id],
  }),
  // Aynı alanı iki farklı hedef kolona göre bağlayan iki alternatif ilişki:
  featuredAssetById: one(storageAssets, {
    fields: [products.featured_image_asset_id],
    references: [storageAssets.id],
  }),
  featuredAssetByPublicId: one(storageAssets, {
    fields: [products.featured_image_asset_id],
    references: [storageAssets.provider_public_id],
  }),
}));

/* ==== FAQ / REVIEW / STOCK ==== */

export const productFaqs = mysqlTable(
  "product_faqs",
  {
    id: char("id", { length: 36 }).primaryKey().notNull(),
    product_id: char("product_id", { length: 36 }).notNull(),
    question: varchar("question", { length: 500 }).notNull(),
    answer: text("answer").notNull(),
    display_order: int("display_order").notNull().default(0),
    is_active: tinyint("is_active").notNull().default(1),
    created_at: datetime("created_at", { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime("updated_at", { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .$onUpdateFn(() => new Date()),
  },
  (t) => [
    index("product_faqs_product_id_idx").on(t.product_id),
    index("product_faqs_order_idx").on(t.display_order), // 👈 eksik index eklendi
    foreignKey({
      columns: [t.product_id],
      foreignColumns: [products.id],
      name: "fk_product_faqs_product",
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
  ]
);

export const productReviews = mysqlTable(
  "product_reviews",
  {
    id: char("id", { length: 36 }).primaryKey().notNull(),
    product_id: char("product_id", { length: 36 }).notNull(),
    user_id: char("user_id", { length: 36 }),
    rating: int("rating").notNull(),
    comment: text("comment"),
    is_active: tinyint("is_active").notNull().default(1),
    customer_name: varchar("customer_name", { length: 255 }),
    review_date: datetime("review_date", { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
    created_at: datetime("created_at", { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime("updated_at", { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .$onUpdateFn(() => new Date()),
  },
  (t) => [
    index("product_reviews_product_id_idx").on(t.product_id),
    index("product_reviews_approved_idx").on(t.product_id, t.is_active), // 👈 eksik index
    index("product_reviews_rating_idx").on(t.rating), // 👈 eksik index
    foreignKey({
      columns: [t.product_id],
      foreignColumns: [products.id],
      name: "fk_product_reviews_product",
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
  ]
);

export const productStock = mysqlTable(
  "product_stock",
  {
    id: char("id", { length: 36 }).primaryKey().notNull(),
    product_id: char("product_id", { length: 36 }).notNull(),
    stock_content: varchar("stock_content", { length: 255 }).notNull(), // FE ile birebir
    is_used: tinyint("is_used").notNull().default(0),
    used_at: datetime("used_at", { fsp: 3 }),
    created_at: datetime("created_at", { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
    order_item_id: char("order_item_id", { length: 36 }),
  },
  (t) => [
    index("product_stock_product_id_idx").on(t.product_id),
    index("product_stock_is_used_idx").on(t.product_id, t.is_used), // 👈 eksik index
    index("product_stock_order_item_id_idx").on(t.order_item_id),   // 👈 eksik index
    foreignKey({
      columns: [t.product_id],
      foreignColumns: [products.id],
      name: "fk_product_stock_product",
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
  ]
);

/* product_options — option_name VARCHAR(100) (SQL ile uyumlu) */
export const productOptions = mysqlTable(
  "product_options",
  {
    id: char("id", { length: 36 }).primaryKey().notNull(),
    product_id: char("product_id", { length: 36 }).notNull(),
    option_name: varchar("option_name", { length: 100 }).notNull(), // ✅ düzeltildi
    option_values: json("option_values").$type<string[]>().notNull(),
    created_at: datetime("created_at", { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime("updated_at", { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .$onUpdateFn(() => new Date()),
  },
  (t) => [
    index("product_options_product_id_idx").on(t.product_id),
    foreignKey({
      columns: [t.product_id],
      foreignColumns: [products.id],
      name: "fk_product_options_product",
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
  ]
);

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
