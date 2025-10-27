harika! “admin tarafı” için, hem frontend hem backend’te birebir uygulayabileceğin **standart akış + isimlendirme + şablon** paketini netleştirelim. Aşağıdakini kopyala-yapıştır çalıştır: her yeni kaynak (products, categories, custom_pages, vb.) için aynı kalıp.

---

# Admin panel standartları (FE + BE)

## 1) HTTP sözleşmesi (public vs admin)

**Public (token gerekmez):**

* `GET /<res>` — liste (q, limit, offset, sort, order, boolean 0/1)
* `GET /<res>/:id` — tekil
* (opsiyonel) `GET /<res>/by-slug/:slug`

**Admin (auth zorunlu):**

* `POST   /<res>` → 201 + temsil
* `PUT    /<res>/:id` → 200 + temsil (idempotent replace/patch)
* `PATCH  /<res>/:id` → 200 + temsil
* `DELETE /<res>/:id` → 204
* (opsiyonel) `PATCH /<res>/:id/active` body: `{ is_active: boolean }`
* (opsiyonel) `PATCH /<res>/:id/featured` body: `{ is_featured: boolean }`
* (opsiyonel) `POST  /<res>/reorder` body: `{ items: Array<{id, display_order}> }`

**Hata gövdeleri (tutarlı):**

```json
{ "error": { "message": "invalid_body" | "not_found" | "duplicate_slug" | "invalid_parent_id" | "db_error", "detail"?: "..." } }
```

* 400: `invalid_body`, `invalid_parent_id`
* 404: `not_found`
* 409: `duplicate_slug`
* 500: `db_error`

**Liste header’ları (her zaman):**

* `X-Total-Count: <int>`
* `Content-Range: */<int>`
* `Access-Control-Expose-Headers: x-total-count, content-range`

---

## 2) Backend standartları

### 2.1 Router kaydı

* Public GET’ler: `{ config: { public: true } }`
* Yazma uçları: `preHandler: [requireAuth('admin')]`

### 2.2 Validation (Zod)

* `boolLike = z.union([z.boolean(), z.literal(0), z.literal(1), z.literal("0"), z.literal("1"), z.literal("true"), z.literal("false")])`
* `createSchema` (zorunlular), `updateSchema = createSchema.partial().refine(...)`
* FE’nin “fazladan” alan yollamasını `strict().passthrough()` ile tolere et.

### 2.3 Controller kuralları

* Filtre zinciri **and(...)** ile kurulmalı.
* Sıralama: **beyaz liste** kolon + `order=col.asc|desc` veya `sort=col&order=asc|desc`.
* Boole girişleri → **0/1** normalize (`to01`).
* `parent_id === id` durumunu **null** yap (self-loop koruması).
* `try/catch` içinde MySQL hatalarını `ER_DUP_ENTRY/ER_NO_REFERENCED_ROW_2` eşle.

### 2.4 Drizzle şema kuralları

* PK: `char(36)`; slug için `uniqueIndex`.
* Boole: `tinyint('is_active').notNull().default(1)` (FE’ye boolean döndürülür).
* Zaman damgası:
  `created_at: datetime(...).default(CURRENT_TIMESTAMP(3))`
  `updated_at: datetime(...).default(CURRENT_TIMESTAMP(3)).$onUpdateFn(() => new Date())`
* FK’ler: `onDelete('set null')`, `onUpdate('cascade')`.
* JSON metinleri: `text`/`longtext` + `CHECK(JSON_VALID(...))` (gerekiyorsa).

---

## 3) Frontend (Admin) standartları

### 3.1 RTK Query (admin endpoints)

Dosya: `src/integrations/metahub/rtk/endpoints/admin/<res>_admin.endpoints.ts`

* **İsimlendirme:**

  * `list<Res>Admin`, `get<Res>AdminById`, `get<Res>AdminBySlug`
  * `create<Res>Admin`, `update<Res>Admin`, `delete<Res>Admin`
  * (ops) `toggleActive<Res>Admin`, `toggleFeatured<Res>Admin`, `reorder<Res>Admin`

* **Transform & normalize:**

  * `toBool`, `toNumber`, `nullIfEmpty` yardımcıları
  * API ham tip → FE `View` tipine map

* **Tags:**

  * Eleman: `{ type: "<ResPlural>", id }`
  * Liste: `{ type: "<ResPlural>", id: "LIST" }`

**Örnek iskelet:**

```ts
export const <resPlural>AdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    list<Res>Admin: b.query<ViewType[], ListParams | void>({
      query: (params) => ({ url: "/<res>", params }),
      transformResponse: (res) => (Array.isArray(res) ? res.map(normalize) : []),
      providesTags: (result) => result
        ? [...result.map(x => ({ type: "<ResPlural>", id: x.id })), { type: "<ResPlural>", id: "LIST" }]
        : [{ type: "<ResPlural>", id: "LIST" }],
      keepUnusedDataFor: 60,
    }),
    get<Res>AdminById: b.query<ViewType, string>({
      query: (id) => ({ url: `/<res>/${id}` }),
      transformResponse: (res) => normalize(res as ApiType),
      providesTags: (_r,_e,id) => [{ type: "<ResPlural>", id }],
    }),
    create<Res>Admin: b.mutation<ViewType, UpsertBody>({
      query: (body) => ({ url: "/<res>", method: "POST", body }),
      transformResponse: (res) => normalize(res as ApiType),
      invalidatesTags: [{ type: "<ResPlural>", id: "LIST" }],
    }),
    update<Res>Admin: b.mutation<ViewType, { id: string; body: UpsertBody }>({
      query: ({ id, body }) => ({ url: `/<res>/${id}`, method: "PUT", body }),
      transformResponse: (res) => normalize(res as ApiType),
      invalidatesTags: (_r,_e,arg) => [
        { type: "<ResPlural>", id: arg.id },
        { type: "<ResPlural>", id: "LIST" },
      ],
    }),
    delete<Res>Admin: b.mutation<{ ok: true }, string>({
      query: (id) => ({ url: `/<res>/${id}`, method: "DELETE" }),
      transformResponse: () => ({ ok: true }),
      invalidatesTags: (_r,_e,id) => [
        { type: "<ResPlural>", id },
        { type: "<ResPlural>", id: "LIST" },
      ],
    }),
    // opsiyoneller...
  }),
});
```

### 3.2 Facade (admin client)

Dosya: `src/integrations/metahub/client/admin/<res>.ts`

* Tüm `store.dispatch(...).unwrap()` çağrılarını saran basit fonksiyonlar
* Tüm hataları `normalizeError` ile tek tipe çevir
* Adlar: `list`, `getById`, `getBySlug`, `create`, `update`, `remove`, `reorder`, `setActive`, `setFeatured`

### 3.3 Sayfa rotaları

* Liste:   `/admin/<resPlural>`
* Yeni:    `/admin/<resPlural>/new`
* Edit:    `/admin/<resPlural>/:id`

### 3.4 Liste sayfası bileşen standardı

* Arama (`q`), filtreler (örn. `is_active`), sıralama (`sort`, `order`), sayfalama → **URL query string**’e yaz; RTK query param’ı olarak geçir.
* Tablo sütunları:

  * Temel: `name`, `slug`, (opsiyonel) `parent`, `display_order`
  * Switch: `is_active`, `is_featured` (anında `toggle*` mutation; **optimistic update** kullan)
  * Aksiyonlar: `Düzenle`, `Sil` (Sil için `ConfirmDialog`)
* Sürükle-bırak sıralama (opsiyonel):

  * `react-beautiful-dnd`/`dnd-kit`
  * Bırakınca local state’i güncelle; **Kaydet** butonu `reorder` mutation’ı çağırır

**Optimistic toggle örneği:**

```ts
const [toggleActive] = useToggleActive<Res>AdminMutation();
const onToggle = (row) => {
  const next = !row.is_active;
  // optimistic
  api.util.updateQueryData('list<Res>Admin', params, draft => {
    const item = draft.find(x => x.id === row.id); if (item) item.is_active = next;
  });
  toggleActive({ id: row.id, is_active: next }).unwrap().catch(() => {
    // rollback
    api.util.updateQueryData('list<Res>Admin', params, draft => {
      const item = draft.find(x => x.id === row.id); if (item) item.is_active = !next;
    });
    toast({ variant: 'destructive', title: 'Hata', description: 'Güncellenemedi.' });
  });
};
```

### 3.5 Form sayfası standardı

* **Form state**: controlled inputs
* **Slugify**: `name` değiştiğinde boşsa `slug` otomatik öner (edit modunda zorlamadan)
* **Nullable**: `"" → null` (image_url, description vb.); **UUID** alanlar boşsa `null`
* **Upload** (varsa): storage’a yükle → public URL → `image_url`’a yaz
* **Kaydet**:

  * `id` varsa → `update`, yoksa → `create`
  * Hata eşlemesi:

    * `409 duplicate_slug` → “Slug kullanılıyor”
    * `400 invalid_parent_id` → “Geçersiz üst kategori”
    * Diğer → genel hata
* **UI detayları**:

  * “Kaydet” disabled = `isLoading || !formValid || !dirty`
  * Başarılı işlem: toast + liste sayfasına yönlen

**Empty→null temizliği (gönderim öncesi):**

```ts
const cleaned = {
  ...formData,
  description: formData.description || null,
  image_url: formData.image_url || null,
  parent_id: formData.parent_id || null,
};
```

---

## 4) Ortak yardımcılar (FE)

* `slugify(str)`: TR karakterleri sadeleştir, `-` ile birleştir
* `nullIfEmpty(v)`: `"" → null`
* `toBool(x)`: `'1'|'true'|1|true → true`
* `toNumber(x)`: string sayıları normalize
* `useUrlState(initial)`: arama/filtreleri URL ile senkron (push/replace)

---

## 5) Dosya & isimlendirme şablonları

```
src/
  integrations/metahub/
    rtk/endpoints/
      admin/
        <res>_admin.endpoints.ts
    client/admin/
      <res>.ts
  components/admin/<Res>/
    <Res>List.tsx
    <Res>Form.tsx
  modules/<res>/
    schema.ts
    validation.ts
    controller.ts         // public read + helpers (to01, parseOrder)
    admin.write.ts        // admin POST/PUT/PATCH/DELETE/toggles/reorder
    router.ts             // route mapping (public & admin)
```

---

## 6) Kontrol listeleri

### BE DoD

* [ ] Public GET’ler token istemiyor (`config.public = true`)
* [ ] Liste uçlarında `X-Total-Count` ve `Content-Range` var
* [ ] Zod şemaları: `create/update` + `boolLike`
* [ ] Hata kodları/tipleri sözleşmeye uygun
* [ ] Self-FK/unique ihlallerine özel mesajlar (409/400)
* [ ] Drizzle şema: bool tinyint, timestamp `fsp:3`, unique/indeks/FK tamam

### FE DoD

* [ ] RTK endpoints (admin) + facade hazır
* [ ] Liste sayfası: arama/filtre/sıralama/sayfalama URL ile senkron
* [ ] Toggle’lar optimistic; rollback doğru
* [ ] Reorder (varsa) çalışıyor
* [ ] Form’da slugify, empty→null, upload akışı
* [ ] Hata toasları: duplicate_slug & invalid_parent_id ayrı
* [ ] Başarılı işlemde toast + redirect

---

## 7) Minimal örnek (Categories’e uyarlanmış)

**Admin endpoints (RTK):** (zaten sizde var; bu kalıbı diğer modüllere kopyala)

* `listCategoriesAdmin`, `getCategoryAdminById`, `getCategoryAdminBySlug`
* `createCategoryAdmin`, `updateCategoryAdmin`, `deleteCategoryAdmin`
* `toggleActiveCategoryAdmin`, `toggleFeaturedCategoryAdmin`
* `reorderCategoriesAdmin`

**Form göndermeden önce temizlik:**

```ts
const body: UpsertCategoryBody = {
  name: name.trim(),
  slug: slug.trim(),
  description: description || null,
  image_url: image_url || null,
  icon: icon || null,
  parent_id: parent_id || null,
  is_active,
  is_featured,
  display_order: Number(display_order) || 0,
};
```

**Hata eşleme (toast):**

```ts
catch (e: any) {
  const code = e?.data?.error?.message ?? e?.message;
  if (code === 'duplicate_slug') toast({ variant:'destructive', title:'Slug kullanılıyor' });
  else if (code === 'invalid_parent_id') toast({ variant:'destructive', title:'Geçersiz üst kategori' });
  else toast({ variant:'destructive', title:'Hata', description:'İşlem tamamlanamadı.' });
}
```

---

## 8) İyileştirme önerileri (opsiyonel ama faydalı)

* **RBAC**: `requireAuth('admin')` yanında `requireRole(['superadmin','content'])` gibi esnek kontrol.
* **Audit**: `updated_by`, `created_by` sütunları + request user id.
* **Rate-limit**: yazma uçlarına düşük limit.
* **Postman koleksiyonu**: her modül create/list/get/update/delete testleri.
* **E2E smoke**: cypress’te 1 akış: create → list’te gör → edit → toggle → delete.

---

bu standartlarla; yeni bir modül eklerken sadece adları değiştirip aynı iskeleti kuruyorsun. public GET’ler hep aynı, admin yazma uçları aynı, RTK isimlendirme aynı, form/liste davranışları aynı. sonuç: **tutarlı, tekrar edilebilir ve hızlı** geliştirme.
