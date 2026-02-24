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
  `display_frequency` VARCHAR(16)    NOT NULL DEFAULT 'always',  -- always|once|daily|weekly
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
-- POPUPS SEED (FE alanlarıyla birlikte, display_frequency dahil)
-- =============================================================
SET NAMES utf8mb4;
SET time_zone = '+00:00';

INSERT IGNORE INTO `popups`
(`id`, `title`, `content`,
 `image_url`, `image_asset_id`, `image_alt`,
 `button_text`, `button_url`,
 `is_active`, `show_once`, `display_frequency`, `delay`,
 `valid_from`, `valid_until`,
 `product_id`, `coupon_code`, `display_pages`, `priority`, `duration_seconds`,
 `created_at`, `updated_at`)
VALUES

-- 1) Üyelik/ilk sipariş – kupon kodlu, tüm sayfalarda, once gösterim (aktif)
('b57879a1-bdb0-4ccd-90a6-fae11d42850b',
 'Üye Ol, İlk Siparişinde %10 İndirim Kazan!',
 'Sitemize üye olarak yapacağınız ilk siparişlerde geçerli özel indirim kodunuz hazır. Hemen kayıt olun, fırsatı kaçırmayın!',
 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&q=80',
 NULL,
 'Alışveriş kampanya görseli',
 'Ücretsiz Üye Ol', '/kayit',
 1, 1, 'once', 3,
 NULL, NULL,
 NULL, 'HOSGELDIN10', 'all', 90, 0,
 NOW(3), NOW(3)),

-- 2) Genel kampanya – anasayfa, daily gösterim, 2 sn gecikme, 15 sn kapanma (aktif)
('caa4a1c1-9f39-4a64-8d34-0e2f6b4fbd77',
 'Bu Ay Özel Fırsatlar Sizi Bekliyor!',
 'Dijital ürünlerde büyük indirimler! Oyun anahtarları, yazılım lisansları ve daha fazlası için hemen göz atın.',
 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80',
 NULL,
 'Kampanya görseli',
 'Fırsatları Keşfet', '/urunler',
 1, 0, 'daily', 2,
 NULL, NULL,
 NULL, NULL, 'home', 80, 15,
 NOW(3), NOW(3)),

-- 3) Kupon popup – ürün sayfalarında göster, weekly gösterim (aktif)
('9a7f1a4b-0a56-4c1a-8f41-2f7b0f8d3c9e',
 'Yazılım Lisanslarında Haftalık Fırsat!',
 'Windows, Office ve daha birçok yazılım lisansında özel indirim! Sepette kupon kodunu kullanarak ekstra tasarruf edin.',
 'https://images.unsplash.com/photo-1633419461186-7d40a38105ec?w=800&q=80',
 NULL,
 'Yazılım kampanya görseli',
 'Ürünleri İncele', '/urunler',
 1, 0, 'weekly', 1,
 NULL, NULL,
 NULL, 'YAZILIM15', 'products', 70, 0,
 NOW(3), NOW(3)),

-- 4) Sosyal medya takipçi paketi – anasayfa, daily gösterim (aktif)
('d2e3f4a5-b6c7-8901-dcba-ef2345678901',
 'Sosyal Medyada Büyü – Takipçi Paketleri',
 'Instagram, TikTok, YouTube ve daha fazlası için uygun fiyatlı takipçi paketleri! Güvenli ve hızlı teslimat.',
 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800&q=80',
 NULL,
 'Sosyal medya takipçi kampanyası',
 'Paketleri Gör', '/urunler',
 1, 0, 'daily', 4,
 NULL, NULL,
 NULL, 'SOSYAL10', 'home', 60, 0,
 NOW(3), NOW(3)),

-- 5) Oyun hesabı/key kampanyası – ürün sayfaları, once gösterim (aktif)
('e3f4a5b6-c7d8-9012-edcb-fa3456789012',
 'Oyun Keylerinde Büyük İndirim!',
 'Steam, Epic Games ve diğer platformlara ait oyun anahtarlarında sınırsız seçenek, uygun fiyat garantisi.',
 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&q=80',
 NULL,
 'Oyun anahtar kampanyası',
 'Oyunlara Bak', '/urunler',
 1, 1, 'once', 2,
 NULL, NULL,
 NULL, 'OYUN20', 'products', 50, 0,
 NOW(3), NOW(3));
