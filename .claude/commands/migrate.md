Veritabanı değişikliği / migration oluştur: $ARGUMENTS

## ProductsPark Database Stack

- **ORM**: Drizzle ORM
- **Database**: MySQL 8+
- **Seed**: SQL dosyaları (`backend/src/db/seed/sql/`)

## Drizzle Schema Yapısı

### 1. Schema Dosyası Oluştur

```typescript
// backend/src/modules/[moduleName]/schema.ts
import {
  mysqlTable,
  varchar,
  char,
  text,
  int,
  boolean,
  datetime,
  decimal,
  json,
  index,
  foreignKey,
  uniqueIndex,
} from 'drizzle-orm/mysql-core';

export const tableName = mysqlTable('table_name', {
  // Primary Key (UUID)
  id: char('id', { length: 36 }).primaryKey(),

  // String alanlar
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }),
  description: text('description'),

  // Sayısal alanlar
  quantity: int('quantity').default(0),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),

  // Boolean
  is_active: boolean('is_active').default(true),

  // JSON (text olarak saklanır)
  options: text('options').$type<string | null>(),
  metadata: json('metadata').$type<Record<string, unknown>>(),

  // Foreign key
  category_id: char('category_id', { length: 36 }),

  // Timestamps (millisecond precision)
  created_at: datetime('created_at', { fsp: 3 }).notNull().defaultNow(),
  updated_at: datetime('updated_at', { fsp: 3 }).notNull().defaultNow(),
  deleted_at: datetime('deleted_at', { fsp: 3 }),
}, (t) => [
  // Indexes
  index('table_name_category_idx').on(t.category_id),
  index('table_name_created_idx').on(t.created_at),
  uniqueIndex('table_name_slug_unique').on(t.slug),

  // Foreign keys
  foreignKey({
    columns: [t.category_id],
    foreignColumns: [categories.id],
  }).onDelete('cascade'),
]);

// Type inference
export type TableName = typeof tableName.$inferSelect;
export type NewTableName = typeof tableName.$inferInsert;
```

## Seed Dosyası Oluşturma

### Seed Dosya Yapısı

```
backend/src/db/seed/sql/
├── 10.x_*.seed.sql    ← Temel tablolar (users, roles)
├── 20.x_*.seed.sql    ← Bağımlı tablolar (categories)
├── 30.x_*.seed.sql    ← İçerik tabloları (products, blog)
├── 40.x_*.seed.sql    ← İlişki tabloları
├── 50.x_*.seed.sql    ← Konfigürasyon
├── 60.x_*.seed.sql    ← site_settings
└── 70.x_*.seed.sql    ← Demo data
```

### Örnek Seed Dosyası

```sql
-- =============================================================
-- FILE: 35.1_products.seed.sql
-- Ürün demo verileri
-- =============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

INSERT INTO `products` (`id`, `name`, `slug`, `price`, `is_active`, `created_at`, `updated_at`) VALUES
('prod-0001-0001-0001-000000000001', 'Örnek Ürün 1', 'ornek-urun-1', 99.99, true, NOW(3), NOW(3)),
('prod-0001-0001-0001-000000000002', 'Örnek Ürün 2', 'ornek-urun-2', 149.99, true, NOW(3), NOW(3))

ON DUPLICATE KEY UPDATE
  `name`       = VALUES(`name`),
  `price`      = VALUES(`price`),
  `updated_at` = VALUES(`updated_at`);
```

## İsimlendirme Kuralları

| Öğe | Format | Örnek |
|-----|--------|-------|
| Tablo adı | snake_case, çoğul | `products`, `order_items` |
| Kolon adı | snake_case | `created_at`, `user_id` |
| Primary key | `id` (char 36, UUID) | `char('id', { length: 36 })` |
| Foreign key | `[tablo]_id` | `category_id`, `user_id` |
| Index | `[tablo]_[kolon]_idx` | `products_category_idx` |
| Unique | `[tablo]_[kolon]_unique` | `users_email_unique` |

## UUID Formatı (36 karakter)

```
xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
│        │    │    │    │
│        │    │    │    └── 12 random hex
│        │    │    └─────── 4 random hex
│        │    └──────────── 4 random hex
│        └───────────────── 4 random hex
└────────────────────────── 8 random hex
```

Örnek ID formatları:
```
bm04a1b2-c3d4-e5f6-a7b8-c9d0e1f2a3b4  (brand media)
prod-0001-0001-0001-000000000001      (product)
user-0001-0001-0001-000000000001      (user)
```

## Seed Çalıştırma

```bash
# Tüm seed'leri çalıştır
cd backend && npm run db:seed

# Belirli seed dosyasını çalıştır
npm run db:seed -- --only=60.5

# Tabloları silmeden seed (sadece INSERT/UPDATE)
npm run db:seed:nodrop
```

## Kontrol Listesi

- [ ] Schema dosyası oluşturuldu (`modules/[name]/schema.ts`)
- [ ] Tüm kolonlar tanımlandı (timestamps dahil)
- [ ] İndexler eklendi (FK kolonları, sık sorgulanan alanlar)
- [ ] Foreign key ilişkileri tanımlandı
- [ ] Seed dosyası oluşturuldu
- [ ] UUID formatı doğru (36 karakter)
- [ ] `ON DUPLICATE KEY UPDATE` ile idempotent seed
- [ ] Controller/router'da schema import edildi
