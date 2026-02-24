site_settings tablosuna yeni ayar ekle veya mevcut ayarları yönet: $ARGUMENTS

## ProductsPark site_settings Yapısı

site_settings tablosu tüm dinamik konfigürasyonları saklar.

### Tablo Yapısı

```typescript
// backend/src/modules/siteSettings/schema.ts
export const siteSettings = mysqlTable('site_settings', {
  id: char('id', { length: 36 }).primaryKey(),
  key: varchar('key', { length: 255 }).notNull().unique(),
  value: text('value'),
  value_type: varchar('value_type', { length: 50 }), // string, number, boolean, json
  group: varchar('group', { length: 100 }),
  description: text('description'),
  created_at: datetime('created_at', { fsp: 3 }).notNull().defaultNow(),
  updated_at: datetime('updated_at', { fsp: 3 }).notNull().defaultNow(),
});
```

### Seed Dosya Formatı

```sql
-- backend/src/db/seed/sql/60.X_site_settings_[group].seed.sql

SET NAMES utf8mb4;
SET time_zone = '+00:00';

INSERT INTO `site_settings` (`id`, `key`, `value`, `created_at`, `updated_at`) VALUES

-- Açıklama yorumu
('uuid-xxxx-xxxx-xxxx-xxxxxxxxxxxx', 'setting_key', 'default_value', NOW(3), NOW(3)),
('uuid-xxxx-xxxx-xxxx-xxxxxxxxxxxx', 'another_key', 'value', NOW(3), NOW(3))

ON DUPLICATE KEY UPDATE
  `value`      = VALUES(`value`),
  `updated_at` = VALUES(`updated_at`);
```

### UUID Formatı

36 karakter UUID kullanılmalı:
```
bm04a1b2-c3d4-e5f6-a7b8-c9d0e1f2a3b4
```

### Mevcut Seed Grupları

```
60.1 - Temel ayarlar (site_title, site_description)
60.2 - SEO ayarları (robots, sitemap, analytics)
60.3 - Telegram ayarları
60.4 - SEO sayfa başlıkları
60.5 - Marka medya (logo, favicon, PWA)
```

## Yeni Ayar Ekleme Adımları

### 1. Seed Dosyasına Ekle

```sql
-- 60.X_site_settings_[group].seed.sql
('new-uuid-here', 'new_setting_key', 'default_value', NOW(3), NOW(3)),
```

### 2. Backend'de Kullanım

```typescript
// Controller'da
const setting = await db
  .select()
  .from(siteSettings)
  .where(eq(siteSettings.key, 'new_setting_key'))
  .limit(1);

const value = setting[0]?.value ?? 'fallback';
```

### 3. SEO Meta Endpoint'e Ekle (gerekiyorsa)

```typescript
// modules/seo/controller.ts

// 1. SEO_META_KEYS array'ine ekle
const SEO_META_KEYS = [
  // ... mevcut key'ler
  'new_setting_key',
];

// 2. Response type'a ekle
type SeoMetaResponse = {
  // ... mevcut alanlar
  new_setting_key: string;
};

// 3. Response object'e ekle
const res: SeoMetaResponse = {
  // ... mevcut alanlar
  new_setting_key: toStr(bag.new_setting_key).trim(),
};
```

### 4. Frontend Type'a Ekle

```typescript
// integrations/rtk/public/seo.endpoints.ts
export type SeoMeta = {
  // ... mevcut alanlar
  new_setting_key: string;
};
```

### 5. Admin Panel'e Ekle

```typescript
// pages/admin/settings/Settings.tsx
const defaultSettings = {
  // ... mevcut ayarlar
  new_setting_key: 'default_value',
};
```

### 6. Settings Card Bileşenine Ekle

```typescript
// pages/admin/settings/components/[Group]SettingsCard.tsx
<FormField
  control={form.control}
  name="new_setting_key"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Ayar Etiketi</FormLabel>
      <FormControl>
        <Input {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

## Ayar Grupları

| Grup | Açıklama | Seed Dosyası |
|------|----------|--------------|
| seo | SEO meta, robots, sitemap | 60.2 |
| telegram | Bot token, chat ID, flags | 60.3 |
| brand | Logo, favicon, PWA icons | 60.5 |
| smtp | Email konfigürasyonu | 60.1 |
| payment | Ödeme entegrasyonları | 60.1 |

## Kontrol Listesi

- [ ] UUID 36 karakter formatında
- [ ] Seed dosyasına eklendi
- [ ] `ON DUPLICATE KEY UPDATE` ile idempotent
- [ ] Backend type'a eklendi (gerekiyorsa)
- [ ] Frontend type'a eklendi (gerekiyorsa)
- [ ] Admin panel'e eklendi
- [ ] Default değer mantıklı
- [ ] `npm run db:seed` çalıştırıldı
