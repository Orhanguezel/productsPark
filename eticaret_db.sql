-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Anamakine: 127.0.0.1
-- Üretim Zamanı: 19 Eki 2025, 19:10:33
-- Sunucu sürümü: 10.4.32-MariaDB
-- PHP Sürümü: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Veritabanı: `eticaret_db`
--

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `activation_codes`
--

CREATE TABLE `activation_codes` (
  `id` char(36) NOT NULL,
  `product_id` char(36) NOT NULL,
  `code` varchar(255) NOT NULL,
  `is_used` tinyint(1) NOT NULL DEFAULT 0,
  `used_by` char(36) DEFAULT NULL,
  `used_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Tablo döküm verisi `activation_codes`
--

INSERT INTO `activation_codes` (`id`, `product_id`, `code`, `is_used`, `used_by`, `used_at`, `created_at`) VALUES
('06e59b99-6cdf-406a-b55e-3b7221b01991', '4a9b363d-8402-4e89-8055-f58064eb462e', 'L5OK-1PKB-K8CV-V06T', 0, NULL, NULL, '2025-10-10 14:10:58'),
('16f0fb73-daa0-4955-adb1-5009006e1ec7', '4a9b363d-8402-4e89-8055-f58064eb462e', 'WFCI-KQHC-8FLC-05MP', 0, NULL, NULL, '2025-10-10 14:10:58'),
('2250820c-3b0d-4192-aad7-aac717aa2493', '4a9b363d-8402-4e89-8055-f58064eb462e', 'I1H4-C42M-53RM-HQUM', 0, NULL, NULL, '2025-10-10 14:10:58'),
('30032dbe-c822-4227-bee7-0a85d3302db1', '4a9b363d-8402-4e89-8055-f58064eb462e', '59JK-FA86-FEX9-P161', 0, NULL, NULL, '2025-10-10 14:10:58'),
('33f10c65-6034-4416-b92d-be8d7da4f5cc', '4a9b363d-8402-4e89-8055-f58064eb462e', 'MI5K-AZA8-IULC-OQXZ', 0, NULL, NULL, '2025-10-10 14:10:58'),
('351716e0-4fa5-451e-bdd9-cf788949448d', '4a9b363d-8402-4e89-8055-f58064eb462e', '4EN7-74D2-V68S-NSTP', 0, NULL, NULL, '2025-10-10 14:10:58'),
('392427eb-5715-4e26-913d-277bc765909f', '4a9b363d-8402-4e89-8055-f58064eb462e', 'D58K-NG1W-9M0P-HIYI', 0, NULL, NULL, '2025-10-10 14:10:58'),
('4679bcf3-43a5-45f9-aee9-43188e10b3dc', '4a9b363d-8402-4e89-8055-f58064eb462e', '1WAT-806D-RKQ6-BR6F', 0, NULL, NULL, '2025-10-10 14:10:58'),
('473eefb1-6d14-4123-a5d5-40d3caf20625', '4a9b363d-8402-4e89-8055-f58064eb462e', 'WGDJ-HCA7-NB34-IK5S', 0, NULL, NULL, '2025-10-10 14:10:58'),
('4b332414-8258-4a82-b384-85bdfad0931e', '4a9b363d-8402-4e89-8055-f58064eb462e', '2G4K-VWH4-I5CD-749E', 0, NULL, NULL, '2025-10-10 14:10:58'),
('55b3718e-b006-4e16-937a-62dbdf78d985', '4a9b363d-8402-4e89-8055-f58064eb462e', '0MFJ-SOYG-CD2F-J8B1', 0, NULL, NULL, '2025-10-10 14:10:58'),
('5926abd3-8760-4ccf-aea2-11264ab40e85', '4a9b363d-8402-4e89-8055-f58064eb462e', '7QO9-NPYJ-7YV3-8IFW', 0, NULL, NULL, '2025-10-10 14:10:58'),
('75645f73-24fe-42c5-ac71-aac4b2c4f7ef', '4a9b363d-8402-4e89-8055-f58064eb462e', 'T82A-EFJS-QEPB-199J', 0, NULL, NULL, '2025-10-10 14:10:58'),
('85ee6795-e691-4547-bfcd-9beabece2ff6', '4a9b363d-8402-4e89-8055-f58064eb462e', 'U0TG-QCMD-VV96-N6NH', 0, NULL, NULL, '2025-10-10 14:10:58'),
('9044fae2-ffc2-4221-a6b0-21e6d92d39ea', '4a9b363d-8402-4e89-8055-f58064eb462e', 'KC11-BXU9-DYQ7-R5CJ', 0, NULL, NULL, '2025-10-10 14:10:58'),
('945da3de-69b6-4bb4-b3a7-5c8817e21eea', '4a9b363d-8402-4e89-8055-f58064eb462e', 'UL3B-4VUK-P7M6-637A', 0, NULL, NULL, '2025-10-10 14:10:58'),
('9fa42a17-3561-4c6e-be86-cdc0269d9357', '4a9b363d-8402-4e89-8055-f58064eb462e', '42ZC-3SIY-G96A-E5CP', 0, NULL, NULL, '2025-10-10 14:10:58'),
('a4998e0c-025b-401d-9364-2e18eada8d6f', '4a9b363d-8402-4e89-8055-f58064eb462e', '8E29-ENFG-1K78-E4DU', 0, NULL, NULL, '2025-10-10 14:10:58'),
('a4afc163-1b40-47a6-a633-f9d4c285826b', '4a9b363d-8402-4e89-8055-f58064eb462e', 'RJC5-VA0I-TZLQ-C539', 0, NULL, NULL, '2025-10-10 14:10:58'),
('c42aa237-6bcd-44d1-8c66-eef900ba533e', '4a9b363d-8402-4e89-8055-f58064eb462e', 'PZ89-GVW9-B5L4-SNA9', 0, NULL, NULL, '2025-10-10 14:10:58'),
('daa02372-f7f0-4c74-a4a9-fa09010fc409', '4a9b363d-8402-4e89-8055-f58064eb462e', '3YZC-HF81-AS5Q-IEEY', 0, NULL, NULL, '2025-10-10 14:10:58'),
('df6c6318-6be9-48a3-a1fb-220e838e9ff9', '4a9b363d-8402-4e89-8055-f58064eb462e', 'K0F0-M78H-VACG-4IFI', 0, NULL, NULL, '2025-10-10 14:10:58'),
('efb062bc-3d89-4b6b-8381-e06b4911fcbc', '4a9b363d-8402-4e89-8055-f58064eb462e', 'MPFX-5O66-KC1Z-HLDS', 0, NULL, NULL, '2025-10-10 14:10:58'),
('ff4c4031-4136-4380-b3d5-d144f3d04a2d', '4a9b363d-8402-4e89-8055-f58064eb462e', 'PR28-OXZB-5GY6-AV3P', 0, NULL, NULL, '2025-10-10 14:10:58');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `api_providers`
--

CREATE TABLE `api_providers` (
  `id` char(36) NOT NULL,
  `name` varchar(100) NOT NULL,
  `type` varchar(50) NOT NULL,
  `credentials` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`credentials`)),
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Tablo döküm verisi `api_providers`
--

INSERT INTO `api_providers` (`id`, `name`, `type`, `credentials`, `is_active`, `created_at`, `updated_at`) VALUES
('5cc2d80a-d0bf-4333-b2c5-5aaebd3c7aa3', 'Cekilisbayisi', 'smm', '{\"api_url\":\"https://cekilisbayisi.com/api/v2\",\"api_key\":\"dd6a5d1ad1cda75ee74d34b238bf111c\",\"balance\":82.2550354,\"currency\":\"TRY\"}', 1, '2025-10-07 12:46:38', '2025-10-09 09:42:19');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `blog_posts`
--

CREATE TABLE `blog_posts` (
  `id` char(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `excerpt` varchar(500) DEFAULT NULL,
  `content` text NOT NULL,
  `featured_image` varchar(500) DEFAULT NULL,
  `author` varchar(100) DEFAULT NULL,
  `meta_title` varchar(255) DEFAULT NULL,
  `meta_description` varchar(500) DEFAULT NULL,
  `is_published` tinyint(1) NOT NULL DEFAULT 0,
  `published_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Tablo döküm verisi `blog_posts`
--

INSERT INTO `blog_posts` (`id`, `title`, `slug`, `excerpt`, `content`, `featured_image`, `author`, `meta_title`, `meta_description`, `is_published`, `published_at`, `created_at`, `updated_at`) VALUES
('42b8c68c-9589-40a3-82a9-401fd23406d1', 'Sosyal Medya Pazarlamasında 2024 Trendleri', 'sosyal-medya-pazarlamasinda-2024-trendleri', 'Sosyal medya pazarlamasında öne çıkan son trendler ve bu trendleri işinizde nasıl kullanabileceğiniz.', '<h2>Sosyal Medya Pazarlamasının Geleceği</h2><p>2024 yılında sosyal medya pazarlaması, markaların müşterileriyle etkileşime geçmesinin en önemli yollarından biri olmaya devam ediyor.</p><h3>Video İçerik Hakimiyeti</h3><p>Kısa video içerikler, sosyal medya platformlarında en çok tüketilen içerik türü haline geldi. TikTok, Instagram Reels ve YouTube Shorts gibi platformlar, markaların geniş kitlelere ulaşmasını sağlıyor.</p><h3>Influencer İşbirlikleri</h3><p>Mikro ve makro influencer\'larla yapılan işbirlikleri, marka bilinirliğini artırmak ve hedef kitleye ulaşmak için etkili bir strateji olmaya devam ediyor.</p>', 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&h=600&fit=crop', 'Admin', NULL, NULL, 1, '2025-10-12 11:34:11', '2025-10-12 11:34:11', '2025-10-12 11:34:11'),
('56e4088e-0195-46ae-b016-aa4d73c70379', 'En İyi Oyun Lisansları 2025s', 'en-iyi-oyun-lisanslari-2025s', '2025 yılının en popüler oyun lisansları ve önerileri. Hangi oyunları tercih etmelisiniz?', '<h2>2025 Yılının En Çok Tercih Edilen Oyunları</h2><p>Bu yıl oyun dünyasında birçok yenilik ve heyecan verici içerik bulunuyor. İşte en çok tercih edilen oyunlar:</p><h3>Aksiyon Oyunları</h3><p>Bu kategoride en popüler oyunlar arasında son çıkan AAA yapımlar yer alıyor.</p><h3>Strateji Oyunları</h3><p>Düşünmeyi seven oyuncular için harika seçenekler mevcut.</p><h3>Multiplayer Deneyimleri</h3><p>Arkadaşlarınızla oynayabileceğiniz en iyi co-op oyunlar.</p>', 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&h=600&fit=crop', 'Ahmet Yılmaz', NULL, NULL, 1, '2025-10-06 22:06:38', '2025-10-06 22:06:38', '2025-10-06 22:30:37'),
('6af13cbe-906c-4ad3-af83-4f2dcb5d5359', 'Dijital Ürün Satışında Başarı İpuçları', 'dijital-urun-satisinda-basari-ipuclari', 'Dijital ürün satışında başarılı olmak için bilmeniz gereken temel stratejiler ve ipuçları.', '<h2>Dijital Ürün Satışının Temelleri</h2><p>Dijital ürün satışı, günümüzün en karlı iş modellerinden biri haline geldi. Bu yazıda, dijital ürün satışında başarılı olmanız için bilmeniz gereken temel stratejileri paylaşacağız.</p><h3>Hedef Kitlenizi Tanıyın</h3><p>Başarılı bir dijital ürün satışı için öncelikle hedef kitlenizi iyi tanımalısınız. Müşterilerinizin ihtiyaçlarını, beklentilerini ve sorunlarını anlamak, size doğru ürünleri sunma konusunda yardımcı olacaktır.</p><h3>Kaliteli Hizmet Sunun</h3><p>Dijital ürün satışında müşteri memnuniyeti her şeyden önemlidir. Hızlı teslimat, güvenilir ödeme sistemleri ve 7/24 destek hizmeti sunarak müşterilerinizin güvenini kazanabilirsiniz.</p>', 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop', 'Admin', NULL, NULL, 1, '2025-10-12 11:34:11', '2025-10-12 11:34:11', '2025-10-12 11:34:11'),
('c33488f7-12b7-4a58-b67c-7903589da484', 'Oyun Kredileri ve E-Pin Kullanım Rehberi', 'oyun-kredileri-ve-e-pin-kullanim-rehberi', 'Oyun kredileri ve e-pin\'leri güvenli bir şekilde nasıl satın alır ve kullanırsınız? Detaylı rehberimizle öğrenin.', '<h2>E-Pin ve Oyun Kredileri Nedir?</h2><p>E-pin\'ler ve oyun kredileri, dijital oyunlar ve platformlar için kullanılan ön ödemeli kodlardır. Bu rehberde, e-pin\'leri güvenli bir şekilde nasıl satın alacağınızı ve kullanacağınızı öğreneceksiniz.</p><h3>Güvenli Satın Alma İpuçları</h3><p>E-pin satın alırken mutlaka güvenilir platformları tercih edin. Satıcının yorumlarını kontrol edin ve güvenli ödeme yöntemlerini kullanın.</p><h3>Kullanım Adımları</h3><p>E-pin\'inizi aldıktan sonra, ilgili platformun kod girme bölümüne gidin ve kodunuzu girin. Kredi veya içerik hesabınıza anında yüklenecektir.</p>', 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&h=600&fit=crop', 'Admin', NULL, NULL, 1, '2025-10-12 11:34:11', '2025-10-12 11:34:11', '2025-10-12 11:34:11'),
('c71dd534-d010-45a0-9da7-1ce4aff90dbb', 'Microsoft Office Lisansı Nasıl Seçilir?', 'microsoft-office-lisansi-nasil-secilirs', 'İşletmeniz veya kişisel kullanımınız için en uygun Office lisansını seçme rehberi.', '<h2>Office Lisans Türleri</h2><p>Microsoft Office birçok farklı lisans seçeneği sunuyor. Hangisinin sizin için uygun olduğunu belirleyelim.</p><h3>Microsoft 365 Personal</h3><p>Bireysel kullanıcılar için ideal olan bu paket, 1 PC veya Mac üzerinde kullanılabilir.</p><h3>Microsoft 365 Family</h3><p>Aile üyeleriyle paylaşabileceğiniz, 6 kişiye kadar lisans sunan ekonomik paket.</p><h3>Office Home &amp; Business</h3><p>Küçük işletmeler için tek seferlik satın alma seçeneği ile maliyet avantajı.</p><h3>Karar Verirken Nelere Dikkat Edilmeli?</h3><p>İhtiyacınız olan programlar, cihaz sayısı ve bütçenizi göz önünde bulundurarak karar verin.</p>', NULL, 'Ayşa', NULL, NULL, 1, '2025-10-06 22:06:38', '2025-10-06 22:06:38', '2025-10-09 09:29:03'),
('d8db9721-6067-40be-8122-5605dba2bc7f', 'Spotify Premium vs YouTube Music', 'spotify-premium-vs-youtube-music', 'İki popüler müzik platformunu karşılaştırdık. Hangisi sizin için daha uygun?', '<h2>Müzik Platformları Karşılaştırması</h2><p>Günümüzde müzik dinleme alışkanlıklarımız tamamen değişti. Peki hangi platform sizin için daha uygun?</p><h3>Spotify Premium Avantajları</h3><ul><li>Geniş müzik kütüphanesi</li><li>Kişiselleştirilmiş çalma listeleri</li><li>Yüksek ses kalitesi</li><li>Offline dinleme</li></ul><h3>YouTube Music Avantajları</h3><ul><li>YouTube videolarına erişim</li><li>Geniş içerik yelpazesi</li><li>Remix ve cover versiyonlar</li><li>YouTube Premium ile entegrasyon</li></ul><h3>Fiyat Karşılaştırması</h3><p>Her iki platform da rekabetçi fiyatlar sunuyor. Öğrenci ve aile paketleriyle maliyet avantajı sağlayabilirsiniz.</p>', 'https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=800&h=600&fit=crop', 'Mehmet Kaya', NULL, NULL, 1, '2025-10-06 22:06:38', '2025-10-06 22:06:38', '2025-10-06 22:06:38'),
('e1159124-e6f4-4569-8df8-ed762e7b4b9e', 'Dijital Ürünlerde Güvenlik İpuçları', 'dijital-urunlerde-guvenlik-ipuclari', 'Dijital ürünleri satın alırken güvenliğinizi sağlamak için bilmeniz gereken önemli ipuçları.', '<h2>Güvenli Alışverişin Temel Kuralları</h2><p>Dijital ürünler satın alırken dikkat etmeniz gereken en önemli noktalar nelerdir? Bu yazıda sizin için önemli güvenlik ipuçlarını derledik.</p><h3>1. Güvenilir Platformları Tercih Edin</h3><p>Her zaman SSL sertifikası olan ve güvenli ödeme yöntemlerine sahip platformları kullanın.</p><h3>2. Şifre Güvenliği</h3><p>Hesaplarınız için güçlü ve benzersiz şifreler kullanın. İki faktörlü kimlik doğrulamayı aktif edin.</p><h3>3. Ödeme Bilgilerinizi Koruyun</h3><p>Kredi kartı bilgilerinizi sadece güvenilir platformlarda paylaşın ve düzenli olarak hesap hareketlerinizi kontrol edin.</p>', 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&h=600&fit=crop', 'Dijimin Ekibi', NULL, NULL, 1, '2025-10-06 22:06:38', '2025-10-06 22:06:38', '2025-10-06 22:06:38');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `cart_items`
--

CREATE TABLE `cart_items` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `product_id` char(36) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `options` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`options`)),
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Tablo döküm verisi `cart_items`
--

INSERT INTO `cart_items` (`id`, `user_id`, `product_id`, `quantity`, `options`, `created_at`, `updated_at`) VALUES
('5ab2d936-1113-4a7b-bca7-2a4d8bc2b7be', 'd279bb9d-797d-4972-a8bd-a77a40caba91', '0132e42e-d46a-444d-9080-a419aec29c9c', 1, NULL, '2025-10-15 08:22:08', '2025-10-15 08:22:08'),
('91a79fb5-ada0-4889-bd88-80630b02053a', '7129bc31-88dc-42da-ab80-415a21f2ea9a', '0132e42e-d46a-444d-9080-a419aec29c9c', 1, NULL, '2025-10-16 07:49:45', '2025-10-16 07:49:45');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `categories`
--

CREATE TABLE `categories` (
  `id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `icon` varchar(100) DEFAULT NULL,
  `parent_id` char(36) DEFAULT NULL,
  `is_featured` tinyint(1) NOT NULL DEFAULT 0,
  `display_order` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Tablo döküm verisi `categories`
--

INSERT INTO `categories` (`id`, `name`, `slug`, `description`, `image_url`, `icon`, `parent_id`, `is_featured`, `display_order`, `created_at`, `updated_at`) VALUES
('12b202f2-144e-44f6-b2d8-04dac0ad900b', 'Steam Ürünleri', 'steam', 'Popüler Steam oyunları ve içerikleri', NULL, NULL, NULL, 0, 0, '2025-10-06 17:17:39', '2025-10-19 14:50:52'),
('2f5f92ed-ed22-44e7-a92a-337e8956ce42', 'Adobe', 'adobe', 'Adobe ürünleri', 'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760107494789.png', NULL, NULL, 0, 0, '2025-10-10 14:45:00', '2025-10-19 14:50:52'),
('37993932-f635-4ec4-864a-912ebb093b86', 'Tasarım Araçları', 'design', 'Adobe, Canva ve grafik programları', NULL, NULL, NULL, 0, 0, '2025-10-06 17:17:39', '2025-10-19 14:50:52'),
('5e300196-8b4e-44d9-9020-d1fccccbe249', 'Instagram Takipçi', 'instagram-takipci-satin-al', 'Instagram takipçi satın al', NULL, NULL, NULL, 0, 2, '2025-10-07 12:51:44', '2025-10-19 14:50:52'),
('6675e932-657a-47cc-bf91-f2bfaba28ef3', 'Mail Hesapları', 'mail-hesaplari', 'Mail Hesapları', 'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760083082362.png', NULL, NULL, 0, 3, '2025-10-10 07:58:15', '2025-10-19 14:50:52'),
('8cef7f1f-e31a-4007-ade3-fb513368f210', 'Sosyal Medya', 'sosyal-medya', 'Sosyal Medya Hizmetleri', 'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760107566358.jpg', NULL, NULL, 0, 0, '2025-10-10 14:46:09', '2025-10-19 14:50:52'),
('ad366810-9c8c-4b3e-b493-d6b3fce09875', 'UC', 'pubg-uc', 'PUBG UC Satışı', 'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1759874086774.webp', NULL, 'cb82fb5b-abb4-4a08-b4da-2511b0a7e161', 0, 0, '2025-10-07 08:19:35', '2025-10-19 14:50:52'),
('cb82fb5b-abb4-4a08-b4da-2511b0a7e161', 'PUBG', 'pubg', 'PUBG Kategori', NULL, NULL, NULL, 0, 0, '2025-10-07 08:19:21', '2025-10-19 14:50:52'),
('ce780bbd-38e7-469e-a18a-9e51998e04d6', 'Office', 'office', 'Office programı lisans ürünleri.', 'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760107287951.webp', NULL, NULL, 0, 10, '2025-10-10 14:41:33', '2025-10-19 14:50:52'),
('d960ecae-8fcd-4084-bdfb-369464bd87b4', 'Windows', 'windows', 'Windows lisans ürünleri.', 'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760107242369.png', NULL, NULL, 0, 11, '2025-10-10 14:40:54', '2025-10-19 14:50:52'),
('d9a27929-1471-427d-9d28-418e6fc340e3', 'Geliştirici Araçları', 'development', 'IDE, hosting ve geliştirme araçları', 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&h=600&fit=crop', NULL, NULL, 0, 1, '2025-10-06 17:17:39', '2025-10-19 14:50:52'),
('eb9c13a1-386a-45f7-b41a-969219dc28a5', 'Yazılımlar', 'software', 'İşletim sistemleri ve ofis programları', NULL, NULL, NULL, 0, 5, '2025-10-06 17:17:39', '2025-10-19 14:50:52'),
('f6b5f01c-a7b9-48ee-bbdb-9b44b4bf8398', 'Yapay Zeka', 'yapay-zeka', 'Yapay zeka ürünleri.', 'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760110233740.jpg', NULL, NULL, 0, 12, '2025-10-10 15:30:56', '2025-10-19 14:50:52'),
('f810f0b8-3adc-4cfd-8c5e-02813094a9a8', 'SEO', 'seo', 'SEO araçları program lisansları', 'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760107448033.png', NULL, NULL, 0, 0, '2025-10-10 14:44:13', '2025-10-19 14:50:52');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `coupons`
--

CREATE TABLE `coupons` (
  `id` char(36) NOT NULL,
  `code` varchar(50) NOT NULL,
  `discount_type` enum('percentage','fixed') NOT NULL,
  `discount_value` decimal(10,2) NOT NULL,
  `min_purchase` decimal(10,2) DEFAULT NULL,
  `max_discount` decimal(10,2) DEFAULT NULL,
  `usage_limit` int(11) DEFAULT NULL,
  `used_count` int(11) NOT NULL DEFAULT 0,
  `valid_from` datetime DEFAULT NULL,
  `valid_until` datetime DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Tablo döküm verisi `coupons`
--

INSERT INTO `coupons` (`id`, `code`, `discount_type`, `discount_value`, `min_purchase`, `max_discount`, `usage_limit`, `used_count`, `valid_from`, `valid_until`, `is_active`, `created_at`, `updated_at`) VALUES
('07e668cd-2f84-4182-a35e-f55cebf893d8', '2025', 'percentage', 25.00, 500.00, NULL, NULL, 3, '2025-10-07 00:00:00', NULL, 1, '2025-10-07 13:17:24', '2025-10-15 20:33:57');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `custom_pages`
--

CREATE TABLE `custom_pages` (
  `id` char(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `content` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`content`)),
  `meta_title` varchar(255) DEFAULT NULL,
  `meta_description` varchar(500) DEFAULT NULL,
  `is_published` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Tablo döküm verisi `custom_pages`
--

INSERT INTO `custom_pages` (`id`, `title`, `slug`, `content`, `meta_title`, `meta_description`, `is_published`, `created_at`, `updated_at`) VALUES
('840eeb6f-0e13-4123-8e8c-767d927b7c21', 'Hakkımızda', 'hakkimizda', '{\"html\":\"<div class=\\\"container mx-auto px-4 py-12\\\">\\n    <h1 class=\\\"text-4xl font-bold mb-8\\\">Hakkımızda</h1>\\n    \\n    <div class=\\\"prose max-w-none\\\">\\n      <h2 class=\\\"text-2xl font-bold mb-4 mt-8\\\">Dijital Dünyanın Güvenilir Adresi</h2>\\n      <p class=\\\"text-muted-foreground mb-6\\\">\\n        2020 yılında kurulan dijital ürünler platformumuz, müşterilerimize en kaliteli ve güvenilir dijital ürünleri sunmayı amaçlamaktadır. Oyun kodlarından yazılım lisanslarına, dijital hizmetlerden hediye kartlarına kadar geniş bir ürün yelpazesiyle hizmet vermekteyiz.\\n      </p>\\n\\n      <h2 class=\\\"text-2xl font-bold mb-4 mt-8\\\">Misyonumuz</h2>\\n      <p class=\\\"text-muted-foreground mb-6\\\">\\n        Dijital dünyada güvenilir, hızlı ve kaliteli hizmet sunarak müşterilerimizin dijital ihtiyaçlarını karşılamak ve onlara en iyi alışveriş deneyimini yaşatmaktır.\\n      </p>\\n\\n      <h2 class=\\\"text-2xl font-bold mb-4 mt-8\\\">Vizyonumuz</h2>\\n      <p class=\\\"text-muted-foreground mb-6\\\">\\n        Türkiye\'nin en güvenilir ve tercih edilen dijital ürünler platformu olmak, müşteri memnuniyetini her zaman ön planda tutarak sektörde öncü konumda yer almaktır.\\n      </p>\\n\\n      <h2 class=\\\"text-2xl font-bold mb-4 mt-8\\\">Neden Bizi Tercih Etmelisiniz?</h2>\\n      <ul class=\\\"list-disc pl-6 space-y-2 text-muted-foreground mb-6\\\">\\n        <li><strong>Güvenilirlik:</strong> %100 orijinal ürünler ve güvenli ödeme sistemleri</li>\\n        <li><strong>Hızlı Teslimat:</strong> Anında dijital teslimat ile zaman kaybı yok</li>\\n        <li><strong>7/24 Destek:</strong> Her zaman yanınızdayız, sorunlarınızı çözüyoruz</li>\\n        <li><strong>Uygun Fiyat:</strong> En rekabetçi fiyatlarla kaliteli hizmet</li>\\n        <li><strong>Geniş Ürün Yelpazesi:</strong> Binlerce dijital ürün seçeneği</li>\\n      </ul>\\n\\n      <h2 class=\\\"text-2xl font-bold mb-4 mt-8\\\">İletişim</h2>\\n      <p class=\\\"text-muted-foreground mb-6\\\">\\n        Sorularınız, önerileriniz veya destek talepleriniz için bizimle iletişime geçebilirsiniz. Müşteri memnuniyeti bizim için önceliklidir.\\n      </p>\\n    </div>\\n  </div>\"}', NULL, NULL, 1, '2025-10-15 13:07:17', '2025-10-15 13:07:17'),
('85b0ef9a-8f08-431b-b7d9-184b16b08426', 'İade Şartları', 'iade-sartlari', '{\"html\":\"<div class=\\\"container mx-auto px-4 py-12\\\">\\n    <h1 class=\\\"text-4xl font-bold mb-8\\\">İade ve Cayma Hakkı Şartları</h1>\\n    \\n    <div class=\\\"prose max-w-none\\\">\\n      <h2 class=\\\"text-2xl font-bold mb-4 mt-8\\\">1. Genel Hükümler</h2>\\n      <p class=\\\"text-muted-foreground mb-6\\\">\\n        Dijital ürünlerin satışında, ürünün niteliği gereği cayma hakkı uygulanmamaktadır. 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği uyarınca, dijital içerik ve hizmetler cayma hakkı kapsamı dışındadır.\\n      </p>\\n\\n      <h2 class=\\\"text-2xl font-bold mb-4 mt-8\\\">2. Dijital Ürünlerde İade</h2>\\n      <p class=\\\"text-muted-foreground mb-6\\\">\\n        Satın aldığınız dijital ürünler (oyun kodları, yazılım lisansları, hediye kartları vb.) hemen teslimat yapıldığından ve kullanıma sunulduğundan iade edilemez. Ancak aşağıdaki durumlarda iade ve değişim talep edebilirsiniz:\\n      </p>\\n      <ul class=\\\"list-disc pl-6 space-y-2 text-muted-foreground mb-6\\\">\\n        <li>Teslim edilen ürün kodunun çalışmaması</li>\\n        <li>Yanlış ürünün teslimatı</li>\\n        <li>Teknik arıza nedeniyle ürünün kullanılamaması</li>\\n        <li>Platformumuzdan kaynaklanan hataların olması</li>\\n      </ul>\\n\\n      <h2 class=\\\"text-2xl font-bold mb-4 mt-8\\\">3. İade Süreci</h2>\\n      <p class=\\\"text-muted-foreground mb-6\\\">\\n        Yukarıda belirtilen durumlarla karşılaştığınızda, satın alma tarihinden itibaren 7 gün içerisinde destek ekibimize başvurabilirsiniz. İade talepleriniz için:\\n      </p>\\n      <ul class=\\\"list-disc pl-6 space-y-2 text-muted-foreground mb-6\\\">\\n        <li>Sipariş numaranızı belirtiniz</li>\\n        <li>Sorunun detaylı açıklamasını yapınız</li>\\n        <li>Varsa hata ekran görüntüsünü paylaşınız</li>\\n      </ul>\\n\\n      <h2 class=\\\"text-2xl font-bold mb-4 mt-8\\\">4. İade Onayı ve Süre</h2>\\n      <p class=\\\"text-muted-foreground mb-6\\\">\\n        İade talebiniz incelendikten sonra 2-5 iş günü içerisinde size dönüş yapılacaktır. Onaylanan iade talepleri için:\\n      </p>\\n      <ul class=\\\"list-disc pl-6 space-y-2 text-muted-foreground mb-6\\\">\\n        <li>Ürün değişimi yapılabilir</li>\\n        <li>Ödeme iadesi hesabınıza yapılabilir</li>\\n        <li>Hesap bakiyenize iade edilebilir</li>\\n      </ul>\\n\\n      <h2 class=\\\"text-2xl font-bold mb-4 mt-8\\\">5. İade Edilemeyecek Durumlar</h2>\\n      <p class=\\\"text-muted-foreground mb-6\\\">\\n        Aşağıdaki durumlarda iade talepleri kabul edilmeyecektir:\\n      </p>\\n      <ul class=\\\"list-disc pl-6 space-y-2 text-muted-foreground mb-6\\\">\\n        <li>Ürün kodunun kullanılmış olması</li>\\n        <li>Müşteri hatası nedeniyle yanlış ürün alınması</li>\\n        <li>Ürün açıklamasında belirtilen özelliklerle uyumlu teslimat yapılması</li>\\n        <li>7 günlük sürenin geçmesi</li>\\n      </ul>\\n\\n      <h2 class=\\\"text-2xl font-bold mb-4 mt-8\\\">6. İletişim</h2>\\n      <p class=\\\"text-muted-foreground mb-6\\\">\\n        İade ve cayma hakkı ile ilgili sorularınız için destek ekibimizle iletişime geçebilirsiniz.\\n      </p>\\n    </div>\\n  </div>\"}', NULL, NULL, 1, '2025-10-15 13:07:17', '2025-10-15 13:07:17'),
('a6d9b2c3-7946-4e04-a8c3-d5962d6900d4', 'Gizlilik Sözleşmesi', 'gizlilik-sozlesmesi', '{\"html\":\"<p>qweqweqwe</p>\"}', NULL, NULL, 1, '2025-10-09 18:40:45', '2025-10-09 18:40:45'),
('d08dba17-56d9-48c1-b30e-824b390e0009', 'Hizmet Sözleşmesi', 'hizmet-sozlesmesi', '{\"html\":\"<div class=\\\"container mx-auto px-4 py-12\\\">\\n    <h1 class=\\\"text-4xl font-bold mb-8\\\">Mesafeli Satış Sözleşmesi</h1>\\n    \\n    <div class=\\\"prose max-w-none\\\">\\n      <h2 class=\\\"text-2xl font-bold mb-4 mt-8\\\">1. Taraflar</h2>\\n      <p class=\\\"text-muted-foreground mb-6\\\">\\n        İşbu sözleşme, dijital ürünler platformumuz (bundan sonra \\\"SATICI\\\" olarak anılacaktır) ile platformumuzu kullanan müşteri (bundan sonra \\\"ALICI\\\" olarak anılacaktır) arasında akdedilmiştir.\\n      </p>\\n\\n      <h2 class=\\\"text-2xl font-bold mb-4 mt-8\\\">2. Sözleşmenin Konusu</h2>\\n      <p class=\\\"text-muted-foreground mb-6\\\">\\n        İşbu sözleşme, ALICI\'nın SATICI\'ya ait internet sitesi üzerinden elektronik ortamda siparişini verdiği dijital ürünlerin satışı ve teslimi ile ilgili olarak 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmelere Dair Yönetmelik hükümleri gereğince tarafların hak ve yükümlülüklerini düzenler.\\n      </p>\\n\\n      <h2 class=\\\"text-2xl font-bold mb-4 mt-8\\\">3. Ürün Bilgileri</h2>\\n      <p class=\\\"text-muted-foreground mb-6\\\">\\n        Satışa konu ürünlerin temel özellikleri (türü, miktarı, marka/modeli, rengi, adedi) ürün sayfasında yer almaktadır. ALICI, sipariş vermeden önce ürün bilgilerini incelemiş ve bilgilendirilmiş sayılır.\\n      </p>\\n\\n      <h2 class=\\\"text-2xl font-bold mb-4 mt-8\\\">4. Fiyat ve Ödeme</h2>\\n      <p class=\\\"text-muted-foreground mb-6\\\">\\n        Ürünlerin satış fiyatı, ürün sayfasında gösterilen fiyattır. Fiyatlar KDV dahildir. SATICI, kampanya süresince veya stok durumuna göre fiyatlarda değişiklik yapma hakkını saklı tutar.\\n      </p>\\n      <p class=\\\"text-muted-foreground mb-6\\\">\\n        Ödeme şekilleri:\\n      </p>\\n      <ul class=\\\"list-disc pl-6 space-y-2 text-muted-foreground mb-6\\\">\\n        <li>Kredi Kartı / Banka Kartı</li>\\n        <li>Havale / EFT</li>\\n        <li>Hesap Bakiyesi</li>\\n        <li>Diğer elektronik ödeme yöntemleri</li>\\n      </ul>\\n\\n      <h2 class=\\\"text-2xl font-bold mb-4 mt-8\\\">5. Teslimat</h2>\\n      <p class=\\\"text-muted-foreground mb-6\\\">\\n        Dijital ürünler, ödeme onayından sonra anında veya belirtilen süre içerisinde elektronik ortamda ALICI\'ya teslim edilir. Teslimat, ALICI\'nın kayıtlı e-posta adresine veya hesap panelindeki sipariş detayları bölümüne yapılır.\\n      </p>\\n\\n      <h2 class=\\\"text-2xl font-bold mb-4 mt-8\\\">6. Cayma Hakkı</h2>\\n      <p class=\\\"text-muted-foreground mb-6\\\">\\n        6502 sayılı Tüketicinin Korunması Hakkında Kanun\'un 15. maddesi ve Mesafeli Sözleşmeler Yönetmeliği\'nin 15. maddesi gereğince, dijital içerik ve hizmetlerin sunulması ile birlikte cayma hakkı sona erer. ALICI, dijital ürünü teslim almakla cayma hakkından vazgeçtiğini kabul eder.\\n      </p>\\n\\n      <h2 class=\\\"text-2xl font-bold mb-4 mt-8\\\">7. Garanti ve Sorumluluk</h2>\\n      <p class=\\\"text-muted-foreground mb-6\\\">\\n        SATICI, teslim edilen dijital ürünlerin orijinal ve çalışır durumda olduğunu garanti eder. Ürünle ilgili teknik sorunlar için 7 gün içerisinde destek ekibimize başvurulabilir.\\n      </p>\\n\\n      <h2 class=\\\"text-2xl font-bold mb-4 mt-8\\\">8. Kişisel Verilerin Korunması</h2>\\n      <p class=\\\"text-muted-foreground mb-6\\\">\\n        ALICI\'nın kişisel bilgileri, 6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında işlenir ve korunur. Detaylı bilgi için Gizlilik Politikamızı inceleyebilirsiniz.\\n      </p>\\n\\n      <h2 class=\\\"text-2xl font-bold mb-4 mt-8\\\">9. Uyuşmazlıkların Çözümü</h2>\\n      <p class=\\\"text-muted-foreground mb-6\\\">\\n        İşbu sözleşmeden doğan uyuşmazlıklarda, Tüketici Hakem Heyetleri ve Tüketici Mahkemeleri yetkilidir. ALICI, sipariş verdiği anda bu sözleşmeyi kabul etmiş sayılır.\\n      </p>\\n\\n      <h2 class=\\\"text-2xl font-bold mb-4 mt-8\\\">10. Yürürlük</h2>\\n      <p class=\\\"text-muted-foreground mb-6\\\">\\n        İşbu sözleşme, ALICI tarafından elektronik ortamda onaylanmasıyla yürürlüğe girer. SATICI, sözleşmede değişiklik yapma hakkını saklı tutar.\\n      </p>\\n    </div>\\n  </div>\"}', NULL, NULL, 1, '2025-10-15 13:07:17', '2025-10-15 13:07:17');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `email_templates`
--

CREATE TABLE `email_templates` (
  `id` char(36) NOT NULL,
  `name` varchar(100) NOT NULL,
  `subject` varchar(255) NOT NULL,
  `body` text NOT NULL,
  `variables` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`variables`)),
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Tablo döküm verisi `email_templates`
--

INSERT INTO `email_templates` (`id`, `name`, `subject`, `body`, `variables`, `created_at`, `updated_at`) VALUES
('4290e3d9-d5b8-4423-aab2-1cbc85bee59b', 'ticket_replied', 'Destek Talebiniz Yanıtlandı - {{site_name}}', '<h1 class=\"ql-align-center\">Destek Talebiniz Yanıtlandı</h1><p>Merhaba <strong>{{user_name}}</strong>,</p><p>Destek talebiniz yanıtlandı.</p><p><br></p><p>Detayları görüntülemek için kullanıcı paneline giriş yapabilirsiniz.</p><p>Saygılarımızla,</p><p>{{site_name}} Ekibi</p>', '\"[\\\"user_name\\\",\\\"ticket_id\\\",\\\"ticket_subject\\\",\\\"reply_message\\\",\\\"site_name\\\"]\"', '2025-10-09 19:38:58', '2025-10-13 20:28:47'),
('4f85350b-c082-4677-bd9f-ad1e7d9bd038', 'order_item_delivery', 'Ürününüz Teslim Edildi - {{product_name}}', '<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;\">\n  <h1 style=\"color: #10b981; text-align: center;\">✓ Ürününüz Teslim Edildi</h1>\n  <p style=\"color: #666; font-size: 16px;\">Merhaba <strong>{{customer_name}}</strong>,</p>\n  <p style=\"color: #666; font-size: 16px;\">Siparişinize ait ürününüz teslim edilmiştir.</p>\n  \n  <div style=\"background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;\">\n    <p style=\"margin: 0 0 10px 0; color: #666;\"><strong>Sipariş No:</strong> {{order_number}}</p>\n    <p style=\"margin: 0 0 10px 0; color: #666;\"><strong>Ürün:</strong> {{product_name}}</p>\n  </div>\n  \n  <div style=\"background: #e8f5e9; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #10b981;\">\n    <h3 style=\"margin-top: 0; color: #10b981;\">Teslimat Bilgileri:</h3>\n    <pre style=\"background: white; padding: 15px; border-radius: 5px; color: #333; white-space: pre-wrap; word-wrap: break-word;\">{{delivery_content}}</pre>\n  </div>\n  \n  <p style=\"color: #666; font-size: 14px; margin-top: 20px;\">\n    <strong>Not:</strong> Bu bilgileri güvenli bir şekilde saklayınız. Hesabınızdan tüm siparişlerinizi görüntüleyebilirsiniz.\n  </p>\n  \n  <p style=\"color: #666; font-size: 16px;\">Saygılarımızla,<br>{{site_name}} Ekibi</p>\n</div>', '\"[\\\"customer_name\\\",\\\"order_number\\\",\\\"product_name\\\",\\\"delivery_content\\\",\\\"site_name\\\"]\"', '2025-10-16 08:13:25', '2025-10-16 08:13:25'),
('547e8ec8-2746-4bb8-9be3-3db4d186697d', 'order_completed', 'Siparişiniz Tamamlandı - {{site_name}}', '<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;\">\n    <h1 style=\"color: #10b981; text-align: center;\">✓ Siparişiniz Tamamlandı</h1>\n    <p style=\"color: #666; font-size: 16px;\">Merhaba <strong>{{customer_name}}</strong>,</p>\n    <p style=\"color: #666; font-size: 16px;\">Siparişiniz başarıyla tamamlandı ve ürünleriniz teslim edildi.</p>\n    <div style=\"background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;\">\n      <p style=\"margin: 0 0 10px 0; color: #666;\"><strong>Sipariş No:</strong> {{order_number}}</p>\n      <p style=\"margin: 0; color: #666;\"><strong>Toplam Tutar:</strong> {{final_amount}} TL</p>\n    </div>\n    <p style=\"color: #666; font-size: 16px;\">Ürünlerinizi hesabınızdan görüntüleyebilirsiniz.</p>\n    <p style=\"color: #666; font-size: 16px;\">Deneyiminizi paylaşmak isterseniz değerlendirme yapabilirsiniz.</p>\n    <p style=\"color: #666; font-size: 16px;\">Saygılarımızla,<br>{{site_name}} Ekibi</p>\n  </div>', '\"[\\\"customer_name\\\",\\\"order_number\\\",\\\"final_amount\\\",\\\"site_name\\\"]\"', '2025-10-09 19:38:58', '2025-10-09 19:38:58'),
('5adeb7c9-e07b-4a36-9e49-460cd626cf8c', 'order_received', 'Siparişiniz Alındı - {{site_name}}', '<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;\">\n    <h1 style=\"color: #333; text-align: center;\">Siparişiniz Alındı</h1>\n    <p style=\"color: #666; font-size: 16px;\">Merhaba <strong>{{customer_name}}</strong>,</p>\n    <p style=\"color: #666; font-size: 16px;\">Siparişiniz başarıyla alındı ve işleme alındı.</p>\n    <div style=\"background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;\">\n      <p style=\"margin: 0 0 10px 0; color: #666;\"><strong>Sipariş No:</strong> {{order_number}}</p>\n      <p style=\"margin: 0 0 10px 0; color: #666;\"><strong>Toplam Tutar:</strong> {{final_amount}} TL</p>\n      <p style=\"margin: 0; color: #666;\"><strong>Durum:</strong> {{status}}</p>\n    </div>\n    <p style=\"color: #666; font-size: 16px;\">Siparişinizin durumunu hesabınızdan takip edebilirsiniz.</p>\n    <p style=\"color: #666; font-size: 16px;\">Saygılarımızla,<br>{{site_name}} Ekibi</p>\n  </div>', '\"[\\\"customer_name\\\",\\\"order_number\\\",\\\"final_amount\\\",\\\"status\\\",\\\"site_name\\\"]\"', '2025-10-09 19:38:58', '2025-10-09 19:38:58'),
('d75ec05a-bac7-446a-ac2a-cfc7b7f2dd07', 'deposit_success', 'Bakiye Yükleme Onaylandı - {{site_name}}', '<h1 class=\"ql-align-center\">✓ Bakiye Yükleme Başarılı</h1><p>Merhaba <strong>{{user_name}}</strong>,</p><p>Bakiye yükleme talebiniz onaylandı ve hesabınıza eklendi.</p><p><br></p><p><strong>Yüklenen Tutar:</strong> {{amount}} TL</p><p><strong>Yeni Bakiye:</strong> {{new_balance}} TL</p><p>Artık alışverişe başlayabilirsiniz!</p><p>Saygılarımızla,</p><p>{{site_name}} Ekibi</p>', '\"[\\\"user_name\\\",\\\"amount\\\",\\\"new_balance\\\",\\\"site_name\\\"]\"', '2025-10-09 19:38:58', '2025-10-09 19:49:38'),
('da91f94a-bfe1-46b7-83fc-b4152e27c65e', 'password_reset', 'Şifre Sıfırlama Talebi - {{site_name}}', '<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;\">\n    <h1 style=\"color: #333; text-align: center;\">Şifre Sıfırlama</h1>\n    <p style=\"color: #666; font-size: 16px;\">Merhaba,</p>\n    <p style=\"color: #666; font-size: 16px;\">Hesabınız için şifre sıfırlama talebi aldık.</p>\n    <div style=\"background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center;\">\n      <a href=\"{{reset_link}}\" style=\"display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;\">Şifremi Sıfırla</a>\n    </div>\n    <p style=\"color: #666; font-size: 14px;\">Bu linkin geçerlilik süresi 1 saattir.</p>\n    <p style=\"color: #666; font-size: 14px;\">Bu talebi siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.</p>\n    <p style=\"color: #666; font-size: 16px;\">Saygılarımızla,<br>{{site_name}} Ekibi</p>\n  </div>', '\"[\\\"reset_link\\\",\\\"site_name\\\"]\"', '2025-10-09 19:38:58', '2025-10-09 19:38:58'),
('dd5ecc0c-ab34-499a-8103-7a435472794a', 'order_cancelled', 'Sipariş İptali - {{site_name}}', '<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;\">\n    <h1 style=\"color: #ef4444; text-align: center;\">Siparişiniz İptal Edildi</h1>\n    <p style=\"color: #666; font-size: 16px;\">Merhaba <strong>{{customer_name}}</strong>,</p>\n    <p style=\"color: #666; font-size: 16px;\">Siparişiniz iptal edildi.</p>\n    <div style=\"background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;\">\n      <p style=\"margin: 0 0 10px 0; color: #666;\"><strong>Sipariş No:</strong> {{order_number}}</p>\n      <p style=\"margin: 0 0 10px 0; color: #666;\"><strong>Tutar:</strong> {{final_amount}} TL</p>\n      <p style=\"margin: 0; color: #666;\"><strong>İptal Nedeni:</strong> {{cancellation_reason}}</p>\n    </div>\n    <p style=\"color: #666; font-size: 16px;\">Ödemeniz varsa iade işlemi başlatılacaktır.</p>\n    <p style=\"color: #666; font-size: 16px;\">Sorularınız için bizimle iletişime geçebilirsiniz.</p>\n    <p style=\"color: #666; font-size: 16px;\">Saygılarımızla,<br>{{site_name}} Ekibi</p>\n  </div>', '\"[\\\"customer_name\\\",\\\"order_number\\\",\\\"final_amount\\\",\\\"cancellation_reason\\\",\\\"site_name\\\"]\"', '2025-10-09 19:38:58', '2025-10-09 19:38:58'),
('e7fae474-c1cf-4600-8466-2f915146cfb9', 'welcome', 'Hesabiniz Oluşturuldu - {{site_name}}', '<h1 class=\"ql-align-center\">Hesabınız Oluşturuldu</h1><p>Merhaba <strong>{{user_name}}</strong>,</p><p>{{site_name}} ailesine hoş geldiniz! Hesabınız başarıyla oluşturuldu.</p><p><br></p><p>E-posta: <strong>{{user_email}}</strong></p><p>Herhangi bir sorunuz olursa bizimle iletişime geçmekten çekinmeyin.</p><p>Saygılarımızla,</p><p>{{site_name}} Ekibi</p>', '\"[\\\"user_name\\\",\\\"user_email\\\",\\\"site_name\\\"]\"', '2025-10-09 19:38:58', '2025-10-13 15:06:38');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `fake_order_notifications`
--

CREATE TABLE `fake_order_notifications` (
  `id` char(36) NOT NULL,
  `product_name` varchar(255) NOT NULL,
  `customer` varchar(100) NOT NULL,
  `location` varchar(100) DEFAULT NULL,
  `time_ago` varchar(50) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `footer_sections`
--

CREATE TABLE `footer_sections` (
  `id` char(36) NOT NULL,
  `title` varchar(100) NOT NULL,
  `links` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`links`)),
  `order_num` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Tablo döküm verisi `footer_sections`
--

INSERT INTO `footer_sections` (`id`, `title`, `links`, `order_num`, `created_at`, `updated_at`) VALUES
('59583ef1-0ba1-4c7c-b806-84fd204b52b9', 'Hızlı Erişim', '[]', 0, '2025-10-15 20:05:22', '2025-10-15 20:05:22'),
('f942a930-6743-4ecc-b4b3-1fd6b77f9d77', 'Kurumsal', '[]', 1, '2025-10-15 20:05:22', '2025-10-15 20:08:21');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `menu_items`
--

CREATE TABLE `menu_items` (
  `id` char(36) NOT NULL,
  `label` varchar(100) NOT NULL,
  `url` varchar(500) NOT NULL,
  `parent_id` char(36) DEFAULT NULL,
  `order_num` int(11) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Tablo döküm verisi `menu_items`
--

INSERT INTO `menu_items` (`id`, `label`, `url`, `parent_id`, `order_num`, `is_active`, `created_at`, `updated_at`) VALUES
('24c49639-01d0-4274-8fb9-c31ed64d0726', 'Kullanım Koşulları', '/kullanim-kosullari', NULL, 11, 1, '2025-10-06 22:41:23', '2025-10-15 20:13:24'),
('25740da6-c0f2-4c1d-b131-998018699bfd', 'Hakkımızda', '/hakkimizda', NULL, 1, 1, '2025-10-06 22:41:23', '2025-10-15 20:13:23'),
('2e32b68d-ae71-4d44-8770-95b8dfb03c36', 'Kampanyalar', '/kampanyalar', NULL, 3, 1, '2025-10-06 22:41:23', '2025-10-15 20:13:23'),
('3d325c92-d59e-4730-8301-5c9bcff463bc', 'KVKK', '/kvkk', NULL, 6, 1, '2025-10-06 22:41:23', '2025-10-15 20:13:23'),
('455c6ddf-658b-4c0f-8a9e-0b104708dd07', 'İletişim', '/iletisim', NULL, 4, 1, '2025-10-06 22:41:23', '2025-10-15 20:02:06'),
('5f4e71bd-4bcd-4e85-9065-243cdf2dc2d1', 'Blog', '/blog', NULL, 3, 1, '2025-10-06 22:41:23', '2025-10-15 20:02:06'),
('6230f5b8-858f-4809-bebc-37c35d51e08f', 'İletişim', '/iletisim', NULL, 7, 1, '2025-10-06 22:41:23', '2025-10-15 20:13:24'),
('6a4f6b37-ed99-4d98-8c54-d658096aacde', 'SSS', '/sss', NULL, 2, 1, '2025-10-06 22:41:23', '2025-10-15 20:13:23'),
('71c28444-7b6e-47ae-92be-f59206a1b820', 'Gizlilik Politikası', '/gizlilik-politikasi', NULL, 5, 1, '2025-10-06 22:41:23', '2025-10-15 20:13:23'),
('9fa999a9-9e47-4a3c-9dac-6afba197d79c', 'İade ve Değişim', '/iade-degisim', NULL, 4, 1, '2025-10-06 22:41:23', '2025-10-15 20:13:24'),
('9fe03852-2246-4368-9966-5fd0146f3dad', 'Kategoriler', '/kategoriler', NULL, 1, 1, '2025-10-06 22:41:23', '2025-10-15 20:02:06'),
('c47a1c3f-cea1-4780-9381-77336bc8ac59', 'Kategoriler', '/kategoriler', NULL, 8, 1, '2025-10-06 22:41:23', '2025-10-15 20:13:23'),
('ceed431a-aafb-4aba-bf1f-6217b3960c01', 'Blog', '/blog', NULL, 0, 1, '2025-10-06 22:41:23', '2025-10-15 20:13:23'),
('d8ec7f51-384f-400a-9ac6-3a179cb89087', 'Ödeme Yöntemleri', '/odeme-yontemleri', NULL, 10, 1, '2025-10-06 22:41:23', '2025-10-15 20:13:24'),
('f1573cc3-5392-448b-89eb-d0e02e947c6d', 'Nasıl Sipariş Verilir?', '/nasil-siparis-verilir', NULL, 9, 1, '2025-10-06 22:41:23', '2025-10-15 20:13:24'),
('f2570596-db46-4028-902c-d6fe2c9a8312', 'Ürünler', '/urunler', NULL, 2, 1, '2025-10-06 22:41:23', '2025-10-15 20:02:06'),
('fe8120b3-919a-49b8-8035-df6fd2a2433f', 'Anasayfa', '/', NULL, 0, 1, '2025-10-06 22:41:23', '2025-10-15 20:02:06');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `notifications`
--

CREATE TABLE `notifications` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `type` varchar(50) NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `orders`
--

CREATE TABLE `orders` (
  `id` char(36) NOT NULL,
  `order_number` varchar(50) NOT NULL,
  `user_id` char(36) NOT NULL,
  `status` enum('pending','processing','completed','cancelled','refunded') NOT NULL DEFAULT 'pending',
  `payment_method` enum('credit_card','bank_transfer','wallet','paytr','shopier') NOT NULL,
  `payment_status` varchar(50) NOT NULL DEFAULT 'pending',
  `subtotal` decimal(10,2) NOT NULL,
  `discount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `total` decimal(10,2) NOT NULL,
  `coupon_code` varchar(50) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `ip_address` varchar(50) DEFAULT NULL,
  `user_agent` varchar(500) DEFAULT NULL,
  `payment_provider` varchar(50) DEFAULT NULL,
  `payment_id` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Tablo döküm verisi `orders`
--

INSERT INTO `orders` (`id`, `order_number`, `user_id`, `status`, `payment_method`, `payment_status`, `subtotal`, `discount`, `total`, `coupon_code`, `notes`, `ip_address`, `user_agent`, `payment_provider`, `payment_id`, `created_at`, `updated_at`) VALUES
('042190a4-41d0-4cf4-93a3-a5a171ea8903', 'ORD1760390895507', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'pending', 'paytr', 'failed', 49.99, 0.00, 62.49, NULL, 'PayTR ödeme başarısız. Hata kodu: 6, Mesaj: Müşteri ödeme yapmaktan vazgeçti ve ödeme sayfasından ayrıldı.', NULL, NULL, NULL, NULL, '2025-10-13 21:28:27', '2025-10-13 22:00:11'),
('07b99086-c1f1-493a-991c-ec71d00e425a', 'DEP1760301650094', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'pending', 'paytr', 'pending', 10.00, 0.00, 10.00, NULL, 'Bakiye yükleme', NULL, NULL, NULL, NULL, '2025-10-12 20:41:00', '2025-10-12 20:41:00'),
('0808058f-d5f1-460c-a478-84552d08e0ae', 'ORD1760371269176', '19a2bc26-63d1-43ad-ab56-d7f3c3719a34', 'pending', 'wallet', 'paid', 179.99, 0.00, 179.99, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-13 16:01:19', '2025-10-13 16:09:04'),
('08a0a582-dd8d-4ff0-8ca8-124976c71ed8', 'ORD-1759831194956', '0ac37a5c-a8be-4d25-b853-1e5c9574c1b3', 'pending', 'wallet', 'paid', 100.00, 0.00, 100.00, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-07 09:59:56', '2025-10-07 09:59:56'),
('0aa3d50f-bb5a-40a7-b5ab-e873d8cb4876', 'ORD1760601727849', '', 'pending', 'bank_transfer', 'paid', 50.00, 0.00, 50.00, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-16 08:02:10', '2025-10-16 08:50:04'),
('0ad63069-b0d5-4e03-a32d-70b827917918', 'ORD1760391305968', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'pending', 'paytr', 'failed', 49.99, 0.00, 62.49, NULL, 'PayTR ödeme başarısız. Hata kodu: 6, Mesaj: Müşteri ödeme yapmaktan vazgeçti ve ödeme sayfasından ayrıldı.', NULL, NULL, NULL, NULL, '2025-10-13 21:35:17', '2025-10-13 22:08:10'),
('0ca7ba45-e4ba-4b31-9f74-93e0a4b97199', 'ORD1760435759537', 'd279bb9d-797d-4972-a8bd-a77a40caba91', 'pending', 'bank_transfer', 'paid', 50.00, 0.00, 50.00, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-14 09:56:12', '2025-10-15 08:39:37'),
('0cc5257e-e8ac-4c97-9399-48457169bdae', 'WALLET1760372165849', '19a2bc26-63d1-43ad-ab56-d7f3c3719a34', 'pending', 'paytr', 'failed', 115.00, 0.00, 143.75, NULL, 'PayTR ödeme başarısız. Hata kodu: 6, Mesaj: Müşteri ödeme yapmaktan vazgeçti ve ödeme sayfasından ayrıldı.', NULL, NULL, NULL, NULL, '2025-10-13 16:16:16', '2025-10-13 16:49:16'),
('0ce38739-dca5-4505-a88c-d95a22485a83', 'WALLET1760359728151', '0ac37a5c-a8be-4d25-b853-1e5c9574c1b3', 'pending', 'paytr', 'paid', 10.00, 0.00, 12.50, NULL, 'PayTR ödeme başarılı. Ödeme tipi: card, Para birimi: TL', NULL, NULL, NULL, NULL, '2025-10-13 12:48:58', '2025-10-13 12:49:07'),
('0e633f0d-b775-486f-aa49-8fe2528718c7', 'ORD1760388485511', '4a8fb7f7-0668-4429-9309-fe88ac90eed2', 'pending', 'wallet', 'paid', 49.99, 0.00, 49.99, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-13 20:48:17', '2025-10-15 08:39:37'),
('14d4e9a0-49c4-44e4-93fc-08f444666fa9', 'ORD1760386932766', '4a8fb7f7-0668-4429-9309-fe88ac90eed2', 'pending', 'wallet', 'paid', 179.99, 0.00, 179.99, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-13 20:22:24', '2025-10-13 20:23:05'),
('153aa32e-4133-4c53-8696-75689fc6225f', 'ORD1760390111003', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'pending', 'bank_transfer', 'paid', 2500.00, 0.00, 2500.00, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-13 21:15:22', '2025-10-13 21:16:46'),
('1555b659-dc36-4638-9e6d-0e2c376932b5', 'ORD1760516520551', 'd279bb9d-797d-4972-a8bd-a77a40caba91', 'pending', 'bank_transfer', 'pending', 50.00, 0.00, 50.00, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-15 08:22:14', '2025-10-15 08:22:14'),
('1588004e-080d-453d-a711-c2ba65398161', 'ORD1759920246073', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'pending', 'shopier', 'pending', 10.00, 0.00, 10.00, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-08 10:44:11', '2025-10-08 10:44:11'),
('17ecd697-0109-4582-a2c6-ccb599dcf31e', 'DEP1760279648397', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'pending', 'paytr', 'pending', 10.00, 0.00, 10.00, NULL, 'Bakiye yükleme', NULL, NULL, NULL, NULL, '2025-10-12 14:34:17', '2025-10-12 14:34:17'),
('1990bf00-1fa9-40d6-9103-231a68694fbc', 'ORD1760521799214', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'pending', 'paytr', 'paid', 50.00, 0.00, 62.50, NULL, 'PayTR ödeme başarılı. Ödeme tipi: card, Para birimi: TL', NULL, NULL, NULL, NULL, '2025-10-15 09:49:59', '2025-10-15 09:50:09'),
('1a7da91b-fad3-40a2-bd64-d3ba6442b4f0', 'ORD1759999791978', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'pending', 'wallet', 'failed', 75.00, 0.00, 75.00, NULL, 'PayTR ödeme başarısız. Hata kodu: 6, Mesaj: Müşteri ödeme yapmaktan vazgeçti ve ödeme sayfasından ayrıldı.', NULL, NULL, NULL, NULL, '2025-10-09 08:49:54', '2025-10-09 09:22:12'),
('1b03f267-3b06-4235-abf5-d83ff8828e18', 'ORD-1759831798879', '0ac37a5c-a8be-4d25-b853-1e5c9574c1b3', 'pending', 'wallet', 'paid', 200.00, 0.00, 200.00, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-07 10:10:00', '2025-10-07 10:10:00'),
('1b72b99c-e8ea-45f8-8f9c-6b36c79d0319', 'ORD-1759918273108', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'pending', 'paytr', 'pending', 10.00, 0.00, 10.00, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-08 10:11:18', '2025-10-08 10:11:18'),
('1dbad456-0090-4784-b704-cc2f0750a050', 'ORD1759998913080', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'pending', 'wallet', 'failed', 3000.00, 0.00, 3000.00, NULL, 'PayTR ödeme başarısız. Hata kodu: 6, Mesaj: Müşteri ödeme yapmaktan vazgeçti ve ödeme sayfasından ayrıldı.', NULL, NULL, NULL, NULL, '2025-10-09 08:35:15', '2025-10-09 09:07:09'),
('1f5c441f-8863-4537-8bf7-26abc9288e2f', 'ORD1760603384257', '', 'pending', 'bank_transfer', 'paid', 179.99, 0.00, 179.99, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-16 08:29:46', '2025-10-16 08:30:05'),
('21a79c83-ea96-4364-bf16-bda3dfa8deda', 'ORD1760601847576', '', 'pending', 'paytr', 'paid', 50.00, 0.00, 62.50, NULL, 'PayTR ödeme başarılı. Ödeme tipi: card, Para birimi: TL', NULL, NULL, NULL, NULL, '2025-10-16 08:04:09', '2025-10-16 08:55:02'),
('21d3f86e-4a32-40ce-83b0-852caf89eff5', 'DEP1760302180888', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'pending', 'shopier', 'pending', 10.00, 0.00, 10.00, NULL, 'Bakiye yükleme', NULL, NULL, NULL, NULL, '2025-10-12 20:49:51', '2025-10-12 20:49:51'),
('21fd85fb-7c3e-4985-ae22-a83b511f22b5', 'ORD1760371768013', '19a2bc26-63d1-43ad-ab56-d7f3c3719a34', 'pending', 'wallet', 'paid', 179.99, 0.00, 179.99, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-13 16:09:38', '2025-10-13 16:09:50'),
('229ed9b0-23c0-4777-9345-ddde3b005ed8', 'ORD1760387890944', '4a8fb7f7-0668-4429-9309-fe88ac90eed2', 'pending', 'bank_transfer', 'pending', 49.99, 0.00, 49.99, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-13 20:38:22', '2025-10-13 20:38:22'),
('23142510-59c0-4da0-9d52-480b8e739ea9', 'ORD1760516328171', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'pending', 'bank_transfer', 'paid', 50.00, 0.00, 50.00, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-15 08:19:01', '2025-10-15 08:39:37'),
('25635e0d-8ba5-4e55-9343-6cdbfe0cfac9', 'ORD1759999454763', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'pending', 'wallet', 'failed', 10.00, 0.00, 10.00, NULL, 'PayTR ödeme başarısız. Hata kodu: 6, Mesaj: Müşteri ödeme yapmaktan vazgeçti ve ödeme sayfasından ayrıldı.', NULL, NULL, NULL, NULL, '2025-10-09 08:44:17', '2025-10-09 09:16:11'),
('26c9b11b-cebc-41d1-b95b-db92dcba48eb', 'WALLET1760346214217', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'pending', 'paytr', 'failed', 100.00, 0.00, 105.00, NULL, 'PayTR ödeme başarısız. Hata kodu: 6, Mesaj: Müşteri ödeme yapmaktan vazgeçti ve ödeme sayfasından ayrıldı.', NULL, NULL, NULL, NULL, '2025-10-13 09:03:44', '2025-10-13 09:35:11'),
('2718920b-488d-400b-a952-6d5a14cce736', 'ORD1760434398061', 'd279bb9d-797d-4972-a8bd-a77a40caba91', 'pending', 'paytr', 'paid', 179.99, 0.00, 224.99, NULL, 'PayTR ödeme başarılı. Ödeme tipi: card, Para birimi: TL', NULL, NULL, NULL, NULL, '2025-10-14 09:33:30', '2025-10-14 09:33:39'),
('294f6204-c234-46f9-8c54-f1da65fce691', 'ORD1760390845816', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'pending', 'paytr', 'failed', 49.99, 0.00, 62.49, NULL, 'PayTR ödeme başarısız. Hata kodu: 6, Mesaj: Müşteri ödeme yapmaktan vazgeçti ve ödeme sayfasından ayrıldı.', NULL, NULL, NULL, NULL, '2025-10-13 21:27:37', '2025-10-13 22:00:11'),
('2a97bd54-8237-4c40-967a-6927c87d47af', 'ORD1760516814108', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'pending', 'bank_transfer', 'paid', 50.00, 0.00, 50.00, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-15 08:27:07', '2025-10-15 08:39:37'),
('2cef0709-dddf-44b4-9914-a4f2c34cf3c9', 'ORD1760430365889', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'pending', 'wallet', 'paid', 409.98, 0.00, 409.98, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-14 08:26:18', '2025-10-14 13:45:01'),
('2ee14197-e7e8-48c3-9819-a6da49f5e1e0', 'ORD1760024851610', '0ac37a5c-a8be-4d25-b853-1e5c9574c1b3', 'pending', 'wallet', 'paid', 2500.00, 0.00, 2500.00, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-09 15:47:34', '2025-10-09 15:47:34'),
('318ecb0f-13c3-4aa5-aaf6-bff83be65e78', 'ORD1760387940725', '4a8fb7f7-0668-4429-9309-fe88ac90eed2', 'pending', 'paytr', 'paid', 100.00, 25.00, 93.75, NULL, 'PayTR ödeme başarılı. Ödeme tipi: card, Para birimi: TL', NULL, NULL, NULL, NULL, '2025-10-13 20:39:12', '2025-10-15 08:39:37'),
('31c9c5a6-b36f-4a88-9629-1518caecb925', 'ORD-1759829098469', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'pending', 'wallet', 'paid', 10.00, 0.00, 10.00, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-07 09:24:59', '2025-10-07 09:24:59'),
('334b512a-0a70-4493-b80c-81e8aae93df7', 'ORD1760522324027', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'pending', 'paytr', 'paid', 50.00, 0.00, 62.50, NULL, 'PayTR ödeme başarılı. Ödeme tipi: card, Para birimi: TL', NULL, NULL, NULL, NULL, '2025-10-15 09:58:44', '2025-10-15 09:58:50'),
('344da3d0-9abf-4c44-9f0a-91932656443c', 'ORD-1759838027501', '0ac37a5c-a8be-4d25-b853-1e5c9574c1b3', 'pending', 'wallet', 'paid', 25.00, 0.00, 25.00, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-07 11:53:48', '2025-10-15 08:39:37'),
('34a5019d-13e5-402d-bd92-6057a1600fc0', 'ORD1760391152280', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'pending', 'paytr', 'failed', 49.99, 0.00, 62.49, NULL, 'PayTR ödeme başarısız. Hata kodu: 6, Mesaj: Müşteri ödeme yapmaktan vazgeçti ve ödeme sayfasından ayrıldı.', NULL, NULL, NULL, NULL, '2025-10-13 21:32:43', '2025-10-13 22:05:13'),
('39667fd7-fdba-4192-a551-d837c6e43f1d', 'ORD1760603064728', '', 'pending', 'bank_transfer', 'paid', 179.99, 0.00, 179.99, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-16 08:24:26', '2025-10-16 08:24:50'),
('398e7004-690a-4fcf-86bd-09d070f09607', 'ORD-1759842194350', '0ac37a5c-a8be-4d25-b853-1e5c9574c1b3', 'pending', 'wallet', 'paid', 10.00, 0.00, 10.00, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-07 13:03:15', '2025-10-07 13:03:15'),
('3a6024cd-b206-4b90-9b30-c5f6024639ea', 'ORD1759920523477', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'pending', 'shopier', 'pending', 3000.00, 0.00, 3000.00, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-08 10:48:48', '2025-10-08 10:48:48'),
('3c989e17-7325-46cb-bc73-792bef8d4f07', 'ORD1760521388961', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'pending', 'wallet', 'paid', 50.00, 0.00, 50.00, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-15 09:43:09', '2025-10-15 09:45:09'),
('3dc339e8-2914-4cdf-8e66-498c5c28e764', 'ORD-1759832219519', '0ac37a5c-a8be-4d25-b853-1e5c9574c1b3', 'pending', 'wallet', 'paid', 100.00, 0.00, 100.00, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-07 10:17:00', '2025-10-07 10:17:00'),
('3e5559e1-393e-48ed-a4e6-8e8bd8d690e6', 'ORD-1759834916184', '0ac37a5c-a8be-4d25-b853-1e5c9574c1b3', 'pending', 'wallet', 'paid', 10.00, 0.00, 10.00, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-07 11:01:57', '2025-10-07 11:12:09'),
('3f7991c3-3212-447b-a8cb-1abb829236ed', 'DEP1760279663125', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'pending', 'paytr', 'pending', 10.00, 0.00, 10.00, NULL, 'Bakiye yükleme', NULL, NULL, NULL, NULL, '2025-10-12 14:34:31', '2025-10-12 14:34:31'),
('401fc239-3971-4e1f-9f22-6ba73beb8e09', 'ORD1760522515772', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'pending', 'paytr', 'paid', 50.00, 0.00, 62.50, NULL, 'PayTR ödeme başarılı. Ödeme tipi: card, Para birimi: TL', NULL, NULL, NULL, NULL, '2025-10-15 10:01:55', '2025-10-15 10:02:06'),
('430d480d-e142-44a4-9c38-e9d73ce1326d', 'ORD1760436234444', 'd279bb9d-797d-4972-a8bd-a77a40caba91', 'pending', 'bank_transfer', 'paid', 50.00, 0.00, 50.00, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-14 10:04:07', '2025-10-15 08:39:37'),
('431f5866-c406-44a6-8605-83999cacf0f3', 'ORD-1759841961228', '0ac37a5c-a8be-4d25-b853-1e5c9574c1b3', 'pending', 'wallet', 'paid', 10.00, 0.00, 10.00, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-07 12:59:22', '2025-10-07 12:59:22'),
('43763e5e-f5ec-4314-9bb9-454d194e9ae1', 'WALLET1760387357808', '4a8fb7f7-0668-4429-9309-fe88ac90eed2', 'pending', 'paytr', 'failed', 1.00, 0.00, 1.25, NULL, 'PayTR ödeme başarısız. Hata kodu: 6, Mesaj: Müşteri ödeme yapmaktan vazgeçti ve ödeme sayfasından ayrıldı.', NULL, NULL, NULL, NULL, '2025-10-13 20:29:29', '2025-10-13 21:02:15'),
('47a99a9b-fd00-43db-9f5b-641b4d6551eb', 'ORD-1759835110769', '0ac37a5c-a8be-4d25-b853-1e5c9574c1b3', 'pending', 'wallet', 'paid', 10.00, 0.00, 10.00, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-07 11:05:11', '2025-10-07 11:10:03'),
('483378b3-2edf-4bda-963c-7084a4f3e71b', 'ORD-1759916887432', '', 'pending', 'bank_transfer', 'paid', 10.00, 0.00, 10.00, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-08 09:48:12', '2025-10-08 09:55:14'),
('48d46d8c-370c-4990-aafa-58b910b32f81', 'DEP1760278090090', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'pending', 'paytr', 'pending', 10.00, 0.00, 10.00, NULL, 'Bakiye yükleme', NULL, NULL, NULL, NULL, '2025-10-12 14:08:18', '2025-10-12 14:08:18'),
('4990d932-1da3-44e5-94c3-b5ca72793420', 'ORD-1759830891195', '0ac37a5c-a8be-4d25-b853-1e5c9574c1b3', 'pending', 'wallet', 'paid', 100.00, 0.00, 100.00, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-07 09:54:52', '2025-10-07 09:54:52'),
('4cb2ecc7-008d-4f08-8789-739c50f8b0fa', 'ORD1760388582096', '4a8fb7f7-0668-4429-9309-fe88ac90eed2', 'pending', 'wallet', 'paid', 49.99, 12.50, 37.49, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-13 20:49:53', '2025-10-15 08:39:37'),
('4d903bcf-98b2-484d-a21d-1b7d4fa9b4f2', 'ORD1759920301560', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'pending', 'wallet', 'paid', 10.00, 0.00, 10.00, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-08 10:45:06', '2025-10-13 16:09:15'),
('4da7cc0a-b0a7-427a-93b9-ff7203ef64e7', 'ORD1760434684261', '', 'pending', 'bank_transfer', 'paid', 2500.00, 0.00, 2500.00, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-14 09:38:17', '2025-10-14 09:38:56'),
('4ed48691-bfa4-49ea-b4e0-66cc8808cd77', 'ORD-1759914962219', '', 'pending', 'bank_transfer', 'paid', 10.00, 0.00, 10.00, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-08 09:16:07', '2025-10-08 09:44:36'),
('5160522c-146e-4477-b88a-98cc3310906b', 'ORD1759919966550', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'pending', 'shopier', 'pending', 10.00, 0.00, 10.00, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-08 10:39:31', '2025-10-08 10:39:31'),
('51d2f05e-afdc-470d-9be5-6fe3b53bc136', 'WALLET1760372349637', '19a2bc26-63d1-43ad-ab56-d7f3c3719a34', 'pending', 'paytr', 'paid', 11.00, 0.00, 13.75, NULL, 'PayTR ödeme başarılı. Ödeme tipi: card, Para birimi: TL', NULL, NULL, NULL, NULL, '2025-10-13 16:19:19', '2025-10-13 16:19:26'),
('51da6558-7264-48dc-9a69-5f7ee70d4acf', 'ORD1759920367826', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'pending', 'shopier', 'pending', 25.00, 0.00, 25.00, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-08 10:46:12', '2025-10-08 10:46:12'),
('52bc31d3-d9f4-4b4c-8250-568471fe2493', 'ORD1760082586700', '0ac37a5c-a8be-4d25-b853-1e5c9574c1b3', 'pending', 'wallet', 'paid', 2500.00, 0.00, 2500.00, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-10 07:49:53', '2025-10-10 07:50:40'),
('539309c2-af02-4dc0-b86f-ffb81e0e4471', 'ORD1759922508898', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'pending', 'shopier', 'pending', 75.00, 0.00, 75.00, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-08 11:21:54', '2025-10-08 11:21:54'),
('53a50ae2-c89e-42b3-98b7-202b707391b9', 'ORD1760390572689', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'pending', 'paytr', 'paid', 49.99, 0.00, 62.49, NULL, 'PayTR ödeme başarılı. Ödeme tipi: card, Para birimi: TL', NULL, NULL, NULL, NULL, '2025-10-13 21:23:04', '2025-10-13 21:23:50'),
('561d3e9a-0592-4c4c-984d-abb469fcc8fa', 'ORD-1759831969046', '0ac37a5c-a8be-4d25-b853-1e5c9574c1b3', 'pending', 'wallet', 'paid', 100.00, 0.00, 100.00, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-07 10:12:50', '2025-10-07 10:12:50'),
('569fe3ef-f81b-46a9-82ce-219e7febb061', 'DEP1760301908887', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'pending', 'shopier', 'pending', 1.00, 0.00, 1.00, NULL, 'Bakiye yükleme', NULL, NULL, NULL, NULL, '2025-10-12 20:45:19', '2025-10-12 20:45:19'),
('57711fd7-029d-43b8-ae15-da3430d39e2f', 'ORD1760434801691', '', 'pending', 'bank_transfer', 'paid', 2500.00, 0.00, 2500.00, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-14 09:40:14', '2025-10-14 09:40:29'),
('58afcfb3-ac04-48e0-acd0-8940bd91623b', 'ORD-1759831761544', '0ac37a5c-a8be-4d25-b853-1e5c9574c1b3', 'pending', 'wallet', 'paid', 100.00, 0.00, 100.00, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-07 10:09:22', '2025-10-07 10:09:22'),
('5c0f07cc-51d5-451f-bbb4-5107b500db37', 'ORD1760602630745', '', 'pending', 'paytr', 'paid', 179.99, 0.00, 224.99, NULL, 'PayTR ödeme başarılı. Ödeme tipi: card, Para birimi: TL', NULL, NULL, NULL, NULL, '2025-10-16 08:17:12', '2025-10-16 08:18:14'),
('60336779-2fda-4445-8d38-518bfd197b6a', 'ORD1760434918835', 'd279bb9d-797d-4972-a8bd-a77a40caba91', 'pending', 'bank_transfer', 'paid', 2500.00, 0.00, 2500.00, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-14 09:42:11', '2025-10-14 09:42:45'),
('61b772f2-6813-41d1-be0f-a2e9ec8588f1', 'ORD1760602991784', '', 'pending', 'paytr', 'paid', 179.99, 0.00, 224.99, NULL, 'PayTR ödeme başarılı. Ödeme tipi: card, Para birimi: TL', NULL, NULL, NULL, NULL, '2025-10-16 08:23:14', '2025-10-16 08:23:24'),
('62ac220d-5ce8-4d75-8440-8563911ff04f', 'ORD1760372883968', '19a2bc26-63d1-43ad-ab56-d7f3c3719a34', 'pending', 'bank_transfer', 'paid', 150.00, 0.00, 150.00, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-13 16:28:14', '2025-10-15 08:39:37'),
('6381a6c6-ca1e-4d98-ba1a-3245577f9c32', 'ORD1759918770865', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'pending', 'paytr', 'paid', 10.00, 0.00, 10.00, NULL, 'PayTR ödeme başarılı. Ödeme tipi: card, Para birimi: TL', NULL, NULL, NULL, NULL, '2025-10-08 10:19:36', '2025-10-15 08:39:37'),
('639a400b-007c-4426-9130-6fb55a8f2f7a', 'ORD1760523985287', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'pending', 'paytr', 'paid', 50.00, 0.00, 62.50, NULL, 'PayTR ödeme başarılı. Ödeme tipi: card, Para birimi: TL', NULL, NULL, NULL, NULL, '2025-10-15 10:26:25', '2025-10-15 10:30:00'),
('63a6597a-565f-43b9-b977-a32ec2330ee4', 'ORD1760435489485', 'd279bb9d-797d-4972-a8bd-a77a40caba91', 'pending', 'bank_transfer', 'paid', 2679.99, 0.00, 2679.99, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-14 09:51:42', '2025-10-14 09:51:53'),
('659fdd1d-c085-4a88-9493-6e8c22e8814a', 'ORD1760023973521', '0ac37a5c-a8be-4d25-b853-1e5c9574c1b3', 'pending', 'wallet', 'paid', 2500.00, 0.00, 2500.00, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-09 15:32:56', '2025-10-09 15:32:56'),
('6715ae08-7943-4f86-a06b-5574ddebe925', 'ORD-1759835587306', '0ac37a5c-a8be-4d25-b853-1e5c9574c1b3', 'pending', 'wallet', 'paid', 10.00, 0.00, 10.00, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-07 11:13:08', '2025-10-07 11:14:47'),
('67e47c25-5f76-44ec-b83c-e3e9029f6e5c', 'ORD1760024529847', '0ac37a5c-a8be-4d25-b853-1e5c9574c1b3', 'pending', 'wallet', 'paid', 2500.00, 0.00, 2500.00, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-09 15:42:12', '2025-10-09 15:42:12'),
('68612077-c926-407d-976a-fa84a1a2dd92', 'ORD1760435042625', 'd279bb9d-797d-4972-a8bd-a77a40caba91', 'pending', 'bank_transfer', 'paid', 179.99, 0.00, 179.99, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-14 09:44:15', '2025-10-14 09:45:04'),
('68692ab3-d39c-44c7-a0aa-e6b670112e0f', 'ORD1760024220997', '0ac37a5c-a8be-4d25-b853-1e5c9574c1b3', 'pending', 'wallet', 'paid', 2500.00, 0.00, 2500.00, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-09 15:37:03', '2025-10-09 15:37:03'),
('6a42d659-f75b-4d7b-8e51-611be698e4be', 'ORD1759918665622', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'pending', 'paytr', 'paid', 10.00, 0.00, 10.00, NULL, 'PayTR ödeme başarılı. Ödeme tipi: card, Para birimi: TL', NULL, NULL, NULL, NULL, '2025-10-08 10:17:50', '2025-10-15 08:39:37'),
('6b91512f-3b0a-42b3-a11d-a4e60dc68440', 'ORD1759999668176', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'pending', 'wallet', 'failed', 75.00, 0.00, 75.00, NULL, 'PayTR ödeme başarısız. Hata kodu: 6, Mesaj: Müşteri ödeme yapmaktan vazgeçti ve ödeme sayfasından ayrıldı.', NULL, NULL, NULL, NULL, '2025-10-09 08:47:50', '2025-10-09 09:20:08'),
('6e9017a5-8a01-47d4-ad93-7957969b0cfc', 'ORD-1759842327130', '0ac37a5c-a8be-4d25-b853-1e5c9574c1b3', 'pending', 'wallet', 'paid', 10.00, 0.00, 10.00, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-07 13:05:28', '2025-10-07 13:05:28'),
('6ec62ed6-0536-48e9-b9a6-97ce7bc428fe', 'DEP1760302615711', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'pending', 'paytr', 'failed', 100.00, 0.00, 100.00, NULL, 'PayTR ödeme başarısız. Hata kodu: 6, Mesaj: Müşteri ödeme yapmaktan vazgeçti ve ödeme sayfasından ayrıldı.', NULL, NULL, NULL, NULL, '2025-10-12 20:57:06', '2025-10-12 21:29:09'),
('6ee3b060-207d-4ddc-b6c7-35dc84a62ef3', 'ORD1759920324931', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'pending', 'shopier', 'pending', 75.00, 0.00, 75.00, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-08 10:45:30', '2025-10-08 10:45:30'),
('6fca1e40-490c-4df1-b6c1-f8052e5978b3', 'DEP1760302388017', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'pending', 'shopier', 'pending', 1.00, 0.00, 1.00, NULL, 'Bakiye yükleme', NULL, NULL, NULL, NULL, '2025-10-12 20:53:18', '2025-10-12 20:53:18'),
('735af66a-1d68-48ee-aac1-3e6f8de92e83', 'ORD1760435562250', 'd279bb9d-797d-4972-a8bd-a77a40caba91', 'pending', 'bank_transfer', 'paid', 100.00, 0.00, 100.00, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-14 09:52:54', '2025-10-14 09:53:22'),
('73f7c1c7-0097-440b-a5db-57388c1e1200', 'WALLET1760372438696', '19a2bc26-63d1-43ad-ab56-d7f3c3719a34', 'pending', 'paytr', 'paid', 11.00, 0.00, 13.75, NULL, 'PayTR ödeme başarılı. Ödeme tipi: card, Para birimi: TL', NULL, NULL, NULL, NULL, '2025-10-13 16:20:48', '2025-10-13 16:21:01'),
('7630d0e7-b451-425a-b767-d570cadbf914', 'ORD1760083341431', '0ac37a5c-a8be-4d25-b853-1e5c9574c1b3', 'pending', 'wallet', 'paid', 30.00, 0.00, 30.00, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-10 08:02:28', '2025-10-10 08:02:28'),
('7713e2bb-176c-4fb2-b140-1004e8fba69f', 'DEP1760302749624', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'pending', 'paytr', 'failed', 10.00, 0.00, 10.00, NULL, 'PayTR ödeme başarısız. Hata kodu: 6, Mesaj: Müşteri ödeme yapmaktan vazgeçti ve ödeme sayfasından ayrıldı.', NULL, NULL, NULL, NULL, '2025-10-12 20:59:20', '2025-10-12 21:32:11'),
('77e29b76-9f31-4dee-ae61-bcaf04032e6c', 'ORD1760000213599', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'pending', 'wallet', 'failed', 75.00, 0.00, 75.00, NULL, 'PayTR ödeme başarısız. Hata kodu: 6, Mesaj: Müşteri ödeme yapmaktan vazgeçti ve ödeme sayfasından ayrıldı.', NULL, NULL, NULL, NULL, '2025-10-09 08:56:56', '2025-10-09 09:29:07'),
('7917f372-d4ce-40dc-bfd6-4f1ab799e55e', 'WALLET1760372184609', '19a2bc26-63d1-43ad-ab56-d7f3c3719a34', 'pending', 'paytr', 'paid', 100.00, 0.00, 125.00, NULL, 'PayTR ödeme başarılı. Ödeme tipi: card, Para birimi: TL', NULL, NULL, NULL, NULL, '2025-10-13 16:16:34', '2025-10-13 16:16:41'),
('7a5df02c-0838-404a-8066-5362b7f3c429', 'ORD1760435864161', 'd279bb9d-797d-4972-a8bd-a77a40caba91', 'pending', 'wallet', 'paid', 50.00, 0.00, 50.00, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-14 09:57:56', '2025-10-14 10:00:01'),
('7aa957fe-3c93-4a00-b429-0d549bc1c6a3', 'ORD1760521469557', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'pending', 'paytr', 'paid', 50.00, 0.00, 62.50, NULL, 'PayTR ödeme başarılı. Ödeme tipi: card, Para birimi: TL', NULL, NULL, NULL, NULL, '2025-10-15 09:44:29', '2025-10-15 09:44:37'),
('7d5b8e99-52f6-4e74-bf81-164db37ee327', 'ORD1760522122343', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'pending', 'paytr', 'paid', 50.00, 0.00, 62.50, NULL, 'PayTR ödeme başarılı. Ödeme tipi: card, Para birimi: TL', NULL, NULL, NULL, NULL, '2025-10-15 09:55:22', '2025-10-15 09:59:40'),
('7e5434b5-a91a-426e-951f-d2ba60f7ad3a', 'ORD1760388313469', '4a8fb7f7-0668-4429-9309-fe88ac90eed2', 'pending', 'wallet', 'paid', 49.99, 12.50, 37.49, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-13 20:45:25', '2025-10-15 08:39:37'),
('7ef3b446-d45e-4fcf-86cd-e46800ee5718', 'ORD1760083301840', '0ac37a5c-a8be-4d25-b853-1e5c9574c1b3', 'pending', 'wallet', 'paid', 10.00, 0.00, 10.00, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-10 08:01:48', '2025-10-10 08:01:48'),
('7fe7f788-9297-4791-93fb-ec472aac5b80', 'ORD1759998861675', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'pending', 'paytr', 'failed', 3000.00, 0.00, 3150.00, NULL, 'PayTR ödeme başarısız. Hata kodu: 6, Mesaj: Müşteri ödeme yapmaktan vazgeçti ve ödeme sayfasından ayrıldı.', NULL, NULL, NULL, NULL, '2025-10-09 08:34:24', '2025-10-09 09:06:14'),
('814e75c2-016a-48ce-b83e-871b759edaca', 'ORD1759922415205', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'pending', 'shopier', 'pending', 75.00, 0.00, 75.00, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-08 11:20:20', '2025-10-08 11:20:20'),
('84f2a5e4-d948-4823-a6fb-1be3695979e8', 'ORD1759918531788', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'pending', 'paytr', 'pending', 10.00, 0.00, 10.00, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-08 10:15:36', '2025-10-08 10:15:36'),
('857de69b-76ad-4686-bb70-8b588709c628', 'DEP1760301896829', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'pending', 'wallet', 'pending', 1.00, 0.00, 1.00, NULL, 'Bakiye yükleme', NULL, NULL, NULL, NULL, '2025-10-12 20:45:07', '2025-10-12 20:45:07'),
('85a45a59-2a66-465a-9ff0-71cc2c9921f6', 'ORD-1759918201806', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'pending', 'paytr', 'pending', 10.00, 0.00, 10.00, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-08 10:10:06', '2025-10-08 10:10:06'),
('86d86c95-5d8b-4249-8269-5cfb902edf02', 'ORD-1759837869076', '0ac37a5c-a8be-4d25-b853-1e5c9574c1b3', 'pending', 'wallet', 'paid', 25.00, 0.00, 25.00, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-07 11:51:10', '2025-10-15 08:39:37'),
('881135db-7099-4c08-8aa5-b29c541c17ab', 'WALLET1760346163052', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'pending', 'paytr', 'failed', 10.00, 0.00, 10.50, NULL, 'PayTR ödeme başarısız. Hata kodu: 6, Mesaj: Müşteri ödeme yapmaktan vazgeçti ve ödeme sayfasından ayrıldı.', NULL, NULL, NULL, NULL, '2025-10-13 09:02:53', '2025-10-13 09:35:11'),
('883c57a1-58c6-4259-9af0-1e853635d9b2', 'DEP1760302313561', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'pending', 'paytr', 'pending', 10.00, 0.00, 10.00, NULL, 'Bakiye yükleme', NULL, NULL, NULL, NULL, '2025-10-12 20:52:04', '2025-10-12 20:52:04'),
('8a1e21ad-9263-4453-83de-d6b12601b1c3', 'ORD1760517037719', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'pending', 'bank_transfer', 'paid', 50.00, 0.00, 50.00, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-15 08:30:51', '2025-10-15 08:35:00'),
('8a84ab24-7570-4e47-aa76-7b73ef67d365', 'ORD1760371597755', '19a2bc26-63d1-43ad-ab56-d7f3c3719a34', 'pending', 'wallet', 'paid', 179.99, 0.00, 179.99, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-13 16:06:48', '2025-10-13 16:07:15'),
('8a9520f0-2fdd-4cd1-a4f5-d0fcbc41c4ec', 'DEP1760269938267', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'pending', 'shopier', 'pending', 10.00, 0.00, 10.00, NULL, 'Bakiye yükleme', NULL, NULL, NULL, NULL, '2025-10-12 11:52:26', '2025-10-12 11:52:26'),
('8ae680b0-31fe-4f8a-9c65-b1a9cf0a3180', 'ORD1760522824877', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'pending', 'paytr', 'paid', 50.00, 0.00, 62.50, NULL, 'PayTR ödeme başarılı. Ödeme tipi: card, Para birimi: TL', NULL, NULL, NULL, NULL, '2025-10-15 10:07:05', '2025-10-15 10:07:14'),
('90939d3c-f8d7-442e-8797-e73a549f670d', 'ORD1760435455702', 'd279bb9d-797d-4972-a8bd-a77a40caba91', 'pending', 'bank_transfer', 'paid', 179.99, 0.00, 179.99, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-14 09:51:08', '2025-10-14 09:51:19'),
('90f2d77f-03b2-4e6a-a6e9-632b002c5057', 'ORD1760388623310', '4a8fb7f7-0668-4429-9309-fe88ac90eed2', 'pending', 'paytr', 'paid', 49.99, 12.50, 46.87, NULL, 'PayTR ödeme başarılı. Ödeme tipi: card, Para birimi: TL', NULL, NULL, NULL, NULL, '2025-10-13 20:50:34', '2025-10-15 08:39:37'),
('91aabadf-d455-4248-bbf0-b8817eb32626', 'ORD1760524070694', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'pending', 'bank_transfer', 'paid', 50.00, 0.00, 50.00, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-15 10:27:50', '2025-10-15 10:30:06'),
('92825d70-6947-4499-9c5b-858ebc6c657c', 'WALLET1760346188345', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'pending', 'shopier', 'pending', 10.00, 0.00, 10.50, NULL, 'Cüzdan bakiye yükleme', NULL, NULL, NULL, NULL, '2025-10-13 09:03:18', '2025-10-13 09:03:18'),
('938fb1a2-70ba-4bc6-80ab-b186a4fb420a', 'ORD1760388154561', '4a8fb7f7-0668-4429-9309-fe88ac90eed2', 'pending', 'paytr', 'paid', 49.99, 12.50, 46.87, NULL, 'PayTR ödeme başarılı. Ödeme tipi: card, Para birimi: TL', NULL, NULL, NULL, NULL, '2025-10-13 20:42:46', '2025-10-15 08:39:37'),
('943903a8-75bb-4fd7-8897-d8aa97e63f02', 'ORD-1759831624070', '0ac37a5c-a8be-4d25-b853-1e5c9574c1b3', 'pending', 'wallet', 'paid', 100.00, 0.00, 100.00, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-07 10:07:05', '2025-10-07 10:07:05'),
('94a00c42-aea6-47c6-b8aa-6daeb40a85b6', 'ORD1760387741220', '4a8fb7f7-0668-4429-9309-fe88ac90eed2', 'pending', 'paytr', 'paid', 49.99, 12.50, 46.87, NULL, 'PayTR ödeme başarılı. Ödeme tipi: card, Para birimi: TL', NULL, NULL, NULL, NULL, '2025-10-13 20:35:52', '2025-10-15 08:39:37'),
('966e5168-c584-4db2-9480-4652853922c5', 'DEP1760269934111', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'pending', 'paytr', 'pending', 10.00, 0.00, 10.00, NULL, 'Bakiye yükleme', NULL, NULL, NULL, NULL, '2025-10-12 11:52:22', '2025-10-12 11:52:22'),
('9811793e-3e7f-4b46-8965-eda148fa019d', 'ORD1760430209322', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'pending', 'paytr', 'paid', 49.99, 0.00, 62.49, NULL, 'PayTR ödeme başarılı. Ödeme tipi: card, Para birimi: TL', NULL, NULL, NULL, NULL, '2025-10-14 08:23:42', '2025-10-15 08:39:37'),
('993f4f3d-54fe-45cf-bd9f-65a24038ed70', 'ORD1759922538570', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'pending', 'shopier', 'pending', 2500.00, 0.00, 2500.00, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-08 11:22:23', '2025-10-08 11:22:23'),
('9a7dc2c7-1c53-4836-832a-2982f2f9d1dc', 'ORD1759922407973', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'pending', 'shopier', 'pending', 75.00, 0.00, 75.00, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-08 11:20:13', '2025-10-08 11:20:13'),
('9f750245-6c69-48e3-9511-d307e7f4fbbd', 'ORD-1759918326877', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'pending', 'wallet', 'paid', 10.00, 0.00, 10.00, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-08 10:12:12', '2025-10-15 08:39:37'),
('a0c76943-2bb2-43a5-9db5-ee703722096f', 'ORD-1759914986630', '', 'pending', 'bank_transfer', 'paid', 10.00, 0.00, 10.00, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-08 09:16:31', '2025-10-08 09:44:59'),
('a23eda92-105d-4465-937f-45eaaec74243', 'ORD1760604849416', '', 'pending', 'bank_transfer', 'paid', 50.00, 0.00, 50.00, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-16 08:54:11', '2025-10-16 09:00:00'),
('a4a81ad3-39c0-43a0-9ba6-594558d25a72', 'ORD1760523796686', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'pending', 'paytr', 'paid', 50.00, 0.00, 62.50, NULL, 'PayTR ödeme başarılı. Ödeme tipi: card, Para birimi: TL', NULL, NULL, NULL, NULL, '2025-10-15 10:23:16', '2025-10-15 10:24:14'),
('a8237931-948c-462b-b581-5107fea0df5f', 'ORD1760000365354', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'pending', 'wallet', 'failed', 2500.00, 0.00, 2500.00, NULL, 'PayTR ödeme başarısız. Hata kodu: 6, Mesaj: Müşteri ödeme yapmaktan vazgeçti ve ödeme sayfasından ayrıldı.', NULL, NULL, NULL, NULL, '2025-10-09 08:59:27', '2025-10-09 09:31:12'),
('a9075b19-8b7b-41c9-a15e-4c01d26623d8', 'ORD1760524040245', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'pending', 'wallet', 'paid', 50.00, 0.00, 50.00, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-15 10:27:20', '2025-10-15 10:30:04'),
('a9cdb94b-0420-499c-93ed-14493c0100be', 'ORD-1759838229331', '0ac37a5c-a8be-4d25-b853-1e5c9574c1b3', 'pending', 'wallet', 'paid', 25.00, 0.00, 25.00, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-07 11:57:10', '2025-10-15 08:39:37'),
('aa736c50-8945-408a-b542-28f49df77c1f', 'ORD1760373571770', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'pending', 'bank_transfer', 'paid', 179.99, 0.00, 179.99, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-13 16:39:42', '2025-10-13 16:52:02'),
('ab344222-113d-4fbd-82f1-5940a375230b', 'ORD1760390919223', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'pending', 'paytr', 'failed', 49.99, 0.00, 62.49, NULL, 'PayTR ödeme başarısız. Hata kodu: 6, Mesaj: Müşteri ödeme yapmaktan vazgeçti ve ödeme sayfasından ayrıldı.', NULL, NULL, NULL, NULL, '2025-10-13 21:28:50', '2025-10-13 22:00:12'),
('ab6d6b6e-3c39-4c2e-ad3c-ae6347585b9a', 'ORD1760103238136', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'pending', 'wallet', 'paid', 20.00, 0.00, 20.00, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-10 13:33:58', '2025-10-10 13:33:58'),
('ad1732c4-7992-4d1f-8be8-f2264bad51da', 'ORD-1759914757754', '', 'pending', 'bank_transfer', 'paid', 10.00, 0.00, 10.00, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-08 09:12:42', '2025-10-08 09:43:32'),
('ad35503e-6029-476d-8e4d-8a80b6c329ed', 'ORD1760435232573', 'd279bb9d-797d-4972-a8bd-a77a40caba91', 'pending', 'bank_transfer', 'paid', 179.99, 0.00, 179.99, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-14 09:47:25', '2025-10-14 09:48:01'),
('ad4878e3-fd0d-4fa0-bcce-9da3c1932066', 'ORD-1759914713503', '', 'pending', 'bank_transfer', 'paid', 10.00, 0.00, 10.00, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-08 09:11:58', '2025-10-08 09:13:06'),
('ae3ad0b0-16bd-4723-a343-489aef82c663', 'ORD1760522483952', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'pending', 'paytr', 'failed', 50.00, 0.00, 62.50, NULL, 'PayTR ödeme başarısız. Hata kodu: 6, Mesaj: Müşteri ödeme yapmaktan vazgeçti ve ödeme sayfasından ayrıldı.', NULL, NULL, NULL, NULL, '2025-10-15 10:01:24', '2025-10-15 10:34:13'),
('b905244e-f63c-4db0-a758-51839423ea7e', 'ORD-1759842592410', '0ac37a5c-a8be-4d25-b853-1e5c9574c1b3', 'pending', 'wallet', 'paid', 10.00, 0.00, 10.00, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-07 13:09:53', '2025-10-07 16:35:21'),
('bcc58602-6f2d-4609-a23e-9d190f51e59b', 'DEP1760301884584', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'pending', 'paytr', 'pending', 10.00, 0.00, 10.00, NULL, 'Bakiye yükleme', NULL, NULL, NULL, NULL, '2025-10-12 20:44:55', '2025-10-12 20:44:55'),
('c07da416-6d88-4bbf-8e98-a6212d557128', 'ORD-1759828876246', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'pending', 'bank_transfer', 'paid', 2500.00, 0.00, 2500.00, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-07 09:21:17', '2025-10-07 09:21:44'),
('c0eb1f4c-0682-48ec-8f72-5af64399088d', 'ORD1760601950432', '', 'pending', 'paytr', 'paid', 179.99, 0.00, 224.99, NULL, 'PayTR ödeme başarılı. Ödeme tipi: card, Para birimi: TL', NULL, NULL, NULL, NULL, '2025-10-16 08:05:52', '2025-10-16 08:05:59'),
('c1f16e28-fadf-4f04-8347-7efaa809fde4', 'DEP1760269932768', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'pending', 'paytr', 'pending', 10.00, 0.00, 10.00, NULL, 'Bakiye yükleme', NULL, NULL, NULL, NULL, '2025-10-12 11:52:20', '2025-10-12 11:52:20'),
('c21f5ebf-e8ff-4b78-a015-7201de64778b', 'WALLET1760371882951', '19a2bc26-63d1-43ad-ab56-d7f3c3719a34', 'pending', 'paytr', 'paid', 10.00, 0.00, 12.50, NULL, 'PayTR ödeme başarılı. Ödeme tipi: card, Para birimi: TL', NULL, NULL, NULL, NULL, '2025-10-13 16:11:33', '2025-10-13 16:11:43'),
('c23789b8-2eff-48ed-8f39-48fa31bd76d4', 'ORD1760434237905', '', 'pending', 'bank_transfer', 'pending', 2500.00, 0.00, 2500.00, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-14 09:30:50', '2025-10-14 09:30:50'),
('c3d7cec1-50ba-433c-b614-dd507021dac4', 'ORD1759918386102', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'pending', 'paytr', 'pending', 10.00, 0.00, 10.00, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-08 10:13:11', '2025-10-08 10:13:11'),
('c5d528ba-a3f4-4f01-a848-46c39dc9f045', 'ORD1759999262920', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'pending', 'wallet', 'failed', 10.00, 0.00, 10.00, NULL, 'PayTR ödeme başarısız. Hata kodu: 6, Mesaj: Müşteri ödeme yapmaktan vazgeçti ve ödeme sayfasından ayrıldı.', NULL, NULL, NULL, NULL, '2025-10-09 08:41:05', '2025-10-09 09:13:08'),
('c6c60da5-dfbe-448b-9e5a-ea21fd8499ad', 'DEP1760302339710', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'pending', 'paytr', 'pending', 10.00, 0.00, 10.00, NULL, 'Bakiye yükleme', NULL, NULL, NULL, NULL, '2025-10-12 20:52:30', '2025-10-12 20:52:30'),
('c8543d2c-7306-4610-92b3-79cf36a9db0c', 'ORD-1759831047798', '0ac37a5c-a8be-4d25-b853-1e5c9574c1b3', 'pending', 'wallet', 'paid', 100.00, 0.00, 100.00, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-07 09:57:29', '2025-10-07 09:57:29'),
('c85dc700-0a38-4014-9cb0-2a6ef8f279f2', 'ORD1760082885163', '0ac37a5c-a8be-4d25-b853-1e5c9574c1b3', 'pending', 'wallet', 'paid', 10.00, 0.00, 10.00, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-10 07:54:51', '2025-10-10 08:00:00'),
('cb873ef5-527c-4b22-b2c4-08d477b1ba11', 'ORD1760601453279', '', 'pending', 'bank_transfer', 'paid', 25.00, 0.00, 25.00, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-16 07:57:35', '2025-10-16 08:50:01'),
('cbb52290-8be5-4910-aa61-b9de61b6ccff', 'ORD1760433048332', '', 'pending', 'bank_transfer', 'paid', 2500.00, 0.00, 2500.00, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-14 09:11:01', '2025-10-15 08:39:37'),
('cd3f28d1-3b90-4429-b122-bee28526b75c', 'ORD1760434371975', 'd279bb9d-797d-4972-a8bd-a77a40caba91', 'pending', 'bank_transfer', 'paid', 2500.00, 0.00, 2500.00, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-14 09:33:04', '2025-10-15 08:39:37'),
('ce7866d6-c513-4f33-b53a-2bdabbf05cb1', 'ORD-1759916763780', '', 'pending', 'bank_transfer', 'paid', 10.00, 0.00, 10.00, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-08 09:46:08', '2025-10-08 09:46:29'),
('d04906bf-5a35-4013-ba98-2e88d2d217fd', 'ORD1760391234942', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'pending', 'paytr', 'failed', 49.99, 0.00, 62.49, NULL, 'PayTR ödeme başarısız. Hata kodu: 6, Mesaj: Müşteri ödeme yapmaktan vazgeçti ve ödeme sayfasından ayrıldı.', NULL, NULL, NULL, NULL, '2025-10-13 21:34:06', '2025-10-13 22:06:08'),
('d04d8d8c-c9ff-460f-a6f7-5951b2b7566f', 'ORD1760000203762', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'pending', 'paytr', 'failed', 75.00, 0.00, 78.75, NULL, 'PayTR ödeme başarısız. Hata kodu: 6, Mesaj: Müşteri ödeme yapmaktan vazgeçti ve ödeme sayfasından ayrıldı.', NULL, NULL, NULL, NULL, '2025-10-09 08:56:46', '2025-10-09 09:29:07'),
('d1a5bca6-8faf-470f-abad-fadff0c81f29', 'ORD1759999683899', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'pending', 'paytr', 'failed', 75.00, 0.00, 78.75, NULL, 'PayTR ödeme başarısız. Hata kodu: 6, Mesaj: Müşteri ödeme yapmaktan vazgeçti ve ödeme sayfasından ayrıldı.', NULL, NULL, NULL, NULL, '2025-10-09 08:48:06', '2025-10-09 09:20:09'),
('d31c9c2f-06ca-4a26-a060-4a5f2729205c', 'ORD1759918978404', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'pending', 'paytr', 'paid', 10.00, 0.00, 10.00, NULL, 'PayTR ödeme başarılı. Ödeme tipi: card, Para birimi: TL', NULL, NULL, NULL, NULL, '2025-10-08 10:23:03', '2025-10-15 08:39:37'),
('d968e888-581f-4a43-ad17-38c871a2dc09', 'ORD1760388123829', '4a8fb7f7-0668-4429-9309-fe88ac90eed2', 'pending', 'wallet', 'paid', 49.99, 12.50, 37.49, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-13 20:42:15', '2025-10-15 08:39:37'),
('d97de571-5a1d-4b83-aacc-a1b18679c80c', 'ORD1759922637914', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'pending', 'shopier', 'pending', 2500.00, 0.00, 2500.00, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-08 11:24:03', '2025-10-08 11:24:03'),
('da2be3c0-c43b-48cd-80cb-ff84d44cfa1a', 'ORD1760370827222', '19a2bc26-63d1-43ad-ab56-d7f3c3719a34', 'pending', 'wallet', 'paid', 179.99, 0.00, 179.99, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-13 15:53:57', '2025-10-13 15:54:59'),
('dced715e-3ce2-4f03-ab06-1522ef7e6309', 'WALLET1760359954772', '0ac37a5c-a8be-4d25-b853-1e5c9574c1b3', 'pending', 'paytr', 'paid', 10.00, 0.00, 12.50, NULL, 'PayTR ödeme başarılı. Ödeme tipi: card, Para birimi: TL', NULL, NULL, NULL, NULL, '2025-10-13 12:52:45', '2025-10-13 12:53:00'),
('e141f8ae-336e-467a-b342-228cb4dbd338', 'ORD-1759831430900', '0ac37a5c-a8be-4d25-b853-1e5c9574c1b3', 'pending', 'wallet', 'paid', 100.00, 0.00, 100.00, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-07 10:03:52', '2025-10-07 10:03:52'),
('e28d60de-a1d2-46ab-9e82-35cff4d9e967', 'DEP1760302165366', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'pending', 'paytr', 'pending', 10.00, 0.00, 10.00, NULL, 'Bakiye yükleme', NULL, NULL, NULL, NULL, '2025-10-12 20:49:35', '2025-10-12 20:49:35'),
('e5500c55-5ec9-478a-b16e-a77bb26fb838', 'ORD1759998847324', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'pending', 'wallet', 'failed', 3000.00, 0.00, 3000.00, NULL, 'PayTR ödeme başarısız. Hata kodu: 6, Mesaj: Müşteri ödeme yapmaktan vazgeçti ve ödeme sayfasından ayrıldı.', NULL, NULL, NULL, NULL, '2025-10-09 08:34:09', '2025-10-09 09:06:13'),
('e8d239f9-4f6f-4c2f-801d-e3d132f9cc84', 'ORD1760435643804', 'd279bb9d-797d-4972-a8bd-a77a40caba91', 'pending', 'bank_transfer', 'paid', 50.00, 0.00, 50.00, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-14 09:54:16', '2025-10-15 08:39:37'),
('e8fbbd95-d1c9-4192-af0f-b088d8c0e4e4', 'ORD1759999134439', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'pending', 'wallet', 'failed', 10.00, 0.00, 10.00, NULL, 'PayTR ödeme başarısız. Hata kodu: 6, Mesaj: Müşteri ödeme yapmaktan vazgeçti ve ödeme sayfasından ayrıldı.', NULL, NULL, NULL, NULL, '2025-10-09 08:38:57', '2025-10-09 09:11:08'),
('ebe732d7-efa4-4c94-8e3b-8da6eef240ac', 'ORD-1759834747073', '0ac37a5c-a8be-4d25-b853-1e5c9574c1b3', 'pending', 'wallet', 'paid', 10.00, 0.00, 10.00, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-07 10:59:08', '2025-10-07 10:59:08'),
('ec2897ce-d36d-4a89-a56b-ddbb4cb40a08', 'ORD1760604408172', '', 'pending', 'bank_transfer', 'paid', 50.00, 0.00, 50.00, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-16 08:46:50', '2025-10-16 08:50:05'),
('ee29724c-4d7b-42be-8f3d-f167a2bfa784', 'ORD1760521294396', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'pending', 'bank_transfer', 'paid', 50.00, 0.00, 50.00, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-15 09:41:34', '2025-10-15 09:45:01'),
('f129c89d-b06a-4ba6-b716-dfafaca4db18', 'ORD1760601492790', '', 'pending', 'paytr', 'paid', 100.00, 0.00, 125.00, NULL, 'PayTR ödeme başarılı. Ödeme tipi: card, Para birimi: TL', NULL, NULL, NULL, NULL, '2025-10-16 07:58:15', '2025-10-16 07:59:11'),
('f224ac8b-5708-4adc-be9d-b627f0a7dacc', 'ORD1760391027155', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'pending', 'paytr', 'failed', 49.99, 0.00, 62.49, NULL, 'PayTR ödeme başarısız. Hata kodu: 6, Mesaj: Müşteri ödeme yapmaktan vazgeçti ve ödeme sayfasından ayrıldı.', NULL, NULL, NULL, NULL, '2025-10-13 21:30:38', '2025-10-13 22:03:11'),
('f3d19ca9-db4f-44ea-8b46-1d54aff0b35d', 'ORD-1759837558929', '0ac37a5c-a8be-4d25-b853-1e5c9574c1b3', 'pending', 'wallet', 'paid', 100.00, 0.00, 100.00, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-07 11:46:00', '2025-10-07 11:46:00'),
('f7ec0d7e-1ac6-4088-ad8e-ac06c5f99b9a', 'ORD1760000349128', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'pending', 'paytr', 'failed', 2500.00, 0.00, 2625.00, NULL, 'PayTR ödeme başarısız. Hata kodu: 6, Mesaj: Müşteri ödeme yapmaktan vazgeçti ve ödeme sayfasından ayrıldı.', NULL, NULL, NULL, NULL, '2025-10-09 08:59:11', '2025-10-09 09:31:11'),
('f984c6be-e9be-4346-b5f5-235800d51a6b', 'DEP1760279979279', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'pending', 'paytr', 'failed', 10.00, 0.00, 10.00, NULL, 'PayTR ödeme başarısız. Hata kodu: 6, Mesaj: Müşteri ödeme yapmaktan vazgeçti ve ödeme sayfasından ayrıldı.', NULL, NULL, NULL, NULL, '2025-10-12 14:39:48', '2025-10-12 15:12:10'),
('face5469-f999-43d2-882f-8fc44577c003', 'ORD1760516596435', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'pending', 'bank_transfer', 'paid', 50.00, 0.00, 50.00, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-15 08:23:30', '2025-10-15 08:39:37'),
('fb463234-0681-414f-b7af-9ad9b3a12d59', 'ORD1760371066686', '19a2bc26-63d1-43ad-ab56-d7f3c3719a34', 'pending', 'wallet', 'paid', 25.00, 0.00, 25.00, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-13 15:57:56', '2025-10-13 15:59:16'),
('fba693ef-fba7-481b-a3e5-54a1ac3c33d9', 'ORD1760391416290', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'pending', 'paytr', 'failed', 49.99, 0.00, 62.49, NULL, 'PayTR ödeme başarısız. Hata kodu: 6, Mesaj: Müşteri ödeme yapmaktan vazgeçti ve ödeme sayfasından ayrıldı.', NULL, NULL, NULL, NULL, '2025-10-13 21:37:07', '2025-10-13 22:10:14'),
('fcb0ff2f-9fee-4dbb-9b6b-09e3b9af6bef', 'ORD-1759839449072', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'pending', 'wallet', 'paid', 50.00, 0.00, 50.00, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-07 12:17:30', '2025-10-15 08:39:37');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `order_items`
--

CREATE TABLE `order_items` (
  `id` char(36) NOT NULL,
  `order_id` char(36) NOT NULL,
  `product_id` char(36) NOT NULL,
  `product_name` varchar(255) NOT NULL,
  `quantity` int(11) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `total` decimal(10,2) NOT NULL,
  `options` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`options`)),
  `delivery_status` enum('pending','processing','delivered','failed') NOT NULL DEFAULT 'pending',
  `activation_code` varchar(255) DEFAULT NULL,
  `stock_code` varchar(255) DEFAULT NULL,
  `api_order_id` varchar(255) DEFAULT NULL,
  `delivered_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Tablo döküm verisi `order_items`
--

INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `product_name`, `quantity`, `price`, `total`, `options`, `delivery_status`, `activation_code`, `stock_code`, `api_order_id`, `delivered_at`, `created_at`, `updated_at`) VALUES
('00523658-2cc7-4355-8dca-5f053ca7c26f', '7a5df02c-0838-404a-8066-5362b7f3c429', '0132e42e-d46a-444d-9080-a419aec29c9c', '500 Takipçi', 1, 0.00, 50.00, NULL, 'delivered', NULL, NULL, NULL, NULL, '2025-10-14 09:57:59', '2025-10-19 14:50:55'),
('02a1d4a7-3878-485b-b5f7-277f08a3ac92', '401fc239-3971-4e1f-9f22-6ba73beb8e09', '0132e42e-d46a-444d-9080-a419aec29c9c', '500 Takipçi', 1, 0.00, 50.00, NULL, 'failed', NULL, NULL, NULL, NULL, '2025-10-15 10:01:56', '2025-10-19 14:50:55'),
('046c4db8-f088-449f-b9ad-afd96ffbec24', '84f2a5e4-d948-4823-a6fb-1be3695979e8', '408ef745-5456-4115-ad79-3a26034edc37', '100 Takipçi', 1, 0.00, 10.00, NULL, 'pending', NULL, NULL, NULL, NULL, '2025-10-08 10:15:37', '2025-10-19 14:50:55'),
('093b2ae6-05cc-43b3-8036-8e86a7a642a2', 'ad35503e-6029-476d-8e4d-8a80b6c329ed', 'a76e27ef-e486-4cf8-b765-e12e51d52768', 'Adobe Photoshop Lisans Key', 1, 0.00, 179.99, NULL, 'delivered', 'X1C2V-B3N4M-L5K6J-H7G8F-D9S0A', NULL, NULL, NULL, '2025-10-14 09:47:25', '2025-10-19 14:50:55'),
('0951ba55-d923-4313-8107-bd5e72b0a94c', 'e8fbbd95-d1c9-4192-af0f-b088d8c0e4e4', '408ef745-5456-4115-ad79-3a26034edc37', '100 Takipçi', 1, 0.00, 10.00, NULL, 'pending', NULL, NULL, NULL, NULL, '2025-10-09 08:38:57', '2025-10-19 14:50:55'),
('09640ea7-fd34-47f7-a323-d7e19fce56cc', '2718920b-488d-400b-a952-6d5a14cce736', 'a76e27ef-e486-4cf8-b765-e12e51d52768', 'Adobe Photoshop Lisans Key', 1, 0.00, 179.99, NULL, 'delivered', 'M5N6B-V7C8X-Z9L0K-J1H2G-F3D4S', NULL, NULL, NULL, '2025-10-14 09:33:30', '2025-10-19 14:50:55'),
('0b8257a9-13ee-465d-b942-bf97577ab4e9', '993f4f3d-54fe-45cf-bd9f-65a24038ed70', '0bfafe30-cc66-458b-8fa8-3ebe25826040', 'Grand Theft Auto V', 1, 0.00, 2500.00, NULL, 'pending', NULL, NULL, NULL, NULL, '2025-10-08 11:22:23', '2025-10-19 14:50:55'),
('0bfa4a91-3d8f-44bf-99ea-e0e06cc2eeda', 'ec2897ce-d36d-4a89-a56b-ddbb4cb40a08', '0132e42e-d46a-444d-9080-a419aec29c9c', '500 Takipçi', 1, 0.00, 50.00, NULL, 'delivered', NULL, NULL, NULL, NULL, '2025-10-16 08:46:50', '2025-10-19 14:50:55'),
('0e5467c5-a762-4d22-86ec-69fe8977baf9', 'c5d528ba-a3f4-4f01-a848-46c39dc9f045', '408ef745-5456-4115-ad79-3a26034edc37', '100 Takipçi', 1, 0.00, 10.00, NULL, 'pending', NULL, NULL, NULL, NULL, '2025-10-09 08:41:05', '2025-10-19 14:50:55'),
('115d46a6-be5c-4a53-bbcf-02f285e0ded9', 'd968e888-581f-4a43-ad17-38c871a2dc09', '6445f323-71c9-43a6-bda7-62df52c6af58', 'Windows 11 Education Key', 1, 0.00, 49.99, NULL, 'pending', NULL, NULL, NULL, NULL, '2025-10-13 20:42:19', '2025-10-19 14:50:55'),
('164788f5-c5b6-42f6-9e48-e0ec2c77426f', '23142510-59c0-4da0-9d52-480b8e739ea9', '0132e42e-d46a-444d-9080-a419aec29c9c', '500 Takipçi', 1, 0.00, 50.00, NULL, 'pending', NULL, NULL, NULL, NULL, '2025-10-15 08:19:02', '2025-10-19 14:50:55'),
('16c1a48c-dbff-4c0a-95af-0ba43c0f9c6b', '6a42d659-f75b-4d7b-8e51-611be698e4be', '408ef745-5456-4115-ad79-3a26034edc37', '100 Takipçi', 1, 0.00, 10.00, NULL, 'pending', NULL, NULL, NULL, NULL, '2025-10-08 10:17:50', '2025-10-19 14:50:55'),
('172fa3d3-40c2-4d4d-aba8-391e84862450', '5c0f07cc-51d5-451f-bbb4-5107b500db37', 'a76e27ef-e486-4cf8-b765-e12e51d52768', 'Adobe Photoshop Lisans Key', 1, 0.00, 179.99, NULL, 'delivered', 'V7B8N-M9L0K-J1H2G-F3D4S-A5Q6W', NULL, NULL, NULL, '2025-10-16 08:17:13', '2025-10-19 14:50:56'),
('176180bc-08ac-4469-bf50-8776a13dbb7b', '94a00c42-aea6-47c6-b8aa-6daeb40a85b6', '6445f323-71c9-43a6-bda7-62df52c6af58', 'Windows 11 Education Key', 1, 0.00, 49.99, NULL, 'pending', NULL, NULL, NULL, NULL, '2025-10-13 20:35:53', '2025-10-19 14:50:55'),
('186c8326-e133-4806-aca2-7e29b6738e8e', '1990bf00-1fa9-40d6-9103-231a68694fbc', '0132e42e-d46a-444d-9080-a419aec29c9c', '500 Takipçi', 1, 0.00, 50.00, NULL, 'failed', NULL, NULL, NULL, NULL, '2025-10-15 09:49:59', '2025-10-19 14:50:55'),
('1918fce9-fee9-4a14-a27a-c3a5822f12b4', 'f129c89d-b06a-4ba6-b716-dfafaca4db18', '975d48da-e57e-4f6e-97b1-a6a9ddabbf1d', '1000 Takipçi', 1, 0.00, 100.00, NULL, 'failed', NULL, NULL, NULL, NULL, '2025-10-16 07:58:15', '2025-10-19 14:50:56'),
('19e3a139-a314-4d80-99e4-b1a4834a6717', '659fdd1d-c085-4a88-9493-6e8c22e8814a', 'bfb8d1cb-721a-4756-830b-a95454e1d5f1', 'SMM Paket Satış Scripti', 1, 0.00, 2500.00, NULL, 'delivered', NULL, NULL, NULL, NULL, '2025-10-09 15:32:56', '2025-10-19 14:50:55'),
('1a13e8b9-472a-4455-b33e-29aef3756bd8', 'f224ac8b-5708-4adc-be9d-b627f0a7dacc', '6445f323-71c9-43a6-bda7-62df52c6af58', 'Windows 11 Education Key', 1, 0.00, 49.99, NULL, 'pending', NULL, NULL, NULL, NULL, '2025-10-13 21:30:38', '2025-10-19 14:50:55'),
('1a5b6410-e5db-40c9-91be-8e7597b63d44', '7ef3b446-d45e-4fcf-86cd-e46800ee5718', '7495db5f-293d-46a8-9f25-d7efa6881043', 'USA Gmail Hesap (2020)', 1, 0.00, 10.00, NULL, 'delivered', 'santa@gmail.com:clara', NULL, NULL, NULL, '2025-10-10 08:01:48', '2025-10-19 14:50:55'),
('1ae5a701-fb49-47a6-9a0b-9548546c4a42', 'c0eb1f4c-0682-48ec-8f72-5af64399088d', 'a76e27ef-e486-4cf8-b765-e12e51d52768', 'Adobe Photoshop Lisans Key', 1, 0.00, 179.99, NULL, 'delivered', 'Y4U5I-O6P7A-S8D9F-G0H1J-K2L3M', NULL, NULL, NULL, '2025-10-16 08:05:52', '2025-10-19 14:50:56'),
('1b178874-984e-46ea-aa8b-aa1c1fa30306', '51d2f05e-afdc-470d-9be5-6fe3b53bc136', '', 'Site Bakiyesi', 1, 0.00, 11.00, NULL, 'delivered', NULL, NULL, NULL, NULL, '2025-10-14 08:02:04', '2025-10-19 14:50:55'),
('1c3a770c-bdc2-4eba-a78c-b084d362c187', '86d86c95-5d8b-4249-8269-5cfb902edf02', '271dfde4-f86b-452d-b64e-9186f071da44', 'Canva Pro Öğrenci', 1, 0.00, 25.00, NULL, 'pending', NULL, NULL, NULL, NULL, '2025-10-07 11:51:10', '2025-10-19 14:50:55'),
('1cff491e-1b87-4a53-942a-c949d7195622', 'aa736c50-8945-408a-b542-28f49df77c1f', 'a76e27ef-e486-4cf8-b765-e12e51d52768', 'Adobe Photoshop Lisans Key', 1, 0.00, 179.99, NULL, 'delivered', 'dfg', NULL, NULL, NULL, '2025-10-13 16:39:42', '2025-10-19 14:50:55'),
('22f38e0f-12bc-45b6-9eef-d765967ab1ba', '4cb2ecc7-008d-4f08-8789-739c50f8b0fa', '6445f323-71c9-43a6-bda7-62df52c6af58', 'Windows 11 Education Key', 1, 0.00, 49.99, NULL, 'pending', NULL, NULL, NULL, NULL, '2025-10-13 20:49:56', '2025-10-19 14:50:55'),
('24d23b5d-f99a-42e2-90ea-3d1c749c1502', '67e47c25-5f76-44ec-b83c-e3e9029f6e5c', 'bfb8d1cb-721a-4756-830b-a95454e1d5f1', 'SMM Paket Satış Scripti', 1, 0.00, 2500.00, NULL, 'delivered', NULL, NULL, NULL, NULL, '2025-10-09 15:42:12', '2025-10-19 14:50:55'),
('2607ac45-9b78-4bb0-af70-e341d3d28fe5', 'd31c9c2f-06ca-4a26-a060-4a5f2729205c', '408ef745-5456-4115-ad79-3a26034edc37', '100 Takipçi', 1, 0.00, 10.00, NULL, 'pending', NULL, NULL, NULL, NULL, '2025-10-08 10:23:03', '2025-10-19 14:50:55'),
('29c0d8e1-1dce-4697-a609-e0b7598cac0f', 'a9cdb94b-0420-499c-93ed-14493c0100be', '271dfde4-f86b-452d-b64e-9186f071da44', 'Canva Pro Öğrenci', 1, 0.00, 25.00, NULL, 'pending', NULL, NULL, NULL, NULL, '2025-10-07 11:57:10', '2025-10-19 14:50:55'),
('29c1e8a5-1aeb-4934-8ec4-c0ec9741c8ac', '9a7dc2c7-1c53-4836-832a-2982f2f9d1dc', '205fc262-f2af-463f-8f25-f913a64679e8', 'Windows 11 Pro Key', 1, 0.00, 75.00, NULL, 'pending', NULL, NULL, NULL, NULL, '2025-10-08 11:20:13', '2025-10-19 14:50:55'),
('2dd99337-841a-49cb-be68-7aaf583da73f', '61b772f2-6813-41d1-be0f-a2e9ec8588f1', 'a76e27ef-e486-4cf8-b765-e12e51d52768', 'Adobe Photoshop Lisans Key', 1, 0.00, 179.99, NULL, 'delivered', 'E3R4T-Y5U6I-O7P8A-S9D0F-G1H2J', NULL, NULL, NULL, '2025-10-16 08:23:14', '2025-10-19 14:50:56'),
('3193ca09-5d85-422a-bb24-bcf7e0ff3a5a', '3dc339e8-2914-4cdf-8e66-498c5c28e764', 'd0550d22-210a-4cdb-ae0c-4e57b5b3b7bf', 'Pubg Mobile 60 UC', 1, 0.00, 100.00, NULL, 'delivered', 'naber5:iyiyim', NULL, NULL, NULL, '2025-10-07 10:17:00', '2025-10-19 14:50:55'),
('39949288-9d85-4565-80fc-ff50ca1c53c8', '4ed48691-bfa4-49ea-b4e0-66cc8808cd77', '408ef745-5456-4115-ad79-3a26034edc37', '100 Takipçi', 1, 0.00, 10.00, NULL, 'delivered', NULL, NULL, NULL, NULL, '2025-10-08 09:16:07', '2025-10-19 14:50:55'),
('3aebc67f-e7c6-4a3a-afa6-01e2807335f8', '1b03f267-3b06-4235-abf5-d83ff8828e18', 'd0550d22-210a-4cdb-ae0c-4e57b5b3b7bf', 'Pubg Mobile 60 UC', 2, 0.00, 200.00, NULL, 'delivered', 'naber2:iyiyim\nnaber3:iyiyim', NULL, NULL, NULL, '2025-10-07 10:10:00', '2025-10-19 14:50:55'),
('3cd29f50-6cf6-48a7-8724-764ab49b9fad', '14d4e9a0-49c4-44e4-93fc-08f444666fa9', 'a76e27ef-e486-4cf8-b765-e12e51d52768', 'Adobe Photoshop Lisans Key', 1, 0.00, 179.99, NULL, 'delivered', 'qweqwe', NULL, NULL, NULL, '2025-10-13 20:22:29', '2025-10-19 14:50:55'),
('3eb80fe9-61c1-421a-8d42-cdc1e23a0bef', '0ad63069-b0d5-4e03-a32d-70b827917918', '6445f323-71c9-43a6-bda7-62df52c6af58', 'Windows 11 Education Key', 1, 0.00, 49.99, NULL, 'pending', NULL, NULL, NULL, NULL, '2025-10-13 21:35:17', '2025-10-19 14:50:55'),
('3ef9a02d-ac99-4c3b-869e-55c1c8d78493', '2cef0709-dddf-44b4-9914-a4f2c34cf3c9', '0132e42e-d46a-444d-9080-a419aec29c9c', '500 Takipçi', 1, 0.00, 50.00, NULL, 'delivered', NULL, NULL, NULL, NULL, '2025-10-14 08:26:21', '2025-10-19 14:50:55'),
('41602a0f-df70-45ee-9575-727ab0f0554c', 'fcb0ff2f-9fee-4dbb-9b6b-09e3b9af6bef', '271dfde4-f86b-452d-b64e-9186f071da44', 'Canva Pro Öğrenci', 20, 0.00, 500.00, NULL, 'pending', NULL, NULL, NULL, NULL, '2025-10-07 12:17:30', '2025-10-19 14:50:55'),
('46828d41-c249-48f6-afa1-5dff18614846', 'c21f5ebf-e8ff-4b78-a015-7201de64778b', '', 'Site Bakiyesi', 1, 0.00, 10.00, NULL, 'delivered', NULL, NULL, NULL, NULL, '2025-10-14 08:02:04', '2025-10-19 14:50:55'),
('4726425a-fe08-4026-ab3f-b6291c4ea5c9', '2ee14197-e7e8-48c3-9819-a6da49f5e1e0', 'bfb8d1cb-721a-4756-830b-a95454e1d5f1', 'SMM Paket Satış Scripti', 1, 0.00, 2500.00, NULL, 'delivered', NULL, NULL, NULL, NULL, '2025-10-09 15:47:34', '2025-10-19 14:50:55'),
('488f675c-dc64-4c5e-aefe-fb0e26154db7', '90939d3c-f8d7-442e-8797-e73a549f670d', 'a76e27ef-e486-4cf8-b765-e12e51d52768', 'Adobe Photoshop Lisans Key', 1, 0.00, 179.99, NULL, 'delivered', 'T6R5E-W4Q3Z-X2C1V-B9N8M-L7K0J', NULL, NULL, NULL, '2025-10-14 09:51:08', '2025-10-19 14:50:55'),
('4dcadcb2-3f36-4f0f-8636-78495f62a47f', '90f2d77f-03b2-4e6a-a6e9-632b002c5057', '6445f323-71c9-43a6-bda7-62df52c6af58', 'Windows 11 Education Key', 1, 0.00, 49.99, NULL, 'pending', NULL, NULL, NULL, NULL, '2025-10-13 20:50:35', '2025-10-19 14:50:55'),
('51025161-e63a-462a-bb36-8c968183441b', 'fba693ef-fba7-481b-a3e5-54a1ac3c33d9', '6445f323-71c9-43a6-bda7-62df52c6af58', 'Windows 11 Education Key', 1, 0.00, 49.99, NULL, 'pending', NULL, NULL, NULL, NULL, '2025-10-13 21:37:07', '2025-10-19 14:50:55'),
('5344dcb1-ae59-4852-99b9-d5faa213fd38', '561d3e9a-0592-4c4c-984d-abb469fcc8fa', 'd0550d22-210a-4cdb-ae0c-4e57b5b3b7bf', 'Pubg Mobile 60 UC', 1, 0.00, 100.00, NULL, 'delivered', 'naber4:iyiyim', NULL, NULL, NULL, '2025-10-07 10:12:50', '2025-10-19 14:50:55'),
('53bbfd48-92ed-4cb1-a9d6-fab86f4a581a', '3a6024cd-b206-4b90-9b30-c5f6024639ea', 'd8f607f5-5da9-47a5-ba66-f4835a155a2e', 'Adobe Creative Cloud ', 1, 0.00, 3000.00, NULL, 'pending', NULL, NULL, NULL, NULL, '2025-10-08 10:48:48', '2025-10-19 14:50:55'),
('53d230f9-df1e-41aa-9154-087d057e9c0e', '9811793e-3e7f-4b46-8965-eda148fa019d', '6445f323-71c9-43a6-bda7-62df52c6af58', 'Windows 11 Education Key', 1, 0.00, 49.99, NULL, 'pending', NULL, NULL, NULL, NULL, '2025-10-14 08:23:42', '2025-10-19 14:50:55'),
('54c8cadc-8621-4874-a22d-2f7790e8e39f', '042190a4-41d0-4cf4-93a3-a5a171ea8903', '6445f323-71c9-43a6-bda7-62df52c6af58', 'Windows 11 Education Key', 1, 0.00, 49.99, NULL, 'pending', NULL, NULL, NULL, NULL, '2025-10-13 21:28:27', '2025-10-19 14:50:55'),
('568bb1ed-ccde-47b2-b627-001b270b6812', 'a8237931-948c-462b-b581-5107fea0df5f', '0bfafe30-cc66-458b-8fa8-3ebe25826040', 'Grand Theft Auto V', 1, 0.00, 2500.00, NULL, 'pending', NULL, NULL, NULL, NULL, '2025-10-09 08:59:28', '2025-10-19 14:50:55'),
('574158c7-4aeb-4537-be19-afe16a9c09a8', 'ad1732c4-7992-4d1f-8be8-f2264bad51da', '408ef745-5456-4115-ad79-3a26034edc37', '100 Takipçi', 1, 0.00, 10.00, NULL, 'delivered', NULL, NULL, NULL, NULL, '2025-10-08 09:12:42', '2025-10-19 14:50:55'),
('58ba3bc1-0edf-447b-bee6-064fe0a28f12', '62ac220d-5ce8-4d75-8440-8563911ff04f', '8cc7a560-15b4-4c52-a542-f6687e79d124', 'Adobe Stock', 1, 0.00, 150.00, NULL, 'pending', NULL, NULL, NULL, NULL, '2025-10-13 16:28:19', '2025-10-19 14:50:55'),
('5a8a267c-6943-4510-9b91-a6cdb726b81b', '881135db-7099-4c08-8aa5-b29c541c17ab', '', 'Site Bakiyesi', 1, 0.00, 10.00, NULL, 'delivered', NULL, NULL, NULL, NULL, '2025-10-14 08:02:04', '2025-10-19 14:50:55'),
('5ac82d9a-86e4-486f-94c0-8d42a2b3a1b6', '294f6204-c234-46f9-8c54-f1da65fce691', '6445f323-71c9-43a6-bda7-62df52c6af58', 'Windows 11 Education Key', 1, 0.00, 49.99, NULL, 'pending', NULL, NULL, NULL, NULL, '2025-10-13 21:27:37', '2025-10-19 14:50:55'),
('5ec150c4-1ec5-4210-b676-182c551e6449', '1dbad456-0090-4784-b704-cc2f0750a050', 'd8f607f5-5da9-47a5-ba66-f4835a155a2e', 'Adobe Creative Cloud ', 1, 0.00, 3000.00, NULL, 'pending', NULL, NULL, NULL, NULL, '2025-10-09 08:35:15', '2025-10-19 14:50:55'),
('5f364cb3-211b-4f0f-b73f-caa9a1c7ae20', '1f5c441f-8863-4537-8bf7-26abc9288e2f', 'a76e27ef-e486-4cf8-b765-e12e51d52768', 'Adobe Photoshop Lisans Key', 1, 0.00, 179.99, NULL, 'delivered', 'Z1X2C-V3B4N-M5L6K-J7H8G-F9D0S', NULL, NULL, NULL, '2025-10-16 08:29:46', '2025-10-19 14:50:56'),
('607597a3-8106-4eb1-a32a-4f97abf0f3d0', '4d903bcf-98b2-484d-a21d-1b7d4fa9b4f2', '408ef745-5456-4115-ad79-3a26034edc37', '100 Takipçi', 1, 0.00, 10.00, NULL, 'delivered', NULL, NULL, NULL, NULL, '2025-10-08 10:45:06', '2025-10-19 14:50:55'),
('63420b22-a7c2-4da9-948d-e18fcd62e00f', '53a50ae2-c89e-42b3-98b7-202b707391b9', '6445f323-71c9-43a6-bda7-62df52c6af58', 'Windows 11 Education Key', 1, 0.00, 49.99, NULL, 'delivered', '8BA2-TSAD5-65AS-1QBD', NULL, NULL, NULL, '2025-10-13 21:23:04', '2025-10-19 14:50:55'),
('667902e6-41dc-4779-a863-7de24c02de75', '08a0a582-dd8d-4ff0-8ca8-124976c71ed8', 'd0550d22-210a-4cdb-ae0c-4e57b5b3b7bf', 'Pubg Mobile 60 UC', 1, 0.00, 100.00, NULL, 'delivered', NULL, NULL, NULL, NULL, '2025-10-07 09:59:56', '2025-10-19 14:50:55'),
('68938ddb-d0ba-4d89-a615-a8a915339ae3', '9f750245-6c69-48e3-9511-d307e7f4fbbd', '408ef745-5456-4115-ad79-3a26034edc37', '100 Takipçi', 1, 0.00, 10.00, NULL, 'pending', NULL, NULL, NULL, NULL, '2025-10-08 10:12:12', '2025-10-19 14:50:55'),
('68edc670-a9b4-4396-9220-6c0db98cd3b5', '34a5019d-13e5-402d-bd92-6057a1600fc0', '6445f323-71c9-43a6-bda7-62df52c6af58', 'Windows 11 Education Key', 1, 0.00, 49.99, NULL, 'pending', NULL, NULL, NULL, NULL, '2025-10-13 21:32:43', '2025-10-19 14:50:55'),
('6b731f1e-a7a2-4e49-9d32-511b4eaf31ee', 'c8543d2c-7306-4610-92b3-79cf36a9db0c', 'd0550d22-210a-4cdb-ae0c-4e57b5b3b7bf', 'Pubg Mobile 60 UC', 1, 0.00, 100.00, NULL, 'delivered', NULL, NULL, NULL, NULL, '2025-10-07 09:57:29', '2025-10-19 14:50:55'),
('6c9c7397-673c-44d3-99d0-07d678a46ec8', '2a97bd54-8237-4c40-967a-6927c87d47af', '0132e42e-d46a-444d-9080-a419aec29c9c', '500 Takipçi', 1, 0.00, 50.00, NULL, 'failed', NULL, NULL, NULL, NULL, '2025-10-15 08:27:07', '2025-10-19 14:50:55'),
('6d5393ff-0f8d-4815-a89d-95412456d38d', 'd1a5bca6-8faf-470f-abad-fadff0c81f29', '205fc262-f2af-463f-8f25-f913a64679e8', 'Windows 11 Pro Key', 1, 0.00, 75.00, NULL, 'pending', NULL, NULL, NULL, NULL, '2025-10-09 08:48:06', '2025-10-19 14:50:55'),
('6f664a3f-a656-4e3f-9cf4-47777dacbeae', '1a7da91b-fad3-40a2-bd64-d3ba6442b4f0', '205fc262-f2af-463f-8f25-f913a64679e8', 'Windows 11 Pro Key', 1, 0.00, 75.00, NULL, 'pending', NULL, NULL, NULL, NULL, '2025-10-09 08:49:54', '2025-10-19 14:50:55'),
('6ffdda5e-ee2f-491a-bd07-d126bf618be2', 'ae3ad0b0-16bd-4723-a343-489aef82c663', '0132e42e-d46a-444d-9080-a419aec29c9c', '500 Takipçi', 1, 0.00, 50.00, NULL, 'pending', NULL, NULL, NULL, NULL, '2025-10-15 10:01:24', '2025-10-19 14:50:55'),
('6ffea1ca-eac2-4fd6-b4e3-0fb3ed88bcaa', '6715ae08-7943-4f86-a06b-5574ddebe925', '3eeb67f8-40a6-44f4-95ff-1d721e361861', 'Random Steam Key', 1, 0.00, 10.00, NULL, 'delivered', 'Buradan indirin : https://preview--productspark-flow.lovable.app/ kurulum detayları orada yazıyor.', NULL, NULL, NULL, '2025-10-07 11:13:08', '2025-10-19 14:50:55'),
('7504147f-a016-4f4c-a49d-207f1ceb91dc', '483378b3-2edf-4bda-963c-7084a4f3e71b', '408ef745-5456-4115-ad79-3a26034edc37', '100 Takipçi', 1, 0.00, 10.00, NULL, 'delivered', NULL, NULL, NULL, NULL, '2025-10-08 09:48:12', '2025-10-19 14:50:55'),
('7558b1ad-8f43-4ef0-a031-46eac5f06153', '0aa3d50f-bb5a-40a7-b5ab-e873d8cb4876', '0132e42e-d46a-444d-9080-a419aec29c9c', '500 Takipçi', 1, 0.00, 50.00, NULL, 'delivered', NULL, NULL, NULL, NULL, '2025-10-16 08:02:10', '2025-10-19 14:50:55'),
('771c1ece-7b25-4810-9e55-5a99ea337b5b', '43763e5e-f5ec-4314-9bb9-454d194e9ae1', '', 'Site Bakiyesi', 1, 0.00, 1.00, NULL, 'delivered', NULL, NULL, NULL, NULL, '2025-10-14 08:02:04', '2025-10-19 14:50:55'),
('791bb23c-edb1-4812-ad55-a94d617cfff3', 'e141f8ae-336e-467a-b342-228cb4dbd338', 'd0550d22-210a-4cdb-ae0c-4e57b5b3b7bf', 'Pubg Mobile 60 UC', 1, 0.00, 100.00, NULL, 'delivered', NULL, NULL, NULL, NULL, '2025-10-07 10:03:52', '2025-10-19 14:50:55'),
('7a45bf32-ea9e-4b58-9b2c-105dabc54958', '153aa32e-4133-4c53-8696-75689fc6225f', 'bfb8d1cb-721a-4756-830b-a95454e1d5f1', 'SMM Paket Satış Scripti', 1, 0.00, 2500.00, NULL, 'delivered', NULL, NULL, NULL, NULL, '2025-10-13 21:15:22', '2025-10-19 14:50:55'),
('7a816c30-4a66-4126-97d3-05c8a3cd48a9', '0e633f0d-b775-486f-aa49-8fe2528718c7', '6445f323-71c9-43a6-bda7-62df52c6af58', 'Windows 11 Education Key', 1, 0.00, 49.99, NULL, 'pending', NULL, NULL, NULL, NULL, '2025-10-13 20:48:19', '2025-10-19 14:50:55'),
('7eb56879-ab43-407c-a01b-b12ec2c73461', '25635e0d-8ba5-4e55-9343-6cdbfe0cfac9', '408ef745-5456-4115-ad79-3a26034edc37', '100 Takipçi', 1, 0.00, 10.00, NULL, 'pending', NULL, NULL, NULL, NULL, '2025-10-09 08:44:17', '2025-10-19 14:50:55'),
('7ee9f9d2-5e7a-4528-9cb7-1f74e59dc3a1', '85a45a59-2a66-465a-9ff0-71cc2c9921f6', '408ef745-5456-4115-ad79-3a26034edc37', '100 Takipçi', 1, 0.00, 10.00, NULL, 'pending', NULL, NULL, NULL, NULL, '2025-10-08 10:10:07', '2025-10-19 14:50:55'),
('7f34132a-00c4-496c-afcc-6df544e159b0', '73f7c1c7-0097-440b-a5db-57388c1e1200', '', 'Site Bakiyesi', 1, 0.00, 11.00, NULL, 'delivered', NULL, NULL, NULL, NULL, '2025-10-14 08:02:04', '2025-10-19 14:50:55'),
('8064b39b-b342-4a03-a4fc-7e1eec22ac54', '735af66a-1d68-48ee-aac1-3e6f8de92e83', 'ba71df27-d8c3-41c0-ac01-cb7ac9ebea42', 'ChatGPT Plus Hesap(30 Gün)', 1, 0.00, 100.00, NULL, 'delivered', 'qwe', NULL, NULL, NULL, '2025-10-14 09:52:55', '2025-10-19 14:50:56'),
('8145ab03-15b4-4c26-80d7-7ea5e4031de1', 'ce7866d6-c513-4f33-b53a-2bdabbf05cb1', '408ef745-5456-4115-ad79-3a26034edc37', '100 Takipçi', 1, 0.00, 10.00, NULL, 'delivered', NULL, NULL, NULL, NULL, '2025-10-08 09:46:09', '2025-10-19 14:50:55'),
('85d704b1-5d1f-4ce3-8b52-d0caa3a0a71b', 'ab344222-113d-4fbd-82f1-5940a375230b', '6445f323-71c9-43a6-bda7-62df52c6af58', 'Windows 11 Education Key', 1, 0.00, 49.99, NULL, 'pending', NULL, NULL, NULL, NULL, '2025-10-13 21:28:50', '2025-10-19 14:50:55'),
('90f83476-65d9-46e8-b84b-35eb658857e8', '21a79c83-ea96-4364-bf16-bda3dfa8deda', '0132e42e-d46a-444d-9080-a419aec29c9c', '500 Takipçi', 1, 0.00, 50.00, NULL, 'delivered', NULL, NULL, NULL, NULL, '2025-10-16 08:04:09', '2025-10-19 14:50:56'),
('916766ef-055e-465b-8713-4bdbd3243fe5', '8a1e21ad-9263-4453-83de-d6b12601b1c3', '0132e42e-d46a-444d-9080-a419aec29c9c', '500 Takipçi', 1, 0.00, 50.00, NULL, 'delivered', NULL, NULL, NULL, NULL, '2025-10-15 08:30:51', '2025-10-19 14:50:55'),
('93f24e80-9b3b-4444-bd54-a987e1c83a4d', 'a23eda92-105d-4465-937f-45eaaec74243', '0132e42e-d46a-444d-9080-a419aec29c9c', '500 Takipçi', 1, 0.00, 50.00, NULL, 'delivered', NULL, NULL, NULL, NULL, '2025-10-16 08:54:11', '2025-10-19 14:50:55'),
('96bb94d1-293c-4c33-a40c-f74297df8d1b', 'f3d19ca9-db4f-44ea-8b46-1d54aff0b35d', 'd0550d22-210a-4cdb-ae0c-4e57b5b3b7bf', 'Pubg Mobile 60 UC', 1, 0.00, 100.00, NULL, 'delivered', 'naber6:iyiyim', NULL, NULL, NULL, '2025-10-07 11:46:00', '2025-10-19 14:50:55'),
('982e96b9-fac3-4416-ac2d-2f1554488286', '229ed9b0-23c0-4777-9345-ddde3b005ed8', '6445f323-71c9-43a6-bda7-62df52c6af58', 'Windows 11 Education Key', 1, 0.00, 49.99, NULL, 'pending', NULL, NULL, NULL, NULL, '2025-10-13 20:38:22', '2025-10-19 14:50:55'),
('9873a9a4-9142-4144-b3d4-61a03c9499e0', 'cd3f28d1-3b90-4429-b122-bee28526b75c', 'bfb8d1cb-721a-4756-830b-a95454e1d5f1', 'SMM Paket Satış Scripti', 1, 0.00, 2500.00, NULL, 'pending', NULL, NULL, NULL, NULL, '2025-10-14 09:33:04', '2025-10-19 14:50:55'),
('9985bec9-ddc3-4d6e-ad88-017779b9de40', '318ecb0f-13c3-4aa5-aaf6-bff83be65e78', 'ba71df27-d8c3-41c0-ac01-cb7ac9ebea42', 'ChatGPT Plus Hesap(30 Gün)', 1, 0.00, 100.00, NULL, 'pending', NULL, NULL, NULL, NULL, '2025-10-13 20:39:12', '2025-10-19 14:50:55'),
('9b52e6c7-1d47-42ff-94cb-4fe714ae8db0', 'face5469-f999-43d2-882f-8fc44577c003', '0132e42e-d46a-444d-9080-a419aec29c9c', '500 Takipçi', 1, 0.00, 50.00, NULL, 'pending', NULL, NULL, NULL, NULL, '2025-10-15 08:23:30', '2025-10-19 14:50:56'),
('9c06d3d1-cfee-4e8a-a7d6-c45b0b93565a', '58afcfb3-ac04-48e0-acd0-8940bd91623b', 'd0550d22-210a-4cdb-ae0c-4e57b5b3b7bf', 'Pubg Mobile 60 UC', 1, 0.00, 100.00, NULL, 'delivered', 'naber:iyiyim', NULL, NULL, NULL, '2025-10-07 10:09:22', '2025-10-19 14:50:55'),
('9c4804af-495c-4fd6-a78d-f711331701ad', '47a99a9b-fd00-43db-9f5b-641b4d6551eb', '3eeb67f8-40a6-44f4-95ff-1d721e361861', 'Random Steam Key', 1, 0.00, 10.00, NULL, 'delivered', NULL, NULL, NULL, NULL, '2025-10-07 11:05:12', '2025-10-19 14:50:55'),
('9f15af93-91a7-4eb7-8a04-2f8bf8fbebbd', '26c9b11b-cebc-41d1-b95b-db92dcba48eb', '', 'Site Bakiyesi', 1, 0.00, 100.00, NULL, 'delivered', NULL, NULL, NULL, NULL, '2025-10-14 08:02:04', '2025-10-19 14:50:55'),
('a037d774-7aeb-48f9-b2e4-4ef204220c7c', 'c85dc700-0a38-4014-9cb0-2a6ef8f279f2', '408ef745-5456-4115-ad79-3a26034edc37', '100 Takipçi', 1, 0.00, 10.00, NULL, 'failed', NULL, NULL, NULL, NULL, '2025-10-10 07:54:52', '2025-10-19 14:50:55'),
('a3775a29-1545-4fff-a50f-65518c4e51da', '60336779-2fda-4445-8d38-518bfd197b6a', 'bfb8d1cb-721a-4756-830b-a95454e1d5f1', 'SMM Paket Satış Scripti', 1, 0.00, 2500.00, NULL, 'delivered', NULL, NULL, NULL, NULL, '2025-10-14 09:42:11', '2025-10-19 14:50:55'),
('a41fcaa5-652d-422b-9c15-39b4a77e3c27', '77e29b76-9f31-4dee-ae61-bcaf04032e6c', '205fc262-f2af-463f-8f25-f913a64679e8', 'Windows 11 Pro Key', 1, 0.00, 75.00, NULL, 'pending', NULL, NULL, NULL, NULL, '2025-10-09 08:56:56', '2025-10-19 14:50:55'),
('a4e271ea-772f-4f20-a35c-e0b9a38d3c63', '0ce38739-dca5-4505-a88c-d95a22485a83', '', 'Site Bakiyesi', 1, 0.00, 10.00, NULL, 'delivered', NULL, NULL, NULL, NULL, '2025-10-14 08:02:04', '2025-10-19 14:50:55'),
('a75f6db8-0267-4853-81f8-0fc376e466db', '6381a6c6-ca1e-4d98-ba1a-3245577f9c32', '408ef745-5456-4115-ad79-3a26034edc37', '100 Takipçi', 1, 0.00, 10.00, NULL, 'pending', NULL, NULL, NULL, NULL, '2025-10-08 10:19:36', '2025-10-19 14:50:55'),
('a79a6136-caac-4bf7-ba2a-d1c5c8dab35a', '334b512a-0a70-4493-b80c-81e8aae93df7', '0132e42e-d46a-444d-9080-a419aec29c9c', '500 Takipçi', 1, 0.00, 50.00, NULL, 'pending', NULL, NULL, NULL, NULL, '2025-10-15 09:58:44', '2025-10-19 14:50:56'),
('aa05ec02-434c-450e-8cda-6c646bf09fbe', '398e7004-690a-4fcf-86bd-09d070f09607', '408ef745-5456-4115-ad79-3a26034edc37', '100 Takipçi', 1, 0.00, 10.00, NULL, 'delivered', NULL, NULL, NULL, NULL, '2025-10-07 13:03:15', '2025-10-19 14:50:55'),
('ab67b446-6387-4525-b0d5-005e38861e0b', '7e5434b5-a91a-426e-951f-d2ba60f7ad3a', '6445f323-71c9-43a6-bda7-62df52c6af58', 'Windows 11 Education Key', 1, 0.00, 49.99, NULL, 'pending', NULL, NULL, NULL, NULL, '2025-10-13 20:45:29', '2025-10-19 14:50:55'),
('abd84245-0e6b-4c71-9982-1e561be2b9ea', '8a84ab24-7570-4e47-aa76-7b73ef67d365', 'a76e27ef-e486-4cf8-b765-e12e51d52768', 'Adobe Photoshop Lisans Key', 1, 0.00, 179.99, NULL, 'delivered', 'fggfgf', NULL, NULL, NULL, '2025-10-13 16:06:51', '2025-10-19 14:50:55'),
('acb3dd0b-0eb2-4e26-b7ba-b76b3b3a6022', '51da6558-7264-48dc-9a69-5f7ee70d4acf', '271dfde4-f86b-452d-b64e-9186f071da44', 'Canva Pro Öğrenci', 10, 0.00, 250.00, NULL, 'pending', NULL, NULL, NULL, NULL, '2025-10-08 10:46:13', '2025-10-19 14:50:55'),
('ace41a23-367a-4a93-af28-0ff597156718', '52bc31d3-d9f4-4b4c-8250-568471fe2493', 'bfb8d1cb-721a-4756-830b-a95454e1d5f1', 'SMM Paket Satış Scripti', 1, 0.00, 2500.00, NULL, 'delivered', 'asd', NULL, NULL, NULL, '2025-10-10 07:49:53', '2025-10-19 14:50:55'),
('af983053-257b-4155-943f-e7e6f3229c9b', '814e75c2-016a-48ce-b83e-871b759edaca', '205fc262-f2af-463f-8f25-f913a64679e8', 'Windows 11 Pro Key', 1, 0.00, 75.00, NULL, 'pending', NULL, NULL, NULL, NULL, '2025-10-08 11:20:20', '2025-10-19 14:50:55'),
('b0acebd9-0301-4f31-b242-3b97dcdcf05d', '21fd85fb-7c3e-4985-ae22-a83b511f22b5', 'a76e27ef-e486-4cf8-b765-e12e51d52768', 'Adobe Photoshop Lisans Key', 1, 0.00, 179.99, NULL, 'delivered', 'fghfhfghfgh', NULL, NULL, NULL, '2025-10-13 16:09:40', '2025-10-19 14:50:55'),
('b28b6c34-6660-4cb8-8630-b9558a45f27a', 'dced715e-3ce2-4f03-ab06-1522ef7e6309', '', 'Site Bakiyesi', 1, 0.00, 10.00, NULL, 'delivered', NULL, NULL, NULL, NULL, '2025-10-14 08:02:04', '2025-10-19 14:50:55'),
('b29dca3a-20b9-4097-ad79-318585b30b55', '7630d0e7-b451-425a-b767-d570cadbf914', '7495db5f-293d-46a8-9f25-d7efa6881043', 'USA Gmail Hesap (2020)', 3, 0.00, 30.00, NULL, 'delivered', 'monica@gmail.com:pofico\nandrea@gmail.com:gogogo\nonanaq@gmail.com:pofita', NULL, NULL, NULL, '2025-10-10 08:02:28', '2025-10-19 14:50:55'),
('b3bce29e-d9d4-4b5c-a6ed-e081f90b1373', '7fe7f788-9297-4791-93fb-ec472aac5b80', 'd8f607f5-5da9-47a5-ba66-f4835a155a2e', 'Adobe Creative Cloud ', 1, 0.00, 3000.00, NULL, 'pending', NULL, NULL, NULL, NULL, '2025-10-09 08:34:24', '2025-10-19 14:50:55'),
('b561a61c-e0ab-442b-b3ba-d3ec8f131d27', '63a6597a-565f-43b9-b977-a32ec2330ee4', 'bfb8d1cb-721a-4756-830b-a95454e1d5f1', 'SMM Paket Satış Scripti', 1, 0.00, 2500.00, NULL, 'delivered', NULL, NULL, NULL, NULL, '2025-10-14 09:51:42', '2025-10-19 14:50:55'),
('b634485a-dada-4326-b2b1-64670a581829', 'ad4878e3-fd0d-4fa0-bcce-9da3c1932066', '3eeb67f8-40a6-44f4-95ff-1d721e361861', 'Random Steam Key', 1, 0.00, 10.00, NULL, 'delivered', NULL, NULL, NULL, NULL, '2025-10-08 09:11:58', '2025-10-19 14:50:55'),
('b7a8be0f-d728-4d99-bb2f-d2c4a259f698', '430d480d-e142-44a4-9c38-e9d73ce1326d', '0132e42e-d46a-444d-9080-a419aec29c9c', '500 Takipçi', 1, 0.00, 50.00, NULL, 'pending', NULL, NULL, NULL, NULL, '2025-10-14 10:04:07', '2025-10-19 14:50:56'),
('b7f02d1f-bca7-4400-b06b-044fce10a719', 'd97de571-5a1d-4b83-aacc-a1b18679c80c', '0bfafe30-cc66-458b-8fa8-3ebe25826040', 'Grand Theft Auto V', 1, 0.00, 2500.00, NULL, 'pending', NULL, NULL, NULL, NULL, '2025-10-08 11:24:03', '2025-10-19 14:50:55'),
('bc20c3e7-f6be-4e17-bdb7-d815565990ea', '1588004e-080d-453d-a711-c2ba65398161', '408ef745-5456-4115-ad79-3a26034edc37', '100 Takipçi', 1, 0.00, 10.00, NULL, 'pending', NULL, NULL, NULL, NULL, '2025-10-08 10:44:11', '2025-10-19 14:50:55'),
('bc960c6c-6c5b-4b19-adcb-2597fc093da9', '63a6597a-565f-43b9-b977-a32ec2330ee4', 'a76e27ef-e486-4cf8-b765-e12e51d52768', 'Adobe Photoshop Lisans Key', 1, 0.00, 179.99, NULL, 'delivered', 'S9D8F-G7H6J-K5L4M-N3B2V-C1X0Z', NULL, NULL, NULL, '2025-10-14 09:51:42', '2025-10-19 14:50:55'),
('bd13d3d5-9951-45da-8c77-0fea5f56755d', '6b91512f-3b0a-42b3-a11d-a4e60dc68440', '205fc262-f2af-463f-8f25-f913a64679e8', 'Windows 11 Pro Key', 1, 0.00, 75.00, NULL, 'pending', NULL, NULL, NULL, NULL, '2025-10-09 08:47:50', '2025-10-19 14:50:55'),
('be88fffa-44c4-47fe-bb28-aaf1af8102b6', 'f7ec0d7e-1ac6-4088-ad8e-ac06c5f99b9a', '0bfafe30-cc66-458b-8fa8-3ebe25826040', 'Grand Theft Auto V', 1, 0.00, 2500.00, NULL, 'pending', NULL, NULL, NULL, NULL, '2025-10-09 08:59:11', '2025-10-19 14:50:55'),
('bf48f090-3d7e-4ac3-948b-b260ac484b5d', 'c3d7cec1-50ba-433c-b614-dd507021dac4', '408ef745-5456-4115-ad79-3a26034edc37', '100 Takipçi', 1, 0.00, 10.00, NULL, 'pending', NULL, NULL, NULL, NULL, '2025-10-08 10:13:11', '2025-10-19 14:50:55'),
('c033fc0f-bba7-4f3c-b413-af5a126fa073', 'e8d239f9-4f6f-4c2f-801d-e3d132f9cc84', '0132e42e-d46a-444d-9080-a419aec29c9c', '500 Takipçi', 1, 0.00, 50.00, NULL, 'pending', NULL, NULL, NULL, NULL, '2025-10-14 09:54:16', '2025-10-19 14:50:55'),
('c07ae93a-ff71-4e6a-a759-208db69a7909', '3c989e17-7325-46cb-bc73-792bef8d4f07', '0132e42e-d46a-444d-9080-a419aec29c9c', '500 Takipçi', 1, 0.00, 50.00, NULL, 'delivered', NULL, NULL, NULL, NULL, '2025-10-15 09:43:12', '2025-10-19 14:50:56'),
('c091e397-52c4-4626-b1e6-335187d65dc1', '7aa957fe-3c93-4a00-b429-0d549bc1c6a3', '0132e42e-d46a-444d-9080-a419aec29c9c', '500 Takipçi', 1, 0.00, 50.00, NULL, 'failed', NULL, NULL, NULL, NULL, '2025-10-15 09:44:29', '2025-10-19 14:50:55'),
('c0b0d0a5-6e32-4d32-8679-17b90b2b067e', '4da7cc0a-b0a7-427a-93b9-ff7203ef64e7', 'bfb8d1cb-721a-4756-830b-a95454e1d5f1', 'SMM Paket Satış Scripti', 1, 0.00, 2500.00, NULL, 'delivered', NULL, NULL, NULL, NULL, '2025-10-14 09:38:17', '2025-10-19 14:50:55'),
('c169daea-2eae-4cc7-936a-3d3566657626', 'cb873ef5-527c-4b22-b2c4-08d477b1ba11', '97fb37cc-7b93-49b9-a1e9-d9d34f33bbc1', '250 Takipçi', 1, 0.00, 25.00, NULL, 'delivered', NULL, NULL, NULL, NULL, '2025-10-16 07:57:35', '2025-10-19 14:50:56'),
('c1876037-9df5-466d-ba93-9a52f1d20ac4', '8ae680b0-31fe-4f8a-9c65-b1a9cf0a3180', '0132e42e-d46a-444d-9080-a419aec29c9c', '500 Takipçi', 1, 0.00, 50.00, NULL, 'failed', NULL, NULL, NULL, NULL, '2025-10-15 10:07:05', '2025-10-19 14:50:56'),
('c2a275ea-91c5-4a90-a49c-b9740da7a0c2', 'd04906bf-5a35-4013-ba98-2e88d2d217fd', '6445f323-71c9-43a6-bda7-62df52c6af58', 'Windows 11 Education Key', 1, 0.00, 49.99, NULL, 'pending', NULL, NULL, NULL, NULL, '2025-10-13 21:34:06', '2025-10-19 14:50:55'),
('c303fce0-d942-4a30-a46b-3043e35a37ce', '91aabadf-d455-4248-bbf0-b8817eb32626', '0132e42e-d46a-444d-9080-a419aec29c9c', '500 Takipçi', 1, 0.00, 50.00, NULL, 'delivered', NULL, NULL, NULL, NULL, '2025-10-15 10:27:50', '2025-10-19 14:50:56'),
('c3a1fcb8-2ef6-476a-a8c0-b07cf4681a38', '938fb1a2-70ba-4bc6-80ab-b186a4fb420a', '6445f323-71c9-43a6-bda7-62df52c6af58', 'Windows 11 Education Key', 1, 0.00, 49.99, NULL, 'pending', NULL, NULL, NULL, NULL, '2025-10-13 20:42:46', '2025-10-19 14:50:55'),
('c49a946b-805c-4c54-bc03-61ed10f50099', '7d5b8e99-52f6-4e74-bf81-164db37ee327', '0132e42e-d46a-444d-9080-a419aec29c9c', '500 Takipçi', 1, 0.00, 50.00, NULL, 'delivered', NULL, NULL, NULL, NULL, '2025-10-15 09:55:22', '2025-10-19 14:50:55'),
('c7a0d4c3-85c5-4f53-94dc-69d945edc12c', '431f5866-c406-44a6-8605-83999cacf0f3', '408ef745-5456-4115-ad79-3a26034edc37', '100 Takipçi', 1, 0.00, 10.00, NULL, 'delivered', NULL, NULL, NULL, NULL, '2025-10-07 12:59:22', '2025-10-19 14:50:55'),
('c8fd0a62-48ec-4cab-9915-654946c702d6', '943903a8-75bb-4fd7-8897-d8aa97e63f02', 'd0550d22-210a-4cdb-ae0c-4e57b5b3b7bf', 'Pubg Mobile 60 UC', 1, 0.00, 100.00, NULL, 'delivered', NULL, NULL, NULL, NULL, '2025-10-07 10:07:05', '2025-10-19 14:50:55'),
('ca0231a9-02d2-4c75-afde-d641b4a761da', 'ebe732d7-efa4-4c94-8e3b-8da6eef240ac', '3eeb67f8-40a6-44f4-95ff-1d721e361861', 'Random Steam Key', 1, 0.00, 10.00, NULL, 'delivered', NULL, NULL, NULL, NULL, '2025-10-07 10:59:08', '2025-10-19 14:50:55'),
('ca07f4cd-9c20-4229-a346-00f7e6d5df6c', 'da2be3c0-c43b-48cd-80cb-ff84d44cfa1a', 'a76e27ef-e486-4cf8-b765-e12e51d52768', 'Adobe Photoshop Lisans Key', 1, 0.00, 179.99, NULL, 'delivered', 'id:asdasd şifre: 34342', NULL, NULL, NULL, '2025-10-13 15:54:00', '2025-10-19 14:50:55'),
('cd589785-479b-4e84-9fcd-be972dd3e134', '2cef0709-dddf-44b4-9914-a4f2c34cf3c9', 'a76e27ef-e486-4cf8-b765-e12e51d52768', 'Adobe Photoshop Lisans Key', 2, 0.00, 359.98, NULL, 'delivered', 'Z8N3M-5K1LP-2Q7RV-9T0YS-6D4XB\nH1J2K-L3M4N-O5P6Q-R7S8T-U9V0W', NULL, NULL, NULL, '2025-10-14 08:26:21', '2025-10-19 14:50:55'),
('cf98a96f-e3d8-4ef4-8680-98547a0c4302', 'b905244e-f63c-4db0-a758-51839423ea7e', '408ef745-5456-4115-ad79-3a26034edc37', '100 Takipçi', 1, 0.00, 10.00, NULL, 'delivered', NULL, NULL, NULL, NULL, '2025-10-07 13:09:53', '2025-10-19 14:50:55'),
('d039ce15-d82a-4a40-b20d-f69f88995316', 'fb463234-0681-414f-b7af-9ad9b3a12d59', '97fb37cc-7b93-49b9-a1e9-d9d34f33bbc1', '250 Takipçi', 1, 0.00, 25.00, NULL, 'delivered', NULL, NULL, NULL, NULL, '2025-10-13 15:58:00', '2025-10-19 14:50:55'),
('d3990fef-1d70-4b57-8a27-e03de6310d79', '1b72b99c-e8ea-45f8-8f9c-6b36c79d0319', '408ef745-5456-4115-ad79-3a26034edc37', '100 Takipçi', 1, 0.00, 10.00, NULL, 'pending', NULL, NULL, NULL, NULL, '2025-10-08 10:11:18', '2025-10-19 14:50:55'),
('dc73e928-88dc-4a12-8798-ca2b36c2900f', 'a9075b19-8b7b-41c9-a15e-4c01d26623d8', '0132e42e-d46a-444d-9080-a419aec29c9c', '500 Takipçi', 1, 0.00, 50.00, NULL, 'delivered', NULL, NULL, NULL, NULL, '2025-10-15 10:27:24', '2025-10-19 14:50:55'),
('df7da1cd-bc8e-456e-98aa-0a800baf919b', '1555b659-dc36-4638-9e6d-0e2c376932b5', '0132e42e-d46a-444d-9080-a419aec29c9c', '500 Takipçi', 1, 0.00, 50.00, NULL, 'pending', NULL, NULL, NULL, NULL, '2025-10-15 08:22:14', '2025-10-19 14:50:55'),
('e4961c23-4118-4c3a-8724-7d9af4b018c3', 'cbb52290-8be5-4910-aa61-b9de61b6ccff', 'bfb8d1cb-721a-4756-830b-a95454e1d5f1', 'SMM Paket Satış Scripti', 1, 0.00, 2500.00, NULL, 'pending', NULL, NULL, NULL, NULL, '2025-10-14 09:11:01', '2025-10-19 14:50:56'),
('e653b989-bb47-4dc6-b83e-e576dcd52220', '68692ab3-d39c-44c7-a0aa-e6b670112e0f', 'bfb8d1cb-721a-4756-830b-a95454e1d5f1', 'SMM Paket Satış Scripti', 1, 0.00, 2500.00, NULL, 'delivered', NULL, NULL, NULL, NULL, '2025-10-09 15:37:03', '2025-10-19 14:50:55'),
('e7233dbd-a975-48cf-89f5-5a61d1d4cb8a', 'c23789b8-2eff-48ed-8f39-48fa31bd76d4', 'bfb8d1cb-721a-4756-830b-a95454e1d5f1', 'SMM Paket Satış Scripti', 1, 0.00, 2500.00, NULL, 'pending', NULL, NULL, NULL, NULL, '2025-10-14 09:30:50', '2025-10-19 14:50:55'),
('e7799e99-228e-4719-909a-c3e3806b569a', '57711fd7-029d-43b8-ae15-da3430d39e2f', 'bfb8d1cb-721a-4756-830b-a95454e1d5f1', 'SMM Paket Satış Scripti', 1, 0.00, 2500.00, NULL, 'delivered', NULL, NULL, NULL, NULL, '2025-10-14 09:40:14', '2025-10-19 14:50:55'),
('e7e33510-7ca1-4848-b448-6c3406bb20eb', 'ee29724c-4d7b-42be-8f3d-f167a2bfa784', '0132e42e-d46a-444d-9080-a419aec29c9c', '500 Takipçi', 1, 0.00, 50.00, NULL, 'delivered', NULL, NULL, NULL, NULL, '2025-10-15 09:41:34', '2025-10-19 14:50:56'),
('ea14ed96-5b12-4a39-92aa-2584db3b0b09', '6ee3b060-207d-4ddc-b6c7-35dc84a62ef3', '205fc262-f2af-463f-8f25-f913a64679e8', 'Windows 11 Pro Key', 1, 0.00, 75.00, NULL, 'pending', NULL, NULL, NULL, NULL, '2025-10-08 10:45:30', '2025-10-19 14:50:55'),
('ebb026b8-bbab-4a5e-87ee-7b550db1ec03', 'ab6d6b6e-3c39-4c2e-ad3c-ae6347585b9a', '7495db5f-293d-46a8-9f25-d7efa6881043', 'USA Gmail Hesap (2020)', 2, 0.00, 20.00, NULL, 'delivered', 'sukumuko@gmail.com:sukuleta\nstok1@gmail.com:stok1', NULL, NULL, NULL, '2025-10-10 13:33:58', '2025-10-19 14:50:55'),
('ec39e5a6-6e7b-4ae4-8a1b-385a19aeea80', '0808058f-d5f1-460c-a478-84552d08e0ae', 'a76e27ef-e486-4cf8-b765-e12e51d52768', 'Adobe Photoshop Lisans Key', 1, 0.00, 179.99, NULL, 'delivered', 'qweqweqweqwe', NULL, NULL, NULL, '2025-10-13 16:01:21', '2025-10-19 14:50:55'),
('ef0be076-711b-45c9-8f8d-e8e31f71225c', '3e5559e1-393e-48ed-a4e6-8e8bd8d690e6', '3eeb67f8-40a6-44f4-95ff-1d721e361861', 'Random Steam Key', 1, 0.00, 10.00, NULL, 'delivered', 'gggggggggggggggggggggggggd', NULL, NULL, NULL, '2025-10-07 11:01:57', '2025-10-19 14:50:55'),
('efc7d6c0-344f-4df6-bbdd-56e4497748e1', 'd04d8d8c-c9ff-460f-a6f7-5951b2b7566f', '205fc262-f2af-463f-8f25-f913a64679e8', 'Windows 11 Pro Key', 1, 0.00, 75.00, NULL, 'pending', NULL, NULL, NULL, NULL, '2025-10-09 08:56:46', '2025-10-19 14:50:55'),
('f246bea3-5c2b-46d4-86d2-691fa91f21a2', '639a400b-007c-4426-9130-6fb55a8f2f7a', '0132e42e-d46a-444d-9080-a419aec29c9c', '500 Takipçi', 1, 0.00, 50.00, NULL, 'delivered', NULL, NULL, NULL, NULL, '2025-10-15 10:26:25', '2025-10-19 14:50:55'),
('f30446d5-6f22-4acb-91e0-f40be290bd09', '7917f372-d4ce-40dc-bfd6-4f1ab799e55e', '', 'Site Bakiyesi', 1, 0.00, 100.00, NULL, 'delivered', NULL, NULL, NULL, NULL, '2025-10-14 08:02:04', '2025-10-19 14:50:55'),
('f40c4a6d-0860-4507-af23-c4612b6e110d', '68612077-c926-407d-976a-fa84a1a2dd92', 'a76e27ef-e486-4cf8-b765-e12e51d52768', 'Adobe Photoshop Lisans Key', 1, 0.00, 179.99, NULL, 'delivered', 'R2T3Y-U4I5O-P6A7S-D8F9G-H0J1K', NULL, NULL, NULL, '2025-10-14 09:44:15', '2025-10-19 14:50:56'),
('f67505e0-8810-45eb-859b-f671dce59ed9', '92825d70-6947-4499-9c5b-858ebc6c657c', '', 'Site Bakiyesi', 1, 0.00, 10.00, NULL, 'delivered', NULL, NULL, NULL, NULL, '2025-10-14 08:02:04', '2025-10-19 14:50:55'),
('f7a857bc-d365-4256-8ac2-68cbee7f60be', '39667fd7-fdba-4192-a551-d837c6e43f1d', 'a76e27ef-e486-4cf8-b765-e12e51d52768', 'Adobe Photoshop Lisans Key', 1, 0.00, 179.99, NULL, 'delivered', 'C2V3B-N4M5L-K6J7H-G8F9D-S0A1Q', NULL, NULL, NULL, '2025-10-16 08:24:27', '2025-10-19 14:50:56'),
('f937c134-d511-40b0-82e2-f8e7d7cc7ee9', 'a0c76943-2bb2-43a5-9db5-ee703722096f', '408ef745-5456-4115-ad79-3a26034edc37', '100 Takipçi', 1, 0.00, 10.00, NULL, 'delivered', NULL, NULL, NULL, NULL, '2025-10-08 09:16:31', '2025-10-19 14:50:55'),
('f9ea32e5-c7ab-4f59-ae09-6afbb15f9281', 'a4a81ad3-39c0-43a0-9ba6-594558d25a72', '0132e42e-d46a-444d-9080-a419aec29c9c', '500 Takipçi', 1, 0.00, 50.00, NULL, 'failed', NULL, NULL, NULL, NULL, '2025-10-15 10:23:17', '2025-10-19 14:50:55'),
('fa36abef-eb4f-44cd-83e3-0d0580b104f2', '6e9017a5-8a01-47d4-ad93-7957969b0cfc', '408ef745-5456-4115-ad79-3a26034edc37', '100 Takipçi', 1, 0.00, 10.00, NULL, 'delivered', NULL, NULL, NULL, NULL, '2025-10-07 13:05:28', '2025-10-19 14:50:55'),
('fb5b7524-9fc6-4fa6-ba48-95a2bedd850f', '0ca7ba45-e4ba-4b31-9f74-93e0a4b97199', '0132e42e-d46a-444d-9080-a419aec29c9c', '500 Takipçi', 1, 0.00, 50.00, NULL, 'pending', NULL, NULL, NULL, NULL, '2025-10-14 09:56:12', '2025-10-19 14:50:55'),
('fe8d6b26-561f-42c1-b9cc-5e92d514ce90', '5160522c-146e-4477-b88a-98cc3310906b', '408ef745-5456-4115-ad79-3a26034edc37', '100 Takipçi', 1, 0.00, 10.00, NULL, 'pending', NULL, NULL, NULL, NULL, '2025-10-08 10:39:31', '2025-10-19 14:50:55'),
('fe97b2e7-cccd-4e65-ace5-b9057d26a64f', '539309c2-af02-4dc0-b86f-ffb81e0e4471', '205fc262-f2af-463f-8f25-f913a64679e8', 'Windows 11 Pro Key', 1, 0.00, 75.00, NULL, 'pending', NULL, NULL, NULL, NULL, '2025-10-08 11:21:54', '2025-10-19 14:50:55'),
('fe9a76fe-c60c-43df-9f66-547dd6e3ef64', 'e5500c55-5ec9-478a-b16e-a77bb26fb838', 'd8f607f5-5da9-47a5-ba66-f4835a155a2e', 'Adobe Creative Cloud ', 1, 0.00, 3000.00, NULL, 'pending', NULL, NULL, NULL, NULL, '2025-10-09 08:34:10', '2025-10-19 14:50:55'),
('fef7d02e-dd8d-446a-8c25-6734ed38d322', '0cc5257e-e8ac-4c97-9399-48457169bdae', '', 'Site Bakiyesi', 1, 0.00, 115.00, NULL, 'delivered', NULL, NULL, NULL, NULL, '2025-10-14 08:02:04', '2025-10-19 14:50:55'),
('ffc7041a-f6e1-46bb-909d-cedf64d206cf', '344da3d0-9abf-4c44-9f0a-91932656443c', '271dfde4-f86b-452d-b64e-9186f071da44', 'Canva Pro Öğrenci', 1, 0.00, 25.00, NULL, 'pending', NULL, NULL, NULL, NULL, '2025-10-07 11:53:48', '2025-10-19 14:50:55');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `payment_requests`
--

CREATE TABLE `payment_requests` (
  `id` char(36) NOT NULL,
  `order_id` char(36) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_method` varchar(50) NOT NULL,
  `payment_proof` varchar(500) DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'pending',
  `admin_notes` text DEFAULT NULL,
  `processed_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Tablo döküm verisi `payment_requests`
--

INSERT INTO `payment_requests` (`id`, `order_id`, `amount`, `payment_method`, `payment_proof`, `status`, `admin_notes`, `processed_at`, `created_at`, `updated_at`) VALUES
('01b3f365-df23-4d98-a8f4-5d83fcc1913e', '63a6597a-565f-43b9-b977-a32ec2330ee4', 2679.99, 'havale', NULL, 'approved', NULL, NULL, '2025-10-14 09:51:42', '2025-10-14 09:51:52'),
('0487104c-e2f5-4cd7-935b-88d467671d01', 'ee29724c-4d7b-42be-8f3d-f167a2bfa784', 50.00, 'havale', NULL, 'approved', NULL, NULL, '2025-10-15 09:41:34', '2025-10-15 09:42:06'),
('094e7e8c-3385-4f21-bc9f-ef88428062f5', '483378b3-2edf-4bda-963c-7084a4f3e71b', 10.00, 'havale', NULL, 'approved', NULL, NULL, '2025-10-08 09:48:12', '2025-10-08 09:48:27'),
('0b151322-0c93-459c-aef0-c538400ab1cc', '62ac220d-5ce8-4d75-8440-8563911ff04f', 150.00, 'havale', NULL, 'approved', NULL, NULL, '2025-10-13 16:28:19', '2025-10-13 16:28:37'),
('0d0fbbb9-f8e5-48d0-b762-85302f5c8f81', '39667fd7-fdba-4192-a551-d837c6e43f1d', 179.99, 'havale', NULL, 'approved', NULL, NULL, '2025-10-16 08:24:27', '2025-10-16 08:24:49'),
('1039f12d-5cd1-41f4-ba8c-a017c2c4db86', 'ad4878e3-fd0d-4fa0-bcce-9da3c1932066', 10.00, 'havale', NULL, 'approved', NULL, NULL, '2025-10-08 09:11:59', '2025-10-08 09:13:06'),
('1fc1d655-b9f7-4fd4-a8dd-c79c47c42aaf', '153aa32e-4133-4c53-8696-75689fc6225f', 2500.00, 'havale', NULL, 'approved', NULL, NULL, '2025-10-13 21:15:25', '2025-10-13 21:15:48'),
('225ac86e-f77d-45ad-a44f-d184ab8e3195', 'aa736c50-8945-408a-b542-28f49df77c1f', 179.99, 'havale', NULL, 'approved', NULL, NULL, '2025-10-13 16:40:32', '2025-10-13 16:40:47'),
('22acbd6e-3721-47fc-8a66-5445304cd959', '1555b659-dc36-4638-9e6d-0e2c376932b5', 50.00, 'havale', NULL, 'pending', NULL, NULL, '2025-10-15 08:22:14', '2025-10-15 08:22:14'),
('27b9fbce-c2a8-4f62-a5b2-494c1f45cb81', '0ca7ba45-e4ba-4b31-9f74-93e0a4b97199', 50.00, 'havale', NULL, 'approved', NULL, NULL, '2025-10-14 09:56:12', '2025-10-14 09:56:21'),
('288ce9fd-b3a6-4980-b5f5-0904fa13cbf9', 'ce7866d6-c513-4f33-b53a-2bdabbf05cb1', 10.00, 'havale', NULL, 'approved', NULL, NULL, '2025-10-08 09:46:09', '2025-10-08 09:46:28'),
('2a2ca42f-c4c5-4bd7-816c-508462374cc0', '23142510-59c0-4da0-9d52-480b8e739ea9', 50.00, 'havale', NULL, 'approved', NULL, NULL, '2025-10-15 08:19:02', '2025-10-15 08:19:28'),
('36759bc4-1538-48b9-b836-6c551b78c382', 'face5469-f999-43d2-882f-8fc44577c003', 50.00, 'havale', NULL, 'approved', NULL, NULL, '2025-10-15 08:23:30', '2025-10-15 08:23:48'),
('43e98a0b-f8b3-4801-8f06-6439c1e7f736', 'ec2897ce-d36d-4a89-a56b-ddbb4cb40a08', 50.00, 'havale', NULL, 'approved', NULL, NULL, '2025-10-16 08:46:50', '2025-10-16 08:47:37'),
('4d799dec-9293-46e5-a72d-9d922be0d56c', 'cb873ef5-527c-4b22-b2c4-08d477b1ba11', 25.00, 'havale', NULL, 'approved', NULL, NULL, '2025-10-16 07:57:36', '2025-10-16 07:59:13'),
('4f9018d4-8d3a-4363-8e31-4b172c18fb0a', '57711fd7-029d-43b8-ae15-da3430d39e2f', 2500.00, 'havale', NULL, 'approved', NULL, NULL, '2025-10-14 09:40:14', '2025-10-14 09:40:29'),
('51b14beb-a619-48cf-ba6c-ea70c7a02bc5', 'a0c76943-2bb2-43a5-9db5-ee703722096f', 10.00, 'havale', NULL, 'approved', NULL, NULL, '2025-10-08 09:16:31', '2025-10-08 09:44:59'),
('54d647be-0ca3-4665-9f2a-1efacdd6180c', '1f5c441f-8863-4537-8bf7-26abc9288e2f', 179.99, 'havale', NULL, 'approved', NULL, NULL, '2025-10-16 08:29:46', '2025-10-16 08:30:02'),
('58e3673b-09dd-4d2d-80c3-3261977f9039', '60336779-2fda-4445-8d38-518bfd197b6a', 2500.00, 'havale', NULL, 'approved', NULL, NULL, '2025-10-14 09:42:12', '2025-10-14 09:42:45'),
('5a0af5b9-7927-43d9-b175-c602a18d099b', '91aabadf-d455-4248-bbf0-b8817eb32626', 50.00, 'havale', NULL, 'approved', NULL, NULL, '2025-10-15 10:27:51', '2025-10-15 10:28:16'),
('6176e490-74c3-48fe-be3b-12a1b90ab538', '68612077-c926-407d-976a-fa84a1a2dd92', 179.99, 'havale', NULL, 'approved', NULL, NULL, '2025-10-14 09:44:15', '2025-10-14 09:45:04'),
('76ad7d7b-b1af-4283-882c-e6a2f86e1560', 'cbb52290-8be5-4910-aa61-b9de61b6ccff', 2500.00, 'havale', NULL, 'approved', NULL, NULL, '2025-10-14 09:11:01', '2025-10-14 09:11:50'),
('7940cb2d-99f3-431a-909e-99b4784e927e', 'a23eda92-105d-4465-937f-45eaaec74243', 50.00, 'havale', NULL, 'approved', NULL, NULL, '2025-10-16 08:54:11', '2025-10-16 08:55:27'),
('7c533720-6f03-4bd1-9cf8-d0449d9f0677', 'ad1732c4-7992-4d1f-8be8-f2264bad51da', 10.00, 'havale', NULL, 'approved', NULL, NULL, '2025-10-08 09:12:43', '2025-10-08 09:43:32'),
('8319ddb5-9155-4983-8f67-bf7ee4796ef1', 'cd3f28d1-3b90-4429-b122-bee28526b75c', 2500.00, 'havale', NULL, 'approved', NULL, NULL, '2025-10-14 09:33:05', '2025-10-14 09:34:18'),
('833c53e9-d4ab-44b2-87f4-dde8fd2923db', '4ed48691-bfa4-49ea-b4e0-66cc8808cd77', 10.00, 'havale', NULL, 'approved', NULL, NULL, '2025-10-08 09:16:07', '2025-10-08 09:44:35'),
('8bfe8e60-0826-46a4-8180-c666d72c839b', '90939d3c-f8d7-442e-8797-e73a549f670d', 179.99, 'havale', NULL, 'approved', NULL, NULL, '2025-10-14 09:51:08', '2025-10-14 09:51:18'),
('8deb48f2-15e7-4e4c-aa8a-80250ce8db89', '2a97bd54-8237-4c40-967a-6927c87d47af', 50.00, 'havale', NULL, 'approved', NULL, NULL, '2025-10-15 08:27:07', '2025-10-15 08:27:22'),
('95f07cbb-329d-4e18-bdb3-96d8fdcba7e8', 'c23789b8-2eff-48ed-8f39-48fa31bd76d4', 2500.00, 'havale', NULL, 'pending', NULL, NULL, '2025-10-14 09:30:50', '2025-10-14 09:30:50'),
('9d7f3ea4-ffc5-4128-b238-30f81fbb2b80', '4da7cc0a-b0a7-427a-93b9-ff7203ef64e7', 2500.00, 'havale', NULL, 'approved', NULL, NULL, '2025-10-14 09:38:17', '2025-10-14 09:38:55'),
('b13866e6-65d1-4782-9aff-e00d5e520076', '430d480d-e142-44a4-9c38-e9d73ce1326d', 50.00, 'havale', NULL, 'approved', NULL, NULL, '2025-10-14 10:04:07', '2025-10-14 10:04:13'),
('bccb4904-589c-415b-ab3d-9e116f7d5eb6', '8a1e21ad-9263-4453-83de-d6b12601b1c3', 50.00, 'havale', NULL, 'approved', NULL, NULL, '2025-10-15 08:30:51', '2025-10-15 08:31:08'),
('c077ee18-62cc-40b3-adf1-4a7beb6f515e', '0aa3d50f-bb5a-40a7-b5ab-e873d8cb4876', 50.00, 'havale', NULL, 'approved', NULL, NULL, '2025-10-16 08:02:10', '2025-10-16 08:02:30'),
('e80f60c9-39e8-4b23-a7b7-b07c6281747d', 'ad35503e-6029-476d-8e4d-8a80b6c329ed', 179.99, 'havale', NULL, 'approved', NULL, NULL, '2025-10-14 09:47:25', '2025-10-14 09:48:00'),
('eb251963-d867-43c9-8478-41df6c770623', 'e8d239f9-4f6f-4c2f-801d-e3d132f9cc84', 50.00, 'havale', NULL, 'approved', NULL, NULL, '2025-10-14 09:54:16', '2025-10-14 09:55:17'),
('ef967886-2bda-4a0a-b7fc-648870c34d42', 'c07da416-6d88-4bbf-8e98-a6212d557128', 2500.00, 'havale', NULL, 'approved', NULL, NULL, '2025-10-07 09:21:17', '2025-10-07 09:21:44'),
('fa3c49a6-84a4-40ce-bc44-aa246cd4ff42', '735af66a-1d68-48ee-aac1-3e6f8de92e83', 100.00, 'havale', NULL, 'approved', NULL, NULL, '2025-10-14 09:52:55', '2025-10-14 09:53:07');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `popups`
--

CREATE TABLE `popups` (
  `id` char(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `button_text` varchar(100) DEFAULT NULL,
  `button_url` varchar(500) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 0,
  `show_once` tinyint(1) NOT NULL DEFAULT 0,
  `delay` int(11) NOT NULL DEFAULT 0,
  `valid_from` datetime DEFAULT NULL,
  `valid_until` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Tablo döküm verisi `popups`
--

INSERT INTO `popups` (`id`, `title`, `content`, `image_url`, `button_text`, `button_url`, `is_active`, `show_once`, `delay`, `valid_from`, `valid_until`, `created_at`, `updated_at`) VALUES
('b57879a1-bdb0-4ccd-90a6-fae11d42850b', 'Üye Ol İlk Siparişinde %10 İndirim Kap', 'Sitemize üye olarak yapacağınız ilk siparişlerde geçerli indirim kodunuz hazır.', 'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/blog-images/popup-images/gagx81xi1uh-1760559551779.png', 'Alışveriş Yap', NULL, 1, 0, 3, NULL, NULL, '2025-10-09 18:54:42', '2025-10-15 20:19:18');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `products`
--

CREATE TABLE `products` (
  `id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `short_description` varchar(500) DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `compare_at_price` decimal(10,2) DEFAULT NULL,
  `cost` decimal(10,2) DEFAULT NULL,
  `category_id` char(36) NOT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `images` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`images`)),
  `stock_quantity` int(11) NOT NULL DEFAULT 0,
  `sku` varchar(100) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `is_featured` tinyint(1) NOT NULL DEFAULT 0,
  `is_digital` tinyint(1) NOT NULL DEFAULT 0,
  `requires_shipping` tinyint(1) NOT NULL DEFAULT 1,
  `meta_title` varchar(255) DEFAULT NULL,
  `meta_description` varchar(500) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Tablo döküm verisi `products`
--

INSERT INTO `products` (`id`, `name`, `slug`, `description`, `short_description`, `price`, `compare_at_price`, `cost`, `category_id`, `image_url`, `images`, `stock_quantity`, `sku`, `is_active`, `is_featured`, `is_digital`, `requires_shipping`, `meta_title`, `meta_description`, `created_at`, `updated_at`) VALUES
('0132e42e-d46a-444d-9080-a419aec29c9c', '500 Takipçi', '500-takipci', '<p>Instagram 500 Takipçi</p>', NULL, 50.00, NULL, NULL, '5e300196-8b4e-44d9-9020-d1fccccbe249', 'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760111139051.jpg', NULL, 9999999, NULL, 1, 0, 0, 1, NULL, NULL, '2025-10-10 15:45:52', '2025-10-15 12:41:26'),
('058e9ccd-f99d-4601-90ca-597fb3d4430f', 'ChatGPT Business Hesap(30 Gün)', 'chatgpt-business-hesap', '<ul><li><strong style=\"color: rgb(255, 255, 255); background-color: rgb(230, 0, 0);\">SINIRSIZ GPT-5</strong><span style=\"color: rgb(224, 231, 255); background-color: rgb(230, 0, 0);\">&nbsp;ve görüntü/video oluşturma</span></li><li><strong style=\"color: rgb(255, 255, 255); background-color: rgb(230, 0, 0);\">2’ye kadar eş zamanlı</strong><span style=\"color: rgb(224, 231, 255); background-color: rgb(230, 0, 0);\">&nbsp;üretim imkanı</span></li><li><strong style=\"color: rgb(255, 255, 255); background-color: rgb(230, 0, 0);\">32K Bağlam Penceresi</strong><span style=\"color: rgb(224, 231, 255); background-color: rgb(230, 0, 0);\">&nbsp;ve gelişmiş analiz</span></li><li><strong style=\"color: rgb(255, 255, 255); background-color: rgb(230, 0, 0);\">Video Oluşturma:</strong><span style=\"color: rgb(224, 231, 255); background-color: rgb(230, 0, 0);\">&nbsp;720p’de 5 saniye veya 480p’de 10 saniye</span></li><li><strong style=\"color: rgb(255, 255, 255); background-color: rgb(230, 0, 0);\">ChatGPT Ajanı</strong><span style=\"color: rgb(224, 231, 255); background-color: rgb(230, 0, 0);\">&nbsp;ve otomatik görev planlama</span></li><li><strong style=\"color: rgb(255, 255, 255); background-color: rgb(230, 0, 0);\">Daha yüksek yanıt hızları</strong><span style=\"color: rgb(224, 231, 255); background-color: rgb(230, 0, 0);\">&nbsp;ve öncelikli destek</span></li></ul>', NULL, 250.00, NULL, NULL, 'f6b5f01c-a7b9-48ee-bbdb-9b44b4bf8398', 'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760110464275.jpeg', NULL, 10, NULL, 1, 0, 0, 1, NULL, NULL, '2025-10-10 15:34:37', '2025-10-10 15:34:37'),
('0bfafe30-cc66-458b-8fa8-3ebe25826040', 'Grand Theft Auto V', 'gta-5', 'GTA 5, Los Santos şehrinde geçen açık dünya aksiyon macera oyunudur. Üç farklı karakter arasında geçiş yaparak hikayeyi deneyimleyin.', 'Los Santos\'ta suç ve macera', 2500.00, NULL, NULL, '12b202f2-144e-44f6-b2d8-04dac0ad900b', 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&h=600&fit=crop', NULL, 150, NULL, 1, 0, 0, 1, NULL, NULL, '2025-10-06 17:19:05', '2025-10-06 17:19:05'),
('0fbee9fe-da18-4c6e-9910-73cf81ba5b9f', 'Gemini Veo 3 Ultra(90 Gün)', 'gemini-veo-3-ultra-90-gun', '<h3><strong>Veo 3 – Yapay Zeka Destekli Video Üretiminde Yeni Bir Çağ Başlıyor</strong></h3><p>Görsel içerik üretiminin geleceği artık burada.&nbsp;<strong>Google DeepMind</strong>&nbsp;tarafından geliştirilen&nbsp;<strong>Veo 3</strong>, metinden video üretiminde çıtayı bir kez daha yukarı taşıyor. Gelişmiş yapay zeka modelleriyle desteklenen Veo 3, sadece birkaç cümlelik bir senaryodan, etkileyici, akıcı ve sinematik videolar üretebiliyor.</p><h4><strong>🚀 Öne Çıkan Özellikler</strong></h4><ul><li><strong>Yüksek Çözünürlük ve Kalite:</strong></li><li>Veo 3, 1080p çözünürlüğe kadar videolar üretebiliyor. Önceki sürümlere göre daha net görseller, daha az yapaylık ve daha iyi sahne geçişleri sunuyor.</li><li><strong>Gerçekçi Kamera Hareketleri:</strong></li><li>Sadece sahneleri değil, kameranın nasıl hareket etmesi gerektiğini de anlayabiliyor. Dolly, pan, tilt gibi profesyonel kamera hareketlerini taklit ederek sinematik bir hissiyat oluşturuyor.</li><li><strong>Zaman ve Olay Uyumu:</strong></li><li>İfade ettiğiniz zaman dilimi, hava durumu, ışık yönü ve hareket gibi ayrıntılar senaryoya uyumlu şekilde işleniyor. Örneğin, “akşam güneşi altında yürüyen bir çocuk” dediğinizde, ışığın yönü bile doğru hesaplanıyor.</li><li><strong>Stil ve Biçim Kontrolü:</strong></li><li>Belgesel, sinema, reklam ya da çizgi film tarzı… Hangi türde video istediğinizi belirtmeniz yeterli. Veo 3, istenilen stil doğrultusunda sahneleri yeniden yapılandırıyor.</li><li><strong>Video Düzenleme Desteği:</strong></li><li>Oluşturulan videolar, daha sonra yeniden yönlendirilebilir veya geliştirilebilir. Bu sayede içerik üreticileri, taslağı geliştirme sürecinde Veo 3’ü bir başlangıç noktası olarak da kullanabiliyor.</li></ul>', NULL, 250.00, NULL, NULL, 'f6b5f01c-a7b9-48ee-bbdb-9b44b4bf8398', 'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760110653248.jpg', NULL, 24, NULL, 1, 0, 0, 1, NULL, NULL, '2025-10-10 15:37:02', '2025-10-10 15:37:44'),
('1bdb2344-9b92-455f-935a-f064a470b6b8', 'Office 365 Lisans PC/MAC', 'office-365-lisans', '<h1 class=\"ql-align-center\"><strong>Office 2024 Professional Plus</strong></h1><p>Microsoft’un en yeni ofis yazılım paketi olan Office 2024 Professional Plus, hem ev kullanıcıları hem de küçük işletmeler için tasarlanmış kapsamlı bir çözüm sunuyor. Bu paket, üretkenliğinizi artırmak ve iş süreçlerinizi kolaylaştırmak için en güncel araçları ve özellikleri içeriyor. Word, Excel, PowerPoint, Outlook ve OneNote gibi temel Office uygulamalarının son sürümlerini içerir. Kullanıcıların daha üretken, organize ve bağlantıda kalmalarına yardımcı olur. Özellikle küçük işletme sahipleri, serbest çalışanlar ve ev ofis kullanıcıları için idealdir.</p><h2 class=\"ql-align-center\"><strong>Office 2024 Professional Plus İçerdiği Uygulamalar:</strong></h2><p>&nbsp;</p><h3><img src=\"https://cdn-dynmedia-1.microsoft.com/is/image/microsoftcorp/Gldn_Word_Icon_111x111\" alt=\"Office Word 2024\" height=\"111\" width=\"111\"><strong>Microsoft Word 2024:</strong></h3><ul><li>İleri düzey yazı düzenleme ve doküman oluşturma araçları sunar.</li><li>Yeni şablonlar ve stillerle profesyonel belgeler oluşturma imkanı sağlar.</li><li>Yapay zeka destekli yazma asistanı ile yazım denetimi ve öneriler.</li></ul><p>&nbsp;</p><h3><img src=\"https://cdn-dynmedia-1.microsoft.com/is/image/microsoftcorp/Gldn_Excel_Icon_111x111\" alt=\"Office Excel 2024\" height=\"111\" width=\"111\"><strong>Microsoft Excel 2024:</strong></h3><ul><li>Gelişmiş veri analizi ve görselleştirme araçları içerir.</li><li>Formüller ve işlevler ile veri yönetimini kolaylaştırır.</li><li>Yeni grafikler ve veri modelleme araçları ile raporlar oluşturmayı hızlandırır.</li></ul><p>&nbsp;</p><h3><img src=\"https://cdn-dynmedia-1.microsoft.com/is/image/microsoftcorp/Gldn_PPT_Icon_111x111\" alt=\"Office 2024 PowerPoint\" height=\"111\" width=\"111\"><strong>Microsoft PowerPoint 2024:</strong></h3><ul><li>Profesyonel sunumlar oluşturmak için modern şablonlar ve animasyonlar sunar.</li><li>Sunucu notları ve işbirliği özellikleri ile toplantılar için uygun.</li><li>Yeni görsel efektler ve tasarım önerileri ile daha çekici sunumlar.</li></ul><p>&nbsp;</p><h3><img src=\"https://cdn-dynmedia-1.microsoft.com/is/image/microsoftcorp/Gldn_Outlook_Icon_111x111\" alt=\"Office 2024 Outlook\" height=\"111\" width=\"111\"><strong>Microsoft Outlook 2024:</strong></h3><ul><li>E-posta yönetimini kolaylaştıran gelişmiş arama ve filtreleme seçenekleri.</li><li>Takvim entegrasyonu ile zaman yönetimi ve toplantı planlaması.</li><li>Güçlü güvenlik özellikleri ile spam ve zararlı içeriklerden korunma.</li></ul><p>&nbsp;</p><h3><img src=\"https://cdn-dynmedia-1.microsoft.com/is/image/microsoftcorp/Gldn_OneNote_Icon_111x111\" alt=\"Office 2024 OneNote\" height=\"111\" width=\"111\"><strong>Microsoft OneNote 2024:</strong></h3><ul><li>Notlarınızı organize etme ve saklama için güçlü bir araç.</li><li>El yazısı desteği ve dijital mürekkep ile notlarınızı daha kişisel hale getirebilirsiniz.</li><li>Fikirlerinizi, toplantı notlarını ve araştırmalarınızı bir arada tutar.</li></ul><p>&nbsp;</p><h3><img src=\"https://cdn-dynmedia-1.microsoft.com/is/image/microsoftcorp/Access_1555x1555?hei=111&amp;wid=111\" alt=\"Office 2024 Access\" height=\"111\" width=\"111\"><strong>Microsoft Access 2024:</strong></h3><ul><li>Veri tabanı yönetimi için güçlü araçlar ile işinizi kolaylaştırın.</li><li>Bilgilerinizi etkili bir şekilde düzenlemenize ve analiz etmenize olanak tanır.</li><li>Şablonlardan veya sıfırdan iş uygulamaları oluşturun.</li></ul>', 'Microsoft Office 365 Lisanslı Kullanıcı Hesabı – Tüm ofis programlarını (Excel, Word, Powerpoint vb.) 5 farklı cihazda (Pc, Mac, Anroid, İos) lisanslı olarak indirebilir ve kullanabilirsiniz.', 200.00, NULL, NULL, 'ce780bbd-38e7-469e-a18a-9e51998e04d6', 'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760109969704.jpg', NULL, 100, NULL, 1, 0, 0, 1, NULL, NULL, '2025-10-10 15:26:29', '2025-10-10 15:26:29'),
('205fc262-f2af-463f-8f25-f913a64679e8', 'Windows 11 Pro Key', 'windows-11-pro', 'Microsoft Windows 11 Pro işletim sistemi aktivasyon anahtarı. Profesyonel kullanım için geliştirilmiş özellikler.', 'Profesyonel işletim sistemi lisansı', 75.00, NULL, NULL, 'eb9c13a1-386a-45f7-b41a-969219dc28a5', 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&h=600&fit=crop', NULL, 500, NULL, 1, 0, 0, 1, NULL, NULL, '2025-10-06 17:19:05', '2025-10-06 17:19:05'),
('271dfde4-f86b-452d-b64e-9186f071da44', 'Canva Pro Öğrenci', 'canva-pro-ogrenci', '<p>Canva Pro Öğrenci Hesabı - 30 Gün Garantili</p>', 'Canva Pro Öğrenci Hesabı', 25.00, NULL, NULL, '37993932-f635-4ec4-864a-912ebb093b86', NULL, NULL, 1000, NULL, 1, 0, 0, 1, NULL, NULL, '2025-10-07 11:50:15', '2025-10-07 12:50:34'),
('2f3ee84d-b301-4376-a3f7-a621a918c3b2', 'Gemini Veo 3 Ultra(30 Gün)', 'gemini-veo-3-ultra-30-gun', '<h3><strong>Veo 3 – Yapay Zeka Destekli Video Üretiminde Yeni Bir Çağ Başlıyor</strong></h3><p>Görsel içerik üretiminin geleceği artık burada.&nbsp;<strong>Google DeepMind</strong>&nbsp;tarafından geliştirilen&nbsp;<strong>Veo 3</strong>, metinden video üretiminde çıtayı bir kez daha yukarı taşıyor. Gelişmiş yapay zeka modelleriyle desteklenen Veo 3, sadece birkaç cümlelik bir senaryodan, etkileyici, akıcı ve sinematik videolar üretebiliyor.</p><h4><strong>🚀 Öne Çıkan Özellikler</strong></h4><ul><li><strong>Yüksek Çözünürlük ve Kalite:</strong></li><li>Veo 3, 1080p çözünürlüğe kadar videolar üretebiliyor. Önceki sürümlere göre daha net görseller, daha az yapaylık ve daha iyi sahne geçişleri sunuyor.</li><li><strong>Gerçekçi Kamera Hareketleri:</strong></li><li>Sadece sahneleri değil, kameranın nasıl hareket etmesi gerektiğini de anlayabiliyor. Dolly, pan, tilt gibi profesyonel kamera hareketlerini taklit ederek sinematik bir hissiyat oluşturuyor.</li><li><strong>Zaman ve Olay Uyumu:</strong></li><li>İfade ettiğiniz zaman dilimi, hava durumu, ışık yönü ve hareket gibi ayrıntılar senaryoya uyumlu şekilde işleniyor. Örneğin, “akşam güneşi altında yürüyen bir çocuk” dediğinizde, ışığın yönü bile doğru hesaplanıyor.</li><li><strong>Stil ve Biçim Kontrolü:</strong></li><li>Belgesel, sinema, reklam ya da çizgi film tarzı… Hangi türde video istediğinizi belirtmeniz yeterli. Veo 3, istenilen stil doğrultusunda sahneleri yeniden yapılandırıyor.</li><li><strong>Video Düzenleme Desteği:</strong></li><li>Oluşturulan videolar, daha sonra yeniden yönlendirilebilir veya geliştirilebilir. Bu sayede içerik üreticileri, taslağı geliştirme sürecinde Veo 3’ü bir başlangıç noktası olarak da kullanabiliyor.</li></ul>', NULL, 100.00, NULL, NULL, 'f6b5f01c-a7b9-48ee-bbdb-9b44b4bf8398', 'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760110645224.jpg', NULL, 10, NULL, 1, 0, 0, 1, NULL, NULL, '2025-10-10 15:36:36', '2025-10-10 15:37:37'),
('2fb84de1-36e3-416b-abdb-83eaefb80f89', 'Windows 11 Pro Key', 'windows-11-pro-key', '<h1><strong>Windows 11 Pro Ürün Anahtarı</strong></h1><p>Dijital lisans ürününüzü satın aldıktan sonra faturanız ile birlikte 10 dk. içerisinde mail adresinize gönderiyoruz.</p><p>İşlem sırası:</p><p>1- Ürünü satın alın.</p><p>2- Satın aldığınıza dair onay mesajı tarafınıza gönderilir.</p><p>3- Siparişiniz alındı mailinden sonra, ürünleriniz mail adresinize gönderilir.</p><p>4- Size gönderilen mailde kurulum linkleri ve lisans bilgileri bulunmaktadır.</p><p>5- Satın aldıktan sonra alışverişinize ait faturanız mail adresinize gönderilir.</p><p><br></p><h2><strong>Windows 11 Pro Key Dijital Lisans Anahtarı Özellikleri</strong></h2><p>– Orjinal Microsoft Onaylı Windows 11 Pro Lisanstır.</p><p>– En Son Sürüm Lisans Anahtarıdır, Tüm güncelleştirmeleri yükleyebilirsiniz.</p><p>– Windows 11 pro lisans ürün anahtarını 32 Bit / 64 Bit Windows 11 Pro işletim sistemlerinde kullanabilirsiniz.</p><p>– MAK lisanstır, tek Pc içindir ve süresizdir, format sonrası kullanılamaz.</p>', NULL, 150.00, NULL, NULL, 'd960ecae-8fcd-4084-bdfb-369464bd87b4', 'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760109591768.webp', NULL, 1111, NULL, 1, 0, 0, 1, NULL, NULL, '2025-10-10 15:20:20', '2025-10-10 15:21:15'),
('30de177e-cd4a-4851-b44f-063164872771', 'Canva Pro Yıllık', 'canva-pro', 'Canva Pro ile tasarım dünyasının tüm imkanlarına erişin. Premium şablonlar, görseller ve özellikler.', 'Profesyonel tasarım aracı aboneliği', 1200.00, NULL, NULL, '37993932-f635-4ec4-864a-912ebb093b86', 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=600&fit=crop', NULL, 50, NULL, 1, 0, 0, 1, NULL, NULL, '2025-10-06 17:19:05', '2025-10-06 17:19:05'),
('3eeb67f8-40a6-44f4-95ff-1d721e361861', 'Random Steam Key', 'random-steam-key', '<p>qweqweqwe</p>', 'qweqwe', 10.00, NULL, NULL, '', NULL, NULL, 100, NULL, 1, 0, 0, 1, NULL, NULL, '2025-10-07 07:55:51', '2025-10-10 14:47:24'),
('408ef745-5456-4115-ad79-3a26034edc37', '100 Takipçi', '100-takipci', '<p>Instagram 100 Takipçi</p>', NULL, 10.00, NULL, NULL, '5e300196-8b4e-44d9-9020-d1fccccbe249', NULL, NULL, 0, NULL, 1, 0, 0, 1, NULL, NULL, '2025-10-07 12:58:42', '2025-10-10 11:56:26'),
('45f080dd-2e68-4ab7-ad97-a717b2482952', 'Windows 11 Pro OEM Key (Kopya)', 'windows-11-pro-oem-key-kopya', '<h1><strong>Windows 11 OEM Retail Ürün Anahtarı</strong></h1><p>Dijital lisans ürününüzü satın aldıktan sonra faturanız ile birlikte 10 dk. içerisinde mail adresinize gönderiyoruz.</p><p>İşlem sırası:</p><p>1- Ürünü satın alın.</p><p>2- Satın aldığınıza dair onay mesajı tarafınıza gönderilir.</p><p>3- Siparişiniz alındı mailinden sonra, ürünleriniz mail adresinize gönderilir.</p><p>4- Size gönderilen mailde kurulum linkleri ve lisans bilgileri bulunmaktadır.</p><p>5- Satın aldıktan sonra alışverişinize ait faturanız mail adresinize gönderilir.</p><p><br></p><h2><strong>Windows 11 OEM Retail Key Dijital Lisans Anahtarı Özellikleri</strong></h2><p>– Orjinal Microsoft Onaylı Windows 11 Pro Lisanstır.</p><p>– En Son Sürüm Lisans Anahtarıdır, Tüm güncelleştirmeleri yükleyebilirsiniz.</p><p>– Windows 11 pro lisans ürün anahtarını 32 Bit / 64 Bit Windows 11 Pro işletim sistemlerinde kullanabilirsiniz.</p><p>– MAK lisanstır, tek Pc içindir ve süresizdir, format sonrası kullanılamaz.</p>', NULL, 250.00, NULL, NULL, 'd960ecae-8fcd-4084-bdfb-369464bd87b4', 'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760109591768.webp', NULL, 1111, NULL, 1, 0, 0, 1, NULL, NULL, '2025-10-10 15:21:40', '2025-10-10 15:21:40'),
('4a9b363d-8402-4e89-8055-f58064eb462e', 'Cyberpunk 2077', 'cyberpunk-2077', '<p>Cyberpunk 2077 açık dünya aksiyon macera RPG oyunudur. Night City isimli devasa bir şehirde geçer ve oyuncuları zengin hikayesi ve derinlemesine rol yapma mekanikleriyle büyüler.</p>', 'Gelecek vizyonu, açık dünya RPG deneyimi', 1500.00, NULL, NULL, '12b202f2-144e-44f6-b2d8-04dac0ad900b', 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&h=600&fit=crop', NULL, 100, NULL, 1, 0, 0, 1, NULL, NULL, '2025-10-06 17:19:05', '2025-10-06 21:34:19'),
('505bb39c-cc6b-4747-9179-8257c147ab6f', 'Windows 11 Home Key', 'windows-11-home-key', '<h1><strong>Windows 11 Home Ürün Anahtarı</strong></h1><p>Dijital lisans ürününüzü satın aldıktan sonra faturanız ile birlikte 10 dk. içerisinde mail adresinize gönderiyoruz.</p><p>İşlem sırası:</p><p>1- Ürünü satın alın.</p><p>2- Satın aldığınıza dair onay mesajı tarafınıza gönderilir.</p><p>3- Siparişiniz alındı mailinden sonra, ürünleriniz mail adresinize gönderilir.</p><p>4- Size gönderilen mailde kurulum linkleri ve lisans bilgileri bulunmaktadır.</p><p>5- Satın aldıktan sonra alışverişinize ait faturanız mail adresinize gönderilir.</p><p><br></p><h2><strong>Windows 11 Home Key Dijital Lisans Anahtarı Özellikleri</strong></h2><p>– Orjinal Microsoft Onaylı Windows 11 Pro Lisanstır.</p><p>– En Son Sürüm Lisans Anahtarıdır, Tüm güncelleştirmeleri yükleyebilirsiniz.</p><p>– Windows 11 pro lisans ürün anahtarını 32 Bit / 64 Bit Windows 11 Pro işletim sistemlerinde kullanabilirsiniz.</p><p>– MAK lisanstır, tek Pc içindir ve süresizdir, format sonrası kullanılamaz.</p><p><br></p>', NULL, 100.00, NULL, NULL, 'd960ecae-8fcd-4084-bdfb-369464bd87b4', 'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760107763091.webp', NULL, 100, NULL, 1, 0, 0, 1, NULL, NULL, '2025-10-10 14:49:51', '2025-10-10 14:49:51'),
('610e1be2-39c7-4cb4-9f73-1ba506e0bb06', 'Office 2024 Pro Plus Key', 'office-2024-pro-plus-key', '<h1 class=\"ql-align-center\"><strong>Office 2024 Professional Plus</strong></h1><p>Microsoft’un en yeni ofis yazılım paketi olan Office 2024 Professional Plus, hem ev kullanıcıları hem de küçük işletmeler için tasarlanmış kapsamlı bir çözüm sunuyor. Bu paket, üretkenliğinizi artırmak ve iş süreçlerinizi kolaylaştırmak için en güncel araçları ve özellikleri içeriyor. Word, Excel, PowerPoint, Outlook ve OneNote gibi temel Office uygulamalarının son sürümlerini içerir. Kullanıcıların daha üretken, organize ve bağlantıda kalmalarına yardımcı olur. Özellikle küçük işletme sahipleri, serbest çalışanlar ve ev ofis kullanıcıları için idealdir.</p><h2 class=\"ql-align-center\"><strong>Office 2024 Professional Plus İçerdiği Uygulamalar:</strong></h2><p>&nbsp;</p><h3><img src=\"https://cdn-dynmedia-1.microsoft.com/is/image/microsoftcorp/Gldn_Word_Icon_111x111\" alt=\"Office Word 2024\" height=\"111\" width=\"111\"><strong>Microsoft Word 2024:</strong></h3><ul><li>İleri düzey yazı düzenleme ve doküman oluşturma araçları sunar.</li><li>Yeni şablonlar ve stillerle profesyonel belgeler oluşturma imkanı sağlar.</li><li>Yapay zeka destekli yazma asistanı ile yazım denetimi ve öneriler.</li></ul><p>&nbsp;</p><h3><img src=\"https://cdn-dynmedia-1.microsoft.com/is/image/microsoftcorp/Gldn_Excel_Icon_111x111\" alt=\"Office Excel 2024\" height=\"111\" width=\"111\"><strong>Microsoft Excel 2024:</strong></h3><ul><li>Gelişmiş veri analizi ve görselleştirme araçları içerir.</li><li>Formüller ve işlevler ile veri yönetimini kolaylaştırır.</li><li>Yeni grafikler ve veri modelleme araçları ile raporlar oluşturmayı hızlandırır.</li></ul><p>&nbsp;</p><h3><img src=\"https://cdn-dynmedia-1.microsoft.com/is/image/microsoftcorp/Gldn_PPT_Icon_111x111\" alt=\"Office 2024 PowerPoint\" height=\"111\" width=\"111\"><strong>Microsoft PowerPoint 2024:</strong></h3><ul><li>Profesyonel sunumlar oluşturmak için modern şablonlar ve animasyonlar sunar.</li><li>Sunucu notları ve işbirliği özellikleri ile toplantılar için uygun.</li><li>Yeni görsel efektler ve tasarım önerileri ile daha çekici sunumlar.</li></ul><p>&nbsp;</p><h3><img src=\"https://cdn-dynmedia-1.microsoft.com/is/image/microsoftcorp/Gldn_Outlook_Icon_111x111\" alt=\"Office 2024 Outlook\" height=\"111\" width=\"111\"><strong>Microsoft Outlook 2024:</strong></h3><ul><li>E-posta yönetimini kolaylaştıran gelişmiş arama ve filtreleme seçenekleri.</li><li>Takvim entegrasyonu ile zaman yönetimi ve toplantı planlaması.</li><li>Güçlü güvenlik özellikleri ile spam ve zararlı içeriklerden korunma.</li></ul><p>&nbsp;</p><h3><img src=\"https://cdn-dynmedia-1.microsoft.com/is/image/microsoftcorp/Gldn_OneNote_Icon_111x111\" alt=\"Office 2024 OneNote\" height=\"111\" width=\"111\"><strong>Microsoft OneNote 2024:</strong></h3><ul><li>Notlarınızı organize etme ve saklama için güçlü bir araç.</li><li>El yazısı desteği ve dijital mürekkep ile notlarınızı daha kişisel hale getirebilirsiniz.</li><li>Fikirlerinizi, toplantı notlarını ve araştırmalarınızı bir arada tutar.</li></ul><p>&nbsp;</p><h3><img src=\"https://cdn-dynmedia-1.microsoft.com/is/image/microsoftcorp/Access_1555x1555?hei=111&amp;wid=111\" alt=\"Office 2024 Access\" height=\"111\" width=\"111\"><strong>Microsoft Access 2024:</strong></h3><ul><li>Veri tabanı yönetimi için güçlü araçlar ile işinizi kolaylaştırın.</li><li>Bilgilerinizi etkili bir şekilde düzenlemenize ve analiz etmenize olanak tanır.</li><li>Şablonlardan veya sıfırdan iş uygulamaları oluşturun.</li></ul>', 'Office 2024 Professional Plus ürün etkinleştirme anahtarıdır.', 500.00, NULL, NULL, 'ce780bbd-38e7-469e-a18a-9e51998e04d6', 'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760110010899.jpeg', NULL, 100, NULL, 1, 0, 0, 1, NULL, NULL, '2025-10-10 15:24:48', '2025-10-10 15:27:01'),
('6445f323-71c9-43a6-bda7-62df52c6af58', 'Windows 11 Education Key', 'windows-11-education-key', '<h1><strong>Windows 11 </strong>Education <strong>Retail Ürün Anahtarı</strong></h1><p>Dijital lisans ürününüzü satın aldıktan sonra faturanız ile birlikte 10 dk. içerisinde mail adresinize gönderiyoruz.</p><p>İşlem sırası:</p><p>1- Ürünü satın alın.</p><p>2- Satın aldığınıza dair onay mesajı tarafınıza gönderilir.</p><p>3- Siparişiniz alındı mailinden sonra, ürünleriniz mail adresinize gönderilir.</p><p>4- Size gönderilen mailde kurulum linkleri ve lisans bilgileri bulunmaktadır.</p><p>5- Satın aldıktan sonra alışverişinize ait faturanız mail adresinize gönderilir.</p><p><br></p><h2><strong>Windows 11 Education Key Dijital Lisans Anahtarı Özellikleri</strong></h2><p>– Orjinal Microsoft Onaylı Windows 11 Pro Lisanstır.</p><p>– En Son Sürüm Lisans Anahtarıdır, Tüm güncelleştirmeleri yükleyebilirsiniz.</p><p>– Windows 11 pro lisans ürün anahtarını 32 Bit / 64 Bit Windows 11 Pro işletim sistemlerinde kullanabilirsiniz.</p><p>– MAK lisanstır, tek Pc içindir ve süresizdir, format sonrası kullanılamaz.</p>', NULL, 49.99, NULL, NULL, 'd960ecae-8fcd-4084-bdfb-369464bd87b4', 'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760109591768.webp', NULL, 1000, NULL, 1, 0, 0, 1, NULL, NULL, '2025-10-10 15:23:15', '2025-10-10 15:23:15'),
('6c76a7b2-54ed-4290-8d83-c118533c5ee0', 'Windows 11 Pro Retail Key', 'windows-11-pro-retail-key', '<h1><strong>Windows 11 Pro Retail Ürün Anahtarı</strong></h1><p>Dijital lisans ürününüzü satın aldıktan sonra faturanız ile birlikte 10 dk. içerisinde mail adresinize gönderiyoruz.</p><p>İşlem sırası:</p><p>1- Ürünü satın alın.</p><p>2- Satın aldığınıza dair onay mesajı tarafınıza gönderilir.</p><p>3- Siparişiniz alındı mailinden sonra, ürünleriniz mail adresinize gönderilir.</p><p>4- Size gönderilen mailde kurulum linkleri ve lisans bilgileri bulunmaktadır.</p><p>5- Satın aldıktan sonra alışverişinize ait faturanız mail adresinize gönderilir.</p><p><br></p><h2><strong>Windows 11 Pro Retail Key Dijital Lisans Anahtarı Özellikleri</strong></h2><p>– Orjinal Microsoft Onaylı Windows 11 Pro Lisanstır.</p><p>– En Son Sürüm Lisans Anahtarıdır, Tüm güncelleştirmeleri yükleyebilirsiniz.</p><p>– Windows 11 pro lisans ürün anahtarını 32 Bit / 64 Bit Windows 11 Pro işletim sistemlerinde kullanabilirsiniz.</p><p>– MAK lisanstır, tek Pc içindir ve süresizdir, format sonrası kullanılamaz.</p>', NULL, 200.00, NULL, NULL, 'd960ecae-8fcd-4084-bdfb-369464bd87b4', 'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760109591768.webp', NULL, 1111, NULL, 1, 0, 0, 1, NULL, NULL, '2025-10-10 15:21:07', '2025-10-10 15:21:07'),
('7495db5f-293d-46a8-9f25-d7efa6881043', 'USA Gmail Hesap (2020)', 'usa-gmail-hesap-2020', '<p>Gmail hesapları USA iplerden açılmıştır.</p><p>Kurtarma e-postası eklidir.</p><p>Kurtarma telefon numarası eklidir.</p><p><br></p><p>İlk girişte telafi vardır.</p>', NULL, 10.00, NULL, NULL, '', 'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760083220733.webp', NULL, 3, NULL, 1, 0, 0, 1, NULL, NULL, '2025-10-10 08:01:29', '2025-10-10 14:45:27'),
('8cc7a560-15b4-4c52-a542-f6687e79d124', 'Adobe Stock', 'adobe-stock', '<p>1 Yıllık adobe stock.</p>', '1 Yıllık', 150.00, NULL, NULL, '2f5f92ed-ed22-44e7-a92a-337e8956ce42', 'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760110806672.png', NULL, 5, NULL, 1, 0, 0, 1, NULL, NULL, '2025-10-10 15:40:21', '2025-10-10 15:40:21'),
('972d19c9-5c5c-48e8-9d42-a46cc5121bd2', 'Windows 11 Enterprise Key', 'windows-11-enterprise-key', '<h1><strong>Windows 11 </strong>Enterprise&nbsp;<strong>Retail Ürün Anahtarı</strong></h1><p>Dijital lisans ürününüzü satın aldıktan sonra faturanız ile birlikte 10 dk. içerisinde mail adresinize gönderiyoruz.</p><p>İşlem sırası:</p><p>1- Ürünü satın alın.</p><p>2- Satın aldığınıza dair onay mesajı tarafınıza gönderilir.</p><p>3- Siparişiniz alındı mailinden sonra, ürünleriniz mail adresinize gönderilir.</p><p>4- Size gönderilen mailde kurulum linkleri ve lisans bilgileri bulunmaktadır.</p><p>5- Satın aldıktan sonra alışverişinize ait faturanız mail adresinize gönderilir.</p><p><br></p><h2><strong>Windows 11 Enterprise Key Dijital Lisans Anahtarı Özellikleri</strong></h2><p>– Orjinal Microsoft Onaylı Windows 11 Pro Lisanstır.</p><p>– En Son Sürüm Lisans Anahtarıdır, Tüm güncelleştirmeleri yükleyebilirsiniz.</p><p>– Windows 11 pro lisans ürün anahtarını 32 Bit / 64 Bit Windows 11 Pro işletim sistemlerinde kullanabilirsiniz.</p><p>– MAK lisanstır, tek Pc içindir ve süresizdir, format sonrası kullanılamaz.</p>', NULL, 300.00, NULL, NULL, 'd960ecae-8fcd-4084-bdfb-369464bd87b4', 'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760109591768.webp', NULL, 1111, NULL, 1, 0, 0, 1, NULL, NULL, '2025-10-10 15:22:18', '2025-10-10 15:22:18'),
('975d48da-e57e-4f6e-97b1-a6a9ddabbf1d', '1000 Takipçi', '1000-takipci', '<p>Instagram 1000 Takipçi</p>', NULL, 100.00, NULL, NULL, '5e300196-8b4e-44d9-9020-d1fccccbe249', 'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760111191345.jpg', NULL, 9999999, NULL, 1, 0, 0, 1, NULL, NULL, '2025-10-10 15:46:46', '2025-10-10 15:46:46'),
('97fb37cc-7b93-49b9-a1e9-d9d34f33bbc1', '250 Takipçi', '250-takipci', '<p>Instagram 100 Takipçi</p>', NULL, 25.00, NULL, NULL, '5e300196-8b4e-44d9-9020-d1fccccbe249', 'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760111086369.jpg', NULL, 9999999, NULL, 1, 0, 0, 1, NULL, NULL, '2025-10-10 15:45:01', '2025-10-10 15:46:05'),
('a76e27ef-e486-4cf8-b765-e12e51d52768', 'Adobe Photoshop Lisans Key', 'adobe-photoshop-lisans-key', '<p>1 Yıllık adobe photoshop lisans key</p>', '1 Yıllık', 179.99, NULL, NULL, '2f5f92ed-ed22-44e7-a92a-337e8956ce42', 'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760110968649.png', NULL, 11, NULL, 1, 0, 0, 1, NULL, NULL, '2025-10-10 15:43:03', '2025-10-16 08:32:29'),
('a8d31476-b416-4b07-9a86-618112fc156d', 'Adobe Illustrator Lisans Key', 'adobe-illustrator-lisans-key', '<p>1 Yıllık adobe illustrator lisans key</p>', '1 Yıllık', 200.00, NULL, NULL, '2f5f92ed-ed22-44e7-a92a-337e8956ce42', 'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760110917075.png', NULL, 5, NULL, 1, 0, 0, 1, NULL, NULL, '2025-10-10 15:42:14', '2025-10-10 15:42:14'),
('ba71df27-d8c3-41c0-ac01-cb7ac9ebea42', 'ChatGPT Plus Hesap(30 Gün)', 'chatgpt-plus-hesap', '<ul><li><strong style=\"color: rgb(255, 255, 255); background-color: rgb(230, 0, 0);\">SINIRSIZ GPT-5</strong><span style=\"color: rgb(224, 231, 255); background-color: rgb(230, 0, 0);\">&nbsp;ve görüntü/video oluşturma</span></li><li><strong style=\"color: rgb(255, 255, 255); background-color: rgb(230, 0, 0);\">2’ye kadar eş zamanlı</strong><span style=\"color: rgb(224, 231, 255); background-color: rgb(230, 0, 0);\">&nbsp;üretim imkanı</span></li><li><strong style=\"color: rgb(255, 255, 255); background-color: rgb(230, 0, 0);\">32K Bağlam Penceresi</strong><span style=\"color: rgb(224, 231, 255); background-color: rgb(230, 0, 0);\">&nbsp;ve gelişmiş analiz</span></li><li><strong style=\"color: rgb(255, 255, 255); background-color: rgb(230, 0, 0);\">Video Oluşturma:</strong><span style=\"color: rgb(224, 231, 255); background-color: rgb(230, 0, 0);\">&nbsp;720p’de 5 saniye veya 480p’de 10 saniye</span></li><li><strong style=\"color: rgb(255, 255, 255); background-color: rgb(230, 0, 0);\">ChatGPT Ajanı</strong><span style=\"color: rgb(224, 231, 255); background-color: rgb(230, 0, 0);\">&nbsp;ve otomatik görev planlama</span></li><li><strong style=\"color: rgb(255, 255, 255); background-color: rgb(230, 0, 0);\">Daha yüksek yanıt hızları</strong><span style=\"color: rgb(224, 231, 255); background-color: rgb(230, 0, 0);\">&nbsp;ve öncelikli destek</span></li></ul><p><br></p>', NULL, 100.00, NULL, NULL, 'f6b5f01c-a7b9-48ee-bbdb-9b44b4bf8398', 'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760110321803.jpeg', NULL, 10, NULL, 1, 0, 0, 1, NULL, NULL, '2025-10-10 15:33:19', '2025-10-10 15:33:19'),
('bfb8d1cb-721a-4756-830b-a95454e1d5f1', 'SMM Paket Satış Scripti', 'smm-paket-satis-scripti', '<p>SMM Paket Satış Scripti</p>', NULL, 2500.00, NULL, NULL, 'eb9c13a1-386a-45f7-b41a-969219dc28a5', 'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760023662694.jpg', NULL, 0, NULL, 1, 0, 0, 1, NULL, NULL, '2025-10-09 15:28:16', '2025-10-13 21:16:37'),
('c4e5b6c5-131f-4327-88bc-9c2fe09d5366', 'Adobe Acrobat Pro', 'adobe-acrobat-pro', '<p>1 Yıllık adobe acrobat reader pro.</p>', '1 Yıllık', 150.00, NULL, NULL, '2f5f92ed-ed22-44e7-a92a-337e8956ce42', 'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760110868758.jpeg', NULL, 5, NULL, 1, 0, 0, 1, NULL, NULL, '2025-10-10 15:41:25', '2025-10-10 15:41:25'),
('d0550d22-210a-4cdb-ae0c-4e57b5b3b7bf', 'Pubg Mobile 60 UC', 'pubg-mobile-60-uc', '<p><strong style=\"background-color: transparent;\">PUBG Mobile 60 UC Satın Al</strong>&nbsp;işleminizi güvenilir ve hızlı bir şekilde gerçekleştirin. PUBG Mobile oyununda kullanabileceğiniz&nbsp;<span style=\"background-color: transparent;\">60 UC Unknown Cash</span>&nbsp;ile oyun içi alışverişlerinizi rahatça yapabilir, karakterinizi ve ekipmanlarınızı geliştirebilirsiniz. Satın aldığınız&nbsp;<span style=\"background-color: transparent;\">60 UC</span>&nbsp;anında oyun hesabınıza yüklenir ve sadece&nbsp;<span style=\"background-color: transparent;\">Türkiye Sunucusu</span>&nbsp;için geçerlidir. 7/24 hizmet sunarak,&nbsp;<strong style=\"background-color: transparent;\">PUBG Mobile UC satın alma</strong><strong>&nbsp;</strong>işlemlerinizde en hızlı çözümü sağlıyoruz. Güvenli ödeme yöntemleri ve anında teslimat garantisi ile&nbsp;<span style=\"background-color: transparent;\">Hesap.com.tr</span>, PUBG deneyiminizi en üst seviyeye taşıyın. UC satın alarak yeni kostümler, silah kaplamaları, sandıklar ve diğer özel içeriklere hemen sahip olabilirsiniz.</p><p><br></p><p><span style=\"background-color: transparent;\">PUBG Mobile 60 UC ID Yükleme</span>&nbsp;işlemi oldukça basittir. Siparişinizi verirken oyuncu ID\'nizi girmeniz yeterlidir. Siparişiniz alındıktan sonra 1-5 dakika içerisinde&nbsp;<span style=\"background-color: transparent;\">60 UC</span>&nbsp;hesabınıza otomatik olarak yüklenecektir. Bu sayede hızlı ve sorunsuz bir şekilde oyun içi alışverişlerinize devam edebilirsiniz.</p>', 'PUBG Mobile 60 UC Satın Al', 100.00, NULL, NULL, 'ad366810-9c8c-4b3e-b493-d6b3fce09875', 'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1759825940580.webp', NULL, 3, NULL, 1, 0, 0, 1, NULL, NULL, '2025-10-07 08:32:52', '2025-10-10 11:56:33'),
('d8f607f5-5da9-47a5-ba66-f4835a155a2e', 'Adobe Creative Cloud ', 'adobe-creative-cloud', '<p>1 Yıllık adobe creative cloud.</p>', '1 Yıllık', 3000.00, NULL, NULL, '2f5f92ed-ed22-44e7-a92a-337e8956ce42', NULL, NULL, 5, NULL, 1, 0, 0, 1, NULL, NULL, '2025-10-07 07:54:53', '2025-10-10 15:39:20'),
('d9845b72-9e45-45ee-aaad-da3e8466e2f1', 'Office 2021 Pro Plus Key', 'office-2021-pro-plus-key', '<h1 class=\"ql-align-center\"><strong>Office 2024 Professional Plus</strong></h1><p>Microsoft’un en yeni ofis yazılım paketi olan Office 2024 Professional Plus, hem ev kullanıcıları hem de küçük işletmeler için tasarlanmış kapsamlı bir çözüm sunuyor. Bu paket, üretkenliğinizi artırmak ve iş süreçlerinizi kolaylaştırmak için en güncel araçları ve özellikleri içeriyor. Word, Excel, PowerPoint, Outlook ve OneNote gibi temel Office uygulamalarının son sürümlerini içerir. Kullanıcıların daha üretken, organize ve bağlantıda kalmalarına yardımcı olur. Özellikle küçük işletme sahipleri, serbest çalışanlar ve ev ofis kullanıcıları için idealdir.</p><h2 class=\"ql-align-center\"><strong>Office 2024 Professional Plus İçerdiği Uygulamalar:</strong></h2><p>&nbsp;</p><h3><img src=\"https://cdn-dynmedia-1.microsoft.com/is/image/microsoftcorp/Gldn_Word_Icon_111x111\" alt=\"Office Word 2024\" height=\"111\" width=\"111\"><strong>Microsoft Word 2024:</strong></h3><ul><li>İleri düzey yazı düzenleme ve doküman oluşturma araçları sunar.</li><li>Yeni şablonlar ve stillerle profesyonel belgeler oluşturma imkanı sağlar.</li><li>Yapay zeka destekli yazma asistanı ile yazım denetimi ve öneriler.</li></ul><p>&nbsp;</p><h3><img src=\"https://cdn-dynmedia-1.microsoft.com/is/image/microsoftcorp/Gldn_Excel_Icon_111x111\" alt=\"Office Excel 2024\" height=\"111\" width=\"111\"><strong>Microsoft Excel 2024:</strong></h3><ul><li>Gelişmiş veri analizi ve görselleştirme araçları içerir.</li><li>Formüller ve işlevler ile veri yönetimini kolaylaştırır.</li><li>Yeni grafikler ve veri modelleme araçları ile raporlar oluşturmayı hızlandırır.</li></ul><p>&nbsp;</p><h3><img src=\"https://cdn-dynmedia-1.microsoft.com/is/image/microsoftcorp/Gldn_PPT_Icon_111x111\" alt=\"Office 2024 PowerPoint\" height=\"111\" width=\"111\"><strong>Microsoft PowerPoint 2024:</strong></h3><ul><li>Profesyonel sunumlar oluşturmak için modern şablonlar ve animasyonlar sunar.</li><li>Sunucu notları ve işbirliği özellikleri ile toplantılar için uygun.</li><li>Yeni görsel efektler ve tasarım önerileri ile daha çekici sunumlar.</li></ul><p>&nbsp;</p><h3><img src=\"https://cdn-dynmedia-1.microsoft.com/is/image/microsoftcorp/Gldn_Outlook_Icon_111x111\" alt=\"Office 2024 Outlook\" height=\"111\" width=\"111\"><strong>Microsoft Outlook 2024:</strong></h3><ul><li>E-posta yönetimini kolaylaştıran gelişmiş arama ve filtreleme seçenekleri.</li><li>Takvim entegrasyonu ile zaman yönetimi ve toplantı planlaması.</li><li>Güçlü güvenlik özellikleri ile spam ve zararlı içeriklerden korunma.</li></ul><p>&nbsp;</p><h3><img src=\"https://cdn-dynmedia-1.microsoft.com/is/image/microsoftcorp/Gldn_OneNote_Icon_111x111\" alt=\"Office 2024 OneNote\" height=\"111\" width=\"111\"><strong>Microsoft OneNote 2024:</strong></h3><ul><li>Notlarınızı organize etme ve saklama için güçlü bir araç.</li><li>El yazısı desteği ve dijital mürekkep ile notlarınızı daha kişisel hale getirebilirsiniz.</li><li>Fikirlerinizi, toplantı notlarını ve araştırmalarınızı bir arada tutar.</li></ul><p>&nbsp;</p><h3><img src=\"https://cdn-dynmedia-1.microsoft.com/is/image/microsoftcorp/Access_1555x1555?hei=111&amp;wid=111\" alt=\"Office 2024 Access\" height=\"111\" width=\"111\"><strong>Microsoft Access 2024:</strong></h3><ul><li>Veri tabanı yönetimi için güçlü araçlar ile işinizi kolaylaştırın.</li><li>Bilgilerinizi etkili bir şekilde düzenlemenize ve analiz etmenize olanak tanır.</li><li>Şablonlardan veya sıfırdan iş uygulamaları oluşturun.</li></ul>', 'Office 2021 Professional Plus ürün etkinleştirme anahtarıdır.\n', 777.00, NULL, NULL, 'ce780bbd-38e7-469e-a18a-9e51998e04d6', 'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760110070547.webp', NULL, 100, NULL, 1, 0, 0, 1, NULL, NULL, '2025-10-10 15:28:13', '2025-10-10 15:28:13'),
('fc0dbe1c-34f3-4906-97bd-b0666b55ded0', 'Office 2016 Professional Plus Lisans', 'office-2016-professional-plus-lisans', '<h1 class=\"ql-align-center\"><strong>Office 2024 Professional Plus</strong></h1><p>Microsoft’un en yeni ofis yazılım paketi olan Office 2024 Professional Plus, hem ev kullanıcıları hem de küçük işletmeler için tasarlanmış kapsamlı bir çözüm sunuyor. Bu paket, üretkenliğinizi artırmak ve iş süreçlerinizi kolaylaştırmak için en güncel araçları ve özellikleri içeriyor. Word, Excel, PowerPoint, Outlook ve OneNote gibi temel Office uygulamalarının son sürümlerini içerir. Kullanıcıların daha üretken, organize ve bağlantıda kalmalarına yardımcı olur. Özellikle küçük işletme sahipleri, serbest çalışanlar ve ev ofis kullanıcıları için idealdir.</p><h2 class=\"ql-align-center\"><strong>Office 2024 Professional Plus İçerdiği Uygulamalar:</strong></h2><p>&nbsp;</p><h3><img src=\"https://cdn-dynmedia-1.microsoft.com/is/image/microsoftcorp/Gldn_Word_Icon_111x111\" alt=\"Office Word 2024\" height=\"111\" width=\"111\"><strong>Microsoft Word 2024:</strong></h3><ul><li>İleri düzey yazı düzenleme ve doküman oluşturma araçları sunar.</li><li>Yeni şablonlar ve stillerle profesyonel belgeler oluşturma imkanı sağlar.</li><li>Yapay zeka destekli yazma asistanı ile yazım denetimi ve öneriler.</li></ul><p>&nbsp;</p><h3><img src=\"https://cdn-dynmedia-1.microsoft.com/is/image/microsoftcorp/Gldn_Excel_Icon_111x111\" alt=\"Office Excel 2024\" height=\"111\" width=\"111\"><strong>Microsoft Excel 2024:</strong></h3><ul><li>Gelişmiş veri analizi ve görselleştirme araçları içerir.</li><li>Formüller ve işlevler ile veri yönetimini kolaylaştırır.</li><li>Yeni grafikler ve veri modelleme araçları ile raporlar oluşturmayı hızlandırır.</li></ul><p>&nbsp;</p><h3><img src=\"https://cdn-dynmedia-1.microsoft.com/is/image/microsoftcorp/Gldn_PPT_Icon_111x111\" alt=\"Office 2024 PowerPoint\" height=\"111\" width=\"111\"><strong>Microsoft PowerPoint 2024:</strong></h3><ul><li>Profesyonel sunumlar oluşturmak için modern şablonlar ve animasyonlar sunar.</li><li>Sunucu notları ve işbirliği özellikleri ile toplantılar için uygun.</li><li>Yeni görsel efektler ve tasarım önerileri ile daha çekici sunumlar.</li></ul><p>&nbsp;</p><h3><img src=\"https://cdn-dynmedia-1.microsoft.com/is/image/microsoftcorp/Gldn_Outlook_Icon_111x111\" alt=\"Office 2024 Outlook\" height=\"111\" width=\"111\"><strong>Microsoft Outlook 2024:</strong></h3><ul><li>E-posta yönetimini kolaylaştıran gelişmiş arama ve filtreleme seçenekleri.</li><li>Takvim entegrasyonu ile zaman yönetimi ve toplantı planlaması.</li><li>Güçlü güvenlik özellikleri ile spam ve zararlı içeriklerden korunma.</li></ul><p>&nbsp;</p><h3><img src=\"https://cdn-dynmedia-1.microsoft.com/is/image/microsoftcorp/Gldn_OneNote_Icon_111x111\" alt=\"Office 2024 OneNote\" height=\"111\" width=\"111\"><strong>Microsoft OneNote 2024:</strong></h3><ul><li>Notlarınızı organize etme ve saklama için güçlü bir araç.</li><li>El yazısı desteği ve dijital mürekkep ile notlarınızı daha kişisel hale getirebilirsiniz.</li><li>Fikirlerinizi, toplantı notlarını ve araştırmalarınızı bir arada tutar.</li></ul><p>&nbsp;</p><h3><img src=\"https://cdn-dynmedia-1.microsoft.com/is/image/microsoftcorp/Access_1555x1555?hei=111&amp;wid=111\" alt=\"Office 2024 Access\" height=\"111\" width=\"111\"><strong>Microsoft Access 2024:</strong></h3><ul><li>Veri tabanı yönetimi için güçlü araçlar ile işinizi kolaylaştırın.</li><li>Bilgilerinizi etkili bir şekilde düzenlemenize ve analiz etmenize olanak tanır.</li><li>Şablonlardan veya sıfırdan iş uygulamaları oluşturun.</li></ul>', 'Office 2021 Professional Plus ürün etkinleştirme anahtarıdır.\n', 650.00, NULL, NULL, 'ce780bbd-38e7-469e-a18a-9e51998e04d6', 'https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/1760110127790.jpeg', NULL, 100, NULL, 1, 0, 0, 1, NULL, NULL, '2025-10-10 15:28:59', '2025-10-10 15:28:59');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `product_faqs`
--

CREATE TABLE `product_faqs` (
  `id` char(36) NOT NULL,
  `product_id` char(36) NOT NULL,
  `question` varchar(500) NOT NULL,
  `answer` text NOT NULL,
  `order_num` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Tablo döküm verisi `product_faqs`
--

INSERT INTO `product_faqs` (`id`, `product_id`, `question`, `answer`, `order_num`, `created_at`, `updated_at`) VALUES
('03634c7c-a8b7-481a-b384-dec939016b05', '972d19c9-5c5c-48e8-9d42-a46cc5121bd2', 'Windows 11 Enterprise Key orijinal ve güvenilir mi?', 'Evet, Windows 11 Enterprise Key ürünümüz tamamen orijinal ve lisanslıdır. Tüm satışlarımız güvenli ödeme sistemleri üzerinden gerçekleşir ve ürün garantisi sağlanır.', 2, '2025-10-10 18:45:37', '2025-10-10 18:45:37'),
('08503efd-cd86-44d7-980a-733b69d5d89a', '058e9ccd-f99d-4601-90ca-597fb3d4430f', 'ChatGPT Business Hesap(30 Gün) orijinal ve güvenilir mi?', 'Evet, ChatGPT Business Hesap(30 Gün) ürünümüz tamamen orijinal ve lisanslıdır. Tüm satışlarımız güvenli ödeme sistemleri üzerinden gerçekleşir ve ürün garantisi sağlanır.', 2, '2025-10-10 18:45:37', '2025-10-10 18:45:37'),
('0a525f0b-1740-4919-ab20-96780dba6ec1', 'c4e5b6c5-131f-4327-88bc-9c2fe09d5366', 'Adobe Acrobat Pro orijinal ve güvenilir mi?', 'Evet, Adobe Acrobat Pro ürünümüz tamamen orijinal ve lisanslıdır. Tüm satışlarımız güvenli ödeme sistemleri üzerinden gerçekleşir ve ürün garantisi sağlanır.', 2, '2025-10-10 18:45:37', '2025-10-10 18:45:37'),
('1337e28a-8016-46f4-86d8-100092b1dd2b', '972d19c9-5c5c-48e8-9d42-a46cc5121bd2', 'Bu ürün ne kadar sürede teslim edilir?', 'Ürün satın alma işleminiz tamamlandıktan sonra genellikle 1-5 dakika içinde otomatik olarak hesabınıza teslim edilir. Acil durumlarda 7/24 destek ekibimizle iletişime geçebilirsiniz.', 1, '2025-10-10 18:45:37', '2025-10-10 18:45:37'),
('174b3648-262a-426c-b94a-db748d351b72', '3eeb67f8-40a6-44f4-95ff-1d721e361861', 'Bu ürün ne kadar sürede teslim edilir?', 'Ürün satın alma işleminiz tamamlandıktan sonra genellikle 1-5 dakika içinde otomatik olarak hesabınıza teslim edilir. Acil durumlarda 7/24 destek ekibimizle iletişime geçebilirsiniz.', 1, '2025-10-10 18:45:37', '2025-10-10 18:45:37'),
('22d0cfa7-a36b-4df5-9947-c3170cf3f367', 'd8f607f5-5da9-47a5-ba66-f4835a155a2e', 'Adobe Creative Cloud  orijinal ve güvenilir mi?', 'Evet, Adobe Creative Cloud  ürünümüz tamamen orijinal ve lisanslıdır. Tüm satışlarımız güvenli ödeme sistemleri üzerinden gerçekleşir ve ürün garantisi sağlanır.', 2, '2025-10-10 18:45:37', '2025-10-10 18:45:37'),
('238a9f69-9a47-4ef8-991e-d9792ed83cf5', '205fc262-f2af-463f-8f25-f913a64679e8', 'Windows 11 Pro Key orijinal ve güvenilir mi?', 'Evet, Windows 11 Pro Key ürünümüz tamamen orijinal ve lisanslıdır. Tüm satışlarımız güvenli ödeme sistemleri üzerinden gerçekleşir ve ürün garantisi sağlanır.', 2, '2025-10-10 18:45:37', '2025-10-10 18:45:37'),
('24ccde8e-436e-41be-8ae5-b90275ae5e0a', '97fb37cc-7b93-49b9-a1e9-d9d34f33bbc1', '250 Takipçi orijinal ve güvenilir mi?', 'Evet, 250 Takipçi ürünümüz tamamen orijinal ve lisanslıdır. Tüm satışlarımız güvenli ödeme sistemleri üzerinden gerçekleşir ve ürün garantisi sağlanır.', 2, '2025-10-10 18:45:37', '2025-10-10 18:45:37'),
('2ce11d5e-2702-4218-9349-147d8d07931e', '6c76a7b2-54ed-4290-8d83-c118533c5ee0', 'Windows 11 Pro Retail Key orijinal ve güvenilir mi?', 'Evet, Windows 11 Pro Retail Key ürünümüz tamamen orijinal ve lisanslıdır. Tüm satışlarımız güvenli ödeme sistemleri üzerinden gerçekleşir ve ürün garantisi sağlanır.', 2, '2025-10-10 18:45:37', '2025-10-10 18:45:37'),
('2d981e99-eb41-4866-8be0-7d478132b8c1', '610e1be2-39c7-4cb4-9f73-1ba506e0bb06', 'Bu ürün ne kadar sürede teslim edilir?', 'Ürün satın alma işleminiz tamamlandıktan sonra genellikle 1-5 dakika içinde otomatik olarak hesabınıza teslim edilir. Acil durumlarda 7/24 destek ekibimizle iletişime geçebilirsiniz.', 1, '2025-10-10 18:45:37', '2025-10-10 18:45:37'),
('2ee76880-0590-45cf-a25f-a81f7e1b17f1', 'ba71df27-d8c3-41c0-ac01-cb7ac9ebea42', 'ChatGPT Plus Hesap(30 Gün) orijinal ve güvenilir mi?', 'Evet, ChatGPT Plus Hesap(30 Gün) ürünümüz tamamen orijinal ve lisanslıdır. Tüm satışlarımız güvenli ödeme sistemleri üzerinden gerçekleşir ve ürün garantisi sağlanır.', 2, '2025-10-10 18:45:37', '2025-10-10 18:45:37'),
('350e9359-ea29-4e77-b7a4-b653f89a502f', '2f3ee84d-b301-4376-a3f7-a621a918c3b2', 'Gemini Veo 3 Ultra(30 Gün) orijinal ve güvenilir mi?', 'Evet, Gemini Veo 3 Ultra(30 Gün) ürünümüz tamamen orijinal ve lisanslıdır. Tüm satışlarımız güvenli ödeme sistemleri üzerinden gerçekleşir ve ürün garantisi sağlanır.', 2, '2025-10-10 18:45:37', '2025-10-10 18:45:37'),
('38ac3e87-067d-4936-bcb0-ec4dc4ab0f6a', '6445f323-71c9-43a6-bda7-62df52c6af58', 'Windows 11 Education Key orijinal ve güvenilir mi?', 'Evet, Windows 11 Education Key ürünümüz tamamen orijinal ve lisanslıdır. Tüm satışlarımız güvenli ödeme sistemleri üzerinden gerçekleşir ve ürün garantisi sağlanır.', 2, '2025-10-10 18:45:37', '2025-10-10 18:45:37'),
('38e1b8a8-1cba-44a9-8afa-c1be8944072a', '6445f323-71c9-43a6-bda7-62df52c6af58', 'Bu ürün ne kadar sürede teslim edilir?', 'Ürün satın alma işleminiz tamamlandıktan sonra genellikle 1-5 dakika içinde otomatik olarak hesabınıza teslim edilir. Acil durumlarda 7/24 destek ekibimizle iletişime geçebilirsiniz.', 1, '2025-10-10 18:45:37', '2025-10-10 18:45:37'),
('3b56655b-5ff0-45c5-97c1-1dd0103a1ade', '97fb37cc-7b93-49b9-a1e9-d9d34f33bbc1', 'Bu ürün ne kadar sürede teslim edilir?', 'Ürün satın alma işleminiz tamamlandıktan sonra genellikle 1-5 dakika içinde otomatik olarak hesabınıza teslim edilir. Acil durumlarda 7/24 destek ekibimizle iletişime geçebilirsiniz.', 1, '2025-10-10 18:45:37', '2025-10-10 18:45:37'),
('3e2e306e-3114-4560-a07c-b3ee781cbaf1', '8cc7a560-15b4-4c52-a542-f6687e79d124', 'Bu ürün ne kadar sürede teslim edilir?', 'Ürün satın alma işleminiz tamamlandıktan sonra genellikle 1-5 dakika içinde otomatik olarak hesabınıza teslim edilir. Acil durumlarda 7/24 destek ekibimizle iletişime geçebilirsiniz.', 1, '2025-10-10 18:45:37', '2025-10-10 18:45:37'),
('3f78a19a-3167-4845-875b-13e90074ce98', 'c4e5b6c5-131f-4327-88bc-9c2fe09d5366', 'Bu ürün ne kadar sürede teslim edilir?', 'Ürün satın alma işleminiz tamamlandıktan sonra genellikle 1-5 dakika içinde otomatik olarak hesabınıza teslim edilir. Acil durumlarda 7/24 destek ekibimizle iletişime geçebilirsiniz.', 1, '2025-10-10 18:45:37', '2025-10-10 18:45:37'),
('4254351a-5808-4c42-b5eb-55e86bca8b96', '205fc262-f2af-463f-8f25-f913a64679e8', 'Bu ürün ne kadar sürede teslim edilir?', 'Ürün satın alma işleminiz tamamlandıktan sonra genellikle 1-5 dakika içinde otomatik olarak hesabınıza teslim edilir. Acil durumlarda 7/24 destek ekibimizle iletişime geçebilirsiniz.', 1, '2025-10-10 18:45:37', '2025-10-10 18:45:37'),
('46969a91-51d1-4e97-be21-ad535f94a32b', '0fbee9fe-da18-4c6e-9910-73cf81ba5b9f', 'Gemini Veo 3 Ultra(90 Gün) orijinal ve güvenilir mi?', 'Evet, Gemini Veo 3 Ultra(90 Gün) ürünümüz tamamen orijinal ve lisanslıdır. Tüm satışlarımız güvenli ödeme sistemleri üzerinden gerçekleşir ve ürün garantisi sağlanır.', 2, '2025-10-10 18:45:37', '2025-10-10 18:45:37'),
('49288810-f13c-420b-a6aa-9a0f36c5caa1', 'fc0dbe1c-34f3-4906-97bd-b0666b55ded0', 'Bu ürün ne kadar sürede teslim edilir?', 'Ürün satın alma işleminiz tamamlandıktan sonra genellikle 1-5 dakika içinde otomatik olarak hesabınıza teslim edilir. Acil durumlarda 7/24 destek ekibimizle iletişime geçebilirsiniz.', 1, '2025-10-10 18:45:37', '2025-10-10 18:45:37'),
('4c4166ef-46ab-4944-b96c-be539bab7a1a', 'd0550d22-210a-4cdb-ae0c-4e57b5b3b7bf', 'Bu ürün ne kadar sürede teslim edilir?', 'Ürün satın alma işleminiz tamamlandıktan sonra genellikle 1-5 dakika içinde otomatik olarak hesabınıza teslim edilir. Acil durumlarda 7/24 destek ekibimizle iletişime geçebilirsiniz.', 1, '2025-10-10 18:45:37', '2025-10-10 18:45:37'),
('4e395ffa-073c-4ea5-9b33-56597ac61b9c', '1bdb2344-9b92-455f-935a-f064a470b6b8', 'Office 365 Lisans PC/MAC orijinal ve güvenilir mi?', 'Evet, Office 365 Lisans PC/MAC ürünümüz tamamen orijinal ve lisanslıdır. Tüm satışlarımız güvenli ödeme sistemleri üzerinden gerçekleşir ve ürün garantisi sağlanır.', 2, '2025-10-10 18:45:37', '2025-10-10 18:45:37'),
('5253c0d8-227e-4dbb-85fb-7808d1a8d14e', '2f3ee84d-b301-4376-a3f7-a621a918c3b2', 'Bu ürün ne kadar sürede teslim edilir?', 'Ürün satın alma işleminiz tamamlandıktan sonra genellikle 1-5 dakika içinde otomatik olarak hesabınıza teslim edilir. Acil durumlarda 7/24 destek ekibimizle iletişime geçebilirsiniz.', 1, '2025-10-10 18:45:37', '2025-10-10 18:45:37'),
('54daffcf-d5bb-4390-8d36-b0f0726f3e1c', '0132e42e-d46a-444d-9080-a419aec29c9c', '500 Takipçi orijinal ve güvenilir mi?', 'Evet, 500 Takipçi ürünümüz tamamen orijinal ve lisanslıdır. Tüm satışlarımız güvenli ödeme sistemleri üzerinden gerçekleşir ve ürün garantisi sağlanır.', 2, '2025-10-15 12:41:26', '2025-10-15 12:41:26'),
('585ddfb8-e5f9-456d-96cf-070ef68a73b5', 'a76e27ef-e486-4cf8-b765-e12e51d52768', 'Adobe Photoshop Lisans Key orijinal ve güvenilir mi?', 'Evet, Adobe Photoshop Lisans Key ürünümüz tamamen orijinal ve lisanslıdır. Tüm satışlarımız güvenli ödeme sistemleri üzerinden gerçekleşir ve ürün garantisi sağlanır.', 2, '2025-10-16 08:32:30', '2025-10-16 08:32:30'),
('5ebb916f-12a2-4c89-9fd2-ca279aabac31', 'd8f607f5-5da9-47a5-ba66-f4835a155a2e', 'Bu ürün ne kadar sürede teslim edilir?', 'Ürün satın alma işleminiz tamamlandıktan sonra genellikle 1-5 dakika içinde otomatik olarak hesabınıza teslim edilir. Acil durumlarda 7/24 destek ekibimizle iletişime geçebilirsiniz.', 1, '2025-10-10 18:45:37', '2025-10-10 18:45:37'),
('6079a712-2848-49e5-9a8c-7c03a847a63e', '1bdb2344-9b92-455f-935a-f064a470b6b8', 'Bu ürün ne kadar sürede teslim edilir?', 'Ürün satın alma işleminiz tamamlandıktan sonra genellikle 1-5 dakika içinde otomatik olarak hesabınıza teslim edilir. Acil durumlarda 7/24 destek ekibimizle iletişime geçebilirsiniz.', 1, '2025-10-10 18:45:37', '2025-10-10 18:45:37'),
('60d87685-35ca-411e-9b9f-54dd76162efc', '7495db5f-293d-46a8-9f25-d7efa6881043', 'Bu ürün ne kadar sürede teslim edilir?', 'Ürün satın alma işleminiz tamamlandıktan sonra genellikle 1-5 dakika içinde otomatik olarak hesabınıza teslim edilir. Acil durumlarda 7/24 destek ekibimizle iletişime geçebilirsiniz.', 1, '2025-10-10 18:45:37', '2025-10-10 18:45:37'),
('60e7db5f-16f8-4e27-afe7-403f0bc6ca13', '610e1be2-39c7-4cb4-9f73-1ba506e0bb06', 'Office 2024 Pro Plus Key orijinal ve güvenilir mi?', 'Evet, Office 2024 Pro Plus Key ürünümüz tamamen orijinal ve lisanslıdır. Tüm satışlarımız güvenli ödeme sistemleri üzerinden gerçekleşir ve ürün garantisi sağlanır.', 2, '2025-10-10 18:45:37', '2025-10-10 18:45:37'),
('6269c673-2220-49c0-ae8d-bf3104b2a242', '30de177e-cd4a-4851-b44f-063164872771', 'Canva Pro Yıllık orijinal ve güvenilir mi?', 'Evet, Canva Pro Yıllık ürünümüz tamamen orijinal ve lisanslıdır. Tüm satışlarımız güvenli ödeme sistemleri üzerinden gerçekleşir ve ürün garantisi sağlanır.', 2, '2025-10-10 18:45:37', '2025-10-10 18:45:37'),
('67de0c03-1c4d-4ce7-8efd-ad3f7237d49f', 'ba71df27-d8c3-41c0-ac01-cb7ac9ebea42', 'Bu ürün ne kadar sürede teslim edilir?', 'Ürün satın alma işleminiz tamamlandıktan sonra genellikle 1-5 dakika içinde otomatik olarak hesabınıza teslim edilir. Acil durumlarda 7/24 destek ekibimizle iletişime geçebilirsiniz.', 1, '2025-10-10 18:45:37', '2025-10-10 18:45:37'),
('68363f5d-2cc9-431b-858b-177d94c78af8', '30de177e-cd4a-4851-b44f-063164872771', 'Bu ürün ne kadar sürede teslim edilir?', 'Ürün satın alma işleminiz tamamlandıktan sonra genellikle 1-5 dakika içinde otomatik olarak hesabınıza teslim edilir. Acil durumlarda 7/24 destek ekibimizle iletişime geçebilirsiniz.', 1, '2025-10-10 18:45:37', '2025-10-10 18:45:37'),
('691e472b-5c3d-48b6-b9a1-d086ea7df0c2', '4a9b363d-8402-4e89-8055-f58064eb462e', 'Ürünler Orjinal ve Garantili mi?', 'Evet ürün tamamen orjinaldir.', 0, '2025-10-06 21:34:20', '2025-10-06 21:34:20'),
('6c4ac0a1-d4b2-4a98-bd72-9820dc3ca15b', '45f080dd-2e68-4ab7-ad97-a717b2482952', 'Windows 11 Pro OEM Key (Kopya) orijinal ve güvenilir mi?', 'Evet, Windows 11 Pro OEM Key (Kopya) ürünümüz tamamen orijinal ve lisanslıdır. Tüm satışlarımız güvenli ödeme sistemleri üzerinden gerçekleşir ve ürün garantisi sağlanır.', 2, '2025-10-10 18:45:37', '2025-10-10 18:45:37'),
('6dffa7c2-482b-42b8-8ca0-8e7ad5f47968', '408ef745-5456-4115-ad79-3a26034edc37', 'Bu ürün ne kadar sürede teslim edilir?', 'Ürün satın alma işleminiz tamamlandıktan sonra genellikle 1-5 dakika içinde otomatik olarak hesabınıza teslim edilir. Acil durumlarda 7/24 destek ekibimizle iletişime geçebilirsiniz.', 1, '2025-10-10 18:45:37', '2025-10-10 18:45:37'),
('72d9c1c6-ff2b-44f3-89f6-689518ee34ab', '271dfde4-f86b-452d-b64e-9186f071da44', 'Canva Pro Öğrenci orijinal ve güvenilir mi?', 'Evet, Canva Pro Öğrenci ürünümüz tamamen orijinal ve lisanslıdır. Tüm satışlarımız güvenli ödeme sistemleri üzerinden gerçekleşir ve ürün garantisi sağlanır.', 2, '2025-10-10 18:45:37', '2025-10-10 18:45:37'),
('760a3258-6790-465f-af1c-4408d30c9b65', '408ef745-5456-4115-ad79-3a26034edc37', '100 Takipçi orijinal ve güvenilir mi?', 'Evet, 100 Takipçi ürünümüz tamamen orijinal ve lisanslıdır. Tüm satışlarımız güvenli ödeme sistemleri üzerinden gerçekleşir ve ürün garantisi sağlanır.', 2, '2025-10-10 18:45:37', '2025-10-10 18:45:37'),
('7fb12dd2-a45a-479f-a3c5-ce72bfe38fa5', '45f080dd-2e68-4ab7-ad97-a717b2482952', 'Bu ürün ne kadar sürede teslim edilir?', 'Ürün satın alma işleminiz tamamlandıktan sonra genellikle 1-5 dakika içinde otomatik olarak hesabınıza teslim edilir. Acil durumlarda 7/24 destek ekibimizle iletişime geçebilirsiniz.', 1, '2025-10-10 18:45:37', '2025-10-10 18:45:37'),
('8475ef98-0b5d-4531-bbd8-bff36ef42ad8', 'd9845b72-9e45-45ee-aaad-da3e8466e2f1', 'Office 2021 Pro Plus Key orijinal ve güvenilir mi?', 'Evet, Office 2021 Pro Plus Key ürünümüz tamamen orijinal ve lisanslıdır. Tüm satışlarımız güvenli ödeme sistemleri üzerinden gerçekleşir ve ürün garantisi sağlanır.', 2, '2025-10-10 18:45:37', '2025-10-10 18:45:37'),
('8661df40-fe83-4005-96b2-f9306b50b183', 'd0550d22-210a-4cdb-ae0c-4e57b5b3b7bf', 'Pubg Mobile 60 UC orijinal ve güvenilir mi?', 'Evet, Pubg Mobile 60 UC ürünümüz tamamen orijinal ve lisanslıdır. Tüm satışlarımız güvenli ödeme sistemleri üzerinden gerçekleşir ve ürün garantisi sağlanır.', 2, '2025-10-10 18:45:37', '2025-10-10 18:45:37'),
('8b10c8d2-1002-49f8-902c-896fdb966d43', '975d48da-e57e-4f6e-97b1-a6a9ddabbf1d', 'Bu ürün ne kadar sürede teslim edilir?', 'Ürün satın alma işleminiz tamamlandıktan sonra genellikle 1-5 dakika içinde otomatik olarak hesabınıza teslim edilir. Acil durumlarda 7/24 destek ekibimizle iletişime geçebilirsiniz.', 1, '2025-10-10 18:45:37', '2025-10-10 18:45:37'),
('94497cd1-7aec-4038-bbed-435de1d9fe1e', '0132e42e-d46a-444d-9080-a419aec29c9c', 'Bu ürün ne kadar sürede teslim edilir?', 'Ürün satın alma işleminiz tamamlandıktan sonra genellikle 1-5 dakika içinde otomatik olarak hesabınıza teslim edilir. Acil durumlarda 7/24 destek ekibimizle iletişime geçebilirsiniz.', 1, '2025-10-15 12:41:26', '2025-10-15 12:41:26'),
('9d4571ce-c666-4e42-ab07-bc69fa1b29c1', '2fb84de1-36e3-416b-abdb-83eaefb80f89', 'Windows 11 Pro Key orijinal ve güvenilir mi?', 'Evet, Windows 11 Pro Key ürünümüz tamamen orijinal ve lisanslıdır. Tüm satışlarımız güvenli ödeme sistemleri üzerinden gerçekleşir ve ürün garantisi sağlanır.', 2, '2025-10-10 18:45:37', '2025-10-10 18:45:37'),
('a9603416-d14b-457f-8a7c-c97285932194', 'a8d31476-b416-4b07-9a86-618112fc156d', 'Adobe Illustrator Lisans Key orijinal ve güvenilir mi?', 'Evet, Adobe Illustrator Lisans Key ürünümüz tamamen orijinal ve lisanslıdır. Tüm satışlarımız güvenli ödeme sistemleri üzerinden gerçekleşir ve ürün garantisi sağlanır.', 2, '2025-10-10 18:45:37', '2025-10-10 18:45:37'),
('b7711c0a-2174-4c18-85a4-e4b681002f9d', 'fc0dbe1c-34f3-4906-97bd-b0666b55ded0', 'Office 2016 Professional Plus Lisans orijinal ve güvenilir mi?', 'Evet, Office 2016 Professional Plus Lisans ürünümüz tamamen orijinal ve lisanslıdır. Tüm satışlarımız güvenli ödeme sistemleri üzerinden gerçekleşir ve ürün garantisi sağlanır.', 2, '2025-10-10 18:45:37', '2025-10-10 18:45:37'),
('be54b4f7-489b-4bc0-b23f-7eeabc484655', '0bfafe30-cc66-458b-8fa8-3ebe25826040', 'Grand Theft Auto V orijinal ve güvenilir mi?', 'Evet, Grand Theft Auto V ürünümüz tamamen orijinal ve lisanslıdır. Tüm satışlarımız güvenli ödeme sistemleri üzerinden gerçekleşir ve ürün garantisi sağlanır.', 2, '2025-10-10 18:45:37', '2025-10-10 18:45:37'),
('c111d2c7-6250-418a-9edd-5f19faf7807a', '505bb39c-cc6b-4747-9179-8257c147ab6f', 'Bu ürün ne kadar sürede teslim edilir?', 'Ürün satın alma işleminiz tamamlandıktan sonra genellikle 1-5 dakika içinde otomatik olarak hesabınıza teslim edilir. Acil durumlarda 7/24 destek ekibimizle iletişime geçebilirsiniz.', 1, '2025-10-10 18:45:37', '2025-10-10 18:45:37'),
('c14a672e-f4c0-45c3-bcab-a303c30351c7', '7495db5f-293d-46a8-9f25-d7efa6881043', 'USA Gmail Hesap (2020) orijinal ve güvenilir mi?', 'Evet, USA Gmail Hesap (2020) ürünümüz tamamen orijinal ve lisanslıdır. Tüm satışlarımız güvenli ödeme sistemleri üzerinden gerçekleşir ve ürün garantisi sağlanır.', 2, '2025-10-10 18:45:37', '2025-10-10 18:45:37'),
('ca8529ef-e27b-40c1-b6da-5ac1635a6c5c', '058e9ccd-f99d-4601-90ca-597fb3d4430f', 'Bu ürün ne kadar sürede teslim edilir?', 'Ürün satın alma işleminiz tamamlandıktan sonra genellikle 1-5 dakika içinde otomatik olarak hesabınıza teslim edilir. Acil durumlarda 7/24 destek ekibimizle iletişime geçebilirsiniz.', 1, '2025-10-10 18:45:37', '2025-10-10 18:45:37'),
('ccef1b5b-5b09-4b10-958b-ed2426a16c49', '6c76a7b2-54ed-4290-8d83-c118533c5ee0', 'Bu ürün ne kadar sürede teslim edilir?', 'Ürün satın alma işleminiz tamamlandıktan sonra genellikle 1-5 dakika içinde otomatik olarak hesabınıza teslim edilir. Acil durumlarda 7/24 destek ekibimizle iletişime geçebilirsiniz.', 1, '2025-10-10 18:45:37', '2025-10-10 18:45:37'),
('d2fcc848-d445-432c-9e65-bf53b69e7a40', '3eeb67f8-40a6-44f4-95ff-1d721e361861', 'Random Steam Key orijinal ve güvenilir mi?', 'Evet, Random Steam Key ürünümüz tamamen orijinal ve lisanslıdır. Tüm satışlarımız güvenli ödeme sistemleri üzerinden gerçekleşir ve ürün garantisi sağlanır.', 2, '2025-10-10 18:45:37', '2025-10-10 18:45:37'),
('d32dd04b-0d72-4d6a-873c-55e3cf879a94', 'bfb8d1cb-721a-4756-830b-a95454e1d5f1', 'Lisansın Süresi Varmı?', 'Satın aldığınız lisans, girdiğiniz domain adresine lisanslı olup sınırsızdır.', 0, '2025-10-13 21:16:37', '2025-10-13 21:16:37'),
('d419af5b-f8f0-48a4-94d7-b7899c1921ec', '8cc7a560-15b4-4c52-a542-f6687e79d124', 'Adobe Stock orijinal ve güvenilir mi?', 'Evet, Adobe Stock ürünümüz tamamen orijinal ve lisanslıdır. Tüm satışlarımız güvenli ödeme sistemleri üzerinden gerçekleşir ve ürün garantisi sağlanır.', 2, '2025-10-10 18:45:37', '2025-10-10 18:45:37'),
('d52477d7-84ac-4f03-a5fb-8c4759268d63', 'd9845b72-9e45-45ee-aaad-da3e8466e2f1', 'Bu ürün ne kadar sürede teslim edilir?', 'Ürün satın alma işleminiz tamamlandıktan sonra genellikle 1-5 dakika içinde otomatik olarak hesabınıza teslim edilir. Acil durumlarda 7/24 destek ekibimizle iletişime geçebilirsiniz.', 1, '2025-10-10 18:45:37', '2025-10-10 18:45:37'),
('d6629379-a3a4-4b33-8c9b-83e78d5a9c5e', '271dfde4-f86b-452d-b64e-9186f071da44', 'Bu ürün ne kadar sürede teslim edilir?', 'Ürün satın alma işleminiz tamamlandıktan sonra genellikle 1-5 dakika içinde otomatik olarak hesabınıza teslim edilir. Acil durumlarda 7/24 destek ekibimizle iletişime geçebilirsiniz.', 1, '2025-10-10 18:45:37', '2025-10-10 18:45:37'),
('d84568cd-e080-44e2-98e0-14d057d062a3', '2fb84de1-36e3-416b-abdb-83eaefb80f89', 'Bu ürün ne kadar sürede teslim edilir?', 'Ürün satın alma işleminiz tamamlandıktan sonra genellikle 1-5 dakika içinde otomatik olarak hesabınıza teslim edilir. Acil durumlarda 7/24 destek ekibimizle iletişime geçebilirsiniz.', 1, '2025-10-10 18:45:37', '2025-10-10 18:45:37'),
('e13846c2-1c55-4856-9a72-47f623786378', '0bfafe30-cc66-458b-8fa8-3ebe25826040', 'Bu ürün ne kadar sürede teslim edilir?', 'Ürün satın alma işleminiz tamamlandıktan sonra genellikle 1-5 dakika içinde otomatik olarak hesabınıza teslim edilir. Acil durumlarda 7/24 destek ekibimizle iletişime geçebilirsiniz.', 1, '2025-10-10 18:45:37', '2025-10-10 18:45:37'),
('e58758f6-d3b8-4c1e-8909-3243a5db3304', 'bfb8d1cb-721a-4756-830b-a95454e1d5f1', 'Domain Değiştirebilir miyim?', 'Maleseef, domain değişikliği yapılamamaktadır.', 1, '2025-10-13 21:16:37', '2025-10-13 21:16:37'),
('e9ac1367-e32d-4230-bd23-59fc3e550d91', '0fbee9fe-da18-4c6e-9910-73cf81ba5b9f', 'Bu ürün ne kadar sürede teslim edilir?', 'Ürün satın alma işleminiz tamamlandıktan sonra genellikle 1-5 dakika içinde otomatik olarak hesabınıza teslim edilir. Acil durumlarda 7/24 destek ekibimizle iletişime geçebilirsiniz.', 1, '2025-10-10 18:45:37', '2025-10-10 18:45:37'),
('ea370f01-0202-42d1-9beb-b5c31d13ae91', '4a9b363d-8402-4e89-8055-f58064eb462e', 'Satın Alım Sonrası Destek Var mı?', 'Evet 7/24 wp hattımızdan destek alabilirsiniz.', 1, '2025-10-06 21:34:20', '2025-10-06 21:34:20'),
('ebb3ecc5-2827-4ad7-bfa7-ff7d7820601c', 'a76e27ef-e486-4cf8-b765-e12e51d52768', 'Bu ürün ne kadar sürede teslim edilir?', 'Ürün satın alma işleminiz tamamlandıktan sonra genellikle 1-5 dakika içinde otomatik olarak hesabınıza teslim edilir. Acil durumlarda 7/24 destek ekibimizle iletişime geçebilirsiniz.', 1, '2025-10-16 08:32:30', '2025-10-16 08:32:30'),
('f13ba198-a833-4159-80b6-e5c9d66e0be1', '975d48da-e57e-4f6e-97b1-a6a9ddabbf1d', '1000 Takipçi orijinal ve güvenilir mi?', 'Evet, 1000 Takipçi ürünümüz tamamen orijinal ve lisanslıdır. Tüm satışlarımız güvenli ödeme sistemleri üzerinden gerçekleşir ve ürün garantisi sağlanır.', 2, '2025-10-10 18:45:37', '2025-10-10 18:45:37'),
('f1539ece-5ffb-44ac-ab81-df77bfab4ff5', '505bb39c-cc6b-4747-9179-8257c147ab6f', 'Windows 11 Home Key orijinal ve güvenilir mi?', 'Evet, Windows 11 Home Key ürünümüz tamamen orijinal ve lisanslıdır. Tüm satışlarımız güvenli ödeme sistemleri üzerinden gerçekleşir ve ürün garantisi sağlanır.', 2, '2025-10-10 18:45:37', '2025-10-10 18:45:37'),
('f3fe45e5-166c-450f-a576-eb41852b7a85', 'a8d31476-b416-4b07-9a86-618112fc156d', 'Bu ürün ne kadar sürede teslim edilir?', 'Ürün satın alma işleminiz tamamlandıktan sonra genellikle 1-5 dakika içinde otomatik olarak hesabınıza teslim edilir. Acil durumlarda 7/24 destek ekibimizle iletişime geçebilirsiniz.', 1, '2025-10-10 18:45:37', '2025-10-10 18:45:37');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `product_options`
--

CREATE TABLE `product_options` (
  `id` char(36) NOT NULL,
  `product_id` char(36) NOT NULL,
  `name` varchar(100) NOT NULL,
  `values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`values`)),
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `product_reviews`
--

CREATE TABLE `product_reviews` (
  `id` char(36) NOT NULL,
  `product_id` char(36) NOT NULL,
  `user_id` char(36) DEFAULT NULL,
  `rating` int(11) NOT NULL,
  `comment` text DEFAULT NULL,
  `is_approved` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL,
  `customer_name` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Tablo döküm verisi `product_reviews`
--

INSERT INTO `product_reviews` (`id`, `product_id`, `user_id`, `rating`, `comment`, `is_approved`, `created_at`, `updated_at`, `customer_name`) VALUES
('03a3b7f1-8c0c-43a6-95e3-ebcd0ac1692f', '1bdb2344-9b92-455f-935a-f064a470b6b8', NULL, 5, 'Güvenilir bir satıcı. Office 365 Lisans PC/MAC ürününü hemen teslim aldım ve mükemmel hizmet verdiler.', 1, '2025-10-10 18:45:37', '2025-10-10 18:45:37', 'Zeynep K.'),
('0560ae0a-1821-4b16-bb5e-9da34c50ad41', '45f080dd-2e68-4ab7-ad97-a717b2482952', NULL, 5, 'Çok hızlı teslimat aldım ve Windows 11 Pro OEM Key (Kopya) sorunsuz çalışıyor. Kesinlikle tavsiye ederim!', 1, '2025-10-10 18:45:37', '2025-10-10 18:45:37', 'Ahmet Y.'),
('0d16ea0d-c63b-4591-a161-fb223e20f8a3', '2fb84de1-36e3-416b-abdb-83eaefb80f89', NULL, 5, 'Çok hızlı teslimat aldım ve Windows 11 Pro Key sorunsuz çalışıyor. Kesinlikle tavsiye ederim!', 1, '2025-10-10 18:45:37', '2025-10-10 18:45:37', 'Ahmet Y.'),
('0eb3e6d7-a8c9-42cf-a29d-2f092b0815d8', '30de177e-cd4a-4851-b44f-063164872771', NULL, 5, 'Çok hızlı teslimat aldım ve Canva Pro Yıllık sorunsuz çalışıyor. Kesinlikle tavsiye ederim!', 1, '2025-10-10 18:45:37', '2025-10-10 18:45:37', 'Ahmet Y.'),
('0f20059f-9788-4f84-b6b5-7f5e791bf000', '7495db5f-293d-46a8-9f25-d7efa6881043', NULL, 5, 'Güvenilir bir satıcı. USA Gmail Hesap (2020) ürününü hemen teslim aldım ve mükemmel hizmet verdiler.', 1, '2025-10-10 18:45:37', '2025-10-10 18:45:37', 'Zeynep K.'),
('1022f9e8-506d-4da5-9ce0-8ff2fdb0069a', '975d48da-e57e-4f6e-97b1-a6a9ddabbf1d', NULL, 5, 'Çok hızlı teslimat aldım ve 1000 Takipçi sorunsuz çalışıyor. Kesinlikle tavsiye ederim!', 1, '2025-10-10 18:45:37', '2025-10-10 18:45:37', 'Ahmet Y.'),
('11a3f99b-c48e-4ebb-b134-c04775172a85', '3eeb67f8-40a6-44f4-95ff-1d721e361861', NULL, 5, 'Çok hızlı teslimat aldım ve Random Steam Key sorunsuz çalışıyor. Kesinlikle tavsiye ederim!', 1, '2025-10-10 18:45:37', '2025-10-10 18:45:37', 'Ahmet Y.'),
('132992e2-b76d-4f6d-b057-6f05ae3ba2f6', '2f3ee84d-b301-4376-a3f7-a621a918c3b2', NULL, 5, 'Güvenilir bir satıcı. Gemini Veo 3 Ultra(30 Gün) ürününü hemen teslim aldım ve mükemmel hizmet verdiler.', 1, '2025-10-10 18:45:37', '2025-10-10 18:45:37', 'Zeynep K.'),
('16fc25fc-3264-4ed8-9125-5c1a916286a6', 'a76e27ef-e486-4cf8-b765-e12e51d52768', NULL, 5, 'Çok hızlı teslimat aldım ve Adobe Photoshop Lisans Key sorunsuz çalışıyor. Kesinlikle tavsiye ederim!', 1, '2025-10-16 08:32:30', '2025-10-16 08:32:30', 'Ahmet Y.'),
('1db4bbc3-4123-49ee-a43c-32f1c77ad511', 'd8f607f5-5da9-47a5-ba66-f4835a155a2e', NULL, 5, 'Çok hızlı teslimat aldım ve Adobe Creative Cloud  sorunsuz çalışıyor. Kesinlikle tavsiye ederim!', 1, '2025-10-10 18:45:37', '2025-10-10 18:45:37', 'Ahmet Y.'),
('281a30cb-409f-4e51-a8d1-8dcdfedf257c', 'd0550d22-210a-4cdb-ae0c-4e57b5b3b7bf', NULL, 5, 'Hızlı geldi teşekkürler', 1, '2025-10-10 11:56:34', '2025-10-10 11:56:34', 'Sultan Serik'),
('2eadf092-d236-4514-addf-1c970655a08e', 'd9845b72-9e45-45ee-aaad-da3e8466e2f1', NULL, 5, 'Güvenilir bir satıcı. Office 2021 Pro Plus Key ürününü hemen teslim aldım ve mükemmel hizmet verdiler.', 1, '2025-10-10 18:45:37', '2025-10-10 18:45:37', 'Zeynep K.'),
('2efff6f2-447b-4106-bf4a-27fbf19af3c1', '2f3ee84d-b301-4376-a3f7-a621a918c3b2', NULL, 5, 'Çok hızlı teslimat aldım ve Gemini Veo 3 Ultra(30 Gün) sorunsuz çalışıyor. Kesinlikle tavsiye ederim!', 1, '2025-10-10 18:45:37', '2025-10-10 18:45:37', 'Ahmet Y.'),
('37c07788-4a71-41a2-a944-d3839fb5fe11', '0fbee9fe-da18-4c6e-9910-73cf81ba5b9f', NULL, 5, 'Güvenilir bir satıcı. Gemini Veo 3 Ultra(90 Gün) ürününü hemen teslim aldım ve mükemmel hizmet verdiler.', 1, '2025-10-10 18:45:37', '2025-10-10 18:45:37', 'Zeynep K.'),
('3feed29a-bef1-41c5-9147-28f23c39c997', '505bb39c-cc6b-4747-9179-8257c147ab6f', NULL, 5, 'Çok hızlı teslimat aldım ve Windows 11 Home Key sorunsuz çalışıyor. Kesinlikle tavsiye ederim!', 1, '2025-10-10 18:45:37', '2025-10-10 18:45:37', 'Ahmet Y.'),
('5501d42a-9e88-4889-ba30-a7ed9016945e', '0132e42e-d46a-444d-9080-a419aec29c9c', NULL, 5, 'Güvenilir bir satıcı. 500 Takipçi ürününü hemen teslim aldım ve mükemmel hizmet verdiler.', 1, '2025-10-15 12:41:26', '2025-10-15 12:41:26', 'Zeynep K.'),
('58c7bcc1-d8a5-4141-8247-1b79090aa237', '271dfde4-f86b-452d-b64e-9186f071da44', NULL, 5, 'Güvenilir bir satıcı. Canva Pro Öğrenci ürününü hemen teslim aldım ve mükemmel hizmet verdiler.', 1, '2025-10-10 18:45:37', '2025-10-10 18:45:37', 'Zeynep K.'),
('59b5bdaa-b641-4971-bb5e-bc0b08dd9d28', '975d48da-e57e-4f6e-97b1-a6a9ddabbf1d', NULL, 5, 'Güvenilir bir satıcı. 1000 Takipçi ürününü hemen teslim aldım ve mükemmel hizmet verdiler.', 1, '2025-10-10 18:45:37', '2025-10-10 18:45:37', 'Zeynep K.'),
('62e4f600-c412-45ae-bed1-13be539a755b', 'fc0dbe1c-34f3-4906-97bd-b0666b55ded0', NULL, 5, 'Çok hızlı teslimat aldım ve Office 2016 Professional Plus Lisans sorunsuz çalışıyor. Kesinlikle tavsiye ederim!', 1, '2025-10-10 18:45:37', '2025-10-10 18:45:37', 'Ahmet Y.'),
('652deed2-03cf-4ff7-93af-24ed7be33f10', 'd9845b72-9e45-45ee-aaad-da3e8466e2f1', NULL, 5, 'Çok hızlı teslimat aldım ve Office 2021 Pro Plus Key sorunsuz çalışıyor. Kesinlikle tavsiye ederim!', 1, '2025-10-10 18:45:37', '2025-10-10 18:45:37', 'Ahmet Y.'),
('68dbc924-4c5c-4bec-8bf1-b0740d6848b7', '3eeb67f8-40a6-44f4-95ff-1d721e361861', NULL, 5, 'Güvenilir bir satıcı. Random Steam Key ürününü hemen teslim aldım ve mükemmel hizmet verdiler.', 1, '2025-10-10 18:45:37', '2025-10-10 18:45:37', 'Zeynep K.'),
('6e4b93a2-8076-4ffc-b296-db5db7c4ba57', '0132e42e-d46a-444d-9080-a419aec29c9c', NULL, 5, 'Çok hızlı teslimat aldım ve 500 Takipçi sorunsuz çalışıyor. Kesinlikle tavsiye ederim!', 1, '2025-10-15 12:41:26', '2025-10-15 12:41:26', 'Ahmet Y.'),
('6fbf8534-c9f7-4690-82ed-0ca83c33569e', '6445f323-71c9-43a6-bda7-62df52c6af58', NULL, 5, 'Güvenilir bir satıcı. Windows 11 Education Key ürününü hemen teslim aldım ve mükemmel hizmet verdiler.', 1, '2025-10-10 18:45:37', '2025-10-10 18:45:37', 'Zeynep K.'),
('70c78dc7-c2ec-4262-af9f-710d249785a8', '408ef745-5456-4115-ad79-3a26034edc37', NULL, 5, 'Çok hızlı teslimat aldım ve 100 Takipçi sorunsuz çalışıyor. Kesinlikle tavsiye ederim!', 1, '2025-10-10 18:45:37', '2025-10-10 18:45:37', 'Ahmet Y.'),
('7528e28c-da65-4423-8f6a-90220ac3dbdc', 'c4e5b6c5-131f-4327-88bc-9c2fe09d5366', NULL, 5, 'Güvenilir bir satıcı. Adobe Acrobat Pro ürününü hemen teslim aldım ve mükemmel hizmet verdiler.', 1, '2025-10-10 18:45:37', '2025-10-10 18:45:37', 'Zeynep K.'),
('7aa3b4ff-6569-4cda-9437-85fec27396f4', '4a9b363d-8402-4e89-8055-f58064eb462e', NULL, 5, '7 gün oldu alalı henüz bi sıkıntı yok', 1, '2025-10-06 21:34:20', '2025-10-06 21:34:20', 'İbrahim Dizar'),
('7bb686f1-fd83-4600-8a66-08d1929d1165', '1bdb2344-9b92-455f-935a-f064a470b6b8', NULL, 5, 'Çok hızlı teslimat aldım ve Office 365 Lisans PC/MAC sorunsuz çalışıyor. Kesinlikle tavsiye ederim!', 1, '2025-10-10 18:45:37', '2025-10-10 18:45:37', 'Ahmet Y.'),
('7dbd80d0-f679-4e86-ab28-0d6c50716f22', '205fc262-f2af-463f-8f25-f913a64679e8', NULL, 5, 'Çok hızlı teslimat aldım ve Windows 11 Pro Key sorunsuz çalışıyor. Kesinlikle tavsiye ederim!', 1, '2025-10-10 18:45:37', '2025-10-10 18:45:37', 'Ahmet Y.'),
('7e2778b0-289c-4dd2-8593-f6ff8baf5878', '0bfafe30-cc66-458b-8fa8-3ebe25826040', NULL, 5, 'Çok hızlı teslimat aldım ve Grand Theft Auto V sorunsuz çalışıyor. Kesinlikle tavsiye ederim!', 1, '2025-10-10 18:45:37', '2025-10-10 18:45:37', 'Ahmet Y.'),
('7f2a061f-8c5f-4a2e-9eb7-ea9a20781455', '058e9ccd-f99d-4601-90ca-597fb3d4430f', NULL, 5, 'Güvenilir bir satıcı. ChatGPT Business Hesap(30 Gün) ürününü hemen teslim aldım ve mükemmel hizmet verdiler.', 1, '2025-10-10 18:45:37', '2025-10-10 18:45:37', 'Zeynep K.'),
('87041b41-0d2e-4aa5-bec9-5aa8193a500e', '8cc7a560-15b4-4c52-a542-f6687e79d124', NULL, 5, 'Çok hızlı teslimat aldım ve Adobe Stock sorunsuz çalışıyor. Kesinlikle tavsiye ederim!', 1, '2025-10-10 18:45:37', '2025-10-10 18:45:37', 'Ahmet Y.'),
('884319c5-24a0-486b-a70a-1d168016802d', '2fb84de1-36e3-416b-abdb-83eaefb80f89', NULL, 5, 'Güvenilir bir satıcı. Windows 11 Pro Key ürününü hemen teslim aldım ve mükemmel hizmet verdiler.', 1, '2025-10-10 18:45:37', '2025-10-10 18:45:37', 'Zeynep K.'),
('8b5ad831-d069-45e6-a5d5-4fd1e10c7fda', '6c76a7b2-54ed-4290-8d83-c118533c5ee0', NULL, 5, 'Güvenilir bir satıcı. Windows 11 Pro Retail Key ürününü hemen teslim aldım ve mükemmel hizmet verdiler.', 1, '2025-10-10 18:45:37', '2025-10-10 18:45:37', 'Zeynep K.'),
('8f4e2976-ae2e-46f2-a676-7c2c282eacbd', 'a76e27ef-e486-4cf8-b765-e12e51d52768', NULL, 5, 'Güvenilir bir satıcı. Adobe Photoshop Lisans Key ürününü hemen teslim aldım ve mükemmel hizmet verdiler.', 1, '2025-10-16 08:32:30', '2025-10-16 08:32:30', 'Zeynep K.'),
('9c191d23-e9f4-4a93-a13c-a688409e86ce', 'a8d31476-b416-4b07-9a86-618112fc156d', NULL, 5, 'Güvenilir bir satıcı. Adobe Illustrator Lisans Key ürününü hemen teslim aldım ve mükemmel hizmet verdiler.', 1, '2025-10-10 18:45:37', '2025-10-10 18:45:37', 'Zeynep K.'),
('a0ed3abf-8567-4cdf-aa4a-dd0d43d4c4eb', 'ba71df27-d8c3-41c0-ac01-cb7ac9ebea42', NULL, 5, 'Güvenilir bir satıcı. ChatGPT Plus Hesap(30 Gün) ürününü hemen teslim aldım ve mükemmel hizmet verdiler.', 1, '2025-10-10 18:45:37', '2025-10-10 18:45:37', 'Zeynep K.'),
('a5c0c962-939b-4ea2-ae38-0b7f8aa9b857', 'a8d31476-b416-4b07-9a86-618112fc156d', NULL, 5, 'Çok hızlı teslimat aldım ve Adobe Illustrator Lisans Key sorunsuz çalışıyor. Kesinlikle tavsiye ederim!', 1, '2025-10-10 18:45:37', '2025-10-10 18:45:37', 'Ahmet Y.'),
('a776af2f-0d46-4c93-974e-8df5be7aa121', '6445f323-71c9-43a6-bda7-62df52c6af58', NULL, 5, 'Çok hızlı teslimat aldım ve Windows 11 Education Key sorunsuz çalışıyor. Kesinlikle tavsiye ederim!', 1, '2025-10-10 18:45:37', '2025-10-10 18:45:37', 'Ahmet Y.'),
('aae23bd1-f321-4bf7-932d-e4f95ee77860', '8cc7a560-15b4-4c52-a542-f6687e79d124', NULL, 5, 'Güvenilir bir satıcı. Adobe Stock ürününü hemen teslim aldım ve mükemmel hizmet verdiler.', 1, '2025-10-10 18:45:37', '2025-10-10 18:45:37', 'Zeynep K.'),
('ad44e2ad-7904-48f7-bf5f-26f289a2f3f1', '408ef745-5456-4115-ad79-3a26034edc37', NULL, 5, 'Güvenilir bir satıcı. 100 Takipçi ürününü hemen teslim aldım ve mükemmel hizmet verdiler.', 1, '2025-10-10 18:45:37', '2025-10-10 18:45:37', 'Zeynep K.'),
('b54c4d03-6c94-490f-aa1f-823cf335f791', '058e9ccd-f99d-4601-90ca-597fb3d4430f', NULL, 5, 'Çok hızlı teslimat aldım ve ChatGPT Business Hesap(30 Gün) sorunsuz çalışıyor. Kesinlikle tavsiye ederim!', 1, '2025-10-10 18:45:37', '2025-10-10 18:45:37', 'Ahmet Y.'),
('b5defcf8-d88f-4303-9fdc-c7c99d32e46f', 'c4e5b6c5-131f-4327-88bc-9c2fe09d5366', NULL, 5, 'Çok hızlı teslimat aldım ve Adobe Acrobat Pro sorunsuz çalışıyor. Kesinlikle tavsiye ederim!', 1, '2025-10-10 18:45:37', '2025-10-10 18:45:37', 'Ahmet Y.'),
('b6b64f54-af53-4915-9f2d-ba7fc42e4a0b', '45f080dd-2e68-4ab7-ad97-a717b2482952', NULL, 5, 'Güvenilir bir satıcı. Windows 11 Pro OEM Key (Kopya) ürününü hemen teslim aldım ve mükemmel hizmet verdiler.', 1, '2025-10-10 18:45:37', '2025-10-10 18:45:37', 'Zeynep K.'),
('b9cddd9b-704a-460e-889b-200098c8d206', '97fb37cc-7b93-49b9-a1e9-d9d34f33bbc1', NULL, 5, 'Güvenilir bir satıcı. 250 Takipçi ürününü hemen teslim aldım ve mükemmel hizmet verdiler.', 1, '2025-10-10 18:45:37', '2025-10-10 18:45:37', 'Zeynep K.'),
('c2940cd3-3449-483b-b283-ec1adfc728bd', '97fb37cc-7b93-49b9-a1e9-d9d34f33bbc1', NULL, 5, 'Çok hızlı teslimat aldım ve 250 Takipçi sorunsuz çalışıyor. Kesinlikle tavsiye ederim!', 1, '2025-10-10 18:45:37', '2025-10-10 18:45:37', 'Ahmet Y.'),
('c9426be5-5c73-4b1c-91a1-ce6c1ac06bd2', '505bb39c-cc6b-4747-9179-8257c147ab6f', NULL, 5, 'Güvenilir bir satıcı. Windows 11 Home Key ürününü hemen teslim aldım ve mükemmel hizmet verdiler.', 1, '2025-10-10 18:45:37', '2025-10-10 18:45:37', 'Zeynep K.'),
('cdd9a429-8f8d-46e9-aa56-93c30a479479', '610e1be2-39c7-4cb4-9f73-1ba506e0bb06', NULL, 5, 'Güvenilir bir satıcı. Office 2024 Pro Plus Key ürününü hemen teslim aldım ve mükemmel hizmet verdiler.', 1, '2025-10-10 18:45:37', '2025-10-10 18:45:37', 'Zeynep K.'),
('ce19de97-6859-4e9e-898c-ea7643d8c752', '610e1be2-39c7-4cb4-9f73-1ba506e0bb06', NULL, 5, 'Çok hızlı teslimat aldım ve Office 2024 Pro Plus Key sorunsuz çalışıyor. Kesinlikle tavsiye ederim!', 1, '2025-10-10 18:45:37', '2025-10-10 18:45:37', 'Ahmet Y.'),
('d00e8789-28c6-4bf8-87b8-6945b587d5f1', '972d19c9-5c5c-48e8-9d42-a46cc5121bd2', NULL, 5, 'Güvenilir bir satıcı. Windows 11 Enterprise Key ürününü hemen teslim aldım ve mükemmel hizmet verdiler.', 1, '2025-10-10 18:45:37', '2025-10-10 18:45:37', 'Zeynep K.'),
('d54890f5-43bc-449c-851d-46d0af2671f0', '7495db5f-293d-46a8-9f25-d7efa6881043', NULL, 5, 'Çok hızlı teslimat aldım ve USA Gmail Hesap (2020) sorunsuz çalışıyor. Kesinlikle tavsiye ederim!', 1, '2025-10-10 18:45:37', '2025-10-10 18:45:37', 'Ahmet Y.'),
('d95326da-7185-4963-bc75-2498ab9866b6', 'fc0dbe1c-34f3-4906-97bd-b0666b55ded0', NULL, 5, 'Güvenilir bir satıcı. Office 2016 Professional Plus Lisans ürününü hemen teslim aldım ve mükemmel hizmet verdiler.', 1, '2025-10-10 18:45:37', '2025-10-10 18:45:37', 'Zeynep K.'),
('daab568b-b625-4a0a-be35-48bc33fabf98', '972d19c9-5c5c-48e8-9d42-a46cc5121bd2', NULL, 5, 'Çok hızlı teslimat aldım ve Windows 11 Enterprise Key sorunsuz çalışıyor. Kesinlikle tavsiye ederim!', 1, '2025-10-10 18:45:37', '2025-10-10 18:45:37', 'Ahmet Y.'),
('e153bbb1-2346-44fd-bfc8-efde145cca09', '205fc262-f2af-463f-8f25-f913a64679e8', NULL, 5, 'Güvenilir bir satıcı. Windows 11 Pro Key ürününü hemen teslim aldım ve mükemmel hizmet verdiler.', 1, '2025-10-10 18:45:37', '2025-10-10 18:45:37', 'Zeynep K.'),
('f20e307b-9c3c-4c3c-a472-e5c1578a0a68', '271dfde4-f86b-452d-b64e-9186f071da44', NULL, 5, 'Çok hızlı teslimat aldım ve Canva Pro Öğrenci sorunsuz çalışıyor. Kesinlikle tavsiye ederim!', 1, '2025-10-10 18:45:37', '2025-10-10 18:45:37', 'Ahmet Y.'),
('f76cb135-1090-4d74-9746-b02bf30013ce', 'd8f607f5-5da9-47a5-ba66-f4835a155a2e', NULL, 5, 'Güvenilir bir satıcı. Adobe Creative Cloud  ürününü hemen teslim aldım ve mükemmel hizmet verdiler.', 1, '2025-10-10 18:45:37', '2025-10-10 18:45:37', 'Zeynep K.'),
('f884953f-133f-484a-a0b4-c9b58e215349', 'bfb8d1cb-721a-4756-830b-a95454e1d5f1', NULL, 5, '', 1, '2025-10-13 21:16:37', '2025-10-13 21:16:37', 'Anonim'),
('f9028f80-5c71-4a46-b61e-91f626436780', '0fbee9fe-da18-4c6e-9910-73cf81ba5b9f', NULL, 5, 'Çok hızlı teslimat aldım ve Gemini Veo 3 Ultra(90 Gün) sorunsuz çalışıyor. Kesinlikle tavsiye ederim!', 1, '2025-10-10 18:45:37', '2025-10-10 18:45:37', 'Ahmet Y.'),
('f965e498-c029-428d-b301-248b9148b01c', '6c76a7b2-54ed-4290-8d83-c118533c5ee0', NULL, 5, 'Çok hızlı teslimat aldım ve Windows 11 Pro Retail Key sorunsuz çalışıyor. Kesinlikle tavsiye ederim!', 1, '2025-10-10 18:45:37', '2025-10-10 18:45:37', 'Ahmet Y.'),
('fd2528e9-361a-403d-a897-b40ddf81fb2d', '30de177e-cd4a-4851-b44f-063164872771', NULL, 5, 'Güvenilir bir satıcı. Canva Pro Yıllık ürününü hemen teslim aldım ve mükemmel hizmet verdiler.', 1, '2025-10-10 18:45:37', '2025-10-10 18:45:37', 'Zeynep K.'),
('fe78ff95-96fc-4c08-b540-488b2c1fa207', 'ba71df27-d8c3-41c0-ac01-cb7ac9ebea42', NULL, 5, 'Çok hızlı teslimat aldım ve ChatGPT Plus Hesap(30 Gün) sorunsuz çalışıyor. Kesinlikle tavsiye ederim!', 1, '2025-10-10 18:45:37', '2025-10-10 18:45:37', 'Ahmet Y.'),
('ff53c659-f89f-4b4b-92a1-39b562d2277c', '0bfafe30-cc66-458b-8fa8-3ebe25826040', NULL, 5, 'Güvenilir bir satıcı. Grand Theft Auto V ürününü hemen teslim aldım ve mükemmel hizmet verdiler.', 1, '2025-10-10 18:45:37', '2025-10-10 18:45:37', 'Zeynep K.');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `product_stock`
--

CREATE TABLE `product_stock` (
  `id` char(36) NOT NULL,
  `product_id` char(36) NOT NULL,
  `code` varchar(255) NOT NULL,
  `is_used` tinyint(1) NOT NULL DEFAULT 0,
  `used_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `order_item_id` char(36) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Tablo döküm verisi `product_stock`
--

INSERT INTO `product_stock` (`id`, `product_id`, `code`, `is_used`, `used_at`, `created_at`, `order_item_id`) VALUES
('00b7a259-32f7-4082-8bdf-4af144edd4ca', 'd0550d22-210a-4cdb-ae0c-4e57b5b3b7bf', 'naber7:iyiyim', 0, NULL, '2025-10-10 11:56:33', NULL),
('064b8252-ab08-4e7f-8dc6-a626b28dae0b', 'a76e27ef-e486-4cf8-b765-e12e51d52768', 'P0O9I-U8Y7T-R6E5W-Q4S3D-2F1GZ', 0, NULL, '2025-10-16 08:32:29', NULL),
('0a4409e1-6f5a-4f3f-b729-163ecb5508eb', 'd0550d22-210a-4cdb-ae0c-4e57b5b3b7bf', 'naber8:sanane', 0, NULL, '2025-10-10 11:56:33', NULL),
('0b20f72f-e5a9-4a0d-af23-732f65f04dc3', 'a76e27ef-e486-4cf8-b765-e12e51d52768', 'Y4U5I-O6P7A-S8D9F-G0H1J-K2L3M', 1, '2025-10-16 08:05:59', '2025-10-14 08:13:22', '1ae5a701-fb49-47a6-9a0b-9548546c4a42'),
('137b545f-ca8a-4683-9855-8365f8c82ca0', 'a76e27ef-e486-4cf8-b765-e12e51d52768', 'Q0O9I-U8Y7T-R6E5W-Q4S3D-2F1GZ', 0, NULL, '2025-10-16 08:32:29', NULL),
('15185658-3882-4e8b-aee2-9c86089f0a3c', 'a76e27ef-e486-4cf8-b765-e12e51d52768', 'I9U8Y-T7R6E-W5Q4Z-X3C2V-B1N0M', 0, NULL, '2025-10-16 08:32:29', NULL),
('17cdad02-7a2c-4efd-a3ff-3f76d1885e56', 'a76e27ef-e486-4cf8-b765-e12e51d52768', 'K8L7J-H6G5F-D4S3A-Q2W1E-R9T0Y', 0, NULL, '2025-10-16 08:32:29', NULL),
('19793f5c-e63b-457c-a155-1828fb1743bc', 'a76e27ef-e486-4cf8-b765-e12e51d52768', 'A9X3P-6LQ2F-Z8V7M-R1S0E-3C4HT', 0, NULL, '2025-10-16 08:32:29', NULL),
('2a201d9d-aeb5-4716-9249-b31fd50bed36', 'a76e27ef-e486-4cf8-b765-e12e51d52768', 'T6R5E-W4Q3Z-X2C1V-B9N8M-L7K0J', 1, '2025-10-14 09:51:19', '2025-10-14 08:13:22', '488f675c-dc64-4c5e-aefe-fb0e26154db7'),
('37ad5a1a-8361-4679-8012-78fce891d8e9', 'a76e27ef-e486-4cf8-b765-e12e51d52768', 'L0K9J-H8G7F-D6S5A-Q4W3E-R2T1Y', 0, NULL, '2025-10-16 08:32:29', NULL),
('3bafa917-a21f-42e0-9bfc-f782905feb3a', 'a76e27ef-e486-4cf8-b765-e12e51d52768', 'O5P6A-S7D8F-G9H0J-K1L2M-N3B4V', 0, NULL, '2025-10-16 08:32:29', NULL),
('3f31947f-590e-4260-b3e7-9ce3021d0028', 'd0550d22-210a-4cdb-ae0c-4e57b5b3b7bf', 'naber9:iyi', 0, NULL, '2025-10-10 11:56:33', NULL),
('5bb0a7fa-47c8-4568-9db1-fca1e324bc6c', '7495db5f-293d-46a8-9f25-d7efa6881043', 'stok3@gmail.com:stok3', 0, NULL, '2025-10-10 13:36:19', NULL),
('745e5482-ee48-47fd-a367-783da4e72e39', 'a76e27ef-e486-4cf8-b765-e12e51d52768', 'R2T3Y-U4I5O-P6A7S-D8F9G-H0J1K', 1, '2025-10-14 09:45:04', '2025-10-14 08:13:22', 'f40c4a6d-0860-4507-af23-c4612b6e110d'),
('74fae3d3-1e0a-4904-be81-816431e73c10', 'a76e27ef-e486-4cf8-b765-e12e51d52768', 'H1J2K-L3M4N-O5P6Q-R7S8T-U9V0W', 1, '2025-10-14 08:26:21', '2025-10-14 08:13:22', 'cd589785-479b-4e84-9fcd-be972dd3e134'),
('7c12a546-830f-464d-874b-559941ede44c', '7495db5f-293d-46a8-9f25-d7efa6881043', 'sukumuko@gmail.com:sukuleta', 1, '2025-10-10 13:33:58', '2025-10-10 13:33:19', 'ebb026b8-bbab-4a5e-87ee-7b550db1ec03'),
('80811a65-49ad-4e72-b31c-f9d08afbe857', 'a76e27ef-e486-4cf8-b765-e12e51d52768', 'CDO9I-U8Y7T-R6E5W-Q4S3D-2F1GZ', 0, NULL, '2025-10-16 08:32:29', NULL),
('837ddeab-3a64-4d31-b956-8e0db82d961c', 'a76e27ef-e486-4cf8-b765-e12e51d52768', 'ABO9I-U8Y7T-R6E5W-Q4S3D-2F1GZ', 0, NULL, '2025-10-16 08:32:29', NULL),
('8832ba27-6e51-43d6-bc26-00be1634ba5c', 'a76e27ef-e486-4cf8-b765-e12e51d52768', 'S9D8F-G7H6J-K5L4M-N3B2V-C1X0Z', 1, '2025-10-14 09:51:52', '2025-10-14 08:13:22', 'bc960c6c-6c5b-4b19-adcb-2597fc093da9'),
('a10e4227-6fb0-4c5a-a672-bf23e71666d6', 'a76e27ef-e486-4cf8-b765-e12e51d52768', 'V7B8N-M9L0K-J1H2G-F3D4S-A5Q6W', 1, '2025-10-16 08:18:14', '2025-10-14 08:13:22', '172fa3d3-40c2-4d4d-aba8-391e84862450'),
('ad336982-d946-4226-b487-312090fe1f5e', 'a76e27ef-e486-4cf8-b765-e12e51d52768', 'E3R4T-Y5U6I-O7P8A-S9D0F-G1H2J', 1, '2025-10-16 08:23:21', '2025-10-14 08:13:22', '2dd99337-841a-49cb-be68-7aaf583da73f'),
('af017cfe-281f-4fb7-be00-188deb0e67ef', 'a76e27ef-e486-4cf8-b765-e12e51d52768', '4F7B2-9KLMN-8QW3T-Y2PZR-6D5VX', 0, NULL, '2025-10-16 08:32:29', NULL),
('b0ae3f12-eafd-42d2-85eb-bc8b7535c482', 'a76e27ef-e486-4cf8-b765-e12e51d52768', 'Z1X2C-V3B4N-M5L6K-J7H8G-F9D0S', 1, '2025-10-16 08:30:03', '2025-10-14 08:13:22', '5f364cb3-211b-4f0f-b73f-caa9a1c7ae20'),
('c74cefa4-df2c-48fa-b971-312118b87b4e', 'a76e27ef-e486-4cf8-b765-e12e51d52768', 'X1C2V-B3N4M-L5K6J-H7G8F-D9S0A', 1, '2025-10-14 09:48:01', '2025-10-14 08:13:22', '093b2ae6-05cc-43b3-8036-8e86a7a642a2'),
('c99cdc31-d6f6-4e28-9a80-20dd85f7157e', 'a76e27ef-e486-4cf8-b765-e12e51d52768', 'Z8N3M-5K1LP-2Q7RV-9T0YS-6D4XB', 1, '2025-10-14 08:26:21', '2025-10-14 08:13:22', 'cd589785-479b-4e84-9fcd-be972dd3e134'),
('d435f3ed-969c-40a2-8006-9fb23c0d86df', 'a76e27ef-e486-4cf8-b765-e12e51d52768', 'Q2W6E-R5T7Y-U8I9O-P0ASD-F3G4H', 0, NULL, '2025-10-16 08:32:29', NULL),
('d93c53a0-3ad0-4073-86c1-7b25a51d3419', '7495db5f-293d-46a8-9f25-d7efa6881043', 'stok4@gmail.com:stok4', 0, NULL, '2025-10-10 13:36:19', NULL),
('dd6ae245-5e97-4391-9b27-7b9ac215a3d2', '7495db5f-293d-46a8-9f25-d7efa6881043', 'stok1@gmail.com:stok1', 1, '2025-10-10 13:33:58', '2025-10-10 13:33:19', 'ebb026b8-bbab-4a5e-87ee-7b550db1ec03'),
('e2cc1af7-3c3d-47b6-8958-988d56594ee1', 'a76e27ef-e486-4cf8-b765-e12e51d52768', 'M5N6B-V7C8X-Z9L0K-J1H2G-F3D4S', 1, '2025-10-14 09:33:39', '2025-10-14 08:13:22', '09640ea7-fd34-47f7-a323-d7e19fce56cc'),
('f3dca954-956f-4a12-90c8-976a3335f60a', 'a76e27ef-e486-4cf8-b765-e12e51d52768', 'C2V3B-N4M5L-K6J7H-G8F9D-S0A1Q', 1, '2025-10-16 08:24:49', '2025-10-14 08:13:22', 'f7a857bc-d365-4256-8ac2-68cbee7f60be'),
('fb034ce5-ae41-45c7-b36c-d92fb795945b', '7495db5f-293d-46a8-9f25-d7efa6881043', 'stok2@gmail.com:stok2', 0, NULL, '2025-10-10 13:36:19', NULL);

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `site_settings`
--

CREATE TABLE `site_settings` (
  `id` char(36) NOT NULL,
  `key` varchar(100) NOT NULL,
  `value` text NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Tablo döküm verisi `site_settings`
--

INSERT INTO `site_settings` (`id`, `key`, `value`, `created_at`, `updated_at`) VALUES
('05641622-aa04-4005-9d11-906f54d94447', 'home_blog_badge', '\"Blog Yazılarımızsa4\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('07d5dc6d-329c-4ffc-b201-4ca5c7b42a64', 'new_ticket_telegram', '\"true\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('0850d23e-c07f-4bb8-a2dd-eb688a2bed47', 'bank_transfer_enabled', '\"false\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('0ccbf739-2308-4b58-a966-7d0d0f0e51d9', 'seo_contact_title', '\"Bize Ulaşın - Dijimins\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('0f2ff5df-db32-45a1-a1a1-ebc6a309055b', 'home_featured_title', '\"En çok satan ürünlerimize göz atınssa4\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('1087ac95-f609-47eb-bd22-eedc70593ee2', 'smtp_from_name', '\"Dijital Paket\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('12dd13d2-8b53-40be-9e77-23bb58f12240', 'paytr_merchant_salt', '\"CpktdBh2fiQc4HkP\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('1326ba2b-66db-4914-a6e5-df1dfbe283fd', 'papara_enabled', '\"false\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('13a7cd2f-f1d4-4947-b023-d877ad392e69', 'paytr_merchant_id', '\"543370\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('15e7fde3-5d70-4a6e-a35e-b9e437e96e59', 'new_deposit_request_telegram', '\"false\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('18610713-8f96-4936-a0b6-6dfad2740f50', 'payment_methods', '\"{\\\"eft_enabled\\\":false,\\\"havale_account_holder\\\":\\\"qweqwe\\\",\\\"havale_bank_name\\\":\\\"qwe\\\",\\\"havale_enabled\\\":true,\\\"havale_iban\\\":\\\"TR545454545454545454545\\\"}\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('18da4735-0520-4a37-9fb4-bddb01807e62', 'deposit_telegram', '\"true\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('1f9a16f9-1264-4883-a300-803608e3a9de', 'linkedin_url', '\"https://lovable.dev\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('214f86a4-9c0d-4f52-9430-fe0c0d6b958f', 'home_display_mode', '\"list\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('268e7369-f6cd-41b6-8106-2a61b55191cc', 'facebook_pixel_id', '\"\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('2e0b304e-564b-476f-9d47-754a1fb756f0', 'currency_rates', '\"{\\\"EUR\\\":0.029,\\\"TRY\\\":1,\\\"USD\\\":0.031}\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('2e697726-0a35-4fb1-82f8-9a2796f2fa50', 'home_featured_button', '\"Tüm Ürünleri Görüntüles4\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('31479cbe-aeb0-407a-bc65-d75e906ee8f4', 'footer_company_name', '\"Dijital Markets\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('35366fb2-e7fb-44c1-acec-a7248297d2f3', 'telegram_template_new_deposit_request', '\"💰 *Yeni Bakiye Yükleme Talebi!*\\n\\n👤 Kullanıcı: {{user_name}}\\n💵 Tutar: {{amount}} TL\\n💳 Ödeme Yöntemi: {{payment_method}}\\n\\n⏰ Talep Tarihi: {{created_at}}\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('3922f119-262d-4e86-bab6-24a5506e3ffa', 'fake_notifications_enabled', '\"false\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('399a22ce-584c-4349-a6e4-e579e6993189', 'new_payment_request_telegram', '\"true\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('4126e116-ec07-4d85-a7ea-647863cb8374', 'telegram_notifications_enabled', '\"false\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('4329c222-cafc-4692-ac06-31d39f1ec43d', 'facebook_url', '\"https://lovable.devs\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('461d0e2f-a3c1-4bad-a93a-39fc2374574d', 'home_step_1_title', '\"Ürünü Seçins4\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('4622950e-a0d6-4b0d-927c-d03666da627d', 'home_hero_image_alt', '\"Dijital Ürünler\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('46b44590-f31d-4174-8fca-e555612f608e', 'auto_update_rates', '\"false\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('4784bd38-755a-455f-8c04-5ddd039eb76e', 'maintenance_message', '\"qwe\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('47a92af6-cbbb-4818-8b3f-41f85ba36924', 'home_header_sub_text_2', '\"%10 Fırsatı Dijimin\'de!s4\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('4a516115-e1c1-4d69-a90e-fd576c8bfb60', 'home_faq_cta_title', '\"Başka sorunuz mu var?s4\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('4b8fddb8-82f3-4518-a045-301df0f50099', 'telegram_chat_id', '\"7474884105\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('4e67bbd7-16dd-4724-b3b2-e47e53d7202c', 'home_step_3_title', '\"Anında Teslimat4\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('55fd06de-2343-426d-b8ce-3b0ad6fe854d', 'light_logo', '\"\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('574409c9-8a46-4917-a3a9-74cfe01398a0', 'maintenance_mode', '\"false\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('5807e24f-c274-4312-b481-072e048c2c7f', 'telegram_template_new_order', '\"🛒 *Yeni Sipariş Alındı!*\\n\\n📋 Sipariş No: {{order_number}}\\n👤 Müşteri: {{customer_name}}\\n📧 Email: {{customer_email}}\\n{{customer_phone}}\\n\\n💰 Toplam Tutar: {{final_amount}} TL\\n{{discount}}\\n\\n📦 Ürünler:\\n{{order_items}}\\n\\n⏰ Sipariş Tarihi: {{created_at}}\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('5dab8c8e-5154-49a4-bea8-7506bb3db323', 'home_header_top_text', '\"İndirim Sezonu Başladıs4\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('5def2712-3ea9-42d5-a1e6-2452f6437643', 'home_header_show_contact', '\"false\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('654dd48f-ceaa-4d52-bcb8-af771404bacf', 'theme_mode', '\"user_choice\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('68fc971a-35c1-4fd2-a57a-8eb8cb6320f7', 'home_step_4_title', '\"ss7/24 Destek4\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('6bee2ce3-ed8c-4314-9efb-b5cd9e7d46a2', 'custom_header_code', '\"<meta name=\\\"robots\\\" content=\\\"noindex, nofollow\\\" />\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('6d3e8f93-b0af-4d3e-bea2-bff8a010a6b3', 'telegram_template_new_ticket', '\"🎫 *Yeni Destek Talebi Açıldı!*\\n\\n👤 Kullanıcı: {{user_name}}\\n📋 Konu: {{subject}}\\n📊 Öncelik: {{priority}}\\n{{category}}\\n\\n💬 Mesaj:\\n{{message}}\\n\\n⏰ Talep Tarihi: {{created_at}}\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('74d242b4-4e95-4d34-b161-10992f34a0c5', 'notification_delay', '\"10\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('7889683d-11ce-45d3-82b0-852af73ae314', 'home_scroll_content_active', '\"true\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('7cbfe225-76e0-4eb9-8281-8cd1b21aad9d', 'telegram_template_new_payment_request', '\"💳 *Yeni Ödeme Talebi!*\\n\\n📋 Sipariş No: {{order_number}}\\n👤 Müşteri: {{customer_name}}\\n📧 Email: {{customer_email}}\\n{{customer_phone}}\\n\\n💰 Tutar: {{amount}} TL\\n💳 Ödeme Yöntemi: {{payment_method}}\\n\\n📦 Ürünler:\\n{{order_items}}\\n\\n⏰ Talep Tarihi: {{created_at}}\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('7d415987-ea03-4f91-a73c-2cf3772ea870', 'home_how_it_works_subtitle', '\"4 basit adımda dijital ürününüze sahip oluna4\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('7e7ba2d9-d2ed-4da0-8209-fda5747b365c', 'shopier_enabled', '\"true\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('7f3c8544-6a6a-48d4-b138-459d92563742', 'footer_address', '\"Atatürk Cad. No:123\\nİstanbul, Türkiye\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('7fcde91a-3cdd-4855-aeaf-44b450d5b21f', 'home_how_it_works_title', '\"Nasıl Çalışır?ss4\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('85fee78a-9edd-4cea-b3c8-e7cf71b7655b', 'home_hero_image_url', '\"https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/hero-1760112144368.webp\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('87041eeb-ebce-47fe-ab50-b2b6aab1780a', 'paytr_commission', '\"25\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('8835e526-9a8e-459e-accc-90458b77c198', 'home_faq_cta_button', '\"Bize Ulaşın →s4\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('88b90a74-4de2-4652-af81-bee79ff8fc19', 'paytr_enabled', '\"true\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('893af6a3-fd21-4177-bf63-e3e2816fdd60', 'home_scroll_content', '\"<h2>Hesap Satın Als</h2><p>Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.<span style=\\\"color: rgb(15, 23, 41);\\\">Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.</span></p><h2>Hesap Satın Al</h2><p>Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.</p><h2>Hesap Satın Al</h2><p>Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.</p><h2>Hesap Satın Al</h2><p>Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.</p><h2>Hesap Satın Al</h2><p>Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.</p><h2>Hesap Satın Al</h2><p>Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.</p>\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('893ef6b1-a216-4a17-9c4d-04f3ffadacaa', 'notification_interval', '\"30\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('8b2a260b-ad7e-4782-a0de-8780e9f3c6d2', 'home_step_1_desc', '\"Geniş ürün yelpazemizden ihtiyacınıza uygun dijital ürünü bulun ve inceleyin.s4\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('8b717068-dc98-49b8-a1f5-3826c61dff12', 'home_blog_subtitle', '\"sDijital ürünler, teknoloji ve güvenlik hakkında en güncel bilgileri4\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('9321c220-2de1-435a-b6c1-e5c53cb6e7d6', 'home_faq_title', '\"sSıkça Sorulan Sorulara4\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('94146c25-34a2-45fa-a324-324c5536529d', 'paytr_merchant_key', '\"UMin4naQQxKSchkh\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('9467a590-99c1-4c14-a070-25c4da00ffd3', 'paytr_test_mode', '\"true\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('96e8d247-2b2e-445e-934b-37c863b374d4', 'notification_display_duration', '\"5\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('97e7b0da-4d65-47fd-aa26-7897e59fa980', 'home_featured_badge', '\"sÖne Çıkan Ürünleria4\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('98c6835c-67b9-470c-9924-30da6913b0b9', 'smtp_from_email', '\"dijital@sosyalpaket.com\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('9c0a3b3a-b0f5-46a1-884b-ba3e14e1771d', 'deposit_approved_telegram', '\"true\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('9e90cd77-f23a-49e2-96c8-1906e5f076ab', 'twitter_url', '\"https://lovable.dev\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('a061caa1-3470-4322-9219-49251b517260', 'smtp_port', '\"465\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('a0d4bff5-aa59-4233-af47-26db5631ba87', 'smtp_username', '\"dijital@sosyalpaket.com\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('a4b49c13-f954-4cc8-9726-e2587d87f734', 'custom_footer_code', '\"\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('a62aaa4c-2f23-40e9-99d1-60b41d5b5825', 'home_faq_cta_subtitle', '\"Destek ekibimiz size yardımcı olmak için hazır4\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('a6355cc0-94af-4222-bd2e-c8a1d43061ef', 'site_description', '\"Dijital Ürün Satış Scripti yazılımı ile dijitalde öne çıkın\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('a766e2c9-0351-46b5-9036-1498b3a57d71', 'seo_blog_title', '\"Blog Yazıları - Dijimins\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('a8324fa7-d352-4ad1-8504-6feb77ad9d4c', 'stripe_public_key', '\"\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('a841f4ea-c037-44c2-8c59-70be391ca655', 'home_step_2_desc', '\"Kredi kartı, havale veya kripto para ile güvenli ödeme yapın.s4\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('aa8db0d1-7f55-44fa-b2b7-16cbdbcc7b83', 'seo_categories_title', '\"Tüm Kategoriler - Dijimins\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('ab149570-5098-40e5-a6f7-69736b100c15', 'whatsapp_number', '\"\\t+905454905148\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('acda45f1-7cf8-41f8-b1e2-837dcb1150ff', 'home_header_sub_text_1', '\"Yeni Üyelere Özels4\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('af53a3f7-2caf-4020-8b81-3f7b9862212f', 'guest_order_enabled', '\"true\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('b2f83dca-5b8e-47ac-94b6-cdc88c9df2a0', 'default_currency', '\"TRY\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('b8a4c347-2861-4e20-885c-e6bc919a7fb0', 'shopier_client_secret', '\"c2b2c6cabe942a62c4aa007eeee0bebe\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('bc24ca21-c40d-4fd0-89f6-749683bc2b6d', 'stripe_secret_key', '\"\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('bcb92ef4-4a60-4d0c-877b-7c5139f26042', 'bank_account_info', '\"QNB Finansbank A.Ş\\nIBAN : TR45 5698 5995 4585 4565 45\\nHesap Sahibi: xyz\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('bd53715d-36bd-413b-96dd-ff2ee7e1d465', 'home_header_bottom_text', '\"It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout.s4\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('bde09951-f709-4526-b32a-fa0a25456519', 'home_faq_items', '\"[{\\\"answer\\\":\\\"Ödemeniz onaylandıktan sonra ürününüz otomatik olarak anında e-posta adresinize ve üye panelinize teslim edilir. Ortalama teslimat süresi 1-2 dakikadır.s4\\\",\\\"question\\\":\\\"Ürünler ne kadar sürede teslim edilir?s4\\\"},{\\\"answer\\\":\\\"Kredi kartı, banka havalesi, Papara, PayTR, Shopier ve kripto para (Coinbase Commerce) ile ödeme yapabilirsiniz. Tüm ödemeler SSL sertifikası ile güvence altındadır.s4\\\",\\\"question\\\":\\\"Hangi ödeme yöntemlerini kabul ediyorsunuz?sa4\\\"},{\\\"answer\\\":\\\"Satın aldığınız ürün çalışmaz veya hatalı ise 7 gün içinde destek ekibimizle iletişime geçerek değişim veya iade talebinde bulunabilirsiniz. Tüm ürünlerimiz garanti kapsamındadır.s4\\\",\\\"question\\\":\\\"Ürün çalışmazsa ne olur?s4\\\"},{\\\"answer\\\":\\\"Evet! 5+ ürün alımlarında %5, 10+ ürün alımlarında %10 indirim otomatik olarak uygulanır. Daha fazla bilgi için müşteri hizmetlerimizle iletişime geçebilirsiniz.s4\\\",\\\"question\\\":\\\"Toplu alımlarda indirim var mı?s4\\\"},{\\\"answer\\\":\\\"Her ürünün kullanım koşulları farklıdır. Ürün detay sayfasında lisans türü ve kaç cihazda kullanılabileceği belirtilmiştir. Tek kullanımlık, çoklu kullanım ve süreli lisanslar mevcuttur.s4\\\",\\\"question\\\":\\\"Lisanslar kaç cihazda kullanılabilir?sa4\\\"},{\\\"answer\\\":\\\"7/24 canlı destek, e-posta, WhatsApp ve Telegram üzerinden bizimle iletişime geçebilirsiniz. Üye panelinizden destek talebi oluşturabilir veya SSS bölümünü inceleyebilirsiniz.s4\\\",\\\"question\\\":\\\"Müşteri desteği nasıl alırım?sa4\\\"}]\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('be8379fe-8e56-4be0-8a53-3c3f5c1533bc', 'payment_commission', '\"{\\\"paytr_enabled\\\":true,\\\"paytr_havale_enabled\\\":true,\\\"paytr_havale_rate\\\":\\\"0\\\",\\\"paytr_rate\\\":\\\"5\\\",\\\"shopier_enabled\\\":true,\\\"shopier_rate\\\":\\\"5\\\"}\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('befcdf24-a0f8-4d6d-b6a4-c8f8f1a40573', 'home_blog_button', '\"Tüm Blog Yazılarıs4\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('c0a1e4ff-bbf4-4926-bce8-b2c8f8366499', 'home_faq_subtitle', '\"Merak ettiklerinizin cevaplarını burada bulabilirsiniz4\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('c3ed6a86-bda6-4795-a319-50ed8644acf2', 'telegram_template_deposit_approved', '\"💰 *Bakiye Yükleme Onaylandı!*\\n\\n👤 Kullanıcı: {{user_name}}\\n💵 Tutar: {{amount}} TL\\n\\n⏰ Onay Tarihi: {{created_at}}\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('c4719799-b091-4a55-91e2-19d481d2c6db', 'home_header_button_text', '\"Ürünleri İncelessa4\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('c4e50751-6ad4-47bf-88eb-f611ba09b244', 'site_title', '\"Dijital Ürün Satış Scripti\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('c68be08e-ac40-4141-9bd9-21c026f8654a', 'footer_email', '\"destek@dijitalmarket.coms\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('c74ee6fd-7e93-47d2-8006-d0af348b7890', 'footer_copyright', '\"© 2025 Dijital Market. Tüm hakları saklıdır.\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('c8561584-2ebd-40bc-862c-a72bd77072a4', 'smtp_host', '\"srvm16.trwww.com\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('c98dc691-46d6-4333-99ae-df9b1541e83b', 'google_analytics_id', '\"\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('c9afa0eb-4890-40b1-8726-764b1c2bef2d', 'discord_webhook_url', '\"\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('ca7bdfbb-f63f-457d-8211-110f2fc00441', 'stripe_enabled', '\"false\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('d2023d10-e221-4e1f-97e7-1b40acfa21d1', 'shopier_client_id', '\"7f51f6e572cda435a8165b5db560d3e2\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('d2192478-88c9-4598-bc15-3217fe4fb20f', 'shopier_commission', '\"50\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('d32b6c9a-0677-4103-8f05-2eec6d8dd4e1', 'paytr_havale_commission', '\"0\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('d4dbaa77-8716-4907-910d-aec623839527', 'favicon_url', '\"\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('d56bf4e0-6e85-4e89-bf61-8578ffc1cf00', 'home_step_3_desc', '\"Ödeme onaylandıktan sonra ürününüz otomatik olarak e-posta ve panele iletilir.s4\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('d7cdd57c-58cc-4463-bfa6-7eb694017c53', 'dark_logo', '\"\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('d923a87e-29e9-441e-9cbb-235aa2821863', 'min_balance_limit', '\"10\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('da4bd864-c314-4bd7-be98-aea579fc8ed4', 'paytr_havale_enabled', '\"true\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('dc33b02b-39e7-46bc-a38f-e7fd84c6472b', 'home_step_2_title', '\"Güvenli Ödemesa4\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('e07b6795-de4a-437f-8800-d7b049918bfe', 'telegram_bot_token', '\"8393738600:AAGKKJw8Fp2XcCzo6p2oG14EHIPHDS5z6Ow\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('e08f392a-d5fd-4b46-bfaa-5fd9a0bfafef', 'instagram_url', '\"https://lovable.dev\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('e3d3b0d6-a2fb-4488-a749-7d3288fa4432', 'home_blog_title', '\"Güncel İçeriklers4\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('e6eaf2b4-e5af-4d98-885a-766868a1c973', 'seo_products_title', '\"Tüm Ürünler - Dijimins\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('e7963d57-7ca1-4be5-9567-68457771eb60', 'available_currencies', '\"[\\\"TRY\\\",\\\"USD\\\",\\\"EUR\\\"]\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('ea353228-8b3a-4a50-b487-d4f09c922205', 'papara_api_key', '\"\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('f613de65-d7e2-4707-9532-9643ba933128', 'smtp_ssl', '\"true\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('f7ee0f74-142b-4018-8e6b-d8ed89f7bd87', 'smtp_password', '\"BSe0x71LNQ\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('f90bb37f-4148-4a49-939c-da27ba3a9cdf', 'new_order_telegram', '\"true\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('faf0f287-8395-4ee9-8a5e-91f2caf07f79', 'footer_description', '\"Güvenilir dijital ürün satış platformu. En uygun fiyatlarla lisans, hesap, yazılım ve daha fazlası.\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('fb9431b3-fa22-490d-8529-bcf7f3a57290', 'footer_phone', '\"\\t+90 555 555 55 55\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38'),
('fc30d214-e458-466b-809f-019b4228fca5', 'home_step_4_desc', '\"Herhangi bir sorun yaşarsanız destek ekibimiz size yardımcı olmaya hazır.s4\"', '2025-10-15 20:29:38', '2025-10-15 20:29:38');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `support_tickets`
--

CREATE TABLE `support_tickets` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `subject` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `status` enum('open','in_progress','waiting_response','closed') NOT NULL DEFAULT 'open',
  `priority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Tablo döküm verisi `support_tickets`
--

INSERT INTO `support_tickets` (`id`, `user_id`, `subject`, `message`, `status`, `priority`, `created_at`, `updated_at`) VALUES
('10c9b25a-91ef-4711-84a9-af7118d61d15', '19a2bc26-63d1-43ad-ab56-d7f3c3719a34', 'hhh', 'hhghfh', 'open', 'high', '2025-10-13 15:41:10', '2025-10-13 15:41:10'),
('1b483b05-a8e0-48bd-8233-792863d26973', '19a2bc26-63d1-43ad-ab56-d7f3c3719a34', 'jhkhjk', 'kkk4545', '', 'medium', '2025-10-13 15:49:56', '2025-10-13 17:00:18'),
('22c8d700-a5b8-4395-b1ce-1aba42495add', '19a2bc26-63d1-43ad-ab56-d7f3c3719a34', 'vay', 'asdfsf', 'open', 'urgent', '2025-10-13 15:33:19', '2025-10-13 15:33:19'),
('3cefc270-a8a9-43bc-82c1-996f6b0c1526', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'sdfsdf', 'sdfsdfsdfsdf', 'open', 'high', '2025-10-13 17:02:22', '2025-10-13 17:02:22'),
('48beb30b-bbd2-44e9-a595-048f2632af20', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'Yahahhahasdasd', 'sdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdfsdlfsdkflsdf', 'open', 'high', '2025-10-13 15:45:08', '2025-10-13 15:45:08'),
('534148b8-7462-422e-93d7-430cc2fdf6a1', '19a2bc26-63d1-43ad-ab56-d7f3c3719a34', 'zıortapoz', 'necmi naber', 'open', 'medium', '2025-10-13 15:39:01', '2025-10-13 15:39:01'),
('8040c380-9855-4a97-8581-b64f7b32936c', '4a8fb7f7-0668-4429-9309-fe88ac90eed2', 'Sipariş', 'Ne zaman gelicek', 'open', 'medium', '2025-10-13 20:23:48', '2025-10-13 20:23:48'),
('8e741f22-84fd-4186-a626-f7e6ac4e7680', '19a2bc26-63d1-43ad-ab56-d7f3c3719a34', 'hqqqqqqqqq', '213123123', 'open', 'medium', '2025-10-13 15:43:58', '2025-10-13 15:43:58'),
('8f83c5b7-5cbb-4d7e-8262-2b89c5415e6d', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'jklj', 'jlkjkljkl', 'closed', 'medium', '2025-10-13 17:02:39', '2025-10-15 14:23:24'),
('951808b7-632b-4f6f-b2ff-a55f06ad19f9', '19a2bc26-63d1-43ad-ab56-d7f3c3719a34', 'fgfgfg', 'fgfgf', 'open', 'high', '2025-10-13 15:17:40', '2025-10-13 15:17:40'),
('952f0b54-c62e-4284-96fd-f3c968339cff', '7129bc31-88dc-42da-ab80-415a21f2ea9a', '67', '6666', 'open', 'medium', '2025-10-13 15:44:36', '2025-10-13 15:44:36'),
('96fe7c2e-36df-4d38-933b-ad6df54a47eb', '19a2bc26-63d1-43ad-ab56-d7f3c3719a34', 'jjjjjjj', 'eeeeeeeeeeee', 'open', 'low', '2025-10-13 15:42:39', '2025-10-13 15:42:39'),
('a2f05a24-ac0b-4b59-a322-9864cc5e5364', '0ac37a5c-a8be-4d25-b853-1e5c9574c1b3', 'Sipariş Hk', 'qweqweqweqwe', 'closed', 'high', '2025-10-13 12:55:00', '2025-10-13 12:55:48'),
('a894ffcf-28cb-4609-9021-b381e559a5f2', '19a2bc26-63d1-43ad-ab56-d7f3c3719a34', 'ghghg', 'fghfghfgh', 'open', 'low', '2025-10-13 15:37:19', '2025-10-13 15:37:19'),
('abebedb2-eefb-4d8f-a3bc-bb7e5b96a8aa', '19a2bc26-63d1-43ad-ab56-d7f3c3719a34', 'sordum', 'çiçeğe', 'open', 'medium', '2025-10-13 15:31:05', '2025-10-13 15:31:05'),
('c742d0ad-3f07-466b-ac1e-2cf34b84941a', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'Zaza', 'Zaza zaza', 'open', 'high', '2025-10-15 14:43:45', '2025-10-15 14:43:45'),
('ded743a6-7618-430c-bffb-e4db49dc6247', '4a8fb7f7-0668-4429-9309-fe88ac90eed2', 'Rast Gelsin İşin', 'qweqwewqe', '', 'medium', '2025-10-15 14:54:04', '2025-10-15 14:54:40'),
('df786c2d-5668-4688-88ad-952a3eebc812', '19a2bc26-63d1-43ad-ab56-d7f3c3719a34', 'eee', 'sdfsd', 'open', 'high', '2025-10-13 15:25:49', '2025-10-13 15:25:49'),
('dff55daa-ff67-401e-ba81-9513e2fbb164', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'df', 'dfdsfsdf', 'closed', 'medium', '2025-10-06 22:28:30', '2025-10-13 12:55:58'),
('e1b24422-8042-4897-a2e5-ff8dfb20ba3b', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'sdfsdf', 'sdfsdfsdf', 'open', 'high', '2025-10-13 17:02:29', '2025-10-13 17:02:29'),
('eb07b91d-d727-40a0-9dcd-55321578d0ab', 'd279bb9d-797d-4972-a8bd-a77a40caba91', 'Zübüşmatik', 'Petmatik', 'open', 'medium', '2025-10-14 08:08:53', '2025-10-14 08:08:53'),
('ebea761f-8dbe-42ff-9805-2a8c552d9388', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'qweqweqwe', 'asdasdsa', 'open', 'urgent', '2025-10-13 17:02:16', '2025-10-13 17:02:16'),
('f20fa9f8-5d93-463a-bf7b-60449fa5dfa4', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'Rast', 'RASt', '', 'medium', '2025-10-15 14:50:50', '2025-10-15 14:55:56');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `system_version`
--

CREATE TABLE `system_version` (
  `id` char(36) NOT NULL,
  `version` varchar(20) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Tablo döküm verisi `system_version`
--

INSERT INTO `system_version` (`id`, `version`, `created_at`) VALUES
('0f62bd34-0600-4f93-9753-a2279c5e46c5', '1.0.0', '2025-10-19 14:59:20'),
('2b283077-a26e-4e61-b5f7-ec6aa0fb0235', '1.0.1', '2025-10-19 14:59:20');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `ticket_replies`
--

CREATE TABLE `ticket_replies` (
  `id` char(36) NOT NULL,
  `ticket_id` char(36) NOT NULL,
  `user_id` char(36) DEFAULT NULL,
  `message` text NOT NULL,
  `is_admin` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Tablo döküm verisi `ticket_replies`
--

INSERT INTO `ticket_replies` (`id`, `ticket_id`, `user_id`, `message`, `is_admin`, `created_at`) VALUES
('002c708b-40e6-4ed2-ba57-baf9820d288a', '22c8d700-a5b8-4395-b1ce-1aba42495add', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'rtertertert', 1, '2025-10-13 15:35:26'),
('11edb28f-f448-470f-bbf8-f41ed95d1299', 'abebedb2-eefb-4d8f-a3bc-bb7e5b96a8aa', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'annen baban varmıdır', 1, '2025-10-13 15:31:17'),
('1a24fbf0-7ead-4658-91b9-501ed2af8f3e', 'ded743a6-7618-430c-bffb-e4db49dc6247', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'qwe', 1, '2025-10-15 14:54:40'),
('2415fa5f-bb16-4579-b4a4-a9f81d1b3f96', '951808b7-632b-4f6f-b2ff-a55f06ad19f9', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'sdfsdfsdf', 1, '2025-10-13 15:18:52'),
('50ba596c-a42d-4d93-a200-511746c13aad', 'f20fa9f8-5d93-463a-bf7b-60449fa5dfa4', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'asd', 1, '2025-10-15 14:51:05'),
('52ca9e72-cc03-4e04-a395-4ea697b9109e', 'a2f05a24-ac0b-4b59-a322-9864cc5e5364', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'Halledildi.', 1, '2025-10-13 12:55:25'),
('6145dfcb-dd55-4161-8cb4-e93e36ec56d5', 'df786c2d-5668-4688-88ad-952a3eebc812', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'mjhhjkj', 1, '2025-10-13 15:25:57'),
('68b76c1f-b1bc-47e2-b0ea-b76d674a7bea', 'eb07b91d-d727-40a0-9dcd-55321578d0ab', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'Buyrun.', 1, '2025-10-14 08:09:21'),
('7b7e644e-32bf-4e54-9dc5-55c1c1a6a65a', 'a894ffcf-28cb-4609-9021-b381e559a5f2', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'gdfgdfgdfgdfgdfg', 1, '2025-10-13 15:37:32'),
('84734c73-861c-42aa-baaf-6b1c47aa57c6', 'ded743a6-7618-430c-bffb-e4db49dc6247', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'qweqwe', 1, '2025-10-15 14:54:20'),
('8bb03576-8794-43b3-b5ca-adcf79b2a8b9', '8f83c5b7-5cbb-4d7e-8262-2b89c5415e6d', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'asdasd', 0, '2025-10-15 14:22:17'),
('8cb9e080-2331-453f-8e1d-0079e59d1e97', 'c742d0ad-3f07-466b-ac1e-2cf34b84941a', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'asd', 1, '2025-10-15 14:44:06'),
('8cfe1c53-2e05-44f2-8fe0-cdc44d8e6ef9', 'a2f05a24-ac0b-4b59-a322-9864cc5e5364', '0ac37a5c-a8be-4d25-b853-1e5c9574c1b3', 'tamamdır\n', 0, '2025-10-13 12:55:34'),
('94a8863b-c5fe-4823-8bc2-dd984c10fa62', '1b483b05-a8e0-48bd-8233-792863d26973', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'dfgdfgdfg', 1, '2025-10-13 16:01:03'),
('96d44802-14f4-4faf-9125-113b19f4ab8c', '534148b8-7462-422e-93d7-430cc2fdf6a1', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'sadsad', 1, '2025-10-13 15:39:16'),
('a014e062-fa53-4dba-b69a-c839c0d11ddf', 'ded743a6-7618-430c-bffb-e4db49dc6247', '4a8fb7f7-0668-4429-9309-fe88ac90eed2', 'qwe', 0, '2025-10-15 14:54:31'),
('b8867640-7014-4bb3-be17-37d4a41805c6', 'dff55daa-ff67-401e-ba81-9513e2fbb164', '7129bc31-88dc-42da-ab80-415a21f2ea9a', '45', 0, '2025-10-06 22:33:36'),
('cdc4b674-9360-46ec-9158-7ec7ce047e59', 'dff55daa-ff67-401e-ba81-9513e2fbb164', '7129bc31-88dc-42da-ab80-415a21f2ea9a', '545', 1, '2025-10-06 22:33:22'),
('e76247c0-95dc-4295-8661-3d6b901e4950', '22c8d700-a5b8-4395-b1ce-1aba42495add', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'rdgdfgdfgdfgdfgdfgdfgdfg', 1, '2025-10-13 15:33:27'),
('ff93ce04-575c-4c7a-9cbd-b7aec9b9c88b', '8f83c5b7-5cbb-4d7e-8262-2b89c5415e6d', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'asd', 1, '2025-10-15 14:23:24');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `topbar_settings`
--

CREATE TABLE `topbar_settings` (
  `id` char(36) NOT NULL,
  `text` varchar(255) NOT NULL,
  `link` varchar(500) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 0,
  `show_ticker` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Tablo döküm verisi `topbar_settings`
--

INSERT INTO `topbar_settings` (`id`, `text`, `link`, `is_active`, `show_ticker`, `created_at`, `updated_at`) VALUES
('07bf8399-21fe-47fe-909d-9b6174bb4970', 'Üye Ol %10 İndirim Kazan', '/giris', 1, 0, '2025-10-09 19:09:07', '2025-10-09 19:09:07');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `update_history`
--

CREATE TABLE `update_history` (
  `id` char(36) NOT NULL,
  `version` varchar(20) NOT NULL,
  `description` text DEFAULT NULL,
  `applied_at` datetime NOT NULL DEFAULT current_timestamp(),
  `snapshot_id` char(36) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Tablo döküm verisi `update_history`
--

INSERT INTO `update_history` (`id`, `version`, `description`, `applied_at`, `snapshot_id`) VALUES
('7b7e7865-33f7-419c-9fdc-e9637b800355', '1.0.0', '', '2025-10-19 14:59:20', NULL),
('c7c08803-3439-4a95-99de-155e2b9fe518', '1.0.0', '', '2025-10-19 14:59:20', NULL);

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `update_snapshots`
--

CREATE TABLE `update_snapshots` (
  `id` char(36) NOT NULL,
  `version` varchar(20) NOT NULL,
  `data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`data`)),
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Tablo döküm verisi `update_snapshots`
--

INSERT INTO `update_snapshots` (`id`, `version`, `data`, `created_at`) VALUES
('9ca58622-7057-4c0f-8982-db5e572464f9', '1.0.0', '{\"site_settings\":[{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"e71a123e-b266-4fd8-9c10-ae264fb756bb\",\"key\":\"site_title\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"Dijital Ürün Satış Scripti\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"dceed33e-846e-42ab-9910-61ad7b809d93\",\"key\":\"site_description\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"Dijital Ürün Satış Scripti yazılımı ile dijitalde öne çıkın.\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"2ca19a47-f873-4345-ae16-5278f01622c4\",\"key\":\"min_balance_limit\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":10},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"d73b3adf-baf3-4e4a-bb32-a9d52b33c7ae\",\"key\":\"whatsapp_number\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"+905454905148\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"29696caa-0513-4342-bdf2-5f0b2917641b\",\"key\":\"guest_order_enabled\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":true},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"7d62df02-766e-49ea-b414-056aded31136\",\"key\":\"maintenance_mode\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":false},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"164cda76-12d1-4c71-b9f7-c7fa4f9ea3f6\",\"key\":\"maintenance_message\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"qwe\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"8c2e2ec5-435c-4e3c-8ee1-8374d724dc50\",\"key\":\"light_logo\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"2702ef67-f2c8-48ce-8fbb-0063423f7360\",\"key\":\"dark_logo\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"70d722be-bd13-498c-80cd-7f1f62481034\",\"key\":\"favicon_url\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"d46126cc-c3f2-46de-8ddf-55d6f6fe766d\",\"key\":\"custom_header_code\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"6d9f3509-ece8-4daa-ab81-a3af12815431\",\"key\":\"custom_footer_code\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"3ccd2dff-c07a-4dd3-aee2-a54b9d30f2eb\",\"key\":\"smtp_host\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"459c8a35-c955-4995-bf46-9221eb27470b\",\"key\":\"smtp_port\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":587},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"1e3876f5-35f8-4cda-88c0-a2c22381f405\",\"key\":\"smtp_username\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"10446f49-c66e-48e2-87e9-f428f39cf87c\",\"key\":\"smtp_password\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"38c9d758-ec2f-4604-b873-cfbb129f8dd2\",\"key\":\"smtp_from_email\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"4960d8ac-d584-4840-b49f-f76f9d7a9edf\",\"key\":\"smtp_from_name\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"4c42662a-0452-480e-bdab-cf9bfb3233c8\",\"key\":\"stripe_enabled\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":false},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"05c1ff27-9834-4219-b2c9-8be5cf44931f\",\"key\":\"stripe_public_key\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"1b93ad48-3506-4d49-85f8-ab1d8a6791d2\",\"key\":\"stripe_secret_key\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"ca1c7584-e0eb-4807-bf23-2f0a0a2c2ce4\",\"key\":\"paytr_enabled\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":true},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"e3d756f2-e44e-48c1-87e4-d0b12c313e2e\",\"key\":\"paytr_merchant_id\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"543370\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"c98ca117-2322-4de3-ae68-e5f03dae9a56\",\"key\":\"paytr_merchant_key\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"UMin4naQQxKSchkh\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"8e9cd576-d134-4255-98dc-654a14af23e0\",\"key\":\"paytr_merchant_salt\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"CpktdBh2fiQc4HkP\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"3e74fc7c-05f5-4643-b922-d00b65a906aa\",\"key\":\"paytr_test_mode\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":true},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"efd4a8a0-dbb5-469a-bc5f-d439bcb354b2\",\"key\":\"paytr_commission\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":5},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"401978f7-4780-4a56-bbf4-4879b0b691e8\",\"key\":\"paytr_havale_enabled\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":true},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"d906a384-de46-474d-bcc6-a69650747fa3\",\"key\":\"paytr_havale_commission\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":0},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"2b8f4b21-8314-4494-9e93-d713cd3bc1c1\",\"key\":\"shopier_enabled\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":true},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"5825dda2-d818-436f-981b-dec54a9d7c6c\",\"key\":\"shopier_client_id\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"7f51f6e572cda435a8165b5db560d3e2\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"a4826f69-dbe7-457d-ad00-3cb50281810c\",\"key\":\"shopier_client_secret\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"c2b2c6cabe942a62c4aa007eeee0bebe\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"43d220fd-7ee8-4e87-afba-a4148b31d31f\",\"key\":\"shopier_commission\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":5},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"81db4bde-cd62-4683-b895-83fee5d93aac\",\"key\":\"papara_enabled\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":false},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"364f88ba-7519-4cb0-8b21-5305e37d46cc\",\"key\":\"papara_api_key\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"2f6031c5-b0a6-438c-a4cd-34bfb81eddad\",\"key\":\"bank_transfer_enabled\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":false},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"fb82b695-9162-4b77-9e3b-d096d19ec601\",\"key\":\"bank_account_info\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"QNB Finansbank A.Ş\\nIBAN : TR45 5698 5995 4585 4565 45\\nAlıcı : EPİN LİMİTED\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"1ae5cbc1-fbb4-4003-a0d1-683695e58dbc\",\"key\":\"google_analytics_id\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"44c3c035-4f63-4263-bae9-c1c45ae5da5a\",\"key\":\"facebook_pixel_id\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"7a567779-d623-4ae5-b8b2-b973b7f66b97\",\"key\":\"telegram_bot_token\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"ee7f9bd8-4a5a-4032-8ce0-9b22eaa18fa0\",\"key\":\"telegram_chat_id\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"8988d3ce-561e-4fc0-86d6-5d2f26d6d2ae\",\"key\":\"telegram_notifications_enabled\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":false},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"564689d7-62cc-4f95-b51d-380cbebcac95\",\"key\":\"discord_webhook_url\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"b38e6589-6293-49b9-a385-171ccff6d738\",\"key\":\"facebook_url\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"https://lovable.dev\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"25f68897-799e-4871-93ab-277bf2b86b04\",\"key\":\"twitter_url\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"https://lovable.dev\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"c25fe01f-72e2-4938-8813-bdce7292a5b7\",\"key\":\"instagram_url\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"https://lovable.dev\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"ccf41f78-2981-4e03-ac8a-74d785a7e212\",\"key\":\"linkedin_url\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"https://lovable.dev\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"45d19747-58db-4738-a7c4-6c9b11fddea0\",\"key\":\"default_currency\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"USD\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"75977f52-58c8-499a-a210-3d40f6599039\",\"key\":\"available_currencies\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":[\"TRY\",\"USD\",\"EUR\"]},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"0ec63631-2569-4636-b1b1-e9e39e0c1737\",\"key\":\"currency_rates\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":{\"EUR\":0.029,\"TRY\":1,\"USD\":0.031}},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"8dc2dc64-636b-4b7b-8845-da480dc334f9\",\"key\":\"auto_update_rates\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":false},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"92eefee0-2c00-4c1d-b58f-a6ac88e237b0\",\"key\":\"home_display_mode\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"carousel\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"26c4be61-1c59-4f86-84cb-075128682f3c\",\"key\":\"home_header_top_text\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"Lisans & Hesap Satın Al\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"ca90d8d7-9ca4-4f52-8193-944eaebaf1df\",\"key\":\"home_header_bottom_text\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"Sende kayıt olarak vereceğin ilk siparişte %10 indirimi kapmak için şimdi üye ol.\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"d96c07ab-d98b-424f-83c0-1cca439c28c3\",\"key\":\"home_header_sub_text_1\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"Yeni Üyelere Özel\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"73cad119-e893-4e32-b191-128c3db7c694\",\"key\":\"home_header_sub_text_2\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"%10 İndirim\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"68b6b0b7-6664-41c2-bbb4-366403010cba\",\"key\":\"home_header_button_text\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"Ürünleri İncele\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"ce7c9540-3dea-4d0e-9b47-19b9726aa197\",\"key\":\"home_header_show_contact\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":true},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"8aec6ff6-84ed-4312-b12a-442b21fc29f5\",\"key\":\"home_hero_image_url\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/hero-1760112144368.webp\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"143c9428-b0c9-4764-adb1-a79363b0d628\",\"key\":\"home_featured_badge\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"Öne Çıkan Ürünler\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"b34c727b-a88e-408c-b20e-743fccd347b0\",\"key\":\"home_featured_title\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"En çok satan ürünlerimize göz atın\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"3a1b0551-0657-47d0-aa63-f6dd4bbc0f06\",\"key\":\"home_featured_button\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"Tüm Ürünleri Görüntüle\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"282cc6d9-decb-4866-9c32-0ec129965d06\",\"key\":\"home_how_it_works_title\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"Nasıl Çalışır?\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"158e3d56-f18d-4d78-9c59-5c04e748fdb9\",\"key\":\"home_how_it_works_subtitle\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"4 basit adımda dijital ürününüze sahip olun\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"743da695-b994-477b-a18d-58a0c1c50a62\",\"key\":\"home_step_1_title\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"Ürünü Seçin\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"a525ca96-ed4c-4df4-887b-ec4c72dffe64\",\"key\":\"home_step_1_desc\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"Geniş ürün yelpazemizden ihtiyacınıza uygun dijital ürünü bulun ve inceleyin.\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"c0f8beec-8ab4-4863-bcc7-0a3215931688\",\"key\":\"home_step_2_title\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"Güvenli Ödeme\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"ae50ac0c-c307-4c92-b6a8-80e087924480\",\"key\":\"home_step_2_desc\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"Kredi kartı, havale veya kripto para ile güvenli ödeme yapın.\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"1dc6c0cc-730e-4339-9036-76af0e045d0e\",\"key\":\"home_step_3_title\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"Anında Teslimat\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"517a1c07-3d60-4242-995f-a82108fcc1fe\",\"key\":\"home_step_3_desc\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"Ödeme onaylandıktan sonra ürününüz otomatik olarak e-posta ve panele iletilir.\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"cde90c34-60d0-46a3-b01b-5ab8110a9b2a\",\"key\":\"home_step_4_title\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"7/24 Destek\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"28c5989c-6e93-433e-b5d6-891f3c8aa4f4\",\"key\":\"home_step_4_desc\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"Herhangi bir sorun yaşarsanız destek ekibimiz size yardımcı olmaya hazır.\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"6a245474-6efe-4ab0-8821-cb015f3fea99\",\"key\":\"home_faq_title\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"Sıkça Sorulan Sorular\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"c3d3c519-7089-4045-9b2e-993c434ae064\",\"key\":\"home_faq_subtitle\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"Merak ettiklerinizin cevaplarını burada bulabilirsiniz\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"f1c54c18-e5a6-45fe-9d32-48245345d75d\",\"key\":\"home_faq_items\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":[{\"answer\":\"Ödemeniz onaylandıktan sonra ürününüz otomatik olarak anında e-posta adresinize ve üye panelinize teslim edilir. Ortalama teslimat süresi 1-2 dakikadır.\",\"question\":\"Ürünler ne kadar sürede teslim edilir?\"},{\"answer\":\"Kredi kartı, banka havalesi, Papara, PayTR, Shopier ve kripto para (Coinbase Commerce) ile ödeme yapabilirsiniz. Tüm ödemeler SSL sertifikası ile güvence altındadır.\",\"question\":\"Hangi ödeme yöntemlerini kabul ediyorsunuz?\"},{\"answer\":\"Satın aldığınız ürün çalışmaz veya hatalı ise 7 gün içinde destek ekibimizle iletişime geçerek değişim veya iade talebinde bulunabilirsiniz. Tüm ürünlerimiz garanti kapsamındadır.\",\"question\":\"Ürün çalışmazsa ne olur?\"},{\"answer\":\"Evet! 5+ ürün alımlarında %5, 10+ ürün alımlarında %10 indirim otomatik olarak uygulanır. Daha fazla bilgi için müşteri hizmetlerimizle iletişime geçebilirsiniz.\",\"question\":\"Toplu alımlarda indirim var mı?\"},{\"answer\":\"Her ürünün kullanım koşulları farklıdır. Ürün detay sayfasında lisans türü ve kaç cihazda kullanılabileceği belirtilmiştir. Tek kullanımlık, çoklu kullanım ve süreli lisanslar mevcuttur.\",\"question\":\"Lisanslar kaç cihazda kullanılabilir?\"},{\"answer\":\"7/24 canlı destek, e-posta, WhatsApp ve Telegram üzerinden bizimle iletişime geçebilirsiniz. Üye panelinizden destek talebi oluşturabilir veya SSS bölümünü inceleyebilirsiniz.\",\"question\":\"Müşteri desteği nasıl alırım?s\"}]},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"56ba6bcf-7110-4c50-8ca8-df4cbbdcd767\",\"key\":\"home_faq_cta_title\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"Başka sorunuz mu var?\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"cb15e953-be62-4fe2-b7d9-5229187eecf9\",\"key\":\"home_faq_cta_subtitle\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"Destek ekibimiz size yardımcı olmak için hazır\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"d2d70cff-f8b0-464b-b6df-01065e3f9b5c\",\"key\":\"home_faq_cta_button\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"Bize Ulaşın →\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"0d0ebfa1-d8da-4274-b023-75dd2e970cbf\",\"key\":\"home_blog_badge\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"Blog Yazılarımız\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"6cb4dd18-d613-4b80-9ce3-4c4dd2439172\",\"key\":\"home_blog_title\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"Güncel İçerikler\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"a51e26b7-7334-4bed-b1ac-9fdd0a22a1b2\",\"key\":\"home_blog_subtitle\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"Dijital ürünler, teknoloji ve güvenlik hakkında en güncel bilgiler\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"cc72c029-7e3f-448e-b287-6a5b374c14d4\",\"key\":\"home_blog_button\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"Tüm Blog Yazıları\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"2b7a3719-926f-4d05-a084-81d3d1feedb5\",\"key\":\"home_scroll_content\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"<h2><strong>Hesap Satın Al</strong></h2><p>Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.<span style=\\\"color: rgb(15, 23, 41);\\\">Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.</span></p><p><br></p><h2><strong style=\\\"color: rgb(15, 23, 41);\\\">Windows 11 Lisans Satın Al</strong></h2><p><span style=\\\"color: rgb(15, 23, 41);\\\">Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.</span></p><p><br></p><p><span style=\\\"color: rgb(15, 23, 41);\\\">Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.</span></p><p><br></p><h2><strong>Office Key Satın Al</strong></h2><p><span style=\\\"color: rgb(15, 23, 41);\\\">Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.</span></p><p><br></p><p><span style=\\\"color: rgb(15, 23, 41);\\\">Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.</span></p><p><br></p><p><span style=\\\"color: rgb(15, 23, 41);\\\">Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.</span></p><h2><br></h2><h2><strong style=\\\"color: rgb(15, 23, 41);\\\">Gmail Hesabı Satın Al</strong></h2><p><span style=\\\"color: rgb(15, 23, 41);\\\">Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.</span></p><p><br></p><p><span style=\\\"color: rgb(15, 23, 41);\\\">Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.</span></p>\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"73db78d8-321d-4c86-ba19-90145a4f5160\",\"key\":\"home_scroll_content_active\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":true},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"c97c1203-1393-418d-bb13-0a77a1e98474\",\"key\":\"notification_display_duration\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":5},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"91be197a-ebad-4ab9-9040-04dc529cb8a2\",\"key\":\"notification_interval\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":30},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"22c2c5ff-612c-49aa-beff-01723a8a2511\",\"key\":\"notification_delay\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":10},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"327c0191-79b7-4af8-b22d-abfb9967f028\",\"key\":\"fake_notifications_enabled\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":false},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"e729d148-fbaa-445a-8137-bf6fdb44ce5a\",\"key\":\"default_language\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"tr\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"eb8f6041-bcf4-48ed-aec1-9d182ffad20d\",\"key\":\"available_languages\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":[\"tr\",\"en\"]},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"a61b91e2-adbf-4c5a-9a3f-d0c9f79a85d2\",\"key\":\"paytr_max_installment\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":0},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"e30ac209-8ef2-4785-86e9-99d54c8412dc\",\"key\":\"paytr_no_installment\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":0},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"118378f6-3718-4756-afad-8e160f93e6e5\",\"key\":\"paytr_timeout_limit\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":30},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"feb6c5a5-81dd-4862-8334-5d8669b0e7a0\",\"key\":\"paytr_currency\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"TL\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"64d2c53e-c195-4e7e-b0aa-710e454b4013\",\"key\":\"site_name\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":{\"en\":\"Digital Market\",\"tr\":\"Dijital Market\"}},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"a8cd8d20-8544-4f05-a6d3-1b77dc1804b6\",\"key\":\"home_trust_badge_1_title\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"Anında Teslimats\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"d063b230-8a3d-4be4-869e-556e0e6f7f5c\",\"key\":\"home_trust_badge_1_subtitle\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"Otomatik sistems\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"c7bd9573-d42c-4fe9-9926-e3a48523ab88\",\"key\":\"home_trust_badge_2_title\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"Güvenli Ödemes\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"90e9303f-877a-4890-9c52-e1d29d3dba98\",\"key\":\"home_trust_badge_2_subtitle\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"SSL korumalıs\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"b9d44b9d-8652-4fd3-8e9f-d79722aa5896\",\"key\":\"home_stat_1_number\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"10,0001+\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"d96f2ed0-2840-4058-b495-060b8be6dd9d\",\"key\":\"home_stat_1_label\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"Mutlu Müşteris\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"1da545d3-1c72-4064-ba81-bc47363d7a91\",\"key\":\"home_stat_2_number\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"24/7s\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"1b2297d5-c617-4bf5-897b-5f53e7a4c95b\",\"key\":\"home_stat_2_label\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"Desteks\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"229b89ab-61e2-46e4-bd00-2fb396cba64f\",\"key\":\"home_hero_image_alt\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"Dijital Ürünlers\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"0c7582a3-a21e-4d16-a5c4-119a3a88b8cd\",\"key\":\"seo_products_title\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"Tüm Ürünler - Dijimin\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"f44df67e-bbcf-44f1-a4ce-a7806d4d9b8f\",\"key\":\"seo_products_description\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"Tüm ürünlere göz atın.\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"6d88c3f7-1c6f-447f-9351-25393c6b5a2a\",\"key\":\"seo_categories_title\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"Tüm Kategoriler - Dijimin\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"a60a41e4-6ccb-48ab-9c0e-c5e55a855bcb\",\"key\":\"seo_categories_description\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"Tüm kategorilerimize göz atın.\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"2e1818c8-dc8e-461c-9dee-4e2318f6e142\",\"key\":\"seo_blog_title\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"Blog Yazıları - Dijimin\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"c80c3b2c-a4da-4c44-b007-2681ddbcbf32\",\"key\":\"seo_blog_description\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"Blog yazılarına göz atın.\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"d04441ae-2eeb-47d2-8974-1737b3cfcf71\",\"key\":\"seo_contact_title\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"Bize Ulaşın - Dijimin\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"c8776765-1b2a-4bf1-9a51-b94e92ff5d66\",\"key\":\"seo_contact_description\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"Bize muhakkak ulaşın.\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"45c2a5a1-9bbd-4f77-b22f-ca22dacb92b6\",\"key\":\"payment_methods\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":{\"eft_account_holder\":\"\",\"eft_bank_name\":\"\",\"eft_enabled\":false,\"eft_iban\":\"\",\"havale_account_holder\":\"EPİN LİMİTED\",\"havale_bank_name\":\"QNB Finansbank\",\"havale_enabled\":false,\"havale_iban\":\"TR45 5698 5995 4585 4565 45\",\"wallet_enabled\":true}},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"d61f8483-8321-4dc7-827c-04294dfe92f4\",\"key\":\"featured_product_ids\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":[]}]}', '2025-10-10 21:47:03');
INSERT INTO `update_snapshots` (`id`, `version`, `data`, `created_at`) VALUES
('a28abed9-9568-4735-90f1-430acbfda2cf', '1.0.0', '{\"site_settings\":[{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"e71a123e-b266-4fd8-9c10-ae264fb756bb\",\"key\":\"site_title\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"Dijital Ürün Satış Scripti\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"dceed33e-846e-42ab-9910-61ad7b809d93\",\"key\":\"site_description\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"Dijital Ürün Satış Scripti yazılımı ile dijitalde öne çıkın.\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"2ca19a47-f873-4345-ae16-5278f01622c4\",\"key\":\"min_balance_limit\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":10},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"d73b3adf-baf3-4e4a-bb32-a9d52b33c7ae\",\"key\":\"whatsapp_number\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"+905454905148\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"29696caa-0513-4342-bdf2-5f0b2917641b\",\"key\":\"guest_order_enabled\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":true},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"7d62df02-766e-49ea-b414-056aded31136\",\"key\":\"maintenance_mode\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":false},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"164cda76-12d1-4c71-b9f7-c7fa4f9ea3f6\",\"key\":\"maintenance_message\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"qwe\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"8c2e2ec5-435c-4e3c-8ee1-8374d724dc50\",\"key\":\"light_logo\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"2702ef67-f2c8-48ce-8fbb-0063423f7360\",\"key\":\"dark_logo\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"70d722be-bd13-498c-80cd-7f1f62481034\",\"key\":\"favicon_url\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"d46126cc-c3f2-46de-8ddf-55d6f6fe766d\",\"key\":\"custom_header_code\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"6d9f3509-ece8-4daa-ab81-a3af12815431\",\"key\":\"custom_footer_code\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"3ccd2dff-c07a-4dd3-aee2-a54b9d30f2eb\",\"key\":\"smtp_host\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"459c8a35-c955-4995-bf46-9221eb27470b\",\"key\":\"smtp_port\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":587},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"1e3876f5-35f8-4cda-88c0-a2c22381f405\",\"key\":\"smtp_username\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"10446f49-c66e-48e2-87e9-f428f39cf87c\",\"key\":\"smtp_password\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"38c9d758-ec2f-4604-b873-cfbb129f8dd2\",\"key\":\"smtp_from_email\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"4960d8ac-d584-4840-b49f-f76f9d7a9edf\",\"key\":\"smtp_from_name\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"4c42662a-0452-480e-bdab-cf9bfb3233c8\",\"key\":\"stripe_enabled\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":false},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"05c1ff27-9834-4219-b2c9-8be5cf44931f\",\"key\":\"stripe_public_key\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"1b93ad48-3506-4d49-85f8-ab1d8a6791d2\",\"key\":\"stripe_secret_key\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"ca1c7584-e0eb-4807-bf23-2f0a0a2c2ce4\",\"key\":\"paytr_enabled\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":true},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"e3d756f2-e44e-48c1-87e4-d0b12c313e2e\",\"key\":\"paytr_merchant_id\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"543370\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"c98ca117-2322-4de3-ae68-e5f03dae9a56\",\"key\":\"paytr_merchant_key\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"UMin4naQQxKSchkh\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"8e9cd576-d134-4255-98dc-654a14af23e0\",\"key\":\"paytr_merchant_salt\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"CpktdBh2fiQc4HkP\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"3e74fc7c-05f5-4643-b922-d00b65a906aa\",\"key\":\"paytr_test_mode\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":true},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"efd4a8a0-dbb5-469a-bc5f-d439bcb354b2\",\"key\":\"paytr_commission\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":5},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"401978f7-4780-4a56-bbf4-4879b0b691e8\",\"key\":\"paytr_havale_enabled\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":true},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"d906a384-de46-474d-bcc6-a69650747fa3\",\"key\":\"paytr_havale_commission\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":0},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"2b8f4b21-8314-4494-9e93-d713cd3bc1c1\",\"key\":\"shopier_enabled\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":true},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"5825dda2-d818-436f-981b-dec54a9d7c6c\",\"key\":\"shopier_client_id\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"7f51f6e572cda435a8165b5db560d3e2\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"a4826f69-dbe7-457d-ad00-3cb50281810c\",\"key\":\"shopier_client_secret\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"c2b2c6cabe942a62c4aa007eeee0bebe\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"43d220fd-7ee8-4e87-afba-a4148b31d31f\",\"key\":\"shopier_commission\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":5},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"81db4bde-cd62-4683-b895-83fee5d93aac\",\"key\":\"papara_enabled\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":false},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"364f88ba-7519-4cb0-8b21-5305e37d46cc\",\"key\":\"papara_api_key\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"2f6031c5-b0a6-438c-a4cd-34bfb81eddad\",\"key\":\"bank_transfer_enabled\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":false},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"fb82b695-9162-4b77-9e3b-d096d19ec601\",\"key\":\"bank_account_info\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"QNB Finansbank A.Ş\\nIBAN : TR45 5698 5995 4585 4565 45\\nAlıcı : EPİN LİMİTED\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"1ae5cbc1-fbb4-4003-a0d1-683695e58dbc\",\"key\":\"google_analytics_id\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"44c3c035-4f63-4263-bae9-c1c45ae5da5a\",\"key\":\"facebook_pixel_id\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"7a567779-d623-4ae5-b8b2-b973b7f66b97\",\"key\":\"telegram_bot_token\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"ee7f9bd8-4a5a-4032-8ce0-9b22eaa18fa0\",\"key\":\"telegram_chat_id\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"8988d3ce-561e-4fc0-86d6-5d2f26d6d2ae\",\"key\":\"telegram_notifications_enabled\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":false},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"564689d7-62cc-4f95-b51d-380cbebcac95\",\"key\":\"discord_webhook_url\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"b38e6589-6293-49b9-a385-171ccff6d738\",\"key\":\"facebook_url\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"https://lovable.dev\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"25f68897-799e-4871-93ab-277bf2b86b04\",\"key\":\"twitter_url\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"https://lovable.dev\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"c25fe01f-72e2-4938-8813-bdce7292a5b7\",\"key\":\"instagram_url\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"https://lovable.dev\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"ccf41f78-2981-4e03-ac8a-74d785a7e212\",\"key\":\"linkedin_url\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"https://lovable.dev\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"45d19747-58db-4738-a7c4-6c9b11fddea0\",\"key\":\"default_currency\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"USD\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"75977f52-58c8-499a-a210-3d40f6599039\",\"key\":\"available_currencies\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":[\"TRY\",\"USD\",\"EUR\"]},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"0ec63631-2569-4636-b1b1-e9e39e0c1737\",\"key\":\"currency_rates\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":{\"EUR\":0.029,\"TRY\":1,\"USD\":0.031}},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"8dc2dc64-636b-4b7b-8845-da480dc334f9\",\"key\":\"auto_update_rates\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":false},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"92eefee0-2c00-4c1d-b58f-a6ac88e237b0\",\"key\":\"home_display_mode\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"carousel\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"26c4be61-1c59-4f86-84cb-075128682f3c\",\"key\":\"home_header_top_text\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"Lisans & Hesap Satın Al\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"ca90d8d7-9ca4-4f52-8193-944eaebaf1df\",\"key\":\"home_header_bottom_text\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"Sende kayıt olarak vereceğin ilk siparişte %10 indirimi kapmak için şimdi üye ol.\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"d96c07ab-d98b-424f-83c0-1cca439c28c3\",\"key\":\"home_header_sub_text_1\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"Yeni Üyelere Özel\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"73cad119-e893-4e32-b191-128c3db7c694\",\"key\":\"home_header_sub_text_2\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"%10 İndirim\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"68b6b0b7-6664-41c2-bbb4-366403010cba\",\"key\":\"home_header_button_text\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"Ürünleri İncele\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"ce7c9540-3dea-4d0e-9b47-19b9726aa197\",\"key\":\"home_header_show_contact\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":true},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"8aec6ff6-84ed-4312-b12a-442b21fc29f5\",\"key\":\"home_hero_image_url\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"https://krbintayhtsfoqpkgsbv.supabase.co/storage/v1/object/public/product-images/hero-1760112144368.webp\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"143c9428-b0c9-4764-adb1-a79363b0d628\",\"key\":\"home_featured_badge\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"Öne Çıkan Ürünler\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"b34c727b-a88e-408c-b20e-743fccd347b0\",\"key\":\"home_featured_title\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"En çok satan ürünlerimize göz atın\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"3a1b0551-0657-47d0-aa63-f6dd4bbc0f06\",\"key\":\"home_featured_button\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"Tüm Ürünleri Görüntüle\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"282cc6d9-decb-4866-9c32-0ec129965d06\",\"key\":\"home_how_it_works_title\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"Nasıl Çalışır?\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"158e3d56-f18d-4d78-9c59-5c04e748fdb9\",\"key\":\"home_how_it_works_subtitle\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"4 basit adımda dijital ürününüze sahip olun\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"743da695-b994-477b-a18d-58a0c1c50a62\",\"key\":\"home_step_1_title\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"Ürünü Seçin\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"a525ca96-ed4c-4df4-887b-ec4c72dffe64\",\"key\":\"home_step_1_desc\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"Geniş ürün yelpazemizden ihtiyacınıza uygun dijital ürünü bulun ve inceleyin.\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"c0f8beec-8ab4-4863-bcc7-0a3215931688\",\"key\":\"home_step_2_title\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"Güvenli Ödeme\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"ae50ac0c-c307-4c92-b6a8-80e087924480\",\"key\":\"home_step_2_desc\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"Kredi kartı, havale veya kripto para ile güvenli ödeme yapın.\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"1dc6c0cc-730e-4339-9036-76af0e045d0e\",\"key\":\"home_step_3_title\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"Anında Teslimat\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"517a1c07-3d60-4242-995f-a82108fcc1fe\",\"key\":\"home_step_3_desc\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"Ödeme onaylandıktan sonra ürününüz otomatik olarak e-posta ve panele iletilir.\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"cde90c34-60d0-46a3-b01b-5ab8110a9b2a\",\"key\":\"home_step_4_title\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"7/24 Destek\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"28c5989c-6e93-433e-b5d6-891f3c8aa4f4\",\"key\":\"home_step_4_desc\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"Herhangi bir sorun yaşarsanız destek ekibimiz size yardımcı olmaya hazır.\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"6a245474-6efe-4ab0-8821-cb015f3fea99\",\"key\":\"home_faq_title\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"Sıkça Sorulan Sorular\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"c3d3c519-7089-4045-9b2e-993c434ae064\",\"key\":\"home_faq_subtitle\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"Merak ettiklerinizin cevaplarını burada bulabilirsiniz\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"f1c54c18-e5a6-45fe-9d32-48245345d75d\",\"key\":\"home_faq_items\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":[{\"answer\":\"Ödemeniz onaylandıktan sonra ürününüz otomatik olarak anında e-posta adresinize ve üye panelinize teslim edilir. Ortalama teslimat süresi 1-2 dakikadır.\",\"question\":\"Ürünler ne kadar sürede teslim edilir?\"},{\"answer\":\"Kredi kartı, banka havalesi, Papara, PayTR, Shopier ve kripto para (Coinbase Commerce) ile ödeme yapabilirsiniz. Tüm ödemeler SSL sertifikası ile güvence altındadır.\",\"question\":\"Hangi ödeme yöntemlerini kabul ediyorsunuz?\"},{\"answer\":\"Satın aldığınız ürün çalışmaz veya hatalı ise 7 gün içinde destek ekibimizle iletişime geçerek değişim veya iade talebinde bulunabilirsiniz. Tüm ürünlerimiz garanti kapsamındadır.\",\"question\":\"Ürün çalışmazsa ne olur?\"},{\"answer\":\"Evet! 5+ ürün alımlarında %5, 10+ ürün alımlarında %10 indirim otomatik olarak uygulanır. Daha fazla bilgi için müşteri hizmetlerimizle iletişime geçebilirsiniz.\",\"question\":\"Toplu alımlarda indirim var mı?\"},{\"answer\":\"Her ürünün kullanım koşulları farklıdır. Ürün detay sayfasında lisans türü ve kaç cihazda kullanılabileceği belirtilmiştir. Tek kullanımlık, çoklu kullanım ve süreli lisanslar mevcuttur.\",\"question\":\"Lisanslar kaç cihazda kullanılabilir?\"},{\"answer\":\"7/24 canlı destek, e-posta, WhatsApp ve Telegram üzerinden bizimle iletişime geçebilirsiniz. Üye panelinizden destek talebi oluşturabilir veya SSS bölümünü inceleyebilirsiniz.\",\"question\":\"Müşteri desteği nasıl alırım?s\"}]},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"56ba6bcf-7110-4c50-8ca8-df4cbbdcd767\",\"key\":\"home_faq_cta_title\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"Başka sorunuz mu var?\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"cb15e953-be62-4fe2-b7d9-5229187eecf9\",\"key\":\"home_faq_cta_subtitle\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"Destek ekibimiz size yardımcı olmak için hazır\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"d2d70cff-f8b0-464b-b6df-01065e3f9b5c\",\"key\":\"home_faq_cta_button\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"Bize Ulaşın →\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"0d0ebfa1-d8da-4274-b023-75dd2e970cbf\",\"key\":\"home_blog_badge\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"Blog Yazılarımız\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"6cb4dd18-d613-4b80-9ce3-4c4dd2439172\",\"key\":\"home_blog_title\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"Güncel İçerikler\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"a51e26b7-7334-4bed-b1ac-9fdd0a22a1b2\",\"key\":\"home_blog_subtitle\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"Dijital ürünler, teknoloji ve güvenlik hakkında en güncel bilgiler\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"cc72c029-7e3f-448e-b287-6a5b374c14d4\",\"key\":\"home_blog_button\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"Tüm Blog Yazıları\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"2b7a3719-926f-4d05-a084-81d3d1feedb5\",\"key\":\"home_scroll_content\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"<h2><strong>Hesap Satın Al</strong></h2><p>Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.<span style=\\\"color: rgb(15, 23, 41);\\\">Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.</span></p><p><br></p><h2><strong style=\\\"color: rgb(15, 23, 41);\\\">Windows 11 Lisans Satın Al</strong></h2><p><span style=\\\"color: rgb(15, 23, 41);\\\">Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.</span></p><p><br></p><p><span style=\\\"color: rgb(15, 23, 41);\\\">Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.</span></p><p><br></p><h2><strong>Office Key Satın Al</strong></h2><p><span style=\\\"color: rgb(15, 23, 41);\\\">Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.</span></p><p><br></p><p><span style=\\\"color: rgb(15, 23, 41);\\\">Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.</span></p><p><br></p><p><span style=\\\"color: rgb(15, 23, 41);\\\">Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.</span></p><h2><br></h2><h2><strong style=\\\"color: rgb(15, 23, 41);\\\">Gmail Hesabı Satın Al</strong></h2><p><span style=\\\"color: rgb(15, 23, 41);\\\">Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.</span></p><p><br></p><p><span style=\\\"color: rgb(15, 23, 41);\\\">Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.</span></p>\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"73db78d8-321d-4c86-ba19-90145a4f5160\",\"key\":\"home_scroll_content_active\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":true},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"c97c1203-1393-418d-bb13-0a77a1e98474\",\"key\":\"notification_display_duration\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":5},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"91be197a-ebad-4ab9-9040-04dc529cb8a2\",\"key\":\"notification_interval\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":30},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"22c2c5ff-612c-49aa-beff-01723a8a2511\",\"key\":\"notification_delay\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":10},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"327c0191-79b7-4af8-b22d-abfb9967f028\",\"key\":\"fake_notifications_enabled\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":false},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"e729d148-fbaa-445a-8137-bf6fdb44ce5a\",\"key\":\"default_language\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"tr\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"eb8f6041-bcf4-48ed-aec1-9d182ffad20d\",\"key\":\"available_languages\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":[\"tr\",\"en\"]},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"a61b91e2-adbf-4c5a-9a3f-d0c9f79a85d2\",\"key\":\"paytr_max_installment\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":0},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"e30ac209-8ef2-4785-86e9-99d54c8412dc\",\"key\":\"paytr_no_installment\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":0},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"118378f6-3718-4756-afad-8e160f93e6e5\",\"key\":\"paytr_timeout_limit\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":30},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"feb6c5a5-81dd-4862-8334-5d8669b0e7a0\",\"key\":\"paytr_currency\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"TL\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"64d2c53e-c195-4e7e-b0aa-710e454b4013\",\"key\":\"site_name\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":{\"en\":\"Digital Market\",\"tr\":\"Dijital Market\"}},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"a8cd8d20-8544-4f05-a6d3-1b77dc1804b6\",\"key\":\"home_trust_badge_1_title\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"Anında Teslimats\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"d063b230-8a3d-4be4-869e-556e0e6f7f5c\",\"key\":\"home_trust_badge_1_subtitle\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"Otomatik sistems\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"c7bd9573-d42c-4fe9-9926-e3a48523ab88\",\"key\":\"home_trust_badge_2_title\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"Güvenli Ödemes\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"90e9303f-877a-4890-9c52-e1d29d3dba98\",\"key\":\"home_trust_badge_2_subtitle\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"SSL korumalıs\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"b9d44b9d-8652-4fd3-8e9f-d79722aa5896\",\"key\":\"home_stat_1_number\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"10,0001+\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"d96f2ed0-2840-4058-b495-060b8be6dd9d\",\"key\":\"home_stat_1_label\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"Mutlu Müşteris\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"1da545d3-1c72-4064-ba81-bc47363d7a91\",\"key\":\"home_stat_2_number\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"24/7s\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"1b2297d5-c617-4bf5-897b-5f53e7a4c95b\",\"key\":\"home_stat_2_label\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"Desteks\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"229b89ab-61e2-46e4-bd00-2fb396cba64f\",\"key\":\"home_hero_image_alt\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"Dijital Ürünlers\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"0c7582a3-a21e-4d16-a5c4-119a3a88b8cd\",\"key\":\"seo_products_title\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"Tüm Ürünler - Dijimin\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"f44df67e-bbcf-44f1-a4ce-a7806d4d9b8f\",\"key\":\"seo_products_description\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"Tüm ürünlere göz atın.\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"6d88c3f7-1c6f-447f-9351-25393c6b5a2a\",\"key\":\"seo_categories_title\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"Tüm Kategoriler - Dijimin\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"a60a41e4-6ccb-48ab-9c0e-c5e55a855bcb\",\"key\":\"seo_categories_description\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"Tüm kategorilerimize göz atın.\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"2e1818c8-dc8e-461c-9dee-4e2318f6e142\",\"key\":\"seo_blog_title\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"Blog Yazıları - Dijimin\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"c80c3b2c-a4da-4c44-b007-2681ddbcbf32\",\"key\":\"seo_blog_description\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"Blog yazılarına göz atın.\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"d04441ae-2eeb-47d2-8974-1737b3cfcf71\",\"key\":\"seo_contact_title\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"Bize Ulaşın - Dijimin\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"c8776765-1b2a-4bf1-9a51-b94e92ff5d66\",\"key\":\"seo_contact_description\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":\"Bize muhakkak ulaşın.\"},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"45c2a5a1-9bbd-4f77-b22f-ca22dacb92b6\",\"key\":\"payment_methods\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":{\"eft_account_holder\":\"\",\"eft_bank_name\":\"\",\"eft_enabled\":false,\"eft_iban\":\"\",\"havale_account_holder\":\"EPİN LİMİTED\",\"havale_bank_name\":\"QNB Finansbank\",\"havale_enabled\":false,\"havale_iban\":\"TR45 5698 5995 4585 4565 45\",\"wallet_enabled\":true}},{\"created_at\":\"2025-10-10T16:14:22.124639+00:00\",\"id\":\"d61f8483-8321-4dc7-827c-04294dfe92f4\",\"key\":\"featured_product_ids\",\"updated_at\":\"2025-10-10T16:14:22.124639+00:00\",\"value\":[]}]}', '2025-10-10 21:42:01');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `users`
--

CREATE TABLE `users` (
  `id` char(36) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `full_name` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `wallet_balance` decimal(10,2) NOT NULL DEFAULT 0.00,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `email_verified` tinyint(1) NOT NULL DEFAULT 0,
  `reset_token` varchar(255) DEFAULT NULL,
  `reset_token_expires` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL,
  `last_sign_in_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Tablo döküm verisi `users`
--

INSERT INTO `users` (`id`, `email`, `password_hash`, `full_name`, `phone`, `wallet_balance`, `is_active`, `email_verified`, `reset_token`, `reset_token_expires`, `created_at`, `updated_at`, `last_sign_in_at`) VALUES
('0ac37a5c-a8be-4d25-b853-1e5c9574c1b3', 'mehmet@gmail.com', '$2b$12$temporary.hash.needs.reset', 'Mehmet Kuber', '05454905148', 0.00, 1, 0, NULL, NULL, '2025-10-07 09:49:06', '2025-10-16 09:26:05', NULL),
('19a2bc26-63d1-43ad-ab56-d7f3c3719a34', 'hostingisletmesi@gmail.com', '$2b$12$temporary.hash.needs.reset', 'Nuri Muh', '05414417854', 0.00, 1, 0, NULL, NULL, '2025-10-13 15:07:15', '2025-10-16 09:26:05', NULL),
('4a8fb7f7-0668-4429-9309-fe88ac90eed2', 'mlhgs1@gmail.com', '$2b$12$temporary.hash.needs.reset', 'Sultan Abdü', '05427354197', 0.00, 1, 0, NULL, NULL, '2025-10-13 20:14:20', '2025-10-16 09:26:05', NULL),
('7129bc31-88dc-42da-ab80-415a21f2ea9a', 'melihkececi@yandex.com', '$2b$12$temporary.hash.needs.reset', 'Melih Keçeci', NULL, 0.00, 1, 0, NULL, NULL, '2025-10-06 18:08:24', '2025-10-16 09:26:05', NULL),
('d279bb9d-797d-4972-a8bd-a77a40caba91', 'kececimelih@gmail.com', '$2b$12$temporary.hash.needs.reset', 'Keçeci Melih', '05425547474', 0.00, 1, 0, NULL, NULL, '2025-10-14 07:49:48', '2025-10-16 09:26:05', NULL);

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `user_roles`
--

CREATE TABLE `user_roles` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `role` enum('admin','moderator','user') NOT NULL DEFAULT 'user',
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Tablo döküm verisi `user_roles`
--

INSERT INTO `user_roles` (`id`, `user_id`, `role`, `created_at`) VALUES
('d49103a1-9095-4efc-8645-c08dd05ed100', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 'admin', '2025-10-06 18:09:39');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `wallet_deposit_requests`
--

CREATE TABLE `wallet_deposit_requests` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_method` varchar(50) NOT NULL,
  `payment_proof` varchar(500) DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'pending',
  `admin_notes` text DEFAULT NULL,
  `processed_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Tablo döküm verisi `wallet_deposit_requests`
--

INSERT INTO `wallet_deposit_requests` (`id`, `user_id`, `amount`, `payment_method`, `payment_proof`, `status`, `admin_notes`, `processed_at`, `created_at`, `updated_at`) VALUES
('15cafe4b-4551-4041-98c3-fd2fdcb5bc1b', '0ac37a5c-a8be-4d25-b853-1e5c9574c1b3', 5000.00, 'havale', NULL, 'approved', NULL, NULL, '2025-10-07 09:49:16', '2025-10-07 09:49:23'),
('1d2f9d83-6425-49a0-a859-5617bb2aa8c3', '4a8fb7f7-0668-4429-9309-fe88ac90eed2', 500.00, 'havale', NULL, 'pending', NULL, NULL, '2025-10-13 20:19:47', '2025-10-13 20:19:47'),
('3051f1e8-174d-4753-92fd-e22387f76a3f', '4a8fb7f7-0668-4429-9309-fe88ac90eed2', 100.00, 'havale', NULL, 'pending', NULL, NULL, '2025-10-13 20:17:13', '2025-10-13 20:17:13'),
('81199501-5ef7-479c-b4c1-239d712f3045', '4a8fb7f7-0668-4429-9309-fe88ac90eed2', 999.00, 'havale', NULL, 'pending', NULL, NULL, '2025-10-13 20:21:09', '2025-10-13 20:21:09'),
('8281cf35-2977-4979-9e83-a504529c7c5f', '19a2bc26-63d1-43ad-ab56-d7f3c3719a34', 100.00, 'havale', NULL, 'approved', NULL, NULL, '2025-10-13 16:26:48', '2025-10-13 16:27:36'),
('b1c8903d-1d54-4f60-85cf-7e6dde6a7a47', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 10.00, 'havale', NULL, 'approved', NULL, NULL, '2025-10-13 16:34:37', '2025-10-13 16:35:13'),
('f4c7dd3e-681f-4d83-ad7d-5d2e9eb0e72d', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 10.00, 'paytr', NULL, 'approved', NULL, NULL, '2025-10-12 11:50:39', '2025-10-13 16:27:46'),
('fb6017d3-d8ce-48e3-9521-ef03a272aaa4', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 100.00, 'havale', NULL, 'approved', NULL, NULL, '2025-10-07 09:24:07', '2025-10-07 09:24:23'),
('fceffcdd-20eb-4113-bcef-bd7fc6c9f36f', '4a8fb7f7-0668-4429-9309-fe88ac90eed2', 250.00, 'havale', NULL, 'pending', NULL, NULL, '2025-10-13 20:18:08', '2025-10-13 20:18:08');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `wallet_transactions`
--

CREATE TABLE `wallet_transactions` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `type` enum('deposit','withdrawal','purchase','refund') NOT NULL,
  `description` varchar(500) DEFAULT NULL,
  `order_id` char(36) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Tablo döküm verisi `wallet_transactions`
--

INSERT INTO `wallet_transactions` (`id`, `user_id`, `amount`, `type`, `description`, `order_id`, `created_at`) VALUES
('0a0b3fd3-e78d-413e-bd7a-7645dceba60c', '19a2bc26-63d1-43ad-ab56-d7f3c3719a34', 10000.00, 'deposit', 'Admin tarafından eklendi', NULL, '2025-10-13 15:53:40'),
('2cd2174f-899a-46d1-ab35-175081d8170f', '0ac37a5c-a8be-4d25-b853-1e5c9574c1b3', 10000.00, 'deposit', 'Admin tarafından eklendi', NULL, '2025-10-09 15:36:41'),
('317a20b7-c7fe-4af1-aa50-cae8f062940b', '19a2bc26-63d1-43ad-ab56-d7f3c3719a34', 10.00, 'deposit', 'Bakiye yükleme - WALLET1760371882951', NULL, '2025-10-13 16:11:43'),
('3691e7b1-a6c3-4760-82c5-e4b22b9c0e98', '19a2bc26-63d1-43ad-ab56-d7f3c3719a34', 100.00, 'deposit', 'Bakiye yükleme onaylandı - havale', NULL, '2025-10-13 16:27:37'),
('5beac0b8-c55a-4366-95da-33c0c8e0c6bb', 'd279bb9d-797d-4972-a8bd-a77a40caba91', 200000.00, 'deposit', 'Admin tarafından eklendi', NULL, '2025-10-14 08:50:21'),
('5f771693-b69a-4455-b3bc-38546ec22a06', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 10.00, 'deposit', 'Bakiye yükleme onaylandı - paytr', NULL, '2025-10-13 16:27:46'),
('6fb6af4b-3003-460e-81a2-7f29443e94a9', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 10.00, 'deposit', 'Bakiye yükleme onaylandı - havale', NULL, '2025-10-13 16:35:13'),
('749de4eb-d5e9-431b-b5f6-74407f8184b8', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 100.00, 'deposit', 'Bakiye yükleme onaylandı - havale', NULL, '2025-10-07 09:24:23'),
('78781fa9-d82a-41d9-b0b8-3e12c7a11041', '7129bc31-88dc-42da-ab80-415a21f2ea9a', 100000.00, 'deposit', 'Admin tarafından eklendi', NULL, '2025-10-14 08:25:48'),
('7e2fa7cf-f6cd-49d4-9a32-2043835bcc1d', 'd279bb9d-797d-4972-a8bd-a77a40caba91', 10000.00, 'deposit', 'Bakiye yükleme - WALLET1760428206933', NULL, '2025-10-14 07:50:34'),
('80b6f8a1-ac98-49ad-a977-ae332b4f7460', '19a2bc26-63d1-43ad-ab56-d7f3c3719a34', 11.00, 'deposit', 'Bakiye yükleme - WALLET1760372349637', NULL, '2025-10-13 16:19:26'),
('889fab80-3de4-4926-b668-2470afc823a1', '4a8fb7f7-0668-4429-9309-fe88ac90eed2', 1000.00, 'deposit', 'Admin tarafından eklendi', NULL, '2025-10-13 20:22:07'),
('93ddd47b-bdcd-46f5-83cb-0af15dc4a60f', '0ac37a5c-a8be-4d25-b853-1e5c9574c1b3', 5000.00, 'deposit', 'Bakiye yükleme onaylandı - havale', NULL, '2025-10-07 09:49:23'),
('a011189a-bc88-4982-8125-7b15ba75d2e8', '19a2bc26-63d1-43ad-ab56-d7f3c3719a34', 11.00, 'deposit', 'Bakiye yükleme - WALLET1760372438696', NULL, '2025-10-13 16:21:01'),
('c3df02e5-ce87-4e50-b7c1-a440de6c62e4', 'd279bb9d-797d-4972-a8bd-a77a40caba91', 11.00, 'deposit', 'Bakiye yükleme - WALLET1760428837250', NULL, '2025-10-14 08:00:56'),
('cb050d5f-c004-41e9-9ca2-ae2845449f13', '0ac37a5c-a8be-4d25-b853-1e5c9574c1b3', 17000.00, 'deposit', 'Admin tarafından eklendi', NULL, '2025-10-10 07:54:04'),
('d30d4b76-d10f-4449-9fe8-d8babd3a8d8d', '0ac37a5c-a8be-4d25-b853-1e5c9574c1b3', 10.00, 'deposit', 'Bakiye yükleme - WALLET1760359954772', NULL, '2025-10-13 12:53:00'),
('d571cf22-edf1-4b28-ad80-f2c0282a7316', '19a2bc26-63d1-43ad-ab56-d7f3c3719a34', 100.00, 'deposit', 'Bakiye yükleme - WALLET1760372184609', NULL, '2025-10-13 16:16:41'),
('e0cb7205-66ab-4fe2-8e27-8e61fbbade0c', '4a8fb7f7-0668-4429-9309-fe88ac90eed2', 5000.00, 'deposit', 'Admin tarafından eklendi', NULL, '2025-10-13 20:51:45'),
('e33e1198-1924-48a6-91d8-94d6b421d2d9', 'd279bb9d-797d-4972-a8bd-a77a40caba91', 5000.00, 'deposit', 'Bakiye yükleme - WALLET1760428735357', NULL, '2025-10-14 07:59:15');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `_prisma_migrations`
--

CREATE TABLE `_prisma_migrations` (
  `id` varchar(36) NOT NULL,
  `checksum` varchar(64) NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) NOT NULL,
  `logs` text DEFAULT NULL,
  `rolled_back_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `applied_steps_count` int(10) UNSIGNED NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Tablo döküm verisi `_prisma_migrations`
--

INSERT INTO `_prisma_migrations` (`id`, `checksum`, `finished_at`, `migration_name`, `logs`, `rolled_back_at`, `started_at`, `applied_steps_count`) VALUES
('c5c4a787-10ae-4b8d-a661-6865ea70796d', 'ea76901bb6c244cbb966bf374fe0406b52f83dd6fd116253c1be8d4e511544f0', '2025-10-19 14:14:47.903', '20251019141447_fix_site_settings_json', NULL, NULL, '2025-10-19 14:14:47.675', 1),
('e0ab30bd-6d78-4c80-8579-af1fe2a23e09', 'f4818521ce854931c1a14dd37e9c3f4ae0a305d9812d61af8e8238648ecfeca6', '2025-10-19 14:11:57.020', '20251019132618_init', NULL, NULL, '2025-10-19 14:11:53.754', 1);

--
-- Dökümü yapılmış tablolar için indeksler
--

--
-- Tablo için indeksler `activation_codes`
--
ALTER TABLE `activation_codes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `activation_codes_code_key` (`code`),
  ADD KEY `activation_codes_product_id_idx` (`product_id`),
  ADD KEY `activation_codes_is_used_idx` (`is_used`),
  ADD KEY `activation_codes_used_by_fkey` (`used_by`);

--
-- Tablo için indeksler `api_providers`
--
ALTER TABLE `api_providers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `api_providers_name_key` (`name`),
  ADD KEY `api_providers_name_idx` (`name`),
  ADD KEY `api_providers_type_idx` (`type`);

--
-- Tablo için indeksler `blog_posts`
--
ALTER TABLE `blog_posts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `blog_posts_slug_key` (`slug`),
  ADD KEY `blog_posts_slug_idx` (`slug`),
  ADD KEY `blog_posts_is_published_idx` (`is_published`);

--
-- Tablo için indeksler `cart_items`
--
ALTER TABLE `cart_items`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `cart_items_user_id_product_id_key` (`user_id`,`product_id`),
  ADD KEY `cart_items_user_id_idx` (`user_id`),
  ADD KEY `cart_items_product_id_idx` (`product_id`);

--
-- Tablo için indeksler `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `categories_slug_key` (`slug`),
  ADD KEY `categories_parent_id_idx` (`parent_id`),
  ADD KEY `categories_slug_idx` (`slug`),
  ADD KEY `categories_is_featured_display_order_idx` (`is_featured`,`display_order`);

--
-- Tablo için indeksler `coupons`
--
ALTER TABLE `coupons`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `coupons_code_key` (`code`),
  ADD KEY `coupons_code_idx` (`code`),
  ADD KEY `coupons_is_active_idx` (`is_active`);

--
-- Tablo için indeksler `custom_pages`
--
ALTER TABLE `custom_pages`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `custom_pages_slug_key` (`slug`),
  ADD KEY `custom_pages_slug_idx` (`slug`),
  ADD KEY `custom_pages_is_published_idx` (`is_published`);

--
-- Tablo için indeksler `email_templates`
--
ALTER TABLE `email_templates`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email_templates_name_key` (`name`),
  ADD KEY `email_templates_name_idx` (`name`);

--
-- Tablo için indeksler `fake_order_notifications`
--
ALTER TABLE `fake_order_notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fake_order_notifications_is_active_idx` (`is_active`);

--
-- Tablo için indeksler `footer_sections`
--
ALTER TABLE `footer_sections`
  ADD PRIMARY KEY (`id`),
  ADD KEY `footer_sections_order_num_idx` (`order_num`);

--
-- Tablo için indeksler `menu_items`
--
ALTER TABLE `menu_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `menu_items_parent_id_idx` (`parent_id`),
  ADD KEY `menu_items_order_num_idx` (`order_num`);

--
-- Tablo için indeksler `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `notifications_user_id_idx` (`user_id`),
  ADD KEY `notifications_is_read_idx` (`is_read`);

--
-- Tablo için indeksler `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `orders_order_number_key` (`order_number`),
  ADD KEY `orders_user_id_idx` (`user_id`),
  ADD KEY `orders_order_number_idx` (`order_number`),
  ADD KEY `orders_status_idx` (`status`),
  ADD KEY `orders_created_at_idx` (`created_at`);

--
-- Tablo için indeksler `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_items_order_id_idx` (`order_id`),
  ADD KEY `order_items_product_id_idx` (`product_id`),
  ADD KEY `order_items_delivery_status_idx` (`delivery_status`),
  ADD KEY `order_items_api_order_id_idx` (`api_order_id`);

--
-- Tablo için indeksler `payment_requests`
--
ALTER TABLE `payment_requests`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `payment_requests_order_id_key` (`order_id`),
  ADD KEY `payment_requests_order_id_idx` (`order_id`),
  ADD KEY `payment_requests_status_idx` (`status`);

--
-- Tablo için indeksler `popups`
--
ALTER TABLE `popups`
  ADD PRIMARY KEY (`id`),
  ADD KEY `popups_is_active_idx` (`is_active`);

--
-- Tablo için indeksler `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `products_slug_key` (`slug`),
  ADD KEY `products_category_id_idx` (`category_id`),
  ADD KEY `products_slug_idx` (`slug`),
  ADD KEY `products_is_active_idx` (`is_active`),
  ADD KEY `products_is_featured_idx` (`is_featured`);

--
-- Tablo için indeksler `product_faqs`
--
ALTER TABLE `product_faqs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `product_faqs_product_id_idx` (`product_id`);

--
-- Tablo için indeksler `product_options`
--
ALTER TABLE `product_options`
  ADD PRIMARY KEY (`id`),
  ADD KEY `product_options_product_id_idx` (`product_id`);

--
-- Tablo için indeksler `product_reviews`
--
ALTER TABLE `product_reviews`
  ADD PRIMARY KEY (`id`),
  ADD KEY `product_reviews_product_id_idx` (`product_id`),
  ADD KEY `product_reviews_user_id_idx` (`user_id`),
  ADD KEY `product_reviews_is_approved_idx` (`is_approved`);

--
-- Tablo için indeksler `product_stock`
--
ALTER TABLE `product_stock`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `product_stock_code_key` (`code`),
  ADD KEY `product_stock_product_id_idx` (`product_id`),
  ADD KEY `product_stock_is_used_idx` (`is_used`);

--
-- Tablo için indeksler `site_settings`
--
ALTER TABLE `site_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `site_settings_key_key` (`key`),
  ADD KEY `site_settings_key_idx` (`key`);

--
-- Tablo için indeksler `support_tickets`
--
ALTER TABLE `support_tickets`
  ADD PRIMARY KEY (`id`),
  ADD KEY `support_tickets_user_id_idx` (`user_id`),
  ADD KEY `support_tickets_status_idx` (`status`),
  ADD KEY `support_tickets_priority_idx` (`priority`);

--
-- Tablo için indeksler `system_version`
--
ALTER TABLE `system_version`
  ADD PRIMARY KEY (`id`);

--
-- Tablo için indeksler `ticket_replies`
--
ALTER TABLE `ticket_replies`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ticket_replies_ticket_id_idx` (`ticket_id`);

--
-- Tablo için indeksler `topbar_settings`
--
ALTER TABLE `topbar_settings`
  ADD PRIMARY KEY (`id`);

--
-- Tablo için indeksler `update_history`
--
ALTER TABLE `update_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `update_history_version_idx` (`version`);

--
-- Tablo için indeksler `update_snapshots`
--
ALTER TABLE `update_snapshots`
  ADD PRIMARY KEY (`id`);

--
-- Tablo için indeksler `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_email_key` (`email`);

--
-- Tablo için indeksler `user_roles`
--
ALTER TABLE `user_roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_roles_user_id_role_key` (`user_id`,`role`),
  ADD KEY `user_roles_user_id_idx` (`user_id`);

--
-- Tablo için indeksler `wallet_deposit_requests`
--
ALTER TABLE `wallet_deposit_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `wallet_deposit_requests_user_id_idx` (`user_id`),
  ADD KEY `wallet_deposit_requests_status_idx` (`status`);

--
-- Tablo için indeksler `wallet_transactions`
--
ALTER TABLE `wallet_transactions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `wallet_transactions_order_id_key` (`order_id`),
  ADD KEY `wallet_transactions_user_id_idx` (`user_id`),
  ADD KEY `wallet_transactions_type_idx` (`type`),
  ADD KEY `wallet_transactions_created_at_idx` (`created_at`);

--
-- Tablo için indeksler `_prisma_migrations`
--
ALTER TABLE `_prisma_migrations`
  ADD PRIMARY KEY (`id`);

--
-- Dökümü yapılmış tablolar için kısıtlamalar
--

--
-- Tablo kısıtlamaları `activation_codes`
--
ALTER TABLE `activation_codes`
  ADD CONSTRAINT `activation_codes_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `activation_codes_used_by_fkey` FOREIGN KEY (`used_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Tablo kısıtlamaları `cart_items`
--
ALTER TABLE `cart_items`
  ADD CONSTRAINT `cart_items_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `cart_items_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Tablo kısıtlamaları `categories`
--
ALTER TABLE `categories`
  ADD CONSTRAINT `categories_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Tablo kısıtlamaları `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Tablo kısıtlamaları `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `orders_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Tablo kısıtlamaları `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `order_items_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `order_items_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Tablo kısıtlamaları `payment_requests`
--
ALTER TABLE `payment_requests`
  ADD CONSTRAINT `payment_requests_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Tablo kısıtlamaları `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `products_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Tablo kısıtlamaları `product_faqs`
--
ALTER TABLE `product_faqs`
  ADD CONSTRAINT `product_faqs_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Tablo kısıtlamaları `product_options`
--
ALTER TABLE `product_options`
  ADD CONSTRAINT `product_options_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Tablo kısıtlamaları `product_reviews`
--
ALTER TABLE `product_reviews`
  ADD CONSTRAINT `product_reviews_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `product_reviews_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Tablo kısıtlamaları `product_stock`
--
ALTER TABLE `product_stock`
  ADD CONSTRAINT `product_stock_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Tablo kısıtlamaları `support_tickets`
--
ALTER TABLE `support_tickets`
  ADD CONSTRAINT `support_tickets_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Tablo kısıtlamaları `ticket_replies`
--
ALTER TABLE `ticket_replies`
  ADD CONSTRAINT `ticket_replies_ticket_id_fkey` FOREIGN KEY (`ticket_id`) REFERENCES `support_tickets` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Tablo kısıtlamaları `user_roles`
--
ALTER TABLE `user_roles`
  ADD CONSTRAINT `user_roles_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Tablo kısıtlamaları `wallet_deposit_requests`
--
ALTER TABLE `wallet_deposit_requests`
  ADD CONSTRAINT `wallet_deposit_requests_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Tablo kısıtlamaları `wallet_transactions`
--
ALTER TABLE `wallet_transactions`
  ADD CONSTRAINT `wallet_transactions_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `wallet_transactions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
