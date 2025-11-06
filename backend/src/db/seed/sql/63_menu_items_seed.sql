-- 63_menu_items_seed.sql
-- Seed for menu_items (header + footer with section mapping). All root-level (parent_id = NULL).

INSERT INTO `menu_items`
(`id`, `label`, `url`, `parent_id`, `location`, `section_id`, `type`, `page_id`, `icon`, `order_num`, `is_active`)
VALUES
-- ================= HEADER =================
('fe8120b3-919a-49b8-8035-df6fd2a2433f', 'Anasayfa',               '/',                      NULL, 'header', NULL, 'custom', NULL, NULL,  0, 1),
('f2570596-db46-4028-902c-d6fe2c9a8312', 'Ürünler',                '/urunler',               NULL, 'header', NULL, 'custom', NULL, NULL,  1, 1),
('c47a1c3f-cea1-4780-9381-77336bc8ac59', 'Kategoriler',            '/kategoriler',           NULL, 'header', NULL, 'custom', NULL, NULL,  2, 1),
('25740da6-c0f2-4c1d-b131-998018699bfd', 'Hakkımızda',             '/hakkimizda',            NULL, 'header', NULL, 'custom', NULL, NULL,  3, 1),
('ceed431a-aafb-4aba-bf1f-6217b3960c01', 'Blog',                   '/blog',                  NULL, 'header', NULL, 'custom', NULL, NULL,  4, 1),
('455c6ddf-658b-4c0f-8a9e-0b104708dd07', 'İletişim',               '/iletisim',              NULL, 'header', NULL, 'custom', NULL, NULL,  5, 1),

-- ================= FOOTER: Hızlı Erişim =================
('6a4f6b37-ed99-4d98-8c54-d658096aacde', 'SSS',                    '/sss',
  NULL, 'footer', '59583ef1-0ba1-4c7c-b806-84fd204b52b9', 'custom', NULL, NULL,  0, 1),

('2e32b68d-ae71-4d44-8770-95b8dfb03c36', 'Kampanyalar',            '/kampanyalar',
  NULL, 'footer', '59583ef1-0ba1-4c7c-b806-84fd204b52b9', 'custom', NULL, NULL,  1, 1),

('f1573cc3-5392-448b-89eb-d0e02e947c6d', 'Nasıl Sipariş Verilir?', '/nasil-siparis-verilir',
  NULL, 'footer', '59583ef1-0ba1-4c7c-b806-84fd204b52b9', 'custom', NULL, NULL,  2, 1),

-- ================= FOOTER: Kurumsal =================
('71c28444-7b6e-47ae-92be-f59206a1b820', 'Gizlilik Politikası',    '/gizlilik-politikasi',
  NULL, 'footer', 'f942a930-6743-4ecc-b4b3-1fd6b77f9d77', 'custom', NULL, NULL,  3, 1),

('3d325c92-d59e-4730-8301-5c9bcff463bc', 'KVKK',                   '/kvkk',
  NULL, 'footer', 'f942a930-6743-4ecc-b4b3-1fd6b77f9d77', 'custom', NULL, NULL,  4, 1),

('9fa999a9-9e47-4a3c-9dac-6afba197d79c', 'İade ve Değişim',        '/iade-degisim',
  NULL, 'footer', 'f942a930-6743-4ecc-b4b3-1fd6b77f9d77', 'custom', NULL, NULL,  5, 1),

('d8ec7f51-384f-400a-9ac6-3a179cb89087', 'Ödeme Yöntemleri',       '/odeme-yontemleri',
  NULL, 'footer', 'f942a930-6743-4ecc-b4b3-1fd6b77f9d77', 'custom', NULL, NULL,  6, 1),

('24c49639-01d0-4274-8fb9-c31ed64d0726', 'Kullanım Koşulları',     '/kullanim-kosullari',
  NULL, 'footer', 'f942a930-6743-4ecc-b4b3-1fd6b77f9d77', 'custom', NULL, NULL,  7, 1)
ON DUPLICATE KEY UPDATE
  `label`      = VALUES(`label`),
  `url`        = VALUES(`url`),
  `parent_id`  = VALUES(`parent_id`),
  `location`   = VALUES(`location`),
  `section_id` = VALUES(`section_id`),
  `type`       = VALUES(`type`),
  `page_id`    = VALUES(`page_id`),
  `icon`       = VALUES(`icon`),
  `order_num`  = VALUES(`order_num`),
  `is_active`  = VALUES(`is_active`),
  `updated_at` = CURRENT_TIMESTAMP(3);
