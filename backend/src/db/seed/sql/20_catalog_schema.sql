-- =============================================================
-- FILE: 20_categories_schema.sql
-- Idempotent schema aligned with storage-aware design
-- =============================================================

-- 1) CREATE (ilk kurulum)
CREATE TABLE IF NOT EXISTS `categories` (
  `id`              CHAR(36)      NOT NULL,
  `name`            VARCHAR(255)  NOT NULL,
  `slug`            VARCHAR(255)  NOT NULL,

  `description`     TEXT          DEFAULT NULL,

  -- Legacy URL alanı (geriye dönük)
  `image_url`       VARCHAR(500)  DEFAULT NULL,

  -- ✅ Yeni: storage bağlantısı
  `image_asset_id`  CHAR(36)      DEFAULT NULL,
  `image_alt`       VARCHAR(255)  DEFAULT NULL,

  `icon`            VARCHAR(100)  DEFAULT NULL,
  `parent_id`       CHAR(36)      DEFAULT NULL,

  -- ✅ SEO alanları
  `seo_title`       VARCHAR(255)  DEFAULT NULL,
  `seo_description` VARCHAR(500)  DEFAULT NULL,

  -- İçerik alanları
  `article_content` LONGTEXT      DEFAULT NULL,
  `article_enabled` TINYINT(1)    NOT NULL DEFAULT 0,

  `is_active`       TINYINT(1)    NOT NULL DEFAULT 1,
  `is_featured`     TINYINT(1)    NOT NULL DEFAULT 0,
  `display_order`   INT(11)       NOT NULL DEFAULT 0,

  `created_at`      DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`      DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),

  UNIQUE KEY `categories_slug_uq`      (`slug`),
  KEY `categories_parent_id_idx`       (`parent_id`),
  KEY `categories_active_idx`          (`is_active`),
  KEY `categories_order_idx`           (`display_order`),
  KEY `categories_image_asset_idx`     (`image_asset_id`),

  CONSTRAINT `fk_categories_parent`
    FOREIGN KEY (`parent_id`) REFERENCES `categories`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
