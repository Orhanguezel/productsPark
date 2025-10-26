-- 64_payment_requests_schema.sql
-- Kalıcı, temiz şema (ALTER yok). Drizzle schema ile bire bir uyumlu.

CREATE TABLE IF NOT EXISTS `payment_requests` (
  `id`              CHAR(36)      NOT NULL,
  `order_id`        CHAR(36)      NOT NULL,
  `user_id`         CHAR(36)               DEFAULT NULL,          -- FE opsiyonel kullanır
  `amount`          DECIMAL(10,2) NOT NULL,
  `currency`        VARCHAR(10)   NOT NULL DEFAULT 'TRY',         -- FE default TRY
  `payment_method`  VARCHAR(50)   NOT NULL,
  `payment_proof`   VARCHAR(500)          DEFAULT NULL,           -- FE: proof_image_url ↔ DB: payment_proof
  `status`          VARCHAR(50)   NOT NULL DEFAULT 'pending',
  `admin_notes`     TEXT                   DEFAULT NULL,
  `processed_at`    DATETIME(3)           DEFAULT NULL,           -- Drizzle: fsp=3
  `created_at`      DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`      DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `payment_requests_order_idx` (`order_id`),
  KEY `payment_requests_user_idx` (`user_id`),
  KEY `payment_requests_status_idx` (`status`),
  KEY `payment_requests_created_idx` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
