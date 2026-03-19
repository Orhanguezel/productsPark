# SMM Link Flow — Uygulama Planı

**Tarih:** 2026-03-19
**Konu:** SMM ürünlerinde müşteriden link alma akışının düzeltilmesi

---

## Mevcut Sorun

`delivery_type='api'` ürünlerde müşteriden link (sosyal medya profil URL'i) alabilmek için
admin'in **iki ayrı sekmeye** gidip iki ayrı şeyi doğru yapması gerekiyor:

1. Teslimat sekmesi → `delivery_type='api'`, provider, service ID
2. Özelleştirme sekmesi → `type='url'` olan bir custom field ekleme ← **Sıklıkla unutuluyor**

Eğer 2. adım atlanırsa: Müşteri input görmez → sipariş linksiz oluşur →
backend `api_delivery_failed` yazar → sipariş başarısız.

---

## Hedef Mimari

```
Ürün: is_smm = true
  │
  ├── Ürün sayfasında tek bir "Sosyal Medya Linki" input otomatik çıkar
  │     key: smm_link
  │
  └── Sipariş oluşunca backend smm_link'i options'dan öncelikli okur
        → smmPlaceOrder(apiUrl, apiKey, serviceId, link, quantity)
```

Kategori bazında:
```
Kategori: is_smm = true
  └── Bu kategorideki tüm ürünler otomatik SMM link davranışı alır
        (ürün bazında override mümkün)
```

---

## Uygulama Adımları

### BLOK 1 — Veritabanı & Schema

- [ ] **1.1** Migration: `products` tablosuna `is_smm TINYINT(1) DEFAULT 0` ekle
- [ ] **1.2** Migration: `categories` tablosuna `is_smm TINYINT(1) DEFAULT 0` ekle
- [ ] **1.3** Drizzle schema — `products/schema.ts` güncelle (`is_smm` alanı)
- [ ] **1.4** Drizzle schema — `categories/schema.ts` güncelle (`is_smm` alanı)

### BLOK 2 — Backend Validation & Servis

- [ ] **2.1** `products/validation.ts` — `is_smm` alanı ekle (z.boolean / z.coerce)
- [ ] **2.2** `categories/validation.ts` — `is_smm` alanı ekle
- [ ] **2.3** `smm.service.ts` — `extractLinkFromOptions`'da `smm_link` key'ini
      öncelikli ara (type='url' öncesine ekle)
- [ ] **2.4** `products` public/admin response mapper'larına `is_smm` ekle
- [ ] **2.5** `categories` response mapper'larına `is_smm` ekle

### BLOK 3 — Admin UI

- [ ] **3.1** `DeliverySection.tsx` — `delivery_type='api'` seçilince
      **"SMM Ürünü"** toggle göster (`is_smm`)
- [ ] **3.2** `ProductForm.tsx` — `is_smm` field'ını `formData`'ya ekle,
      `buildCommonPayload`'a dahil et
- [ ] **3.3** Kategori admin formu / `CategoryForm` — `is_smm` toggle ekle

### BLOK 4 — Frontend (Müşteri Tarafı)

- [ ] **4.1** `ProductInfoSection.tsx` — ürün `is_smm=true` VEYA kategorisi
      `is_smm=true` ise custom_fields'den bağımsız olarak tek bir
      `<Input type="url" />` otomatik render et
      - Key: `smm_link`
      - Label: "Sosyal Medya Profil Linki"
      - Placeholder: "https://instagram.com/kullanici_adi"
      - Required: true
      - URL format validasyonu
- [ ] **4.2** `ProductDetail.tsx` — `smm_link` validasyonunu
      `validateCustomFields` akışına entegre et (handleQuickBuy + handleAddToCart)

### BLOK 5 — Tip Tanımları

- [ ] **5.1** `integrations/types.ts` veya `types/` — `ProductAdmin`, `ProductPublic`
      tiplerine `is_smm?: boolean | 0 | 1` ekle
- [ ] **5.2** `CategoryRow` tipine `is_smm` ekle

---

## Veri Akışı (Sonuç)

```
Admin:
  Teslimat Sekmesi → delivery_type='api' → provider + service_id + is_smm toggle (ON)

Müşteri:
  Ürün sayfası → is_smm=true → "Sosyal Medya Profil Linki" input (tek alan)
              → Değer sepete smm_link key'iyle eklenir

Sipariş:
  order_items.options = { smm_link: "https://instagram.com/..." }

Backend fulfillment:
  extractLinkFromOptions → smm_link key'i öncelikli → link bulundu
  smmPlaceOrder(apiUrl, apiKey, serviceId, link, quantity)
```

---

## Öncelik

| Blok | Öncelik | Açıklama |
|------|---------|----------|
| Blok 1 (Migration) | Kritik | Önce yapılmalı |
| Blok 2 (Backend) | Kritik | Migration sonrası |
| Blok 3 (Admin UI) | Yüksek | Admin konfigürasyonu |
| Blok 4 (Müşteri UI) | Yüksek | Müşteri deneyimi |
| Blok 5 (Tipler) | Orta | Blok 3-4 ile paralel |
