-- 90_payment_sessions_schema.sql (final)
DROP TABLE IF EXISTS `payment_sessions`;

CREATE TABLE `payment_sessions` (
  `id`            CHAR(36)       NOT NULL,
  `provider_key`  VARCHAR(64)    NOT NULL,
  `order_id`      CHAR(36)                DEFAULT NULL,
  `amount`        DECIMAL(10,2)  NOT NULL,
  `currency`      VARCHAR(10)    NOT NULL DEFAULT 'TRY',
  `status`        VARCHAR(32)    NOT NULL,
  `client_secret` VARCHAR(255)            DEFAULT NULL,
  `iframe_url`    VARCHAR(500)            DEFAULT NULL,
  `redirect_url`  VARCHAR(500)            DEFAULT NULL,
  `extra`         TEXT                    DEFAULT NULL,
  `created_at`    DATETIME(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`    DATETIME(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `payment_sessions_provider_idx` (`provider_key`),
  KEY `payment_sessions_status_idx`   (`status`),
  KEY `payment_sessions_created_idx`  (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
