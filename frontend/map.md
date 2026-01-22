Anladım. ProductsPark’ta artık “metahub/supabase kalıntıları”nı tamamen çıkarıp, **tek bir RTK katmanı + tek bir merkezi hooks export’u + tek bir merkezi types export’u** standardına geçiyoruz.

Aşağıya bunu “kural seti + hedef dosya yapısı + refactor adımları + örnek dönüşümler + risk/kontrol listesi” olarak net biçimde yazıyorum.

---

## 1) Yeni kesin standartlar (kararların teknik karşılığı)

### 1.1 RTK endpoint’leri artık tek merkezden çekilecek

* Endpoint dosyaları nerede durursa dursun (ör. `src/integrations/rtk/endpoints/...`), **kullanım noktalarında asla direkt import edilmeyecek**.
* Tüm hook’lar şuradan tüketilecek:

**`src/integrations/rtk/hooks/index.ts`**

* Buradan `export *` ile **tüm RTK hook’ları** dışarı açılır.
* Uygulama kodunda izin verilen tek import örneği:

  * `import { useListProductsQuery, useCreateProductMutation } from '@/integrations/rtk/hooks';`

### 1.2 Tipler de aynı şekilde merkezi çekilecek

* Tipler tek “barrel”dan tüketilecek:

Önerilen: **`src/integrations/rtk/types/index.ts`** (veya sizde mevcutsa `src/integrations/types/index.ts`)

* Uygulama kodunda izin verilen tek import örneği:

  * `import type { ProductDto, ProductCreatePayload } from '@/integrations/types';`

### 1.3 Client facade katmanı kaldırılıyor

Aşağıdakiler **tamamen iptal**:

* `src/integrations/metahub/client/<module>/client.ts`
* “store.dispatch(...).unwrap() ile servis yazma” yaklaşımı

Bunun yerine:

* UI doğrudan RTK hook’larını kullanır.
* Eğer “hook kullanılamayan” (server action, util, node script) bir yer varsa, onu ayrıca konuşuruz; ama default yaklaşım RTK hooks.

### 1.4 Supabase “from() / qb / transforms / normalizeTables” kalıntıları temizlenecek

Aşağıdakiler **kademeli olarak projeden çıkarılacak**:

* `src/integrations/metahub/db/from.ts` ve ona bağlı qb/url/transforms/normalizeTables katmanları
* metahub “from('table')” çağrıları

---

## 2) Hedef klasör yapısı (önerilen nihai düzen)

Aşağıdaki yapı “tek yerden export” ihtiyacınızı temiz çözer:

```
src/integrations/rtk/
  baseApi.ts
  tagTypes.ts           (opsiyonel ama tavsiye)
  endpoints/
    products.endpoints.ts
    categories.endpoints.ts
    admin/
      products_admin.endpoints.ts
      ...
  hooks/
    index.ts            (TEK hook barrel)
  types/
    index.ts            (TEK type barrel)
    products.types.ts
    categories.types.ts
```

Not: Siz “endpoints”leri nereye taşıyacağınızı henüz söylemediniz; ama **metahub** klasöründen çıkarmak hedef olduğuna göre bu şema en temiz olanı.

---

## 3) Refactor planı (sıra önemli)

### Adım A — Merkezi “hooks barrel”ı kur

`src/integrations/rtk/hooks/index.ts` içinde:

* Tüm endpoints dosyalarının export ettiği hook’ları buraya re-export edin.

Örnek:

```ts
// src/integrations/rtk/hooks/index.ts
export * from '@/integrations/rtk/endpoints/products.endpoints';
export * from '@/integrations/rtk/endpoints/categories.endpoints';
export * from '@/integrations/rtk/endpoints/admin/products_admin.endpoints';
// ...
```

Kural: Uygulama içinde `endpoints/...` import’u **yasak**; sadece `hooks` üzerinden.

### Adım B — Merkezi “types barrel”ı kur

`src/integrations/rtk/types/index.ts` içinde:

```ts
export * from './products.types';
export * from './categories.types';
export * from './common.types'; // varsa
```

Kural: Uygulama içinde tip import’u **tek yerden**.

### Adım C — Facade kullanım noktalarını RTK hook’a çevir

Arama yapmanız gereken tipik kalıplar:

* `metahub.<module>.list(...)`
* `metahub.<module>.getById(...)`
* `client/<module>/client.ts` import eden yerler

Dönüşüm yaklaşımı:

**Önce (facade):**

* `const { data, error } = await products.list(params)`

**Sonra (RTK):**

* Liste sayfası: `const { data, isLoading, error } = useListProductsQuery(params)`
* Form sayfası (create/update):

  * `const [createProduct, createState] = useCreateProductMutation()`
  * `await createProduct(body).unwrap()`

Bu adımda en kritik iki konu:

1. `.unwrap()` ile hata yönetimi
2. cache invalidate/tag stratejisi (zaten endpoints içinde)

### Adım D — metahub/from() çağrılarını RTK query’ye taşı

* `from('products').select().eq().order().range()` gibi yerler RTK list query param’larına çevrilecek.
* Bu dönüşümde “query param sözleşmesi” net olmalı: `q/limit/offset/sort/order` vs.

### Adım E — Metahub klasörünü kademeli sil

Kullanım kalmadığında:

* `src/integrations/metahub/client/**` komple sil
* `src/integrations/metahub/db/**` (from/qb/transforms/normalizeTables) komple sil
* `src/integrations/metahub/**` altında sadece “hala kullanılan” şey varsa taşınır; yoksa klasör kapanır.

---

## 4) Endpoint dosyalarında dikkat edilmesi gereken yeni standartlar

Facade kalkınca, endpoint dosyaları daha kritik hale gelir:

1. **normalize/transformResponse burada olmalı**
   Eskiden normalizeTables/from/transforms yapıyordu; artık:

* `transformResponse` içinde API shape → UI shape normalize edilecek.

2. **tagTypes ve invalidation tutarlı olmalı**

* LIST + id standardı
* create/update/delete → LIST invalidate
* update/delete → entity id invalidate

3. **admin/public ayrımı net olmalı**

* admin endpoints: `/admin/...`
* public endpoints: `/...`

---

## 5) Örnek “import dönüşümü” (uygulama kodu)

### Eski:

```ts
import { products } from '@/integrations/metahub/client/products/client';
import type { Product } from '@/integrations/metahub/db/types';
```

### Yeni:

```ts
import { useListProductsQuery, useCreateProductMutation } from '@/integrations/rtk/hooks';
import type { ProductDto, ProductCreatePayload } from '@/integrations/types';
```

---

## 6) Riskler ve kontrol listesi (refactor sırasında kırılacak tipik yerler)

1. **Circular dependency**

* `hooks/index.ts` ↔ `endpoints/*` ↔ `types/index.ts` döngüsüne düşmeyin.
* Tipler endpoints’ten değil, endpoints tiplerden import etmeli.

2. **baseApi.injectEndpoints sırası / overrideExisting**

* Aynı endpoint adıyla iki kez inject ederseniz RTK çakışır. Gerekliyse `overrideExisting: true`.

3. **TagTypes listesi eksikse cache bozulur**

* baseApi’de `tagTypes` tanımı yeni modülleri kapsıyor mu kontrol edin.

4. **metahub’dan kalan “outgoing transforms” yok olacağı için**

* Eskiden body’den `id` silme, `""→null`, `boolean→0/1` dönüşümleri metahub transforms ile yapılıyorsa,
  bunları endpoint `query` içinde veya UI submit öncesinde net biçimde yapmalısınız.

---

## 7) Net aksiyon: bir “migration checklist”

* [ ] `src/integrations/rtk/hooks/index.ts` oluşturuldu, tüm hook’lar buradan export ediliyor.
* [ ] `src/integrations/rtk/types/index.ts` oluşturuldu, tüm tipler buradan export ediliyor.
* [ ] Uygulamada `metahub/client` import’u kalmadı.
* [ ] Uygulamada `metahub/db/from` kullanım kalmadı.
* [ ] baseApi `tagTypes` güncel, endpoint inject çakışması yok.
* [ ] metahub klasörü boşaldıysa silindi.

---

İstersen bir sonraki adım olarak, “en yüksek etkiyle en az dosya değiştiren” sırayla başlayalım: genelde ilk hedef **1 modülü** (ör. `custom_pages` veya `products`) tamamen yeni standarda geçirmek olur; sonra aynı kalıbı tüm modüllere uygularız. Bu yaklaşım, büyük refactor’u kontrollü ve hızlı bitirir.
