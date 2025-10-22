-- Add comprehensive homepage settings
INSERT INTO public.site_settings (key, value) VALUES
-- Trust Badges
('home_trust_badge_1_title', '"Anında Teslimat"'),
('home_trust_badge_1_subtitle', '"Otomatik sistem"'),
('home_trust_badge_2_title', '"Güvenli Ödeme"'),
('home_trust_badge_2_subtitle', '"SSL korumalı"'),

-- Hero Stats
('home_stat_1_number', '"10,000+"'),
('home_stat_1_label', '"Mutlu Müşteri"'),
('home_stat_2_number', '"24/7"'),
('home_stat_2_label', '"Destek"'),

-- Hero Image
('home_hero_image_url', '"https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80"'),
('home_hero_image_alt', '"Dijital Ürünler"'),

-- Featured Products Section
('home_featured_badge', '"Öne Çıkan Ürünler"'),
('home_featured_title', '"En çok satan ürünlerimize göz atın"'),
('home_featured_button', '"Tüm Ürünleri Görüntüle"'),

-- How It Works Section
('home_how_it_works_title', '"Nasıl Çalışır?"'),
('home_how_it_works_subtitle', '"4 basit adımda dijital ürününüze sahip olun"'),
('home_step_1_title', '"Ürünü Seçin"'),
('home_step_1_desc', '"Geniş ürün yelpazemizden ihtiyacınıza uygun dijital ürünü bulun ve inceleyin."'),
('home_step_2_title', '"Güvenli Ödeme"'),
('home_step_2_desc', '"Kredi kartı, havale veya kripto para ile güvenli ödeme yapın."'),
('home_step_3_title', '"Anında Teslimat"'),
('home_step_3_desc', '"Ödeme onaylandıktan sonra ürününüz otomatik olarak e-posta ve panele iletilir."'),
('home_step_4_title', '"7/24 Destek"'),
('home_step_4_desc', '"Herhangi bir sorun yaşarsanız destek ekibimiz size yardımcı olmaya hazır."'),

-- FAQ Section
('home_faq_title', '"Sıkça Sorulan Sorular"'),
('home_faq_subtitle', '"Merak ettiklerinizin cevaplarını burada bulabilirsiniz"'),
('home_faq_cta_title', '"Başka sorunuz mu var?"'),
('home_faq_cta_subtitle', '"Destek ekibimiz size yardımcı olmak için hazır"'),
('home_faq_cta_button', '"Bize Ulaşın →"'),

-- Blog Section
('home_blog_badge', '"Blog Yazılarımız"'),
('home_blog_title', '"Güncel İçerikler"'),
('home_blog_subtitle', '"Dijital ürünler, teknoloji ve güvenlik hakkında en güncel bilgiler"'),
('home_blog_button', '"Tüm Blog Yazıları"')

ON CONFLICT (key) DO NOTHING;