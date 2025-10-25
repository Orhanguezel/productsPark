import {
  mysqlTable, char, varchar, text, int, tinyint, decimal, datetime, json,
  index, uniqueIndex, foreignKey,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';
import { categories } from "../categories/schema";

export const products = mysqlTable(
  'products',
  {
    id: char('id', { length: 36 }).primaryKey().notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull(),

    description: text('description'),
    short_description: varchar('short_description', { length: 500 }),

    category_id: char('category_id', { length: 36 }),

    // DECIMAL -> Drizzle tarafında string döner (normalize'da number'a çeviriyoruz)
    price: decimal('price', { precision: 10, scale: 2 }).notNull(),
    original_price: decimal('original_price', { precision: 10, scale: 2 }),
    cost: decimal('cost', { precision: 10, scale: 2 }),

    image_url: varchar('image_url', { length: 500 }),

    gallery_urls: json('gallery_urls'),
    features: json('features'),

    rating: decimal('rating', { precision: 3, scale: 2 }).notNull().default('5.00'),
    review_count: int('review_count').notNull().default(0),

    product_type: varchar('product_type', { length: 50 }),
    delivery_type: varchar('delivery_type', { length: 50 }),
    custom_fields: json('custom_fields'),
    quantity_options: json('quantity_options'),

    api_provider_id: char('api_provider_id', { length: 36 }),
    api_product_id: varchar('api_product_id', { length: 64 }),
    api_quantity: int('api_quantity'),

    meta_title: varchar('meta_title', { length: 255 }),
    meta_description: varchar('meta_description', { length: 500 }),

    article_content: text('article_content'),
    article_enabled: tinyint('article_enabled').notNull().default(0),
    demo_url: varchar('demo_url', { length: 500 }),
    demo_embed_enabled: tinyint('demo_embed_enabled').notNull().default(0),
    demo_button_text: varchar('demo_button_text', { length: 100 }),
    badges: json('badges'),

    sku: varchar('sku', { length: 100 }),
    stock_quantity: int('stock_quantity').notNull().default(0),
    is_active: tinyint('is_active').notNull().default(1),
    is_featured: tinyint('is_featured').notNull().default(0),
    requires_shipping: tinyint('requires_shipping').notNull().default(1),

    created_at: datetime('created_at', { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime('updated_at', { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`).$onUpdateFn(() => new Date()),
  },
  (t) => [
    uniqueIndex('products_slug_uq').on(t.slug),
    index('products_category_idx').on(t.category_id),
    foreignKey({
      columns: [t.category_id],
      foreignColumns: [categories.id],
      name: 'fk_products_category_id',
    }).onDelete('set null').onUpdate('cascade'),
  ]
);

export const productFaqs = mysqlTable('product_faqs', {
  id: char('id', { length: 36 }).primaryKey().notNull(),
  product_id: char('product_id', { length: 36 }).notNull(),
  question: varchar('question', { length: 500 }).notNull(),
  answer: text('answer').notNull(),
  display_order: int('display_order').notNull().default(0),
  is_active: tinyint('is_active').notNull().default(1),
  created_at: datetime('created_at', { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  updated_at: datetime('updated_at', { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`).$onUpdateFn(() => new Date()),
});

export const productReviews = mysqlTable('product_reviews', {
  id: char('id', { length: 36 }).primaryKey().notNull(),
  product_id: char('product_id', { length: 36 }).notNull(),
  user_id: char('user_id', { length: 36 }),
  rating: int('rating').notNull(),
  comment: text('comment'),
  is_active: tinyint('is_active').notNull().default(1),
  customer_name: varchar('customer_name', { length: 255 }),
  review_date: datetime('review_date', { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  created_at: datetime('created_at', { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  updated_at: datetime('updated_at', { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`).$onUpdateFn(() => new Date()),
});

export const productStock = mysqlTable('product_stock', {
  id: char('id', { length: 36 }).primaryKey().notNull(),
  product_id: char('product_id', { length: 36 }).notNull(),
  code: varchar('code', { length: 255 }).notNull(),
  is_used: tinyint('is_used').notNull().default(0),
  used_at: datetime('used_at', { fsp: 3 }),
  created_at: datetime('created_at', { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  order_item_id: char('order_item_id', { length: 36 }),
});

export { productOptions } from '../productOptions/schema';
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
