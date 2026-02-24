-- 69_footer_sections_seed.sql
-- Örnek satırlar (idempotent upsert)

INSERT INTO `footer_sections`
  (`id`, `title`, `links`, `section_type`, `order_num`, `is_active`, `created_at`, `updated_at`)
VALUES
  ('59583ef1-0ba1-4c7c-b806-84fd204b52b9', 'Hızlı Erişim',              '[]', 'links',           0, 1, '2025-10-15 20:05:22.000', '2025-10-15 20:05:22.000'),
  ('f942a930-6743-4ecc-b4b3-1fd6b77f9d77', 'Kurumsal',                  '[]', 'links',           1, 1, '2025-10-15 20:05:22.000', '2025-10-15 20:08:21.000'),
  ('c0de0001-pay0-4000-8000-000000000001', 'Güvenli Ödeme Yöntemleri',  '[]', 'payment_methods', 99, 1, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  `title`        = VALUES(`title`),
  `links`        = VALUES(`links`),
  `section_type` = VALUES(`section_type`),
  `order_num`    = VALUES(`order_num`),
  `is_active`    = VALUES(`is_active`),
  `updated_at`   = VALUES(`updated_at`);
