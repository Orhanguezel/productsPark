# Genel Mimari

- **Runtime / Çerçeve:** Fastify 5 + `@fastify/jwt`, Drizzle ORM (`mysql2`) ile **MariaDB**. (Express artıkları var: `src/core/error.ts` — Fastify ile uyumsuz.)
- **Modüller:** `auth`, `profiles`, `categories`, `products` (faqs/options/reviews/stock), `cart`, `orders`, `coupons`, `rest` (PostgREST‑lite), `storage` (Cloudinary), `functions` (Shopier/PayTR stub), `blog`, `custom-pages`, `popups`, `topbarSettings`, `email-templates`, `userRoles`, `wallet`.
- **Giriş Noktası:** `src/index.ts` → `createApp()` (`src/app.ts`). CORS + JWT + modül router’ları kaydediliyor. Özel `setErrorHandler` mevcut fakat Express tipi `core/error.ts` dosyası kullanılmıyor (temizlenmeli).
- **DB Client:** `src/db/client.ts` — `mysql2` pool + `drizzle-orm/mysql2`. `src/db/schema.ts` modül şemalarını re-export ediyor.
- **REST Katmanı:** `/rest/v1/:table` üzerinden genel GET/POST/PATCH/DELETE; `Content-Range` ve basit filtre/sıralama/paginasyon yardımcıları mevcut.

---

# Modül Bazlı Durum (router kapsamı)

| Modül | Uç sayısı | Not |
|---|---:|---|
| auth | 6 | Signup/Token/Me/Update/Logout + basit admin get
| profiles | 1 | `/profiles/me` GET+PUT (controller’da snake_case dönüşüm mevcut)
| categories | 5 | CRUD; dosyada `...` yerleri var → tamamlanmalı
| products | 21 | Product + FAQs + Options + Reviews + Stock uçları; controller’da `...` yerleri var → tamamlanmalı
| cart | 5 | Sepet CRUD; controller’da `...` yerleri var → tamamlanmalı
| orders | 6 | Orders CRUD + `/orders/checkout`; controller’da `...` yerleri var → stok/sipariş akışı netleştirilmeli
| coupons | 8 | Router var, controller’da `...` → doğrulama/uygulama kuralları eksik
| rest | 8 | PostgREST-like; tablo haritası mevcut; RLS/owner filtreleri gözden geçirilmeli
| storage | 2 | Cloudinary upload + public serve; env gereksinimleri net
| functions | 10 | PayTR, Shopier, e‑posta/Telegram, SMM, Turkpin stub’ları
| blog | 12 | Post + revisions; controller’da `...`
| custom-pages | 11 | Router OK; controller’da `...`
| email-templates | 8 | Router OK; controller’da `...`
| popups/topbarSettings/userRoles/wallet |  — | Şema/Router var; iş mantığı hafif

> **Not:** Kodda **14 dosyada** `...` placeholder var (eksik implementasyon):
> `db/seed.ts`, `modules/{blog,custom-pages,coupons,email-templates,rest,categories,products,orders,cart,profiles}/*`, `common/utils/queryParser.ts`.

---

# Güvenlik & Kimlik

- **JWT:** `@fastify/jwt` ile `requireAuth` var. `me` ve admin uçları basit; rol tablosu (`userRoles`) mevcut ama yetkilendirme hook’u **uygulanmamış**.
- **RLS:** `rest.controller.ts` içinde tablo bazlı RLS uygulanıyor gibi; ayrıca `common/middleware/rls.ts` boş. Kullanıcıya ait tablolarda (`profiles`, `cart_items`, `orders`) **user_id = req.user.sub** şartı zorunlu kılınmalı.
- **CORS:** `CORS_ORIGIN` env var; production’da **allowlist** önerilir.
- **Rate Limit / Brute Force:** Henüz yok → `@fastify/rate-limit` ve auth uçları için koruma eklenmeli.

---

# Veri Modeli Gözlemleri

- **Ürünler:** `products` + `product_faqs` + `product_options` + `product_reviews` + `product_stock` (kod/seri numarası). İyi ayrıştırılmış.
- **Stok:** `product_stock.is_used`, `used_at`, `order_item_id` alanları var → **seri-numara/kupon** tipi ürünler için uygun. Sipariş sırasında atomik rezervasyon gerekiyor.
- **Sipariş:** `orders` + `order_items`; `orders.status` akışı ve toplam/havale/komisyon alanları netleştirilmeli.
- **Kupon:** Var; ama doğrulama ve uygulama kuralları (minimum sepet, tarih aralığı, kullanım limiti, müşteri bazlı limit) eksik gibi.
- **Blog/Pages:** Revisions yapısı var (blog), sayfa slug/versiyonlama mantığı tutarlı görünmeli.

**Önerilen İndeksler** (MariaDB):
- `products.slug` (UNIQUE), `products.category_id` (INDEX)
- `product_options.product_id`, `product_faqs.product_id`, `product_reviews.product_id`
- `product_stock.product_id`, `product_stock.code` (UNIQUE)
- `cart_items.user_id`, `orders.user_id`, `order_items.order_id`
- `coupons.code` (UNIQUE), `blog_posts.slug` (UNIQUE)

---

# Hatalar & Tutarsızlıklar

- **Express artıkları:** `src/core/error.ts` Express middleware; Fastify ile uyuşmuyor. Kaldır/uyarla.
- **Docker Compose formatı:** Girintiler ve `api` servisi yolları (ör: `build: ./api`) muhtemelen placeholder. Tek servisli basit bir compose önerisi eklenmeli.
- **Seed:** `src/db/seed.ts` eksik. Geliştirme konforu için en azından kategoriler + birkaç ürün + kullanıcı seed.
- **Env:** `env.ts` içinde Cloudinary/PayTR değişkenleri var; `.env.example` yok. Eklenmeli.
- **Birim testleri:** Yok. Kritik akışlar (checkout, kupon uygulama, RLS) için minimal testler önerilir.

---

# REST (PostgREST‑lite) Katmanı — Kontrol Listesi

- [ ] `TABLES` haritası tam ve hatasız mı? (Tüm şemalar import ediliyor mu?)
- [ ] `parseFilters` operatörleri (eq, gt, gte, lt, lte, like, in) tamam mı? (`common/utils/queryParser.ts` içinde `...` var.)
- [ ] `applyRlsWhere` kullanıcıya ait tablolarda zorunlu mu? (örn. `user_id` sütunlu tablolar)
- [ ] `Content-Range` doğru hesaplanıyor mu? (toplam sayımı ek sorgu)
- [ ] `return=representation` davranışı PATCH/POST için tutarlı mı?

---

# Checkout & Stok — Önerilen Akış

1. **Sepetten Siparişe:** `/orders/checkout` → aktif sepet satırlarını oku → ürünleri kilitle/rezervasyon.
2. **Seri numaralı ürünler:** `product_stock.is_used = 0` kayıtlarından **LIMIT N** seç → `used=1`, `order_item_id` ata. **Tek transaction** içinde yap.
3. **Toplam Hesap:** İndirim/kupon uygulaması → `orders.total`, `orders.discount_total`, `orders.tax_total`.
4. **İdempotensi:** `Idempotency-Key` header ile tekrar denemelere karşı koruma.
5. **Ödeme Sağlayıcıları:** Şimdilik stub — sipariş `status: pending` → ödeme onayı sonrası `paid` ve teslimat.

---

# Hızlı Güvenlik Sertleşmesi

- [ ] `@fastify/rate-limit` ekle (özellikle `/auth/*`).
- [ ] `helmet` muadili: `@fastify/helmet`.
- [ ] JWT `aud/iss` claim’leri ve token süresi (`expiresIn`).
- [ ] Admin uçlarına rol kontrolü (ör. `userRoles.role = 'admin'`).
- [ ] File upload boyut/pattern doğrulamaları (Cloudinary): sadece image mime’ları.

---

# Docker / Çalıştırma

**Önerilen minimal `docker-compose.yml`:**
```yaml
version: '3.9'
services:
  db:
    image: mariadb:10.11
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: app
      MYSQL_USER: app
      MYSQL_PASSWORD: app
    ports:
      - '3306:3306'
    volumes:
      - db_data:/var/lib/mysql
    healthcheck:
      test: ['CMD', 'mysqladmin', 'ping', '-h', '127.0.0.1', '-u', 'app', '--password=app']
  api:
    build: .
    environment:
      PORT: 8080
      DB_HOST: db
      DB_PORT: 3306
      DB_USER: app
      DB_PASSWORD: app
      DB_NAME: app
      JWT_SECRET: change-me
    ports:
      - '8080:8080'
    depends_on:
      db:
        condition: service_healthy
volumes:
  db_data:
```

---

# Önerilen Öncelik Sırası (Sprint 0 → 2 gün)

1) **REST katmanı tamamla** (`queryParser`, `applyRlsWhere`, `TABLES`).  
2) **Products controller** `...` bölgeleri → tam CRUD + FAQs/Options/Reviews/Stock.  
3) **Orders/Checkout**: Transaction + stok rezervasyonu + idempotensi.  
4) **Coupons**: kural doğrulama + uygulama.  
5) **Profiles**: `snake_case`/`camelCase` normalize ve RLS.

**Sprint 1 (2 gün):** Auth sertleşmesi (rate-limit, roles), Storage MIME guard, Seed & .env.example, Docker compose fix.

---

# Hızlı Test Örnekleri (curl)

```bash
# Health
curl -i http://localhost:8080/health

# Signup → Token
curl -sX POST http://localhost:8080/auth/v1/signup -H 'Content-Type: application/json' \
  -d '{"email":"a@b.c","password":"123456"}'

# Login
curl -sX POST http://localhost:8080/auth/v1/token -H 'Content-Type: application/json' \
  -d '{"email":"a@b.c","password":"123456"}'

# Kategori oluştur (Bearer TOKEN gerekli)
curl -sX POST http://localhost:8080/categories -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"name":"Elektronik","slug":"elektronik"}'

# REST örneği: /rest/v1/products?select=*&order=created_at.desc&limit=20&offset=0
```

---

# Hızlı Kazanımlar (Quick Wins)

- Express hatası veren `core/error.ts`’i kaldır veya Fastify uyumlu yap.
- `@fastify/rate-limit` + `@fastify/helmet` kur.
- `.env.example` ekle (DB/JWT/Cloudinary/PayTR placeholders).
- `seed.ts`’i doldur (admin kullanıcı + 3 kategori + 5 ürün + 2 stoğu olan kodlu ürün).
- `docker-compose.yml`’i düzet ve tek komutla ayağa kaldır.

---

# Sonuç

Temel mimari doğru: Fastify + Drizzle + MariaDB ile **Supabase benzeri** bir uyumluluk katmanı. Eksik alanlar `...` placeholder’larda yoğunlaşıyor. Önceliği REST katmanı, `products`, `orders/checkout` ve `coupons` üzerinde toplayıp, güvenlik sertleşmesiyle tamamlayalım. Devamında istersek blog/pages/email-templates tarafını tamamlayıp panel/FE entegrasyonunu hızlandırabiliriz.

