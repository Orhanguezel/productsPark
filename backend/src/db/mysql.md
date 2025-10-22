-- ⚠️ TÜM VERİ SİLİNECEK
DROP DATABASE IF EXISTS `app`;
CREATE DATABASE `app` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `app`;

-- users
CREATE TABLE users (
  id                CHAR(36)       NOT NULL,
  email             VARCHAR(255)   NOT NULL,
  password_hash     VARCHAR(255)   NOT NULL,
  full_name         VARCHAR(255)   DEFAULT NULL,
  phone             VARCHAR(50)    DEFAULT NULL,
  wallet_balance    DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
  is_active         TINYINT(1)     NOT NULL DEFAULT 1,
  email_verified    TINYINT(1)     NOT NULL DEFAULT 0,
  reset_token             VARCHAR(255)  DEFAULT NULL,
  reset_token_expires     DATETIME(3)   DEFAULT NULL,
  created_at        DATETIME(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at        DATETIME(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  last_sign_in_at   DATETIME(3)    DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY users_email_unique (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- user_roles
CREATE TABLE user_roles (
  id          CHAR(36)     NOT NULL,
  user_id     CHAR(36)     NOT NULL,
  role        ENUM('admin','moderator','user') NOT NULL DEFAULT 'user',
  created_at  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY user_roles_user_id_role_unique (user_id, role),
  KEY user_roles_user_id_idx (user_id),
  CONSTRAINT fk_user_roles_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- refresh_tokens
CREATE TABLE refresh_tokens (
  id           CHAR(36)     NOT NULL,  -- jti
  user_id      CHAR(36)     NOT NULL,
  token_hash   VARCHAR(255) NOT NULL,
  created_at   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  expires_at   DATETIME(3)  NOT NULL,
  revoked_at   DATETIME(3)  DEFAULT NULL,
  replaced_by  CHAR(36)     DEFAULT NULL,
  PRIMARY KEY (id),
  KEY refresh_tokens_user_id_idx (user_id),
  KEY refresh_tokens_expires_at_idx (expires_at),
  CONSTRAINT fk_refresh_tokens_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- profiles
CREATE TABLE profiles (
  id             CHAR(36)      NOT NULL, -- FK (users.id)
  full_name      TEXT          DEFAULT NULL,
  phone          VARCHAR(64)   DEFAULT NULL,
  avatar_url     TEXT          DEFAULT NULL,
  address_line1  VARCHAR(255)  DEFAULT NULL,
  address_line2  VARCHAR(255)  DEFAULT NULL,
  city           VARCHAR(128)  DEFAULT NULL,
  country        VARCHAR(128)  DEFAULT NULL,
  postal_code    VARCHAR(32)   DEFAULT NULL,
  created_at     DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at     DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  CONSTRAINT fk_profiles_id_users_id
    FOREIGN KEY (id) REFERENCES users (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- seed: users
INSERT IGNORE INTO users
(id, email, password_hash, full_name, phone, wallet_balance, is_active, email_verified, reset_token, reset_token_expires, created_at, updated_at, last_sign_in_at) VALUES
('0ac37a5c-a8be-4d25-b853-1e5c9574c1b3', 'mehmet@gmail.com', '$2b$12$temporary.hash.needs.reset', 'Mehmet Kuber', '05454905148', 0.00, 1, 0, NULL, NULL, '2025-10-07 09:49:06.000', '2025-10-16 09:26:05.000', NULL),
('19a2bc26-63d1-43ad-ab56-d7f3c3719a34', 'hostingisletmesi@gmail.com', '$2b$12$temporary.hash.needs.reset', 'Nuri Muh', '05414417854', 0.00, 1, 0, NULL, NULL, '2025-10-13 15:07:15.000', '2025-10-16 09:26:05.000', NULL),
('4a8fb7f7-0668-4429-9309-fe88ac90eed2', 'mlhgs1@gmail.com', '$2b$12$temporary.hash.needs.reset', 'Sultan Abdü', '05427354197', 0.00, 1, 0, NULL, NULL, '2025-10-13 20:14:20.000', '2025-10-16 09:26:05.000', NULL),
('7129bc31-88dc-42da-ab80-415a21f2ea9a', 'melihkececi@yandex.com', '$2b$12$temporary.hash.needs.reset', 'Melih Keçeci', NULL, 0.00, 1, 0, NULL, NULL, '2025-10-06 18:08:24.000', '2025-10-16 09:26:05.000', NULL),
('d279bb9d-797d-4972-a8bd-a77a40caba91', 'kececimelih@gmail.com', '$2b$12$temporary.hash.needs.reset', 'Keçeci Melih', '05425547474', 0.00, 1, 0, NULL, NULL, '2025-10-14 07:49:48.000', '2025-10-16 09:26:05.000', NULL);

-- seed: roles
INSERT IGNORE INTO user_roles
(id, user_id, role, created_at) VALUES
('d49103a1-9095-4efc-8645-c08dd05ed100', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'admin', '2025-10-06 18:09:39.000');

-- seed: profiles
INSERT IGNORE INTO profiles (id, full_name, phone, created_at, updated_at) VALUES
('0ac37a5c-a8be-4d25-b853-1e5c9574c1b3', 'Mehmet Kuber', '05454905148', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('19a2bc26-63d1-43ad-ab56-d7f3c3719a34', 'Nuri Muh', '05414417854', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('4a8fb7f7-0668-4429-9309-fe88ac90eed2', 'Sultan Abdü', '05427354197', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('7129bc31-88dc-42da-ab80-415a21f2ea9a', 'Melih Keçeci', NULL, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('d279bb9d-797d-4972-a8bd-a77a40caba91', 'Keçeci Melih', '05425547474', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));
