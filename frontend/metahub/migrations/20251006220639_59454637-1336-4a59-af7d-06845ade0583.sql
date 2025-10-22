-- Örnek blog yazıları ekle
INSERT INTO public.blog_posts (title, slug, excerpt, content, category, author_name, image_url, read_time, is_published, is_featured)
VALUES
(
  'Dijital Ürünlerde Güvenlik İpuçları',
  'dijital-urunlerde-guvenlik-ipuclari',
  'Dijital ürünleri satın alırken güvenliğinizi sağlamak için bilmeniz gereken önemli ipuçları.',
  '<h2>Güvenli Alışverişin Temel Kuralları</h2><p>Dijital ürünler satın alırken dikkat etmeniz gereken en önemli noktalar nelerdir? Bu yazıda sizin için önemli güvenlik ipuçlarını derledik.</p><h3>1. Güvenilir Platformları Tercih Edin</h3><p>Her zaman SSL sertifikası olan ve güvenli ödeme yöntemlerine sahip platformları kullanın.</p><h3>2. Şifre Güvenliği</h3><p>Hesaplarınız için güçlü ve benzersiz şifreler kullanın. İki faktörlü kimlik doğrulamayı aktif edin.</p><h3>3. Ödeme Bilgilerinizi Koruyun</h3><p>Kredi kartı bilgilerinizi sadece güvenilir platformlarda paylaşın ve düzenli olarak hesap hareketlerinizi kontrol edin.</p>',
  'Güvenlik',
  'Dijimin Ekibi',
  'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&h=600&fit=crop',
  '5 dk',
  true,
  true
),
(
  'En İyi Oyun Lisansları 2025',
  'en-iyi-oyun-lisanslari-2025',
  '2025 yılının en popüler oyun lisansları ve önerileri. Hangi oyunları tercih etmelisiniz?',
  '<h2>2025 Yılının En Çok Tercih Edilen Oyunları</h2><p>Bu yıl oyun dünyasında birçok yenilik ve heyecan verici içerik bulunuyor. İşte en çok tercih edilen oyunlar:</p><h3>Aksiyon Oyunları</h3><p>Bu kategoride en popüler oyunlar arasında son çıkan AAA yapımlar yer alıyor.</p><h3>Strateji Oyunları</h3><p>Düşünmeyi seven oyuncular için harika seçenekler mevcut.</p><h3>Multiplayer Deneyimleri</h3><p>Arkadaşlarınızla oynayabileceğiniz en iyi co-op oyunlar.</p>',
  'Oyunlar',
  'Ahmet Yılmaz',
  'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&h=600&fit=crop',
  '7 dk',
  true,
  false
),
(
  'Microsoft Office Lisansı Nasıl Seçilir?',
  'microsoft-office-lisansi-nasil-secilir',
  'İşletmeniz veya kişisel kullanımınız için en uygun Office lisansını seçme rehberi.',
  '<h2>Office Lisans Türleri</h2><p>Microsoft Office birçok farklı lisans seçeneği sunuyor. Hangisinin sizin için uygun olduğunu belirleyelim.</p><h3>Microsoft 365 Personal</h3><p>Bireysel kullanıcılar için ideal olan bu paket, 1 PC veya Mac üzerinde kullanılabilir.</p><h3>Microsoft 365 Family</h3><p>Aile üyeleriyle paylaşabileceğiniz, 6 kişiye kadar lisans sunan ekonomik paket.</p><h3>Office Home & Business</h3><p>Küçük işletmeler için tek seferlik satın alma seçeneği ile maliyet avantajı.</p><h3>Karar Verirken Nelere Dikkat Edilmeli?</h3><p>İhtiyacınız olan programlar, cihaz sayısı ve bütçenizi göz önünde bulundurarak karar verin.</p>',
  'Yazılım',
  'Ayşe Demir',
  'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=600&fit=crop',
  '6 dk',
  true,
  false
),
(
  'Spotify Premium vs YouTube Music',
  'spotify-premium-vs-youtube-music',
  'İki popüler müzik platformunu karşılaştırdık. Hangisi sizin için daha uygun?',
  '<h2>Müzik Platformları Karşılaştırması</h2><p>Günümüzde müzik dinleme alışkanlıklarımız tamamen değişti. Peki hangi platform sizin için daha uygun?</p><h3>Spotify Premium Avantajları</h3><ul><li>Geniş müzik kütüphanesi</li><li>Kişiselleştirilmiş çalma listeleri</li><li>Yüksek ses kalitesi</li><li>Offline dinleme</li></ul><h3>YouTube Music Avantajları</h3><ul><li>YouTube videolarına erişim</li><li>Geniş içerik yelpazesi</li><li>Remix ve cover versiyonlar</li><li>YouTube Premium ile entegrasyon</li></ul><h3>Fiyat Karşılaştırması</h3><p>Her iki platform da rekabetçi fiyatlar sunuyor. Öğrenci ve aile paketleriyle maliyet avantajı sağlayabilirsiniz.</p>',
  'Eğlence',
  'Mehmet Kaya',
  'https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=800&h=600&fit=crop',
  '8 dk',
  true,
  false
);