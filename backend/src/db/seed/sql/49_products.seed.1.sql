-- 49_products.seed.1.sql
-- ============================================
-- SEED: PRODUCTS (DDL ile birebir uyumlu) — FINAL (JSON alanlar DOLU)
-- - badges/custom_fields/quantity_options/gallery_* / features örnekle dolduruldu
-- - INSERT IGNORE korunur
-- ============================================

INSERT IGNORE INTO products
(
  id, name, slug, description, short_description,
  price, original_price, cost, category_id,
  image_url,
  featured_image,
  featured_image_asset_id,
  featured_image_alt,

  gallery_urls,
  gallery_asset_ids,
  features,
  badges,
  custom_fields,
  quantity_options,
  rating, review_count, sales_count,

  stock_quantity, sku, is_active, is_featured, is_digital, requires_shipping,
  meta_title, meta_description,
  created_at, updated_at
)
VALUES
(
  '0132e42e-d46a-444d-9080-a419aec29c9c',
  '500 Takipçi',
  '500-takipci',
  '<p>Instagram 500 Takipçi</p>',
  NULL,
  50.00, NULL, NULL,
  '5e300196-8b4e-44d9-9020-d1fccccbe249',
  'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760111139051.jpg',
  'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760111139051.jpg',
  NULL,
  '500 Takipçi',

  JSON_ARRAY(
    'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760111139051.jpg',
    'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760111139051.jpg'
  ),
  JSON_ARRAY('seed:featured', 'seed:gallery_2'),
  JSON_ARRAY('Hızlı teslimat', 'Güvenli işlem', 'Anlık başlatma'),

  JSON_ARRAY(
    JSON_OBJECT('text','Hızlı Teslimat','icon',NULL,'active',TRUE),
    JSON_OBJECT('text','7/24 Destek','icon',NULL,'active',TRUE)
  ),
  JSON_ARRAY(
    JSON_OBJECT('id','seed_username','label','Kullanıcı Adı','type','text','placeholder','@kullaniciadi','required',TRUE),
    JSON_OBJECT('id','seed_contact','label','İletişim E-posta','type','email','placeholder','mail@ornek.com','required',FALSE)
  ),
  JSON_ARRAY(
    JSON_OBJECT('quantity',1,'price',50.00),
    JSON_OBJECT('quantity',2,'price',95.00),
    JSON_OBJECT('quantity',5,'price',225.00)
  ),
  5.00,
  0,
  1200,
  9999999, NULL, 1, 0, 0, 1,
  NULL, NULL,
  '2025-10-10 15:45:52',
  '2025-10-15 12:41:26'
),
(
  '058e9ccd-f99d-4601-90ca-597fb3d4430f',
  'ChatGPT Business Hesap(30 Gün)',
  'chatgpt-business-hesap',
  '<ul><li><strong style="color: #fff; background-color:#e60000;">SINIRSIZ GPT-5</strong><span style="color:#e0e7ff; background-color:#e60000;"> ve görüntü/video oluşturma</span></li><li><strong style="color:#fff; background-color:#e60000;">2’ye kadar eş zamanlı</strong><span style="color:#e0e7ff; background-color:#e60000;"> üretim imkanı</span></li><li><strong style="color:#fff; background-color:#e60000;">32K Bağlam Penceresi</strong><span style="color:#e0e7ff; background-color:#e60000;"> ve gelişmiş analiz</span></li><li><strong style="color:#fff; background-color:#e60000;">Video Oluşturma:</strong><span style="color:#e0e7ff; background-color:#e60000;"> 720p’de 5 saniye veya 480p’de 10 saniye</span></li><li><strong style="color:#fff; background-color:#e60000;">ChatGPT Ajanı</strong><span style="color:#e0e7ff; background-color:#e60000;"> ve otomatik görev planlama</span></li><li><strong style="color:#fff; background-color:#e60000;">Daha yüksek yanıt hızları</strong><span style="color:#e0e7ff; background-color:#e60000;"> ve öncelikli destek</span></li></ul>',
  NULL,
  250.00, NULL, NULL,
  'f6b5f01c-a7b9-48ee-bbdb-9b44b4bf8398',
  'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760110464275.jpeg',
  'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760110464275.jpeg',
  NULL,
  'ChatGPT Business Hesap(30 Gün)',

  JSON_ARRAY(
    'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760110464275.jpeg',
    'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760110464275.jpeg'
  ),
  JSON_ARRAY('seed:featured', 'seed:gallery_2'),
  JSON_ARRAY('Kurulum dahil', 'Hızlı aktivasyon', 'Garantili teslimat'),

  JSON_ARRAY(
    JSON_OBJECT('text','Premium','icon',NULL,'active',TRUE),
    JSON_OBJECT('text','Sınırlı Stok','icon',NULL,'active',FALSE)
  ),
  JSON_ARRAY(
    JSON_OBJECT('id','seed_email','label','Teslim E-posta','type','email','placeholder','mail@ornek.com','required',TRUE),
    JSON_OBJECT('id','seed_note','label','Sipariş Notu','type','textarea','placeholder','Ek bilgi varsa yazın','required',FALSE)
  ),
  JSON_ARRAY(
    JSON_OBJECT('quantity',1,'price',250.00),
    JSON_OBJECT('quantity',3,'price',720.00)
  ),
  5.00,
  0,
  1200,

  10, NULL, 1, 0, 0, 1,
  NULL, NULL,
  '2025-10-10 15:34:37',
  '2025-10-10 15:34:37'
),
(
  '0bfafe30-cc66-458b-8fa8-3ebe25826040',
  'Grand Theft Auto V',
  'gta-5',
  'GTA 5, Los Santos şehrinde geçen açık dünya aksiyon macera oyunudur. Üç farklı karakter arasında geçiş yaparak hikayeyi deneyimleyin.',
  'Los Santos''ta suç ve macera',
  2500.00, NULL, NULL,
  '12b202f2-144e-44f6-b2d8-04dac0ad900b',
  'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&h=600&fit=crop',
  NULL,
  'Grand Theft Auto V',

  JSON_ARRAY(
    'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&h=600&fit=crop'
  ),
  JSON_ARRAY('seed:featured', 'seed:gallery_2'),
  JSON_ARRAY('Orijinal lisans', 'Anında teslimat', 'Kurulum talimatı'),

  JSON_ARRAY(
    JSON_OBJECT('text','Popüler','icon',NULL,'active',TRUE),
    JSON_OBJECT('text','İndirim','icon',NULL,'active',FALSE)
  ),
  JSON_ARRAY(
    JSON_OBJECT('id','seed_platform','label','Platform','type','text','placeholder','Steam / Rockstar / Epic','required',TRUE),
    JSON_OBJECT('id','seed_contact','label','İletişim Telefon','type','phone','placeholder','05xx xxx xx xx','required',FALSE)
  ),
  JSON_ARRAY(
    JSON_OBJECT('quantity',1,'price',2500.00),
    JSON_OBJECT('quantity',2,'price',4800.00)
  ),
  5.00,
  0,
  1200,

  150, NULL, 1, 0, 0, 1,
  NULL, NULL,
  '2025-10-06 17:19:05',
  '2025-10-06 17:19:05'
),
(
  '0fbee9fe-da18-4c6e-9910-73cf81ba5b9f',
  'Gemini Veo 3 Ultra(90 Gün)',
  'gemini-veo-3-ultra-90-gun',
  '<h3><strong>Veo 3 – Yapay Zeka Destekli Video Üretimi</strong></h3><p>Metinden sinematik videolar üretir; 1080p kalite, gerçekçi kamera hareketleri ve stil kontrolü sunar.</p>',
  NULL,
  250.00, NULL, NULL,
  'f6b5f01c-a7b9-48ee-bbdb-9b44b4bf8398',
  'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760110653248.jpg',
  'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760110653248.jpg',
  NULL,
  'Gemini Veo 3 Ultra(90 Gün)',

  JSON_ARRAY(
    'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760110653248.jpg',
    'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760110653248.jpg'
  ),
  JSON_ARRAY('seed:featured', 'seed:gallery_2'),
  JSON_ARRAY('90 gün lisans', 'Hızlı aktivasyon', 'Detaylı kullanım rehberi'),

  JSON_ARRAY(
    JSON_OBJECT('text','Yeni','icon',NULL,'active',TRUE),
    JSON_OBJECT('text','En Çok Satan','icon',NULL,'active',FALSE)
  ),
  JSON_ARRAY(
    JSON_OBJECT('id','seed_email','label','Teslim E-posta','type','email','placeholder','mail@ornek.com','required',TRUE),
    JSON_OBJECT('id','seed_url','label','Profil URL','type','url','placeholder','https://ornek.com','required',FALSE)
  ),
  JSON_ARRAY(
    JSON_OBJECT('quantity',1,'price',250.00),
    JSON_OBJECT('quantity',2,'price',475.00),
    JSON_OBJECT('quantity',4,'price',900.00)
  ),
  5.00,
  0,
  1200,

  24, NULL, 1, 0, 0, 1,
  NULL, NULL,
  '2025-10-10 15:37:02',
  '2025-10-10 15:37:44'
),
(
  '1bdb2344-9b92-455f-935a-f064a470b6b8',
  'Office 365 Lisans PC/MAC',
  'office-365-lisans',
  '<h1 class="ql-align-center"><strong>Office 2024 Professional Plus</strong></h1><p>Güncel Office uygulamalarıyla üretkenliğinizi artırın.</p>',
  'Microsoft Office 365 Lisanslı Kullanıcı Hesabı – Tüm ofis programlarını (Excel, Word, Powerpoint vb.) 5 farklı cihazda (Pc, Mac, Android, iOS) kullanın.',
  200.00, NULL, NULL,
  'ce780bbd-38e7-469e-a18a-9e51998e04d6',
  'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760109969704.jpg',
  'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760109969704.jpg',
  NULL,
  'Office 365 Lisans PC/MAC',

  JSON_ARRAY(
    'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760109969704.jpg',
    'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760109969704.jpg'
  ),
  JSON_ARRAY('seed:featured', 'seed:gallery_2'),
  JSON_ARRAY('5 cihaz desteği', 'Kurulum kılavuzu', 'Garanti'),

  JSON_ARRAY(
    JSON_OBJECT('text','Kurulum Dahil','icon',NULL,'active',TRUE),
    JSON_OBJECT('text','Resmi Lisans','icon',NULL,'active',TRUE)
  ),
  JSON_ARRAY(
    JSON_OBJECT('id','seed_email','label','Teslim E-posta','type','email','placeholder','mail@ornek.com','required',TRUE),
    JSON_OBJECT('id','seed_fullname','label','Ad Soyad','type','text','placeholder','Adınız Soyadınız','required',FALSE)
  ),
  JSON_ARRAY(
    JSON_OBJECT('quantity',1,'price',200.00),
    JSON_OBJECT('quantity',2,'price',380.00),
    JSON_OBJECT('quantity',3,'price',540.00)
  ),
  5.00,
  0,
  1200,

  100, NULL, 1, 0, 0, 1,
  NULL, NULL,
  '2025-10-10 15:26:29',
  '2025-10-10 15:26:29'
);
