-- =============================================================
-- COUPONS SCHEMA
-- =============================================================
SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE TABLE IF NOT EXISTS `coupons` (
  `id`             CHAR(36)      NOT NULL,
  `code`           VARCHAR(50)   NOT NULL,
  `title`          VARCHAR(200)  DEFAULT NULL,
  `content_html`   MEDIUMTEXT    DEFAULT NULL,
  `discount_type`  ENUM('percentage','fixed') NOT NULL,
  `discount_value` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `min_purchase`   DECIMAL(10,2) DEFAULT NULL,
  `max_discount`   DECIMAL(10,2) DEFAULT NULL,
  `usage_limit`    INT           DEFAULT NULL,
  `used_count`     INT           NOT NULL DEFAULT 0,

  -- 🔥 Uygulama kapsamı + id listeleri
  `applicable_to`  ENUM('all','category','product') NOT NULL DEFAULT 'all',
  `category_ids`   TEXT         DEFAULT NULL,  -- JSON string ["cat1","cat2"]
  `product_ids`    TEXT         DEFAULT NULL,  -- JSON string ["prod1","prod2"]

  `valid_from`     DATETIME(3)  DEFAULT NULL,
  `valid_until`    DATETIME(3)  DEFAULT NULL,
  `is_active`      TINYINT(1)   NOT NULL DEFAULT 1,
  `created_at`     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `coupons_code_uq` (`code`),
  KEY `coupons_active_idx` (`is_active`),
  KEY `coupons_valid_from_idx` (`valid_from`),
  KEY `coupons_valid_until_idx` (`valid_until`),
  KEY `coupons_applicable_idx` (`applicable_to`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =============================================================
-- COUPONS SEED
-- =============================================================
SET NAMES utf8mb4;
SET time_zone = '+00:00';

INSERT INTO `coupons`
(`id`,
 `code`,
 `title`,
 `content_html`,
 `discount_type`,
 `discount_value`,
 `min_purchase`,
 `max_discount`,
 `usage_limit`,
 `used_count`,
 `applicable_to`,
 `category_ids`,
 `product_ids`,
 `valid_from`,
 `valid_until`,
 `is_active`,
 `created_at`,
 `updated_at`)
VALUES
(
  '07e668cd-2f84-4182-a35e-f55cebf893d8',
  '2025',
  '2025 Yılbaşı İndirimi',
  '500 TL ve üzeri alışverişlerde sepette %25 indirim sağlar.',
  'percentage',
  25.00,
  500.00,
  NULL,
  NULL,
  3,
  'all',   -- 🔥 tüm site için geçerli
  NULL,    -- kategori listesi yok
  NULL,    -- ürün listesi yok
  '2025-10-07 00:00:00',
  NULL,
  0,
  '2025-10-07 13:17:24.000',
  '2025-10-15 20:33:57.000'
)
ON DUPLICATE KEY UPDATE
  `title`          = VALUES(`title`),
  `content_html`   = VALUES(`content_html`),
  `discount_type`  = VALUES(`discount_type`),
  `discount_value` = VALUES(`discount_value`),
  `min_purchase`   = VALUES(`min_purchase`),
  `max_discount`   = VALUES(`max_discount`),
  `usage_limit`    = VALUES(`usage_limit`),
  `used_count`     = VALUES(`used_count`),
  `applicable_to`  = VALUES(`applicable_to`),
  `category_ids`   = VALUES(`category_ids`),
  `product_ids`    = VALUES(`product_ids`),
  `valid_from`     = VALUES(`valid_from`),
  `valid_until`    = VALUES(`valid_until`),
  `is_active`      = VALUES(`is_active`),
  `updated_at`     = VALUES(`updated_at`);

