-- ============================================
-- KRİTİK GÜVENLİK YAMASI - RLS POLİCY DÜZELTMELERİ
-- Tespit edilen güvenlik açıklarını kapatır
-- ============================================

-- ============================================
-- 1. PROFILES TABLOSU - KRİTİK AÇIK KAPAMA
-- ============================================
-- Mevcut açık policy'yi kaldır
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;

-- Kullanıcılar sadece kendi profilini görebilsin
CREATE POLICY "Users can view own profile" ON profiles
FOR SELECT USING (auth.uid() = id);

-- Adminler tüm profilleri görebilsin (zaten var ama güvenlik için yeniden)
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- 2. ORDERS TABLOSU - KRİTİK AÇIK KAPAMA
-- ============================================
-- Mevcut açık policy'yi kaldır
DROP POLICY IF EXISTS "orders_select_policy" ON orders;

-- Kullanıcılar sadece kendi siparişlerini görebilsin
CREATE POLICY "Users can view own orders" ON orders
FOR SELECT USING (
  (user_id = auth.uid() AND auth.uid() IS NOT NULL) OR
  has_role(auth.uid(), 'admin'::app_role)
);

-- ============================================
-- 3. PAYMENT_REQUESTS TABLOSU - KRİTİK AÇIK KAPAMA
-- ============================================
-- Mevcut açık policy'yi kaldır
DROP POLICY IF EXISTS "payment_requests_select_policy" ON payment_requests;

-- Kullanıcılar sadece kendi taleplerini görebilsin
CREATE POLICY "Authenticated users view own payment requests" ON payment_requests
FOR SELECT USING (
  (user_id = auth.uid() AND auth.uid() IS NOT NULL) OR
  has_role(auth.uid(), 'admin'::app_role)
);

-- ============================================
-- 4. ORDER_ITEMS TABLOSU - YÜKSEK RİSK AÇIK KAPAMA
-- ============================================
-- Mevcut açık policy'yi kaldır
DROP POLICY IF EXISTS "order_items_select_policy" ON order_items;

-- Kullanıcılar sadece kendi sipariş öğelerini görebilsin
CREATE POLICY "Users can view own order items" ON order_items
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_items.order_id 
    AND (
      (orders.user_id = auth.uid() AND auth.uid() IS NOT NULL) OR
      has_role(auth.uid(), 'admin'::app_role)
    )
  )
);

-- ============================================
-- 5. SITE_SETTINGS TABLOSU - KRİTİK AÇIK KAPAMA
-- ============================================
-- Mevcut policy'yi kaldır
DROP POLICY IF EXISTS "Everyone can view site settings" ON site_settings;

-- Public ayarlar herkese açık (hassas ayarlar hariç)
CREATE POLICY "Public settings readable" ON site_settings
FOR SELECT USING (
  key NOT IN (
    'smtp_host', 'smtp_port', 'smtp_username', 'smtp_password',
    'smtp_from_email', 'smtp_from_name', 'smtp_use_tls', 'smtp_use_ssl',
    'paytr_merchant_id', 'paytr_merchant_key', 'paytr_merchant_salt',
    'paytr_test_mode', 'paytr_havale_merchant_id', 'paytr_havale_merchant_key', 
    'paytr_havale_merchant_salt', 'paytr_havale_test_mode',
    'shopier_api_key', 'shopier_api_secret',
    'telegram_bot_token', 'telegram_chat_id',
    'google_analytics_id', 'google_tag_manager_id'
  )
);

-- Adminler tüm ayarları görebilsin
CREATE POLICY "Admins can view all settings" ON site_settings
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- 6. API_PROVIDERS TABLOSU - KRİTİK AÇIK KAPAMA
-- ============================================
-- Tüm mevcut policy'leri kaldır
DROP POLICY IF EXISTS "Admins can manage API providers" ON api_providers;

-- Sadece adminler tüm işlemleri yapabilsin
CREATE POLICY "Only admins can access api_providers" ON api_providers
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- 7. PRODUCT_STOCK TABLOSU - YÜKSEK RİSK AÇIK KAPAMA
-- ============================================
-- Mevcut policy'leri kaldır
DROP POLICY IF EXISTS "Admins can manage product stock" ON product_stock;

-- Sadece adminler stok kodlarını görebilsin ve yönetebilsin
CREATE POLICY "Only admins can view product stock" ON product_stock
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can manage product stock" ON product_stock
FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update product stock" ON product_stock
FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete product stock" ON product_stock
FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- GÜVENLİK YAMASI TAMAMLANDI
-- ============================================
-- Yamalar:
-- ✅ PROFILES - Sadece kendi profilini görebilir
-- ✅ ORDERS - Sadece kendi siparişlerini görebilir  
-- ✅ PAYMENT_REQUESTS - Sadece kendi taleplerini görebilir
-- ✅ ORDER_ITEMS - Sadece kendi sipariş öğelerini görebilir
-- ✅ SITE_SETTINGS - Hassas ayarlar gizlendi
-- ✅ API_PROVIDERS - Tamamen kapatıldı (sadece admin)
-- ✅ PRODUCT_STOCK - Tamamen kapatıldı (sadece admin)
-- ============================================