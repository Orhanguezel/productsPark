-- 68_footer_sections_schema.sql
-- Şema: footer_sections (fsp=3, ON UPDATE, ek indeksler)
-- Not: links LONGTEXT + JSON_VALID check

CREATE TABLE IF NOT EXISTS `footer_sections` (
  `id`          CHAR(36)      NOT NULL,
  `title`       VARCHAR(100)  NOT NULL,
  `links`       LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL
                 CHECK (json_valid(`links`)),
  `order_num`   INT(11)       NOT NULL DEFAULT 0,
  `is_active`   TINYINT(1)    NOT NULL DEFAULT 1,
  `created_at`  DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`  DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),

  KEY `footer_sections_active_idx`  (`is_active`),
  KEY `footer_sections_order_idx`   (`order_num`),
  KEY `footer_sections_created_idx` (`created_at`),
  KEY `footer_sections_updated_idx` (`updated_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
