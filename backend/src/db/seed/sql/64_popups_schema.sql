-- =============================================================
-- POPUPS SCHEMA (fresh create, ALTER yok)
-- Uyum: src/modules/popups/{schema,controller,admin.controller}.ts
-- =============================================================
SET NAMES utf8mb4;
SET time_zone = '+00:00';

DROP TABLE IF EXISTS `popups`;

CREATE TABLE `popups` (
  `id`                CHAR(36)       NOT NULL,
  `title`             VARCHAR(255)   NOT NULL,
  `content`           TEXT           NOT NULL,

  -- Görsel alanları
  `image_url`         VARCHAR(500)   DEFAULT NULL,
  `image_asset_id`    CHAR(36)       DEFAULT NULL,
  `image_alt`         VARCHAR(255)   DEFAULT NULL,

  -- Buton
  `button_text`       VARCHAR(100)   DEFAULT NULL,
  `button_url`        VARCHAR(500)   DEFAULT NULL,

  -- Durum/zamanlama
  `is_active`         TINYINT(1)     NOT NULL DEFAULT 0,
  `show_once`         TINYINT(1)     NOT NULL DEFAULT 0,
  `delay`             INT            NOT NULL DEFAULT 0,         -- saniye

  `valid_from`        DATETIME(3)    DEFAULT NULL,
  `valid_until`       DATETIME(3)    DEFAULT NULL,

  -- FE alanları (DB'de saklanır, FE doğrudan kullanır)
  `product_id`        CHAR(36)       DEFAULT NULL,
  `coupon_code`       VARCHAR(64)    DEFAULT NULL,
  `display_pages`     VARCHAR(24)    NOT NULL DEFAULT 'all',     -- all|home|products|categories|...
  `priority`          INT            DEFAULT NULL,
  `duration_seconds`  INT            DEFAULT NULL,

  -- İzleme
  `created_at`        DATETIME(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`        DATETIME(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),

  -- Sık kullanılan kolon indeksleri
  KEY `popups_active_idx`         (`is_active`),
  KEY `popups_valid_from_idx`     (`valid_from`),
  KEY `popups_valid_until_idx`    (`valid_until`),
  KEY `popups_created_idx`        (`created_at`),
  KEY `popups_image_asset_idx`    (`image_asset_id`),

  KEY `popups_product_idx`        (`product_id`),
  KEY `popups_coupon_idx`         (`coupon_code`),
  KEY `popups_priority_idx`       (`priority`),
  KEY `popups_display_pages_idx`  (`display_pages`),

  -- Listeleme filtresi için birleşik indeks (is_active + zaman penceresi)
  KEY `popups_active_time_idx`    (`is_active`, `valid_from`, `valid_until`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================
-- POPUPS SEED (FE alanlarıyla birlikte)
-- =============================================================
SET NAMES utf8mb4;
SET time_zone = '+00:00';

INSERT IGNORE INTO `popups`
(`id`, `title`, `content`,
 `image_url`, `image_asset_id`, `image_alt`,
 `button_text`, `button_url`,
 `is_active`, `show_once`, `delay`,
 `valid_from`, `valid_until`,
 `product_id`, `coupon_code`, `display_pages`, `priority`, `duration_seconds`,
 `created_at`, `updated_at`)
VALUES
-- 1) Üyelik/ilk sipariş – kupon kodlu, ürünsiz
('b57879a1-bdb0-4ccd-90a6-fae11d42850b',
 'Üye Ol İlk Siparişinde %10 İndirim Kap',
 'Sitemize üye olarak yapacağınız ilk siparişlerde geçerli indirim kodunuz hazır.',
 'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/blog-images/popup-images/gagx81xi1uh-1760559551779.png',
 NULL,
 'Popup kapak görseli',
 'Alışverişe Başla', '/kayit',
 0, 0, 3,
 NULL, NULL,
 NULL, '2025', 'all', 90, 0,
 '2025-10-09 18:54:42.000', '2025-10-15 20:19:18.000'),

-- 2) Ürün odaklı – anasayfa, 2 sn gecikme, otomatik kapanma 12 sn
('caa4a1c1-9f39-4a64-8d34-0e2f6b4fbd77',
 '500 Takipçide Hafta Sonu Fırsatı',
 'Sadece bu hafta sonuna özel! 500 Takipçi paketinde sepette ekstra indirim.',
 'https://placehold.co/800x400?text=500+Takipci',
 NULL,
 'Kampanya görseli',
 'Paketi İncele', '/urun/500-takipci',
 0, 0, 2,
 '2025-10-10 00:00:00.000', '2025-10-13 23:59:59.000',
 '0132e42e-d46a-444d-9080-a419aec29c9c', NULL, 'home', 80, 12,
 '2025-10-10 10:00:00.000', '2025-10-10 10:00:00.000'),

-- 3) Kupon + ürün – ürün sayfalarında göster, tek seferlik gösterim
('9a7f1a4b-0a56-4c1a-8f41-2f7b0f8d3c9e',
 'Windows 11 Pro için Ekim İndirimi',
 'Windows 11 Pro Retail anahtarlarında sınırlı süreli kampanya! Sepette kuponu kullanmayı unutmayın.',
 'https://placehold.co/800x400?text=Windows+11+Pro',
 NULL,
 'Windows kampanya',
 'Şimdi Al', '/urun/windows-11-pro-retail-key',
 0, 1, 1,
 '2025-10-10 00:00:00.000', '2025-11-01 23:59:59.000',
 '6c76a7b2-54ed-4290-8d83-c118533c5ee0', '2025', 'products', 70, 0,
 '2025-10-10 12:00:00.000', '2025-10-10 12:00:00.000');
