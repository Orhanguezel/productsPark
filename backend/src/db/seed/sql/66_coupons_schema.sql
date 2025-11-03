SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE TABLE IF NOT EXISTS `coupons` (
  `id`            CHAR(36)     NOT NULL,
  `code`          VARCHAR(50)  NOT NULL,
  `discount_type` ENUM('percentage','fixed') NOT NULL,
  `discount_value` DECIMAL(10,2) NOT NULL,
  `min_purchase`  DECIMAL(10,2) DEFAULT NULL,
  `max_discount`  DECIMAL(10,2) DEFAULT NULL,
  `usage_limit`   INT          DEFAULT NULL,
  `used_count`    INT          NOT NULL DEFAULT 0,
  `valid_from`    DATETIME(3)  DEFAULT NULL,
  `valid_until`   DATETIME(3)  DEFAULT NULL,
  `is_active`     TINYINT(1)   NOT NULL DEFAULT 1,
  `created_at`    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `coupons_code_uq` (`code`),
  KEY `coupons_active_idx` (`is_active`),
  KEY `coupons_valid_from_idx` (`valid_from`),
  KEY `coupons_valid_until_idx` (`valid_until`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
