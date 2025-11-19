SET NAMES utf8mb4;
SET time_zone = '+00:00';

INSERT INTO `site_settings` (`id`, `key`, `value`, `created_at`, `updated_at`) VALUES
-- ------------------------------------------------------------------
-- SMTP / MAIL AYARLARI
-- ------------------------------------------------------------------
('1087ac95-f609-47eb-bd22-eedc70593ee2', 'smtp_from_name',  'Dijital Paket',          NOW(3), NOW(3)),
('98c6835c-67b9-470c-9924-30da6913b0b9', 'smtp_from_email', 'info@koenigsmassage.com', NOW(3), NOW(3)),
('c8561584-2ebd-40bc-862c-a72bd77072a4', 'smtp_host',       'smtp.hostinger.com',       NOW(3), NOW(3)),
('a061caa1-3470-4322-9219-49251b517260', 'smtp_port',       '465',                    NOW(3), NOW(3)),
('a0d4bff5-aa59-4233-af47-26db5631ba87', 'smtp_username',   'info@koenigsmassage.com', NOW(3), NOW(3)),
('f7ee0f74-142b-4018-8e6b-d8ed89f7bd87', 'smtp_password',   'Kaman@12!',      NOW(3), NOW(3)),
('f613de65-d7e2-4707-9532-9643ba933128', 'smtp_ssl',        'true',                   NOW(3), NOW(3)),

-- Admin iletişim mail adresi (contact sayfası + bildirimler)
('0b9c4a6b-5c56-4a6f-8f4a-2f2a3fb5e001', 'contact_email',   'info@koenigsmassage.com', NOW(3), NOW(3)),

-- ------------------------------------------------------------------
-- GENEL / SEO / SITE BİLGİLERİ
-- ------------------------------------------------------------------
('c4e50751-6ad4-47bf-88eb-f611ba09b244', 'site_title',          'Dijital Ürün Satış Scripti', NOW(3), NOW(3)),
('a6355cc0-94af-4222-bd2e-c8a1d43061ef', 'site_description',    'Dijital Ürün Satış Scripti yazılımı ile dijitalde öne çıkın', NOW(3), NOW(3)),
('b2f83dca-5b8e-47ac-94b6-cdc88c9df2a0', 'default_currency',    'TRY', NOW(3), NOW(3)),
('654dd48f-ceaa-4d52-bcb8-af771404bacf', 'theme_mode',          'user_choice', NOW(3), NOW(3)),
('0ccbf739-2308-4b58-a966-7d0d0f0e51d9', 'seo_contact_title',   'Bize Ulaşın - Dijimins', NOW(3), NOW(3)),
('a766e2c9-0351-46b5-9036-1498b3a57d71', 'seo_blog_title',      'Blog Yazıları - Dijimins', NOW(3), NOW(3)),
('aa8db0d1-7f55-44fa-b2b7-16cbdbcc7b83', 'seo_categories_title','Tüm Kategoriler - Dijimins', NOW(3), NOW(3)),
('e6eaf2b4-e5af-4d98-885a-766868a1c973', 'seo_products_title',  'Tüm Ürünler - Dijimins', NOW(3), NOW(3)),
('c98dc691-46d6-4333-99ae-df9b1541e83b', 'google_analytics_id', '', NOW(3), NOW(3)),
('6bee2ce3-ed8c-4314-9efb-b5cd9e7d46a2', 'custom_header_code',  '<meta name="robots" content="noindex, nofollow" />', NOW(3), NOW(3)),
('a4b49c13-f954-4cc8-9726-e2587d87f734', 'custom_footer_code',  '', NOW(3), NOW(3)),
('d4dbaa77-8716-4907-910d-aec623839527', 'favicon_url',         '', NOW(3), NOW(3)),

-- ------------------------------------------------------------------
-- HOME / ANASAYFA METİN & GÖRSEL
-- ------------------------------------------------------------------
('5dab8c8e-5154-49a4-bea8-7506bb3db323', 'home_header_top_text',     'İndirim Sezonu Başladı', NOW(3), NOW(3)),
('acda45f1-7cf8-41f8-b1e2-837dcb1150ff', 'home_header_sub_text_1',   'Yeni Üyelere Özel', NOW(3), NOW(3)),
('47a92af6-cbbb-4818-8b3f-41f85ba36924', 'home_header_sub_text_2',   '%10 Fırsatı Dijimin''de!', NOW(3), NOW(3)),
('bd53715d-36bd-413b-96dd-ff2ee7e1d465', 'home_header_bottom_text',  'It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout.', NOW(3), NOW(3)),
('c4719799-b091-4a55-91e2-19d481d2c6db', 'home_header_button_text',  'Ürünleri İncele', NOW(3), NOW(3)),
('5def2712-3ea9-42d5-a1e6-2452f6437643', 'home_header_show_contact', 'false', NOW(3), NOW(3)),
('85fee78a-9edd-4cea-b3c8-e7cf71b7655b', 'home_hero_image_url',      'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/hero-1760112144368.webp', NOW(3), NOW(3)),
('4622950e-a0d6-4b0d-927c-d03666da627d', 'home_hero_image_alt',      'Dijital Ürünler', NOW(3), NOW(3)),
('214f86a4-9c0d-4f52-9430-fe0c0d6b958f', 'home_display_mode',        'list', NOW(3), NOW(3)),
('7889683d-11ce-45d3-82b0-852af73ae314', 'home_scroll_content_active','true', NOW(3), NOW(3)),
('893af6a3-fd21-4177-bf63-e3e2816fdd60', 'home_scroll_content',
'<h2>Hesap Satın Als</h2><p>Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.<span style=\\\"color: rgb(15, 23, 41);\\\">Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.</span></p><h2>Hesap Satın Al</h2><p>Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.</p><h2>Hesap Satın Al</h2><p>Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.</p><h2>Hesap Satın Al</h2><p>Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.</p><h2>Hesap Satın Al</h2><p>Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.</p><h2>Hesap Satın Al</h2><p>Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.</p>',
NOW(3), NOW(3)),
('0f2ff5df-db32-45a1-a1e6-2452f6437643', 'home_featured_title',  'En çok satan ürünlerimize göz atın', NOW(3), NOW(3)),
('2e697726-0a35-4fb1-82f8-9a2796f2fa50', 'home_featured_button', 'Tüm Ürünleri Görüntüle', NOW(3), NOW(3)),
('18610713-8f96-4936-a0b6-6dfad2740f50', 'payment_methods',
 '{ "eft_enabled": false, "havale_account_holder": "qweqwe", "havale_bank_name": "qwe", "havale_enabled": true, "havale_iban": "TR545454545454545454545" }',
 NOW(3), NOW(3)),
('461d0e2f-a3c1-4bad-a93a-39fc2374574d', 'home_step_1_title', 'Ürünü Seçin', NOW(3), NOW(3)),
('8b2a260b-ad7e-4782-a0de-8780e9f3c6d2', 'home_step_1_desc',  'Geniş ürün yelpazemizden ihtiyacınıza uygun dijital ürünü bulun ve inceleyin.', NOW(3), NOW(3)),
('dc33b02b-39e7-46bc-a38f-e7fd84c6472b', 'home_step_2_title', 'Güvenli Ödeme', NOW(3), NOW(3)),
('a841f4ea-c037-44c2-8c59-70be391ca655', 'home_step_2_desc',  'Kredi kartı, havale veya kripto para ile güvenli ödeme yapın.', NOW(3), NOW(3)),
('4e67bbd7-16dd-4724-b3b2-e47e53d7202c', 'home_step_3_title', 'Anında Teslimat', NOW(3), NOW(3)),
('d56bf4e0-6e85-4e89-bf61-8578ffc1cf00', 'home_step_3_desc',  'Ödeme onaylandıktan sonra ürününüz otomatik olarak e-posta ve panele iletilir.', NOW(3), NOW(3)),
('68fc971a-35c1-4fd2-a57a-8eb8cb6320f7', 'home_step_4_title', '7/24 Destek', NOW(3), NOW(3)),
('fc30d214-e458-466b-809f-019b4228fca5', 'home_step_4_desc',  'Herhangi bir sorun yaşarsanız destek ekibimiz size yardımcı olmaya hazır.', NOW(3), NOW(3)),
('7fcde91a-3cdd-4855-aeaf-44b450d5b21f', 'home_how_it_works_title',    'Nasıl Çalışır?', NOW(3), NOW(3)),
('7d415987-ea03-4f91-a73c-2cf3772ea870', 'home_how_it_works_subtitle', '4 basit adımda dijital ürününüze sahip olun', NOW(3), NOW(3)),
('9321c220-2de1-435a-b6c1-e5c53cb6e7d6', 'home_faq_title',       'Sıkça Sorulan Sorular', NOW(3), NOW(3)),
('c0a1e4ff-bbf4-4926-bce8-b2c8f8366499', 'home_faq_subtitle',    'Merak ettiklerinizin cevaplarını burada bulabilirsiniz', NOW(3), NOW(3)),
('4a516115-e1c1-4d69-a90e-fd576c8bfb60', 'home_faq_cta_title',   'Başka sorunuz mu var?', NOW(3), NOW(3)),
('a62aaa4c-2f23-40e9-99d1-60b41d5b5825', 'home_faq_cta_subtitle','Destek ekibimiz size yardımcı olmak için hazır', NOW(3), NOW(3)),
('8835e526-9a8e-459e-accc-90458b77c198', 'home_faq_cta_button',  'Bize Ulaşın →', NOW(3), NOW(3)),
('05641622-aa04-4005-9d11-906f54d94447', 'home_blog_badge',      'Blog Yazılarımız', NOW(3), NOW(3)),
('e3d3b0d6-a2fb-4488-a749-7d3288fa4432', 'home_blog_title',      'Güncel İçerikler', NOW(3), NOW(3)),
('8b717068-dc98-49b8-a1f5-3826c61dff12', 'home_blog_subtitle',   'Dijital ürünler, teknoloji ve güvenlik hakkında en güncel bilgiler', NOW(3), NOW(3)),
('befcdf24-a0f8-4d6d-b6a4-c8f8f1a40573', 'home_blog_button',     'Tüm Blog Yazıları', NOW(3), NOW(3)),

-- ------------------------------------------------------------------
-- FOOTER / İLETİŞİM BİLGİLERİ
-- ------------------------------------------------------------------
('31479cbe-aeb0-407a-bc65-d75e906ee8f4', 'footer_company_name',  'Dijital Markets', NOW(3), NOW(3)),
('7f3c8544-6a6a-48d4-b138-459d92563742', 'footer_address',       'Atatürk Cad. No:123\nİstanbul, Türkiye', NOW(3), NOW(3)),
('c68be08e-ac40-4141-9bd9-21c026f8654a', 'footer_email',         'destek@dijitalmarket.com', NOW(3), NOW(3)),
('fb9431b3-fa22-490d-8529-bcf7f3a57290', 'footer_phone',         '+90 555 555 55 55', NOW(3), NOW(3)),
('faf0f287-8395-4ee9-8a5e-91f2caf07f79', 'footer_description',   'Güvenilir dijital ürün satış platformu. En uygun fiyatlarla lisans, hesap, yazılım ve daha fazlası.', NOW(3), NOW(3)),
('c74ee6fd-7e93-47d2-8006-d0af348b7890', 'footer_copyright',     '© 2025 Dijital Market. Tüm hakları saklıdır.', NOW(3), NOW(3)),
('55fd06de-2343-426d-b8ce-3b0ad6fe854d', 'light_logo',           '', NOW(3), NOW(3)),
('d7cdd57c-58cc-4463-bfa6-7eb694017c53', 'dark_logo',            '', NOW(3), NOW(3)),

-- ------------------------------------------------------------------
-- SOSYAL MEDYA / HARİCİ SERVİSLER
-- ------------------------------------------------------------------
('1f9a16f9-1264-4883-a300-803608e3a9de', 'linkedin_url',   'https://lovable.dev', NOW(3), NOW(3)),
('4329c222-cafc-4692-ac06-31d39f1ec43d', 'facebook_url',   'https://lovable.devs', NOW(3), NOW(3)),
('9e90cd77-f23a-49e2-96c8-1906e5f076ab', 'twitter_url',    'https://lovable.dev', NOW(3), NOW(3)),
('e08f392a-d5fd-4b46-bfaa-5fd9a0bfafef', 'instagram_url',  'https://lovable.dev', NOW(3), NOW(3)),
('c9afa0eb-4890-40b1-8726-764b1c2bef2d', 'discord_webhook_url', '', NOW(3), NOW(3)),

-- ------------------------------------------------------------------
-- PARA BİRİMLERİ / KUR
-- ------------------------------------------------------------------
('2e0b304e-564b-476f-9d47-754a1fb756f0', 'currency_rates',
 '{ "EUR": 0.029, "TRY": 1, "USD": 0.031 }',
 NOW(3), NOW(3)),
('e7963d57-7ca1-4be5-9567-68457771eb60', 'available_currencies', '["TRY","USD","EUR"]', NOW(3), NOW(3)),
('46b44590-f31d-4174-8fca-e555612f608e', 'auto_update_rates', 'false', NOW(3), NOW(3)),

-- ------------------------------------------------------------------
-- ÖDEME SAĞLAYICILARI / KOMİSYON
-- ------------------------------------------------------------------
('88b90a74-4de2-4652-af81-bee79ff8fc19', 'paytr_enabled',          'true', NOW(3), NOW(3)),
('13a7cd2f-f1d4-4947-b023-d877ad392e69', 'paytr_merchant_id',      '{{PAYTR_MERCHANT_ID}}', NOW(3), NOW(3)),
('12dd13d2-8b53-40be-9e77-23bb58f12240', 'paytr_merchant_salt',    '{{PAYTR_MERCHANT_SALT}}', NOW(3), NOW(3)),
('94146c25-34a2-45fa-a324-324c5536529d', 'paytr_merchant_key',     '{{PAYTR_MERCHANT_KEY}}', NOW(3), NOW(3)),
('9467a590-99c1-4c14-a070-25c4da00ffd3', 'paytr_test_mode',        'true', NOW(3), NOW(3)),
('87041eeb-ebce-47fe-ab50-b2b6aab1780a', 'paytr_commission',       '25', NOW(3), NOW(3)),
('d32b6c9a-0677-4103-8f05-2eec6d8dd4e1', 'paytr_havale_commission','0', NOW(3), NOW(3)),
('da4bd864-c314-4bd7-be98-aea579fc8ed4', 'paytr_havale_enabled',   'true', NOW(3), NOW(3)),

('7e7ba2d9-d2ed-4da0-8209-fda5747b365c', 'shopier_enabled',        'true', NOW(3), NOW(3)),
('d2023d10-e221-4e1f-97e7-1b40acfa21d1', 'shopier_client_id',      '{{SHOPIER_CLIENT_ID}}', NOW(3), NOW(3)),
('b8a4c347-2861-4e20-885c-e6bc919a7fb0', 'shopier_client_secret',  '{{SHOPIER_CLIENT_SECRET}}', NOW(3), NOW(3)),
('d2192478-88c9-4598-bc15-3217fe4fb20f', 'shopier_commission',     '50', NOW(3), NOW(3)),

('1326ba2b-66db-4914-a6e5-df1dfbe283fd', 'papara_enabled', 'false', NOW(3), NOW(3)),
('ea353228-8b3a-4a50-b487-d4f09c922205', 'papara_api_key', '', NOW(3), NOW(3)),

('a8324fa7-d352-4ad1-8504-6feb77ad9d4c', 'stripe_public_key', '', NOW(3), NOW(3)),
('bc24ca21-c40d-4fd0-89f6-749683bc2b6d', 'stripe_secret_key', '', NOW(3), NOW(3)),
('ca7bdfbb-f63f-457d-8211-110f2fc00441', 'stripe_enabled',   'false', NOW(3), NOW(3)),

('0850d23e-c07f-4bb8-a2dd-eb688a2bed47', 'bank_transfer_enabled', 'false', NOW(3), NOW(3)),
('bcb92ef4-4a60-4d0c-877b-7c5139f26042', 'bank_account_info', 'QNB Finansbank A.Ş\nIBAN : TR45 5698 5995 4585 4565 45\nHesap Sahibi: xyz', NOW(3), NOW(3)),

('be8379fe-8e56-4be0-8a53-3c3f5c1533bc', 'payment_commission',
'{ "paytr_enabled": true, "paytr_havale_enabled": true, "paytr_havale_rate": "0", "paytr_rate": "5", "shopier_enabled": true, "shopier_rate": "5" }',
NOW(3), NOW(3)),

('af53a3f7-2caf-4020-8b81-3f7b9862212f', 'guest_order_enabled', 'true', NOW(3), NOW(3)),
('ab149570-5098-40e5-a6f7-69736b100c15', 'whatsapp_number',     '+905454905148', NOW(3), NOW(3)),
('9c0a3b3a-b0f5-46a1-884b-ba3e14e1771d', 'deposit_approved_telegram', 'true', NOW(3), NOW(3)),
('18da4735-0520-4a37-9fb4-bddb01807e62', 'deposit_telegram',         'true', NOW(3), NOW(3)),
('15e7fde3-5d70-4a6e-a35e-b9e437e96e59', 'new_deposit_request_telegram', 'false', NOW(3), NOW(3)),
('399a22ce-584c-4349-a6e4-e579e6993189', 'new_payment_request_telegram', 'true', NOW(3), NOW(3)),
('f90bb37f-4148-4a49-939c-da27ba3a9cdf', 'new_order_telegram',       'true', NOW(3), NOW(3)),
('7e7b0da-4d65-47fd-aa26-7897e59fa980', 'home_featured_badge',       'Öne Çıkan Ürünler', NOW(3), NOW(3)),

-- ------------------------------------------------------------------
-- TELEGRAM / BİLDİRİM / BOT
-- (mevcut satırlar + yeni default_chat_id)
-- ------------------------------------------------------------------
('4126e116-ec07-4d85-a7ea-647863cb8374', 'telegram_notifications_enabled', 'false', NOW(3), NOW(3)),
('4b8fddb8-82f3-4518-a045-301df0f50099', 'telegram_chat_id',               '7474884105', NOW(3), NOW(3)),
('b5b7c9a2-1f4a-4a11-9c44-6a4e3f9f1234', 'telegram_default_chat_id',      '7474884105', NOW(3), NOW(3)),
('e07b6795-de4a-437f-8800-d7b049918bfe', 'telegram_bot_token',             '{{TELEGRAM_BOT_TOKEN}}', NOW(3), NOW(3)),
('c3ed6a86-bda6-4795-a319-50ed8644acf2', 'telegram_template_deposit_approved',
'💰 *Bakiye Yükleme Onaylandı!*\n\n👤 Kullanıcı: {{user_name}}\n💵 Tutar: {{amount}} TL\n\n⏰ Onay Tarihi: {{created_at}}',
NOW(3), NOW(3)),
('35366fb2-e7fb-44c1-acec-a7248297d2f3', 'telegram_template_new_deposit_request',
'💰 *Yeni Bakiye Yükleme Talebi!*\n\n👤 Kullanıcı: {{user_name}}\n💵 Tutar: {{amount}} TL\n💳 Ödeme Yöntemi: {{payment_method}}\n\n⏰ Talep Tarihi: {{created_at}}',
NOW(3), NOW(3)),
('5807e24f-c274-4312-b481-072e048c2c7f', 'telegram_template_new_order',
'🛒 *Yeni Sipariş Alındı!*\n\n📋 Sipariş No: {{order_number}}\n👤 Müşteri: {{customer_name}}\n📧 Email: {{customer_email}}\n{{customer_phone}}\n\n💰 Toplam Tutar: {{final_amount}} TL\n{{discount}}\n\n📦 Ürünler:\n{{order_items}}\n\n⏰ Sipariş Tarihi: {{created_at}}',
NOW(3), NOW(3)),
('7cbfe225-76e0-4eb9-8281-8cd1b21aad9d', 'telegram_template_new_payment_request',
'💳 *Yeni Ödeme Talebi!*\n\n📋 Sipariş No: {{order_number}}\n👤 Müşteri: {{customer_name}}\n📧 Email: {{customer_email}}\n{{customer_phone}}\n\n💰 Tutar: {{amount}} TL\n💳 Ödeme Yöntemi: {{payment_method}}\n\n📦 Ürünler:\n{{order_items}}\n\n⏰ Talep Tarihi: {{created_at}}',
NOW(3), NOW(3)),
('6d3e8f93-b0af-4d3e-bea2-bff8a010a6b3', 'telegram_template_new_ticket',
'🎫 *Yeni Destek Talebi Açıldı!*\n\n👤 Kullanıcı: {{user_name}}\n📋 Konu: {{subject}}\n📊 Öncelik: {{priority}}\n{{category}}\n\n💬 Mesaj:\n{{message}}\n\n⏰ Talep Tarihi: {{created_at}}',
NOW(3), NOW(3));

-- ------------------------------------------------------------------
-- GOOGLE OAUTH / reCAPTCHA
-- ------------------------------------------------------------------
('11111111-2222-3333-4444-555555555555', 'google_client_id',    '4400...apps.googleusercontent.com', NOW(3), NOW(3)),
('22222222-3333-4444-5555-666666666666', 'google_client_secret','GOCSPX-xxx', NOW(3), NOW(3))

-- ------------------------------------------------------------------
-- CLOUDINARY / DOSYA YÜKLEME
-- ------------------------------------------------------------------
('aaaacccc-dddd-eeee-ffff-000000000001', 'cloudinary_cloud_name',       'my-cloud-name', NOW(3), NOW(3)),
('aaaacccc-dddd-eeee-ffff-000000000002', 'cloudinary_api_key',          'xxxxxx', NOW(3), NOW(3)),
('aaaacccc-dddd-eeee-ffff-000000000003', 'cloudinary_api_secret',       'yyyyyy', NOW(3), NOW(3)),
('aaaacccc-dddd-eeee-ffff-000000000004', 'cloudinary_folder',           'products', NOW(3), NOW(3)),
('aaaacccc-dddd-eeee-ffff-000000000005', 'cloudinary_unsigned_preset',  'unsigned-upload', NOW(3), NOW(3))



-- ------------------------------------------------------------------
-- SİSTEM / BAKIM / NOTIFICATIONS
-- ------------------------------------------------------------------
('3922f119-262d-4e86-bab6-24a5506e3ffa', 'fake_notifications_enabled',  'false', NOW(3), NOW(3)),
('74d242b4-4e95-4d34-b161-10992f34a0c5', 'notification_delay',          '10', NOW(3), NOW(3)),
('893ef6b1-a216-4a17-9c4d-04f3ffadacaa', 'notification_interval',       '30', NOW(3), NOW(3)),
('96e8d247-2b2e-445e-934b-37c863b374d4', 'notification_display_duration','5', NOW(3), NOW(3)),
('574409c9-8a46-4917-a3a9-74cfe01398a0', 'maintenance_mode',            'false', NOW(3), NOW(3)),
('4784bd38-755a-455f-8c04-5ddd039eb76e', 'maintenance_message',         'qwe', NOW(3), NOW(3)),
('d923a87e-29e9-441e-9cbb-235aa2821863', 'min_balance_limit',           '10', NOW(3), NOW(3)),

-- ------------------------------------------------------------------
-- EK: İLK SEED’DE OLMAYANLAR (ESKİ DUMPTAN ALINANLAR)
-- ------------------------------------------------------------------
('07d5dc6d-329c-4ffc-b201-4ca5c7b42a64', 'new_ticket_telegram', '\"true\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('268e7369-f6cd-41b6-8106-2a61b55191cc', 'facebook_pixel_id', '\"\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('bde09951-f709-4526-b32a-fa0a25456519', 'home_faq_items', '\"[{\\\"answer\\\":\\\"Ödemeniz onaylandıktan sonra ürününüz otomatik olarak anında e-posta adresinize ve üye panelinize teslim edilir. Ortalama teslimat süresi 1-2 dakikadır.s4\\\",\\\"question\\\":\\\"Ürünler ne kadar sürede teslim edilir?s4\\\"},{\\\"answer\\\":\\\"Kredi kartı, banka havalesi, Papara, PayTR, Shopier ve kripto para (Coinbase Commerce) ile ödeme yapabilirsiniz. Tüm ödemeler SSL sertifikası ile güvence altındadır.s4\\\",\\\"question\\\":\\\"Hangi ödeme yöntemlerini kabul ediyorsunuz?sa4\\\"},{\\\"answer\\\":\\\"Satın aldığınız ürün çalışmaz veya hatalı ise 7 gün içinde destek ekibimizle iletişime geçerek değişim veya iade talebinde bulunabilirsiniz. Tüm ürünlerimiz garanti kapsamındadır.s4\\\",\\\"question\\\":\\\"Ürün çalışmazsa ne olur?s4\\\"},{\\\"answer\\\":\\\"Evet! 5+ ürün alımlarında %5, 10+ ürün alımlarında %10 indirim otomatik olarak uygulanır. Daha fazla bilgi için müşteri hizmetlerimizle iletişime geçebilirsiniz.s4\\\",\\\"question\\\":\\\"Toplu alımlarda indirim var mı?s4\\\"},{\\\"answer\\\":\\\"Her ürünün kullanım koşulları farklıdır. Ürün detay sayfasında lisans türü ve kaç cihazda kullanılabileceği belirtilmiştir. Tek kullanımlık, çoklu kullanım ve süreli lisanslar mevcuttur.s4\\\",\\\"question\\\":\\\"Lisanslar kaç cihazda kullanılabilir?sa4\\\"},{\\\"answer\\\":\\\"7/24 canlı destek, e-posta, WhatsApp ve Telegram üzerinden bizimle iletişime geçebilirsiniz. Üye panelinizden destek talebi oluşturabilir veya SSS bölümünü inceleyebilirsiniz.s4\\\",\\\"question\\\":\\\"Müşteri desteği nasıl alırım?sa4\\\"}]\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38');

