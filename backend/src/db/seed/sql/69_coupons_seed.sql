-- 69_coupons_seed.sql
SET NAMES utf8mb4;
SET time_zone = '+00:00';

INSERT INTO `coupons`
(`id`, `code`, `discount_type`, `discount_value`, `min_purchase`, `max_discount`, `usage_limit`, `used_count`, `valid_from`, `valid_until`, `is_active`, `created_at`, `updated_at`)
VALUES
('07e668cd-2f84-4182-a35e-f55cebf893d8', '2025', 'percentage', 25.00, 500.00, NULL, NULL, 3, '2025-10-07 00:00:00', NULL, 1, '2025-10-07 13:17:24', '2025-10-15 20:33:57')
ON DUPLICATE KEY UPDATE
  `discount_type` = VALUES(`discount_type`),
  `discount_value` = VALUES(`discount_value`),
  `min_purchase` = VALUES(`min_purchase`),
  `max_discount` = VALUES(`max_discount`),
  `usage_limit` = VALUES(`usage_limit`),
  `used_count` = VALUES(`used_count`),
  `valid_from` = VALUES(`valid_from`),
  `valid_until` = VALUES(`valid_until`),
  `is_active` = VALUES(`is_active`),
  `updated_at` = VALUES(`updated_at`);
