INSERT INTO `api_providers`
(`id`, `name`, `type`, `credentials`, `is_active`, `created_at`, `updated_at`)
VALUES
('5cc2d80a-d0bf-4333-b2c5-5aaebd3c7aa3',
 'Cekilisbayisi',
 'smm',
 '{\"api_url\":\"https://cekilisbayisi.com/api/v2\",\"api_key\":\"dd6a5d1ad1cda75ee74d34b238bf111c\",\"balance\":82.2550354,\"currency\":\"TRY\"}',
 1,
 '2025-10-07 12:46:38',
 '2025-10-09 09:42:19')
...
('2bbb7a4e-9b6b-49a4-9f4a-4c6b4a4d9c01',
 'Telegram Bot',
 'telegram',
 '{ "bot_token": "{{TELEGRAM_BOT_TOKEN}}", "default_chat_id": "7474884105" }',
 1,
 NOW(3),
 NOW(3))
...
