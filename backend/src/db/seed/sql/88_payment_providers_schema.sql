-- 88_payment_providers_schema.sql (final)

DROP TABLE IF EXISTS `payment_providers`;

CREATE TABLE `payment_providers` (
  `id`             CHAR(36)      NOT NULL,
  `key`            VARCHAR(64)   NOT NULL,
  `display_name`   VARCHAR(128)  NOT NULL,
  `is_active`      TINYINT       NOT NULL DEFAULT 1,
  `public_config`  TEXT                   DEFAULT NULL,
  `secret_config`  TEXT                   DEFAULT NULL,
  `created_at`     DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`     DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `payment_providers_key_uq` (`key`),
  KEY `payment_providers_active_idx` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
