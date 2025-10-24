-- 69_footer_sections_seed.sql
-- Örnek satırlar (idempotent upsert)

INSERT INTO `footer_sections`
  (`id`, `title`, `links`, `order_num`, `created_at`, `updated_at`)
VALUES
  ('59583ef1-0ba1-4c7c-b806-84fd204b52b9', 'Hızlı Erişim', '[]', 0, '2025-10-15 20:05:22', '2025-10-15 20:05:22'),
  ('f942a930-6743-4ecc-b4b3-1fd6b77f9d77', 'Kurumsal',    '[]', 1, '2025-10-15 20:05:22', '2025-10-15 20:08:21')
ON DUPLICATE KEY UPDATE
  `title`      = VALUES(`title`),
  `links`      = VALUES(`links`),
  `order_num`  = VALUES(`order_num`),
  `updated_at` = VALUES(`updated_at`);
