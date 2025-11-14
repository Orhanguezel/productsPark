-- 87_payment_requests_seed.sql
-- Örnek/fixture veriler. `currency` kolonu şema default'u ile TRY olur.

INSERT IGNORE INTO `payment_requests`
(`id`, `order_id`, `amount`, `payment_method`, `payment_proof`, `status`, `admin_notes`, `processed_at`, `created_at`, `updated_at`) VALUES
('01b3f365-df23-4d98-a8f4-5d83fcc1913e','63a6597a-565f-43b9-b977-a32ec2330ee4',2679.99,'havale',NULL,'approved',NULL,NULL,'2025-10-14 09:51:42','2025-10-14 09:51:52'),
('0487104c-e2f5-4cd7-935b-88d467671d01','ee29724c-4d7b-42be-8f3d-f167a2bfa784',50.00,'havale',NULL,'approved',NULL,NULL,'2025-10-15 09:41:34','2025-10-15 09:42:06'),
('094e7e8c-3385-4f21-bc9f-ef88428062f5','483378b3-2edf-4bda-963c-7084a4f3e71b',10.00,'havale',NULL,'approved',NULL,NULL,'2025-10-08 09:48:12','2025-10-08 09:48:27'),
('0b151322-0c93-459c-aef0-c538400ab1cc','62ac220d-5ce8-4d75-8440-8563911ff04f',150.00,'havale',NULL,'approved',NULL,NULL,'2025-10-13 16:28:19','2025-10-13 16:28:37'),
('0d0fbbb9-f8e5-48d0-b762-85302f5c8f81','39667fd7-fdba-4192-a551-d837c6e43f1d',179.99,'havale',NULL,'approved',NULL,NULL,'2025-10-16 08:24:27','2025-10-16 08:24:49'),
('1039f12d-5cd1-41f4-ba8c-a017c2c4db86','ad4878e3-fd0d-4fa0-bcce-9da3c1932066',10.00,'havale',NULL,'approved',NULL,NULL,'2025-10-08 09:11:59','2025-10-08 09:13:06'),
('1fc1d655-b9f7-4fd4-a8dd-c79c47c42aaf','153aa32e-4133-4c53-8696-75689fc6225f',2500.00,'havale',NULL,'approved',NULL,NULL,'2025-10-13 21:15:25','2025-10-13 21:15:48'),
('225ac86e-f77d-45ad-a44f-d184ab8e3195','aa736c50-8945-408a-b542-28f49df77c1f',179.99,'havale',NULL,'approved',NULL,NULL,'2025-10-13 16:40:32','2025-10-13 16:40:47'),
('22acbd6e-3721-47fc-8a66-5445304cd959','1555b659-dc36-4638-9e6d-0e2c376932b5',50.00,'havale',NULL,'pending',NULL,NULL,'2025-10-15 08:22:14','2025-10-15 08:22:14');