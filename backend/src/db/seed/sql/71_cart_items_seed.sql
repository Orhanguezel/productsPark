-- 71_cart_items_seed.sql
SET NAMES utf8mb4;
SET time_zone = '+00:00';

INSERT INTO `cart_items`
(`id`, `user_id`, `product_id`, `quantity`, `options`, `created_at`, `updated_at`)
VALUES
-- Basit bir satır (options NULL)
('5ab2d936-1113-4a7b-bca7-2a4d8bc2b7be', 'd279bb9d-797d-4972-a8bd-a77a40caba91', '0132e42e-d46a-444d-9080-a419aec29c9c', 1, NULL, '2025-10-15 08:22:08', '2025-10-15 08:22:08'),

-- Örnek JSON seçenekli satır (FE'de selected_options olarak dönecek)
('91a79fb5-ada0-4889-bd88-80630b02053a', '7129bc31-88dc-42da-ab80-415a21f2ea9a', '0132e42e-d46a-444d-9080-a419aec29c9c', 2,
  '{ "color": "Kırmızı", "size": "XL" }',
  '2025-10-16 07:49:45', '2025-10-16 07:49:45')
ON DUPLICATE KEY UPDATE
  `quantity`   = VALUES(`quantity`),
  `options`    = VALUES(`options`),
  `created_at` = VALUES(`created_at`),
  `updated_at` = VALUES(`updated_at`);
