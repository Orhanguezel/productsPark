# Supabase-Uyumlu Backend (MariaDB) — MVP Planı (productspark-flow)

> Amaç: Mevcut React 18 + Vite FE tarafını **minimum değişiklikle** çalıştırmak için, **Supabase-js’nin beklediği HTTP sözleşmesini taklit eden** (compatible) bir **Node.js + MariaDB** backend sağlamak. FE’de yalnızca `.env`teki `VITE_SUPABASE_URL` yeni API’ye çevrilecek.

---

## 0) Özet / Hedefler
- **Supabase-js uyumlu uçlar**: `/rest/v1/*` (PostgREST-lite), `/auth/v1/*` (GoTrue-lite), `/functions/v1/*`, `/storage/v1/*`.
- **MariaDB** üzerinde Drizzle ORM (veya Prisma).
- **FE değişikliği**: Sadece `.env` → `VITE_SUPABASE_URL=https://api.our-backend.com` (publishable key dummy kalabilir).
- **MVP Faz (P0)**: DB/REST, Auth (email+şifre), Storage (upload + public URL), Functions (invoke), Checkout akışı; **Realtime** P1’e ertelenebilir (Socket.IO ile eklenecek).

### 0.1) Karar Kilidi (19 Oct 2025)
- **Realtime:** P1 (ertelendi). İlk sürümde kanal dinlemeleri devre dışı; sayfa yenileme ile veri güncel.
- **RPC `exec_sql`:** Üretimde **kapalı**. Yerine **beyaz listeli** güvenli servis/RPC kullanacağız.
- **ID tipi:** **Varsayılan = INT AUTO_INCREMENT** (MVP basitliği). İstersek P1’de UUID’e geçiş planı (migration notlarıyla) eklenir.
- **Storage:** **Cloudinary + Multer** (bucket yerine klasör yapısı). `getPublicUrl` uyumlu public URL şablonu sağlanacak.
- **Ödeme:** **PayTR** (ilk entegrasyon). Shopier/smm vb. P1/P2.
---

## 1) Kapsam & Varsayımlar
**Projeden elde edilen kullanım envanteri (grep):**
- `from(..).select().eq().in().limit().order().maybeSingle()`
- `count: "exact"` kullanımı (Content-Range gerektirir)
- `auth`: `getUser()`, `getSession()`, `signInWithPassword()`, `signUp()`, `signOut()`, `resetPasswordForEmail()`, `updateUser()`, `auth.admin.getUserById()`
- `functions.invoke(..)`: `send-email`, `shopier-*`, `paytr-*`, `turkpin-*`, `smm-*`, `manual-delivery-email`, `send-telegram-notification`
- `storage`: `upload`, `getPublicUrl` (buckets: `product-images`, `blog-images`, `logos` vb.)
- `rpc`: `exec_sql` (riskli, whitelist/alternatif), `assign_stock_to_order` (güvenli proc)
- `realtime`: `.channel('..').on('postgres_changes', { table: .. })` (P1)

**Öncelikli tablolar (çıkan dosya adlarına göre tahmin):**
- `site_settings`, `categories`, `products`, `profiles`, `cart_items`, `orders`, `order_items`, `wallet_transactions`, `support_tickets`, `ticket_replies`, `popups`, `blogs`, `payment_requests`, `api_providers` (vb.)

---

## 2) Mimari Genel Bakış
- **Runtime:** Node.js 20+
- **Framework:** Fastify (performans + eklenti ekosistemi)
- **ORM:** Drizzle ORM (TS-first, hafif) — alternatif: Prisma
- **DB:** MariaDB 10.6+ (MySQL 8.x ile uyumlu tasarım)
- **Auth:** JWT (P0), ileride httpOnly cookie opsiyonu
- **Validation:** Zod
- **Storage:** MinIO (S3 uyumlu) ya da Local Disk (MVP için), CDN/Reverse proxy ile servis
- **Realtime (P1):** Socket.IO; DB update hook → event publish (`postgres_changes` benzeri payload)
- **Observability:** Pino logs, Prometheus metrics (opsiyonel), request-id
- **Paketleme:** Docker Compose (api, db, minio, redis [P1])

**Katmanlar:**
```
api/
  src/
    core/        # config, env, logger, errors, security
    db/          # drizzle client, migrations, seed
    auth/        # auth routes + services (gotrue-lite)
    rest/        # /rest/v1 generic table router (postgrest-lite)
    rpc/         # /rest/v1/rpc/*  (beyaz listeli)
    storage/     # /storage/v1 (upload, public serve, getPublicUrl uyumu)
    functions/   # /functions/v1 (adapters: email, paytr, shopier, turkpin, smm, telegram)
    realtime/    # (P1) socket.io bridge
    features/    # domain servisleri (orders, checkout, stock, etc.)
    middlewares/ # auth, cors, content-range, error-map
    utils/       # query parser (eq, in, ilike...), headers (Prefer, count)
```

---

## 3) Uç Yüzey (Compatibility Contracts)
### 3.1 REST — `/rest/v1/<table>` (PostgREST-lite)
- **Metotlar:** `GET` (list/find), `POST` (insert), `PATCH` (update), `DELETE` (delete)
- **Sorgu dili (query grammar):**
  - Filtre: `col=eq.value`, `col=ilike.*term*`, `col=in.(a,b,c)`, `price=gte.10`, `price=lte.99`
  - Seçim: `select=col1,col2,rel(*)` *(MVP’de sadece düz kolon listesi; `rel(*)` P1)*
  - Sıralama: `order=created_at.desc` (varsayılan asc/desc)
  - Limit/Offset: `limit=20&offset=0` (max 500)
  - **Count:** `Prefer: count=exact` → **Response Headers**: `Content-Range: 0-<n>/<total>`
  - **Return representation:** `Prefer: return=representation` → body’de etkilenen satırlar
- **Auth header:** `Authorization: Bearer <jwt>` (opsiyonel/tablaya göre)
- **Api key header:** `apikey: <any>` (kabul edilir, doğrulama JWT ile)
- **Hata formatı:** `{ error: { message, details?, hint? } }` (status >= 400)

**Örnek:**
```
GET /rest/v1/categories?is_featured=eq.true&limit=1
Prefer: count=exact
→ 200 OK
Content-Range: 0-0/1
[
  { "id": 42, "name": "X", "slug": "x", ... }
]
```

```
POST /rest/v1/cart_items
Prefer: return=representation
Authorization: Bearer <jwt>
[{ "user_id": 7, "product_id": 12, "qty": 2 }]
→ 201
[{ "id": 333, "user_id": 7, "product_id": 12, "qty": 2, ... }]
```

### 3.2 RPC — `/rest/v1/rpc/<function>`
- **Metot:** `POST` JSON body
- **MVP whitelist:** `assign_stock_to_order`, (gerekirse) `smm_api_order_status`, `calculate_totals` vb.
- **`exec_sql` Notu:** Üretimde **kapatılacak** ya da yalnızca **beyaz listeli** parametrik prosedürlere yönlendirilecek.

**Örnek:**
```
POST /rest/v1/rpc/assign_stock_to_order
{ "order_id": 1001 }
→ 200
{ "ok": true, "reserved": 3 }
```

### 3.3 Auth — `/auth/v1/*` (GoTrue-lite)
- **Login:** `POST /auth/v1/token?grant_type=password` → `{ access_token, token_type, user }`
- **Signup:** `POST /auth/v1/signup` → `{ user, access_token? }`
- **Me:** `GET /auth/v1/user` → `{ user }`
- **Update:** `PUT /auth/v1/user` → `{ user }`
- **Logout:** `POST /auth/v1/logout` → `204`
- **Recover:** `POST /auth/v1/recover` (reset password email başlatır)
- **Admin:** `GET /auth/v1/admin/users/:id` → `{ user }` (minimal)

**User nesnesi (örnek):**
```
{
  "id": "u_123",
  "email": "a@b.com",
  "app_metadata": { "provider": "email" },
  "user_metadata": { "role": "admin" },
  "aud": "authenticated",
  "created_at": "2025-10-19T17:00:00Z"
}
```

### 3.4 Functions — `/functions/v1/<name>`
- **Metot:** `POST` JSON body
- **Yanıt:** `{ data }` | `{ error }` (Supabase-js invoke uyumlu)
- **Adapterlar:**
  - `send-email` (SMTP/Resend/Mailgun),
  - `send-telegram-notification` (Bot API),
  - `shopier-*`, `paytr-*`, `turkpin-*`, `smm-*` (harici sağlayıcı SDK/REST)

### 3.5 Storage — `/storage/v1/*`
- **Upload:** `POST /storage/v1/object/<bucket>/<path>` (multipart veya PUT raw) → policy: auth/role bazlı
- **Public URL:** `GET /storage/v1/object/public/<bucket>/<path>` → Nginx/Proxy ya da app servis eder
- **`getPublicUrl` uyumu:** FE aynı helper ile URL’yi üretir; biz bu path’i karşılarız
- **Bucket politikaları:** `logos`, `product-images`, `blog-images` → read-public, write-auth (role)

### 3.6 Realtime (P1)
- **Socket.IO** endpoint: `/socket`
- DB yazma flow’larına **event hook** eklenip, şu biçimli payload yayınlanır:
```
{
  "type": "postgres_changes",
  "table": "site_settings",
  "schema": "public",
  "eventType": "UPDATE",
  "new": { ... },
  "old": { ... }
}
```
- FE’deki `.channel(...).on('postgres_changes', ...)` handler’ları değişmeden çalışır (bridge/shim ile).

---

## 4) Veri Modeli (MariaDB)
> ID politikası: **INT AUTO_INCREMENT** (basit) veya **UUID (varchar(36))** — proje tercihi. Para alanları: **DECIMAL(10,2)**. Tüm timestamp’ler **UTC**.

**Çekirdek tablolar (özet):**
- `users` (id, email [unique], password_hash, role, is_active, created_at)
- `profiles` (id, user_id [FK], full_name, phone, avatar_url, address fields, updated_at)
- `site_settings` (id, key [unique], value JSON, updated_at)
- `categories` (id, name, slug [unique], image_url, icon, description, is_featured [bool], order_no, is_active, created_at)
- `products` (id, category_id [FK], title, slug [unique], description, price DECIMAL, stock INT, image_url, images JSON, is_active, created_at)
- `cart_items` (id, user_id [FK], product_id [FK], qty, added_at)
- `orders` (id, user_id [FK], status, total DECIMAL, currency, payment_method, created_at, paid_at, note)
- `order_items` (id, order_id [FK], product_id [FK], qty, price DECIMAL, total DECIMAL)
- `wallet_transactions` (id, user_id [FK], type, amount DECIMAL, ref, created_at)
- `support_tickets` (id, user_id [FK], subject, status, created_at)
- `ticket_replies` (id, ticket_id [FK], user_id [FK], message, created_at)
- `blogs` (id, title, slug [unique], content, image_url, is_published, created_at)
- `popups` (id, title, content, image_url, is_active, start_at, end_at)
- `payment_requests` (id, user_id [FK], provider, payload JSON, status, created_at)
- `api_providers` (id, name, type, config JSON, is_active, created_at)

**Index & kısıtlar:** email/slug/foreign keys; `products(is_active, category_id)`, `cart_items(user_id)`, `orders(user_id, created_at)` vb.

---

## 5) Query Parser (PostgREST-lite)
- `eq.`, `neq.`, `gt.`, `gte.`, `lt.`, `lte.`
- `ilike.*term*`
- `in.(a,b,c)` (string → tip dönüştürme, güvenlik)
- `order=field.desc` / `.asc`
- `limit`, `offset`
- `select=field1,field2` (MVP: sadece kolon listesi; nested rel P1)
- `maybeSingle()` → backend tek satır dönerse 200 + object; değilse 406/400 yerine `[0]` kontrolüyle FE tarafı uyumluluğu korunur (uygulamada 0/1 satır döndürme)
- `count=exact` → `Content-Range` başlığı

---

## 6) Auth Tasarımı
- **Kayıt / Giriş:** email + şifre (argon2id hash). JWT üretimi (exp: 1-7 gün arası).
- **`getUser`/`getSession`:** Supabase-js’nin beklediği biçimde user payload + token yönetimi (localStorage ile uyum)
- **Reset Password:** token üret + mail link (functions/send-email)
- **Update User:** email değişimi (unique), metadata alanları (role vb.)
- **Admin getUserById:** yönetim ekranı için minimal uç
- **RLS eşdeğeri:** tablo bazlı policy middleware (örn. `profiles.user_id = jwt.sub`)

---

## 7) Storage Tasarımı — Cloudinary + Multer (Supabase Storage uyumu)
- **Sürücü:** Cloudinary resmi SDK + `multer` (veya `multer-storage-cloudinary`).
- **Klasör stratejisi:** `product-images/`, `blog-images/`, `logos/` gibi **bucket isimleri klasör** olarak eşlenecek.
- **Public URL şablonu (getPublicUrl uyumu):**
  - FE `supabase.storage.from('<bucket>').getPublicUrl('<path>')` çağırdığında biz **şu URL’yi döndüreceğiz**:  
    `https://res.cloudinary.com/<cloud_name>/image/upload/<bucket>/<path>`  
    (Dilersen reverse proxy/CDN altında `/storage/v1/object/public/<bucket>/<path>` → 302 redirect → Cloudinary public URL)
- **Upload endpoint (uyumluluk):**
  - `POST /storage/v1/object/<bucket>/<path>`  
    Body: multipart form-data (`file`), Header: `Authorization: Bearer <jwt>`  
    Yetki: **write-auth (role bazlı)**, Boyut/MIME limitleri Zod + Multer ile.
  - Yanıt: Supabase benzeri `{ path, key, url }` (uyumluluk için `data` sarmalı opsiyonel).
- **Dönüşüm/optimizasyon:** Cloudinary URL parametreleri (w,h,q,f_auto) şablon olarak FE seviyesinde kullanılabilir; MVP’de zorunlu değil.
- **Silme:** `DELETE /storage/v1/object/<bucket>/<path>` → Cloudinary public_id eşlemesi ile.
- **Not:** İleride istenirse local/cache (Thumbor/Cloudflare Images) eklentisi P1/P2’de değerlendirilebilir.
---

## 8) Functions (Adapters) — Invoke Uyumu
- **Sözleşme:** `POST /functions/v1/<name>`; gövde JSON, yanıt `{ data } | { error }`.
- **Çekirdek adaptörler (P0):**
  1) `send-email`: SMTP/Resend/Mailgun (konfiga göre). Şablon: reset, sipariş, bildirim.
  2) **`paytr-get-token`**: PayTR iFrame/token akışı için gerekli imza ve parametreleri üretir.  
     - Env: `PAYTR_MERCHANT_ID`, `PAYTR_MERCHANT_KEY`, `PAYTR_MERCHANT_SALT`, `PAYTR_BASE_URL`, `PAYTR_OK_URL`, `PAYTR_FAIL_URL`, `PAYTR_TEST_MODE`.
     - Giriş: kullanıcı/email, sepet (`user_basket`), `payment_amount` (kuruş), `merchant_oid`, IP, taksit parametreleri.
     - Çıkış: `{ token, expires_in }` (PayTR döndüğü şekilde).
  3) (opsiyonel) `paytr-havale-get-token` veya benzer havale akışı beklentisi varsa aynı şablonda.
  4) `send-telegram-notification`: Telegram Bot API ile basit mesaj gönderimi.
- **P1/P2:** `shopier-*`, `turkpin-*`, `smm-*`, gelişmiş e-posta kuyruğu/geri dönüş işleyicileri.
---

## 9) RPC Stratejisi
- **Güvenli prosedürler (whitelist):** `assign_stock_to_order(order_id)` gibi **parametrik** ve iş kuralı odaklı RPC’ler `/rest/v1/rpc/<fn>` ile servis edilir.
- **`exec_sql`:** **Devre dışı.** Gerekirse sadece geliştirme ortamında ve **sadece** belirli safe komutlar için geçici toggle; prod’da kapalı.
---

## 10) Ortam Değişkenleri (Templates)
**FE (.env):**
```
VITE_SUPABASE_URL=https://api.senin-domainin.com
VITE_SUPABASE_PUBLISHABLE_KEY=dummy
VITE_SUPABASE_PROJECT_ID=compat-local
```

**BE (.env):**
```
PORT=8080
NODE_ENV=production
DB_HOST=db
DB_PORT=3306
DB_USER=app
DB_PASSWORD=app
DB_NAME=app
JWT_SECRET=change-me
CORS_ORIGIN=http://localhost:5173,https://fe-domain.com

# Storage — Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
CLOUDINARY_BASE_PUBLIC=https://res.cloudinary.com/your_cloud/image/upload
# İsteğe bağlı: kendi proxy/CDN path’iniz
PUBLIC_STORAGE_BASE=https://api.senin-domainin.com/storage/v1/object/public

# PayTR
PAYTR_MERCHANT_ID=xxxx
PAYTR_MERCHANT_KEY=xxxx
PAYTR_MERCHANT_SALT=xxxx
PAYTR_BASE_URL=https://www.paytr.com/odeme
PAYTR_OK_URL=https://frontend-domain.com/odeme/basarili
PAYTR_FAIL_URL=https://frontend-domain.com/odeme/hatali
PAYTR_TEST_MODE=1
```
---

## 11) Proje Yapısı (Backend)
```
api/
  docker-compose.yml
  Dockerfile
  src/
    core/{env.ts, logger.ts, errors.ts}
    db/{client.ts, migrations/*, seed/*}
    auth/{routes.ts, service.ts}
    rest/{router.ts, query-parser.ts, content-range.ts}
    rpc/{routes.ts, whitelist.ts}
    storage/{routes.ts, driver-s3.ts, driver-local.ts}
    functions/{routes.ts, adapters/*}
    realtime/{socket.ts}  # P1
    features/
      orders/{routes.ts, service.ts}
      products/{routes.ts, service.ts}
      ...
    middlewares/{auth.ts, cors.ts, error.ts}
    server.ts
```

---

## 12) Migrasyon & Seed
- **Drizzle Kit** ile veritabanı şeması oluşturma
- **Seed**: minimum demo verisi (1-2 kategori, 3-5 ürün, 1 admin user)
- **Supabase’ten veri taşıma:** CSV export → `LOAD DATA` (tip/isim dönüşümleri için ön işlem)

---

## 13) Güvenlik & Politikalar
- **Auth zorunluluğu** gereken tablolar (cart_items, orders, order_items, wallet_transactions, support)
- **RLS eşdeğeri** middleware: `where user_id = jwt.sub`
- **Rate limit** (Fastify rate-limit) özellikle `/functions` ve `/auth`
- **Input validation**: Zod şemaları (REST + Functions + Auth)
- **Error mapping**: Supabase benzeri hata yapısı

---

## 14) Dağıtım
- **Docker Compose (dev/prod)**: `mariadb`, `api`, `minio`, opsiyonel `redis`
- **Reverse Proxy**: Nginx/Traefik (TLS, gzip, cache headers for storage public)
- **Logs**: JSON (Pino), tarih bazlı rotasyon (Docker log-driver veya lokalde)

---

## 15) Test Planı
- **Postman koleksiyonu**: /rest, /auth, /storage, /functions uçları
- **Contract test**: Supabase-js ile smoke test (FE’den gerçek akışlar)
- **E2E kritik akışlar**: login/signup, ürün liste, sepet, checkout, email/telegram
- **Load test (opsiyonel)**: k6 ile list/filter + checkout

---

## 16) Kabul Kriterleri (P0)
1. **Ana sayfa** `site_settings` okuma: `eq`, `in`, `maybeSingle` **çalışıyor**.
2. **Kategori/Ürün** listeleme: `limit`, `order`, `count=exact` → `Content-Range` doğru set ediliyor.
3. **Sepet CRUD**: insert/update/delete + `Prefer: return=representation` ile kayıtlar dönüyor.
4. **Auth (email+şifre)**: signUp/signIn/getUser/signOut/reset/update akışları FE’de sorunsuz.
5. **Storage (Cloudinary)**: upload endpoint ile dosya yükleniyor; `getPublicUrl` → geçerli public URL; görsel FE’de görüntüleniyor.
6. **Functions (PayTR)**: `paytr-get-token` çağrısı başarıyla token döndürüyor; hatalarda anlaşılır `{ error }`.
7. **RPC**: `assign_stock_to_order` çalışıyor; `exec_sql` prod’da kapalı.
8. FE sadece `.env` değişikliğiyle çalışıyor; import yollarında veya çağrı sözleşmelerinde ek müdahale gerekmiyor.

**P1**
- Realtime (Socket.IO bridge, `postgres_changes` payload benzeri)
- OAuth provider’lar (opsiyonel)
- Nested `select`/`rel(*)` desteği (gereksinime göre)
- Ödeme sağlayıcıları için gelişmiş geri dönüş & webhook işleyicileri
---

## 17) Riskler & Önlemler
- **`exec_sql` güvenliği**: Sınırlı/parametrik whitelist, ASAP kaldırma
- **Realtime tutarlılığı**: MVP’de kapalı; P1’de Socket.IO ile bridge, DB’den event üretimi servis katmanından
- **Storage public URL**: CDN/Proxy konfig hataları → entegrasyon testi/checklist
- **Count/Range farkları**: FE’nin `count: "exact"` beklentisi için `Content-Range` doğru set edilmeli

---

## 18) Yol Haritası (Sprint’ler)
**Sprint 1 (P0-çekirdek)**
- Proje iskeleti (Fastify, Drizzle), env, Docker Compose
- Drizzle şema: users, profiles, site_settings, categories, products, cart_items, orders, order_items
- `/rest/v1` generic router + query parser (eq, in, ilike, gte/lte, order, limit/offset, select, count, return=representation)
- `/auth/v1` password flow (signup, token, user, logout, update, recover)
- **Storage Cloudinary**: upload + public serve + getPublicUrl uyumu
- **Functions**: `send-email`, **`paytr-get-token`**
- Seed + Postman koleksiyon + FE `.env` switch ile smoke test

**Sprint 2 (P0-tamamlayıcı)**
- Kalan tablolar ve index’ler, admin uçları (auth.admin.getUserById)
- RPC whitelist (`assign_stock_to_order`) + checkout tamamlayıcı akışlar
- Hata haritalama, rate limit, loglama, dökümantasyon

**Sprint 3 (P1)**
- Realtime (Socket.IO bridge)
- OAuth sağlayıcıları (opsiyonel)
- Nested select/rel(*) gereksinimleri
- PayTR/diğer sağlayıcılar için webhook/geri dönüş akışları
---

## 19) Kesinti / Cutover Planı
1. Supabase’ten CSV export (tablolar) + dosyalar (buckets)
2. Dönüşüm (tip/ad/sözleşme uyumu) + MariaDB import
3. Backend P0 ayağa kalkar, FE `.env` yeni URL’ye çevrilir
4. Smoke testler → tohum sipariş/checkout
5. Gerekirse P1’de realtime açılır

---

## 20) Dökümantasyon & Araçlar
- **OpenAPI/Swagger**: `/docs` (yalın tanım; Supabase adıyla çakışmayan açıklamalar)
- **Postman Koleksiyonu**: auth, rest, storage, functions, rpc
- **Runbooks**: Ortam değişkenleri, deploy, backup/restore, SRE notları

---

### Notlar
- FE’de `supabase` import adı **değişmeyecek**. Sadece `VITE_SUPABASE_URL` yeni backend’e dönecek.
- Realtime P1’e ertelenirse FE çalışır; anlık güncellemeler sayfa yenilemede görünür. P1’de Supabase payload biçimi taklit edilerek sorunsuz geçiş sağlanır.



---

# 21) Sprint 1 — Uygulama Planı (Detaylı)

## 21.1 Görev Listesi (Sıra & Sorumluluk)
1. **Repo iskeleti** (Fastify + Drizzle + Zod + Pino)
   - `api/src/core/{env,logger,errors}.ts`
   - `api/src/server.ts` (bootstrap)
   - `api/src/middlewares/{auth,cors,error}.ts`
2. **ENV & Docker Compose**
   - `mariadb`, `api` servisleri (Cloudinary harici SaaS)
   - `.env` şablonları (bkz. §10)
3. **DB şeması (Drizzle)** — çekirdek tablolar
   - `users, profiles, site_settings, categories, products, cart_items, orders, order_items`
   - index/unique/FK’ler, default’lar (UTC timestamp)
4. **REST generic router** — `/rest/v1/<table>`
   - Query parser: `eq, neq, gt, gte, lt, lte, ilike, in, order, limit, offset`
   - `select=col1,col2` (P0 düz liste)
   - `Prefer: count=exact` → `Content-Range`
   - `Prefer: return=representation` → insert/update dönüşü
5. **Auth (GoTrue-lite)** — `/auth/v1/*`
   - `signup`, `token?grant_type=password`, `user`(get/update), `logout`, `recover`
   - `auth.admin.getUserById` minimal uç
   - Şifre hash: argon2id, JWT (HS256)
6. **Storage (Cloudinary + Multer)** — `/storage/v1/object/*`
   - `POST /object/<bucket>/<path>` (upload)
   - `GET /object/public/<bucket>/<path>` (proxy/redirect)
   - Bucket → klasör eşlemesi
7. **Functions (PayTR)** — `/functions/v1/paytr-get-token`
   - İmza & parametre üretimi, timeout & hata map’leri
8. **RPC whitelist** — `/rest/v1/rpc/assign_stock_to_order`
   - Stok rezervasyonu iş kuralı
   - `exec_sql` devre dışı (geliştirmede bile toggle ile)
9. **Seed & Demo** — minimum veri + 1 admin user
10. **Postman koleksiyonu** — tüm uçlar (auth/rest/storage/functions/rpc)
11. **Smoke test** — FE `.env` switch + kritik akışlar (bkz. §22)

---

## 21.2 Supabase Uyum Matrisi → Uygulama Notları

| FE Kullanımı | Backend Uygulaması | Not |
|---|---|---|
| `from('site_settings').select('value').eq('key','x').maybeSingle()` | `GET /rest/v1/site_settings?key=eq.x&select=value` | Tek satır bekleniyorsa 0/1 sonucu uygun body ile döndür (array → tek obje). |
| `from('site_settings').select('*').in('key',[...])` | `GET /rest/v1/site_settings?key=in.(a,b,c)` | `in.(...)` parser’ı virgül ayırır, tip cast dikkat. |
| `from('categories').select(...).eq('is_featured',true).limit(1)` | `GET /rest/v1/categories?is_featured=eq.true&limit=1` | Boolean stringleri `true/false` olarak kabul. |
| `select(...,{ count:'exact' })` | `Prefer: count=exact` + `Content-Range` | Header’da `Content-Range: 0-(n-1)/total`. |
| `insert([...])` + `Prefer: return=representation` | `POST /rest/v1/<table>` | Insert sonrası seçip body’de döndür. |
| `update({...}).eq('id',X)` + `Prefer: return=representation` | `PATCH /rest/v1/<table>?id=eq.X` | Değişen satırları body’de döndür. |
| `delete().eq('id',X)` | `DELETE /rest/v1/<table>?id=eq.X` | `204 No Content`.
| `rpc('assign_stock_to_order',{order_id})` | `POST /rest/v1/rpc/assign_stock_to_order` | Parametrik, iş kuralları içeride. |
| `auth.getUser()/getSession()` | `GET /auth/v1/user` | JWT’den user’ı çıkar. |
| `auth.signInWithPassword` | `POST /auth/v1/token?grant_type=password` | Yanıt sözleşmesi Supabase-js ile uyumlu. |
| `auth.signUp` | `POST /auth/v1/signup` | E-posta doğrulama akışı P1. |
| `auth.signOut` | `POST /auth/v1/logout` | 204. |
| `auth.resetPasswordForEmail` | `POST /auth/v1/recover` | E-posta gönderimini functions kullanır. |
| `auth.updateUser` | `PUT/PATCH /auth/v1/user` | Email/metadata güncelleme. |
| `auth.admin.getUserById` | `GET /auth/v1/admin/users/:id` | Admin role guard. |
| `storage.from('bucket').upload(path,file)` | `POST /storage/v1/object/<bucket>/<path>` | Multer + Cloudinary yükleme. |
| `storage.from('bucket').getPublicUrl(path)` | **URL üretimi** | `https://res.cloudinary.com/<cloud>/image/upload/<bucket>/<path>` veya `/storage/v1/object/public/...` → redirect. |
| `functions.invoke('paytr-get-token', body)` | `POST /functions/v1/paytr-get-token` | `{ data:{ token } } | { error }`. |

---

## 21.3 JSON Şemaları (Özet)

### 21.3.1 Auth
- **POST** `/auth/v1/signup`
```json
{ "email":"a@b.com", "password":"P@ssw0rd", "data":{ "role":"user" } }
```
**200**
```json
{ "user": {"id":"u_1","email":"a@b.com","app_metadata":{"provider":"email"},"user_metadata":{"role":"user"}}, "access_token":"...", "token_type":"bearer" }
```

- **POST** `/auth/v1/token?grant_type=password`
```json
{ "email":"a@b.com", "password":"P@ssw0rd" }
```
**200** `{ "access_token":"...", "token_type":"bearer", "user":{...} }`

- **GET** `/auth/v1/user` → **200** `{ "user":{...} }`

### 21.3.2 REST Count Header
`Prefer: count=exact` → **Response Header:** `Content-Range: 0-9/57`

### 21.3.3 Storage Upload
- **POST** `/storage/v1/object/product-images/2025/10/img-001.jpg`
  - multipart form-data: `file`
**200**
```json
{ "data": { "path":"2025/10/img-001.jpg", "url":"https://res.cloudinary.com/<cloud>/image/upload/product-images/2025/10/img-001.jpg" } }
```

### 21.3.4 Functions — PayTR
- **POST** `/functions/v1/paytr-get-token`
```json
{ "email":"a@b.com", "amount": 4990, "basket": [["Ürün", "49.90", 1]], "merchant_oid":"OID123", "user_ip":"1.2.3.4", "installment":0 }
```
**200** `{ "data": { "token":"...", "expires_in": 300 } }`

---

## 21.4 Güvenlik Politikaları (P0)
- **Auth guard**: `/auth/*`, yazma işlemleri ve `cart/orders` üzerinde zorunlu.
- **RLS eşdeğeri**: `profiles.user_id = jwt.sub`, `cart_items.user_id = jwt.sub`, `orders.user_id = jwt.sub` filtreleri middleware ile **otomatik** uygulanır.
- **Rate limit**: `/auth`, `/functions` uçlarında dakikalık kota.
- **Input doğrulama**: Zod ile body/query validasyonu, ayrıntılı hata map’i.

---

## 21.5 Hata Haritalama (Supabase benzeri)
- **400** `{ "error": { "message": "invalid_request", "details": "..." } }`
- **401** `{ "error": { "message": "invalid_token" } }`
- **403** `{ "error": { "message": "forbidden" } }`
- **404** `{ "error": { "message": "not_found" } }`
- **409** `{ "error": { "message": "conflict" } }`
- **422** `{ "error": { "message": "validation_error", "fields": { "email": "invalid" } } }`
- **500** `{ "error": { "message": "internal" } }`

---

## 21.6 DB Şema Detayı (Özet Alanlar)
> INT AUTO_INCREMENT, UTC timestamps (`created_at`, `updated_at`). Para: `DECIMAL(10,2)`.

- **users**: id, email (uniq), password_hash, role (enum: admin|user), is_active (bool), created_at
- **profiles**: id, user_id (FK), full_name, phone, avatar_url, address_json, updated_at
- **site_settings**: id, key (uniq), value (JSON), updated_at
- **categories**: id, name, slug (uniq), image_url, icon, description, is_featured (bool), order_no, is_active, created_at
- **products**: id, category_id (FK), title, slug (uniq), description, price, stock, image_url, images (JSON), is_active, created_at
- **cart_items**: id, user_id (FK), product_id (FK), qty, added_at
- **orders**: id, user_id (FK), status (enum), total, currency, payment_method, created_at, paid_at, note
- **order_items**: id, order_id (FK), product_id (FK), qty, price, total

Indexler: email, slug, FK’ler; `products(is_active, category_id)`, `orders(user_id, created_at)`

---

## 21.7 Postman Koleksiyonu (P0)
1. **Auth**: signup, token, user, update, logout, recover
2. **REST**: site_settings, categories, products, cart_items, orders (GET/POST/PATCH/DELETE) + count
3. **Storage**: upload, public fetch
4. **Functions**: paytr-get-token
5. **RPC**: assign_stock_to_order

---

## 21.8 Smoke Test Senaryoları (FE .env switch sonrası)
1) **Ana sayfa**: `site_settings` içeriklerinin görünmesi
2) **Öne çıkan kategori**: `categories?is_featured=true&limit=1` ile gelen görsel/metinlerin görünmesi
3) **Ürün liste**: filtre/limit/order + sayfalama (count kontrol)
4) **Auth**: sign up → sign in → getUser → logout
5) **Sepet**: ürün ekle/sil/güncelle → UI yansıyor mu
6) **Checkout (PayTR token)**: `functions.invoke('paytr-get-token')` başarılı token döndürüyor mu
7) **Storage**: admin’den görsel yükle → FE’de public URL ile görüntü

---

## 21.9 Done Definition (Sprint 1)
- Tüm P0 uçları canlı ve Postman testlerinden geçmiş
- FE `.env` yalnızca URL ile değiştirilmiş ve ana akışlar çalışıyor
- Loglar okunabilir (request-id), hatalar doğru HTTP kodları ile dönüyor
- Readme: kurulum/çalıştırma, env listesi, bilinen kısıtlar (Realtime=P1)



---

# 22) Sprint 1 — Çalıştırılabilir İskelet (Dosyalar)

> Aşağıdaki dosyaları repo kökünde oluşturduğunda API konteyneri ayağa kalkar ve FE yalnızca `.env`te `VITE_SUPABASE_URL`i bu API’ye işaret edecek şekilde güncellendiğinde smoke test yapılabilir.

## 22.1 `docker-compose.yml`
```yaml
version: "3.9"
services:
  db:
    image: mariadb:10.11
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD:-root}
      MYSQL_DATABASE: ${DB_NAME:-app}
      MYSQL_USER: ${DB_USER:-app}
      MYSQL_PASSWORD: ${DB_PASSWORD:-app}
    ports:
      - "3306:3306"
    volumes:
      - db_data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "127.0.0.1", "-u", "$$MYSQL_USER", "--password=$$MYSQL_PASSWORD"]
      interval: 10s
      timeout: 5s
      retries: 10

  api:
    build: ./api
    restart: unless-stopped
    env_file: ./api/.env
    ports:
      - "8080:8080"
    depends_on:
      db:
        condition: service_healthy
```

volumes:
  db_data: {}
```

## 22.2 `api/Dockerfile`
```dockerfile
FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM base AS build
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY api.yaml ./api.yaml
EXPOSE 8080
CMD ["node", "dist/server.js"]
```

## 22.3 `api/package.json`
```json
{
  "name": "productspark-compat-api",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc -p .",
    "start": "node dist/server.js"
  },
  "dependencies": {
    "@fastify/cors": "^9.0.0",
    "@fastify/jwt": "^9.0.0",
    "argon2": "^0.40.1",
    "drizzle-orm": "^0.35.0",
    "fastify": "^4.27.2",
    "mysql2": "^3.10.0",
    "zod": "^3.23.8",
    "cloudinary": "^2.5.1",
    "multer": "^1.4.5-lts.1"
  },
  "devDependencies": {
    "@types/node": "^20.11.30",
    "ts-node": "^10.9.2",
    "tslib": "^2.6.2",
    "tsc-alias": "^1.8.8",
    "tsx": "^4.19.1",
    "typescript": "^5.4.5"
  }
}
```

## 22.4 `api/tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "Node",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["src"]
}
```

## 22.5 `api/.env.example`
```env
PORT=8080
NODE_ENV=development

DB_HOST=db
DB_PORT=3306
DB_USER=app
DB_PASSWORD=app
DB_NAME=app
DB_ROOT_PASSWORD=root

JWT_SECRET=change-me
CORS_ORIGIN=http://localhost:5173

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
PUBLIC_STORAGE_BASE=https://api.localhost:8080/storage/v1/object/public

# PayTR
PAYTR_MERCHANT_ID=xxxx
PAYTR_MERCHANT_KEY=xxxx
PAYTR_MERCHANT_SALT=xxxx
PAYTR_BASE_URL=https://www.paytr.com/odeme
PAYTR_OK_URL=http://localhost:5173/odeme/basarili
PAYTR_FAIL_URL=http://localhost:5173/odeme/hatali
PAYTR_TEST_MODE=1
```

## 22.6 `api/src/server.ts` (bootstrap iskeleti)
```ts
import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: (origin, cb) => cb(null, true),
  credentials: true
});
await app.register(jwt, { secret: process.env.JWT_SECRET! });

// health
app.get('/health', async () => ({ ok: true }));

// TODO: register modules in Sprint 1
// - /rest/v1 (generic)
// - /auth/v1 (signup, token, user, logout, recover)
// - /storage/v1 (upload, public)
// - /functions/v1/paytr-get-token
// - /rest/v1/rpc/assign_stock_to_order

app.setErrorHandler((err, req, reply) => {
  req.log.error(err);
  const status = err.statusCode || 500;
  reply.code(status).send({ error: { message: err.message } });
});

const port = Number(process.env.PORT || 8080);
app.listen({ port, host: '0.0.0.0' }).catch((e) => {
  console.error('Server failed to start', e);
  process.exit(1);
});
```

## 22.7 Query Grammar — Test Listesi
- `GET /rest/v1/products?is_active=eq.true&limit=10&offset=0&order=created_at.desc` → 200 + `Content-Range` (count=exact ise)
- `GET /rest/v1/site_settings?key=eq.home_header_top_text&select=value` → tek alan
- `GET /rest/v1/site_settings?key=in.(home_header_top_text,home_header_bottom_text,home_header_button_text)`
- `GET /rest/v1/products?title=ilike.*mouse*&price=gte.100&price=lte.500` → çoklu filtre
- `POST /rest/v1/cart_items` + `Prefer: return=representation` → eklenen kayıtlar
- `PATCH /rest/v1/cart_items?id=eq.123` + `Prefer: return=representation` → güncellenen kayıtlar
- `DELETE /rest/v1/cart_items?id=eq.123` → 204

## 22.8 Functions — PayTR Parametre Checklist
- **Gerekli ENV:** `PAYTR_MERCHANT_ID`, `PAYTR_MERCHANT_KEY`, `PAYTR_MERCHANT_SALT`, `PAYTR_OK_URL`, `PAYTR_FAIL_URL`, `PAYTR_TEST_MODE` (0/1)
- **Giriş Alanları:**
  - `email`, `payment_amount` (kuruş), `merchant_oid`, `user_ip`, `installment` (0 tek çekim)
  - `basket`: JSON.stringify edilmiş `[["Ürün", "49.90", 1], ...]`
  - `no_installment`, `max_installment`, `currency` (TRY), `lang` (tr)
- **İmza Hesabı:** PayTR dökümanına göre `hash_str = ${merchant_id}${user_ip}${merchant_oid}${email}${payment_amount}${basket}${no_installment}${max_installment}${currency}${test_mode} + merchant_salt` → HMAC-SHA256, base64
- **Yanıt:** `{ data: { token, expires_in } }` veya `{ error: { message } }`
- **Hata Durumları:** yanlış imza, sepet format hatası, amount alt/üst limit, IP eksik.

## 22.9 Çalıştırma
```bash
# 1) Kopyala: api/.env.example → api/.env (ENV’leri doldur)
# 2) Derle ve başlat
docker compose build
docker compose up -d
# 3) Sağlık kontrolü
curl http://localhost:8080/health
```

> FE için: `.env`te `VITE_SUPABASE_URL` → `http://localhost:8080` yap ve uygulamayı başlat.

