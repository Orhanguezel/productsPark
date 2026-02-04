-- =============================================================
-- FILE: 180_newsletter_subscribers_schema.sql
-- FINAL — Newsletter subscribers schema (Single Language)
-- - locale removed
-- - meta: JSON object string (JSON_VALID enforced)
-- =============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `newsletter_subscribers`;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE IF NOT EXISTS `newsletter_subscribers` (
  `id`              CHAR(36)      NOT NULL,
  `email`           VARCHAR(255)  NOT NULL,

  `is_verified`     TINYINT(1)    NOT NULL DEFAULT 0,          -- Drizzle: boolean

  `meta`            LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL
                    CHECK (JSON_VALID(`meta`)),                -- JSON object string

  `unsubscribed_at` DATETIME(3)   DEFAULT NULL,                -- NULL -> active subscriber

  `created_at`      DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`      DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                    ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),

  UNIQUE KEY `ux_newsletter_email` (`email`),

  KEY `newsletter_verified_idx` (`is_verified`),
  KEY `newsletter_unsub_idx`    (`unsubscribed_at`),
  KEY `newsletter_created_idx`  (`created_at`),
  KEY `newsletter_updated_idx`  (`updated_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
