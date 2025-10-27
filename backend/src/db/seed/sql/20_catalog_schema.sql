-- =========================
-- CATEGORIES
-- =========================
CREATE TABLE IF NOT EXISTS categories (
  id            CHAR(36)      NOT NULL,
  name          VARCHAR(255)  NOT NULL,
  slug          VARCHAR(255)  NOT NULL,
  description   TEXT          DEFAULT NULL,
  image_url     VARCHAR(500)  DEFAULT NULL,
  icon          VARCHAR(100)  DEFAULT NULL,
  parent_id     CHAR(36)      DEFAULT NULL,

  is_active     TINYINT(1)    NOT NULL DEFAULT 1,
  is_featured   TINYINT(1)    NOT NULL DEFAULT 0,
  display_order INT(11)       NOT NULL DEFAULT 0,

  created_at    DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at    DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (id),

  UNIQUE KEY categories_slug_uq (slug),
  KEY categories_parent_id_idx (parent_id),
  KEY categories_active_idx (is_active),
  KEY categories_order_idx (display_order),

  CONSTRAINT fk_categories_parent
    FOREIGN KEY (parent_id) REFERENCES categories(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- PRODUCTS  (FE tiplerine tam uyum)
-- =========================
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

  image_url          VARCHAR(500)  DEFAULT NULL,
  gallery_urls       JSON          DEFAULT NULL,
  features           JSON          DEFAULT NULL,

  rating             DECIMAL(3,2)  NOT NULL DEFAULT 5.00,
  review_count       INT(11)       NOT NULL DEFAULT 0,

  product_type       VARCHAR(50)   DEFAULT NULL,
  delivery_type      VARCHAR(50)   DEFAULT NULL,

  custom_fields      JSON          DEFAULT NULL,
  quantity_options   JSON          DEFAULT NULL,

  api_provider_id    CHAR(36)      DEFAULT NULL,
  api_product_id     VARCHAR(64)   DEFAULT NULL,
  api_quantity       INT(11)       DEFAULT NULL,

  meta_title         VARCHAR(255)  DEFAULT NULL,
  meta_description   VARCHAR(500)  DEFAULT NULL,

  article_content    TEXT          DEFAULT NULL,
  article_enabled    TINYINT(1)    NOT NULL DEFAULT 0,
  demo_url           VARCHAR(500)  DEFAULT NULL,
  demo_embed_enabled TINYINT(1)    NOT NULL DEFAULT 0,
  demo_button_text   VARCHAR(100)  DEFAULT NULL,

  badges             JSON          DEFAULT NULL,

  sku                VARCHAR(100)  DEFAULT NULL,
  stock_quantity     INT(11)       NOT NULL DEFAULT 0,
  is_active          TINYINT(1)    NOT NULL DEFAULT 1,
  is_featured        TINYINT(1)    NOT NULL DEFAULT 0,
  is_digital         TINYINT(1)    NOT NULL DEFAULT 0,
  requires_shipping  TINYINT(1)    NOT NULL DEFAULT 1,

  -- FE'de bulunan ilave alanlar
  file_url           VARCHAR(500)  DEFAULT NULL,
  epin_game_id       VARCHAR(64)   DEFAULT NULL,
  epin_product_id    VARCHAR(64)   DEFAULT NULL,
  auto_delivery_enabled TINYINT(1) NOT NULL DEFAULT 0,
  pre_order_enabled     TINYINT(1) NOT NULL DEFAULT 0,
  min_order          INT(11)       DEFAULT NULL,
  max_order          INT(11)       DEFAULT NULL,
  min_barem          INT(11)       DEFAULT NULL,
  max_barem          INT(11)       DEFAULT NULL,
  barem_step         INT(11)       DEFAULT NULL,
  tax_type           INT(11)       DEFAULT NULL,

  created_at         DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at         DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (id),

  UNIQUE KEY products_slug_uq (slug),
  KEY products_category_id_idx (category_id),
  KEY products_sku_idx (sku),
  KEY products_active_idx (is_active),

  KEY products_cat_active_created_idx (category_id, is_active, created_at),
  KEY products_slug_active_idx (slug, is_active),

  CONSTRAINT fk_products_category
    FOREIGN KEY (category_id) REFERENCES categories(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- PRODUCT FAQS
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
  KEY product_faqs_order_idx (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- PRODUCT REVIEWS
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
  KEY product_reviews_rating_idx (rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =========================
-- PRODUCT OPTIONS
-- =========================
CREATE TABLE IF NOT EXISTS product_options (
  id            CHAR(36)     NOT NULL,
  product_id    CHAR(36)     NOT NULL,
  option_name   VARCHAR(100) NOT NULL,
  option_values JSON         NOT NULL,
  created_at    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY product_options_product_id_idx (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- PRODUCT STOCK  (FE: stock_content)
-- =========================
CREATE TABLE IF NOT EXISTS product_stock (
  id             CHAR(36)     NOT NULL,
  product_id     CHAR(36)     NOT NULL,
  stock_content  VARCHAR(255) NOT NULL,          -- FE ile birebir
  is_used        TINYINT(1)   NOT NULL DEFAULT 0,
  used_at        DATETIME(3)  DEFAULT NULL,
  created_at     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  order_item_id  CHAR(36)     DEFAULT NULL,
  PRIMARY KEY (id),
  KEY product_stock_product_id_idx (product_id),
  KEY product_stock_is_used_idx (product_id, is_used),
  KEY product_stock_order_item_id_idx (order_item_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
