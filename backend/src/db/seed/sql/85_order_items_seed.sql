INSERT IGNORE INTO `order_items`
(`id`,`order_id`,`product_id`,`product_name`,`quantity`,`price`,`total`,`options`,`delivery_status`,`activation_code`,`stock_code`,`api_order_id`,`delivered_at`,`created_at`,`updated_at`) VALUES
('00523658-2cc7-4355-8dca-5f053ca7c26f','7a5df02c-0838-404a-8066-5362b7f3c429','0132e42e-d46a-444d-9080-a419aec29c9c','500 Takipçi',1,0.00,50.00,NULL,'delivered',NULL,NULL,NULL,NULL,'2025-10-14 09:57:59','2025-10-19 14:50:55'),
('02a1d4a7-3878-485b-b5f7-277f08a3ac92','401fc239-3971-4e1f-9f22-6ba73beb8e09','0132e42e-d46a-444d-9080-a419aec29c9c','500 Takipçi',1,0.00,50.00,NULL,'failed',NULL,NULL,NULL,NULL,'2025-10-15 10:01:56','2025-10-19 14:50:55'),
('046c4db8-f088-449f-b9ad-afd96ffbec24','84f2a5e4-d948-4823-a6fb-1be3695979e8','408ef745-5456-4115-ad79-3a26034edc37','100 Takipçi',1,0.00,10.00,NULL,'pending',NULL,NULL,NULL,NULL,'2025-10-08 10:15:37','2025-10-19 14:50:55'),
('093b2ae6-05cc-43b3-8036-8e86a7a642a2','ad35503e-6029-476d-8e4d-8a80b6c329ed','a76e27ef-e486-4cf8-b765-e12e51d52768','Adobe Photoshop Lisans Key',1,0.00,179.99,NULL,'delivered','X1C2V-B3N4M-L5K6J-H7G8F-D9S0A',NULL,NULL,NULL,'2025-10-14 09:47:25','2025-10-19 14:50:55'),
('0951ba55-d923-4313-8107-bd5e72b0a94c','e8fbbd95-d1c9-4192-af0f-b088d8c0e4e4','408ef745-5456-4115-ad79-3a26034edc37','100 Takipçi',1,0.00,10.00,NULL,'pending',NULL,NULL,NULL,NULL,'2025-10-09 08:38:57','2025-10-19 14:50:55')
-- ... buradan itibaren kalan TÜM satırları elinizdeki `order_items` dump’ından aynen devam ettirin; 
-- SON TAM satır “('b7f02d1f-...')” ile bitiyor. “('bc20c3e7-...')” satırı eksik olduğu için seed’e eklemeyin.
;
