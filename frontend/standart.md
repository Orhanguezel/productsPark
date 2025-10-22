harika—ürün akışı çalıştıysa şimdi bunu “standartlaştırıp” her yeni modülde (örn. orders, carts, coupons, vb.) aynı kaliteyle tekrarlayabiliriz. aşağıya; **mimarinin kısa özeti**, **genel kurallar**, **adım adım yapılacaklar** ve **tam bir şablon** (RTK endpoint + client facade + slice + `from()` adaptasyonu + export’lar + BE sözleşmesi) koydum. sonunda da “orders” diye örnek bir modülün kod şablonlarını verdim. hepsi **no-any**, tip güvenli.

---

# mimari özeti (var olan modele göre)

* **RTK Query katmanı**: `/rtk/endpoints/*.endpoints.ts`

  * REST uçları burada tanımlı; `transformResponse` ile **normalize** ediyoruz (örn. `string` sayıları `number`’a, JSON-string alanları array’e çeviriyoruz).
  * `tagTypes`/`providesTags`/`invalidatesTags` ile cache politikası tutarlı.

* **Facade katmanı**: `/client/*/client.ts`

  * RTK endpoint’lerini saran küçük bir servis: sade metotlar (`list`, `getById`, …) ve gerekirse UI state slice’ına yazma (örn. `setLastQuery`, `setSelectedId`).

* **UI bağımsız sorgulama**: `/db/from.ts`

  * `metahub.from("table")` → Supabase benzeri query builder; **REST adapter** ile `/products`, `/categories` gibi uçlara çevirir.
  * Yeni tablo eklerken sadece `TABLE_PATH` ve gerekiyorsa küçük bir param eşleme ekliyorsun; UI’yı değiştirmiyorsun.

* **Ortaklar**:

  * `/rtk/baseApi.ts` → auth/tenancy header’ları, 401→refresh retry.
  * `/core/errors.ts` → `normalizeError`.
  * `/core/public-api.ts` → dışa açılan tipler & facade antetleri.
  * `/client.ts` → tek giriş noktası (`metahub` objesi; servisleri/fonksiyonları/rtk’yi ihraç eder).

---

# genel kurallar

1. **İsimlendirme**

   * Dosya: `xxx.endpoints.ts`, `client.ts`, `slice.ts`
   * Tag adı: çoğul “LIST”, tekil “Entity”
   * Endpoint fonksiyonları: `listXxx`, `getXxxById`, `getXxxBySlug` (varsa), alt-kaynaklar `listXxxItems`

2. **Tip güvenliği**

   * **`any` asla yok**.
   * “Ham API tipi” (`ApiModel`) + “Normalize edilmiş tip” (`Model`) ayrımı yap.
   * `unknown` → type guard/`tryParse<T>` ile çöz.

3. **Normalize etme**

   * `number | string` alanları sayıya çevir (`toNumber`, `numOrNullish`).
   * JSON-string alanları `tryParse<T>` ile nesne/array yap.
   * 0/1/boolean alanları UI tarafında boolean olarak kullanmak istiyorsak normalize et (veya tipte `0 | 1 | boolean` bırak).

4. **Hata yönetimi**

   * Facade’larda her `catch` → `normalizeError(e)`; `{ data: null, error: { message } }` döndür.
   * UI `if (error) throw error` tarzını bozmayalım.

5. **Pagination & Count**

   * Listelemede REST `limit/offset/sort/order`.
   * Toplam sayım gerekiyorsa `from().select("*", { head: true, count: 'exact' })` ile header’dan `X-Total-Count`/`Content-Range` okumayı deneriz.

6. **Boole filter mapping**

   * BE `is_active` gibi bayrakları `1/0` istiyorsa adapter `boolTo01` ile map’ler.
   * RTK `query({ params: { is_active: flag ? 1 : 0 } })`.

7. **Cache etiketleri**

   * LIST: `{ type: "Entities", id: "LIST" }`
   * Tekil: `{ type: "Entity", id }`
   * Alt koleksiyonlar: `{ type: "SubEntity", id: parentId }`

8. **Export düzeni**

   * Yeni endpoint dosyasını `/rtk/index.ts`’te `export * from "./endpoints/xxx.endpoints";`
   * Yeni facade’ı `/client.ts` içine ekle (ve `as const` metahub alanına).

9. **from() adaptörü**

   * `TABLE_PATH`’e tabloyu ekle.
   * Tabloya özgü farklı param/filtre eşleme gerekirse küçük bir “mapper” yaz (ör: `only_active` → `1/0`).

10. **Backend sözleşmesi (minimum)**

    * `GET /resource?limit=&offset=&sort=&order=&q=&is_active=1/0&...`
    * `GET /resource/:id`
    * (opsiyonel) `GET /resource/by-slug/:slug`
    * Toplam için **`X-Total-Count`** ya da **`Content-Range: items start-end/total`** (tavsiye edilen).
    * Liste dönüşü **array** ya da `{ data: [] }` (ikisini de normalize ediyoruz).

---

# adım adım: yeni modül nasıl eklenir?

1. **Tipleri yaz** (`ApiXxx` + normalize edilmiş `Xxx`)
2. **RTK endpoints** dosyasını oluştur (`/rtk/endpoints/xxx.endpoints.ts`)

   * `listXxx`, `getXxxById`, gerekiyorsa `getXxxBySlug`
   * `transformResponse` ile normalize et
   * `providesTags` / `invalidatesTags` ayarla
3. **Slice (opsiyonel)**: UI’de sorgu/selection tutmak gerekiyorsa (`/rtk/slices/xxx/slice.ts`)
4. **Client facade**: (`/client/xxx/client.ts`)

   * RTK’yi `store.dispatch(...).unwrap()` ile saran sade metotlar; slice’a yaz.
5. **from() adaptörü**: `/db/from.ts` → `TABLE_PATH.xxx = "/xxx"`

   * Özel paramlar için eşleme gerekiyorsa yap (örn. `only_active` → `1/0`).
6. **Export’lar**:

   * `/rtk/index.ts`’e `export * from "./endpoints/xxx.endpoints";` ekle
   * `/client.ts`’e `import { xxx } from "./client/xxx/client";` ve `metahub` objesine ekle
7. **ENV / baseApi**: Gerekirse yeni uç **`VITE_API_URL`** altında. Auth/tenancy header’ları `baseApi` zaten ekliyor.
8. **Test**:

   * Postman ile uçları doğrula
   * Storybook/route’da `useListXxxQuery` ve `metahub.from("xxx")` ile smoke test
   * 401/refresh akışını bir kere deneyerek doğrula

---

# şablonlar (kopyala-yapıştır)

Aşağıdaki şablonda “**orders**” diye hayali bir modül veriyorum. Alan isimlerini kendi BE’nize göre değiştirin.

## 1) RTK endpoints – `src/integrations/metahub/rtk/endpoints/orders.endpoints.ts`

```ts
import { baseApi } from "../baseApi";

// --- Normalize yardımcıları ---
const toNumber = (x: unknown): number => (typeof x === "number" ? x : Number(x as unknown));
type NullableNumber = number | null | undefined;
const numOrNullish = (x: unknown): NullableNumber => (x == null ? (x as null | undefined) : toNumber(x));
const tryParse = <T>(x: unknown): T => {
  if (typeof x === "string") {
    try { return JSON.parse(x) as T; } catch { return x as unknown as T; }
  }
  return x as T;
};

// --- Tipler ---
export type Order = {
  id: string;
  user_id: string;
  status: "pending" | "paid" | "shipped" | "cancelled";
  total_price: number;
  currency: string;
  items: Array<{ sku: string; name: string; qty: number; price: number }>;
  created_at: string;
  updated_at: string;
};

// BE’nin ham tipi (örn. bazı alanlar string/JSON-string gelebilir)
type ApiOrder = Omit<Order, "total_price" | "items"> & {
  total_price: number | string;
  items: string | Order["items"];
};

const normalizeOrder = (o: ApiOrder): Order => ({
  ...o,
  total_price: toNumber(o.total_price),
  items: tryParse<Order["items"]>(o.items),
});

export const ordersApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listOrders: b.query<
      Order[],
      { user_id?: string; status?: Order["status"]; limit?: number; offset?: number; sort?: "created_at" | "total_price"; order?: "asc" | "desc" }
    >({
      query: (params) => ({ url: "/orders", params }),
      transformResponse: (res: unknown): Order[] => {
        if (!Array.isArray(res)) return [];
        return (res as ApiOrder[]).map(normalizeOrder);
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((o) => ({ type: "Order" as const, id: o.id })),
              { type: "Orders" as const, id: "LIST" },
            ]
          : [{ type: "Orders" as const, id: "LIST" }],
    }),

    getOrderById: b.query<Order, string>({
      query: (id) => ({ url: `/orders/${id}` }),
      transformResponse: (res: unknown): Order => normalizeOrder(res as ApiOrder),
      providesTags: (_r, _e, id) => [{ type: "Order", id }],
    }),

    // örnek: GET /orders/by-user/:userId
    listOrdersByUser: b.query<Order[], string>({
      query: (userId) => ({ url: `/orders/by-user/${userId}` }),
      transformResponse: (res: unknown): Order[] =>
        Array.isArray(res) ? (res as ApiOrder[]).map(normalizeOrder) : [],
      providesTags: (_r, _e, userId) => [{ type: "Orders", id: `USER_${userId}` }],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListOrdersQuery,
  useGetOrderByIdQuery,
  useListOrdersByUserQuery,
} = ordersApi;
```

> Not: Tag listesine `Order` / `Orders` eklenecek (bkz. aşağıda baseApi yorumları).

## 2) Facade – `src/integrations/metahub/client/orders/client.ts`

```ts
import { store } from "@/store";
import { normalizeError } from "@/integrations/metahub/core/errors";
import { ordersApi, type Order } from "@/integrations/metahub/rtk/endpoints/orders.endpoints";

export type { Order };

export const orders = {
  async list(params?: Parameters<typeof ordersApi.endpoints.listOrders.initiate>[0]) {
    try {
      const data = await store.dispatch(ordersApi.endpoints.listOrders.initiate(params ?? {})).unwrap();
      return { data: data as Order[], error: null as null };
    } catch (e) {
      const { message } = normalizeError(e);
      return { data: null as Order[] | null, error: { message } };
    }
  },

  async getById(id: string) {
    try {
      const data = await store.dispatch(ordersApi.endpoints.getOrderById.initiate(id)).unwrap();
      return { data: data as Order, error: null as null };
    } catch (e) {
      const { message } = normalizeError(e);
      return { data: null as Order | null, error: { message } };
    }
  },

  async listByUser(userId: string) {
    try {
      const data = await store.dispatch(ordersApi.endpoints.listOrdersByUser.initiate(userId)).unwrap();
      return { data: data as Order[], error: null as null };
    } catch (e) {
      const { message } = normalizeError(e);
      return { data: null as Order[] | null, error: { message } };
    }
  },
};
```

> Slice şart değil; gerekirse `lastQuery/selectedId` paterni ekleyebilirsin.

## 3) from() adaptörü – `src/integrations/metahub/db/from.ts`

`TABLE_PATH`’e tabloyu ekle:

```ts
const TABLE_PATH: Record<string, string> = {
  products: "/products",
  categories: "/categories",
  orders: "/orders",            // <-- yeni
};
```

Gerekirse özel param map’i (örn. `status` yalnızca belirli değerler ise) ekleyebilirsin; mevcut adapter zaten `eq("status", "...")` → `?status=...` yapıyor.

## 4) RTK export – `src/integrations/metahub/rtk/index.ts`

```ts
export * from "./endpoints/orders.endpoints";
```

> `baseApi` içindeki `tagTypes` listesine `Order`, `Orders` eklendiğinden emin ol:

```ts
// baseApi.ts
tagTypes: [
  "Auth","User","Functions","Profile",
  "Products","Product","Categories","Faqs","Reviews","Options","Stock",
  "Order","Orders"   // <-- yeni
],
```

## 5) Client giriş noktası – `src/integrations/metahub/client.ts`

```ts
import { orders } from "./client/orders/client";

export const metahub = {
  // ...
  orders,   // <-- ekle
  // ...
} as const;
```

## 6) UI kullanımı (iki yol)

* **RTK hook’ları**:

  ```ts
  const { data: orders, isLoading } = metahub.api.useListOrdersQuery({ limit: 20, offset: 0, sort: "created_at", order: "desc" });
  ```

* **from() ile** (UI kalıbına tam uyum):

  ```ts
  const { data, error, count } = await metahub.from<Order>("orders")
    .select("*", { count: "exact", head: true });

  const list = await metahub.from<Order>("orders")
    .select("*")
    .eq("status", "paid")
    .order("created_at", { ascending: false })
    .range(0, 19);
  ```

---

# backend uyum sözleşmesi (önerilen)

Her kaynak için asgari:

* `GET /{resource}`:
  Query paramları: `limit`, `offset`, `sort`, `order`, alan filtreleri (örn. `status`, `user_id`, `is_active=1/0`)
  Dönen: `200` + `[]` (veya `{ data: [] }`)
  **Toplam**: `X-Total-Count` *veya* `Content-Range: items 0-11/123`

* `GET /{resource}/:id`
  Dönen: `200` + tek kayıt

* (Opsiyonel) `GET /{resource}/by-slug/:slug` / `…/by-user/:userId` gibi yardımcı uçlar

* Boole query’ler **`1/0`** kabul etsin (adapter bunu gönderiyor).

> Böylece UI değişmeden `from()` ve RTK aynı anda uyumlu çalışır.

---

# QA / kontrol listesi

* [ ] Endpoint Postman ile 200 dönüyor mu?
* [ ] `transformResponse` sonrası sayısal/JSON alanlar doğru tipte mi?
* [ ] `tagTypes` eklendi mi, `providesTags` çalışıyor mu?
* [ ] Facade metotları `normalizeError` ile kapsandı mı?
* [ ] `from()` → `TABLE_PATH` eklendi mi? Count header’ları var mı?
* [ ] 401 → refresh → retry akışı (baseApi) düzgün mü?
* [ ] UI’da hem RTK hook hem `from()` senaryosu smoke test.

---

bu standartla, yeni bir modül eklemek *maksimum 10–15 dk** sürer: tipleri yaz, endpointleri ekle, gerekirse facade+slice, `TABLE_PATH`e adını koy, export et. backend’de de yukarıdaki minimal sözleşmeye uyduğunda, **UI’yi hiç ellemeye gerek kalmadan** çalışır.
