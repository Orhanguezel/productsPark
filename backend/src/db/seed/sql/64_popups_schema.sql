-- POPUPS SCHEMA
SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE TABLE IF NOT EXISTS `popups` (
  `id`           CHAR(36)       NOT NULL,
  `title`        VARCHAR(255)   NOT NULL,
  `content`      TEXT           NOT NULL,
  `image_url`    VARCHAR(500)   DEFAULT NULL,
  `button_text`  VARCHAR(100)   DEFAULT NULL,
  `button_url`   VARCHAR(500)   DEFAULT NULL,
  `is_active`    TINYINT(1)     NOT NULL DEFAULT 0,
  `show_once`    TINYINT(1)     NOT NULL DEFAULT 0,
  `delay`        INT            NOT NULL DEFAULT 0,
  `valid_from`   DATETIME(3)    DEFAULT NULL,
  `valid_until`  DATETIME(3)    DEFAULT NULL,
  `created_at`   DATETIME(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`   DATETIME(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `popups_active_idx` (`is_active`),
  KEY `popups_valid_from_idx` (`valid_from`),
  KEY `popups_valid_until_idx` (`valid_until`),
  KEY `popups_created_idx` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
