-- 68_footer_sections_schema.sql
-- Şema: footer_sections
-- Not: id birincil anahtar; links longtext + JSON_VALID

DROP TABLE IF EXISTS `footer_sections`;

CREATE TABLE `footer_sections` (
  `id`          CHAR(36)     NOT NULL,
  `title`       VARCHAR(100) NOT NULL,
  `links`       LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL
                CHECK (json_valid(`links`)),
  `order_num`   INT(11)      NOT NULL DEFAULT 0,
  `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  `updated_at`  DATETIME     NOT NULL,
  PRIMARY KEY (`id`),
  KEY `footer_sections_order_idx` (`order_num`),
  KEY `footer_sections_created_idx` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
