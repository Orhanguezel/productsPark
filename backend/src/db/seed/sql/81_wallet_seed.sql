-- wallet_deposit_requests (örnek; tüm satırlarını bu kalıpla çoğaltabilirsin)
INSERT INTO `wallet_deposit_requests`
(`id`,`user_id`,`amount`,`payment_method`,`payment_proof`,`status`,`admin_notes`,`processed_at`,`created_at`,`updated_at`)
VALUES
('15cafe4b-4551-4041-98c3-fd2fdcb5bc1b','0ac37a5c-a8be-4d25-b853-1e5c9574c1b3',5000.00,'havale',NULL,'approved',NULL,NULL,'2025-10-07 09:49:16','2025-10-07 09:49:23'),
('1d2f9d83-6425-49a0-a859-5617bb2aa8c3','4a8fb7f7-0668-4429-9309-fe88ac90eed2',500.00,'havale',NULL,'pending',NULL,NULL,'2025-10-13 20:19:47','2025-10-13 20:19:47'),
('3051f1e8-174d-4753-92fd-e22387f76a3f','4a8fb7f7-0668-4429-9309-fe88ac90eed2',100.00,'havale',NULL,'pending',NULL,NULL,'2025-10-13 20:17:13','2025-10-13 20:17:13')
ON DUPLICATE KEY UPDATE
 `user_id`=VALUES(`user_id`),
 `amount`=VALUES(`amount`),
 `payment_method`=VALUES(`payment_method`),
 `payment_proof`=VALUES(`payment_proof`),
 `status`=VALUES(`status`),
 `admin_notes`=VALUES(`admin_notes`),
 `processed_at`=VALUES(`processed_at`),
 `created_at`=VALUES(`created_at`),
 `updated_at`=VALUES(`updated_at`);

-- wallet_transactions (örnek)
INSERT INTO `wallet_transactions`
(`id`,`user_id`,`amount`,`type`,`description`,`order_id`,`created_at`)
VALUES
('0a0b3fd3-e78d-413e-bd7a-7645dceba60c','19a2bc26-63d1-43ad-ab56-d7f3c3719a34',10000.00,'deposit','Admin tarafından eklendi',NULL,'2025-10-13 15:53:40'),
('93ddd47b-bdcd-46f5-83cb-0af15dc4a60f','0ac37a5c-a8be-4d25-b853-1e5c9574c1b3',5000.00,'deposit','Bakiye yükleme onaylandı - havale',NULL,'2025-10-07 09:49:23')
ON DUPLICATE KEY UPDATE
 `user_id`=VALUES(`user_id`),
 `amount`=VALUES(`amount`),
 `type`=VALUES(`type`),
 `description`=VALUES(`description`),
 `order_id`=VALUES(`order_id`),
 `created_at`=VALUES(`created_at`);
