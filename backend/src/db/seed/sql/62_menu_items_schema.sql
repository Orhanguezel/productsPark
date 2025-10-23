-- 62_menu_items_schema.sql
CREATE TABLE IF NOT EXISTS `menu_items` (
  `id`         CHAR(36)      NOT NULL,
  `label`      VARCHAR(100)  NOT NULL,               -- FE'de title olarak maplenecek
  `url`        VARCHAR(500)  NOT NULL,
  `parent_id`  CHAR(36)      DEFAULT NULL,
  `order_num`  INT(11)       NOT NULL DEFAULT 0,     -- FE'de position/display_order
  `is_active`  TINYINT(1)    NOT NULL DEFAULT 1,
  `created_at` DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `menu_items_parent_idx` (`parent_id`),
  KEY `menu_items_active_idx` (`is_active`),
  KEY `menu_items_order_idx` (`order_num`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
