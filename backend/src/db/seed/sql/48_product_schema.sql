-- ============================================================
-- DDL: PRODUCTS — FINAL (storage + admin + public uyumlu)
-- ============================================================

CREATE TABLE IF NOT EXISTS products (
  id                 CHAR(36)      NOT NULL,
  name               VARCHAR(255)  NOT NULL,
  slug               VARCHAR(255)  NOT NULL,

  description        TEXT          DEFAULT NULL,
  short_description  VARCHAR(500)  DEFAULT NULL,

  category_id        CHAR(36)      DEFAULT NULL,

  price              DECIMAL(10,2) NOT NULL,
  original_price     DECIMAL(10,2) DEFAULT NULL,
  cost               DECIMAL(10,2) DEFAULT NULL,

  -- legacy + public fallback
  image_url          VARCHAR(500)  DEFAULT NULL,

  -- storage cover
  featured_image           VARCHAR(500)  DEFAULT NULL,
  featured_image_asset_id  VARCHAR(200)  DEFAULT NULL,
  featured_image_alt       VARCHAR(255)  DEFAULT NULL,

  -- gallery
  gallery_urls       JSON          DEFAULT NULL,
  gallery_asset_ids  JSON          DEFAULT NULL,

  -- flexible content
  features           JSON          DEFAULT NULL,
  badges             JSON          DEFAULT NULL,
  custom_fields      JSON          DEFAULT NULL,
  quantity_options   JSON          DEFAULT NULL,

  -- ratings
  rating             DECIMAL(3,2)  NOT NULL DEFAULT 5.00,
  review_count       INT           NOT NULL DEFAULT 0, -- yorum sayısı
  sales_count        INT           NOT NULL DEFAULT 0, -- admin tarafından girilen satış

  -- types
  product_type       VARCHAR(50)   DEFAULT NULL,
  delivery_type      VARCHAR(50)   DEFAULT NULL,

  api_provider_id    CHAR(36)      DEFAULT NULL,
  api_product_id     VARCHAR(64)   DEFAULT NULL,
  api_quantity       INT           DEFAULT NULL,

  meta_title         VARCHAR(255)  DEFAULT NULL,
  meta_description   VARCHAR(500)  DEFAULT NULL,

  article_content    TEXT          DEFAULT NULL,
  article_enabled    TINYINT(1)    NOT NULL DEFAULT 0,

  demo_url           VARCHAR(500)  DEFAULT NULL,
  demo_embed_enabled TINYINT(1)    NOT NULL DEFAULT 0,
  demo_button_text   VARCHAR(100)  DEFAULT NULL,

  sku                VARCHAR(100)  DEFAULT NULL,
  stock_quantity     INT           NOT NULL DEFAULT 0,

  is_active          TINYINT(1)    NOT NULL DEFAULT 1,
  is_featured        TINYINT(1)    NOT NULL DEFAULT 0,
  is_digital         TINYINT(1)    NOT NULL DEFAULT 0,
  requires_shipping  TINYINT(1)    NOT NULL DEFAULT 1,

  -- FE / auto-delivery
  file_url               VARCHAR(500)  DEFAULT NULL,
  epin_game_id           VARCHAR(64)   DEFAULT NULL,
  epin_product_id        VARCHAR(64)   DEFAULT NULL,
  auto_delivery_enabled  TINYINT(1)    NOT NULL DEFAULT 0,
  pre_order_enabled      TINYINT(1)    NOT NULL DEFAULT 0,

  min_order              INT DEFAULT NULL,
  max_order              INT DEFAULT NULL,
  min_barem              INT DEFAULT NULL,
  max_barem              INT DEFAULT NULL,
  barem_step             INT DEFAULT NULL,
  tax_type               INT DEFAULT NULL,

  created_at         DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at         DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                                  ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (id),
  UNIQUE KEY products_slug_uq (slug),

  KEY products_category_idx (category_id),
  KEY products_active_idx (is_active),
  KEY products_featured_idx (is_featured),
  KEY products_slug_active_idx (slug, is_active),
  KEY products_category_active_created_idx (category_id, is_active, created_at),
  KEY products_featured_asset_idx (featured_image_asset_id(191)),

  CONSTRAINT fk_products_category
    FOREIGN KEY (category_id)
    REFERENCES categories(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;



-- =========================
-- PRODUCT FAQS — FINAL (FK + index)
-- =========================
CREATE TABLE IF NOT EXISTS product_faqs (
  id            CHAR(36)     NOT NULL,
  product_id    CHAR(36)     NOT NULL,
  question      VARCHAR(500) NOT NULL,
  answer        TEXT         NOT NULL,
  display_order INT(11)      NOT NULL DEFAULT 0,
  is_active     TINYINT(1)   NOT NULL DEFAULT 1,
  created_at    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY product_faqs_product_id_idx (product_id),
  KEY product_faqs_order_idx (display_order),
  CONSTRAINT fk_product_faqs_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =========================
-- PRODUCT REVIEWS — FINAL (FK + index)
-- =========================
CREATE TABLE IF NOT EXISTS product_reviews (
  id            CHAR(36)     NOT NULL,
  product_id    CHAR(36)     NOT NULL,
  user_id       CHAR(36)     DEFAULT NULL,
  rating        INT(11)      NOT NULL,
  comment       TEXT         DEFAULT NULL,
  is_active     TINYINT(1)   NOT NULL DEFAULT 1,
  customer_name VARCHAR(255) DEFAULT NULL,
  review_date   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  created_at    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (id),
  KEY product_reviews_product_id_idx (product_id),
  KEY product_reviews_approved_idx (product_id, is_active),
  KEY product_reviews_rating_idx (rating),
  CONSTRAINT fk_product_reviews_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =========================
-- PRODUCT OPTIONS — FINAL (FK)
-- =========================
CREATE TABLE IF NOT EXISTS product_options (
  id            CHAR(36)     NOT NULL,
  product_id    CHAR(36)     NOT NULL,
  option_name   VARCHAR(100) NOT NULL,
  option_values JSON         NOT NULL,
  created_at    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY product_options_product_id_idx (product_id),
  CONSTRAINT fk_product_options_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =========================
-- PRODUCT STOCK — FINAL (FK + index)
-- =========================
CREATE TABLE IF NOT EXISTS product_stock (
  id             CHAR(36)     NOT NULL,
  product_id     CHAR(36)     NOT NULL,
  stock_content  VARCHAR(255) NOT NULL,
  is_used        TINYINT(1)   NOT NULL DEFAULT 0,
  used_at        DATETIME(3)  DEFAULT NULL,
  created_at     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  order_item_id  CHAR(36)     DEFAULT NULL,
  PRIMARY KEY (id),
  KEY product_stock_product_id_idx (product_id),
  KEY product_stock_is_used_idx (product_id, is_used),
  KEY product_stock_order_item_id_idx (order_item_id),
  CONSTRAINT fk_product_stock_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================
-- AUTO RULES: stock -> auto_stock (opsiyonel, senin kuralın)
-- ============================================

-- 1) product_stock kaydı olan ürünleri auto_stock olarak işaretle
UPDATE products p
JOIN (
  SELECT DISTINCT product_id
  FROM product_stock
) ps ON ps.product_id = p.id
SET
  p.delivery_type         = 'auto_stock',
  p.is_digital            = 1,
  p.requires_shipping     = 0,
  p.auto_delivery_enabled = 1;

-- 2) auto_stock ürünlerin stock_quantity değerini, kullanılmamış stok adedi ile eşitle
UPDATE products p
JOIN (
  SELECT
    product_id,
    COUNT(*) AS available_codes
  FROM product_stock
  WHERE is_used = 0
  GROUP BY product_id
) s ON s.product_id = p.id
SET p.stock_quantity = s.available_codes
WHERE p.delivery_type = 'auto_stock';

