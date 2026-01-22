-- ======= CLEAN REBUILD (FINAL) =======
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `order_timeline`;
DROP TABLE IF EXISTS `order_items`;
DROP TABLE IF EXISTS `orders`;
SET FOREIGN_KEY_CHECKS = 1;

-- ===================== ORDERS =====================
CREATE TABLE `orders` (
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
  UNIQUE KEY `orders_number_uq` (`order_number`),

  KEY `orders_user_idx`    (`user_id`),
  KEY `orders_status_idx`  (`status`),
  KEY `orders_method_idx`  (`payment_method`),
  KEY `orders_pstatus_idx` (`payment_status`),
  KEY `orders_created_idx` (`created_at`),

  CONSTRAINT `orders_user_fk`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================== ORDER ITEMS =====================
CREATE TABLE `order_items` (
  `id`               CHAR(36)      NOT NULL,
  `order_id`         CHAR(36)      NOT NULL,
  `product_id`       CHAR(36)      NOT NULL,

  `product_name`     VARCHAR(255)  NOT NULL,
  `quantity`         INT(11)       NOT NULL,
  `price`            DECIMAL(10,2) NOT NULL,
  `total`            DECIMAL(10,2) NOT NULL,

  -- JSON text
  `options`          LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `delivery_status`  ENUM('pending','processing','delivered','failed') NOT NULL DEFAULT 'pending',
  `activation_code`  VARCHAR(255)  DEFAULT NULL,
  `stock_code`       VARCHAR(255)  DEFAULT NULL,
  `api_order_id`     VARCHAR(255)  DEFAULT NULL,

  `delivery_content` LONGTEXT      DEFAULT NULL,
  `turkpin_order_no` VARCHAR(255)  DEFAULT NULL,

  `delivered_at`     DATETIME(3)   DEFAULT NULL,
  `created_at`       DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`       DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  KEY `oi_order_idx`     (`order_id`),
  KEY `oi_product_idx`   (`product_id`),
  KEY `oi_status_idx`    (`delivery_status`),
  KEY `oi_delivered_idx` (`delivered_at`),

  CONSTRAINT `oi_order_fk`
    FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  -- MySQL 8+ : allow NULL, validate only if not null
  CONSTRAINT `oi_options_json_chk`
    CHECK (`options` IS NULL OR JSON_VALID(`options`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================== ORDER TIMELINE =====================
CREATE TABLE `order_timeline` (
  `id`         CHAR(36)     NOT NULL,
  `order_id`   CHAR(36)     NOT NULL,
  `type`       VARCHAR(50)  NOT NULL,
  `message`    TEXT         NOT NULL,
  `actor_name` VARCHAR(255) DEFAULT NULL,
  `meta`       LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `created_at` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  KEY `ot_order_idx` (`order_id`),

  CONSTRAINT `ot_order_fk`
    FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT `ot_meta_json_chk`
    CHECK (`meta` IS NULL OR JSON_VALID(`meta`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================== ORDERS (SEED - FINAL) =====================
-- ✅ IMPORTANT: user_id boş OLAMAZ.
-- 1) Gerçek user UUID ver:
--    SELECT id,email FROM users LIMIT 10;
-- 2) Aşağıdaki @USER_ID değişkenine yapıştır.

SET @USER_ID = '0ac37a5c-a8be-4d25-b853-1e5c9574c1b3';

INSERT INTO `orders`
(`id`,`order_number`,`user_id`,`status`,`payment_method`,`payment_status`,
 `subtotal`,`discount`,`coupon_discount`,`total`,`coupon_code`,`notes`,
 `ip_address`,`user_agent`,`payment_provider`,`payment_id`,`created_at`,`updated_at`)
VALUES
('0aa3d50f-bb5a-40a7-b5ab-e873d8cb4876','ORD1760601727849', @USER_ID,
 'pending','bank_transfer','paid',
 50.00,0.00,0.00,50.00,
 NULL,NULL,NULL,NULL,NULL,NULL,
 '2025-10-16 08:02:10.000','2025-10-16 08:50:04.000');
