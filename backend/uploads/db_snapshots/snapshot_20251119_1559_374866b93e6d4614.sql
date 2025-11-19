-- Simple SQL dump generated at 2025-11-19T14:59:08.957Z

CREATE DATABASE IF NOT EXISTS `app` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */;
USE `app`;



-- ----------------------------
-- Table structure for `custom_pages`
-- ----------------------------
DROP TABLE IF EXISTS `custom_pages`;
CREATE TABLE `custom_pages` (
  `id` char(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `content` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`content`)),
  `featured_image` varchar(500) DEFAULT NULL,
  `featured_image_asset_id` char(36) DEFAULT NULL,
  `featured_image_alt` varchar(255) DEFAULT NULL,
  `meta_title` varchar(255) DEFAULT NULL,
  `meta_description` varchar(500) DEFAULT NULL,
  `is_published` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_custom_pages_slug` (`slug`),
  KEY `custom_pages_created_idx` (`created_at`),
  KEY `custom_pages_updated_idx` (`updated_at`),
  KEY `custom_pages_is_published_idx` (`is_published`),
  KEY `custom_pages_featured_asset_idx` (`featured_image_asset_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Records of `custom_pages`
-- ----------------------------
INSERT INTO `custom_pages` (`id`, `title`, `slug`, `content`, `featured_image`, `featured_image_asset_id`, `featured_image_alt`, `meta_title`, `meta_description`, `is_published`, `created_at`, `updated_at`) VALUES 
('85b0ef9a-8f08-431b-b7d9-184b16b08426', 'İade Şartları', 'iade-sartlari', '{\"html\": \"<div class=\\\"container mx-auto px-4 py-12\\\"><h1 class=\\\"text-4xl font-bold mb-8\\\">İade ve Cayma Hakkı Şartları</h1><div class=\\\"prose max-w-none\\\"><h2 class=\\\"text-2xl font-bold mb-4 mt-8\\\">1. Genel Hükümler</h2><p class=\\\"text-muted-foreground mb-6\\\">Dijital ürünlerin satışında, ürünün niteliği gereği cayma hakkı uygulanmamaktadır. 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği uyarınca, dijital içerik ve hizmetler cayma hakkı kapsamı dışındadır.</p><h2 class=\\\"text-2xl font-bold mb-4 mt-8\\\">2. Dijital Ürünlerde İade</h2><p class=\\\"text-muted-foreground mb-6\\\">Satın aldığınız dijital ürünler (oyun kodları, yazılım lisansları, hediye kartları vb.) hemen teslimat yapıldığından ve kullanıma sunulduğundan iade edilemez. Ancak aşağıdaki durumlarda iade ve değişim talep edebilirsiniz:</p><ul class=\\\"list-disc pl-6 space-y-2 text-muted-foreground mb-6\\\"><li>Teslim edilen ürün kodunun çalışmaması</li><li>Yanlış ürünün teslimatı</li><li>Teknik arıza nedeniyle ürünün kullanılamaması</li><li>Platformumuzdan kaynaklanan hataların olması</li></ul><h2 class=\\\"text-2xl font-bold mb-4 mt-8\\\">3. İade Süreci</h2><p class=\\\"text-muted-foreground mb-6\\\">Yukarıda belirtilen durumlarla karşılaştığınızda, satın alma tarihinden itibaren 7 gün içerisinde destek ekibimize başvurabilirsiniz. İade talepleriniz için:</p><ul class=\\\"list-disc pl-6 space-y-2 text-muted-foreground mb-6\\\"><li>Sipariş numaranızı belirtiniz</li><li>Sorunun detaylı açıklamasını yapınız</li><li>Varsa hata ekran görüntüsünü paylaşınız</li></ul><h2 class=\\\"text-2xl font-bold mb-4 mt-8\\\">4. İade Onayı ve Süre</h2><p class=\\\"text-muted-foreground mb-6\\\">İade talebiniz incelendikten sonra 2-5 iş günü içerisinde size dönüş yapılacaktır. Onaylanan iade talepleri için:</p><ul class=\\\"list-disc pl-6 space-y-2 text-muted-foreground mb-6\\\"><li>Ürün değişimi yapılabilir</li><li>Ödeme iadesi hesabınıza yapılabilir</li><li>Hesap bakiyenize iade edilebilir</li></ul><h2 class=\\\"text-2xl font-bold mb-4 mt-8\\\">5. İade Edilemeyecek Durumlar</h2><p class=\\\"text-muted-foreground mb-6\\\">Aşağıdaki durumlarda iade talepleri kabul edilmeyecektir:</p><ul class=\\\"list-disc pl-6 space-y-2 text-muted-foreground mb-6\\\"><li>Ürün kodunun kullanılmış olması</li><li>Müşteri hatası nedeniyle yanlış ürün alınması</li><li>Ürün açıklamasında belirtilen özelliklerle uyumlu teslimat yapılması</li><li>7 günlük sürenin geçmesi</li></ul><h2 class=\\\"text-2xl font-bold mb-4 mt-8\\\">6. İletişim</h2><p class=\\\"text-muted-foreground mb-6\\\">İade ve cayma hakkı ile ilgili sorularınız için destek ekibimizle iletişime geçebilirsiniz.</p></div></div>\"}', NULL, NULL, NULL, NULL, NULL, 1, '2025-10-15 13:07:17.000', '2025-10-15 13:07:17.000'),
('a6d9b2c3-7946-4e04-a8c3-d5962d6900d4', 'Gizlilik Sözleşmesi', 'gizlilik-sozlesmesi', '{\"html\": \"<p>qweqweqwe</p>\"}', NULL, NULL, NULL, NULL, NULL, 1, '2025-10-09 18:40:45.000', '2025-10-09 18:40:45.000'),
('d08dba17-56d9-48c1-b30e-824b390e0009', 'Hizmet Sözleşmesi', 'hizmet-sozlesmesi', '{\"html\": \"<div class=\\\"container mx-auto px-4 py-12\\\"><h1 class=\\\"text-4xl font-bold mb-8\\\">Mesafeli Satış Sözleşmesi</h1><div class=\\\"prose max-w-none\\\"><h2 class=\\\"text-2xl font-bold mb-4 mt-8\\\">1. Taraflar</h2><p class=\\\"text-muted-foreground mb-6\\\">İşbu sözleşme, dijital ürünler platformumuz (bundan sonra \\\"SATICI\\\" olarak anılacaktır) ile platformumuzu kullanan müşteri (bundan sonra \\\"ALICI\\\" olarak anılacaktır) arasında akdedilmiştir.</p><h2 class=\\\"text-2xl font-bold mb-4 mt-8\\\">2. Sözleşmenin Konusu</h2><p class=\\\"text-muted-foreground mb-6\\\">İşbu sözleşme, ALICI\'nın SATICI\'ya ait internet sitesi üzerinden elektronik ortamda siparişini verdiği dijital ürünlerin satışı ve teslimi ile ilgili olarak 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmelere Dair Yönetmelik hükümleri gereğince tarafların hak ve yükümlülüklerini düzenler.</p><h2 class=\\\"text-2xl font-bold mb-4 mt-8\\\">3. Ürün Bilgileri</h2><p class=\\\"text-muted-foreground mb-6\\\">Satışa konu ürünlerin temel özellikleri (türü, miktarı, marka/modeli, rengi, adedi) ürün sayfasında yer almaktadır. ALICI, sipariş vermeden önce ürün bilgilerini incelemiş ve bilgilendirilmiş sayılır.</p><h2 class=\\\"text-2xl font-bold mb-4 mt-8\\\">4. Fiyat ve Ödeme</h2><p class=\\\"text-muted-foreground mb-6\\\">Ürünlerin satış fiyatı, ürün sayfasında gösterilen fiyattır. Fiyatlar KDV dahildir. SATICI, kampanya süresince veya stok durumuna göre fiyatlarda değişiklik yapma hakkını saklı tutar.</p><p class=\\\"text-muted-foreground mb-6\\\">Ödeme şekilleri:</p><ul class=\\\"list-disc pl-6 space-y-2 text-muted-foreground mb-6\\\"><li>Kredi Kartı / Banka Kartı</li><li>Havale / EFT</li><li>Hesap Bakiyesi</li><li>Diğer elektronik ödeme yöntemleri</li></ul><h2 class=\\\"text-2xl font-bold mb-4 mt-8\\\">5. Teslimat</h2><p class=\\\"text-muted-foreground mb-6\\\">Dijital ürünler, ödeme onayından sonra anında veya belirtilen süre içerisinde elektronik ortamda ALICI\'ya teslim edilir. Teslimat, ALICI\'nın kayıtlı e-posta adresine veya hesap panelindeki sipariş detayları bölümüne yapılır.</p><h2 class=\\\"text-2xl font-bold mb-4 mt-8\\\">6. Cayma Hakkı</h2><p class=\\\"text-muted-foreground mb-6\\\">6502 sayılı Tüketicinin Korunması Hakkında Kanun\'un 15. maddesi ve Mesafeli Sözleşmeler Yönetmeliği\'nin 15. maddesi gereğince, dijital içerik ve hizmetlerin sunulması ile birlikte cayma hakkı sona erer. ALICI, dijital ürünü teslim almakla cayma hakkından vazgeçtiğini kabul eder.</p><h2 class=\\\"text-2xl font-bold mb-4 mt-8\\\">7. Garanti ve Sorumluluk</h2><p class=\\\"text-muted-foreground mb-6\\\">SATICI, teslim edilen dijital ürünlerin orijinal ve çalışır durumda olduğunu garanti eder. Ürünle ilgili teknik sorunlar için 7 gün içerisinde destek ekibimize başvurulabilir.</p><h2 class=\\\"text-2xl font-bold mb-4 mt-8\\\">8. Kişisel Verilerin Korunması</h2><p class=\\\"text-muted-foreground mb-6\\\">ALICI\'nın kişisel bilgileri, 6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında işlenir ve korunur. Detaylı bilgi için Gizlilik Politikamızı inceleyebilirsiniz.</p><h2 class=\\\"text-2xl font-bold mb-4 mt-8\\\">9. Uyuşmazlıkların Çözümü</h2><p class=\\\"text-muted-foreground mb-6\\\">İşbu sözleşmeden doğan uyuşmazlıklarda, Tüketici Hakem Heyetleri ve Tüketici Mahkemeleri yetkilidir. ALICI, sipariş verdiği anda bu sözleşmeyi kabul etmiş sayılır.</p><h2 class=\\\"text-2xl font-bold mb-4 mt-8\\\">10. Yürürlük</h2><p class=\\\"text-muted-foreground mb-6\\\">İşbu sözleşme, ALICI tarafından elektronik ortamda onaylanmasıyla yürürlüğe girer. SATICI, sözleşmede değişiklik yapma hakkını saklı tutar.</p></div></div>\"}', NULL, NULL, NULL, NULL, NULL, 1, '2025-10-15 13:07:17.000', '2025-10-15 13:07:17.000');


-- ----------------------------
-- Table structure for `site_settings`
-- ----------------------------
DROP TABLE IF EXISTS `site_settings`;
CREATE TABLE `site_settings` (
  `id` char(36) NOT NULL,
  `key` varchar(100) NOT NULL,
  `value` mediumtext NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `site_settings_key_uq` (`key`),
  KEY `site_settings_key_idx` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Records of `site_settings`
-- ----------------------------
INSERT INTO `site_settings` (`id`, `key`, `value`, `created_at`, `updated_at`) VALUES 
('05641622-aa04-4005-9d11-906f54d94447', 'home_blog_badge', 'Blog Yazılarımız', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('07d5dc6d-329c-4ffc-b201-4ca5c7b42a64', 'new_ticket_telegram', '\"true\"', '2025-10-15 20:29:38.000', '2025-10-15 20:29:38.000'),
('0850d23e-c07f-4bb8-a2dd-eb688a2bed47', 'bank_transfer_enabled', 'false', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('0b9c4a6b-5c56-4a6f-8f4a-2f2a3fb5e001', 'contact_email', 'info@koenigsmassage.com', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('0ccbf739-2308-4b58-a966-7d0d0f0e51d9', 'seo_contact_title', 'Bize Ulaşın - Dijimins', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('0f2ff5df-db32-45a1-a1e6-2452f6437643', 'home_featured_title', 'En çok satan ürünlerimize göz atın', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('1087ac95-f609-47eb-bd22-eedc70593ee2', 'smtp_from_name', 'Dijital Paket', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('12dd13d2-8b53-40be-9e77-23bb58f12240', 'paytr_merchant_salt', '{{PAYTR_MERCHANT_SALT}}', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('1326ba2b-66db-4914-a6e5-df1dfbe283fd', 'papara_enabled', 'false', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('13a7cd2f-f1d4-4947-b023-d877ad392e69', 'paytr_merchant_id', '{{PAYTR_MERCHANT_ID}}', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('15e7fde3-5d70-4a6e-a35e-b9e437e96e59', 'new_deposit_request_telegram', 'false', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('18610713-8f96-4936-a0b6-6dfad2740f50', 'payment_methods', '{ \"eft_enabled\": false, \"havale_account_holder\": \"qweqwe\", \"havale_bank_name\": \"qwe\", \"havale_enabled\": true, \"havale_iban\": \"TR545454545454545454545\" }', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('18da4735-0520-4a37-9fb4-bddb01807e62', 'deposit_telegram', 'true', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('1f9a16f9-1264-4883-a300-803608e3a9de', 'linkedin_url', 'https://lovable.dev', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('214f86a4-9c0d-4f52-9430-fe0c0d6b958f', 'home_display_mode', 'list', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('268e7369-f6cd-41b6-8106-2a61b55191cc', 'facebook_pixel_id', '\"\"', '2025-10-15 20:29:38.000', '2025-10-15 20:29:38.000'),
('2e0b304e-564b-476f-9d47-754a1fb756f0', 'currency_rates', '{ \"EUR\": 0.029, \"TRY\": 1, \"USD\": 0.031 }', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('2e697726-0a35-4fb1-82f8-9a2796f2fa50', 'home_featured_button', 'Tüm Ürünleri Görüntüle', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('31479cbe-aeb0-407a-bc65-d75e906ee8f4', 'footer_company_name', 'Dijital Markets', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('35366fb2-e7fb-44c1-acec-a7248297d2f3', 'telegram_template_new_deposit_request', '💰 *Yeni Bakiye Yükleme Talebi!*\n\n👤 Kullanıcı: {{user_name}}\n💵 Tutar: {{amount}} TL\n💳 Ödeme Yöntemi: {{payment_method}}\n\n⏰ Talep Tarihi: {{created_at}}', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('3922f119-262d-4e86-bab6-24a5506e3ffa', 'fake_notifications_enabled', 'false', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('399a22ce-584c-4349-a6e4-e579e6993189', 'new_payment_request_telegram', 'true', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('4126e116-ec07-4d85-a7ea-647863cb8374', 'telegram_notifications_enabled', 'false', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('4329c222-cafc-4692-ac06-31d39f1ec43d', 'facebook_url', 'https://lovable.devs', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('461d0e2f-a3c1-4bad-a93a-39fc2374574d', 'home_step_1_title', 'Ürünü Seçin', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('4622950e-a0d6-4b0d-927c-d03666da627d', 'home_hero_image_alt', 'Dijital Ürünler', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('46b44590-f31d-4174-8fca-e555612f608e', 'auto_update_rates', 'false', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('4784bd38-755a-455f-8c04-5ddd039eb76e', 'maintenance_message', 'qwe', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('47a92af6-cbbb-4818-8b3f-41f85ba36924', 'home_header_sub_text_2', '%10 Fırsatı Dijimin\'de!', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('4a516115-e1c1-4d69-a90e-fd576c8bfb60', 'home_faq_cta_title', 'Başka sorunuz mu var?', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('4b8fddb8-82f3-4518-a045-301df0f50099', 'telegram_chat_id', '7474884105', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('4e67bbd7-16dd-4724-b3b2-e47e53d7202c', 'home_step_3_title', 'Anında Teslimat', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('55fd06de-2343-426d-b8ce-3b0ad6fe854d', 'light_logo', '', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('574409c9-8a46-4917-a3a9-74cfe01398a0', 'maintenance_mode', 'false', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('5807e24f-c274-4312-b481-072e048c2c7f', 'telegram_template_new_order', '🛒 *Yeni Sipariş Alındı!*\n\n📋 Sipariş No: {{order_number}}\n👤 Müşteri: {{customer_name}}\n📧 Email: {{customer_email}}\n{{customer_phone}}\n\n💰 Toplam Tutar: {{final_amount}} TL\n{{discount}}\n\n📦 Ürünler:\n{{order_items}}\n\n⏰ Sipariş Tarihi: {{created_at}}', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('5dab8c8e-5154-49a4-bea8-7506bb3db323', 'home_header_top_text', 'İndirim Sezonu Başladı', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('5def2712-3ea9-42d5-a1e6-2452f6437643', 'home_header_show_contact', 'false', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('654dd48f-ceaa-4d52-bcb8-af771404bacf', 'theme_mode', 'user_choice', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('68fc971a-35c1-4fd2-a57a-8eb8cb6320f7', 'home_step_4_title', '7/24 Destek', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('6bee2ce3-ed8c-4314-9efb-b5cd9e7d46a2', 'custom_header_code', '<meta name=\"robots\" content=\"noindex, nofollow\" />', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('6d3e8f93-b0af-4d3e-bea2-bff8a010a6b3', 'telegram_template_new_ticket', '🎫 *Yeni Destek Talebi Açıldı!*\n\n👤 Kullanıcı: {{user_name}}\n📋 Konu: {{subject}}\n📊 Öncelik: {{priority}}\n{{category}}\n\n💬 Mesaj:\n{{message}}\n\n⏰ Talep Tarihi: {{created_at}}', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('74d242b4-4e95-4d34-b161-10992f34a0c5', 'notification_delay', '10', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('7889683d-11ce-45d3-82b0-852af73ae314', 'home_scroll_content_active', 'true', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('7cbfe225-76e0-4eb9-8281-8cd1b21aad9d', 'telegram_template_new_payment_request', '💳 *Yeni Ödeme Talebi!*\n\n📋 Sipariş No: {{order_number}}\n👤 Müşteri: {{customer_name}}\n📧 Email: {{customer_email}}\n{{customer_phone}}\n\n💰 Tutar: {{amount}} TL\n💳 Ödeme Yöntemi: {{payment_method}}\n\n📦 Ürünler:\n{{order_items}}\n\n⏰ Talep Tarihi: {{created_at}}', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('7d415987-ea03-4f91-a73c-2cf3772ea870', 'home_how_it_works_subtitle', '4 basit adımda dijital ürününüze sahip olun', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('7e7b0da-4d65-47fd-aa26-7897e59fa980', 'home_featured_badge', 'Öne Çıkan Ürünler', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('7e7ba2d9-d2ed-4da0-8209-fda5747b365c', 'shopier_enabled', 'true', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('7f3c8544-6a6a-48d4-b138-459d92563742', 'footer_address', 'Atatürk Cad. No:123\nİstanbul, Türkiye', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('7fcde91a-3cdd-4855-aeaf-44b450d5b21f', 'home_how_it_works_title', 'Nasıl Çalışır?', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('85fee78a-9edd-4cea-b3c8-e7cf71b7655b', 'home_hero_image_url', 'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/hero-1760112144368.webp', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('87041eeb-ebce-47fe-ab50-b2b6aab1780a', 'paytr_commission', '25', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('8835e526-9a8e-459e-accc-90458b77c198', 'home_faq_cta_button', 'Bize Ulaşın →', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('88b90a74-4de2-4652-af81-bee79ff8fc19', 'paytr_enabled', 'true', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('893af6a3-fd21-4177-bf63-e3e2816fdd60', 'home_scroll_content', '<h2>Hesap Satın Als</h2><p>Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.<span style=\\\"color: rgb(15, 23, 41);\\\">Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.</span></p><h2>Hesap Satın Al</h2><p>Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.</p><h2>Hesap Satın Al</h2><p>Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.</p><h2>Hesap Satın Al</h2><p>Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.</p><h2>Hesap Satın Al</h2><p>Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.</p><h2>Hesap Satın Al</h2><p>Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.</p>', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('893ef6b1-a216-4a17-9c4d-04f3ffadacaa', 'notification_interval', '30', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('8b2a260b-ad7e-4782-a0de-8780e9f3c6d2', 'home_step_1_desc', 'Geniş ürün yelpazemizden ihtiyacınıza uygun dijital ürünü bulun ve inceleyin.', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('8b717068-dc98-49b8-a1f5-3826c61dff12', 'home_blog_subtitle', 'Dijital ürünler, teknoloji ve güvenlik hakkında en güncel bilgiler', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('9321c220-2de1-435a-b6c1-e5c53cb6e7d6', 'home_faq_title', 'Sıkça Sorulan Sorular', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('94146c25-34a2-45fa-a324-324c5536529d', 'paytr_merchant_key', '{{PAYTR_MERCHANT_KEY}}', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('9467a590-99c1-4c14-a070-25c4da00ffd3', 'paytr_test_mode', 'true', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('96e8d247-2b2e-445e-934b-37c863b374d4', 'notification_display_duration', '5', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('98c6835c-67b9-470c-9924-30da6913b0b9', 'smtp_from_email', 'info@koenigsmassage.com', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('9c0a3b3a-b0f5-46a1-884b-ba3e14e1771d', 'deposit_approved_telegram', 'true', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('9e90cd77-f23a-49e2-96c8-1906e5f076ab', 'twitter_url', 'https://lovable.dev', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('a061caa1-3470-4322-9219-49251b517260', 'smtp_port', '465', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('a0d4bff5-aa59-4233-af47-26db5631ba87', 'smtp_username', 'info@koenigsmassage.com', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('a4b49c13-f954-4cc8-9726-e2587d87f734', 'custom_footer_code', '', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('a62aaa4c-2f23-40e9-99d1-60b41d5b5825', 'home_faq_cta_subtitle', 'Destek ekibimiz size yardımcı olmak için hazır', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('a6355cc0-94af-4222-bd2e-c8a1d43061ef', 'site_description', 'Dijital Ürün Satış Scripti yazılımı ile dijitalde öne çıkın', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('a766e2c9-0351-46b5-9036-1498b3a57d71', 'seo_blog_title', 'Blog Yazıları - Dijimins', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('a8324fa7-d352-4ad1-8504-6feb77ad9d4c', 'stripe_public_key', '', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('a841f4ea-c037-44c2-8c59-70be391ca655', 'home_step_2_desc', 'Kredi kartı, havale veya kripto para ile güvenli ödeme yapın.', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('aa8db0d1-7f55-44fa-b2b7-16cbdbcc7b83', 'seo_categories_title', 'Tüm Kategoriler - Dijimins', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('ab149570-5098-40e5-a6f7-69736b100c15', 'whatsapp_number', '+905454905148', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('acda45f1-7cf8-41f8-b1e2-837dcb1150ff', 'home_header_sub_text_1', 'Yeni Üyelere Özel', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('af53a3f7-2caf-4020-8b81-3f7b9862212f', 'guest_order_enabled', 'true', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('b2f83dca-5b8e-47ac-94b6-cdc88c9df2a0', 'default_currency', 'TRY', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('b8a4c347-2861-4e20-885c-e6bc919a7fb0', 'shopier_client_secret', '{{SHOPIER_CLIENT_SECRET}}', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('bc24ca21-c40d-4fd0-89f6-749683bc2b6d', 'stripe_secret_key', '', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('bcb92ef4-4a60-4d0c-877b-7c5139f26042', 'bank_account_info', 'QNB Finansbank A.Ş\nIBAN : TR45 5698 5995 4585 4565 45\nHesap Sahibi: xyz', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('bd53715d-36bd-413b-96dd-ff2ee7e1d465', 'home_header_bottom_text', 'It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout.', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('bde09951-f709-4526-b32a-fa0a25456519', 'home_faq_items', '\"[{\\\"answer\\\":\\\"Ödemeniz onaylandıktan sonra ürününüz otomatik olarak anında e-posta adresinize ve üye panelinize teslim edilir. Ortalama teslimat süresi 1-2 dakikadır.s4\\\",\\\"question\\\":\\\"Ürünler ne kadar sürede teslim edilir?s4\\\"},{\\\"answer\\\":\\\"Kredi kartı, banka havalesi, Papara, PayTR, Shopier ve kripto para (Coinbase Commerce) ile ödeme yapabilirsiniz. Tüm ödemeler SSL sertifikası ile güvence altındadır.s4\\\",\\\"question\\\":\\\"Hangi ödeme yöntemlerini kabul ediyorsunuz?sa4\\\"},{\\\"answer\\\":\\\"Satın aldığınız ürün çalışmaz veya hatalı ise 7 gün içinde destek ekibimizle iletişime geçerek değişim veya iade talebinde bulunabilirsiniz. Tüm ürünlerimiz garanti kapsamındadır.s4\\\",\\\"question\\\":\\\"Ürün çalışmazsa ne olur?s4\\\"},{\\\"answer\\\":\\\"Evet! 5+ ürün alımlarında %5, 10+ ürün alımlarında %10 indirim otomatik olarak uygulanır. Daha fazla bilgi için müşteri hizmetlerimizle iletişime geçebilirsiniz.s4\\\",\\\"question\\\":\\\"Toplu alımlarda indirim var mı?s4\\\"},{\\\"answer\\\":\\\"Her ürünün kullanım koşulları farklıdır. Ürün detay sayfasında lisans türü ve kaç cihazda kullanılabileceği belirtilmiştir. Tek kullanımlık, çoklu kullanım ve süreli lisanslar mevcuttur.s4\\\",\\\"question\\\":\\\"Lisanslar kaç cihazda kullanılabilir?sa4\\\"},{\\\"answer\\\":\\\"7/24 canlı destek, e-posta, WhatsApp ve Telegram üzerinden bizimle iletişime geçebilirsiniz. Üye panelinizden destek talebi oluşturabilir veya SSS bölümünü inceleyebilirsiniz.s4\\\",\\\"question\\\":\\\"Müşteri desteği nasıl alırım?sa4\\\"}]\"', '2025-10-15 20:29:38.000', '2025-10-15 20:29:38.000'),
('be8379fe-8e56-4be0-8a53-3c3f5c1533bc', 'payment_commission', '{ \"paytr_enabled\": true, \"paytr_havale_enabled\": true, \"paytr_havale_rate\": \"0\", \"paytr_rate\": \"5\", \"shopier_enabled\": true, \"shopier_rate\": \"5\" }', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('befcdf24-a0f8-4d6d-b6a4-c8f8f1a40573', 'home_blog_button', 'Tüm Blog Yazıları', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('c0a1e4ff-bbf4-4926-bce8-b2c8f8366499', 'home_faq_subtitle', 'Merak ettiklerinizin cevaplarını burada bulabilirsiniz', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('c3ed6a86-bda6-4795-a319-50ed8644acf2', 'telegram_template_deposit_approved', '💰 *Bakiye Yükleme Onaylandı!*\n\n👤 Kullanıcı: {{user_name}}\n💵 Tutar: {{amount}} TL\n\n⏰ Onay Tarihi: {{created_at}}', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('c4719799-b091-4a55-91e2-19d481d2c6db', 'home_header_button_text', 'Ürünleri İncele', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('c4e50751-6ad4-47bf-88eb-f611ba09b244', 'site_title', 'Dijital Ürün Satış Scripti', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('c68be08e-ac40-4141-9bd9-21c026f8654a', 'footer_email', 'destek@dijitalmarket.com', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('c74ee6fd-7e93-47d2-8006-d0af348b7890', 'footer_copyright', '© 2025 Dijital Market. Tüm hakları saklıdır.', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('c8561584-2ebd-40bc-862c-a72bd77072a4', 'smtp_host', 'smtp.hostinger.com', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('c98dc691-46d6-4333-99ae-df9b1541e83b', 'google_analytics_id', '', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('c9afa0eb-4890-40b1-8726-764b1c2bef2d', 'discord_webhook_url', '', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('ca7bdfbb-f63f-457d-8211-110f2fc00441', 'stripe_enabled', 'false', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('d2023d10-e221-4e1f-97e7-1b40acfa21d1', 'shopier_client_id', '{{SHOPIER_CLIENT_ID}}', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('d2192478-88c9-4598-bc15-3217fe4fb20f', 'shopier_commission', '50', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('d32b6c9a-0677-4103-8f05-2eec6d8dd4e1', 'paytr_havale_commission', '0', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('d4dbaa77-8716-4907-910d-aec623839527', 'favicon_url', '', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('d56bf4e0-6e85-4e89-bf61-8578ffc1cf00', 'home_step_3_desc', 'Ödeme onaylandıktan sonra ürününüz otomatik olarak e-posta ve panele iletilir.', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('d7cdd57c-58cc-4463-bfa6-7eb694017c53', 'dark_logo', '', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655');
INSERT INTO `site_settings` (`id`, `key`, `value`, `created_at`, `updated_at`) VALUES 
('d923a87e-29e9-441e-9cbb-235aa2821863', 'min_balance_limit', '10', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('da4bd864-c314-4bd7-be98-aea579fc8ed4', 'paytr_havale_enabled', 'true', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('dc33b02b-39e7-46bc-a38f-e7fd84c6472b', 'home_step_2_title', 'Güvenli Ödeme', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('e07b6795-de4a-437f-8800-d7b049918bfe', 'telegram_bot_token', '{{TELEGRAM_BOT_TOKEN}}', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('e08f392a-d5fd-4b46-bfaa-5fd9a0bfafef', 'instagram_url', 'https://lovable.dev', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('e3d3b0d6-a2fb-4488-a749-7d3288fa4432', 'home_blog_title', 'Güncel İçerikler', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('e6eaf2b4-e5af-4d98-885a-766868a1c973', 'seo_products_title', 'Tüm Ürünler - Dijimins', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('e7963d57-7ca1-4be5-9567-68457771eb60', 'available_currencies', '[\"TRY\",\"USD\",\"EUR\"]', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('ea353228-8b3a-4a50-b487-d4f09c922205', 'papara_api_key', '', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('f613de65-d7e2-4707-9532-9643ba933128', 'smtp_ssl', 'true', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('f7ee0f74-142b-4018-8e6b-d8ed89f7bd87', 'smtp_password', 'Kaman@12!', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('f90bb37f-4148-4a49-939c-da27ba3a9cdf', 'new_order_telegram', 'true', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('faf0f287-8395-4ee9-8a5e-91f2caf07f79', 'footer_description', 'Güvenilir dijital ürün satış platformu. En uygun fiyatlarla lisans, hesap, yazılım ve daha fazlası.', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('fb9431b3-fa22-490d-8529-bcf7f3a57290', 'footer_phone', '+90 555 555 55 55', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655'),
('fc30d214-e458-466b-809f-019b4228fca5', 'home_step_4_desc', 'Herhangi bir sorun yaşarsanız destek ekibimiz size yardımcı olmaya hazır.', '2025-11-19 14:47:59.655', '2025-11-19 14:47:59.655');


-- ----------------------------
-- Table structure for `storage_assets`
-- ----------------------------
DROP TABLE IF EXISTS `storage_assets`;
CREATE TABLE `storage_assets` (
  `id` char(36) NOT NULL,
  `user_id` char(36) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `bucket` varchar(64) NOT NULL,
  `path` varchar(512) NOT NULL,
  `folder` varchar(255) DEFAULT NULL,
  `mime` varchar(127) NOT NULL,
  `size` bigint(20) unsigned NOT NULL,
  `width` int(10) unsigned DEFAULT NULL,
  `height` int(10) unsigned DEFAULT NULL,
  `url` text DEFAULT NULL,
  `hash` varchar(64) DEFAULT NULL,
  `provider` varchar(16) NOT NULL DEFAULT 'cloudinary',
  `provider_public_id` varchar(255) DEFAULT NULL,
  `provider_resource_type` varchar(16) DEFAULT NULL,
  `provider_format` varchar(32) DEFAULT NULL,
  `provider_version` int(10) unsigned DEFAULT NULL,
  `etag` varchar(64) DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_bucket_path` (`bucket`,`path`),
  KEY `idx_storage_bucket` (`bucket`),
  KEY `idx_storage_folder` (`folder`),
  KEY `idx_storage_created` (`created_at`),
  KEY `idx_provider_pubid` (`provider_public_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



-- ----------------------------
-- Table structure for `topbar_settings`
-- ----------------------------
DROP TABLE IF EXISTS `topbar_settings`;
CREATE TABLE `topbar_settings` (
  `id` char(36) NOT NULL,
  `text` varchar(255) NOT NULL,
  `link` varchar(500) DEFAULT NULL,
  `coupon_id` char(36) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 0,
  `show_ticker` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `topbar_settings_active_idx` (`is_active`),
  KEY `topbar_settings_created_idx` (`created_at`),
  KEY `topbar_settings_coupon_idx` (`coupon_id`),
  CONSTRAINT `fk_topbar_coupon` FOREIGN KEY (`coupon_id`) REFERENCES `coupons` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Records of `topbar_settings`
-- ----------------------------
INSERT INTO `topbar_settings` (`id`, `text`, `link`, `coupon_id`, `is_active`, `show_ticker`, `created_at`, `updated_at`) VALUES 
('07bf8399-21fe-47fe-909d-9b6174bb4970', 'Üye Ol %10 İndirim Kazan', '/coupon', '07e668cd-2f84-4182-a35e-f55cebf893d8', 1, 1, '2025-10-09 19:09:07.000', '2025-11-19 14:57:41.817');


-- ----------------------------
-- Table structure for `order_items`
-- ----------------------------
DROP TABLE IF EXISTS `order_items`;
CREATE TABLE `order_items` (
  `id` char(36) NOT NULL,
  `order_id` char(36) NOT NULL,
  `product_id` char(36) NOT NULL,
  `product_name` varchar(255) NOT NULL,
  `quantity` int(11) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `total` decimal(10,2) NOT NULL,
  `options` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`options`)),
  `delivery_status` enum('pending','processing','delivered','failed') NOT NULL DEFAULT 'pending',
  `activation_code` varchar(255) DEFAULT NULL,
  `stock_code` varchar(255) DEFAULT NULL,
  `api_order_id` varchar(255) DEFAULT NULL,
  `delivery_content` longtext DEFAULT NULL,
  `turkpin_order_no` varchar(255) DEFAULT NULL,
  `delivered_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `oi_order_idx` (`order_id`),
  KEY `oi_product_idx` (`product_id`),
  KEY `oi_status_idx` (`delivery_status`),
  KEY `oi_delivered_idx` (`delivered_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Records of `order_items`
-- ----------------------------
INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `product_name`, `quantity`, `price`, `total`, `options`, `delivery_status`, `activation_code`, `stock_code`, `api_order_id`, `delivery_content`, `turkpin_order_no`, `delivered_at`, `created_at`, `updated_at`) VALUES 
('00523658-2cc7-4355-8dca-5f053ca7c26f', '7a5df02c-0838-404a-8066-5362b7f3c429', '0132e42e-d46a-444d-9080-a419aec29c9c', '500 Takipçi', 1, '0.00', '50.00', NULL, 'delivered', NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-14 09:57:59.000', '2025-10-19 14:50:55.000'),
('02a1d4a7-3878-485b-b5f7-277f08a3ac92', '401fc239-3971-4e1f-9f22-6ba73beb8e09', '0132e42e-d46a-444d-9080-a419aec29c9c', '500 Takipçi', 1, '0.00', '50.00', NULL, 'failed', NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-15 10:01:56.000', '2025-10-19 14:50:55.000'),
('046c4db8-f088-449f-b9ad-afd96ffbec24', '84f2a5e4-d948-4823-a6fb-1be3695979e8', '408ef745-5456-4115-ad79-3a26034edc37', '100 Takipçi', 1, '0.00', '10.00', NULL, 'pending', NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-08 10:15:37.000', '2025-10-19 14:50:55.000'),
('093b2ae6-05cc-43b3-8036-8e86a7a642a2', 'ad35503e-6029-476d-8e4d-8a80b6c329ed', 'a76e27ef-e486-4cf8-b765-e12e51d52768', 'Adobe Photoshop Lisans Key', 1, '0.00', '179.99', NULL, 'delivered', 'X1C2V-B3N4M-L5K6J-H7G8F-D9S0A', NULL, NULL, NULL, NULL, NULL, '2025-10-14 09:47:25.000', '2025-10-19 14:50:55.000'),
('0951ba55-d923-4313-8107-bd5e72b0a94c', 'e8fbbd95-d1c9-4192-af0f-b088d8c0e4e4', '408ef745-5456-4115-ad79-3a26034edc37', '100 Takipçi', 1, '0.00', '10.00', NULL, 'pending', NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-09 08:38:57.000', '2025-10-19 14:50:55.000');


-- ----------------------------
-- Table structure for `coupons`
-- ----------------------------
DROP TABLE IF EXISTS `coupons`;
CREATE TABLE `coupons` (
  `id` char(36) NOT NULL,
  `code` varchar(50) NOT NULL,
  `title` varchar(200) DEFAULT NULL,
  `content_html` mediumtext DEFAULT NULL,
  `discount_type` enum('percentage','fixed') NOT NULL,
  `discount_value` decimal(10,2) NOT NULL DEFAULT 0.00,
  `min_purchase` decimal(10,2) DEFAULT NULL,
  `max_discount` decimal(10,2) DEFAULT NULL,
  `usage_limit` int(11) DEFAULT NULL,
  `used_count` int(11) NOT NULL DEFAULT 0,
  `applicable_to` enum('all','category','product') NOT NULL DEFAULT 'all',
  `category_ids` text DEFAULT NULL,
  `product_ids` text DEFAULT NULL,
  `valid_from` datetime(3) DEFAULT NULL,
  `valid_until` datetime(3) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `coupons_code_uq` (`code`),
  KEY `coupons_active_idx` (`is_active`),
  KEY `coupons_valid_from_idx` (`valid_from`),
  KEY `coupons_valid_until_idx` (`valid_until`),
  KEY `coupons_applicable_idx` (`applicable_to`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Records of `coupons`
-- ----------------------------
INSERT INTO `coupons` (`id`, `code`, `title`, `content_html`, `discount_type`, `discount_value`, `min_purchase`, `max_discount`, `usage_limit`, `used_count`, `applicable_to`, `category_ids`, `product_ids`, `valid_from`, `valid_until`, `is_active`, `created_at`, `updated_at`) VALUES 
('07e668cd-2f84-4182-a35e-f55cebf893d8', '2025', '2025 Yılbaşı İndirimi', '500 TL ve üzeri alışverişlerde sepette %25 indirim sağlar.', 'percentage', '25.00', '500.00', NULL, NULL, 3, 'category', '[\"d9a27929-1471-427d-9d28-418e6fc340e3\"]', NULL, '2025-10-07 00:00:00.000', NULL, 1, '2025-10-07 13:17:24.000', '2025-11-19 14:57:06.742');


-- ----------------------------
-- Table structure for `support_tickets`
-- ----------------------------
DROP TABLE IF EXISTS `support_tickets`;
CREATE TABLE `support_tickets` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `subject` varchar(255) NOT NULL,
  `message` longtext NOT NULL,
  `status` enum('open','in_progress','waiting_response','closed') NOT NULL DEFAULT 'open',
  `priority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_support_tickets_user` (`user_id`),
  KEY `idx_support_tickets_created` (`created_at`),
  KEY `idx_support_tickets_updated` (`updated_at`),
  KEY `idx_support_tickets_status` (`status`),
  KEY `idx_support_tickets_priority` (`priority`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Records of `support_tickets`
-- ----------------------------
INSERT INTO `support_tickets` (`id`, `user_id`, `subject`, `message`, `status`, `priority`, `created_at`, `updated_at`) VALUES 
('10c9b25a-91ef-4711-84a9-af7118d61d15', '19a2bc26-63d1-43ad-ab56-d7f3c3719a34', 'hhh', 'hhghfh', 'open', 'high', '2025-10-13 15:41:10.000', '2025-10-13 15:41:10.000'),
('1b483b05-a8e0-48bd-8233-792863d26973', '19a2bc26-63d1-43ad-ab56-d7f3c3719a34', 'jhkhjk', 'kkk4545', 'open', 'medium', '2025-10-13 15:49:56.000', '2025-10-13 17:00:18.000'),
('22c8d700-a5b8-4395-b1ce-1aba42495add', '19a2bc26-63d1-43ad-ab56-d7f3c3719a34', 'vay', 'asdfsf', 'open', 'urgent', '2025-10-13 15:33:19.000', '2025-10-13 15:33:19.000'),
('3cefc270-a8a9-43bc-82c1-996f6b0c1526', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'sdfsdf', 'sdfsdfsdfsdf', 'open', 'high', '2025-10-13 17:02:22.000', '2025-10-13 17:02:22.000'),
('48beb30b-bbd2-44e9-a595-048f2632af20', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'Yahahhahasdasd', 'sdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdf', 'open', 'high', '2025-10-13 15:45:08.000', '2025-10-13 15:45:08.000'),
('534148b8-7462-422e-93d7-430cc2fdf6a1', '19a2bc26-63d1-43ad-ab56-d7f3c3719a34', 'zıortapoz', 'necmi naber', 'open', 'medium', '2025-10-13 15:39:01.000', '2025-10-13 15:39:01.000'),
('8040c380-9855-4a97-8581-b64f7b32936c', '4a8fb7f7-0668-4429-9309-fe88ac90eed2', 'Sipariş', 'Ne zaman gelicek', 'open', 'medium', '2025-10-13 20:23:48.000', '2025-10-13 20:23:48.000'),
('8e741f22-84fd-4186-a626-f7e6ac4e7680', '19a2bc26-63d1-43ad-ab56-d7f3c3719a34', 'hqqqqqqqqq', '213123123', 'open', 'medium', '2025-10-13 15:43:58.000', '2025-10-13 15:43:58.000'),
('8f83c5b7-5cbb-4d7e-8262-2b89c5415e6d', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'jklj', 'jlkjkljkl', 'closed', 'medium', '2025-10-13 17:02:39.000', '2025-10-15 14:23:24.000'),
('951808b7-632b-4f6f-b2ff-a55f06ad19f9', '19a2bc26-63d1-43ad-ab56-d7f3c3719a34', 'fgfgfg', 'fgfgf', 'open', 'high', '2025-10-13 15:17:40.000', '2025-10-13 15:17:40.000'),
('952f0b54-c62e-4284-96fd-f3c968339cff', '7129bc31-88dc-42da-ab80-415a21f2ea9a', '67', '6666', 'open', 'medium', '2025-10-13 15:44:36.000', '2025-10-13 15:44:36.000'),
('96fe7c2e-36df-4d38-933b-ad6df54a47eb', '19a2bc26-63d1-43ad-ab56-d7f3c3719a34', 'jjjjjjj', 'eeeeeeeeeeee', 'open', 'low', '2025-10-13 15:42:39.000', '2025-10-13 15:42:39.000'),
('a2f05a24-ac0b-4b59-a322-9864cc5e5364', '0ac37a5c-a8be-4d25-b853-1e5c9574c1b3', 'Sipariş Hk', 'qweqweqweqwe', 'closed', 'high', '2025-10-13 12:55:00.000', '2025-10-13 12:55:48.000'),
('a894ffcf-28cb-4609-9021-b381e559a5f2', '19a2bc26-63d1-43ad-ab56-d7f3c3719a34', 'ghghg', 'fghfghfgh', 'open', 'low', '2025-10-13 15:37:19.000', '2025-10-13 15:37:19.000'),
('abebedb2-eefb-4d8f-a3bc-bb7e5b96a8aa', '19a2bc26-63d1-43ad-ab56-d7f3c3719a34', 'sordum', 'çiçeğe', 'open', 'medium', '2025-10-13 15:31:05.000', '2025-10-13 15:31:05.000'),
('c742d0ad-3f07-466b-ac1e-2cf34b84941a', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'Zaza', 'Zaza zaza', 'open', 'high', '2025-10-15 14:43:45.000', '2025-10-15 14:43:45.000'),
('ded743a6-7618-430c-bffb-e4db49dc6247', '4a8fb7f7-0668-4429-9309-fe88ac90eed2', 'Rast Gelsin İşin', 'qweqwewqe', 'open', 'medium', '2025-10-15 14:54:04.000', '2025-10-15 14:54:40.000'),
('df786c2d-5668-4688-88ad-952a3eebc812', '19a2bc26-63d1-43ad-ab56-d7f3c3719a34', 'eee', 'sdfsd', 'open', 'high', '2025-10-13 15:25:49.000', '2025-10-13 15:25:49.000'),
('dff55daa-ff67-401e-ba81-9513e2fbb164', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'df', 'dfdsfsdf', 'closed', 'medium', '2025-10-06 22:28:30.000', '2025-10-13 12:55:58.000'),
('e1b24422-8042-4897-a2e5-ff8dfb20ba3b', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'sdfsdf', 'sdfsdfsdf', 'open', 'high', '2025-10-13 17:02:29.000', '2025-10-13 17:02:29.000'),
('eb07b91d-d727-40a0-9dcd-55321578d0ab', 'd279bb9d-797d-4972-a8bd-a77a40caba91', 'Zübüşmatik', 'Petmatik', 'open', 'medium', '2025-10-14 08:08:53.000', '2025-10-14 08:08:53.000'),
('ebea761f-8dbe-42ff-9805-2a8c552d9388', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'qweqweqwe', 'asdasdsa', 'open', 'urgent', '2025-10-13 17:02:16.000', '2025-10-13 17:02:16.000'),
('f20fa9f8-5d93-463a-bf7b-60449fa5dfa4', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'Rast', 'RASt', 'open', 'medium', '2025-10-15 14:50:50.000', '2025-10-15 14:55:56.000');


-- ----------------------------
-- Table structure for `faqs`
-- ----------------------------
DROP TABLE IF EXISTS `faqs`;
CREATE TABLE `faqs` (
  `id` char(36) NOT NULL,
  `question` varchar(500) NOT NULL,
  `answer` longtext NOT NULL,
  `slug` varchar(255) NOT NULL,
  `category` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `display_order` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_faqs_slug` (`slug`),
  KEY `faqs_active_idx` (`is_active`),
  KEY `faqs_order_idx` (`display_order`),
  KEY `faqs_created_idx` (`created_at`),
  KEY `faqs_updated_idx` (`updated_at`),
  KEY `faqs_category_idx` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Records of `faqs`
-- ----------------------------
INSERT INTO `faqs` (`id`, `question`, `answer`, `slug`, `category`, `is_active`, `display_order`, `created_at`, `updated_at`) VALUES 
('bec38937-c556-11f0-94cf-e86c61a30d56', 'Ürünler ne kadar sürede teslim edilir?', 'Ödemeniz onaylandıktan sonra ürününüz otomatik olarak anında e-posta adresinize ve üye panelinize teslim edilir. Ortalama teslimat süresi 1-2 dakikadır.', 'urunler-ne-kadar-surede-teslim-edilir', 'Teslimat', 1, 1, '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000'),
('bec38ca5-c556-11f0-94cf-e86c61a30d56', 'Hangi ödeme yöntemlerini kabul ediyorsunuz?', 'Kredi kartı, banka havalesi, Papara, PayTR, Shopier ve kripto para (Coinbase Commerce) ile ödeme yapabilirsiniz. Tüm ödemeler SSL sertifikası ile güvence altındadır.', 'hangi-odeme-yontemlerini-kabul-ediyorsunuz', 'Ödeme', 1, 2, '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000'),
('bec38e5b-c556-11f0-94cf-e86c61a30d56', 'Ürün çalışmazsa ne olur?', 'Satın aldığınız ürün çalışmaz veya hatalı ise 7 gün içinde destek ekibimizle iletişime geçerek değişim veya iade talebinde bulunabilirsiniz. Tüm ürünlerimiz garanti kapsamındadır.', 'urun-calismazsa-ne-olur', 'İade & Garanti', 1, 3, '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000'),
('bec38f33-c556-11f0-94cf-e86c61a30d56', 'Toplu alımlarda indirim var mı?', 'Evet! 5+ ürün alımlarında %5, 10+ ürün alımlarında %10 indirim otomatik olarak uygulanır. Daha fazla bilgi için müşteri hizmetlerimizle iletişime geçebilirsiniz.', 'toplu-alimlarda-indirim-var-mi', 'İndirim & Kampanya', 1, 4, '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000'),
('bec38ffb-c556-11f0-94cf-e86c61a30d56', 'Lisanslar kaç cihazda kullanılabilir?', 'Her ürünün kullanım koşulları farklıdır. Ürün detay sayfasında lisans türü ve kaç cihazda kullanılabileceği belirtilmiştir. Tek kullanımlık, çoklu kullanım ve süreli lisanslar mevcuttur.', 'lisanslar-kac-cihazda-kullanilabilir', 'Lisans', 1, 5, '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000'),
('bec390d5-c556-11f0-94cf-e86c61a30d56', 'Müşteri desteği nasıl alırım?', '7/24 canlı destek, e-posta, WhatsApp ve Telegram üzerinden bizimle iletişime geçebilirsiniz. Üye panelinizden destek talebi oluşturabilir veya SSS bölümünü inceleyebilirsiniz.', 'musteri-destegi-nasil-alirim', 'Destek', 1, 6, '2024-01-01 00:00:00.000', '2024-01-01 00:00:00.000');


-- ----------------------------
-- Table structure for `popups`
-- ----------------------------
DROP TABLE IF EXISTS `popups`;
CREATE TABLE `popups` (
  `id` char(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `image_asset_id` char(36) DEFAULT NULL,
  `image_alt` varchar(255) DEFAULT NULL,
  `button_text` varchar(100) DEFAULT NULL,
  `button_url` varchar(500) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 0,
  `show_once` tinyint(1) NOT NULL DEFAULT 0,
  `delay` int(11) NOT NULL DEFAULT 0,
  `valid_from` datetime(3) DEFAULT NULL,
  `valid_until` datetime(3) DEFAULT NULL,
  `product_id` char(36) DEFAULT NULL,
  `coupon_code` varchar(64) DEFAULT NULL,
  `display_pages` varchar(24) NOT NULL DEFAULT 'all',
  `priority` int(11) DEFAULT NULL,
  `duration_seconds` int(11) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `popups_active_idx` (`is_active`),
  KEY `popups_valid_from_idx` (`valid_from`),
  KEY `popups_valid_until_idx` (`valid_until`),
  KEY `popups_created_idx` (`created_at`),
  KEY `popups_image_asset_idx` (`image_asset_id`),
  KEY `popups_product_idx` (`product_id`),
  KEY `popups_coupon_idx` (`coupon_code`),
  KEY `popups_priority_idx` (`priority`),
  KEY `popups_display_pages_idx` (`display_pages`),
  KEY `popups_active_time_idx` (`is_active`,`valid_from`,`valid_until`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Records of `popups`
-- ----------------------------
INSERT INTO `popups` (`id`, `title`, `content`, `image_url`, `image_asset_id`, `image_alt`, `button_text`, `button_url`, `is_active`, `show_once`, `delay`, `valid_from`, `valid_until`, `product_id`, `coupon_code`, `display_pages`, `priority`, `duration_seconds`, `created_at`, `updated_at`) VALUES 
('9a7f1a4b-0a56-4c1a-8f41-2f7b0f8d3c9e', 'Windows 11 Pro için Ekim İndirimi', 'Windows 11 Pro Retail anahtarlarında sınırlı süreli kampanya! Sepette kuponu kullanmayı unutmayın.', 'https://placehold.co/800x400?text=Windows+11+Pro', NULL, 'Windows kampanya', 'Şimdi Al', '/urun/windows-11-pro-retail-key', 0, 1, 1, '2025-10-10 00:00:00.000', '2025-11-01 23:59:59.000', '6c76a7b2-54ed-4290-8d83-c118533c5ee0', '2025', 'products', 70, 0, '2025-10-10 12:00:00.000', '2025-10-10 12:00:00.000'),
('b57879a1-bdb0-4ccd-90a6-fae11d42850b', 'Üye Ol İlk Siparişinde %10 İndirim Kap', 'Sitemize üye olarak yapacağınız ilk siparişlerde geçerli indirim kodunuz hazır.', 'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/blog-images/popup-images/gagx81xi1uh-1760559551779.png', NULL, 'Popup kapak görseli', 'Alışverişe Başla', '/kayit', 0, 0, 3, NULL, NULL, NULL, '2025', 'all', 90, 0, '2025-10-09 18:54:42.000', '2025-10-15 20:19:18.000'),
('caa4a1c1-9f39-4a64-8d34-0e2f6b4fbd77', '500 Takipçide Hafta Sonu Fırsatı', 'Sadece bu hafta sonuna özel! 500 Takipçi paketinde sepette ekstra indirim.', 'https://placehold.co/800x400?text=500+Takipci', NULL, 'Kampanya görseli', 'Paketi İncele', '/urun/500-takipci', 0, 0, 2, '2025-10-10 00:00:00.000', '2025-10-13 23:59:59.000', '0132e42e-d46a-444d-9080-a419aec29c9c', NULL, 'home', 80, 12, '2025-10-10 10:00:00.000', '2025-10-10 10:00:00.000');


-- ----------------------------
-- Table structure for `payment_events`
-- ----------------------------
DROP TABLE IF EXISTS `payment_events`;
CREATE TABLE `payment_events` (
  `id` char(36) NOT NULL,
  `payment_id` char(36) NOT NULL,
  `event_type` varchar(32) NOT NULL,
  `message` varchar(500) NOT NULL,
  `raw` text DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `payment_events_payment_idx` (`payment_id`),
  KEY `payment_events_type_idx` (`event_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



-- ----------------------------
-- Table structure for `refresh_tokens`
-- ----------------------------
DROP TABLE IF EXISTS `refresh_tokens`;
CREATE TABLE `refresh_tokens` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `token_hash` varchar(255) NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `expires_at` datetime(3) NOT NULL,
  `revoked_at` datetime(3) DEFAULT NULL,
  `replaced_by` char(36) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `refresh_tokens_user_id_idx` (`user_id`),
  KEY `refresh_tokens_expires_at_idx` (`expires_at`),
  CONSTRAINT `fk_refresh_tokens_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Records of `refresh_tokens`
-- ----------------------------
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `created_at`, `expires_at`, `revoked_at`, `replaced_by`) VALUES 
('96b89bdb-754a-40ec-9e05-42947a297405', '4f618a8d-6fdb-498c-898a-395d368b2193', 'd0da80e87f4ed73db0105eb114a0950f65cf3f2f63788efea89865173eec58a9', '2025-11-19 15:48:44.877', '2025-11-26 14:48:44.876', NULL, NULL);


-- ----------------------------
-- Table structure for `email_templates`
-- ----------------------------
DROP TABLE IF EXISTS `email_templates`;
CREATE TABLE `email_templates` (
  `id` char(36) NOT NULL,
  `template_key` varchar(100) NOT NULL,
  `template_name` varchar(150) NOT NULL,
  `subject` varchar(255) NOT NULL,
  `content` longtext NOT NULL,
  `variables` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`variables`)),
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `locale` varchar(10) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_email_tpl_key_locale` (`template_key`,`locale`),
  KEY `ix_email_tpl_active` (`is_active`),
  KEY `ix_email_tpl_updated_at` (`updated_at`),
  KEY `ix_email_tpl_name` (`template_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Records of `email_templates`
-- ----------------------------
INSERT INTO `email_templates` (`id`, `template_key`, `template_name`, `subject`, `content`, `variables`, `is_active`, `locale`, `created_at`, `updated_at`) VALUES 
('4290e3d9-d5b8-4423-aab2-1cbc85bee59b', 'ticket_replied', 'Ticket Replied', 'Destek Talebiniz Yanıtlandı - {{site_name}}', '<h1 class=\"ql-align-center\">Destek Talebiniz Yanıtlandı</h1><p>Merhaba <strong>{{user_name}}</strong>,</p><p>Destek talebiniz yanıtlandı.</p><p><br></p><p>Detayları görüntülemek için kullanıcı paneline giriş yapabilirsiniz.</p><p>Saygılarımızla,</p><p>{{site_name}} Ekibi</p>', '[\"user_name\", \"ticket_id\", \"ticket_subject\", \"reply_message\", \"site_name\"]', 1, NULL, '2025-10-09 19:38:58.000', '2025-10-13 20:28:47.000'),
('4f85350b-c082-4677-bd9f-ad1e7d9bd038', 'order_item_delivery', 'Order Item Delivery', 'Ürününüz Teslim Edildi - {{product_name}}', '<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;\">\n  <h1 style=\"color: #10b981; text-align: center;\">✓ Ürününüz Teslim Edildi</h1>\n  <p style=\"color: #666; font-size: 16px;\">Merhaba <strong>{{customer_name}}</strong>,</p>\n  <p style=\"color: #666; font-size: 16px;\">Siparişinize ait ürününüz teslim edilmiştir.</p>\n  \n  <div style=\"background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;\">\n    <p style=\"margin: 0 0 10px 0; color: #666;\"><strong>Sipariş No:</strong> {{order_number}}</p>\n    <p style=\"margin: 0 0 10px 0; color: #666;\"><strong>Ürün:</strong> {{product_name}}</p>\n  </div>\n  \n  <div style=\"background: #e8f5e9; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #10b981;\">\n    <h3 style=\"margin-top: 0; color: #10b981;\">Teslimat Bilgileri:</h3>\n    <pre style=\"background: white; padding: 15px; border-radius: 5px; color: #333; white-space: pre-wrap; word-wrap: break-word;\">{{delivery_content}}</pre>\n  </div>\n  \n  <p style=\"color: #666; font-size: 14px; margin-top: 20px;\">\n    <strong>Not:</strong> Bu bilgileri güvenli bir şekilde saklayınız. Hesabınızdan tüm siparişlerinizi görüntüleyebilirsiniz.\n  </p>\n  \n  <p style=\"color: #666; font-size: 16px;\">Saygılarımızla,<br>{{site_name}} Ekibi</p>\n</div>', '[\"customer_name\", \"order_number\", \"product_name\", \"delivery_content\", \"site_name\"]', 1, NULL, '2025-10-16 08:13:25.000', '2025-10-16 08:13:25.000'),
('547e8ec8-2746-4bb8-9be3-3db4d186697d', 'order_completed', 'Order Completed', 'Siparişiniz Tamamlandı - {{site_name}}', '<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;\">\n    <h1 style=\"color: #10b981; text-align: center;\">✓ Siparişiniz Tamamlandı</h1>\n    <p style=\"color: #666; font-size: 16px;\">Merhaba <strong>{{customer_name}}</strong>,</p>\n    <p style=\"color: #666; font-size: 16px;\">Siparişiniz başarıyla tamamlandı ve ürünleriniz teslim edildi.</p>\n    <div style=\"background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;\">\n      <p style=\"margin: 0 0 10px 0; color: #666;\"><strong>Sipariş No:</strong> {{order_number}}</p>\n      <p style=\"margin: 0; color: #666;\"><strong>Toplam Tutar:</strong> {{final_amount}} TL</p>\n    </div>\n    <p style=\"color: #666; font-size: 16px;\">Ürünlerinizi hesabınızdan görüntüleyebilirsiniz.</p>\n    <p style=\"color: #666; font-size: 16px;\">Deneyiminizi paylaşmak isterseniz değerlendirme yapabilirsiniz.</p>\n    <p style=\"color: #666; font-size: 16px;\">Saygılarımızla,<br>{{site_name}} Ekibi</p>\n  </div>', '[\"customer_name\", \"order_number\", \"final_amount\", \"site_name\"]', 1, NULL, '2025-10-09 19:38:58.000', '2025-10-09 19:38:58.000'),
('5adeb7c9-e07b-4a36-9e49-460cd626cf8c', 'order_received', 'Order Received', 'Siparişiniz Alındı - {{site_name}}', '<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;\">\n    <h1 style=\"color: #333; text-align: center;\">Siparişiniz Alındı</h1>\n    <p style=\"color: #666; font-size: 16px;\">Merhaba <strong>{{customer_name}}</strong>,</p>\n    <p style=\"color: #666; font-size: 16px;\">Siparişiniz başarıyla alındı ve işleme alındı.</p>\n    <div style=\"background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;\">\n      <p style=\"margin: 0 0 10px 0; color: #666;\"><strong>Sipariş No:</strong> {{order_number}}</p>\n      <p style=\"margin: 0 0 10px 0; color: #666;\"><strong>Toplam Tutar:</strong> {{final_amount}} TL</p>\n      <p style=\"margin: 0; color: #666;\"><strong>Durum:</strong> {{status}}</p>\n    </div>\n    <p style=\"color: #666; font-size: 16px;\">Siparişinizin durumunu hesabınızdan takip edebilirsiniz.</p>\n    <p style=\"color: #666; font-size: 16px;\">Saygılarımızla,<br>{{site_name}} Ekibi</p>\n  </div>', '[\"customer_name\", \"order_number\", \"final_amount\", \"status\", \"site_name\"]', 1, NULL, '2025-10-09 19:38:58.000', '2025-10-09 19:38:58.000'),
('d75ec05a-bac7-446a-ac2a-cfc7b7f2dd07', 'deposit_success', 'Deposit Success', 'Bakiye Yükleme Onaylandı - {{site_name}}', '<h1 class=\"ql-align-center\">✓ Bakiye Yükleme Başarılı</h1><p>Merhaba <strong>{{user_name}}</strong>,</p><p>Bakiye yükleme talebiniz onaylandı ve hesabınıza eklendi.</p><p><br></p><p><strong>Yüklenen Tutar:</strong> {{amount}} TL</p><p><strong>Yeni Bakiye:</strong> {{new_balance}} TL</p><p>Artık alışverişe başlayabilirsiniz!</p><p>Saygılarımızla,</p><p>{{site_name}} Ekibi</p>', '[\"user_name\", \"amount\", \"new_balance\", \"site_name\"]', 1, NULL, '2025-10-09 19:38:58.000', '2025-10-09 19:49:38.000'),
('da91f94a-bfe1-46b7-83fc-b4152e27c65e', 'password_reset', 'Password Reset', 'Şifre Sıfırlama Talebi - {{site_name}}', '<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;\">\n    <h1 style=\"color: #333; text-align: center;\">Şifre Sıfırlama</h1>\n    <p style=\"color: #666; font-size: 16px;\">Merhaba,</p>\n    <p style=\"color: #666; font-size: 16px;\">Hesabınız için şifre sıfırlama talebi aldık.</p>\n    <div style=\"background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center;\">\n      <a href=\"{{reset_link}}\" style=\"display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;\">Şifremi Sıfırla</a>\n    </div>\n    <p style=\"color: #666; font-size: 14px;\">Bu linkin geçerlilik süresi 1 saattir.</p>\n    <p style=\"color: #666; font-size: 14px;\">Bu talebi siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.</p>\n    <p style=\"color: #666; font-size: 16px;\">Saygılarımızla,<br>{{site_name}} Ekibi</p>\n  </div>', '[\"reset_link\", \"site_name\"]', 1, NULL, '2025-10-09 19:38:58.000', '2025-10-09 19:38:58.000'),
('dd5ecc0c-ab34-499a-8103-7a435472794a', 'order_cancelled', 'Order Cancelled', 'Sipariş İptali - {{site_name}}', '<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;\">\n    <h1 style=\"color: #ef4444; text-align: center;\">Siparişiniz İptal Edildi</h1>\n    <p style=\"color: #666; font-size: 16px;\">Merhaba <strong>{{customer_name}}</strong>,</p>\n    <p style=\"color: #666; font-size: 16px;\">Siparişiniz iptal edildi.</p>\n    <div style=\"background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;\">\n      <p style=\"margin: 0 0 10px 0; color: #666;\"><strong>Sipariş No:</strong> {{order_number}}</p>\n      <p style=\"margin: 0 0 10px 0; color: #666;\"><strong>Tutar:</strong> {{final_amount}} TL</p>\n      <p style=\"margin: 0; color: #666;\"><strong>İptal Nedeni:</strong> {{cancellation_reason}}</p>\n    </div>\n    <p style=\"color: #666; font-size: 16px;\">Ödemeniz varsa iade işlemi başlatılacaktır.</p>\n    <p style=\"color: #666; font-size: 16px;\">Sorularınız için bizimle iletişime geçebilirsiniz.</p>\n    <p style=\"color: #666; font-size: 16px;\">Saygılarımızla,<br>{{site_name}} Ekibi</p>\n  </div>', '[\"customer_name\", \"order_number\", \"final_amount\", \"cancellation_reason\", \"site_name\"]', 1, NULL, '2025-10-09 19:38:58.000', '2025-10-09 19:38:58.000'),
('e7fae474-c1cf-4600-8466-2f915146cfb9', 'welcome', 'Welcome', 'Hesabiniz Oluşturuldu - {{site_name}}', '<h1 class=\"ql-align-center\">Hesabınız Oluşturuldu</h1><p>Merhaba <strong>{{user_name}}</strong>,</p><p>{{site_name}} ailesine hoş geldiniz! Hesabınız başarıyla oluşturuldu.</p><p><br></p><p>E-posta: <strong>{{user_email}}</strong></p><p>Herhangi bir sorunuz olursa bizimle iletişime geçmekten çekinmeyin.</p><p>Saygılarımızla,</p><p>{{site_name}} Ekibi</p>', '[\"user_name\", \"user_email\", \"site_name\"]', 1, NULL, '2025-10-09 19:38:58.000', '2025-10-13 15:06:38.000');


-- ----------------------------
-- Table structure for `fake_order_notifications`
-- ----------------------------
DROP TABLE IF EXISTS `fake_order_notifications`;
CREATE TABLE `fake_order_notifications` (
  `id` char(36) NOT NULL,
  `product_name` varchar(255) NOT NULL,
  `customer` varchar(100) NOT NULL,
  `location` varchar(100) DEFAULT NULL,
  `time_ago` varchar(50) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `fake_order_is_active_idx` (`is_active`),
  KEY `fake_order_created_idx` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Records of `fake_order_notifications`
-- ----------------------------
INSERT INTO `fake_order_notifications` (`id`, `product_name`, `customer`, `location`, `time_ago`, `is_active`, `created_at`) VALUES 
('11111111-1111-1111-1111-111111111111', 'Windows 11 Pro Key', 'Ahmet K.', 'İstanbul', '3 dakika önce', 1, '2025-11-19 14:48:01.318'),
('22222222-2222-2222-2222-222222222222', 'Office 365 Family', 'Zeynep T.', 'Ankara', '8 dakika önce', 1, '2025-11-19 14:48:01.318'),
('33333333-3333-3333-3333-333333333333', 'Netflix Ultra HD', 'Mehmet A.', 'İzmir', '12 dakika önce', 1, '2025-11-19 14:48:01.318'),
('44444444-4444-4444-4444-444444444444', 'Spotify Premium', 'Ece D.', 'Bursa', '25 dakika önce', 1, '2025-11-19 14:48:01.318'),
('55555555-5555-5555-5555-555555555555', 'Adobe Photoshop CC', 'Cem S.', 'Antalya', '1 saat önce', 1, '2025-11-19 14:48:01.318'),
('66666666-6666-6666-6666-666666666666', 'Xbox Game Pass', 'Erdem L.', 'Konya', '2 saat önce', 1, '2025-11-19 14:48:01.318'),
('77777777-7777-7777-7777-777777777777', 'NordVPN 1 Yıl', 'Büşra Y.', 'Samsun', '3 saat önce', 1, '2025-11-19 14:48:01.318'),
('88888888-8888-8888-8888-888888888888', 'YouTube Premium', 'Onur B.', 'Eskişehir', '6 saat önce', 1, '2025-11-19 14:48:01.318');


-- ----------------------------
-- Table structure for `payments`
-- ----------------------------
DROP TABLE IF EXISTS `payments`;
CREATE TABLE `payments` (
  `id` char(36) NOT NULL,
  `order_id` char(36) DEFAULT NULL,
  `provider` varchar(64) NOT NULL,
  `currency` varchar(10) NOT NULL,
  `amount_authorized` decimal(10,2) NOT NULL,
  `amount_captured` decimal(10,2) NOT NULL DEFAULT 0.00,
  `amount_refunded` decimal(10,2) NOT NULL DEFAULT 0.00,
  `fee_amount` decimal(10,2) DEFAULT NULL,
  `status` varchar(32) NOT NULL,
  `reference` varchar(255) DEFAULT NULL,
  `transaction_id` varchar(255) DEFAULT NULL,
  `is_test` tinyint(4) NOT NULL DEFAULT 0,
  `metadata` text DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `payments_provider_idx` (`provider`),
  KEY `payments_status_idx` (`status`),
  KEY `payments_created_idx` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Records of `payments`
-- ----------------------------
INSERT INTO `payments` (`id`, `order_id`, `provider`, `currency`, `amount_authorized`, `amount_captured`, `amount_refunded`, `fee_amount`, `status`, `reference`, `transaction_id`, `is_test`, `metadata`, `created_at`, `updated_at`) VALUES 
('befbbb9d-c556-11f0-94cf-e86c61a30d56', NULL, 'paytr', 'TRY', '100.00', '0.00', '0.00', NULL, 'authorized', NULL, NULL, 1, NULL, '2025-11-19 14:48:01.050', '2025-11-19 14:48:01.050');


-- ----------------------------
-- Table structure for `menu_items`
-- ----------------------------
DROP TABLE IF EXISTS `menu_items`;
CREATE TABLE `menu_items` (
  `id` char(36) NOT NULL,
  `label` varchar(100) NOT NULL,
  `url` varchar(500) NOT NULL,
  `parent_id` char(36) DEFAULT NULL,
  `location` enum('header','footer') NOT NULL DEFAULT 'header',
  `section_id` char(36) DEFAULT NULL,
  `type` enum('page','custom') NOT NULL DEFAULT 'custom',
  `page_id` char(36) DEFAULT NULL,
  `icon` varchar(64) DEFAULT NULL,
  `order_num` int(11) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `menu_items_parent_idx` (`parent_id`),
  KEY `menu_items_active_idx` (`is_active`),
  KEY `menu_items_order_idx` (`order_num`),
  KEY `menu_items_created_idx` (`created_at`),
  KEY `menu_items_updated_idx` (`updated_at`),
  KEY `menu_items_location_idx` (`location`),
  KEY `menu_items_section_idx` (`section_id`),
  CONSTRAINT `menu_items_parent_fk` FOREIGN KEY (`parent_id`) REFERENCES `menu_items` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Records of `menu_items`
-- ----------------------------
INSERT INTO `menu_items` (`id`, `label`, `url`, `parent_id`, `location`, `section_id`, `type`, `page_id`, `icon`, `order_num`, `is_active`, `created_at`, `updated_at`) VALUES 
('24c49639-01d0-4274-8fb9-c31ed64d0726', 'Kullanım Koşulları', '/kullanim-kosullari', NULL, 'footer', 'f942a930-6743-4ecc-b4b3-1fd6b77f9d77', 'custom', NULL, NULL, 7, 1, '2025-11-19 14:47:59.737', '2025-11-19 14:47:59.737'),
('25740da6-c0f2-4c1d-b131-998018699bfd', 'Hakkımızda', '/hakkimizda', NULL, 'header', NULL, 'custom', NULL, NULL, 3, 1, '2025-11-19 14:47:59.737', '2025-11-19 14:47:59.737'),
('2e32b68d-ae71-4d44-8770-95b8dfb03c36', 'Kampanyalar', '/kampanyalar', NULL, 'footer', '59583ef1-0ba1-4c7c-b806-84fd204b52b9', 'custom', NULL, NULL, 1, 1, '2025-11-19 14:47:59.737', '2025-11-19 14:47:59.737'),
('3d325c92-d59e-4730-8301-5c9bcff463bc', 'KVKK', '/kvkk', NULL, 'footer', 'f942a930-6743-4ecc-b4b3-1fd6b77f9d77', 'custom', NULL, NULL, 4, 1, '2025-11-19 14:47:59.737', '2025-11-19 14:47:59.737'),
('455c6ddf-658b-4c0f-8a9e-0b104708dd07', 'İletişim', '/iletisim', NULL, 'header', NULL, 'custom', NULL, NULL, 5, 1, '2025-11-19 14:47:59.737', '2025-11-19 14:47:59.737'),
('6a4f6b37-ed99-4d98-8c54-d658096aacde', 'SSS', '/sss', NULL, 'footer', '59583ef1-0ba1-4c7c-b806-84fd204b52b9', 'custom', NULL, NULL, 0, 1, '2025-11-19 14:47:59.737', '2025-11-19 14:47:59.737'),
('71c28444-7b6e-47ae-92be-f59206a1b820', 'Gizlilik Politikası', '/gizlilik-politikasi', NULL, 'footer', 'f942a930-6743-4ecc-b4b3-1fd6b77f9d77', 'custom', NULL, NULL, 3, 1, '2025-11-19 14:47:59.737', '2025-11-19 14:47:59.737'),
('9fa999a9-9e47-4a3c-9dac-6afba197d79c', 'İade ve Değişim', '/iade-degisim', NULL, 'footer', 'f942a930-6743-4ecc-b4b3-1fd6b77f9d77', 'custom', NULL, NULL, 5, 1, '2025-11-19 14:47:59.737', '2025-11-19 14:47:59.737'),
('c47a1c3f-cea1-4780-9381-77336bc8ac59', 'Kategoriler', '/kategoriler', NULL, 'header', NULL, 'custom', NULL, NULL, 2, 1, '2025-11-19 14:47:59.737', '2025-11-19 14:47:59.737'),
('ceed431a-aafb-4aba-bf1f-6217b3960c01', 'Blog', '/blog', NULL, 'header', NULL, 'custom', NULL, NULL, 4, 1, '2025-11-19 14:47:59.737', '2025-11-19 14:47:59.737'),
('d8ec7f51-384f-400a-9ac6-3a179cb89087', 'Ödeme Yöntemleri', '/odeme-yontemleri', NULL, 'footer', 'f942a930-6743-4ecc-b4b3-1fd6b77f9d77', 'custom', NULL, NULL, 6, 1, '2025-11-19 14:47:59.737', '2025-11-19 14:47:59.737'),
('f1573cc3-5392-448b-89eb-d0e02e947c6d', 'Nasıl Sipariş Verilir?', '/nasil-siparis-verilir', NULL, 'footer', '59583ef1-0ba1-4c7c-b806-84fd204b52b9', 'custom', NULL, NULL, 2, 1, '2025-11-19 14:47:59.737', '2025-11-19 14:47:59.737'),
('f2570596-db46-4028-902c-d6fe2c9a8312', 'Ürünler', '/urunler', NULL, 'header', NULL, 'custom', NULL, NULL, 1, 1, '2025-11-19 14:47:59.737', '2025-11-19 14:47:59.737'),
('fe8120b3-919a-49b8-8035-df6fd2a2433f', 'Anasayfa', '/', NULL, 'header', NULL, 'custom', NULL, NULL, 0, 1, '2025-11-19 14:47:59.737', '2025-11-19 14:47:59.737');


-- ----------------------------
-- Table structure for `product_options`
-- ----------------------------
DROP TABLE IF EXISTS `product_options`;
CREATE TABLE `product_options` (
  `id` char(36) NOT NULL,
  `product_id` char(36) NOT NULL,
  `option_name` varchar(100) NOT NULL,
  `option_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`option_values`)),
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `product_options_product_id_idx` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



-- ----------------------------
-- Table structure for `orders`
-- ----------------------------
DROP TABLE IF EXISTS `orders`;
CREATE TABLE `orders` (
  `id` char(36) NOT NULL,
  `order_number` varchar(50) NOT NULL,
  `user_id` char(36) NOT NULL,
  `status` enum('pending','processing','completed','cancelled','refunded') NOT NULL DEFAULT 'pending',
  `payment_method` enum('credit_card','bank_transfer','wallet','paytr','shopier') NOT NULL,
  `payment_status` varchar(50) NOT NULL DEFAULT 'pending',
  `subtotal` decimal(10,2) NOT NULL,
  `discount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `coupon_discount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `total` decimal(10,2) NOT NULL,
  `coupon_code` varchar(50) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `ip_address` varchar(50) DEFAULT NULL,
  `user_agent` varchar(500) DEFAULT NULL,
  `payment_provider` varchar(50) DEFAULT NULL,
  `payment_id` varchar(255) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `orders_user_idx` (`user_id`),
  KEY `orders_status_idx` (`status`),
  KEY `orders_method_idx` (`payment_method`),
  KEY `orders_pstatus_idx` (`payment_status`),
  KEY `orders_created_idx` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Records of `orders`
-- ----------------------------
INSERT INTO `orders` (`id`, `order_number`, `user_id`, `status`, `payment_method`, `payment_status`, `subtotal`, `discount`, `coupon_discount`, `total`, `coupon_code`, `notes`, `ip_address`, `user_agent`, `payment_provider`, `payment_id`, `created_at`, `updated_at`) VALUES 
('042190a4-41d0-4cf4-93a3-a5a171ea8903', 'ORD1760390895507', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'pending', 'paytr', 'failed', '49.99', '0.00', '0.00', '62.49', NULL, 'PayTR ödeme başarısız. Hata kodu: 6, Mesaj: Müşteri ödeme yapmaktan vazgeçti ve ödeme sayfasından ayrıldı.', NULL, NULL, NULL, NULL, '2025-10-13 21:28:27.000', '2025-10-13 22:00:11.000'),
('07b99086-c1f1-493a-991c-ec71d00e425a', 'DEP1760301650094', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'pending', 'paytr', 'pending', '10.00', '0.00', '0.00', '10.00', NULL, 'Bakiye yükleme', NULL, NULL, NULL, NULL, '2025-10-12 20:41:00.000', '2025-10-12 20:41:00.000'),
('0808058f-d5f1-460c-a478-84552d08e0ae', 'ORD1760371269176', '19a2bc26-63d1-43ad-ab56-d7f3c3719a34', 'pending', 'wallet', 'paid', '179.99', '0.00', '0.00', '179.99', NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-13 16:01:19.000', '2025-10-13 16:09:04.000'),
('08a0a582-dd8d-4ff0-8ca8-124976c71ed8', 'ORD-1759831194956', '0ac37a5c-a8be-4d25-b853-1e5c9574c1b3', 'pending', 'wallet', 'paid', '100.00', '0.00', '0.00', '100.00', NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-07 09:59:56.000', '2025-10-07 09:59:56.000'),
('0aa3d50f-bb5a-40a7-b5ab-e873d8cb4876', 'ORD1760601727849', '', 'pending', 'bank_transfer', 'paid', '50.00', '0.00', '0.00', '50.00', NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-16 08:02:10.000', '2025-10-16 08:50:04.000');


-- ----------------------------
-- Table structure for `product_faqs`
-- ----------------------------
DROP TABLE IF EXISTS `product_faqs`;
CREATE TABLE `product_faqs` (
  `id` char(36) NOT NULL,
  `product_id` char(36) NOT NULL,
  `question` varchar(500) NOT NULL,
  `answer` text NOT NULL,
  `display_order` int(11) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `product_faqs_product_id_idx` (`product_id`),
  KEY `product_faqs_order_idx` (`display_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Records of `product_faqs`
-- ----------------------------
INSERT INTO `product_faqs` (`id`, `product_id`, `question`, `answer`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES 
('03634c7c-a8b7-481a-b384-dec939016b05', '972d19c9-5c5c-48e8-9d42-a46cc5121bd2', 'Windows 11 Enterprise Key orijinal ve güvenilir mi?', 'Evet, Windows 11 Enterprise Key ürünümüz tamamen orijinal ve lisanslıdır. Tüm satışlarımız güvenli ödeme sistemleri üzerinden gerçekleşir ve ürün garantisi sağlanır.', 2, 1, '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('08503efd-cd86-44d7-980a-733b69d5d89a', '058e9ccd-f99d-4601-90ca-597fb3d4430f', 'ChatGPT Business Hesap(30 Gün) orijinal ve güvenilir mi?', 'Evet, ChatGPT Business Hesap(30 Gün) ürünümüz tamamen orijinal ve lisanslıdır. Tüm satışlarımız güvenli ödeme sistemleri üzerinden gerçekleşir ve ürün garantisi sağlanır.', 2, 1, '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('0a525f0b-1740-4919-ab20-96780dba6ec1', 'c4e5b6c5-131f-4327-88bc-9c2fe09d5366', 'Adobe Acrobat Pro orijinal ve güvenilir mi?', 'Evet, Adobe Acrobat Pro ürünümüz tamamen orijinal ve lisanslıdır. Tüm satışlarımız güvenli ödeme sistemleri üzerinden gerçekleşir ve ürün garantisi sağlanır.', 2, 1, '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('1337e28a-8016-46f4-86d8-100092b1dd2b', '972d19c9-5c5c-48e8-9d42-a46cc5121bd2', 'Bu ürün ne kadar sürede teslim edilir?', 'Ürün satın alma işleminiz tamamlandıktan sonra genellikle 1-5 dakika içinde otomatik olarak hesabınıza teslim edilir. Acil durumlarda 7/24 destek ekibimizle iletişime geçebilirsiniz.', 1, 1, '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('174b3648-262a-426c-b94a-db748d351b72', '3eeb67f8-40a6-44f4-95ff-1d721e361861', 'Bu ürün ne kadar sürede teslim edilir?', 'Ürün satın alma işleminiz tamamlandıktan sonra genellikle 1-5 dakika içinde otomatik olarak hesabınıza teslim edilir. Acil durumlarda 7/24 destek ekibimizle iletişime geçebilirsiniz.', 1, 1, '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('22d0cfa7-a36b-4df5-9947-c3170cf3f367', 'd8f607f5-5da9-47a5-ba66-f4835a155a2e', 'Adobe Creative Cloud  orijinal ve güvenilir mi?', 'Evet, Adobe Creative Cloud  ürünümüz tamamen orijinal ve lisanslıdır. Tüm satışlarımız güvenli ödeme sistemleri üzerinden gerçekleşir ve ürün garantisi sağlanır.', 2, 1, '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('238a9f69-9a47-4ef8-991e-d9792ed83cf5', '205fc262-f2af-463f-8f25-f913a64679e8', 'Windows 11 Pro Key orijinal ve güvenilir mi?', 'Evet, Windows 11 Pro Key ürünümüz tamamen orijinal ve lisanslıdır. Tüm satışlarımız güvenli ödeme sistemleri üzerinden gerçekleşir ve ürün garantisi sağlanır.', 2, 1, '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('24ccde8e-436e-41be-8ae5-b90275ae5e0a', '97fb37cc-7b93-49b9-a1e9-d9d34f33bbc1', '250 Takipçi orijinal ve güvenilir mi?', 'Evet, 250 Takipçi ürünümüz tamamen orijinal ve lisanslıdır. Tüm satışlarımız güvenli ödeme sistemleri üzerinden gerçekleşir ve ürün garantisi sağlanır.', 2, 1, '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('2ce11d5e-2702-4218-9349-147d8d07931e', '6c76a7b2-54ed-4290-8d83-c118533c5ee0', 'Windows 11 Pro Retail Key orijinal ve güvenilir mi?', 'Evet, Windows 11 Pro Retail Key ürünümüz tamamen orijinal ve lisanslıdır. Tüm satışlarımız güvenli ödeme sistemleri üzerinden gerçekleşir ve ürün garantisi sağlanır.', 2, 1, '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('2d981e99-eb41-4866-8be0-7d478132b8c1', '610e1be2-39c7-4cb4-9f73-1ba506e0bb06', 'Bu ürün ne kadar sürede teslim edilir?', 'Ürün satın alma işleminiz tamamlandıktan sonra genellikle 1-5 dakika içinde otomatik olarak hesabınıza teslim edilir. Acil durumlarda 7/24 destek ekibimizle iletişime geçebilirsiniz.', 1, 1, '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('2ee76880-0590-45cf-a25f-a81f7e1b17f1', 'ba71df27-d8c3-41c0-ac01-cb7ac9ebea42', 'ChatGPT Plus Hesap(30 Gün) orijinal ve güvenilir mi?', 'Evet, ChatGPT Plus Hesap(30 Gün) ürünümüz tamamen orijinal ve lisanslıdır. Tüm satışlarımız güvenli ödeme sistemleri üzerinden gerçekleşir ve ürün garantisi sağlanır.', 2, 1, '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('350e9359-ea29-4e77-b7a4-b653f89a502f', '2f3ee84d-b301-4376-a3f7-a621a918c3b2', 'Gemini Veo 3 Ultra(30 Gün) orijinal ve güvenilir mi?', 'Evet, Gemini Veo 3 Ultra(30 Gün) ürünümüz tamamen orijinal ve lisanslıdır. Tüm satışlarımız güvenli ödeme sistemleri üzerinden gerçekleşir ve ürün garantisi sağlanır.', 2, 1, '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('38ac3e87-067d-4936-bcb0-ec4dc4ab0f6a', '6445f323-71c9-43a6-bda7-62df52c6af58', 'Windows 11 Education Key orijinal ve güvenilir mi?', 'Evet, Windows 11 Education Key ürünümüz tamamen orijinal ve lisanslıdır. Tüm satışlarımız güvenli ödeme sistemleri üzerinden gerçekleşir ve ürün garantisi sağlanır.', 2, 1, '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('38e1b8a8-1cba-44a9-8afa-c1be8944072a', '6445f323-71c9-43a6-bda7-62df52c6af58', 'Bu ürün ne kadar sürede teslim edilir?', 'Ürün satın alma işleminiz tamamlandıktan sonra genellikle 1-5 dakika içinde otomatik olarak hesabınıza teslim edilir. Acil durumlarda 7/24 destek ekibimizle iletişime geçebilirsiniz.', 1, 1, '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('3b56655b-5ff0-45c5-97c1-1dd0103a1ade', '97fb37cc-7b93-49b9-a1e9-d9d34f33bbc1', 'Bu ürün ne kadar sürede teslim edilir?', 'Ürün satın alma işleminiz tamamlandıktan sonra genellikle 1-5 dakika içinde otomatik olarak hesabınıza teslim edilir. Acil durumlarda 7/24 destek ekibimizle iletişime geçebilirsiniz.', 1, 1, '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('3e2e306e-3114-4560-a07c-b3ee781cbaf1', '8cc7a560-15b4-4c52-a542-f6687e79d124', 'Bu ürün ne kadar sürede teslim edilir?', 'Ürün satın alma işleminiz tamamlandıktan sonra genellikle 1-5 dakika içinde otomatik olarak hesabınıza teslim edilir. Acil durumlarda 7/24 destek ekibimizle iletişime geçebilirsiniz.', 1, 1, '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('3f78a19a-3167-4845-875b-13e90074ce98', 'c4e5b6c5-131f-4327-88bc-9c2fe09d5366', 'Bu ürün ne kadar sürede teslim edilir?', 'Ürün satın alma işleminiz tamamlandıktan sonra genellikle 1-5 dakika içinde otomatik olarak hesabınıza teslim edilir. Acil durumlarda 7/24 destek ekibimizle iletişime geçebilirsiniz.', 1, 1, '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('4254351a-5808-4c42-b5eb-55e86bca8b96', '205fc262-f2af-463f-8f25-f913a64679e8', 'Bu ürün ne kadar sürede teslim edilir?', 'Ürün satın alma işleminiz tamamlandıktan sonra genellikle 1-5 dakika içinde otomatik olarak hesabınıza teslim edilir. Acil durumlarda 7/24 destek ekibimizle iletişime geçebilirsiniz.', 1, 1, '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('46969a91-51d1-4e97-be21-ad535f94a32b', '0fbee9fe-da18-4c6e-9910-73cf81ba5b9f', 'Gemini Veo 3 Ultra(90 Gün) orijinal ve güvenilir mi?', 'Evet, Gemini Veo 3 Ultra(90 Gün) ürünümüz tamamen orijinal ve lisanslıdır. Tüm satışlarımız güvenli ödeme sistemleri üzerinden gerçekleşir ve ürün garantisi sağlanır.', 2, 1, '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('49288810-f13c-420b-a6aa-9a0f36c5caa1', 'fc0dbe1c-34f3-4906-97bd-b0666b55ded0', 'Bu ürün ne kadar sürede teslim edilir?', 'Ürün satın alma işleminiz tamamlandıktan sonra genellikle 1-5 dakika içinde otomatik olarak hesabınıza teslim edilir. Acil durumlarda 7/24 destek ekibimizle iletişime geçebilirsiniz.', 1, 1, '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('4c4166ef-46ab-4944-b96c-be539bab7a1a', 'd0550d22-210a-4cdb-ae0c-4e57b5b3b7bf', 'Bu ürün ne kadar sürede teslim edilir?', 'Ürün satın alma işleminiz tamamlandıktan sonra genellikle 1-5 dakika içinde otomatik olarak hesabınıza teslim edilir. Acil durumlarda 7/24 destek ekibimizle iletişime geçebilirsiniz.', 1, 1, '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('4e395ffa-073c-4ea5-9b33-56597ac61b9c', '1bdb2344-9b92-455f-935a-f064a470b6b8', 'Office 365 Lisans PC/MAC orijinal ve güvenilir mi?', 'Evet, Office 365 Lisans PC/MAC ürünümüz tamamen orijinal ve lisanslıdır. Tüm satışlarımız güvenli ödeme sistemleri üzerinden gerçekleşir ve ürün garantisi sağlanır.', 2, 1, '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('5253c0d8-227e-4dbb-85fb-7808d1a8d14e', '2f3ee84d-b301-4376-a3f7-a621a918c3b2', 'Bu ürün ne kadar sürede teslim edilir?', 'Ürün satın alma işleminiz tamamlandıktan sonra genellikle 1-5 dakika içinde otomatik olarak hesabınıza teslim edilir. Acil durumlarda 7/24 destek ekibimizle iletişime geçebilirsiniz.', 1, 1, '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('54daffcf-d5bb-4390-8d36-b0f0726f3e1c', '0132e42e-d46a-444d-9080-a419aec29c9c', '500 Takipçi orijinal ve güvenilir mi?', 'Evet, 500 Takipçi ürünümüz tamamen orijinal ve lisanslıdır. Tüm satışlarımız güvenli ödeme sistemleri üzerinden gerçekleşir ve ürün garantisi sağlanır.', 2, 1, '2025-10-15 12:41:26.000', '2025-10-15 12:41:26.000'),
('585ddfb8-e5f9-456d-96cf-070ef68a73b5', 'a76e27ef-e486-4cf8-b765-e12e51d52768', 'Adobe Photoshop Lisans Key orijinal ve güvenilir mi?', 'Evet, Adobe Photoshop Lisans Key ürünümüz tamamen orijinal ve lisanslıdır. Tüm satışlarımız güvenli ödeme sistemleri üzerinden gerçekleşir ve ürün garantisi sağlanır.', 2, 1, '2025-10-16 08:32:30.000', '2025-10-16 08:32:30.000'),
('5ebb916f-12a2-4c89-9fd2-ca279aabac31', 'd8f607f5-5da9-47a5-ba66-f4835a155a2e', 'Bu ürün ne kadar sürede teslim edilir?', 'Ürün satın alma işleminiz tamamlandıktan sonra genellikle 1-5 dakika içinde otomatik olarak hesabınıza teslim edilir. Acil durumlarda 7/24 destek ekibimizle iletişime geçebilirsiniz.', 1, 1, '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('6079a712-2848-49e5-9a8c-7c03a847a63e', '1bdb2344-9b92-455f-935a-f064a470b6b8', 'Bu ürün ne kadar sürede teslim edilir?', 'Ürün satın alma işleminiz tamamlandıktan sonra genellikle 1-5 dakika içinde otomatik olarak hesabınıza teslim edilir. Acil durumlarda 7/24 destek ekibimizle iletişime geçebilirsiniz.', 1, 1, '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('60d87685-35ca-411e-9b9f-54dd76162efc', '7495db5f-293d-46a8-9f25-d7efa6881043', 'Bu ürün ne kadar sürede teslim edilir?', 'Ürün satın alma işleminiz tamamlandıktan sonra genellikle 1-5 dakika içinde otomatik olarak hesabınıza teslim edilir. Acil durumlarda 7/24 destek ekibimizle iletişime geçebilirsiniz.', 1, 1, '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('60e7db5f-16f8-4e27-afe7-403f0bc6ca13', '610e1be2-39c7-4cb4-9f73-1ba506e0bb06', 'Office 2024 Pro Plus Key orijinal ve güvenilir mi?', 'Evet, Office 2024 Pro Plus Key ürünümüz tamamen orijinal ve lisanslıdır. Tüm satışlarımız güvenli ödeme sistemleri üzerinden gerçekleşir ve ürün garantisi sağlanır.', 2, 1, '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('6269c673-2220-49c0-ae8d-bf3104b2a242', '30de177e-cd4a-4851-b44f-063164872771', 'Canva Pro Yıllık orijinal ve güvenilir mi?', 'Evet, Canva Pro Yıllık ürünümüz tamamen orijinal ve lisanslıdır. Tüm satışlarımız güvenli ödeme sistemleri üzerinden gerçekleşir ve ürün garantisi sağlanır.', 2, 1, '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('67de0c03-1c4d-4ce7-8efd-ad3f7237d49f', 'ba71df27-d8c3-41c0-ac01-cb7ac9ebea42', 'Bu ürün ne kadar sürede teslim edilir?', 'Ürün satın alma işleminiz tamamlandıktan sonra genellikle 1-5 dakika içinde otomatik olarak hesabınıza teslim edilir. Acil durumlarda 7/24 destek ekibimizle iletişime geçebilirsiniz.', 1, 1, '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('68363f5d-2cc9-431b-858b-177d94c78af8', '30de177e-cd4a-4851-b44f-063164872771', 'Bu ürün ne kadar sürede teslim edilir?', 'Ürün satın alma işleminiz tamamlandıktan sonra genellikle 1-5 dakika içinde otomatik olarak hesabınıza teslim edilir. Acil durumlarda 7/24 destek ekibimizle iletişime geçebilirsiniz.', 1, 1, '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('691e472b-5c3d-48b6-b9a1-d086ea7df0c2', '4a9b363d-8402-4e89-8055-f58064eb462e', 'Ürünler Orjinal ve Garantili mi?', 'Evet ürün tamamen orjinaldir.', 0, 1, '2025-10-06 21:34:20.000', '2025-10-06 21:34:20.000'),
('6c4ac0a1-d4b2-4a98-bd72-9820dc3ca15b', '45f080dd-2e68-4ab7-ad97-a717b2482952', 'Windows 11 Pro OEM Key (Kopya) orijinal ve güvenilir mi?', 'Evet, Windows 11 Pro OEM Key (Kopya) ürünümüz tamamen orijinal ve lisanslıdır. Tüm satışlarımız güvenli ödeme sistemleri üzerinden gerçekleşir ve ürün garantisi sağlanır.', 2, 1, '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('6dffa7c2-482b-42b8-8ca0-8e7ad5f47968', '408ef745-5456-4115-ad79-3a26034edc37', 'Bu ürün ne kadar sürede teslim edilir?', 'Ürün satın alma işleminiz tamamlandıktan sonra genellikle 1-5 dakika içinde otomatik olarak hesabınıza teslim edilir. Acil durumlarda 7/24 destek ekibimizle iletişime geçebilirsiniz.', 1, 1, '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('72d9c1c6-ff2b-44f3-89f6-689518ee34ab', '271dfde4-f86b-452d-b64e-9186f071da44', 'Canva Pro Öğrenci orijinal ve güvenilir mi?', 'Evet, Canva Pro Öğrenci ürünümüz tamamen orijinal ve lisanslıdır. Tüm satışlarımız güvenli ödeme sistemleri üzerinden gerçekleşir ve ürün garantisi sağlanır.', 2, 1, '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('760a3258-6790-465f-af1c-4408d30c9b65', '408ef745-5456-4115-ad79-3a26034edc37', '100 Takipçi orijinal ve güvenilir mi?', 'Evet, 100 Takipçi ürünümüz tamamen orijinal ve lisanslıdır. Tüm satışlarımız güvenli ödeme sistemleri üzerinden gerçekleşir ve ürün garantisi sağlanır.', 2, 1, '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('7fb12dd2-a45a-479f-a3c5-ce72bfe38fa5', '45f080dd-2e68-4ab7-ad97-a717b2482952', 'Bu ürün ne kadar sürede teslim edilir?', 'Ürün satın alma işleminiz tamamlandıktan sonra genellikle 1-5 dakika içinde otomatik olarak hesabınıza teslim edilir. Acil durumlarda 7/24 destek ekibimizle iletişime geçebilirsiniz.', 1, 1, '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('8475ef98-0b5d-4531-bbd8-bff36ef42ad8', 'd9845b72-9e45-45ee-aaad-da3e8466e2f1', 'Office 2021 Pro Plus Key orijinal ve güvenilir mi?', 'Evet, Office 2021 Pro Plus Key ürünümüz tamamen orijinal ve lisanslıdır. Tüm satışlarımız güvenli ödeme sistemleri üzerinden gerçekleşir ve ürün garantisi sağlanır.', 2, 1, '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('8661df40-fe83-4005-96b2-f9306b50b183', 'd0550d22-210a-4cdb-ae0c-4e57b5b3b7bf', 'Pubg Mobile 60 UC orijinal ve güvenilir mi?', 'Evet, Pubg Mobile 60 UC ürünümüz tamamen orijinal ve lisanslıdır. Tüm satışlarımız güvenli ödeme sistemleri üzerinden gerçekleşir ve ürün garantisi sağlanır.', 2, 1, '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('8b10c8d2-1002-49f8-902c-896fdb966d43', '975d48da-e57e-4f6e-97b1-a6a9ddabbf1d', 'Bu ürün ne kadar sürede teslim edilir?', 'Ürün satın alma işleminiz tamamlandıktan sonra genellikle 1-5 dakika içinde otomatik olarak hesabınıza teslim edilir. Acil durumlarda 7/24 destek ekibimizle iletişime geçebilirsiniz.', 1, 1, '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('94497cd1-7aec-4038-bbed-435de1d9fe1e', '0132e42e-d46a-444d-9080-a419aec29c9c', 'Bu ürün ne kadar sürede teslim edilir?', 'Ürün satın alma işleminiz tamamlandıktan sonra genellikle 1-5 dakika içinde otomatik olarak hesabınıza teslim edilir. Acil durumlarda 7/24 destek ekibimizle iletişime geçebilirsiniz.', 1, 1, '2025-10-15 12:41:26.000', '2025-10-15 12:41:26.000'),
('9d4571ce-c666-4e42-ab07-bc69fa1b29c1', '2fb84de1-36e3-416b-abdb-83eaefb80f89', 'Windows 11 Pro Key orijinal ve güvenilir mi?', 'Evet, Windows 11 Pro Key ürünümüz tamamen orijinal ve lisanslıdır. Tüm satışlarımız güvenli ödeme sistemleri üzerinden gerçekleşir ve ürün garantisi sağlanır.', 2, 1, '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('a9603416-d14b-457f-8a7c-c97285932194', 'a8d31476-b416-4b07-9a86-618112fc156d', 'Adobe Illustrator Lisans Key orijinal ve güvenilir mi?', 'Evet, Adobe Illustrator Lisans Key ürünümüz tamamen orijinal ve lisanslıdır. Tüm satışlarımız güvenli ödeme sistemleri üzerinden gerçekleşir ve ürün garantisi sağlanır.', 2, 1, '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('b7711c0a-2174-4c18-85a4-e4b681002f9d', 'fc0dbe1c-34f3-4906-97bd-b0666b55ded0', 'Office 2016 Professional Plus Lisans orijinal ve güvenilir mi?', 'Evet, Office 2016 Professional Plus Lisans ürünümüz tamamen orijinal ve lisanslıdır. Tüm satışlarımız güvenli ödeme sistemleri üzerinden gerçekleşir ve ürün garantisi sağlanır.', 2, 1, '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('be54b4f7-489b-4bc0-b23f-7eeabc484655', '0bfafe30-cc66-458b-8fa8-3ebe25826040', 'Grand Theft Auto V orijinal ve güvenilir mi?', 'Evet, Grand Theft Auto V ürünümüz tamamen orijinal ve lisanslıdır. Tüm satışlarımız güvenli ödeme sistemleri üzerinden gerçekleşir ve ürün garantisi sağlanır.', 2, 1, '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('c111d2c7-6250-418a-9edd-5f19faf7807a', '505bb39c-cc6b-4747-9179-8257c147ab6f', 'Bu ürün ne kadar sürede teslim edilir?', 'Ürün satın alma işleminiz tamamlandıktan sonra genellikle 1-5 dakika içinde otomatik olarak hesabınıza teslim edilir. Acil durumlarda 7/24 destek ekibimizle iletişime geçebilirsiniz.', 1, 1, '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('c14a672e-f4c0-45c3-bcab-a303c30351c7', '7495db5f-293d-46a8-9f25-d7efa6881043', 'USA Gmail Hesap (2020) orijinal ve güvenilir mi?', 'Evet, USA Gmail Hesap (2020) ürünümüz tamamen orijinal ve lisanslıdır. Tüm satışlarımız güvenli ödeme sistemleri üzerinden gerçekleşir ve ürün garantisi sağlanır.', 2, 1, '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('ca8529ef-e27b-40c1-b6da-5ac1635a6c5c', '058e9ccd-f99d-4601-90ca-597fb3d4430f', 'Bu ürün ne kadar sürede teslim edilir?', 'Ürün satın alma işleminiz tamamlandıktan sonra genellikle 1-5 dakika içinde otomatik olarak hesabınıza teslim edilir. Acil durumlarda 7/24 destek ekibimizle iletişime geçebilirsiniz.', 1, 1, '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('ccef1b5b-5b09-4b10-958b-ed2426a16c49', '6c76a7b2-54ed-4290-8d83-c118533c5ee0', 'Bu ürün ne kadar sürede teslim edilir?', 'Ürün satın alma işleminiz tamamlandıktan sonra genellikle 1-5 dakika içinde otomatik olarak hesabınıza teslim edilir. Acil durumlarda 7/24 destek ekibimizle iletişime geçebilirsiniz.', 1, 1, '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('d2fcc848-d445-432c-9e65-bf53b69e7a40', '3eeb67f8-40a6-44f4-95ff-1d721e361861', 'Random Steam Key orijinal ve güvenilir mi?', 'Evet, Random Steam Key ürünümüz tamamen orijinal ve lisanslıdır. Tüm satışlarımız güvenli ödeme sistemleri üzerinden gerçekleşir ve ürün garantisi sağlanır.', 2, 1, '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('d32dd04b-0d72-4d6a-873c-55e3cf879a94', 'bfb8d1cb-721a-4756-830b-a95454e1d5f1', 'Lisansın Süresi Varmı?', 'Satın aldığınız lisans, girdiğiniz domain adresine lisanslı olup sınırsızdır.', 0, 1, '2025-10-13 21:16:37.000', '2025-10-13 21:16:37.000'),
('d419af5b-f8f0-48a4-94d7-b7899c1921ec', '8cc7a560-15b4-4c52-a542-f6687e79d124', 'Adobe Stock orijinal ve güvenilir mi?', 'Evet, Adobe Stock ürünümüz tamamen orijinal ve lisanslıdır. Tüm satışlarımız güvenli ödeme sistemleri üzerinden gerçekleşir ve ürün garantisi sağlanır.', 2, 1, '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('d52477d7-84ac-4f03-a5fb-8c4759268d63', 'd9845b72-9e45-45ee-aaad-da3e8466e2f1', 'Bu ürün ne kadar sürede teslim edilir?', 'Ürün satın alma işleminiz tamamlandıktan sonra genellikle 1-5 dakika içinde otomatik olarak hesabınıza teslim edilir. Acil durumlarda 7/24 destek ekibimizle iletişime geçebilirsiniz.', 1, 1, '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('d6629379-a3a4-4b33-8c9b-83e78d5a9c5e', '271dfde4-f86b-452d-b64e-9186f071da44', 'Bu ürün ne kadar sürede teslim edilir?', 'Ürün satın alma işleminiz tamamlandıktan sonra genellikle 1-5 dakika içinde otomatik olarak hesabınıza teslim edilir. Acil durumlarda 7/24 destek ekibimizle iletişime geçebilirsiniz.', 1, 1, '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('d84568cd-e080-44e2-98e0-14d057d062a3', '2fb84de1-36e3-416b-abdb-83eaefb80f89', 'Bu ürün ne kadar sürede teslim edilir?', 'Ürün satın alma işleminiz tamamlandıktan sonra genellikle 1-5 dakika içinde otomatik olarak hesabınıza teslim edilir. Acil durumlarda 7/24 destek ekibimizle iletişime geçebilirsiniz.', 1, 1, '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('e13846c2-1c55-4856-9a72-47f623786378', '0bfafe30-cc66-458b-8fa8-3ebe25826040', 'Bu ürün ne kadar sürede teslim edilir?', 'Ürün satın alma işleminiz tamamlandıktan sonra genellikle 1-5 dakika içinde otomatik olarak hesabınıza teslim edilir. Acil durumlarda 7/24 destek ekibimizle iletişime geçebilirsiniz.', 1, 1, '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('e58758f6-d3b8-4c1e-8909-3243a5db3304', 'bfb8d1cb-721a-4756-830b-a95454e1d5f1', 'Domain Değiştirebilir miyim?', 'Maleseef, domain değişikliği yapılamamaktadır.', 1, 1, '2025-10-13 21:16:37.000', '2025-10-13 21:16:37.000'),
('e9ac1367-e32d-4230-bd23-59fc3e550d91', '0fbee9fe-da18-4c6e-9910-73cf81ba5b9f', 'Bu ürün ne kadar sürede teslim edilir?', 'Ürün satın alma işleminiz tamamlandıktan sonra genellikle 1-5 dakika içinde otomatik olarak hesabınıza teslim edilir. Acil durumlarda 7/24 destek ekibimizle iletişime geçebilirsiniz.', 1, 1, '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('ea370f01-0202-42d1-9beb-b5c31d13ae91', '4a9b363d-8402-4e89-8055-f58064eb462e', 'Satın Alım Sonrası Destek Var mı?', 'Evet 7/24 wp hattımızdan destek alabilirsiniz.', 1, 1, '2025-10-06 21:34:20.000', '2025-10-06 21:34:20.000'),
('ebb3ecc5-2827-4ad7-bfa7-ff7d7820601c', 'a76e27ef-e486-4cf8-b765-e12e51d52768', 'Bu ürün ne kadar sürede teslim edilir?', 'Ürün satın alma işleminiz tamamlandıktan sonra genellikle 1-5 dakika içinde otomatik olarak hesabınıza teslim edilir. Acil durumlarda 7/24 destek ekibimizle iletişime geçebilirsiniz.', 1, 1, '2025-10-16 08:32:30.000', '2025-10-16 08:32:30.000'),
('f13ba198-a833-4159-80b6-e5c9d66e0be1', '975d48da-e57e-4f6e-97b1-a6a9ddabbf1d', '1000 Takipçi orijinal ve güvenilir mi?', 'Evet, 1000 Takipçi ürünümüz tamamen orijinal ve lisanslıdır. Tüm satışlarımız güvenli ödeme sistemleri üzerinden gerçekleşir ve ürün garantisi sağlanır.', 2, 1, '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('f1539ece-5ffb-44ac-ab81-df77bfab4ff5', '505bb39c-cc6b-4747-9179-8257c147ab6f', 'Windows 11 Home Key orijinal ve güvenilir mi?', 'Evet, Windows 11 Home Key ürünümüz tamamen orijinal ve lisanslıdır. Tüm satışlarımız güvenli ödeme sistemleri üzerinden gerçekleşir ve ürün garantisi sağlanır.', 2, 1, '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('f3fe45e5-166c-450f-a576-eb41852b7a85', 'a8d31476-b416-4b07-9a86-618112fc156d', 'Bu ürün ne kadar sürede teslim edilir?', 'Ürün satın alma işleminiz tamamlandıktan sonra genellikle 1-5 dakika içinde otomatik olarak hesabınıza teslim edilir. Acil durumlarda 7/24 destek ekibimizle iletişime geçebilirsiniz.', 1, 1, '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000');


-- ----------------------------
-- Table structure for `contact_messages`
-- ----------------------------
DROP TABLE IF EXISTS `contact_messages`;
CREATE TABLE `contact_messages` (
  `id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(64) NOT NULL,
  `subject` varchar(255) NOT NULL,
  `message` longtext NOT NULL,
  `status` varchar(32) NOT NULL DEFAULT 'new',
  `is_resolved` tinyint(1) NOT NULL DEFAULT 0,
  `admin_note` varchar(2000) DEFAULT NULL,
  `ip` varchar(64) DEFAULT NULL,
  `user_agent` varchar(512) DEFAULT NULL,
  `website` varchar(255) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `contact_created_idx` (`created_at`),
  KEY `contact_updated_idx` (`updated_at`),
  KEY `contact_status_idx` (`status`),
  KEY `contact_resolved_idx` (`is_resolved`),
  KEY `contact_status_resolved_created_idx` (`status`,`is_resolved`,`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Records of `contact_messages`
-- ----------------------------
INSERT INTO `contact_messages` (`id`, `name`, `email`, `phone`, `subject`, `message`, `status`, `is_resolved`, `admin_note`, `ip`, `user_agent`, `website`, `created_at`, `updated_at`) VALUES 
('bf2e33ec-c556-11f0-94cf-e86c61a30d56', 'Elif Koç', 'elif@example.com', '+90 530 333 33 44', 'Özel tasarım mezar', 'Modern tasarım granit mezar için görsel ve fiyat bilgisi rica ediyorum.', 'new', 0, NULL, NULL, NULL, NULL, '2024-01-05 14:20:00.000', '2024-01-05 14:20:00.000');


-- ----------------------------
-- Table structure for `cart_items`
-- ----------------------------
DROP TABLE IF EXISTS `cart_items`;
CREATE TABLE `cart_items` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `product_id` char(36) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `options` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`options`)),
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `cart_items_user_idx` (`user_id`),
  KEY `cart_items_product_idx` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Records of `cart_items`
-- ----------------------------
INSERT INTO `cart_items` (`id`, `user_id`, `product_id`, `quantity`, `options`, `created_at`, `updated_at`) VALUES 
('5ab2d936-1113-4a7b-bca7-2a4d8bc2b7be', 'd279bb9d-797d-4972-a8bd-a77a40caba91', '0132e42e-d46a-444d-9080-a419aec29c9c', 1, NULL, '2025-10-15 08:22:08.000', '2025-10-15 08:22:08.000'),
('91a79fb5-ada0-4889-bd88-80630b02053a', '7129bc31-88dc-42da-ab80-415a21f2ea9a', '0132e42e-d46a-444d-9080-a419aec29c9c', 2, '{ \"color\": \"Kırmızı\", \"size\": \"XL\" }', '2025-10-16 07:49:45.000', '2025-10-16 07:49:45.000');


-- ----------------------------
-- Table structure for `users`
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` char(36) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `full_name` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `wallet_balance` decimal(10,2) NOT NULL DEFAULT 0.00,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `email_verified` tinyint(1) NOT NULL DEFAULT 0,
  `reset_token` varchar(255) DEFAULT NULL,
  `reset_token_expires` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  `last_sign_in_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Records of `users`
-- ----------------------------
INSERT INTO `users` (`id`, `email`, `password_hash`, `full_name`, `phone`, `wallet_balance`, `is_active`, `email_verified`, `reset_token`, `reset_token_expires`, `created_at`, `updated_at`, `last_sign_in_at`) VALUES 
('0ac37a5c-a8be-4d25-b853-1e5c9574c1b3', 'mehmet@gmail.com', '$2b$12$temporary.hash.needs.reset', 'Mehmet Kuber', '05454905148', '0.00', 1, 0, NULL, NULL, '2025-10-07 09:49:06.000', '2025-10-16 09:26:05.000', NULL),
('19a2bc26-63d1-43ad-ab56-d7f3c3719a34', 'hostingisletmesi@gmail.com', '$2b$12$temporary.hash.needs.reset', 'Nuri Muh', '05414417854', '0.00', 1, 0, NULL, NULL, '2025-10-13 15:07:15.000', '2025-10-16 09:26:05.000', NULL),
('4a8fb7f7-0668-4429-9309-fe88ac90eed2', 'mlhgs1@gmail.com', '$2b$12$temporary.hash.needs.reset', 'Sultan Abdü', '05427354197', '0.00', 1, 0, NULL, NULL, '2025-10-13 20:14:20.000', '2025-10-16 09:26:05.000', NULL),
('4f618a8d-6fdb-498c-898a-395d368b2193', 'orhanguzell@gmail.com', '$2b$12$Ax2M8.ajr/XvJCcvG1pbIulx3q09GTdHfw5O/2McjX1nLBJDbpPFq', 'Orhan Güzel', '+905551112233', '0.00', 1, 1, NULL, NULL, '2025-11-19 14:47:59.358', '2025-11-19 14:48:44.869', '2025-11-19 14:48:44.869'),
('7129bc31-88dc-42da-ab80-415a21f2ea9a', 'melihkececi@yandex.com', '$2b$12$temporary.hash.needs.reset', 'Melih Keçeci', NULL, '0.00', 1, 0, NULL, NULL, '2025-10-06 18:08:24.000', '2025-10-16 09:26:05.000', NULL),
('d279bb9d-797d-4972-a8bd-a77a40caba91', 'kececimelih@gmail.com', '$2b$12$temporary.hash.needs.reset', 'Keçeci Melih', '05425547474', '0.00', 1, 0, NULL, NULL, '2025-10-14 07:49:48.000', '2025-10-16 09:26:05.000', NULL);


-- ----------------------------
-- Table structure for `product_stock`
-- ----------------------------
DROP TABLE IF EXISTS `product_stock`;
CREATE TABLE `product_stock` (
  `id` char(36) NOT NULL,
  `product_id` char(36) NOT NULL,
  `stock_content` varchar(255) NOT NULL,
  `is_used` tinyint(1) NOT NULL DEFAULT 0,
  `used_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `order_item_id` char(36) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `product_stock_product_id_idx` (`product_id`),
  KEY `product_stock_is_used_idx` (`product_id`,`is_used`),
  KEY `product_stock_order_item_id_idx` (`order_item_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Records of `product_stock`
-- ----------------------------
INSERT INTO `product_stock` (`id`, `product_id`, `stock_content`, `is_used`, `used_at`, `created_at`, `order_item_id`) VALUES 
('00b7a259-32f7-4082-8bdf-4af144edd4ca', 'd0550d22-210a-4cdb-ae0c-4e57b5b3b7bf', 'naber7:iyiyim', 0, NULL, '2025-10-10 11:56:33.000', NULL),
('064b8252-ab08-4e7f-8dc6-a626b28dae0b', 'a76e27ef-e486-4cf8-b765-e12e51d52768', 'P0O9I-U8Y7T-R6E5W-Q4S3D-2F1GZ', 0, NULL, '2025-10-16 08:32:29.000', NULL),
('0a4409e1-6f5a-4f3f-b729-163ecb5508eb', 'd0550d22-210a-4cdb-ae0c-4e57b5b3b7bf', 'naber8:sanane', 0, NULL, '2025-10-10 11:56:33.000', NULL),
('0b20f72f-e5a9-4a0d-af23-732f65f04dc3', 'a76e27ef-e486-4cf8-b765-e12e51d52768', 'Y4U5I-O6P7A-S8D9F-G0H1J-K2L3M', 1, '2025-10-16 08:05:59.000', '2025-10-14 08:13:22.000', '1ae5a701-fb49-47a6-9a0b-9548546c4a42'),
('137b545f-ca8a-4683-9855-8365f8c82ca0', 'a76e27ef-e486-4cf8-b765-e12e51d52768', 'Q0O9I-U8Y7T-R6E5W-Q4S3D-2F1GZ', 0, NULL, '2025-10-16 08:32:29.000', NULL),
('15185658-3882-4e8b-aee2-9c86089f0a3c', 'a76e27ef-e486-4cf8-b765-e12e51d52768', 'I9U8Y-T7R6E-W5Q4Z-X3C2V-B1N0M', 0, NULL, '2025-10-16 08:32:29.000', NULL),
('17cdad02-7a2c-4efd-a3ff-3f76d1885e56', 'a76e27ef-e486-4cf8-b765-e12e51d52768', 'K8L7J-H6G5F-D4S3A-Q2W1E-R9T0Y', 0, NULL, '2025-10-16 08:32:29.000', NULL),
('19793f5c-e63b-457c-a155-1828fb1743bc', 'a76e27ef-e486-4cf8-b765-e12e51d52768', 'A9X3P-6LQ2F-Z8V7M-R1S0E-3C4HT', 0, NULL, '2025-10-16 08:32:29.000', NULL),
('2a201d9d-aeb5-4716-9249-b31fd50bed36', 'a76e27ef-e486-4cf8-b765-e12e51d52768', 'T6R5E-W4Q3Z-X2C1V-B9N8M-L7K0J', 1, '2025-10-14 09:51:19.000', '2025-10-14 08:13:22.000', '488f675c-dc64-4c5e-aefe-fb0e26154db7'),
('37ad5a1a-8361-4679-8012-78fce891d8e9', 'a76e27ef-e486-4cf8-b765-e12e51d52768', 'L0K9J-H8G7F-D6S5A-Q4W3E-R2T1Y', 0, NULL, '2025-10-16 08:32:29.000', NULL),
('3bafa917-a21f-42e0-9bfc-f782905feb3a', 'a76e27ef-e486-4cf8-b765-e12e51d52768', 'O5P6A-S7D8F-G9H0J-K1L2M-N3B4V', 0, NULL, '2025-10-16 08:32:29.000', NULL),
('3f31947f-590e-4260-b3e7-9ce3021d0028', 'd0550d22-210a-4cdb-ae0c-4e57b5b3b7bf', 'naber9:iyi', 0, NULL, '2025-10-10 11:56:33.000', NULL),
('5bb0a7fa-47c8-4568-9db1-fca1e324bc6c', '7495db5f-293d-46a8-9f25-d7efa6881043', 'stok3@gmail.com:stok3', 0, NULL, '2025-10-10 13:36:19.000', NULL),
('745e5482-ee48-47fd-a367-783da4e72e39', 'a76e27ef-e486-4cf8-b765-e12e51d52768', 'R2T3Y-U4I5O-P6A7S-D8F9G-H0J1K', 1, '2025-10-14 09:45:04.000', '2025-10-14 08:13:22.000', 'f40c4a6d-0860-4507-af23-c4612b6e110d'),
('74fae3d3-1e0a-4904-be81-816431e73c10', 'a76e27ef-e486-4cf8-b765-e12e51d52768', 'H1J2K-L3M4N-O5P6Q-R7S8T-U9V0W', 1, '2025-10-14 08:26:21.000', '2025-10-14 08:13:22.000', 'cd589785-479b-4e84-9fcd-be972dd3e134'),
('7c12a546-830f-464d-874b-559941ede44c', '7495db5f-293d-46a8-9f25-d7efa6881043', 'sukumuko@gmail.com:sukuleta', 1, '2025-10-10 13:33:58.000', '2025-10-10 13:33:19.000', 'ebb026b8-bbab-4a5e-87ee-7b550db1ec03'),
('80811a65-49ad-4e72-b31c-f9d08afbe857', 'a76e27ef-e486-4cf8-b765-e12e51d52768', 'CDO9I-U8Y7T-R6E5W-Q4S3D-2F1GZ', 0, NULL, '2025-10-16 08:32:29.000', NULL),
('837ddeab-3a64-4d31-b956-8e0db82d961c', 'a76e27ef-e486-4cf8-b765-e12e51d52768', 'ABO9I-U8Y7T-R6E5W-Q4S3D-2F1GZ', 0, NULL, '2025-10-16 08:32:29.000', NULL),
('8832ba27-6e51-43d6-bc26-00be1634ba5c', 'a76e27ef-e486-4cf8-b765-e12e51d52768', 'S9D8F-G7H6J-K5L4M-N3B2V-C1X0Z', 1, '2025-10-14 09:51:52.000', '2025-10-14 08:13:22.000', 'bc960c6c-6c5b-4b19-adcb-2597fc093da9'),
('a10e4227-6fb0-4c5a-a672-bf23e71666d6', 'a76e27ef-e486-4cf8-b765-e12e51d52768', 'V7B8N-M9L0K-J1H2G-F3D4S-A5Q6W', 1, '2025-10-16 08:18:14.000', '2025-10-14 08:13:22.000', '172fa3d3-40c2-4d4d-aba8-391e84862450'),
('ad336982-d946-4226-b487-312090fe1f5e', 'a76e27ef-e486-4cf8-b765-e12e51d52768', 'E3R4T-Y5U6I-O7P8A-S9D0F-G1H2J', 1, '2025-10-16 08:23:21.000', '2025-10-14 08:13:22.000', '2dd99337-841a-49cb-be68-7aaf583da73f'),
('af017cfe-281f-4fb7-be00-188deb0e67ef', 'a76e27ef-e486-4cf8-b765-e12e51d52768', '4F7B2-9KLMN-8QW3T-Y2PZR-6D5VX', 0, NULL, '2025-10-16 08:32:29.000', NULL),
('b0ae3f12-eafd-42d2-85eb-bc8b7535c482', 'a76e27ef-e486-4cf8-b765-e12e51d52768', 'Z1X2C-V3B4N-M5L6K-J7H8G-F9D0S', 1, '2025-10-16 08:30:03.000', '2025-10-14 08:13:22.000', '5f364cb3-211b-4f0f-b73f-caa9a1c7ae20'),
('c74cefa4-df2c-48fa-b971-312118b87b4e', 'a76e27ef-e486-4cf8-b765-e12e51d52768', 'X1C2V-B3N4M-L5K6J-H7G8F-D9S0A', 1, '2025-10-14 09:48:01.000', '2025-10-14 08:13:22.000', '093b2ae6-05cc-43b3-8036-8e86a7a642a2'),
('c99cdc31-d6f6-4e28-9a80-20dd85f7157e', 'a76e27ef-e486-4cf8-b765-e12e51d52768', 'Z8N3M-5K1LP-2Q7RV-9T0YS-6D4XB', 1, '2025-10-14 08:26:21.000', '2025-10-14 08:13:22.000', 'cd589785-479b-4e84-9fcd-be972dd3e134'),
('d435f3ed-969c-40a2-8006-9fb23c0d86df', 'a76e27ef-e486-4cf8-b765-e12e51d52768', 'Q2W6E-R5T7Y-U8I9O-P0ASD-F3G4H', 0, NULL, '2025-10-16 08:32:29.000', NULL),
('d93c53a0-3ad0-4073-86c1-7b25a51d3419', '7495db5f-293d-46a8-9f25-d7efa6881043', 'stok4@gmail.com:stok4', 0, NULL, '2025-10-10 13:36:19.000', NULL),
('dd6ae245-5e97-4391-9b27-7b9ac215a3d2', '7495db5f-293d-46a8-9f25-d7efa6881043', 'stok1@gmail.com:stok1', 1, '2025-10-10 13:33:58.000', '2025-10-10 13:33:19.000', 'ebb026b8-bbab-4a5e-87ee-7b550db1ec03'),
('e2cc1af7-3c3d-47b6-8958-988d56594ee1', 'a76e27ef-e486-4cf8-b765-e12e51d52768', 'M5N6B-V7C8X-Z9L0K-J1H2G-F3D4S', 1, '2025-10-14 09:33:39.000', '2025-10-14 08:13:22.000', '09640ea7-fd34-47f7-a323-d7e19fce56cc'),
('f3dca954-956f-4a12-90c8-976a3335f60a', 'a76e27ef-e486-4cf8-b765-e12e51d52768', 'C2V3B-N4M5L-K6J7H-G8F9D-S0A1Q', 1, '2025-10-16 08:24:49.000', '2025-10-14 08:13:22.000', 'f7a857bc-d365-4256-8ac2-68cbee7f60be'),
('fb034ce5-ae41-45c7-b36c-d92fb795945b', '7495db5f-293d-46a8-9f25-d7efa6881043', 'stok2@gmail.com:stok2', 0, NULL, '2025-10-10 13:36:19.000', NULL);


-- ----------------------------
-- Table structure for `product_reviews`
-- ----------------------------
DROP TABLE IF EXISTS `product_reviews`;
CREATE TABLE `product_reviews` (
  `id` char(36) NOT NULL,
  `product_id` char(36) NOT NULL,
  `user_id` char(36) DEFAULT NULL,
  `rating` int(11) NOT NULL,
  `comment` text DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `customer_name` varchar(255) DEFAULT NULL,
  `review_date` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `product_reviews_product_id_idx` (`product_id`),
  KEY `product_reviews_approved_idx` (`product_id`,`is_active`),
  KEY `product_reviews_rating_idx` (`rating`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Records of `product_reviews`
-- ----------------------------
INSERT INTO `product_reviews` (`id`, `product_id`, `user_id`, `rating`, `comment`, `is_active`, `customer_name`, `review_date`, `created_at`, `updated_at`) VALUES 
('03a3b7f1-8c0c-43a6-95e3-ebcd0ac1692f', '1bdb2344-9b92-455f-935a-f064a470b6b8', NULL, 5, 'Güvenilir bir satıcı. Office 365 Lisans PC/MAC ürününü hemen teslim aldım ve mükemmel hizmet verdiler.', 1, 'Zeynep K.', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('0560ae0a-1821-4b16-bb5e-9da34c50ad41', '45f080dd-2e68-4ab7-ad97-a717b2482952', NULL, 5, 'Çok hızlı teslimat aldım ve Windows 11 Pro OEM Key (Kopya) sorunsuz çalışıyor. Kesinlikle tavsiye ederim!', 1, 'Ahmet Y.', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('0d16ea0d-c63b-4591-a161-fb223e20f8a3', '2fb84de1-36e3-416b-abdb-83eaefb80f89', NULL, 5, 'Çok hızlı teslimat aldım ve Windows 11 Pro Key sorunsuz çalışıyor. Kesinlikle tavsiye ederim!', 1, 'Ahmet Y.', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('0eb3e6d7-a8c9-42cf-a29d-2f092b0815d8', '30de177e-cd4a-4851-b44f-063164872771', NULL, 5, 'Çok hızlı teslimat aldım ve Canva Pro Yıllık sorunsuz çalışıyor. Kesinlikle tavsiye ederim!', 1, 'Ahmet Y.', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('0f20059f-9788-4f84-b6b5-7f5e791bf000', '7495db5f-293d-46a8-9f25-d7efa6881043', NULL, 5, 'Güvenilir bir satıcı. USA Gmail Hesap (2020) ürününü hemen teslim aldım ve mükemmel hizmet verdiler.', 1, 'Zeynep K.', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('1022f9e8-506d-4da5-9ce0-8ff2fdb0069a', '975d48da-e57e-4f6e-97b1-a6a9ddabbf1d', NULL, 5, 'Çok hızlı teslimat aldım ve 1000 Takipçi sorunsuz çalışıyor. Kesinlikle tavsiye ederim!', 1, 'Ahmet Y.', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('11a3f99b-c48e-4ebb-b134-c04775172a85', '3eeb67f8-40a6-44f4-95ff-1d721e361861', NULL, 5, 'Çok hızlı teslimat aldım ve Random Steam Key sorunsuz çalışıyor. Kesinlikle tavsiye ederim!', 1, 'Ahmet Y.', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('132992e2-b76d-4f6d-b057-6f05ae3ba2f6', '2f3ee84d-b301-4376-a3f7-a621a918c3b2', NULL, 5, 'Güvenilir bir satıcı. Gemini Veo 3 Ultra(30 Gün) ürününü hemen teslim aldım ve mükemmel hizmet verdiler.', 1, 'Zeynep K.', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('16fc25fc-3264-4ed8-9125-5c1a916286a6', 'a76e27ef-e486-4cf8-b765-e12e51d52768', NULL, 5, 'Çok hızlı teslimat aldım ve Adobe Photoshop Lisans Key sorunsuz çalışıyor. Kesinlikle tavsiye ederim!', 1, 'Ahmet Y.', '2025-10-16 08:32:30.000', '2025-10-16 08:32:30.000', '2025-10-16 08:32:30.000'),
('1db4bbc3-4123-49ee-a43c-32f1c77ad511', 'd8f607f5-5da9-47a5-ba66-f4835a155a2e', NULL, 5, 'Çok hızlı teslimat aldım ve Adobe Creative Cloud  sorunsuz çalışıyor. Kesinlikle tavsiye ederim!', 1, 'Ahmet Y.', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('281a30cb-409f-4e51-a8d1-8dcdfedf257c', 'd0550d22-210a-4cdb-ae0c-4e57b5b3b7bf', NULL, 5, 'Hızlı geldi teşekkürler', 1, 'Sultan Serik', '2025-10-10 11:56:34.000', '2025-10-10 11:56:34.000', '2025-10-10 11:56:34.000'),
('2eadf092-d236-4514-addf-1c970655a08e', 'd9845b72-9e45-45ee-aaad-da3e8466e2f1', NULL, 5, 'Güvenilir bir satıcı. Office 2021 Pro Plus Key ürününü hemen teslim aldım ve mükemmel hizmet verdiler.', 1, 'Zeynep K.', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('2efff6f2-447b-4106-bf4a-27fbf19af3c1', '2f3ee84d-b301-4376-a3f7-a621a918c3b2', NULL, 5, 'Çok hızlı teslimat aldım ve Gemini Veo 3 Ultra(30 Gün) sorunsuz çalışıyor. Kesinlikle tavsiye ederim!', 1, 'Ahmet Y.', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('37c07788-4a71-41a2-a944-d3839fb5fe11', '0fbee9fe-da18-4c6e-9910-73cf81ba5b9f', NULL, 5, 'Güvenilir bir satıcı. Gemini Veo 3 Ultra(90 Gün) ürününü hemen teslim aldım ve mükemmel hizmet verdiler.', 1, 'Zeynep K.', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('3feed29a-bef1-41c5-9147-28f23c39c997', '505bb39c-cc6b-4747-9179-8257c147ab6f', NULL, 5, 'Çok hızlı teslimat aldım ve Windows 11 Home Key sorunsuz çalışıyor. Kesinlikle tavsiye ederim!', 1, 'Ahmet Y.', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('5501d42a-9e88-4889-ba30-a7ed9016945e', '0132e42e-d46a-444d-9080-a419aec29c9c', NULL, 5, 'Güvenilir bir satıcı. 500 Takipçi ürününü hemen teslim aldım ve mükemmel hizmet verdiler.', 1, 'Zeynep K.', '2025-10-15 12:41:26.000', '2025-10-15 12:41:26.000', '2025-10-15 12:41:26.000'),
('58c7bcc1-d8a5-4141-8247-1b79090aa237', '271dfde4-f86b-452d-b64e-9186f071da44', NULL, 5, 'Güvenilir bir satıcı. Canva Pro Öğrenci ürününü hemen teslim aldım ve mükemmel hizmet verdiler.', 1, 'Zeynep K.', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('59b5bdaa-b641-4971-bb5e-bc0b08dd9d28', '975d48da-e57e-4f6e-97b1-a6a9ddabbf1d', NULL, 5, 'Güvenilir bir satıcı. 1000 Takipçi ürününü hemen teslim aldım ve mükemmel hizmet verdiler.', 1, 'Zeynep K.', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('62e4f600-c412-45ae-bed1-13be539a755b', 'fc0dbe1c-34f3-4906-97bd-b0666b55ded0', NULL, 5, 'Çok hızlı teslimat aldım ve Office 2016 Professional Plus Lisans sorunsuz çalışıyor. Kesinlikle tavsiye ederim!', 1, 'Ahmet Y.', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('652deed2-03cf-4ff7-93af-24ed7be33f10', 'd9845b72-9e45-45ee-aaad-da3e8466e2f1', NULL, 5, 'Çok hızlı teslimat aldım ve Office 2021 Pro Plus Key sorunsuz çalışıyor. Kesinlikle tavsiye ederim!', 1, 'Ahmet Y.', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('68dbc924-4c5c-4bec-8bf1-b0740d6848b7', '3eeb67f8-40a6-44f4-95ff-1d721e361861', NULL, 5, 'Güvenilir bir satıcı. Random Steam Key ürününü hemen teslim aldım ve mükemmel hizmet verdiler.', 1, 'Zeynep K.', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('6e4b93a2-8076-4ffc-b296-db5db7c4ba57', '0132e42e-d46a-444d-9080-a419aec29c9c', NULL, 5, 'Çok hızlı teslimat aldım ve 500 Takipçi sorunsuz çalışıyor. Kesinlikle tavsiye ederim!', 1, 'Ahmet Y.', '2025-10-15 12:41:26.000', '2025-10-15 12:41:26.000', '2025-10-15 12:41:26.000'),
('6fbf8534-c9f7-4690-82ed-0ca83c33569e', '6445f323-71c9-43a6-bda7-62df52c6af58', NULL, 5, 'Güvenilir bir satıcı. Windows 11 Education Key ürününü hemen teslim aldım ve mükemmel hizmet verdiler.', 1, 'Zeynep K.', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('70c78dc7-c2ec-4262-af9f-710d249785a8', '408ef745-5456-4115-ad79-3a26034edc37', NULL, 5, 'Çok hızlı teslimat aldım ve 100 Takipçi sorunsuz çalışıyor. Kesinlikle tavsiye ederim!', 1, 'Ahmet Y.', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('7528e28c-da65-4423-8f6a-90220ac3dbdc', 'c4e5b6c5-131f-4327-88bc-9c2fe09d5366', NULL, 5, 'Güvenilir bir satıcı. Adobe Acrobat Pro ürününü hemen teslim aldım ve mükemmel hizmet verdiler.', 1, 'Zeynep K.', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('7aa3b4ff-6569-4cda-9437-85fec27396f4', '4a9b363d-8402-4e89-8055-f58064eb462e', NULL, 5, '7 gün oldu alalı henüz bi sıkıntı yok', 1, 'İbrahim Dizar', '2025-10-06 21:34:20.000', '2025-10-06 21:34:20.000', '2025-10-06 21:34:20.000'),
('7bb686f1-fd83-4600-8a66-08d1929d1165', '1bdb2344-9b92-455f-935a-f064a470b6b8', NULL, 5, 'Çok hızlı teslimat aldım ve Office 365 Lisans PC/MAC sorunsuz çalışıyor. Kesinlikle tavsiye ederim!', 1, 'Ahmet Y.', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('7dbd80d0-f679-4e86-ab28-0d6c50716f22', '205fc262-f2af-463f-8f25-f913a64679e8', NULL, 5, 'Çok hızlı teslimat aldım ve Windows 11 Pro Key sorunsuz çalışıyor. Kesinlikle tavsiye ederim!', 1, 'Ahmet Y.', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('7e2778b0-289c-4dd2-8593-f6ff8baf5878', '0bfafe30-cc66-458b-8fa8-3ebe25826040', NULL, 5, 'Çok hızlı teslimat aldım ve Grand Theft Auto V sorunsuz çalışıyor. Kesinlikle tavsiye ederim!', 1, 'Ahmet Y.', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('7f2a061f-8c5f-4a2e-9eb7-ea9a20781455', '058e9ccd-f99d-4601-90ca-597fb3d4430f', NULL, 5, 'Güvenilir bir satıcı. ChatGPT Business Hesap(30 Gün) ürününü hemen teslim aldım ve mükemmel hizmet verdiler.', 1, 'Zeynep K.', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('87041b41-0d2e-4aa5-bec9-5aa8193a500e', '8cc7a560-15b4-4c52-a542-f6687e79d124', NULL, 5, 'Çok hızlı teslimat aldım ve Adobe Stock sorunsuz çalışıyor. Kesinlikle tavsiye ederim!', 1, 'Ahmet Y.', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('884319c5-24a0-486b-a70a-1d168016802d', '2fb84de1-36e3-416b-abdb-83eaefb80f89', NULL, 5, 'Güvenilir bir satıcı. Windows 11 Pro Key ürününü hemen teslim aldım ve mükemmel hizmet verdiler.', 1, 'Zeynep K.', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('8b5ad831-d069-45e6-a5d5-4fd1e10c7fda', '6c76a7b2-54ed-4290-8d83-c118533c5ee0', NULL, 5, 'Güvenilir bir satıcı. Windows 11 Pro Retail Key ürününü hemen teslim aldım ve mükemmel hizmet verdiler.', 1, 'Zeynep K.', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('8f4e2976-ae2e-46f2-a676-7c2c282eacbd', 'a76e27ef-e486-4cf8-b765-e12e51d52768', NULL, 5, 'Güvenilir bir satıcı. Adobe Photoshop Lisans Key ürününü hemen teslim aldım ve mükemmel hizmet verdiler.', 1, 'Zeynep K.', '2025-10-16 08:32:30.000', '2025-10-16 08:32:30.000', '2025-10-16 08:32:30.000'),
('9c191d23-e9f4-4a93-a13c-a688409e86ce', 'a8d31476-b416-4b07-9a86-618112fc156d', NULL, 5, 'Güvenilir bir satıcı. Adobe Illustrator Lisans Key ürününü hemen teslim aldım ve mükemmel hizmet verdiler.', 1, 'Zeynep K.', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('a0ed3abf-8567-4cdf-aa4a-dd0d43d4c4eb', 'ba71df27-d8c3-41c0-ac01-cb7ac9ebea42', NULL, 5, 'Güvenilir bir satıcı. ChatGPT Plus Hesap(30 Gün) ürününü hemen teslim aldım ve mükemmel hizmet verdiler.', 1, 'Zeynep K.', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('a5c0c962-939b-4ea2-ae38-0b7f8aa9b857', 'a8d31476-b416-4b07-9a86-618112fc156d', NULL, 5, 'Çok hızlı teslimat aldım ve Adobe Illustrator Lisans Key sorunsuz çalışıyor. Kesinlikle tavsiye ederim!', 1, 'Ahmet Y.', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('a776af2f-0d46-4c93-974e-8df5be7aa121', '6445f323-71c9-43a6-bda7-62df52c6af58', NULL, 5, 'Çok hızlı teslimat aldım ve Windows 11 Education Key sorunsuz çalışıyor. Kesinlikle tavsiye ederim!', 1, 'Ahmet Y.', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('aae23bd1-f321-4bf7-932d-e4f95ee77860', '8cc7a560-15b4-4c52-a542-f6687e79d124', NULL, 5, 'Güvenilir bir satıcı. Adobe Stock ürününü hemen teslim aldım ve mükemmel hizmet verdiler.', 1, 'Zeynep K.', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('ad44e2ad-7904-48f7-bf5f-26f289a2f3f1', '408ef745-5456-4115-ad79-3a26034edc37', NULL, 5, 'Güvenilir bir satıcı. 100 Takipçi ürününü hemen teslim aldım ve mükemmel hizmet verdiler.', 1, 'Zeynep K.', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('b54c4d03-6c94-490f-aa1f-823cf335f791', '058e9ccd-f99d-4601-90ca-597fb3d4430f', NULL, 5, 'Çok hızlı teslimat aldım ve ChatGPT Business Hesap(30 Gün) sorunsuz çalışıyor. Kesinlikle tavsiye ederim!', 1, 'Ahmet Y.', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('b5defcf8-d88f-4303-9fdc-c7c99d32e46f', 'c4e5b6c5-131f-4327-88bc-9c2fe09d5366', NULL, 5, 'Çok hızlı teslimat aldım ve Adobe Acrobat Pro sorunsuz çalışıyor. Kesinlikle tavsiye ederim!', 1, 'Ahmet Y.', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('b6b64f54-af53-4915-9f2d-ba7fc42e4a0b', '45f080dd-2e68-4ab7-ad97-a717b2482952', NULL, 5, 'Güvenilir bir satıcı. Windows 11 Pro OEM Key (Kopya) ürününü hemen teslim aldım ve mükemmel hizmet verdiler.', 1, 'Zeynep K.', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('b9cddd9b-704a-460e-889b-200098c8d206', '97fb37cc-7b93-49b9-a1e9-d9d34f33bbc1', NULL, 5, 'Güvenilir bir satıcı. 250 Takipçi ürününü hemen teslim aldım ve mükemmel hizmet verdiler.', 1, 'Zeynep K.', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('c2940cd3-3449-483b-b283-ec1adfc728bd', '97fb37cc-7b93-49b9-a1e9-d9d34f33bbc1', NULL, 5, 'Çok hızlı teslimat aldım ve 250 Takipçi sorunsuz çalışıyor. Kesinlikle tavsiye ederim!', 1, 'Ahmet Y.', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('c9426be5-5c73-4b1c-91a1-ce6c1ac06bd2', '505bb39c-cc6b-4747-9179-8257c147ab6f', NULL, 5, 'Güvenilir bir satıcı. Windows 11 Home Key ürününü hemen teslim aldım ve mükemmel hizmet verdiler.', 1, 'Zeynep K.', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('cdd9a429-8f8d-46e9-aa56-93c30a479479', '610e1be2-39c7-4cb4-9f73-1ba506e0bb06', NULL, 5, 'Güvenilir bir satıcı. Office 2024 Pro Plus Key ürününü hemen teslim aldım ve mükemmel hizmet verdiler.', 1, 'Zeynep K.', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('ce19de97-6859-4e9e-898c-ea7643d8c752', '610e1be2-39c7-4cb4-9f73-1ba506e0bb06', NULL, 5, 'Çok hızlı teslimat aldım ve Office 2024 Pro Plus Key sorunsuz çalışıyor. Kesinlikle tavsiye ederim!', 1, 'Ahmet Y.', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('d00e8789-28c6-4bf8-87b8-6945b587d5f1', '972d19c9-5c5c-48e8-9d42-a46cc5121bd2', NULL, 5, 'Güvenilir bir satıcı. Windows 11 Enterprise Key ürününü hemen teslim aldım ve mükemmel hizmet verdiler.', 1, 'Zeynep K.', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('d54890f5-43bc-449c-851d-46d0af2671f0', '7495db5f-293d-46a8-9f25-d7efa6881043', NULL, 5, 'Çok hızlı teslimat aldım ve USA Gmail Hesap (2020) sorunsuz çalışıyor. Kesinlikle tavsiye ederim!', 1, 'Ahmet Y.', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('d95326da-7185-4963-bc75-2498ab9866b6', 'fc0dbe1c-34f3-4906-97bd-b0666b55ded0', NULL, 5, 'Güvenilir bir satıcı. Office 2016 Professional Plus Lisans ürününü hemen teslim aldım ve mükemmel hizmet verdiler.', 1, 'Zeynep K.', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('daab568b-b625-4a0a-be35-48bc33fabf98', '972d19c9-5c5c-48e8-9d42-a46cc5121bd2', NULL, 5, 'Çok hızlı teslimat aldım ve Windows 11 Enterprise Key sorunsuz çalışıyor. Kesinlikle tavsiye ederim!', 1, 'Ahmet Y.', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('e153bbb1-2346-44fd-bfc8-efde145cca09', '205fc262-f2af-463f-8f25-f913a64679e8', NULL, 5, 'Güvenilir bir satıcı. Windows 11 Pro Key ürününü hemen teslim aldım ve mükemmel hizmet verdiler.', 1, 'Zeynep K.', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('f20e307b-9c3c-4c3c-a472-e5c1578a0a68', '271dfde4-f86b-452d-b64e-9186f071da44', NULL, 5, 'Çok hızlı teslimat aldım ve Canva Pro Öğrenci sorunsuz çalışıyor. Kesinlikle tavsiye ederim!', 1, 'Ahmet Y.', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('f76cb135-1090-4d74-9746-b02bf30013ce', 'd8f607f5-5da9-47a5-ba66-f4835a155a2e', NULL, 5, 'Güvenilir bir satıcı. Adobe Creative Cloud  ürününü hemen teslim aldım ve mükemmel hizmet verdiler.', 1, 'Zeynep K.', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('f884953f-133f-484a-a0b4-c9b58e215349', 'bfb8d1cb-721a-4756-830b-a95454e1d5f1', NULL, 5, '', 1, 'Anonim', '2025-10-13 21:16:37.000', '2025-10-13 21:16:37.000', '2025-10-13 21:16:37.000'),
('f9028f80-5c71-4a46-b61e-91f626436780', '0fbee9fe-da18-4c6e-9910-73cf81ba5b9f', NULL, 5, 'Çok hızlı teslimat aldım ve Gemini Veo 3 Ultra(90 Gün) sorunsuz çalışıyor. Kesinlikle tavsiye ederim!', 1, 'Ahmet Y.', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('f965e498-c029-428d-b301-248b9148b01c', '6c76a7b2-54ed-4290-8d83-c118533c5ee0', NULL, 5, 'Çok hızlı teslimat aldım ve Windows 11 Pro Retail Key sorunsuz çalışıyor. Kesinlikle tavsiye ederim!', 1, 'Ahmet Y.', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('fd2528e9-361a-403d-a897-b40ddf81fb2d', '30de177e-cd4a-4851-b44f-063164872771', NULL, 5, 'Güvenilir bir satıcı. Canva Pro Yıllık ürününü hemen teslim aldım ve mükemmel hizmet verdiler.', 1, 'Zeynep K.', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('fe78ff95-96fc-4c08-b540-488b2c1fa207', 'ba71df27-d8c3-41c0-ac01-cb7ac9ebea42', NULL, 5, 'Çok hızlı teslimat aldım ve ChatGPT Plus Hesap(30 Gün) sorunsuz çalışıyor. Kesinlikle tavsiye ederim!', 1, 'Ahmet Y.', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000'),
('ff53c659-f89f-4b4b-92a1-39b562d2277c', '0bfafe30-cc66-458b-8fa8-3ebe25826040', NULL, 5, 'Güvenilir bir satıcı. Grand Theft Auto V ürününü hemen teslim aldım ve mükemmel hizmet verdiler.', 1, 'Zeynep K.', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000', '2025-10-10 18:45:37.000');


-- ----------------------------
-- Table structure for `categories`
-- ----------------------------
DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories` (
  `id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `image_asset_id` char(36) DEFAULT NULL,
  `image_alt` varchar(255) DEFAULT NULL,
  `icon` varchar(100) DEFAULT NULL,
  `parent_id` char(36) DEFAULT NULL,
  `article_content` longtext DEFAULT NULL,
  `article_enabled` tinyint(1) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `is_featured` tinyint(1) NOT NULL DEFAULT 0,
  `display_order` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `categories_slug_uq` (`slug`),
  KEY `categories_parent_id_idx` (`parent_id`),
  KEY `categories_active_idx` (`is_active`),
  KEY `categories_order_idx` (`display_order`),
  KEY `categories_image_asset_idx` (`image_asset_id`),
  CONSTRAINT `fk_categories_parent` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Records of `categories`
-- ----------------------------
INSERT INTO `categories` (`id`, `name`, `slug`, `description`, `image_url`, `image_asset_id`, `image_alt`, `icon`, `parent_id`, `article_content`, `article_enabled`, `is_active`, `is_featured`, `display_order`, `created_at`, `updated_at`) VALUES 
('12b202f2-144e-44f6-b2d8-04dac0ad900b', 'Steam Ürünleri', 'steam', 'Popüler Steam oyunları ve içerikleri', NULL, NULL, NULL, NULL, NULL, NULL, 0, 1, 0, 0, '2025-10-06 17:17:39.000', '2025-10-19 14:50:52.000'),
('2f5f92ed-ed22-44e7-a92a-337e8956ce42', 'Adobe', 'adobe', 'Adobe ürünleri', 'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760107494789.png', NULL, NULL, NULL, NULL, NULL, 0, 1, 0, 0, '2025-10-10 14:45:00.000', '2025-10-19 14:50:52.000'),
('37993932-f635-4ec4-864a-912ebb093b86', 'Tasarım Araçları', 'design', 'Adobe, Canva ve grafik programları', NULL, NULL, NULL, NULL, NULL, NULL, 0, 1, 0, 0, '2025-10-06 17:17:39.000', '2025-10-19 14:50:52.000'),
('5e300196-8b4e-44d9-9020-d1fccccbe249', 'Instagram Takipçi', 'instagram-takipci-satin-al', 'Instagram takipçi satın al', NULL, NULL, NULL, NULL, NULL, NULL, 0, 1, 0, 2, '2025-10-07 12:51:44.000', '2025-10-19 14:50:52.000'),
('6675e932-657a-47cc-bf91-f2bfaba28ef3', 'Mail Hesapları', 'mail-hesaplari', 'Mail Hesapları', 'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760083082362.png', NULL, NULL, NULL, NULL, NULL, 0, 1, 0, 3, '2025-10-10 07:58:15.000', '2025-10-19 14:50:52.000'),
('8cef7f1f-e31a-4007-ade3-fb513368f210', 'Sosyal Medya', 'sosyal-medya', 'Sosyal Medya Hizmetleri', 'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760107566358.jpg', NULL, NULL, NULL, NULL, NULL, 0, 1, 0, 0, '2025-10-10 14:46:09.000', '2025-10-19 14:50:52.000'),
('ad366810-9c8c-4b3e-b493-d6b3fce09875', 'UC', 'pubg-uc', 'PUBG UC Satışı', 'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1759874086774.webp', NULL, NULL, NULL, 'cb82fb5b-abb4-4a08-b4da-2511b0a7e161', NULL, 0, 1, 0, 0, '2025-10-07 08:19:35.000', '2025-10-19 14:50:52.000'),
('cb82fb5b-abb4-4a08-b4da-2511b0a7e161', 'PUBG', 'pubg', 'PUBG Kategori', NULL, NULL, NULL, NULL, NULL, NULL, 0, 1, 0, 0, '2025-10-07 08:19:21.000', '2025-10-19 14:50:52.000'),
('ce780bbd-38e7-469e-a18a-9e51998e04d6', 'Office', 'office', 'Office programı lisans ürünleri.', 'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760107287951.webp', NULL, NULL, NULL, NULL, NULL, 0, 1, 0, 10, '2025-10-10 14:41:33.000', '2025-10-19 14:50:52.000'),
('d960ecae-8fcd-4084-bdfb-369464bd87b4', 'Windows', 'windows', 'Windows lisans ürünleri.', 'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760107242369.png', NULL, NULL, NULL, NULL, NULL, 0, 1, 0, 11, '2025-10-10 14:40:54.000', '2025-10-19 14:50:52.000'),
('d9a27929-1471-427d-9d28-418e6fc340e3', 'Geliştirici Araçları', 'development', 'IDE, hosting ve geliştirme araçları', 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&h=600&fit=crop', NULL, NULL, NULL, NULL, NULL, 0, 1, 0, 1, '2025-10-06 17:17:39.000', '2025-10-19 14:50:52.000'),
('eb9c13a1-386a-45f7-b41a-969219dc28a5', 'Yazılımlar', 'software', 'İşletim sistemleri ve ofis programları', NULL, NULL, NULL, NULL, NULL, NULL, 0, 1, 0, 5, '2025-10-06 17:17:39.000', '2025-10-19 14:50:52.000'),
('f6b5f01c-a7b9-48ee-bbdb-9b44b4bf8398', 'Yapay Zeka', 'yapay-zeka', 'Yapay zeka ürünleri.', 'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760110233740.jpg', NULL, NULL, NULL, NULL, NULL, 0, 1, 0, 12, '2025-10-10 15:30:56.000', '2025-10-19 14:50:52.000'),
('f810f0b8-3adc-4cfd-8c5e-02813094a9a8', 'SEO', 'seo', 'SEO araçları program lisansları', 'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760107448033.png', NULL, NULL, NULL, NULL, NULL, 0, 1, 0, 0, '2025-10-10 14:44:13.000', '2025-10-19 14:50:52.000');


-- ----------------------------
-- Table structure for `wallet_transactions`
-- ----------------------------
DROP TABLE IF EXISTS `wallet_transactions`;
CREATE TABLE `wallet_transactions` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `type` enum('deposit','withdrawal','purchase','refund') NOT NULL,
  `description` varchar(500) DEFAULT NULL,
  `order_id` char(36) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `wt_user_idx` (`user_id`),
  KEY `wt_created_idx` (`created_at`),
  KEY `wt_type_idx` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Records of `wallet_transactions`
-- ----------------------------
INSERT INTO `wallet_transactions` (`id`, `user_id`, `amount`, `type`, `description`, `order_id`, `created_at`) VALUES 
('0a0b3fd3-e78d-413e-bd7a-7645dceba60c', '19a2bc26-63d1-43ad-ab56-d7f3c3719a34', '10000.00', 'deposit', 'Admin tarafından eklendi', NULL, '2025-10-13 15:53:40.000'),
('93ddd47b-bdcd-46f5-83cb-0af15dc4a60f', '0ac37a5c-a8be-4d25-b853-1e5c9574c1b3', '5000.00', 'deposit', 'Bakiye yükleme onaylandı - havale', NULL, '2025-10-07 09:49:23.000');


-- ----------------------------
-- Table structure for `user_roles`
-- ----------------------------
DROP TABLE IF EXISTS `user_roles`;
CREATE TABLE `user_roles` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `role` enum('admin','moderator','user') NOT NULL DEFAULT 'user',
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_roles_user_id_role_unique` (`user_id`,`role`),
  KEY `user_roles_user_id_idx` (`user_id`),
  CONSTRAINT `fk_user_roles_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Records of `user_roles`
-- ----------------------------
INSERT INTO `user_roles` (`id`, `user_id`, `role`, `created_at`) VALUES 
('bdfb6ac7-c556-11f0-94cf-e86c61a30d56', '4f618a8d-6fdb-498c-898a-395d368b2193', 'admin', '2025-11-19 14:47:59.371'),
('d49103a1-9095-4efc-8645-c08dd05ed100', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'admin', '2025-10-06 18:09:39.000');


-- ----------------------------
-- Table structure for `footer_sections`
-- ----------------------------
DROP TABLE IF EXISTS `footer_sections`;
CREATE TABLE `footer_sections` (
  `id` char(36) NOT NULL,
  `title` varchar(100) NOT NULL,
  `links` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`links`)),
  `order_num` int(11) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `footer_sections_active_idx` (`is_active`),
  KEY `footer_sections_order_idx` (`order_num`),
  KEY `footer_sections_created_idx` (`created_at`),
  KEY `footer_sections_updated_idx` (`updated_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Records of `footer_sections`
-- ----------------------------
INSERT INTO `footer_sections` (`id`, `title`, `links`, `order_num`, `is_active`, `created_at`, `updated_at`) VALUES 
('59583ef1-0ba1-4c7c-b806-84fd204b52b9', 'Hızlı Erişim', '[]', 0, 1, '2025-10-15 20:05:22.000', '2025-10-15 20:05:22.000'),
('f942a930-6743-4ecc-b4b3-1fd6b77f9d77', 'Kurumsal', '[]', 1, 1, '2025-10-15 20:05:22.000', '2025-10-15 20:08:21.000');


-- ----------------------------
-- Table structure for `payment_providers`
-- ----------------------------
DROP TABLE IF EXISTS `payment_providers`;
CREATE TABLE `payment_providers` (
  `id` char(36) NOT NULL,
  `key` varchar(64) NOT NULL,
  `display_name` varchar(128) NOT NULL,
  `is_active` tinyint(4) NOT NULL DEFAULT 1,
  `public_config` text DEFAULT NULL,
  `secret_config` text DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `payment_providers_key_uq` (`key`),
  KEY `payment_providers_active_idx` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Records of `payment_providers`
-- ----------------------------
INSERT INTO `payment_providers` (`id`, `key`, `display_name`, `is_active`, `public_config`, `secret_config`, `created_at`, `updated_at`) VALUES 
('bedc356a-c556-11f0-94cf-e86c61a30d56', 'paytr', 'PayTR Kredi Kartı', 1, '{\"mode\":\"test\",\"type\":\"card\",\"commission\":2.50,\"test_mode\":true}', '{\"merchant_id\":\"xxx\",\"merchant_key\":\"yyy\",\"merchant_salt\":\"zzz\"}', '2025-11-19 14:48:00.844', '2025-11-19 14:48:00.844'),
('bedc37a8-c556-11f0-94cf-e86c61a30d56', 'paytr_havale', 'PayTR Havale/EFT', 1, '{\"mode\":\"test\",\"type\":\"bank_transfer\",\"commission\":0}', NULL, '2025-11-19 14:48:00.844', '2025-11-19 14:48:00.844'),
('bedc3848-c556-11f0-94cf-e86c61a30d56', 'shopier', 'Shopier', 0, '{\"mode\":\"test\",\"type\":\"card\"}', NULL, '2025-11-19 14:48:00.844', '2025-11-19 14:48:00.844');


-- ----------------------------
-- Table structure for `api_providers`
-- ----------------------------
DROP TABLE IF EXISTS `api_providers`;
CREATE TABLE `api_providers` (
  `id` char(36) NOT NULL,
  `name` varchar(100) NOT NULL,
  `type` varchar(50) NOT NULL,
  `credentials` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`credentials`)),
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `api_providers_active_idx` (`is_active`),
  KEY `api_providers_type_idx` (`type`),
  KEY `api_providers_name_idx` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Records of `api_providers`
-- ----------------------------
INSERT INTO `api_providers` (`id`, `name`, `type`, `credentials`, `is_active`, `created_at`, `updated_at`) VALUES 
('5cc2d80a-d0bf-4333-b2c5-5aaebd3c7aa3', 'Cekilisbayisi', 'smm', '{\"api_url\":\"https://cekilisbayisi.com/api/v2\",\"api_key\":\"dd6a5d1ad1cda75ee74d34b238bf111c\",\"balance\":82.2550354,\"currency\":\"TRY\"}', 1, '2025-10-07 12:46:38.000', '2025-10-09 09:42:19.000');


-- ----------------------------
-- Table structure for `notifications`
-- ----------------------------
DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `type` varchar(50) NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `notifications_user_idx` (`user_id`),
  KEY `notifications_is_read_idx` (`is_read`),
  KEY `notifications_created_idx` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Records of `notifications`
-- ----------------------------
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `created_at`) VALUES 
('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'Hoş geldiniz!', 'Hesabınız başarıyla oluşturuldu. İyi alışverişler!', 'system', 0, '2025-11-19 14:48:01.000'),
('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'İlk sipariş fırsatı', 'İlk siparişinizde ekstra indirim kazandınız. Sepette kupon kullanmayı unutmayın.', 'custom', 0, '2025-11-19 14:48:01.000');


-- ----------------------------
-- Table structure for `ticket_replies`
-- ----------------------------
DROP TABLE IF EXISTS `ticket_replies`;
CREATE TABLE `ticket_replies` (
  `id` char(36) NOT NULL,
  `ticket_id` char(36) NOT NULL,
  `user_id` char(36) DEFAULT NULL,
  `message` longtext NOT NULL,
  `is_admin` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_ticket_replies_ticket` (`ticket_id`),
  KEY `idx_ticket_replies_created` (`created_at`),
  CONSTRAINT `fk_ticket_replies_ticket` FOREIGN KEY (`ticket_id`) REFERENCES `support_tickets` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Records of `ticket_replies`
-- ----------------------------
INSERT INTO `ticket_replies` (`id`, `ticket_id`, `user_id`, `message`, `is_admin`, `created_at`) VALUES 
('002c708b-40e6-4ed2-ba57-baf9820d288a', '22c8d700-a5b8-4395-b1ce-1aba42495add', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'rtertertert', 1, '2025-10-13 15:35:26.000'),
('11edb28f-f448-470f-bbf8-f41ed95d1299', 'abebedb2-eefb-4d8f-a3bc-bb7e5b96a8aa', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'annen baban varmıdır', 1, '2025-10-13 15:31:17.000'),
('1a24fbf0-7ead-4658-91b9-501ed2af8f3e', 'ded743a6-7618-430c-bffb-e4db49dc6247', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'qwe', 1, '2025-10-15 14:54:40.000'),
('2415fa5f-bb16-4579-b4a4-a9f81d1b3f96', '951808b7-632b-4f6f-b2ff-a55f06ad19f9', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'sdfsdfsdf', 1, '2025-10-13 15:18:52.000'),
('50ba596c-a42d-4d93-a200-511746c13aad', 'f20fa9f8-5d93-463a-bf7b-60449fa5dfa4', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'asd', 1, '2025-10-15 14:51:05.000'),
('52ca9e72-cc03-4e04-a395-4ea697b9109e', 'a2f05a24-ac0b-4b59-a322-9864cc5e5364', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'Halledildi.', 1, '2025-10-13 12:55:25.000'),
('6145dfcb-dd55-4161-8cb4-e93e36ec56d5', 'df786c2d-5668-4688-88ad-952a3eebc812', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'mjhhjkj', 1, '2025-10-13 15:25:57.000'),
('68b76c1f-b1bc-47e2-b0ea-b76d674a7bea', 'eb07b91d-d727-40a0-9dcd-55321578d0ab', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'Buyrun.', 1, '2025-10-14 08:09:21.000'),
('7b7e644e-32bf-4e54-9dc5-55c1c1a6a65a', 'a894ffcf-28cb-4609-9021-b381e559a5f2', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'gdfgdfgdfgdfgdfg', 1, '2025-10-13 15:37:32.000'),
('84734c73-861c-42aa-baaf-6b1c47aa57c6', 'ded743a6-7618-430c-bffb-e4db49dc6247', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'qweqwe', 1, '2025-10-15 14:54:20.000'),
('8bb03576-8794-43b3-b5ca-adcf79b2a8b9', '8f83c5b7-5cbb-4d7e-8262-2b89c5415e6d', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'asdasd', 0, '2025-10-15 14:22:17.000'),
('8cb9e080-2331-453f-8e1d-0079e59d1e97', 'c742d0ad-3f07-466b-ac1e-2cf34b84941a', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'asd', 1, '2025-10-15 14:44:06.000'),
('8cfe1c53-2e05-44f2-8fe0-cdc44d8e6ef9', 'a2f05a24-ac0b-4b59-a322-9864cc5e5364', '0ac37a5c-a8be-4d25-b853-1e5c9574c1b3', 'tamamdır\n', 0, '2025-10-13 12:55:34.000'),
('94a8863b-c5fe-4823-8bc2-dd984c10fa62', '1b483b05-a8e0-48bd-8233-792863d26973', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'dfgdfgdfg', 1, '2025-10-13 16:01:03.000'),
('96d44802-14f4-4faf-9125-113b19f4ab8c', '534148b8-7462-422e-93d7-430cc2fdf6a1', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'sadsad', 1, '2025-10-13 15:39:16.000'),
('a014e062-fa53-4dba-b69a-c839c0d11ddf', 'ded743a6-7618-430c-bffb-e4db49dc6247', '4a8fb7f7-0668-4429-9309-fe88ac90eed2', 'qwe', 0, '2025-10-15 14:54:31.000'),
('b8867640-7014-4bb3-be17-37d4a41805c6', 'dff55daa-ff67-401e-ba81-9513e2fbb164', '7129bc31-88dc-42da-ab80-415a21f2ea9a', '45', 0, '2025-10-06 22:33:36.000'),
('cdc4b674-9360-46ec-9158-7ec7ce047e59', 'dff55daa-ff67-401e-ba81-9513e2fbb164', '7129bc31-88dc-42da-ab80-415a21f2ea9a', '545', 1, '2025-10-06 22:33:22.000'),
('e76247c0-95dc-4295-8661-3d6b901e4950', '22c8d700-a5b8-4395-b1ce-1aba42495add', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'rdgdfgdfgdfgdfgdfgdfgdfg', 1, '2025-10-13 15:33:27.000'),
('ff93ce04-575c-4c7a-9cbd-b7aec9b9c88b', '8f83c5b7-5cbb-4d7e-8262-2b89c5415e6d', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'asd', 1, '2025-10-15 14:23:24.000');


-- ----------------------------
-- Table structure for `payment_requests`
-- ----------------------------
DROP TABLE IF EXISTS `payment_requests`;
CREATE TABLE `payment_requests` (
  `id` char(36) NOT NULL,
  `order_id` char(36) NOT NULL,
  `user_id` char(36) DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `currency` varchar(10) NOT NULL DEFAULT 'TRY',
  `payment_method` varchar(50) NOT NULL,
  `payment_proof` varchar(500) DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'pending',
  `admin_notes` text DEFAULT NULL,
  `processed_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `payment_requests_order_idx` (`order_id`),
  KEY `payment_requests_user_idx` (`user_id`),
  KEY `payment_requests_status_idx` (`status`),
  KEY `payment_requests_created_idx` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Records of `payment_requests`
-- ----------------------------
INSERT INTO `payment_requests` (`id`, `order_id`, `user_id`, `amount`, `currency`, `payment_method`, `payment_proof`, `status`, `admin_notes`, `processed_at`, `created_at`, `updated_at`) VALUES 
('01b3f365-df23-4d98-a8f4-5d83fcc1913e', '63a6597a-565f-43b9-b977-a32ec2330ee4', NULL, '2679.99', 'TRY', 'havale', NULL, 'approved', NULL, NULL, '2025-10-14 09:51:42.000', '2025-10-14 09:51:52.000'),
('0487104c-e2f5-4cd7-935b-88d467671d01', 'ee29724c-4d7b-42be-8f3d-f167a2bfa784', NULL, '50.00', 'TRY', 'havale', NULL, 'approved', NULL, NULL, '2025-10-15 09:41:34.000', '2025-10-15 09:42:06.000'),
('094e7e8c-3385-4f21-bc9f-ef88428062f5', '483378b3-2edf-4bda-963c-7084a4f3e71b', NULL, '10.00', 'TRY', 'havale', NULL, 'approved', NULL, NULL, '2025-10-08 09:48:12.000', '2025-10-08 09:48:27.000'),
('0b151322-0c93-459c-aef0-c538400ab1cc', '62ac220d-5ce8-4d75-8440-8563911ff04f', NULL, '150.00', 'TRY', 'havale', NULL, 'approved', NULL, NULL, '2025-10-13 16:28:19.000', '2025-10-13 16:28:37.000'),
('0d0fbbb9-f8e5-48d0-b762-85302f5c8f81', '39667fd7-fdba-4192-a551-d837c6e43f1d', NULL, '179.99', 'TRY', 'havale', NULL, 'approved', NULL, NULL, '2025-10-16 08:24:27.000', '2025-10-16 08:24:49.000'),
('1039f12d-5cd1-41f4-ba8c-a017c2c4db86', 'ad4878e3-fd0d-4fa0-bcce-9da3c1932066', NULL, '10.00', 'TRY', 'havale', NULL, 'approved', NULL, NULL, '2025-10-08 09:11:59.000', '2025-10-08 09:13:06.000'),
('1fc1d655-b9f7-4fd4-a8dd-c79c47c42aaf', '153aa32e-4133-4c53-8696-75689fc6225f', NULL, '2500.00', 'TRY', 'havale', NULL, 'approved', NULL, NULL, '2025-10-13 21:15:25.000', '2025-10-13 21:15:48.000'),
('225ac86e-f77d-45ad-a44f-d184ab8e3195', 'aa736c50-8945-408a-b542-28f49df77c1f', NULL, '179.99', 'TRY', 'havale', NULL, 'approved', NULL, NULL, '2025-10-13 16:40:32.000', '2025-10-13 16:40:47.000'),
('22acbd6e-3721-47fc-8a66-5445304cd959', '1555b659-dc36-4638-9e6d-0e2c376932b5', NULL, '50.00', 'TRY', 'havale', NULL, 'pending', NULL, NULL, '2025-10-15 08:22:14.000', '2025-10-15 08:22:14.000');


-- ----------------------------
-- Table structure for `products`
-- ----------------------------
DROP TABLE IF EXISTS `products`;
CREATE TABLE `products` (
  `id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `short_description` varchar(500) DEFAULT NULL,
  `category_id` char(36) DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `original_price` decimal(10,2) DEFAULT NULL,
  `cost` decimal(10,2) DEFAULT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `featured_image` varchar(500) DEFAULT NULL,
  `featured_image_asset_id` varchar(200) DEFAULT NULL,
  `featured_image_alt` varchar(255) DEFAULT NULL,
  `gallery_urls` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`gallery_urls`)),
  `gallery_asset_ids` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`gallery_asset_ids`)),
  `features` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`features`)),
  `badges` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`badges`)),
  `custom_fields` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`custom_fields`)),
  `quantity_options` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`quantity_options`)),
  `rating` decimal(3,2) NOT NULL DEFAULT 5.00,
  `review_count` int(11) NOT NULL DEFAULT 0,
  `product_type` varchar(50) DEFAULT NULL,
  `delivery_type` varchar(50) DEFAULT NULL,
  `api_provider_id` char(36) DEFAULT NULL,
  `api_product_id` varchar(64) DEFAULT NULL,
  `api_quantity` int(11) DEFAULT NULL,
  `meta_title` varchar(255) DEFAULT NULL,
  `meta_description` varchar(500) DEFAULT NULL,
  `article_content` text DEFAULT NULL,
  `article_enabled` tinyint(1) NOT NULL DEFAULT 0,
  `demo_url` varchar(500) DEFAULT NULL,
  `demo_embed_enabled` tinyint(1) NOT NULL DEFAULT 0,
  `demo_button_text` varchar(100) DEFAULT NULL,
  `sku` varchar(100) DEFAULT NULL,
  `stock_quantity` int(11) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `is_featured` tinyint(1) NOT NULL DEFAULT 0,
  `is_digital` tinyint(1) NOT NULL DEFAULT 0,
  `requires_shipping` tinyint(1) NOT NULL DEFAULT 1,
  `file_url` varchar(500) DEFAULT NULL,
  `epin_game_id` varchar(64) DEFAULT NULL,
  `epin_product_id` varchar(64) DEFAULT NULL,
  `auto_delivery_enabled` tinyint(1) NOT NULL DEFAULT 0,
  `pre_order_enabled` tinyint(1) NOT NULL DEFAULT 0,
  `min_order` int(11) DEFAULT NULL,
  `max_order` int(11) DEFAULT NULL,
  `min_barem` int(11) DEFAULT NULL,
  `max_barem` int(11) DEFAULT NULL,
  `barem_step` int(11) DEFAULT NULL,
  `tax_type` int(11) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `products_slug_uq` (`slug`),
  KEY `products_category_id_idx` (`category_id`),
  KEY `products_sku_idx` (`sku`),
  KEY `products_active_idx` (`is_active`),
  KEY `products_cat_active_created_idx` (`category_id`,`is_active`,`created_at`),
  KEY `products_slug_active_idx` (`slug`,`is_active`),
  KEY `products_featured_asset_idx` (`featured_image_asset_id`(191)),
  CONSTRAINT `fk_products_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Records of `products`
-- ----------------------------
INSERT INTO `products` (`id`, `name`, `slug`, `description`, `short_description`, `category_id`, `price`, `original_price`, `cost`, `image_url`, `featured_image`, `featured_image_asset_id`, `featured_image_alt`, `gallery_urls`, `gallery_asset_ids`, `features`, `badges`, `custom_fields`, `quantity_options`, `rating`, `review_count`, `product_type`, `delivery_type`, `api_provider_id`, `api_product_id`, `api_quantity`, `meta_title`, `meta_description`, `article_content`, `article_enabled`, `demo_url`, `demo_embed_enabled`, `demo_button_text`, `sku`, `stock_quantity`, `is_active`, `is_featured`, `is_digital`, `requires_shipping`, `file_url`, `epin_game_id`, `epin_product_id`, `auto_delivery_enabled`, `pre_order_enabled`, `min_order`, `max_order`, `min_barem`, `max_barem`, `barem_step`, `tax_type`, `created_at`, `updated_at`) VALUES 
('0132e42e-d46a-444d-9080-a419aec29c9c', '500 Takipçi', '500-takipci', '<p>Instagram 500 Takipçi</p>', NULL, '5e300196-8b4e-44d9-9020-d1fccccbe249', '50.00', NULL, NULL, 'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760111139051.jpg', 'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760111139051.jpg', NULL, '500 Takipçi', NULL, NULL, NULL, NULL, NULL, NULL, '5.00', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, 9999999, 1, 0, 0, 1, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-10 15:45:52.000', '2025-10-15 12:41:26.000'),
('058e9ccd-f99d-4601-90ca-597fb3d4430f', 'ChatGPT Business Hesap(30 Gün)', 'chatgpt-business-hesap', '<ul><li><strong style=\"color: #fff; background-color:#e60000;\">SINIRSIZ GPT-5</strong><span style=\"color:#e0e7ff; background-color:#e60000;\"> ve görüntü/video oluşturma</span></li><li><strong style=\"color:#fff; background-color:#e60000;\">2’ye kadar eş zamanlı</strong><span style=\"color:#e0e7ff; background-color:#e60000;\"> üretim imkanı</span></li><li><strong style=\"color:#fff; background-color:#e60000;\">32K Bağlam Penceresi</strong><span style=\"color:#e0e7ff; background-color:#e60000;\"> ve gelişmiş analiz</span></li><li><strong style=\"color:#fff; background-color:#e60000;\">Video Oluşturma:</strong><span style=\"color:#e0e7ff; background-color:#e60000;\"> 720p’de 5 saniye veya 480p’de 10 saniye</span></li><li><strong style=\"color:#fff; background-color:#e60000;\">ChatGPT Ajanı</strong><span style=\"color:#e0e7ff; background-color:#e60000;\"> ve otomatik görev planlama</span></li><li><strong style=\"color:#fff; background-color:#e60000;\">Daha yüksek yanıt hızları</strong><span style=\"color:#e0e7ff; background-color:#e60000;\"> ve öncelikli destek</span></li></ul>', NULL, 'f6b5f01c-a7b9-48ee-bbdb-9b44b4bf8398', '250.00', NULL, NULL, 'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760110464275.jpeg', 'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760110464275.jpeg', NULL, 'ChatGPT Business Hesap(30 Gün)', NULL, NULL, NULL, NULL, NULL, NULL, '5.00', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, 10, 1, 0, 0, 1, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-10 15:34:37.000', '2025-10-10 15:34:37.000'),
('0bfafe30-cc66-458b-8fa8-3ebe25826040', 'Grand Theft Auto V', 'gta-5', 'GTA 5, Los Santos şehrinde geçen açık dünya aksiyon macera oyunudur. Üç farklı karakter arasında geçiş yaparak hikayeyi deneyimleyin.', 'Los Santos\'ta suç ve macera', '12b202f2-144e-44f6-b2d8-04dac0ad900b', '2500.00', NULL, NULL, 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&h=600&fit=crop', NULL, 'Grand Theft Auto V', NULL, NULL, NULL, NULL, NULL, NULL, '5.00', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, 150, 1, 0, 0, 1, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-06 17:19:05.000', '2025-10-06 17:19:05.000'),
('0fbee9fe-da18-4c6e-9910-73cf81ba5b9f', 'Gemini Veo 3 Ultra(90 Gün)', 'gemini-veo-3-ultra-90-gun', '<h3><strong>Veo 3 – Yapay Zeka Destekli Video Üretimi</strong></h3><p>Metinden sinematik videolar üretir; 1080p kalite, gerçekçi kamera hareketleri ve stil kontrolü sunar.</p>', NULL, 'f6b5f01c-a7b9-48ee-bbdb-9b44b4bf8398', '250.00', NULL, NULL, 'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760110653248.jpg', 'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760110653248.jpg', NULL, 'Gemini Veo 3 Ultra(90 Gün)', NULL, NULL, NULL, NULL, NULL, NULL, '5.00', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, 24, 1, 0, 0, 1, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-10 15:37:02.000', '2025-10-10 15:37:44.000'),
('1bdb2344-9b92-455f-935a-f064a470b6b8', 'Office 365 Lisans PC/MAC', 'office-365-lisans', '<h1 class=\"ql-align-center\"><strong>Office 2024 Professional Plus</strong></h1><p>Güncel Office uygulamalarıyla üretkenliğinizi artırın.</p>', 'Microsoft Office 365 Lisanslı Kullanıcı Hesabı – Tüm ofis programlarını (Excel, Word, Powerpoint vb.) 5 farklı cihazda (Pc, Mac, Android, iOS) kullanın.', 'ce780bbd-38e7-469e-a18a-9e51998e04d6', '200.00', NULL, NULL, 'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760109969704.jpg', 'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760109969704.jpg', NULL, 'Office 365 Lisans PC/MAC', NULL, NULL, NULL, NULL, NULL, NULL, '5.00', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, 100, 1, 0, 0, 1, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-10 15:26:29.000', '2025-10-10 15:26:29.000'),
('205fc262-f2af-463f-8f25-f913a64679e8', 'Windows 11 Pro Key', 'windows-11-pro', 'Microsoft Windows 11 Pro işletim sistemi aktivasyon anahtarı. Profesyonel kullanım için geliştirilmiş özellikler.', 'Profesyonel işletim sistemi lisansı', 'eb9c13a1-386a-45f7-b41a-969219dc28a5', '75.00', NULL, NULL, 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&h=600&fit=crop', NULL, 'Windows 11 Pro Key', NULL, NULL, NULL, NULL, NULL, NULL, '5.00', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, 500, 1, 0, 0, 1, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-06 17:19:05.000', '2025-10-06 17:19:05.000'),
('271dfde4-f86b-452d-b64e-9186f071da44', 'Canva Pro Öğrenci', 'canva-pro-ogrenci', '<p>Canva Pro Öğrenci Hesabı - 30 Gün Garantili</p>', 'Canva Pro Öğrenci Hesabı', '37993932-f635-4ec4-864a-912ebb093b86', '25.00', NULL, NULL, NULL, NULL, NULL, 'Canva Pro Öğrenci', NULL, NULL, NULL, NULL, NULL, NULL, '5.00', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, 1000, 1, 0, 0, 1, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-07 11:50:15.000', '2025-10-07 12:50:34.000'),
('2f3ee84d-b301-4376-a3f7-a621a918c3b2', 'Gemini Veo 3 Ultra(30 Gün)', 'gemini-veo-3-ultra-30-gun', '<h3><strong>Veo 3 – Yapay Zeka Video</strong></h3><p>30 günlük kullanım lisansı.</p>', NULL, 'f6b5f01c-a7b9-48ee-bbdb-9b44b4bf8398', '100.00', NULL, NULL, 'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760110645224.jpg', 'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760110645224.jpg', NULL, 'Gemini Veo 3 Ultra(30 Gün)', NULL, NULL, NULL, NULL, NULL, NULL, '5.00', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, 10, 1, 0, 0, 1, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-10 15:36:36.000', '2025-10-10 15:37:37.000'),
('2fb84de1-36e3-416b-abdb-83eaefb80f89', 'Windows 11 Pro Key', 'windows-11-pro-key', '<h1><strong>Windows 11 Pro Ürün Anahtarı</strong></h1><p>Satın alma sonrası lisans ve kurulum bilgileri e-posta ile iletilir.</p>', NULL, 'd960ecae-8fcd-4084-bdfb-369464bd87b4', '150.00', NULL, NULL, 'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760109591768.webp', 'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760109591768.webp', NULL, 'Windows 11 Pro Key', NULL, NULL, NULL, NULL, NULL, NULL, '5.00', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, 1111, 1, 0, 0, 1, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-10 15:20:20.000', '2025-10-10 15:21:15.000'),
('30de177e-cd4a-4851-b44f-063164872771', 'Canva Pro Yıllık', 'canva-pro', 'Canva Pro ile tüm premium içeriklere erişim.', 'Profesyonel tasarım aracı aboneliği', '37993932-f635-4ec4-864a-912ebb093b86', '1200.00', NULL, NULL, 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=600&fit=crop', NULL, 'Canva Pro Yıllık', NULL, NULL, NULL, NULL, NULL, NULL, '5.00', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, 50, 1, 0, 0, 1, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-06 17:19:05.000', '2025-10-06 17:19:05.000'),
('3eeb67f8-40a6-44f4-95ff-1d721e361861', 'Random Steam Key', 'random-steam-key', '<p>Rastgele Steam anahtarı.</p>', 'qweqwe', NULL, '10.00', NULL, NULL, NULL, NULL, NULL, 'Random Steam Key', NULL, NULL, NULL, NULL, NULL, NULL, '5.00', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, 100, 1, 0, 0, 1, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-07 07:55:51.000', '2025-10-10 14:47:24.000'),
('408ef745-5456-4115-ad79-3a26034edc37', '100 Takipçi', '100-takipci', '<p>Instagram 100 Takipçi</p>', NULL, '5e300196-8b4e-44d9-9020-d1fccccbe249', '10.00', NULL, NULL, NULL, NULL, NULL, '100 Takipçi', NULL, NULL, NULL, NULL, NULL, NULL, '5.00', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, 0, 1, 0, 0, 1, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-07 12:58:42.000', '2025-10-10 11:56:26.000'),
('45f080dd-2e68-4ab7-ad97-a717b2482952', 'Windows 11 Pro OEM Key (Kopya)', 'windows-11-pro-oem-key-kopya', '<h1><strong>Windows 11 OEM Retail Ürün Anahtarı</strong></h1><p>Satın alma sonrası lisans ve kurulum bilgileri e-posta ile iletilir.</p>', NULL, 'd960ecae-8fcd-4084-bdfb-369464bd87b4', '250.00', NULL, NULL, 'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760109591768.webp', 'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760109591768.webp', NULL, 'Windows 11 Pro OEM Key (Kopya)', NULL, NULL, NULL, NULL, NULL, NULL, '5.00', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, 1111, 1, 0, 0, 1, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-10 15:21:40.000', '2025-10-10 15:21:40.000'),
('4a9b363d-8402-4e89-8055-f58064eb462e', 'Cyberpunk 2077', 'cyberpunk-2077', '<p>Night City\'de geçen açık dünya aksiyon RPG.</p>', 'Gelecek vizyonu, açık dünya RPG deneyimi', '12b202f2-144e-44f6-b2d8-04dac0ad900b', '1500.00', NULL, NULL, 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&h=600&fit=crop', NULL, 'Cyberpunk 2077', NULL, NULL, NULL, NULL, NULL, NULL, '5.00', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, 100, 1, 0, 0, 1, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-06 17:19:05.000', '2025-10-06 21:34:19.000'),
('505bb39c-cc6b-4747-9179-8257c147ab6f', 'Windows 11 Home Key', 'windows-11-home-key', '<h1><strong>Windows 11 Home Ürün Anahtarı</strong></h1><p>Satın alma sonrası lisans ve kurulum bilgileri e-posta ile iletilir.</p>', NULL, 'd960ecae-8fcd-4084-bdfb-369464bd87b4', '100.00', NULL, NULL, 'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760107763091.webp', 'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760107763091.webp', NULL, 'Windows 11 Home Key', NULL, NULL, NULL, NULL, NULL, NULL, '5.00', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, 100, 1, 0, 0, 1, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-10 14:49:51.000', '2025-10-10 14:49:51.000'),
('610e1be2-39c7-4cb4-9f73-1ba506e0bb06', 'Office 2024 Pro Plus Key', 'office-2024-pro-plus-key', '<h1 class=\"ql-align-center\"><strong>Office 2024 Professional Plus</strong></h1><p>Güncel araçlar ve gelişmiş güvenlik.</p>', 'Office 2024 Professional Plus ürün etkinleştirme anahtarıdır.', 'ce780bbd-38e7-469e-a18a-9e51998e04d6', '500.00', NULL, NULL, 'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760110010899.jpeg', 'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760110010899.jpeg', NULL, 'Office 2024 Pro Plus Key', NULL, NULL, NULL, NULL, NULL, NULL, '5.00', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, 100, 1, 0, 0, 1, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-10 15:24:48.000', '2025-10-10 15:27:01.000'),
('6445f323-71c9-43a6-bda7-62df52c6af58', 'Windows 11 Education Key', 'windows-11-education-key', '<h1><strong>Windows 11 Education Retail</strong></h1><p>Tek PC için süresiz lisans.</p>', NULL, 'd960ecae-8fcd-4084-bdfb-369464bd87b4', '49.99', NULL, NULL, 'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760109591768.webp', 'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760109591768.webp', NULL, 'Windows 11 Education Key', NULL, NULL, NULL, NULL, NULL, NULL, '5.00', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, 1000, 1, 0, 0, 1, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-10 15:23:15.000', '2025-10-10 15:23:15.000'),
('6c76a7b2-54ed-4290-8d83-c118533c5ee0', 'Windows 11 Pro Retail Key', 'windows-11-pro-retail-key', '<h1><strong>Windows 11 Pro Retail</strong></h1><p>Tek PC için süresiz lisans.</p>', NULL, 'd960ecae-8fcd-4084-bdfb-369464bd87b4', '200.00', NULL, NULL, 'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760109591768.webp', 'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760109591768.webp', NULL, 'Windows 11 Pro Retail Key', NULL, NULL, NULL, NULL, NULL, NULL, '5.00', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, 1111, 1, 0, 0, 1, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-10 15:21:07.000', '2025-10-10 15:21:07.000'),
('7495db5f-293d-46a8-9f25-d7efa6881043', 'USA Gmail Hesap (2020)', 'usa-gmail-hesap-2020', '<p>USA IP ile açılmış Gmail hesapları.</p>', NULL, NULL, '10.00', NULL, NULL, 'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760083220733.webp', 'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760083220733.webp', NULL, 'USA Gmail Hesap (2020)', NULL, NULL, NULL, NULL, NULL, NULL, '5.00', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, 3, 1, 0, 0, 1, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-10 08:01:29.000', '2025-10-10 14:45:27.000'),
('8cc7a560-15b4-4c52-a542-f6687e79d124', 'Adobe Stock', 'adobe-stock', '<p>1 yıllık Adobe Stock.</p>', '1 Yıllık', '2f5f92ed-ed22-44e7-a92a-337e8956ce42', '150.00', NULL, NULL, 'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760110806672.png', 'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760110806672.png', NULL, 'Adobe Stock', NULL, NULL, NULL, NULL, NULL, NULL, '5.00', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, 5, 1, 0, 0, 1, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-10 15:40:21.000', '2025-10-10 15:40:21.000'),
('972d19c9-5c5c-48e8-9d42-a46cc5121bd2', 'Windows 11 Enterprise Key', 'windows-11-enterprise-key', '<h1><strong>Windows 11 Enterprise Retail</strong></h1><p>Tek PC için süresiz lisans.</p>', NULL, 'd960ecae-8fcd-4084-bdfb-369464bd87b4', '300.00', NULL, NULL, 'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760109591768.webp', 'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760109591768.webp', NULL, 'Windows 11 Enterprise Key', NULL, NULL, NULL, NULL, NULL, NULL, '5.00', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, 1111, 1, 0, 0, 1, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-10 15:22:18.000', '2025-10-10 15:22:18.000'),
('975d48da-e57e-4f6e-97b1-a6a9ddabbf1d', '1000 Takipçi', '1000-takipci', '<p>Instagram 1000 Takipçi</p>', NULL, '5e300196-8b4e-44d9-9020-d1fccccbe249', '100.00', NULL, NULL, 'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760111191345.jpg', 'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760111191345.jpg', NULL, '1000 Takipçi', NULL, NULL, NULL, NULL, NULL, NULL, '5.00', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, 9999999, 1, 0, 0, 1, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-10 15:46:46.000', '2025-10-10 15:46:46.000'),
('97fb37cc-7b93-49b9-a1e9-d9d34f33bbc1', '250 Takipçi', '250-takipci', '<p>Instagram 250 Takipçi</p>', NULL, '5e300196-8b4e-44d9-9020-d1fccccbe249', '25.00', NULL, NULL, 'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760111086369.jpg', 'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760111086369.jpg', NULL, '250 Takipçi', NULL, NULL, NULL, NULL, NULL, NULL, '5.00', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, 9999999, 1, 0, 0, 1, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-10 15:45:01.000', '2025-10-10 15:46:05.000'),
('a76e27ef-e486-4cf8-b765-e12e51d52768', 'Adobe Photoshop Lisans Key', 'adobe-photoshop-lisans-key', '<p>1 Yıllık Adobe Photoshop lisans anahtarı.</p>', '1 Yıllık', '2f5f92ed-ed22-44e7-a92a-337e8956ce42', '179.99', NULL, NULL, 'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760110968649.png', 'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760110968649.png', NULL, 'Adobe Photoshop Lisans Key', NULL, NULL, NULL, NULL, NULL, NULL, '5.00', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, 11, 1, 0, 0, 1, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-10 15:43:03.000', '2025-10-16 08:32:29.000'),
('a8d31476-b416-4b07-9a86-618112fc156d', 'Adobe Illustrator Lisans Key', 'adobe-illustrator-lisans-key', '<p>1 Yıllık Adobe Illustrator lisans anahtarı.</p>', '1 Yıllık', '2f5f92ed-ed22-44e7-a92a-337e8956ce42', '200.00', NULL, NULL, 'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760110917075.png', 'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760110917075.png', NULL, 'Adobe Illustrator Lisans Key', NULL, NULL, NULL, NULL, NULL, NULL, '5.00', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, 5, 1, 0, 0, 1, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-10 15:42:14.000', '2025-10-10 15:42:14.000'),
('ba71df27-d8c3-41c0-ac01-cb7ac9ebea42', 'ChatGPT Plus Hesap(30 Gün)', 'chatgpt-plus-hesap', '<ul><li><strong style=\"color:#fff; background-color:#e60000;\">SINIRSIZ GPT-5</strong> ve görüntü/video</li><li>2 eş zamanlı kullanım</li><li>32K bağlam</li></ul>', NULL, 'f6b5f01c-a7b9-48ee-bbdb-9b44b4bf8398', '100.00', NULL, NULL, 'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760110321803.jpeg', 'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760110321803.jpeg', NULL, 'ChatGPT Plus Hesap(30 Gün)', NULL, NULL, NULL, NULL, NULL, NULL, '5.00', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, 10, 1, 0, 0, 1, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-10 15:33:19.000', '2025-10-10 15:33:19.000'),
('bfb8d1cb-721a-4756-830b-a95454e1d5f1', 'SMM Paket Satış Scripti', 'smm-paket-satis-scripti', '<p>SMM Paket Satış Scripti</p>', NULL, 'eb9c13a1-386a-45f7-b41a-969219dc28a5', '2500.00', NULL, NULL, 'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760023662694.jpg', 'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760023662694.jpg', NULL, 'SMM Paket Satış Scripti', NULL, NULL, NULL, NULL, NULL, NULL, '5.00', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, 0, 1, 0, 0, 1, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-09 15:28:16.000', '2025-10-13 21:16:37.000'),
('c4e5b6c5-131f-4327-88bc-9c2fe09d5366', 'Adobe Acrobat Pro', 'adobe-acrobat-pro', '<p>1 Yıllık Adobe Acrobat Reader Pro.</p>', '1 Yıllık', '2f5f92ed-ed22-44e7-a92a-337e8956ce42', '150.00', NULL, NULL, 'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760110868758.jpeg', 'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760110868758.jpeg', NULL, 'Adobe Acrobat Pro', NULL, NULL, NULL, NULL, NULL, NULL, '5.00', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, 5, 1, 0, 0, 1, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-10 15:41:25.000', '2025-10-10 15:41:25.000'),
('d8f607f5-5da9-47a5-ba66-f4835a155a2e', 'Adobe Creative Cloud ', 'adobe-creative-cloud', '<p>1 Yıllık Adobe Creative Cloud.</p>', '1 Yıllık', '2f5f92ed-ed22-44e7-a92a-337e8956ce42', '3000.00', NULL, NULL, NULL, NULL, NULL, 'Adobe Creative Cloud ', NULL, NULL, NULL, NULL, NULL, NULL, '5.00', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, 5, 1, 0, 0, 1, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-07 07:54:53.000', '2025-10-10 15:39:20.000'),
('d9845b72-9e45-45ee-aaad-da3e8466e2f1', 'Office 2021 Pro Plus Key', 'office-2021-pro-plus-key', '<h1 class=\"ql-align-center\"><strong>Office 2021 Professional Plus</strong></h1><p>Word, Excel, PowerPoint, Outlook ve daha fazlası için etkinleştirme anahtarıdır.</p>', 'Office 2021 Professional Plus ürün etkinleştirme anahtarıdır.', 'ce780bbd-38e7-469e-a18a-9e51998e04d6', '777.00', NULL, NULL, 'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760110070547.webp', 'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760110070547.webp', NULL, 'Office 2021 Pro Plus Key', NULL, NULL, NULL, NULL, NULL, NULL, '5.00', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, 100, 1, 0, 0, 1, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-10 15:28:13.000', '2025-10-10 15:28:13.000'),
('fc0dbe1c-34f3-4906-97bd-b0666b55ded0', 'Office 2016 Professional Plus Lisans', 'office-2016-professional-plus-lisans', '<h1 class=\"ql-align-center\"><strong>Office 2016 Professional Plus</strong></h1><p>Word, Excel, PowerPoint ve Outlook uygulamaları için etkinleştirme anahtarıdır.</p>', 'Office 2016 Professional Plus lisans anahtarıdır.', 'ce780bbd-38e7-469e-a18a-9e51998e04d6', '650.00', NULL, NULL, 'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760110127790.jpeg', 'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760110127790.jpeg', NULL, 'Office 2016 Professional Plus Lisans', NULL, NULL, NULL, NULL, NULL, NULL, '5.00', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, NULL, NULL, 100, 1, 0, 0, 1, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-10 15:28:59.000', '2025-10-10 15:28:59.000');


-- ----------------------------
-- Table structure for `payment_sessions`
-- ----------------------------
DROP TABLE IF EXISTS `payment_sessions`;
CREATE TABLE `payment_sessions` (
  `id` char(36) NOT NULL,
  `provider_key` varchar(64) NOT NULL,
  `order_id` char(36) DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `currency` varchar(10) NOT NULL DEFAULT 'TRY',
  `status` varchar(32) NOT NULL,
  `client_secret` varchar(255) DEFAULT NULL,
  `iframe_url` varchar(500) DEFAULT NULL,
  `redirect_url` varchar(500) DEFAULT NULL,
  `extra` text DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `payment_sessions_provider_idx` (`provider_key`),
  KEY `payment_sessions_status_idx` (`status`),
  KEY `payment_sessions_created_idx` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



-- ----------------------------
-- Table structure for `profiles`
-- ----------------------------
DROP TABLE IF EXISTS `profiles`;
CREATE TABLE `profiles` (
  `id` char(36) NOT NULL,
  `full_name` text DEFAULT NULL,
  `phone` varchar(64) DEFAULT NULL,
  `avatar_url` text DEFAULT NULL,
  `address_line1` varchar(255) DEFAULT NULL,
  `address_line2` varchar(255) DEFAULT NULL,
  `city` varchar(128) DEFAULT NULL,
  `country` varchar(128) DEFAULT NULL,
  `postal_code` varchar(32) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_profiles_id_users_id` FOREIGN KEY (`id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Records of `profiles`
-- ----------------------------
INSERT INTO `profiles` (`id`, `full_name`, `phone`, `avatar_url`, `address_line1`, `address_line2`, `city`, `country`, `postal_code`, `created_at`, `updated_at`) VALUES 
('0ac37a5c-a8be-4d25-b853-1e5c9574c1b3', 'Mehmet Kuber', '05454905148', NULL, NULL, NULL, NULL, NULL, NULL, '2025-11-19 14:47:59.344', '2025-11-19 14:47:59.344'),
('19a2bc26-63d1-43ad-ab56-d7f3c3719a34', 'Nuri Muh', '05414417854', NULL, NULL, NULL, NULL, NULL, NULL, '2025-11-19 14:47:59.344', '2025-11-19 14:47:59.344'),
('4a8fb7f7-0668-4429-9309-fe88ac90eed2', 'Sultan Abdü', '05427354197', NULL, NULL, NULL, NULL, NULL, NULL, '2025-11-19 14:47:59.344', '2025-11-19 14:47:59.344'),
('4f618a8d-6fdb-498c-898a-395d368b2193', 'Orhan Güzel', '+905551112233', NULL, NULL, NULL, NULL, NULL, NULL, '2025-11-19 14:47:59.364', '2025-11-19 14:47:59.364'),
('7129bc31-88dc-42da-ab80-415a21f2ea9a', 'Melih Keçeci', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-11-19 14:47:59.344', '2025-11-19 14:47:59.344'),
('d279bb9d-797d-4972-a8bd-a77a40caba91', 'Keçeci Melih', '05425547474', NULL, NULL, NULL, NULL, NULL, NULL, '2025-11-19 14:47:59.344', '2025-11-19 14:47:59.344');


-- ----------------------------
-- Table structure for `wallet_deposit_requests`
-- ----------------------------
DROP TABLE IF EXISTS `wallet_deposit_requests`;
CREATE TABLE `wallet_deposit_requests` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_method` varchar(50) NOT NULL,
  `payment_proof` varchar(500) DEFAULT NULL,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `admin_notes` text DEFAULT NULL,
  `processed_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `wdr_user_idx` (`user_id`),
  KEY `wdr_created_idx` (`created_at`),
  KEY `wdr_status_idx` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Records of `wallet_deposit_requests`
-- ----------------------------
INSERT INTO `wallet_deposit_requests` (`id`, `user_id`, `amount`, `payment_method`, `payment_proof`, `status`, `admin_notes`, `processed_at`, `created_at`, `updated_at`) VALUES 
('15cafe4b-4551-4041-98c3-fd2fdcb5bc1b', '0ac37a5c-a8be-4d25-b853-1e5c9574c1b3', '5000.00', 'havale', NULL, 'approved', NULL, NULL, '2025-10-07 09:49:16.000', '2025-10-07 09:49:23.000'),
('1d2f9d83-6425-49a0-a859-5617bb2aa8c3', '4a8fb7f7-0668-4429-9309-fe88ac90eed2', '500.00', 'havale', NULL, 'pending', NULL, NULL, '2025-10-13 20:19:47.000', '2025-10-13 20:19:47.000'),
('3051f1e8-174d-4753-92fd-e22387f76a3f', '4a8fb7f7-0668-4429-9309-fe88ac90eed2', '100.00', 'havale', NULL, 'pending', NULL, NULL, '2025-10-13 20:17:13.000', '2025-10-13 20:17:13.000');


-- ----------------------------
-- Table structure for `blog_posts`
-- ----------------------------
DROP TABLE IF EXISTS `blog_posts`;
CREATE TABLE `blog_posts` (
  `id` char(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `excerpt` varchar(500) DEFAULT NULL,
  `content` text NOT NULL,
  `featured_image` varchar(500) DEFAULT NULL,
  `featured_image_asset_id` char(36) DEFAULT NULL,
  `featured_image_alt` varchar(255) DEFAULT NULL,
  `author` varchar(100) DEFAULT NULL,
  `meta_title` varchar(255) DEFAULT NULL,
  `meta_description` varchar(500) DEFAULT NULL,
  `is_published` tinyint(1) NOT NULL DEFAULT 0,
  `published_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `blog_posts_slug_uq` (`slug`),
  KEY `blog_posts_created_idx` (`created_at`),
  KEY `blog_posts_published_idx` (`published_at`),
  KEY `blog_posts_is_published_idx` (`is_published`),
  KEY `blog_posts_featured_asset_idx` (`featured_image_asset_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Records of `blog_posts`
-- ----------------------------
INSERT INTO `blog_posts` (`id`, `title`, `slug`, `excerpt`, `content`, `featured_image`, `featured_image_asset_id`, `featured_image_alt`, `author`, `meta_title`, `meta_description`, `is_published`, `published_at`, `created_at`, `updated_at`) VALUES 
('42b8c68c-9589-40a3-82a9-401fd23406d1', 'Sosyal Medya Pazarlamasında 2024 Trendleri', 'sosyal-medya-pazarlamasinda-2024-trendleri', 'Sosyal medya pazarlamasında öne çıkan son trendler ve bu trendleri işinizde nasıl kullanabileceğiniz.', '<h2>Sosyal Medya Pazarlamasının Geleceği</h2><p>2024 yılında sosyal medya pazarlaması, markaların müşterileriyle etkileşime geçmesinin en önemli yollarından biri olmaya devam ediyor.</p><h3>Video İçerik Hakimiyeti</h3><p>Kısa video içerikler, sosyal medya platformlarında en çok tüketilen içerik türü haline geldi. TikTok, Instagram Reels ve YouTube Shorts gibi platformlar, markaların geniş kitlelere ulaşmasını sağlıyor.</p><h3>Influencer İşbirlikleri</h3><p>Mikro ve makro influencer\'larla yapılan işbirlikleri, marka bilinirliğini artırmak ve hedef kitleye ulaşmak için etkili bir strateji olmaya devam ediyor.</p>', 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&h=600&fit=crop', NULL, 'Sosyal Medya Pazarlamasında 2024 Trendleri', 'Admin', NULL, NULL, 1, '2025-10-12 11:34:11.000', '2025-10-12 11:34:11.000', '2025-10-12 11:34:11.000'),
('56e4088e-0195-46ae-b016-aa4d73c70379', 'En İyi Oyun Lisansları 2025s', 'en-iyi-oyun-lisanslari-2025s', '2025 yılının en popüler oyun lisansları ve önerileri. Hangi oyunları tercih etmelisiniz?', '<h2>2025 Yılının En Çok Tercih Edilen Oyunları</h2><p>Bu yıl oyun dünyasında birçok yenilik ve heyecan verici içerik bulunuyor. İşte en çok tercih edilen oyunlar:</p><h3>Aksiyon Oyunları</h3><p>Bu kategoride en popüler oyunlar arasında son çıkan AAA yapımlar yer alıyor.</p><h3>Strateji Oyunları</h3><p>Düşünmeyi seven oyuncular için harika seçenekler mevcut.</p><h3>Multiplayer Deneyimleri</h3><p>Arkadaşlarınızla oynayabileceğiniz en iyi co-op oyunlar.</p>', 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&h=600&fit=crop', NULL, 'En İyi Oyun Lisansları 2025s', 'Ahmet Yılmaz', NULL, NULL, 1, '2025-10-06 22:06:38.000', '2025-10-06 22:06:38.000', '2025-10-06 22:30:37.000'),
('6af13cbe-906c-4ad3-af83-4f2dcb5d5359', 'Dijital Ürün Satışında Başarı İpuçları', 'dijital-urun-satisinda-basari-ipuclari', 'Dijital ürün satışında başarılı olmak için bilmeniz gereken temel stratejiler ve ipuçları.', '<h2>Dijital Ürün Satışının Temelleri</h2><p>Dijital ürün satışı, günümüzün en karlı iş modellerinden biri haline geldi. Bu yazıda, dijital ürün satışında başarılı olmanız için bilmeniz gereken temel stratejileri paylaşacağız.</p><h3>Hedef Kitlenizi Tanıyın</h3><p>Başarılı bir dijital ürün satışı için öncelikle hedef kitlenizi iyi tanımalısınız. Müşterilerinizin ihtiyaçlarını, beklentilerini ve sorunlarını anlamak, size doğru ürünleri sunma konusunda yardımcı olacaktır.</p><h3>Kaliteli Hizmet Sunun</h3><p>Dijital ürün satışında müşteri memnuniyeti her şeyden önemlidir. Hızlı teslimat, güvenilir ödeme sistemleri ve 7/24 destek hizmeti sunarak müşterilerinizin güvenini kazanabilirsiniz.</p>', 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop', NULL, 'Dijital Ürün Satışında Başarı İpuçları', 'Admin', NULL, NULL, 1, '2025-10-12 11:34:11.000', '2025-10-12 11:34:11.000', '2025-10-12 11:34:11.000'),
('c33488f7-12b7-4a58-b67c-7903589da484', 'Oyun Kredileri ve E-Pin Kullanım Rehberi', 'oyun-kredileri-ve-e-pin-kullanim-rehberi', 'Oyun kredileri ve e-pin\'leri güvenli bir şekilde nasıl satın alır ve kullanırsınız? Detaylı rehberimizle öğrenin.', '<h2>E-Pin ve Oyun Kredileri Nedir?</h2><p>E-pin\'ler ve oyun kredileri, dijital oyunlar ve platformlar için kullanılan ön ödemeli kodlardır. Bu rehberde, e-pin\'leri güvenli bir şekilde nasıl satın alacağınızı ve kullanacağınızı öğreneceksiniz.</p><h3>Güvenli Satın Alma İpuçları</h3><p>E-pin satın alırken mutlaka güvenilir platformları tercih edin. Satıcının yorumlarını kontrol edin ve güvenli ödeme yöntemlerini kullanın.</p><h3>Kullanım Adımları</h3><p>E-pin\'inizi aldıktan sonra, ilgili platformun kod girme bölümüne gidin ve kodunuzu girin. Kredi veya içerik hesabınıza anında yüklenecektir.</p>', 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&h=600&fit=crop', NULL, 'Oyun Kredileri ve E-Pin Kullanım Rehberi', 'Admin', NULL, NULL, 1, '2025-10-12 11:34:11.000', '2025-10-12 11:34:11.000', '2025-10-12 11:34:11.000'),
('c71dd534-d010-45a0-9da7-1ce4aff90dbb', 'Microsoft Office Lisansı Nasıl Seçilir?', 'microsoft-office-lisansi-nasil-secilirs', 'İşletmeniz veya kişisel kullanımınız için en uygun Office lisansını seçme rehberi.', '<h2>Office Lisans Türleri</h2><p>Microsoft Office birçok farklı lisans seçeneği sunuyor. Hangisinin sizin için uygun olduğunu belirleyelim.</p><h3>Microsoft 365 Personal</h3><p>Bireysel kullanıcılar için ideal olan bu paket, 1 PC veya Mac üzerinde kullanılabilir.</p><h3>Microsoft 365 Family</h3><p>Aile üyeleriyle paylaşabileceğiniz, 6 kişiye kadar lisans sunan ekonomik paket.</p><h3>Office Home &amp; Business</h3><p>Küçük işletmeler için tek seferlik satın alma seçeneği ile maliyet avantajı.</p><h3>Karar Verirken Nelere Dikkat Edilmeli?</h3><p>İhtiyacınız olan programlar, cihaz sayısı ve bütçenizi göz önünde bulundurarak karar verin.</p>', NULL, NULL, 'Microsoft Office Lisansı Nasıl Seçilir?', 'Ayşa', NULL, NULL, 1, '2025-10-06 22:06:38.000', '2025-10-06 22:06:38.000', '2025-10-09 09:29:03.000'),
('d8db9721-6067-40be-8122-5605dba2bc7f', 'Spotify Premium vs YouTube Music', 'spotify-premium-vs-youtube-music', 'İki popüler müzik platformunu karşılaştırdık. Hangisi sizin için daha uygun?', '<h2>Müzik Platformları Karşılaştırması</h2><p>Günümüzde müzik dinleme alışkanlıklarımız tamamen değişti. Peki hangi platform sizin için daha uygun?</p><h3>Spotify Premium Avantajları</h3><ul><li>Geniş müzik kütüphanesi</li><li>Kişiselleştirilmiş çalma listeleri</li><li>Yüksek ses kalitesi</li><li>Offline dinleme</li></ul><h3>YouTube Music Avantajları</h3><ul><li>YouTube videolarına erişim</li><li>Geniş içerik yelpazesi</li><li>Remix ve cover versiyonlar</li><li>YouTube Premium ile entegrasyon</li></ul><h3>Fiyat Karşılaştırması</h3><p>Her iki platform da rekabetçi fiyatlar sunuyor. Öğrenci ve aile paketleriyle maliyet avantajı sağlayabilirsiniz.</p>', 'https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=800&h=600&fit=crop', NULL, 'Spotify Premium vs YouTube Music', 'Mehmet Kaya', NULL, NULL, 1, '2025-10-06 22:06:38.000', '2025-10-06 22:06:38.000', '2025-10-06 22:06:38.000'),
('e1159124-e6f4-4569-8df8-ed762e7b4b9e', 'Dijital Ürünlerde Güvenlik İpuçları', 'dijital-urunlerde-guvenlik-ipuclari', 'Dijital ürünleri satın alırken güvenliğinizi sağlamak için bilmeniz gereken önemli ipuçları.', '<h2>Güvenli Alışverişin Temel Kuralları</h2><p>Dijital ürünler satın alırken dikkat etmeniz gereken en önemli noktalar nelerdir? Bu yazıda sizin için önemli güvenlik ipuçlarını derledik.</p><h3>1. Güvenilir Platformları Tercih Edin</h3><p>Her zaman SSL sertifikası olan ve güvenli ödeme yöntemlerine sahip platformları kullanın.</p><h3>2. Şifre Güvenliği</h3><p>Hesaplarınız için güçlü ve benzersiz şifreler kullanın. İki faktörlü kimlik doğrulamayı aktif edin.</p><h3>3. Ödeme Bilgilerinizi Koruyun</h3><p>Kredi kartı bilgilerinizi sadece güvenilir platformlarda paylaşın ve düzenli olarak hesap hareketlerinizi kontrol edin.</p>', 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&h=600&fit=crop', NULL, 'Dijital Ürünlerde Güvenlik İpuçları', 'Dijimin Ekibi', NULL, NULL, 1, '2025-10-06 22:06:38.000', '2025-10-06 22:06:38.000', '2025-10-06 22:06:38.000');


-- ----------------------------
-- Table structure for `order_timeline`
-- ----------------------------
DROP TABLE IF EXISTS `order_timeline`;
CREATE TABLE `order_timeline` (
  `id` char(36) NOT NULL,
  `order_id` char(36) NOT NULL,
  `type` varchar(50) NOT NULL,
  `message` text NOT NULL,
  `actor_name` varchar(255) DEFAULT NULL,
  `meta` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`meta`)),
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `ot_order_idx` (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

