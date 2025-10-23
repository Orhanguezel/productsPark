-- 63_menu_items_seed.sql
INSERT IGNORE INTO `menu_items`
(`id`, `label`, `url`, `parent_id`, `order_num`, `is_active`, `created_at`, `updated_at`) VALUES
('24c49639-01d0-4274-8fb9-c31ed64d0726', 'Kullanım Koşulları', '/kullanim-kosullari', NULL, 11, 1, '2025-10-06 22:41:23', '2025-10-15 20:13:24'),
('25740da6-c0f2-4c1d-b131-998018699bfd', 'Hakkımızda', '/hakkimizda', NULL, 1, 1, '2025-10-06 22:41:23', '2025-10-15 20:13:23'),
('2e32b68d-ae71-4d44-8770-95b8dfb03c36', 'Kampanyalar', '/kampanyalar', NULL, 3, 1, '2025-10-06 22:41:23', '2025-10-15 20:13:23'),
('3d325c92-d59e-4730-8301-5c9bcff463bc', 'KVKK', '/kvkk', NULL, 6, 1, '2025-10-06 22:41:23', '2025-10-15 20:13:23'),
('455c6ddf-658b-4c0f-8a9e-0b104708dd07', 'İletişim', '/iletisim', NULL, 4, 1, '2025-10-06 22:41:23', '2025-10-15 20:02:06'),
('5f4e71bd-4bcd-4e85-9065-243cdf2dc2d1', 'Blog', '/blog', NULL, 3, 1, '2025-10-06 22:41:23', '2025-10-15 20:02:06'),
('6230f5b8-858f-4809-bebc-37c35d51e08f', 'İletişim', '/iletisim', NULL, 7, 1, '2025-10-06 22:41:23', '2025-10-15 20:13:24'),
('6a4f6b37-ed99-4d98-8c54-d658096aacde', 'SSS', '/sss', NULL, 2, 1, '2025-10-06 22:41:23', '2025-10-15 20:13:23'),
('71c28444-7b6e-47ae-92be-f59206a1b820', 'Gizlilik Politikası', '/gizlilik-politikasi', NULL, 5, 1, '2025-10-06 22:41:23', '2025-10-15 20:13:23'),
('9fa999a9-9e47-4a3c-9dac-6afba197d79c', 'İade ve Değişim', '/iade-degisim', NULL, 4, 1, '2025-10-06 22:41:23', '2025-10-15 20:13:24'),
('9fe03852-2246-4368-9966-5fd0146f3dad', 'Kategoriler', '/kategoriler', NULL, 1, 1, '2025-10-06 22:41:23', '2025-10-15 20:02:06'),
('c47a1c3f-cea1-4780-9381-77336bc8ac59', 'Kategoriler', '/kategoriler', NULL, 8, 1, '2025-10-06 22:41:23', '2025-10-15 20:13:23'),
('ceed431a-aafb-4aba-bf1f-6217b3960c01', 'Blog', '/blog', NULL, 0, 1, '2025-10-06 22:41:23', '2025-10-15 20:13:23'),
('d8ec7f51-384f-400a-9ac6-3a179cb89087', 'Ödeme Yöntemleri', '/odeme-yontemleri', NULL, 10, 1, '2025-10-06 22:41:23', '2025-10-15 20:13:24'),
('f1573cc3-5392-448b-89eb-d0e02e947c6d', 'Nasıl Sipariş Verilir?', '/nasil-siparis-verilir', NULL, 9, 1, '2025-10-06 22:41:23', '2025-10-15 20:13:24'),
('f2570596-db46-4028-902c-d6fe2c9a8312', 'Ürünler', '/urunler', NULL, 2, 1, '2025-10-06 22:41:23', '2025-10-15 20:02:06'),
('fe8120b3-919a-49b8-8035-df6fd2a2433f', 'Anasayfa', '/', NULL, 0, 1, '2025-10-06 22:41:23', '2025-10-15 20:02:06');
