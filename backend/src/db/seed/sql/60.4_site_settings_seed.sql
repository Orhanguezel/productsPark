-- =============================================================
-- FILE: 60.2_site_settings.seo.seed.sql
-- FINAL — SEO settings (page title/description standards)
-- - Upsert by unique key
-- - Values are stored as plain text
-- =============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

INSERT INTO `site_settings` (`id`, `key`, `value`, `created_at`, `updated_at`) VALUES

-- ------------------------------------------------------------------
-- SITE IDENTITY (SEO base)
-- ------------------------------------------------------------------
('9d3c4a1e-9b66-4bf1-9d4a-6f8e6f3c0001', 'site_title',       'Dijital Ürün Satış Scripti', NOW(3), NOW(3)),
('9d3c4a1e-9b66-4bf1-9d4a-6f8e6f3c0002', 'site_description', 'Dijital Ürün Satış Scripti yazılımı ile dijitalde öne çıkın', NOW(3), NOW(3)),

-- ------------------------------------------------------------------
-- HOME
-- ------------------------------------------------------------------
('9d3c4a1e-9b66-4bf1-9d4a-6f8e6f3c0101', 'seo_home_title',       'Dijimins - Dijital Ürünler, Oyun Lisansları ve Yazılım', NOW(3), NOW(3)),
('9d3c4a1e-9b66-4bf1-9d4a-6f8e6f3c0102', 'seo_home_description', 'Dijital ürünler, oyun lisansları ve yazılım çözümleri. Güvenli ödeme, hızlı teslimat ve 7/24 destek.', NOW(3), NOW(3)),

-- ------------------------------------------------------------------
-- BLOG LIST (/blog)
-- ------------------------------------------------------------------
('9d3c4a1e-9b66-4bf1-9d4a-6f8e6f3c0201', 'seo_blog_title',        'Blog Yazıları - Dijimins', NOW(3), NOW(3)),
('9d3c4a1e-9b66-4bf1-9d4a-6f8e6f3c0202', 'seo_blog_description',  'Dijital ürünler, yazılım ve oyun dünyası hakkında güncel bilgiler, ipuçları ve rehberler.', NOW(3), NOW(3)),

-- ------------------------------------------------------------------
-- PRODUCTS (/urunler)
-- ------------------------------------------------------------------
('9d3c4a1e-9b66-4bf1-9d4a-6f8e6f3c0301', 'seo_products_title',       'Tüm Ürünler - Dijimins', NOW(3), NOW(3)),
('9d3c4a1e-9b66-4bf1-9d4a-6f8e6f3c0302', 'seo_products_description', 'Tüm dijital ürünleri inceleyin. Hızlı teslimat, güvenli ödeme ve avantajlı fiyatlar.', NOW(3), NOW(3)),

-- ------------------------------------------------------------------
-- CATEGORIES (/kategoriler)
-- ------------------------------------------------------------------
('9d3c4a1e-9b66-4bf1-9d4a-6f8e6f3c0401', 'seo_categories_title',       'Tüm Kategoriler - Dijimins', NOW(3), NOW(3)),
('9d3c4a1e-9b66-4bf1-9d4a-6f8e6f3c0402', 'seo_categories_description', 'Kategorilere göre dijital ürünleri keşfedin: oyun, yazılım, abonelik ve daha fazlası.', NOW(3), NOW(3)),

-- ------------------------------------------------------------------
-- CONTACT (/iletisim)
-- ------------------------------------------------------------------
('9d3c4a1e-9b66-4bf1-9d4a-6f8e6f3c0501', 'seo_contact_title',       'Bize Ulaşın - Dijimins', NOW(3), NOW(3)),
('9d3c4a1e-9b66-4bf1-9d4a-6f8e6f3c0502', 'seo_contact_description', 'Sorularınız için bizimle iletişime geçin. Destek ekibimiz size yardımcı olmaktan memnuniyet duyar.', NOW(3), NOW(3)),

-- ------------------------------------------------------------------
-- OPTIONAL PAGES (standart olsun diye)
-- ------------------------------------------------------------------
('9d3c4a1e-9b66-4bf1-9d4a-6f8e6f3c0601', 'seo_about_title',       'Hakkımızda - Dijimins', NOW(3), NOW(3)),
('9d3c4a1e-9b66-4bf1-9d4a-6f8e6f3c0602', 'seo_about_description', 'Dijimins hakkında. Güvenli dijital ürün satışı, hızlı teslimat ve müşteri memnuniyeti odağımızdır.', NOW(3), NOW(3)),

('9d3c4a1e-9b66-4bf1-9d4a-6f8e6f3c0701', 'seo_campaigns_title',       'Kampanyalar - Dijimins', NOW(3), NOW(3)),
('9d3c4a1e-9b66-4bf1-9d4a-6f8e6f3c0702', 'seo_campaigns_description', 'Güncel kampanyalar ve fırsatlar. Seçili dijital ürünlerde avantajlı fiyatlar.', NOW(3), NOW(3)),

('9d3c4a1e-9b66-4bf1-9d4a-6f8e6f3c0801', 'seo_cart_title',       'Sepet - Dijimins', NOW(3), NOW(3)),
('9d3c4a1e-9b66-4bf1-9d4a-6f8e6f3c0802', 'seo_cart_description', 'Sepetinizdeki ürünleri gözden geçirin ve hızlıca satın alma işlemini tamamlayın.', NOW(3), NOW(3)),

('9d3c4a1e-9b66-4bf1-9d4a-6f8e6f3c0901', 'seo_checkout_title',       'Ödeme - Dijimins', NOW(3), NOW(3)),
('9d3c4a1e-9b66-4bf1-9d4a-6f8e6f3c0902', 'seo_checkout_description', 'Güvenli ödeme adımı. Siparişinizi tamamlayın ve teslimat detaylarını görüntüleyin.', NOW(3), NOW(3)),

('9d3c4a1e-9b66-4bf1-9d4a-6f8e6f3c1001', 'seo_login_title',       'Giriş Yap - Dijimins', NOW(3), NOW(3)),
('9d3c4a1e-9b66-4bf1-9d4a-6f8e6f3c1002', 'seo_login_description', 'Hesabınıza giriş yapın ve siparişlerinizi yönetin.', NOW(3), NOW(3)),

('9d3c4a1e-9b66-4bf1-9d4a-6f8e6f3c1101', 'seo_register_title',       'Kayıt Ol - Dijimins', NOW(3), NOW(3)),
('9d3c4a1e-9b66-4bf1-9d4a-6f8e6f3c1102', 'seo_register_description', 'Hızlıca kayıt olun, avantajlardan yararlanın ve siparişlerinizi kolayca takip edin.', NOW(3), NOW(3)),

('9d3c4a1e-9b66-4bf1-9d4a-6f8e6f3c1201', 'seo_faq_title',       'Sık Sorulan Sorular - Dijimins', NOW(3), NOW(3)),
('9d3c4a1e-9b66-4bf1-9d4a-6f8e6f3c1202', 'seo_faq_description', 'Ödeme, teslimat ve ürün kullanımı hakkında sık sorulan soruların yanıtları.', NOW(3), NOW(3)),

('9d3c4a1e-9b66-4bf1-9d4a-6f8e6f3c1301', 'seo_terms_title',       'Kullanım Şartları - Dijimins', NOW(3), NOW(3)),
('9d3c4a1e-9b66-4bf1-9d4a-6f8e6f3c1302', 'seo_terms_description', 'Kullanım şartları ve hizmet koşulları hakkında bilgilendirme.', NOW(3), NOW(3)),

('9d3c4a1e-9b66-4bf1-9d4a-6f8e6f3c1401', 'seo_privacy_title',       'Gizlilik Politikası - Dijimins', NOW(3), NOW(3)),
('9d3c4a1e-9b66-4bf1-9d4a-6f8e6f3c1402', 'seo_privacy_description', 'Kişisel verilerin korunması ve gizlilik politikamız hakkında bilgilendirme.', NOW(3), NOW(3))

ON DUPLICATE KEY UPDATE
  `value`      = VALUES(`value`),
  `updated_at` = VALUES(`updated_at`);
