-- ORDER ITEMS (DDL)
CREATE TABLE IF NOT EXISTS `order_items` (
  `id`              CHAR(36)      NOT NULL,
  `order_id`        CHAR(36)      NOT NULL,
  `product_id`      CHAR(36)      NOT NULL,
  `product_name`    VARCHAR(255)  NOT NULL,
  `quantity`        INT(11)       NOT NULL,
  `price`           DECIMAL(10,2) NOT NULL,
  `total`           DECIMAL(10,2) NOT NULL,
  `options`         LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`options`)),
  `delivery_status` ENUM('pending','processing','delivered','failed') NOT NULL DEFAULT 'pending',
  `activation_code` VARCHAR(255)  DEFAULT NULL,
  `stock_code`      VARCHAR(255)  DEFAULT NULL,
  `api_order_id`    VARCHAR(255)  DEFAULT NULL,
  `delivered_at`    DATETIME(3)   DEFAULT NULL,
  `created_at`      DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`      DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `oi_order_idx` (`order_id`),
  KEY `oi_product_idx` (`product_id`),
  KEY `oi_status_idx` (`delivery_status`),
  KEY `oi_delivered_idx` (`delivered_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 🔧 Safe patch for existing DBs
ALTER TABLE `order_items`
  MODIFY COLUMN `delivered_at` DATETIME(3) NULL,
  MODIFY COLUMN `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  MODIFY COLUMN `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3);
