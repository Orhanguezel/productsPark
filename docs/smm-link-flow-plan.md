# SMM Link Akışı — Yapılanlar ve Kullanım Kılavuzu

**Tarih:** 2026-03-19

---

## Sorun Neydi?

Daha önce bir ürüne SMM (sosyal medya pazarlama) servisi tanımlamak için
admin'in **iki ayrı sekmeye** gidip iki ayrı işlem yapması gerekiyordu:

1. **Teslimat sekmesi** → `delivery_type = API`, sağlayıcı ve servis ID seç
2. **Özelleştirme sekmesi** → ayrıca manuel olarak `type = URL` custom field ekle

İkinci adım unutulduğunda müşteri ürün sayfasında hiç input görmüyor,
link olmadan sipariş oluşuyor ve teslimat `failed` yazıyordu.

---

## Ne Yapıldı?

### Özet

Ürün ve kategoriye **"SMM Ürünü / SMM Kategorisi"** anahtarı eklendi.
Bu anahtar açıkken müşteriden sosyal medya profil linki **otomatik** isteniyor;
admin'in ayrıca custom field tanımlamasına gerek kalmıyor.

---

### 1. Veritabanı

Hem `products` hem `categories` tablosuna yeni bir kolon eklendi:

```sql
is_smm  TINYINT(1)  NOT NULL DEFAULT 0
```

- `0` → Normal ürün/kategori (eski davranış korunur)
- `1` → SMM ürünü/kategorisi (otomatik link input çıkar)

**Yeni kurulum:** Base seed dosyaları güncellendi, tablo oluşturulurken
kolon zaten dahil gelir.

**Canlı veritabanı için:** `182_smm_is_smm_columns.sql` seed dosyasını çalıştırmak yeterli.
`ADD COLUMN IF NOT EXISTS` kullanıldığı için tekrar çalıştırmak güvenlidir, hata vermez.

---

### 2. Admin Paneli — Ürün Formu

**Teslimat Ayarları** sekmesinde, `delivery_type = API` seçildiğinde
artık altta bir switch gösteriliyor:

```
┌─────────────────────────────────────────────────────┐
│  SMM Ürünü                              [ ● Açık ]  │
│  Açıksa müşteriden sosyal medya profil linki        │
│  otomatik istenir.                                  │
└─────────────────────────────────────────────────────┘
```

Bu switch açıkken admin'in Özelleştirme sekmesine gidip ayrıca
URL alanı eklemesine gerek yok.

---

### 3. Admin Paneli — Kategori Formu

Kategori düzenleme sayfasında yeni bir switch eklendi:

```
┌─────────────────────────────────────────────────────┐
│  SMM Kategorisi                         [ ● Açık ]  │
│  Bu kategorideki tüm API ürünlerinde müşteriden     │
│  sosyal medya profil linki otomatik istenir.        │
└─────────────────────────────────────────────────────┘
```

Kategoriyi SMM olarak işaretleyince o kategorideki her ürün
için tek tek switch açmak yerine toplu çalışır.

---

### 4. Müşteri Sayfası (Ürün Detay)

`is_smm = true` olan bir ürün sayfasına girildiğinde
**custom field tanımı olmasa bile** otomatik olarak şu input çıkar:

```
┌─────────────────────────────────────────┐
│  Sosyal Medya Profil Linki *            │
│  ┌─────────────────────────────────┐    │
│  │ https://instagram.com/...       │    │
│  └─────────────────────────────────┘    │
│  Hizmetin uygulanacağı profilin         │
│  tam linkini girin.                     │
└─────────────────────────────────────────┘
```

- Alan **zorunlu**, boş geçilemez
- Geçerli bir URL formatı (`https://...`) kontrol edilir
- Hatalı girilirse sepete eklenemez, uyarı verilir

---

### 5. Sipariş ve Teslimat Akışı

Müşteri linki girdikten sonra:

```
Müşteri → "https://instagram.com/hesap_adi" girer
         ↓
Sepete eklenir → options: { smm_link: "https://..." }
         ↓
Ödeme tamamlanır → sipariş oluşur
         ↓
Backend fulfillment devreye girer:
  1. smm_link key'ini options'dan okur (öncelikli)
  2. smmPlaceOrder(apiUrl, apiKey, serviceId, link, quantity)
  3. SMM panel API'ye gönderir → order ID döner
  4. Teslimat durumu "processing" olur
```

---

## Kullanım — Adım Adım

### Yeni SMM ürünü nasıl tanımlanır?

1. Admin panel → Ürünler → Yeni Ürün (veya mevcut ürünü düzenle)
2. **Teslimat Ayarları** sekmesi
3. Teslimat Tipi: **API Entegrasyonu** seç
4. API Sağlayıcı seç (örn: smmget.com)
5. Service ID gir (SMM paneldeki servis numarası)
6. **SMM Ürünü** switch'ini **açık** konuma getir
7. Kaydet

Bu kadar. Müşteri ürün sayfasına girdiğinde link alanını görecek.

---

## Veritabanı Güncelleme (Canlı Sunucu)

Canlı veritabanında bu kolon henüz yok. Seed dosyasını çalıştırmak gerekiyor:

```
backend/src/db/seed/sql/182_smm_is_smm_columns.sql
```

Bu dosya `ADD COLUMN IF NOT EXISTS` kullandığı için:
- Kolon yoksa → ekler
- Kolon zaten varsa → sessizce geçer, hata vermez

---

## Test Durumu

Bu değişiklikler **henüz canlı ortamda test edilmedi.**
Yerel ortamda test için yapılması gerekenler:

- [ ] `182_smm_is_smm_columns.sql` çalıştır (veya DB'yi seed'le)
- [ ] Admin panelde bir ürün aç → Teslimat = API → SMM switch'i aç → kaydet
- [ ] Ürün sayfasına git → link input göründüğünü doğrula
- [ ] Linksiz sepete eklemeyi dene → hata mesajı çıkmalı
- [ ] Geçerli link gir → sepete ekle → sipariş oluştur
- [ ] Backend log'unda `smm_order_placed` satırını kontrol et
- [ ] Kategori formunda `is_smm` toggle açık olan kategorideki ürünü test et

---

## Değiştirilen Dosyalar

| Dosya | Değişiklik |
|---|---|
| `182_smm_is_smm_columns.sql` | Canlı DB için ALTER migration |
| `48_product_schema.sql` | is_smm CREATE TABLE'a eklendi |
| `20_catalog_schema.sql` | is_smm CREATE TABLE'a eklendi |
| `products/schema.ts` | Drizzle schema |
| `categories/schema.ts` | Drizzle schema |
| `products/validation.ts` | Zod schema |
| `categories/validation.ts` | Zod schema |
| `products/controller.ts` | Public mapper |
| `products/admin.controller.ts` | Admin mapper |
| `categories/controller.ts` | buildInsertPayload + buildUpdatePayload |
| `smm.service.ts` | extractLinkFromOptions: smm_link öncelikli |
| `types/products.ts` | ProductAdmin, Product, CommonProductPayload tipleri |
| `types/categories.ts` | Category, UpsertCategoryBody tipleri |
| `DeliverySection.tsx` | Admin: SMM Ürünü toggle |
| `ProductForm.tsx` | Admin: is_smm payload'a eklendi |
| `CategoryForm.tsx` | Admin: SMM Kategorisi toggle |
| `ProductInfoSection.tsx` | Müşteri: otomatik smm_link input |
| `ProductDetail.tsx` | Müşteri: validasyon + payload düzeltmesi |
