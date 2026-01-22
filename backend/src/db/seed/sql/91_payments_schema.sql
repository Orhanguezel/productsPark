-- ===================================================================
-- 91_payments_schema.sql (FINAL)
-- ===================================================================

DROP TABLE IF EXISTS `payments`;

CREATE TABLE `payments` (
  `id`                 CHAR(36)       NOT NULL,
  `order_id`           CHAR(36)                DEFAULT NULL,

  `provider`           VARCHAR(64)    NOT NULL,
  `currency`           VARCHAR(10)    NOT NULL,

  `amount_authorized`  DECIMAL(10,2)  NOT NULL,
  `amount_captured`    DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
  `amount_refunded`    DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
  `fee_amount`         DECIMAL(10,2)           DEFAULT NULL,

  `status`             VARCHAR(32)    NOT NULL,
  `reference`          VARCHAR(255)            DEFAULT NULL,
  `transaction_id`     VARCHAR(255)            DEFAULT NULL,

  `is_test`            TINYINT        NOT NULL DEFAULT 0,
  `metadata`           TEXT                    DEFAULT NULL,

  `created_at`         DATETIME(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`         DATETIME(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),

  KEY `payments_provider_idx` (`provider`),
  KEY `payments_status_idx`   (`status`),
  KEY `payments_created_idx`  (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
