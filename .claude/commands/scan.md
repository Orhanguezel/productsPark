Kod tabanında proje prensiplerine aykırı durumları tara: $ARGUMENTS

## Tarama Kategorileri

### 1. Hard-coded Değer Taraması 🔍

Tüm kaynak dosyalarında şunları ara:
- Hard-coded URL'ler, port numaraları, IP adresleri
- Magic number'lar (fonksiyon parametresi veya config olmayan sayılar)
- Hard-coded timeout/interval süreleri
- Hard-coded dosya boyutu limitleri
- Environment variable yerine hard-coded değerler

**Hariç tut:** Test dosyaları, tip tanımları, enum değerleri, Tailwind class'ları

### 2. Kod Tekrarı Taraması 🔄

- 5+ satırlık aynı veya çok benzer kod blokları
- Aynı mantığı farklı yerlerde tekrarlayan fonksiyonlar
- Copy-paste belirtileri (benzer isimlendirme pattern'leri)
- Benzer RTK Query endpoint'leri birleştirilebilir mi?
- Controller'larda tekrarlanan error handling

### 3. TypeScript Kalite Taraması 📝

- `any` tipi kullanımları
- `as` type assertion'ları (type guard tercih et)
- `// @ts-ignore` veya `// @ts-expect-error`
- Eksik return tipi
- Kullanılmayan import'lar ve değişkenler
- `interface` vs `type` tutarsızlığı

### 4. Mimari İhlal Taraması 🏗️

ProductsPark'ın katmanlı mimarisi:
```
Frontend: pages/ → components/ → integrations/rtk/
Backend:  router.ts → controller.ts → schema.ts
```

Kontrol et:
- Controller'da doğrudan ORM query mi var? (schema import edilmeli)
- Circular dependency (dairesel bağımlılık)
- God file (500+ satır dosyalar)
- God function (50+ satır fonksiyonlar)
- Frontend'de doğrudan fetch yerine RTK Query kullanılıyor mu?

### 5. Güvenlik Taraması 🔒

- Console.log ile hassas veri loglama
- Hardcoded credentials, API key, secret
- SQL injection riski (raw query kullanımı)
- XSS açığı (`dangerouslySetInnerHTML`)
- Eksik input validation (Zod schema yok)
- Auth middleware eksik admin endpoint

### 6. RTK Query Tutarlılık Taraması 📡

- Endpoint isimlendirme tutarlı mı? (`useList*Query`, `useGet*ByIdQuery`)
- Tag'ler doğru provide/invalidate ediliyor mu?
- Error handling tutarlı mı?
- `skip` kullanılması gereken yerler var mı?

### 7. Drizzle ORM Taraması 🗄️

- N+1 query problemi (for loop içinde query)
- Transaction kullanılması gereken yerler
- Index eksik sık sorgulanan kolonlar
- Foreign key tanımı eksik

## Çıktı Formatı

Her bulgu için tablo oluştur:

| # | Kategori | Seviye | Dosya:Satır | Bulgu | Önerilen Düzeltme |
|---|----------|--------|-------------|-------|-------------------|
| 1 | Hard-coded | 🔴 | controller.ts:42 | `limit: 100` | site_settings'den al |
| 2 | DRY | 🟡 | admin/*.ts | Aynı toast pattern | Ortak helper |
| 3 | Security | 🔴 | auth.ts:15 | Token log | Log'u kaldır |

**Seviyeler:**
- 🔴 Kritik: Güvenlik/hata riski
- 🟡 Önemli: Kod kalitesi etkisi
- 🟢 Öneri: İyileştirme fırsatı

Sonunda özet:
- Toplam bulgu sayısı (kategorilere göre)
- Öncelikli düzeltme sırası önerisi
- Tahmini efor (kolay/orta/zor)
