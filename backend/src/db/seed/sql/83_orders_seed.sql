-- ORDERS (SEED)
INSERT IGNORE INTO `orders`
(`id`,`order_number`,`user_id`,`status`,`payment_method`,`payment_status`,`subtotal`,`discount`,`coupon_discount`,`total`,`coupon_code`,`notes`,`ip_address`,`user_agent`,`payment_provider`,`payment_id`,`created_at`,`updated_at`) VALUES
('042190a4-41d0-4cf4-93a3-a5a171ea8903','ORD1760390895507','7129bc31-88dc-42da-ab80-415a21f2ea9a','pending','paytr','failed',49.99,0.00,0.00,62.49,NULL,'PayTR ödeme başarısız. Hata kodu: 6, Mesaj: Müşteri ödeme yapmaktan vazgeçti ve ödeme sayfasından ayrıldı.',NULL,NULL,NULL,NULL,'2025-10-13 21:28:27.000','2025-10-13 22:00:11.000'),
('07b99086-c1f1-493a-991c-ec71d00e425a','DEP1760301650094','7129bc31-88dc-42da-ab80-415a21f2ea9a','pending','paytr','pending',10.00,0.00,0.00,10.00,NULL,'Bakiye yükleme',NULL,NULL,NULL,NULL,'2025-10-12 20:41:00.000','2025-10-12 20:41:00.000'),
('0808058f-d5f1-460c-a478-84552d08e0ae','ORD1760371269176','19a2bc26-63d1-43ad-ab56-d7f3c3719a34','pending','wallet','paid',179.99,0.00,0.00,179.99,NULL,NULL,NULL,NULL,NULL,NULL,'2025-10-13 16:01:19.000','2025-10-13 16:09:04.000'),
('08a0a582-dd8d-4ff0-8ca8-124976c71ed8','ORD-1759831194956','0ac37a5c-a8be-4d25-b853-1e5c9574c1b3','pending','wallet','paid',100.00,0.00,0.00,100.00,NULL,NULL,NULL,NULL,NULL,NULL,'2025-10-07 09:59:56.000','2025-10-07 09:59:56.000'),
('0aa3d50f-bb5a-40a7-b5ab-e873d8cb4876','ORD1760601727849','', 'pending','bank_transfer','paid',50.00,0.00,0.00,50.00,NULL,NULL,NULL,NULL,NULL,NULL,'2025-10-16 08:02:10.000','2025-10-16 08:50:04.000');
