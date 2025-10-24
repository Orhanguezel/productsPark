

mükemmel — şimdi bu süreci “tekrarlanabilir” hale getirelim. aşağıdaki rehber, bir modülü sıfırdan eklerken aynen uygulayabileceğin ayrıntılı bir **standart çalışma akışı + şablonlar + kontrol listeleri** içerir. önce UI’dan başlayıp, integration katmanı, backend ve seed dosyalarına kadar tüm adımları kapsar. aralara, az önce çözdüğümüz “custom_pages” tecrübelerinden gelen minik uyarılar da serpiştirdim.

---

# uçtan uca modül geliştirme rehberi

## 0) proje haritası (nerede ne var?)

* **UI / FE**

  * `src/integrations/metahub/rtk/...` → RTK Query endpoint’leri
  * `src/integrations/metahub/client/...` → facade (RTK’yi saran basit API)
  * `src/integrations/metahub/db/from.ts` → Supabase-benzeri `from()` adapter (REST’e mapler)
  * `src/integrations/metahub/db/normalizeTables.ts` → endpoint bazlı normalize
  * `src/integrations/metahub/db/types.ts` → View modelleri (UI’nin beklediği tipler)
  * (gerekirse) `src/forms/...` → form tipleri & Zod (FE tarafı)
* **BE**

  * `src/modules/<modül>/{schema|repository|controller|router}.ts`
  * `src/plugins/authPlugin.ts` → public endpoint flag (config.public)
  * `src/app.ts` → tüm router’ların kaydı (auth plugin **önce**, router’lar **sonra**)
* **DB / seed**

  * `db/sql/XX_<module>_schema.sql` → tablo şeması
  * `db/sql/YY_<module>_seed.sql` → örnek veri (idempotent upsert)

---

## 1) UI kodlarını incele (kaynak ihtiyaç analizi)

**Amaç:** UI hangi alanları bekliyor, nasıl gösteriyor?
**Yapılacaklar:**

* İlgili sayfa/komponentleri tara: `PageData`, `props`, `useQuery` çağrıları, selector’lar.
* Beklenen **View Tipi**ni çıkar (örn. `CustomPageView`):

  * Hangi alanlar **zorunlu**? (ör. `title`, `content`)
  * Hangileri **opsiyonel**? (ör. `meta_description?: string | null`)
  * Dönüşüm kuralları: JSON-string → HTML, `0|1` → `boolean`, `string sayı` → `number` vb.
* Varsa **form** gereksinimleri: create/update ekranları için alanlar ve doğrulamalar.

> Not: “meta_description UI’de required sanılmış” gibi TS uyuşmazlıklarını burada yakala. (Ya View tipini ya da kullanıldığı yeri düzelt.)

---

## 2) veri modelini **tasarla** (SQL’e çevirmeden)

**Amaç:** Şemayı kafada bitir, ama henüz SQL yazma.
**Yapılacaklar:**

* Normalize edilmiş **View tipi**ni baz alıp, **API modeli**ni (ham tip) yaz:

  * `ApiModel` vs `ViewModel` (örn. `ApiCustomPage` ham tip; `CustomPageView` normalize edilmiş)
* Alan dönüşümleri için not al:

  * `content` alanı **DB’de JSON** (ör. `{ html: string }`), FE’de **string HTML**.
  * `is_published` **DB: TINYINT(1)**, FE’de boolean (normalize ile).
* Liste uçları için filtre/sıralama sözleşmesi:

  * `limit`, `offset`, `sort`, `order`, arama (`q`), boolean filtreleri (`is_active=1/0`).

---

## 3) integrations katmanını kur (tek uçtan veri alma)

**Amaç:** FE, BE hazır olmadan bile “tek endpoint” ile veri çekebilsin.
**Adımlar:**

### 3.1) Tipler

* `db/types.ts` içinde **View tipi**ni tanımla / güncelle:

  ```ts
  export type CustomPageView = {
    id: string;
    title: string;
    slug: string;
    content: string;              // FE: düz HTML
    meta_title?: string | null;
    meta_description?: string | null;
    is_published: boolean;
    created_at?: string;
    updated_at?: string;
  };
  ```

### 3.2) Normalize fonksiyonları (endpoint bazlı)

* `normalizeTables.ts` içine ilgili path bloğunu ekle/güncelle:

  ```ts
  if (path === "/custom_pages") {
    return rows.map((r) => {
      const c: Record<string, unknown> = { ...r };

      const title = typeof c.title === "string" ? c.title : "";
      const slug  = typeof c.slug  === "string" ? c.slug  : "";

      // content: DB’de JSON-string {"html": "..."} → FE’de düz HTML
      let contentHtml = "";
      const val = c.content;
      const isObj = (x: unknown): x is Record<string, unknown> =>
        typeof x === "object" && x !== null;

      if (typeof val === "string") {
        try {
          const parsed = JSON.parse(val) as unknown;
          contentHtml = isObj(parsed) && typeof parsed["html"] === "string" ? (parsed["html"] as string) : val;
        } catch {
          contentHtml = val;
        }
      } else if (isObj(val) && typeof val["html"] === "string") {
        contentHtml = val["html"] as string;
      }

      const ip = c.is_published;
      const is_published = (ip === true || ip === 1 || ip === "1" || ip === "true");

      c.title = title;
      c.slug  = slug;
      c.content = contentHtml;         // FE düz alan
      c.is_published = is_published;

      return c as unknown as import("./types").UnknownRow;
    });
  }
  ```

### 3.3) `from()` adaptörü

* `from.ts` → `TABLES` map’e tabloyu ekle ve **base**’i doğru seç:

  ```ts
  custom_pages: { path: "/custom_pages", base: "app" },
  ```
* **Başarısızlık toleransı:** app base 500 verirse edge fallback *yok* ama **404** varsa boş dön (zaten var).

### 3.4) RTK endpoints

* `rtk/endpoints/<module>.endpoints.ts` dosyasını oluştur:

  * `transformResponse` içinde normalize (gerekirse yukarıdakiyle paralel).
  * `providesTags`: `["Entity", "Entities"]` kalıbı.

### 3.5) Client facade

* `client/<module>/client.ts` dosyasında `store.dispatch(...).unwrap()` ile basit API:

  * `list`, `getById`, `getBySlug` vb.
  * Tüm `catch`’lerde `normalizeError`.

> İpucu: FE’de önce **tek uç** (list/get) çalışsın; UI veriyi **görsün**. Sonra BE’yi aynı sözleşmeye getir.

---

## 4) backend’i yaz (schema → validation → repo → controller → router → app)

**Amaç:** FE sözleşmesini birebir karşılayacak uçları ekle.

### 4.1) Schema (Drizzle)

* `schema.ts`:

  ```ts
  export const customPages = mysqlTable(
    "custom_pages",
    {
      id: char("id", { length: 36 }).primaryKey().notNull(),
      title: varchar("title", { length: 255 }).notNull(),
      slug: varchar("slug", { length: 255 }).notNull(),
      content: text("content").notNull(), // JSON-string {"html": "..."}
      meta_title: varchar("meta_title", { length: 255 }),
      meta_description: varchar("meta_description", { length: 500 }),
      is_published: tinyint("is_published").notNull().default(0),
      created_at: datetime("created_at", { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
      updated_at: datetime("updated_at", { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`).$onUpdateFn(() => new Date()),
    },
    (t) => [
      uniqueIndex("ux_custom_pages_slug").on(t.slug),
      index("custom_pages_created_idx").on(t.created_at),
      index("custom_pages_updated_idx").on(t.updated_at),
      index("custom_pages_is_published_idx").on(t.is_published),
    ],
  );
  ```

### 4.2) Validation (Zod)

* `create`/`update` body’leri için şema. Örn. FE rahat girsin diye `content_html` al, repo’da `packContent` ile JSON-string yap:

  ```ts
  export const boolLike = z.union([z.boolean(), z.literal(0), z.literal(1), z.literal("0"), z.literal("1"), z.literal("true"), z.literal("false")]);
  ```

### 4.3) Repository

* `list` filtresi **mutlaka** `where(and(...))` ile bağlansın (önceki bug: whereExpr kullanılmıyordu).
* Sıralama `parseOrder("created_at.desc")` kalıbına uygun.
* `packContent(html)` helper’ı ile `{html}` JSON-string yaz.

### 4.4) Controller

* `listPages`: `x-total-count` header’ını **koy**.
* Tüm metodlarda try/catch: log + sabit hata mesajı (FE predictable).
* Query’de `select` gelirse **yoksay** (FE gönderebiliyor).

### 4.5) Router

* **Public GET’ler**: `config: { public: true }` → `no_token` hatası çıkmasın.
* `POST/PATCH/DELETE` korumalı kalsın.

### 4.6) App’e ekle

* `authPlugin` **JWT/cookie**’den doğrulama yapar, **public flag**’i tanır.
* `app.ts`’te **sıra**:

  1. cors → cookie → jwt
  2. `await app.register(authPlugin)`
  3. tüm router kayıtları

> İpucu: `curl` ile `GET /custom_pages?...` isteğinde 200 dönmesi, `no_token` almaman lazım.

---

## 5) seed dosyaları (idempotent)

**Schema:**

* `70_<module>_schema.sql`

  * JSON alanlar için `LONGTEXT COLLATE utf8mb4_bin CHECK (JSON_VALID(content))`.
  * `updated_at DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()` (MariaDB’de uygun).

**Seed:**

* `77_<module>_seed.sql`

  * `INSERT ... ON DUPLICATE KEY UPDATE` kalıbı (unique `slug` üstünden).
  * `content` alanına **JSON-string** yaz (`{\"html\":\"...\"}` kaçışlı).

**Örnek upsert:**

```sql
INSERT INTO `custom_pages`
(`id`,`title`,`slug`,`content`,`meta_title`,`meta_description`,`is_published`,`created_at`,`updated_at`)
VALUES
('uuid-1','Hakkımızda','hakkimizda','{\"html\":\"<div>...</div>\"}',NULL,NULL,1,NOW(),NOW())
ON DUPLICATE KEY UPDATE
  `title`=VALUES(`title`),
  `content`=VALUES(`content`),
  `meta_title`=VALUES(`meta_title`),
  `meta_description`=VALUES(`meta_description`),
  `is_published`=VALUES(`is_published`),
  `updated_at`=VALUES(`updated_at`);
```

---

## 6) test & doğrulama

**Backend:**

* `curl "http://localhost:8081/custom_pages?slug=iade-degisim&is_published=1&limit=1"`

  * Beklenen: `200` + `[ { id, title, slug, content: "{\"html\":...}", ... } ]` (BE ham tip)
* `curl "http://localhost:8081/custom_pages/by-slug/iade-degisim"`
* Header’da `x-total-count` var mı? (liste uçlarında)

**Frontend:**

* Network tab: `GET /custom_pages?...` → `200`
* `normalizeTables.ts` içerik dönüştü mü?

  * FE tarafında `content` **string HTML** olmalı.
* Konsol hataları:

  * `no_token` → router public flag eksik.
  * `TS2345` tip hataları → View tipi ile UI kullanımı uyumsuz (ör. optional/required).
* UI’da sayfa içeriklerini görüntüle (görsel doğrulama).

---

## 7) sık hatalar & çözümleri

* **no_token** (401): `authPlugin` yüklü ama router’da `config: { public: true }` unutulmuş.
* **500 + custom_pages_list_failed**: repo’da `where(and(...))` uygulanmamış; try/catch üstte aynı hatayı dönüyor.
* **TS tip uyuşmazlığı**: FE `PageData` required alan, `View` opsiyonel. Ya `PageData`yı opsiyonelleştir ya da normalize sırasında default ver.
* **content HTML gelmiyor**: DB’de `content` düz HTML yazılmış (JSON değil). `packContent` ile yaz; seed’de JSON-string kullan.
* **X-Total-Count yok**: FE’de sayfalama bekleniyorsa controller’da header set et.
* **CORS/Cookie**: `credentials: true` + sameSite/secure bayraklarını ortamına göre ayarla.

---

## 8) “Definition of Done” (bitti saymak için)

* [ ] UI’da veri görünüyor; konsolda hata yok.
* [ ] `from()` ve RTK hook’larıyla **aynı uç**tan veri çekilebiliyor.
* [ ] Tipler `no-any`, tüm dönüşümler normalize edilmiş.
* [ ] BE uçları Postman/curl ile 200 dönüyor; gerekli header’lar set.
* [ ] Seed idempotent, tekrar koşunca çakışma yok.
* [ ] Public GET’ler token istemiyor; yazma uçları korumalı.

---

## 9) kopyala-yapıştır “görev promptu” (her yeni modülde kullan)

> **Modül Adı:** `<resource>`
> **Amaç:** UI’nın beklediği View tipiyle `<resource>` modülünü uçtan uca eklemek.

1. **UI analizi:** `<resource>` kullanan sayfaları tara; beklenen alanları ve zorunlulukları çıkar. View tipini yaz: `XxxView`.

2. **Integrations:**

   * `db/types.ts` → `XxxView` ekle.
   * `db/normalizeTables.ts` → `if (path === "/<resource>") { ... }` bloğu: JSON-string → nesne, 0/1 → boolean, string sayı → number dönüşümleri.
   * `db/from.ts` → `TABLES.<resource> = { path: "/<resource>", base: "app" }`.
   * `rtk/endpoints/<resource>.endpoints.ts` → `listXxx`, `getXxxById` (+ gerekiyorsa `getXxxBySlug`) ve `transformResponse`.
   * `client/<resource>/client.ts` → `list/getById/...` facade; `normalizeError`.

3. **Backend:**

   * `schema.ts` → Drizzle tablo; JSON-string alanlar `text`, boolean’lar `tinyint(1)`.
   * `repository.ts` → `list` filtreleri (and(...)), sıralama (`parseOrder`), `packContent` helper.
   * `controller.ts` → `x-total-count` header’ı; try/catch ile sabit hata mesajları.
   * `router.ts` → **GET uçları public** (`config.public = true`); yazma uçları korumalı.
   * `app.ts` → `await app.register(authPlugin)` JWT’den sonra; router’ları ekle.

4. **Seed:**

   * `70_<resource>_schema.sql` → tablo (JSON_VALID gerekecekse `CHECK (JSON_VALID(...))`).
   * `77_<resource>_seed.sql` → `INSERT ... ON DUPLICATE KEY UPDATE` (unique key belirle).

5. **Test:**

   * `curl` ile `GET /<resource>?limit=...` ve `[by-slug]` doğrula.
   * FE’de veri geliyor mu? Konsol/Network hatası var mı?
   * Tip uyuşmazlığı kalmadı mı?

**Bitti Kriterleri:** DoD maddelerinin tümü ✅.

---

bu rehberi, bir sonraki modülde birebir uygularsan; önce UI’nın beklediği format netleşir, integrations katmanı **tek uçla** veriyi normalize eder, backend bu sözleşmeye uyacak şekilde eklenir, seed ile örnek veriler gelir ve FE hatasız render eder. böylece “hep aynı kalite ve hız” garantilenir.
