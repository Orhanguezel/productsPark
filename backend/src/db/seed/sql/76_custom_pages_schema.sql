DROP TABLE IF EXISTS `custom_pages`;

CREATE TABLE `custom_pages` (
  `id`               CHAR(36)      NOT NULL,
  `title`            VARCHAR(255)  NOT NULL,
  `slug`             VARCHAR(255)  NOT NULL,

  -- JSON string: {"html":"..."}
  `content`          LONGTEXT
                     CHARACTER SET utf8mb4
                     COLLATE utf8mb4_bin
                     NOT NULL
                     CHECK (JSON_VALID(`content`)),

  `meta_title`       VARCHAR(255)  DEFAULT NULL,
  `meta_description` VARCHAR(500)  DEFAULT NULL,
  `is_published`     TINYINT(1)    NOT NULL DEFAULT 0,

  `created_at`       DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`       DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),

  UNIQUE KEY `ux_custom_pages_slug`           (`slug`),
  KEY        `custom_pages_created_idx`       (`created_at`),
  KEY        `custom_pages_updated_idx`       (`updated_at`),
  KEY        `custom_pages_is_published_idx`  (`is_published`)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
