-- 79_support_seed.sql
-- Seed (idempotent). Boş/uygunsuz enum değerleri normalize etmek için staging kullanır.

START TRANSACTION;

-- 1) Staging tablo (ENUM yok) — InnoDB kullanıyoruz (TEXT/LONGTEXT destekler)
CREATE TEMPORARY TABLE tmp_support_tickets (
  `id` CHAR(36) NOT NULL,
  `user_id` CHAR(36) NOT NULL,
  `subject` VARCHAR(255) NOT NULL,
  `message` LONGTEXT NOT NULL,
  `status` VARCHAR(32) NULL,
  `priority` VARCHAR(32) NULL,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;

-- 2) Dump aynen (boş status/priority dahil)
INSERT INTO `tmp_support_tickets`
(`id`,`user_id`,`subject`,`message`,`status`,`priority`,`created_at`,`updated_at`) VALUES
('10c9b25a-91ef-4711-84a9-af7118d61d15','19a2bc26-63d1-43ad-ab56-d7f3c3719a34','hhh','hhghfh','open','high','2025-10-13 15:41:10','2025-10-13 15:41:10'),
('1b483b05-a8e0-48bd-8233-792863d26973','19a2bc26-63d1-43ad-ab56-d7f3c3719a34','jhkhjk','kkk4545','', 'medium','2025-10-13 15:49:56','2025-10-13 17:00:18'),
('22c8d700-a5b8-4395-b1ce-1aba42495add','19a2bc26-63d1-43ad-ab56-d7f3c3719a34','vay','asdfsf','open','urgent','2025-10-13 15:33:19','2025-10-13 15:33:19'),
('3cefc270-a8a9-43bc-82c1-996f6b0c1526','7129bc31-88dc-42da-ab80-415a21f2ea9a','sdfsdf','sdfsdfsdfsdf','open','high','2025-10-13 17:02:22','2025-10-13 17:02:22'),
('48beb30b-bbd2-44e9-a595-048f2632af20','7129bc31-88dc-42da-ab80-415a21f2ea9a','Yahahhahasdasd','sdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdf','open','high','2025-10-13 15:45:08','2025-10-13 15:45:08'),
('534148b8-7462-422e-93d7-430cc2fdf6a1','19a2bc26-63d1-43ad-ab56-d7f3c3719a34','zıortapoz','necmi naber','open','medium','2025-10-13 15:39:01','2025-10-13 15:39:01'),
('8040c380-9855-4a97-8581-b64f7b32936c','4a8fb7f7-0668-4429-9309-fe88ac90eed2','Sipariş','Ne zaman gelicek','open','medium','2025-10-13 20:23:48','2025-10-13 20:23:48'),
('8e741f22-84fd-4186-a626-f7e6ac4e7680','19a2bc26-63d1-43ad-ab56-d7f3c3719a34','hqqqqqqqqq','213123123','open','medium','2025-10-13 15:43:58','2025-10-13 15:43:58'),
('8f83c5b7-5cbb-4d7e-8262-2b89c5415e6d','7129bc31-88dc-42da-ab80-415a21f2ea9a','jklj','jlkjkljkl','closed','medium','2025-10-13 17:02:39','2025-10-15 14:23:24'),
('951808b7-632b-4f6f-b2ff-a55f06ad19f9','19a2bc26-63d1-43ad-ab56-d7f3c3719a34','fgfgfg','fgfgf','open','high','2025-10-13 15:17:40','2025-10-13 15:17:40'),
('952f0b54-c62e-4284-96fd-f3c968339cff','7129bc31-88dc-42da-ab80-415a21f2ea9a','67','6666','open','medium','2025-10-13 15:44:36','2025-10-13 15:44:36'),
('96fe7c2e-36df-4d38-933b-ad6df54a47eb','19a2bc26-63d1-43ad-ab56-d7f3c3719a34','jjjjjjj','eeeeeeeeeeee','open','low','2025-10-13 15:42:39','2025-10-13 15:42:39'),
('a2f05a24-ac0b-4b59-a322-9864cc5e5364','0ac37a5c-a8be-4d25-b853-1e5c9574c1b3','Sipariş Hk','qweqweqweqwe','closed','high','2025-10-13 12:55:00','2025-10-13 12:55:48'),
('a894ffcf-28cb-4609-9021-b381e559a5f2','19a2bc26-63d1-43ad-ab56-d7f3c3719a34','ghghg','fghfghfgh','open','low','2025-10-13 15:37:19','2025-10-13 15:37:19'),
('abebedb2-eefb-4d8f-a3bc-bb7e5b96a8aa','19a2bc26-63d1-43ad-ab56-d7f3c3719a34','sordum','çiçeğe','open','medium','2025-10-13 15:31:05','2025-10-13 15:31:05'),
('c742d0ad-3f07-466b-ac1e-2cf34b84941a','7129bc31-88dc-42da-ab80-415a21f2ea9a','Zaza','Zaza zaza','open','high','2025-10-15 14:43:45','2025-10-15 14:43:45'),
('ded743a6-7618-430c-bffb-e4db49dc6247','4a8fb7f7-0668-4429-9309-fe88ac90eed2','Rast Gelsin İşin','qweqwewqe','', 'medium','2025-10-15 14:54:04','2025-10-15 14:54:40'),
('df786c2d-5668-4688-88ad-952a3eebc812','19a2bc26-63d1-43ad-ab56-d7f3c3719a34','eee','sdfsd','open','high','2025-10-13 15:25:49','2025-10-13 15:25:49'),
('dff55daa-ff67-401e-ba81-9513e2fbb164','7129bc31-88dc-42da-ab80-415a21f2ea9a','df','dfdsfsdf','closed','medium','2025-10-06 22:28:30','2025-10-13 12:55:58'),
('e1b24422-8042-4897-a2e5-ff8dfb20ba3b','7129bc31-88dc-42da-ab80-415a21f2ea9a','sdfsdf','sdfsdfsdf','open','high','2025-10-13 17:02:29','2025-10-13 17:02:29'),
('eb07b91d-d727-40a0-9dcd-55321578d0ab','d279bb9d-797d-4972-a8bd-a77a40caba91','Zübüşmatik','Petmatik','open','medium','2025-10-14 08:08:53','2025-10-14 08:08:53'),
('ebea761f-8dbe-42ff-9805-2a8c552d9388','7129bc31-88dc-42da-ab80-415a21f2ea9a','qweqweqwe','asdasdsa','open','urgent','2025-10-13 17:02:16','2025-10-13 17:02:16'),
('f20fa9f8-5d93-463a-bf7b-60449fa5dfa4','7129bc31-88dc-42da-ab80-415a21f2ea9a','Rast','RASt','', 'medium','2025-10-15 14:50:50','2025-10-15 14:55:56');

-- 3) Normalize + idempotent upsert
INSERT INTO `support_tickets`
(`id`,`user_id`,`subject`,`message`,`status`,`priority`,`created_at`,`updated_at`)
SELECT
  t.id,
  t.user_id,
  t.subject,
  t.message,
  CASE
    WHEN t.status IN ('open','in_progress','waiting_response','closed') THEN t.status
    ELSE 'open'
  END AS status,
  CASE
    WHEN t.priority IN ('low','medium','high','urgent') THEN t.priority
    ELSE 'medium'
  END AS priority,
  t.created_at,
  t.updated_at
FROM `tmp_support_tickets` t
ON DUPLICATE KEY UPDATE
  `user_id`    = VALUES(`user_id`),
  `subject`    = VALUES(`subject`),
  `message`    = VALUES(`message`),
  `status`     = VALUES(`status`),
  `priority`   = VALUES(`priority`),
  `updated_at` = VALUES(`updated_at`);

DROP TEMPORARY TABLE IF EXISTS tmp_support_tickets;

-- Replies (idempotent)
INSERT INTO `ticket_replies`
(`id`,`ticket_id`,`user_id`,`message`,`is_admin`,`created_at`) VALUES
('002c708b-40e6-4ed2-ba57-baf9820d288a','22c8d700-a5b8-4395-b1ce-1aba42495add','7129bc31-88dc-42da-ab80-415a21f2ea9a','rtertertert',1,'2025-10-13 15:35:26'),
('11edb28f-f448-470f-bbf8-f41ed95d1299','abebedb2-eefb-4d8f-a3bc-bb7e5b96a8aa','7129bc31-88dc-42da-ab80-415a21f2ea9a','annen baban varmıdır',1,'2025-10-13 15:31:17'),
('1a24fbf0-7ead-4658-91b9-501ed2af8f3e','ded743a6-7618-430c-bffb-e4db49dc6247','7129bc31-88dc-42da-ab80-415a21f2ea9a','qwe',1,'2025-10-15 14:54:40'),
('2415fa5f-bb16-4579-b4a4-a9f81d1b3f96','951808b7-632b-4f6f-b2ff-a55f06ad19f9','7129bc31-88dc-42da-ab80-415a21f2ea9a','sdfsdfsdf',1,'2025-10-13 15:18:52'),
('50ba596c-a42d-4d93-a200-511746c13aad','f20fa9f8-5d93-463a-bf7b-60449fa5dfa4','7129bc31-88dc-42da-ab80-415a21f2ea9a','asd',1,'2025-10-15 14:51:05'),
('52ca9e72-cc03-4e04-a395-4ea697b9109e','a2f05a24-ac0b-4b59-a322-9864cc5e5364','7129bc31-88dc-42da-ab80-415a21f2ea9a','Halledildi.',1,'2025-10-13 12:55:25'),
('6145dfcb-dd55-4161-8cb4-e93e36ec56d5','df786c2d-5668-4688-88ad-952a3eebc812','7129bc31-88dc-42da-ab80-415a21f2ea9a','mjhhjkj',1,'2025-10-13 15:25:57'),
('68b76c1f-b1bc-47e2-b0ea-b76d674a7bea','eb07b91d-d727-40a0-9dcd-55321578d0ab','7129bc31-88dc-42da-ab80-415a21f2ea9a','Buyrun.',1,'2025-10-14 08:09:21'),
('7b7e644e-32bf-4e54-9dc5-55c1c1a6a65a','a894ffcf-28cb-4609-9021-b381e559a5f2','7129bc31-88dc-42da-ab80-415a21f2ea9a','gdfgdfgdfgdfgdfg',1,'2025-10-13 15:37:32'),
('84734c73-861c-42aa-baaf-6b1c47aa57c6','ded743a6-7618-430c-bffb-e4db49dc6247','7129bc31-88dc-42da-ab80-415a21f2ea9a','qweqwe',1,'2025-10-15 14:54:20'),
('8bb03576-8794-43b3-b5ca-adcf79b2a8b9','8f83c5b7-5cbb-4d7e-8262-2b89c5415e6d','7129bc31-88dc-42da-ab80-415a21f2ea9a','asdasd',0,'2025-10-15 14:22:17'),
('8cb9e080-2331-453f-8e1d-0079e59d1e97','c742d0ad-3f07-466b-ac1e-2cf34b84941a','7129bc31-88dc-42da-ab80-415a21f2ea9a','asd',1,'2025-10-15 14:44:06'),
('8cfe1c53-2e05-44f2-8fe0-cdc44d8e6ef9','a2f05a24-ac0b-4b59-a322-9864cc5e5364','0ac37a5c-a8be-4d25-b853-1e5c9574c1b3','tamamdır\n',0,'2025-10-13 12:55:34'),
('94a8863b-c5fe-4823-8bc2-dd984c10fa62','1b483b05-a8e0-48bd-8233-792863d26973','7129bc31-88dc-42da-ab80-415a21f2ea9a','dfgdfgdfg',1,'2025-10-13 16:01:03'),
('96d44802-14f4-4faf-9125-113b19f4ab8c','534148b8-7462-422e-93d7-430cc2fdf6a1','7129bc31-88dc-42da-ab80-415a21f2ea9a','sadsad',1,'2025-10-13 15:39:16'),
('a014e062-fa53-4dba-b69a-c839c0d11ddf','ded743a6-7618-430c-bffb-e4db49dc6247','4a8fb7f7-0668-4429-9309-fe88ac90eed2','qwe',0,'2025-10-15 14:54:31'),
('b8867640-7014-4bb3-be17-37d4a41805c6','dff55daa-ff67-401e-ba81-9513e2fbb164','7129bc31-88dc-42da-ab80-415a21f2ea9a','45',0,'2025-10-06 22:33:36'),
('cdc4b674-9360-46ec-9158-7ec7ce047e59','dff55daa-ff67-401e-ba81-9513e2fbb164','7129bc31-88dc-42da-ab80-415a21f2ea9a','545',1,'2025-10-06 22:33:22'),
('e76247c0-95dc-4295-8661-3d6b901e4950','22c8d700-a5b8-4395-b1ce-1aba42495add','7129bc31-88dc-42da-ab80-415a21f2ea9a','rdgdfgdfgdfgdfgdfgdfgdfg',1,'2025-10-13 15:33:27'),
('ff93ce04-575c-4c7a-9cbd-b7aec9b9c88b','8f83c5b7-5cbb-4d7e-8262-2b89c5415e6d','7129bc31-88dc-42da-ab80-415a21f2ea9a','asd',1,'2025-10-15 14:23:24')
ON DUPLICATE KEY UPDATE
  `message` = VALUES(`message`),
  `is_admin` = VALUES(`is_admin`);

COMMIT;
