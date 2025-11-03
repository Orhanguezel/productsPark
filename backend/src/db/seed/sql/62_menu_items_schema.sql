-- 62_menu_items_schema.sql
-- Menu Items table (with self-FK and extra indexes)

CREATE TABLE IF NOT EXISTS `menu_items` (
  `id`         CHAR(36)      NOT NULL,
  `label`      VARCHAR(100)  NOT NULL,
  `url`        VARCHAR(500)  NOT NULL,
  `parent_id`  CHAR(36)      DEFAULT NULL,
  `order_num`  INT(11)       NOT NULL DEFAULT 0,
  `is_active`  TINYINT(1)    NOT NULL DEFAULT 1,
  `created_at` DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),

  -- Common filters
  KEY `menu_items_parent_idx`  (`parent_id`),
  KEY `menu_items_active_idx`  (`is_active`),
  KEY `menu_items_order_idx`   (`order_num`),

  -- Frequently used sort keys
  KEY `menu_items_created_idx` (`created_at`),
  KEY `menu_items_updated_idx` (`updated_at`),

  -- Self reference: when parent deleted, set children parent_id to NULL
  CONSTRAINT `menu_items_parent_fk`
    FOREIGN KEY (`parent_id`) REFERENCES `menu_items` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE

  -- Optional: force unique order within same parent (MySQL allows multiple NULLs)
  -- , UNIQUE KEY `menu_items_parent_order_uq` (`parent_id`, `order_num`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
