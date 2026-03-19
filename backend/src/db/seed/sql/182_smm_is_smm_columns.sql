-- ============================================================
-- MIGRATION: SMM is_smm alanları — CANLI VERİTABANI GÜNCELLEME
-- ============================================================
-- NOT: Yeni kurulumlar için is_smm zaten
--   48_product_schema.sql (products tablosu CREATE TABLE)
--   20_catalog_schema.sql (categories tablosu CREATE TABLE)
-- dosyalarına eklendi. Bu dosya sadece tablolar zaten mevcut olan
-- canlı veritabanlarına kolon eklemek için çalıştırılır.
-- ADD COLUMN IF NOT EXISTS → idempotent, tekrar çalıştırmak güvenlidir.
-- ============================================================

ALTER TABLE `products`
  ADD COLUMN IF NOT EXISTS `is_smm` TINYINT(1) NOT NULL DEFAULT 0
    COMMENT 'SMM ürünü: müşteriden otomatik sosyal medya linki alınır';

ALTER TABLE `categories`
  ADD COLUMN IF NOT EXISTS `is_smm` TINYINT(1) NOT NULL DEFAULT 0
    COMMENT 'SMM kategorisi: bu kategorideki API ürünleri otomatik link alır';
