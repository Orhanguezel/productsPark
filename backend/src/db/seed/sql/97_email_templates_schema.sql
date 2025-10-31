-- EMAIL_TEMPLATES SCHEMA
SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE TABLE IF NOT EXISTS `email_templates` (
  `id`            CHAR(36)       NOT NULL,
  `template_key`  VARCHAR(100)   NOT NULL,
  `template_name` VARCHAR(150)   NOT NULL,
  `subject`       VARCHAR(255)   NOT NULL,
  `content`       LONGTEXT       NOT NULL,  -- HTML
  `variables`     LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`variables`)),
  `is_active`     TINYINT(1)     NOT NULL DEFAULT 1,
  `locale`        VARCHAR(10)    DEFAULT NULL, -- örn: tr, en-US
  `created_at`    DATETIME(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`    DATETIME(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_email_tpl_key_locale` (`template_key`, `locale`),
  KEY `ix_email_tpl_active` (`is_active`),
  KEY `ix_email_tpl_updated_at` (`updated_at`),
  KEY `ix_email_tpl_name` (`template_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
