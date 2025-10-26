CREATE TABLE IF NOT EXISTS `payment_providers` (
  `id`            CHAR(36)     NOT NULL,
  `key`           VARCHAR(64)  NOT NULL,
  `display_name`  VARCHAR(128) NOT NULL,
  `is_active`     TINYINT      NOT NULL DEFAULT 1,
  -- JSON yerine LONGTEXT/TEXT: MariaDB/Drizzle sorunsuz
  `public_config` LONGTEXT              DEFAULT NULL,
  `created_at`    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `payment_providers_key_uq` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
