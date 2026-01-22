SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET collation_connection = utf8mb4_unicode_ci;
SET time_zone = '+00:00';

-- -------------------------
-- USERS (sample)
-- -------------------------
INSERT IGNORE INTO users
(id, email, password_hash, full_name, phone, wallet_balance, is_active, email_verified, created_at, updated_at)
VALUES
('0ac37a5c-a8be-4d25-b853-1e5c9574c1b3', 'mehmet@gmail.com', '$argon2id$temp', 'Mehmet Kuber', '05454905148', 0.00, 1, 0, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('19a2bc26-63d1-43ad-ab56-d7f3c3719a34', 'hostingisletmesi@gmail.com', '$argon2id$temp', 'Nuri Muh', '05414417854', 0.00, 1, 0, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('4a8fb7f7-0668-4429-9309-fe88ac90eed2', 'mlhgs1@gmail.com', '$argon2id$temp', 'Sultan Abdü', '05427354197', 0.00, 1, 0, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('7129bc31-88dc-42da-ab80-415a21f2ea9a', 'melihkececi@yandex.com', '$argon2id$temp', 'Melih Keçeci', NULL, 0.00, 1, 0, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('d279bb9d-797d-4972-a8bd-a77a40caba91', 'kececimelih@gmail.com', '$argon2id$temp', 'Keçeci Melih', '05425547474', 0.00, 1, 0, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));

-- -------------------------
-- PROFILES (only missing)
-- -------------------------
INSERT INTO profiles (id, full_name, phone, created_at, updated_at)
SELECT u.id, u.full_name, u.phone, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)
FROM users u
LEFT JOIN profiles p ON p.id = u.id
WHERE p.id IS NULL;
