-- Test Güncellemesi: Ana sayfa "Nasıl Çalışır?" başlığını güncelle
-- Bu migration kullanıcının mevcut ayarlarını günceller

UPDATE site_settings 
SET value = '"Nasıl Çalışır? TEST"'::jsonb
WHERE key = 'home_how_it_works_title';

-- Eğer ayar yoksa ekle
INSERT INTO site_settings (key, value)
VALUES ('home_how_it_works_title', '"Nasıl Çalışır? TEST"'::jsonb)
ON CONFLICT (key) DO NOTHING;