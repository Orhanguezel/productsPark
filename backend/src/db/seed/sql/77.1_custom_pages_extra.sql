-- =============================================================
-- EK SAYFALAR: SSS + Nasıl Sipariş Verilir?
-- 77_custom_pages_seed.sql dosyasına ek
-- =============================================================
SET NAMES utf8mb4;
SET time_zone = '+00:00';

INSERT INTO `custom_pages`
(`id`, `title`, `slug`, `content`,
 `featured_image`, `featured_image_asset_id`, `featured_image_alt`,
 `meta_title`, `meta_description`, `is_published`, `created_at`, `updated_at`)
VALUES

-- ---------------------------------------------------------------
-- SSS (Sıkça Sorulan Sorular)
-- ---------------------------------------------------------------
('aa11bb22-cc33-4444-5555-666677778888', 'Sıkça Sorulan Sorular', 'sss',
 JSON_OBJECT('html', '<div class="container mx-auto px-4 py-12"><h1 class="text-4xl font-bold mb-8">Sıkça Sorulan Sorular</h1><div class="prose max-w-none space-y-8">

<div class="border rounded-xl p-6"><h2 class="text-xl font-bold mb-3">Dijital ürünler nasıl teslim edilir?</h2><p class="text-muted-foreground">Satın aldığınız dijital ürünler (lisans anahtarları, hesap bilgileri, oyun kodları vb.) ödeme onayının ardından anında hesabınıza tanımlanır. Siparişlerinizi <strong>Hesabım &gt; Siparişlerim</strong> bölümünden takip edebilir ve teslim edilen ürünlere erişebilirsiniz.</p></div>

<div class="border rounded-xl p-6"><h2 class="text-xl font-bold mb-3">Ödeme yaptım ama ürünü alamadım. Ne yapmalıyım?</h2><p class="text-muted-foreground">Ödeme başarıyla tamamlandıysa sistem otomatik olarak siparişinizi işleme alır. Eğer birkaç dakika içinde siparişiniz oluşmadıysa:</p><ul class="list-disc pl-6 mt-2 space-y-1 text-muted-foreground"><li>Hesabım &gt; Siparişlerim bölümünü kontrol edin</li><li>Spam/Gereksiz e-posta klasörünüzü kontrol edin</li><li>Destek ekibimizle iletişime geçin ve ödeme dekontunuzu paylaşın</li></ul></div>

<div class="border rounded-xl p-6"><h2 class="text-xl font-bold mb-3">Kupon kodunu nasıl kullanabilirim?</h2><p class="text-muted-foreground">Ödeme sayfasında <strong>"Kupon Kodu"</strong> alanına kodunuzu girin ve <strong>"Uygula"</strong> butonuna tıklayın. İndirim tutarı otomatik olarak sepet toplamınıza yansıtılacaktır. Her kuponun minimum sepet tutarı ve kullanım koşulları farklı olabilir.</p></div>

<div class="border rounded-xl p-6"><h2 class="text-xl font-bold mb-3">Satın aldığım ürünü iade edebilir miyim?</h2><p class="text-muted-foreground">Dijital ürünlerin niteliği gereği, teslimattan sonra cayma hakkı uygulanmamaktadır. Ancak aşağıdaki durumlarda iade veya değişim talep edebilirsiniz:</p><ul class="list-disc pl-6 mt-2 space-y-1 text-muted-foreground"><li>Teslim edilen ürün kodunun çalışmaması</li><li>Yanlış ürün teslimatı</li><li>Platformdan kaynaklanan teknik hata</li></ul><p class="text-muted-foreground mt-2">Bu durumlarda satın alma tarihinden itibaren 7 gün içinde destek ekibimize başvurun.</p></div>

<div class="border rounded-xl p-6"><h2 class="text-xl font-bold mb-3">Hesap bakiyemi nasıl yükleyebilirim?</h2><p class="text-muted-foreground">Hesabım panelindeki <strong>"Bakiye Yükle"</strong> bölümünden kredi kartı, havale/EFT veya diğer ödeme yöntemleriyle bakiye yükleyebilirsiniz. Yüklenen bakiyeyi tüm ürünlerin satın alımında kullanabilirsiniz.</p></div>

<div class="border rounded-xl p-6"><h2 class="text-xl font-bold mb-3">Ürünleri hangi cihazda kullanabilirim?</h2><p class="text-muted-foreground">Ürün uyumluluğu, ilgili ürünün açıklama sayfasında belirtilmektedir. Lisans anahtarları genellikle platform tarafından belirlenen cihaz sayısıyla sınırlıdır. Satın almadan önce ürün açıklamasını dikkatle incelemenizi öneririz.</p></div>

<div class="border rounded-xl p-6"><h2 class="text-xl font-bold mb-3">Güvenli alışveriş yapabilir miyim?</h2><p class="text-muted-foreground">Evet. Tüm ödeme işlemleri 256-bit SSL şifreleme ile korunmaktadır. Kart bilgileriniz sunucularımızda saklanmaz; PCI DSS uyumlu güvenli ödeme altyapısı kullanılmaktadır. Kişisel verileriniz KVKK kapsamında korunmaktadır.</p></div>

<div class="border rounded-xl p-6"><h2 class="text-xl font-bold mb-3">Destek ekibine nasıl ulaşabilirim?</h2><p class="text-muted-foreground"><a href="/destek" class="text-primary hover:underline">Destek</a> sayfamız üzerinden veya <a href="/iletisim" class="text-primary hover:underline">İletişim</a> formumuzu kullanarak bize ulaşabilirsiniz. Müşteri hizmetlerimiz hafta içi ve hafta sonu destek sağlamaktadır.</p></div>

</div></div>'),
 NULL, NULL, NULL,
 'Sıkça Sorulan Sorular', 'Dijital ürün satın alma, teslimat, iade ve ödeme hakkında sıkça sorulan sorular.',
 1, NOW(3), NOW(3)),

-- ---------------------------------------------------------------
-- Nasıl Sipariş Verilir?
-- ---------------------------------------------------------------
('bb22cc33-dd44-5555-6666-777788889999', 'Nasıl Sipariş Verilir?', 'nasil-siparis-verilir',
 JSON_OBJECT('html', '<div class="container mx-auto px-4 py-12"><h1 class="text-4xl font-bold mb-8">Nasıl Sipariş Verilir?</h1><p class="text-muted-foreground mb-10 text-lg">Dijital ürün satın almak sadece birkaç adım! Aşağıdaki adımları takip ederek dakikalar içinde ürününüze ulaşabilirsiniz.</p>

<div class="space-y-6">

<div class="flex gap-5 items-start border rounded-xl p-6"><div class="flex-shrink-0 w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">1</div><div><h2 class="text-xl font-bold mb-2">Ürünü Seçin</h2><p class="text-muted-foreground">Ana sayfadan veya <a href="/urunler" class="text-primary hover:underline">Ürünler</a> sayfasından istediğiniz kategoriyi seçin. Ürün açıklamasını, fiyatını ve özelliklerini inceleyin.</p></div></div>

<div class="flex gap-5 items-start border rounded-xl p-6"><div class="flex-shrink-0 w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">2</div><div><h2 class="text-xl font-bold mb-2">Sepete Ekleyin</h2><p class="text-muted-foreground">Beğendiğiniz ürünü <strong>"Sepete Ekle"</strong> butonuna tıklayarak sepetinize ekleyin. Birden fazla ürün alabilirsiniz. Sepetinize gitmek için sağ üstteki sepet ikonuna tıklayın.</p></div></div>

<div class="flex gap-5 items-start border rounded-xl p-6"><div class="flex-shrink-0 w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">3</div><div><h2 class="text-xl font-bold mb-2">Hesabınıza Giriş Yapın</h2><p class="text-muted-foreground">Ödeme işlemine geçmeden önce hesabınıza giriş yapmanız gerekmektedir. Hesabınız yoksa ücretsiz olarak kayıt olabilirsiniz. <a href="/giris" class="text-primary hover:underline">Giriş Yap / Üye Ol</a></p></div></div>

<div class="flex gap-5 items-start border rounded-xl p-6"><div class="flex-shrink-0 w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">4</div><div><h2 class="text-xl font-bold mb-2">Kupon Kodunuzu Girin (Varsa)</h2><p class="text-muted-foreground">Aktif bir kupon kodunuz varsa ödeme sayfasında <strong>"Kupon Kodu"</strong> alanına girin ve <strong>"Uygula"</strong> butonuna tıklayın. İndirim otomatik uygulanır. <a href="/kampanyalar" class="text-primary hover:underline">Kampanyalar sayfasını</a> ziyaret ederek aktif kuponları görebilirsiniz.</p></div></div>

<div class="flex gap-5 items-start border rounded-xl p-6"><div class="flex-shrink-0 w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">5</div><div><h2 class="text-xl font-bold mb-2">Ödeme Yapın</h2><p class="text-muted-foreground">Kredi kartı, banka kartı, havale/EFT veya hesap bakiyenizle güvenli ödeme yapın. Tüm ödemeler 256-bit SSL şifreleme ile korunmaktadır.</p></div></div>

<div class="flex gap-5 items-start border rounded-xl p-6 bg-primary/5 border-primary/30"><div class="flex-shrink-0 w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">6</div><div><h2 class="text-xl font-bold mb-2">Ürününüzü Alın! 🎉</h2><p class="text-muted-foreground">Ödeme onaylandıktan sonra ürününüz anında hesabınıza tanımlanır. <strong>Hesabım &gt; Siparişlerim</strong> bölümünden teslim edilen ürüne erişebilirsiniz. Ayrıca kayıtlı e-posta adresinize bilgilendirme e-postası gönderilir.</p></div></div>

</div>

<div class="mt-12 p-6 border rounded-xl bg-muted/50"><h3 class="text-lg font-bold mb-2">Yardıma mı ihtiyacınız var?</h3><p class="text-muted-foreground">Sipariş sürecinde herhangi bir sorunla karşılaşırsanız <a href="/destek" class="text-primary hover:underline">Destek</a> sayfamızdan veya <a href="/iletisim" class="text-primary hover:underline">İletişim</a> formumuzu kullanarak bize ulaşabilirsiniz.</p></div>

</div>'),
 NULL, NULL, NULL,
 'Nasıl Sipariş Verilir?', 'Dijital ürün satın alma adımları: ürün seç, sepete ekle, ödeme yap, anında teslim al.',
 1, NOW(3), NOW(3))

ON DUPLICATE KEY UPDATE
  `title`          = VALUES(`title`),
  `content`        = VALUES(`content`),
  `meta_title`     = VALUES(`meta_title`),
  `meta_description` = VALUES(`meta_description`),
  `is_published`   = VALUES(`is_published`),
  `updated_at`     = VALUES(`updated_at`);
