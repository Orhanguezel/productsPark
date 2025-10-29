SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- İdempotent: tabloyu her seferinde sıfırdan oluştur
DROP TABLE IF EXISTS `site_settings`;

CREATE TABLE `site_settings` (
  `id` CHAR(36) NOT NULL,
  `key` VARCHAR(100) NOT NULL,
  `value` MEDIUMTEXT NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `site_settings_key_uq` (`key`),
  KEY `site_settings_key_idx` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
