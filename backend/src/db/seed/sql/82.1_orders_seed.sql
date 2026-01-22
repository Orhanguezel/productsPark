

-- ===================== ORDERS (SEED) =====================
INSERT IGNORE INTO `orders`
(`id`,`order_number`,`user_id`,`status`,`payment_method`,`payment_status`,
 `subtotal`,`discount`,`coupon_discount`,`total`,`coupon_code`,`notes`,
 `ip_address`,`user_agent`,`payment_provider`,`payment_id`,`created_at`,`updated_at`)
VALUES
('0aa3d50f-bb5a-40a7-b5ab-e873d8cb4876','ORD1760601727849','', 'pending','bank_transfer','paid',50.00,0.00,0.00,50.00,NULL,NULL,NULL,NULL,NULL,NULL,'2025-10-16 08:02:10.000','2025-10-16 08:50:04.000');
