-- ===================================================================
-- FILE: 90.1_telegram_inbound_messages.seed.sql
-- FINAL — sample seeds for telegram_inbound_messages
-- - Upsert by unique key (update_id, message_id)
-- - raw is JSON string
-- ===================================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

INSERT INTO `telegram_inbound_messages` (
  `id`,
  `update_id`,
  `message_id`,
  `chat_id`,
  `chat_type`,
  `chat_title`,
  `chat_username`,
  `from_id`,
  `from_username`,
  `from_first_name`,
  `from_last_name`,
  `from_is_bot`,
  `text`,
  `raw`,
  `telegram_date`,
  `created_at`
) VALUES

-- 1) Private chat, normal user message
(
  '9a6c0e2a-0a44-4e35-9cdd-0c54d2c1a001',
  10000001,
  501,
  '123456789',
  'private',
  NULL,
  'orhan_user',
  '123456789',
  'orhan_user',
  'Orhan',
  'Guzel',
  0,
  'Merhaba, destek alabilir miyim?',
  '{ "update_id": 10000001, "message": { "message_id": 501, "chat": { "id": 123456789, "type": "private", "username": "orhan_user" }, "from": { "id": 123456789, "is_bot": false, "first_name": "Orhan", "last_name": "Guzel", "username": "orhan_user" }, "date": 1737040000, "text": "Merhaba, destek alabilir miyim?" } }',
  1737040000,
  NOW(3)
),

-- 2) Group chat message
(
  '9a6c0e2a-0a44-4e35-9cdd-0c54d2c1a002',
  10000002,
  777,
  '-100987654321',
  'group',
  'ProductSpark Support',
  'productspark_support',
  '222333444',
  'support_agent',
  'Support',
  'Agent',
  0,
  'Talebinizi aldık, inceliyoruz.',
  '{ "update_id": 10000002, "message": { "message_id": 777, "chat": { "id": -100987654321, "type": "group", "title": "ProductSpark Support", "username": "productspark_support" }, "from": { "id": 222333444, "is_bot": false, "first_name": "Support", "last_name": "Agent", "username": "support_agent" }, "date": 1737040100, "text": "Talebinizi aldık, inceliyoruz." } }',
  1737040100,
  NOW(3)
),

-- 3) Some update types may not have message_id (NULL); unique index allows multiple NULLs in MySQL
(
  '9a6c0e2a-0a44-4e35-9cdd-0c54d2c1a003',
  10000003,
  NULL,
  '123456789',
  'private',
  NULL,
  'orhan_user',
  '123456789',
  'orhan_user',
  'Orhan',
  'Guzel',
  0,
  NULL,
  '{ "update_id": 10000003, "some_other_update": { "note": "message_id olmayan update tipine örnek" } }',
  1737040200,
  NOW(3)
)

ON DUPLICATE KEY UPDATE
  `chat_id`        = VALUES(`chat_id`),
  `chat_type`      = VALUES(`chat_type`),
  `chat_title`     = VALUES(`chat_title`),
  `chat_username`  = VALUES(`chat_username`),
  `from_id`        = VALUES(`from_id`),
  `from_username`  = VALUES(`from_username`),
  `from_first_name`= VALUES(`from_first_name`),
  `from_last_name` = VALUES(`from_last_name`),
  `from_is_bot`    = VALUES(`from_is_bot`),
  `text`           = VALUES(`text`),
  `raw`            = VALUES(`raw`),
  `telegram_date`  = VALUES(`telegram_date`),
  `created_at`     = VALUES(`created_at`);
