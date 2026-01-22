SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET collation_connection = utf8mb4_unicode_ci;
SET time_zone = '+00:00';

SET @ADMIN_ID := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
SET @ADMIN_EMAIL := 'orhanguzell@gmail.com';

-- admin123 (argon2id)
SET @ADMIN_PASS_HASH :=
'$argon2id$v=19$m=65536,t=3,p=4$YQIcrqZ07eLIpB73INwNhA$ytFn6V9Vd9Y3tV5PqiwxJ6MyTs0byRquG8NypYGctGg';

-- 1) USER UPSERT
INSERT INTO users (
  id, email, password_hash, full_name, phone,
  wallet_balance, is_active, email_verified, created_at, updated_at
) VALUES (
  @ADMIN_ID,
  @ADMIN_EMAIL,
  @ADMIN_PASS_HASH,
  'Orhan Güzel',
  '+905551112233',
  0.00, 1, 1,
  CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)
)
ON DUPLICATE KEY UPDATE
  email          = VALUES(email),
  password_hash  = VALUES(password_hash),
  full_name      = VALUES(full_name),
  phone          = VALUES(phone),
  wallet_balance = users.wallet_balance,
  is_active      = 1,
  email_verified = 1,
  updated_at     = CURRENT_TIMESTAMP(3);

-- 2) PROFILE UPSERT
INSERT INTO profiles (id, full_name, phone, created_at, updated_at)
VALUES (@ADMIN_ID, 'Orhan Güzel', '+905551112233', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
ON DUPLICATE KEY UPDATE
  full_name  = VALUES(full_name),
  phone      = VALUES(phone),
  updated_at = CURRENT_TIMESTAMP(3);

-- 3) WRONG ADMIN ROLE CLEANUP (anyone else -> remove)
DELETE FROM user_roles
WHERE role = 'admin'
  AND user_id <> @ADMIN_ID;

-- 4) ADMIN ROLE GARANTI (idempotent)
INSERT IGNORE INTO user_roles (id, user_id, role, created_at)
VALUES (UUID(), @ADMIN_ID, 'admin', CURRENT_TIMESTAMP(3));
