-- ===========================================
-- fake_order_notifications
-- ===========================================
DROP TABLE IF EXISTS `fake_order_notifications`;

CREATE TABLE `fake_order_notifications` (
  `id` CHAR(36) NOT NULL,
  `product_name` VARCHAR(255) NOT NULL,
  `customer` VARCHAR(100) NOT NULL,
  `location` VARCHAR(100) DEFAULT NULL,
  `time_ago` VARCHAR(50) NOT NULL,          -- "3 dakika önce", "1 saat önce" gibi
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `fake_order_is_active_idx` (`is_active`),
  KEY `fake_order_created_idx` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================
-- notifications (kullanıcı bildirimleri)
-- ===========================================
DROP TABLE IF EXISTS `notifications`;

CREATE TABLE `notifications` (
  `id` CHAR(36) NOT NULL,
  `user_id` CHAR(36) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `type` VARCHAR(50) NOT NULL,
  `is_read` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `notifications_user_idx` (`user_id`),
  KEY `notifications_is_read_idx` (`is_read`),
  KEY `notifications_created_idx` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
