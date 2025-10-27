
-- =========================================================
--  SEED (ebeveyn -> çocuk sırası gözetildi)
-- =========================================================
INSERT IGNORE INTO categories
(id, name, slug, description, image_url, icon, parent_id, is_active, is_featured, display_order, created_at, updated_at)
VALUES
('12b202f2-144e-44f6-b2d8-04dac0ad900b','Steam Ürünleri','steam','Popüler Steam oyunları ve içerikleri',NULL,NULL,NULL,1,0,0,'2025-10-06 17:17:39.000','2025-10-19 14:50:52.000'),
('2f5f92ed-ed22-44e7-a92a-337e8956ce42','Adobe','adobe','Adobe ürünleri','https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760107494789.png',NULL,NULL,1,0,0,'2025-10-10 14:45:00.000','2025-10-19 14:50:52.000'),
('37993932-f635-4ec4-864a-912ebb093b86','Tasarım Araçları','design','Adobe, Canva ve grafik programları',NULL,NULL,NULL,1,0,0,'2025-10-06 17:17:39.000','2025-10-19 14:50:52.000'),
('5e300196-8b4e-44d9-9020-d1fccccbe249','Instagram Takipçi','instagram-takipci-satin-al','Instagram takipçi satın al',NULL,NULL,NULL,1,0,2,'2025-10-07 12:51:44.000','2025-10-19 14:50:52.000'),
('6675e932-657a-47cc-bf91-f2bfaba28ef3','Mail Hesapları','mail-hesaplari','Mail Hesapları','https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760083082362.png',NULL,NULL,1,0,3,'2025-10-10 07:58:15.000','2025-10-19 14:50:52.000'),
('8cef7f1f-e31a-4007-ade3-fb513368f210','Sosyal Medya','sosyal-medya','Sosyal Medya Hizmetleri','https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760107566358.jpg',NULL,NULL,1,0,0,'2025-10-10 14:46:09.000','2025-10-19 14:50:52.000'),
-- EBEVEYN ÖNCE: PUBG
('cb82fb5b-abb4-4a08-b4da-2511b0a7e161','PUBG','pubg','PUBG Kategori',NULL,NULL,NULL,1,0,0,'2025-10-07 08:19:21.000','2025-10-19 14:50:52.000'),
-- ÇOCUK: UC (parent_id = PUBG)
('ad366810-9c8c-4b3e-b493-d6b3fce09875','UC','pubg-uc','PUBG UC Satışı','https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1759874086774.webp',NULL,'cb82fb5b-abb4-4a08-b4da-2511b0a7e161',1,0,0,'2025-10-07 08:19:35.000','2025-10-19 14:50:52.000'),
('ce780bbd-38e7-469e-a18a-9e51998e04d6','Office','office','Office programı lisans ürünleri.','https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760107287951.webp',NULL,NULL,1,0,10,'2025-10-10 14:41:33.000','2025-10-19 14:50:52.000'),
('d960ecae-8fcd-4084-bdfb-369464bd87b4','Windows','windows','Windows lisans ürünleri.','https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760107242369.png',NULL,NULL,1,0,11,'2025-10-10 14:40:54.000','2025-10-19 14:50:52.000'),
('d9a27929-1471-427d-9d28-418e6fc340e3','Geliştirici Araçları','development','IDE, hosting ve geliştirme araçları','https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&h=600&fit=crop',NULL,NULL,1,0,1,'2025-10-06 17:17:39.000','2025-10-19 14:50:52.000'),
('eb9c13a1-386a-45f7-b41a-969219dc28a5','Yazılımlar','software','İşletim sistemleri ve ofis programları',NULL,NULL,NULL,1,0,5,'2025-10-06 17:17:39.000','2025-10-19 14:50:52.000'),
('f6b5f01c-a7b9-48ee-bbdb-9b44b4bf8398','Yapay Zeka','yapay-zeka','Yapay zeka ürünleri.','https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760110233740.jpg',NULL,NULL,1,0,12,'2025-10-10 15:30:56.000','2025-10-19 14:50:52.000'),
('f810f0b8-3adc-4cfd-8c5e-02813094a9a8','SEO','seo','SEO araçları program lisansları','https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760107448033.png',NULL,NULL,1,0,0,'2025-10-10 14:44:13.000','2025-10-19 14:50:52.000');
