-- ============================================================
-- MIGRATION: SMM is_smm alanları
-- products ve categories tablolarına is_smm TINYINT(1) ekler
-- Idempotent: sütun zaten varsa hata vermez
-- ============================================================

-- products.is_smm
ALTER TABLE `products`
  ADD COLUMN IF NOT EXISTS `is_smm` TINYINT(1) NOT NULL DEFAULT 0
    COMMENT 'SMM ürünü: müşteriden otomatik link/URL alınır';

-- categories.is_smm
ALTER TABLE `categories`
  ADD COLUMN IF NOT EXISTS `is_smm` TINYINT(1) NOT NULL DEFAULT 0
    COMMENT 'SMM kategorisi: bu kategorideki ürünler otomatik link/URL alır';
