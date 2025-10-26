-- ORDERS (DDL)
CREATE TABLE IF NOT EXISTS `orders` (
  `id`               CHAR(36)      NOT NULL,
  `order_number`     VARCHAR(50)   NOT NULL,
  `user_id`          CHAR(36)      NOT NULL,
  `status`           ENUM('pending','processing','completed','cancelled','refunded') NOT NULL DEFAULT 'pending',
  `payment_method`   ENUM('credit_card','bank_transfer','wallet','paytr','shopier')  NOT NULL,
  `payment_status`   VARCHAR(50)   NOT NULL DEFAULT 'pending',
  `subtotal`         DECIMAL(10,2) NOT NULL,
  `discount`         DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `coupon_discount`  DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `total`            DECIMAL(10,2) NOT NULL,
  `coupon_code`      VARCHAR(50)   DEFAULT NULL,
  `notes`            TEXT          DEFAULT NULL,
  `ip_address`       VARCHAR(50)   DEFAULT NULL,
  `user_agent`       VARCHAR(500)  DEFAULT NULL,
  `payment_provider` VARCHAR(50)   DEFAULT NULL,
  `payment_id`       VARCHAR(255)  DEFAULT NULL,
  `created_at`       DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`       DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `orders_user_idx` (`user_id`),
  KEY `orders_status_idx` (`status`),
  KEY `orders_method_idx` (`payment_method`),
  KEY `orders_pstatus_idx` (`payment_status`),
  KEY `orders_created_idx` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 🔧 Safe patch for existing DBs (idempotent)
ALTER TABLE `orders`
  ADD COLUMN IF NOT EXISTS `coupon_discount` DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER `discount`,
  MODIFY COLUMN `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  MODIFY COLUMN `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3);
