Süper—şimdi “yeni her admin modülü” için aynı hataları tekrar yaşamadan ilerleyeceğin **net bir yol haritası** ve **şablon** bıraktım. Aşamaları sırayla uygula; her adımın tam hangi dosyaya dokunduğunu da yazdım.

# 1) FE entegrasyon yol haritası (Metahub katmanı)

## 1.1 Tipler

* **Dosya:** `src/integrations/metahub/db/types/<module>.ts`
* **Yapılacaklar:**

  * `FooRow` (ham DB satırı) + `FooView` (UI’da kullandığın normalize görünüm) oluştur.
  * Upsert body için tip: `UpsertFooBody` (UI → BE giden alanlar).

## 1.2 Normalizer

* **Dosya:** `src/integrations/metahub/db/normalizers/<module>.ts`
* **Yapılacaklar:**

  * DB’nin tutabileceği farklı formatları **tek bir “View”** formatına çevir.
  * Ör: JSON/string alanları HTML’e, `0|1|"0"|"1"` → `boolean`, boş string → `null`.

## 1.3 URL builder (mutlaka!)

* **Dosya:** `src/integrations/metahub/db/from/qb/url/<module>.ts`
* **Kural:** **READ** → `/foo` (public), **WRITE** → `/admin/foo` (id varsa `/:id` **PATH** üzerinde; **asla** `?id=` değil).
* **Not:** “custom_pages”te yaptığımızın aynısı. `tryBuild<Module>(ctx)` yaz, sonra:

  **Dosya:** `src/integrations/metahub/db/from/qb/url/index.ts`
  `tryBuildCustomPages` nasıl bağlıysa sıralamaya **seninkini** de ekle (public önce, sonra generic).

## 1.4 Outgoing transforms (UI → BE)

* **Dosya:** `src/integrations/metahub/db/from/transforms.ts`
* **Yapılacaklar:**

  * `transform<Module>Out(obj)` ve gerekiyorsa `transform<Module>AdminOut(obj)` ekle.
  * Alan haritaları: `content_html` → `content: JSON.stringify({html})`, boolean → `0/1`, `""` → `null`, `id` body’den **sil** (update’ta path’te var).
  * **Entry point’e bağla:** `transformOutgoingPayload()` içinde

    * public: `if (path === "/<foo>") transformFooOut(obj)`
    * admin: `else if (path === "/admin/<foo>" || path.startsWith("/admin/<foo>/")) transformFooAdminOut(obj)`

## 1.5 RTK Query (admin endpoints)

* **Dosya:** `src/integrations/metahub/rtk/endpoints/admin/<module>_admin.endpoints.ts`
* **Yapılacaklar:**

  * `BASE = "/admin/<foo>"`.
  * `list`, `getById`, `create`, `update({id, body})`, `delete`.
  * `transformResponse` → `toView` ile normalize et.
  * `providesTags`/`invalidatesTags` ayarla (LIST + id).

## 1.6 “from()” adaptörü ile uyum

* **Zaten var:** `updateOp` hot-fix’i (query `?id=` → `/:id`) eklendi. Yeni modüller **doğru path’i** üretirse buna gerek kalmaz; yine de kalsın.
* **Kontrol listesi:**

  * `PATCH`/`PUT` URL **`/admin/<foo>/:id`** mi?
  * Body’de `id` var mı? → **sil**
  * `Prefer: return=minimal`/`representation` ihtiyaçlarına göre FE’de okuma akışın hazır mı?

---

# 2) FE sayfaları (Admin UI)

## 2.1 Liste sayfası

* **Dosya:** `src/pages/admin/<module>/List.tsx`
* **Yapılacaklar:**

  * `useList<Module>AdminQuery` ile getir.
  * Tablo kolonları `FooView`’e göre.
  * Silme: `useDelete<Module>AdminMutation` + `AlertDialog`.
  * Yayında/Taslak gibi badge’ler: boolean View alanından.

## 2.2 Form sayfası

* **Dosya:** `src/pages/admin/<module>/Form.tsx`
* **Yapılacaklar:**

  * `id` varsa `useGet...ByIdQuery(id)`; `setFormData` View’dan doldur.
  * **Kaydetme:**

    * `create`: `useCreate<Module>AdminMutation(body)`
    * `update`: `useUpdate<Module>AdminMutation({ id, body })`
  * **Dikkat:** `slug` normalizasyonu (küçült, boşluk → `-`, `[^a-z0-9-]` sil).
  * Rich-text varsa `content_html` alanı + transform’da JSON’a çevirme kuralı.

---

# 3) Backend yol haritası (Admin controller + router)

> Aşağıdaki şablon Fastify içindir; senin projedeki isimlendirme/katmanlara (service/repo) uyarlayabilirsin.

## 3.1 Router

* **Dosya:** `src/modules/<module>/admin.router.ts`
* **Yapı:**

  * `GET    /admin/<foo>`      → liste (+ `limit`, `offset`, `q`, `sort` desteği)
  * `POST   /admin/<foo>`      → oluştur
  * `PATCH  /admin/<foo>/:id`  → güncelle (**id path’te**)
  * `DELETE /admin/<foo>/:id`  → sil
* **Hooks:**

  * `preHandler`: admin auth (JWT/role), `X-Tenant` zorunluluğu.
  * `onSend`: tekil obje döndür, veya `Prefer` başlığına göre davran.

## 3.2 Controller

* **Dosya:** `src/modules/<module>/admin.controller.ts`
* **Dikkat:**

  * **Body mapping**: FE’nin gönderdiği `content_html` varsa `content = { html }` (DB’nin beklediğine göre JSON/string), boolean **tinyint** ise `true → 1`.
  * `id` body’den **okunmamalı** (path paramdan gelir).
  * Partial update: `PATCH` şeması **partial** olsun (Zod `z.object({...}).partial()`).
  * `slug` unique: 409 → mesaj `"duplicate_slug"`.
  * `updated_at` auto-set.
  * `returning`: FE listesine uygun alan seti (Row) → FE zaten normalize eder.

### Örnek iskelet

```ts
// admin.router.ts
export async function registerAdminFooRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAdminAuth);

  app.get('/admin/foo', listFoo);            // ?limit&offset&q&sort
  app.post('/admin/foo', createFoo);
  app.patch('/admin/foo/:id', updateFoo);
  app.delete('/admin/foo/:id', deleteFoo);
}
```

```ts
// admin.controller.ts (özet)
const fooBodySchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  content_html: z.string().optional(),
  content: z.string().optional(), // FE bazen direkt string de gönderebilir
  meta_title: z.string().nullable().optional(),
  meta_description: z.string().nullable().optional(),
  is_published: z.union([z.boolean(), z.number()]).optional(), // 0/1 ya da bool
}).partial({ /* PATCH için hepsi opsiyonel olabilir */ });

export async function updateFoo(req: FastifyRequest<{ Params: { id: string }, Body: unknown }>, res: FastifyReply) {
  const { id } = req.params;
  const body = fooBodySchema.parse(req.body ?? {});

  // mapping
  const record: any = { ...body, updated_at: new Date() };
  // content normalize
  const html = typeof record.content_html === 'string'
    ? record.content_html
    : (typeof record.content === 'string' ? record.content : '');
  if (html !== '') {
    record.content_html = html;
    record.content = JSON.stringify({ html });
  }
  // boolean normalize
  if (record.is_published !== undefined) {
    const v = record.is_published;
    record.is_published = v === true || v === 1 || v === '1' || v === 'true' ? 1 : 0;
  }
  delete record.id;

  const updated = await fooRepo.updateById({ id}, record);
  if (!updated) return res.status(404).send({ code: 'NOT_FOUND' });

  return res.send(updated); // tek satır Row döndür
}
```

## 3.3 Public router (opsiyonel ama önerilir)

* `GET /<foo>` ve `GET /<foo>/:id`
* **View normalizasyonunu** BE’de değil FE’de yapıyorsun; BE Row döndürsün yeter.

## 3.4 Validasyon & hata sözleşmesi

* 404: `{ code: "NOT_FOUND" }`
* 409: `{ code: "CONFLICT", message: "duplicate_slug" }`
* 400: `{ code: "BAD_REQUEST", details }`
* 500: `{ code: "INTERNAL" }`

---

# 4) “Definition of Done” kontrol listesi

**FE**

* [ ] `url/<module>.ts` → write ops **`/admin/<foo>/:id`** üretiyor
* [ ] `transforms.ts` → public/admin outbound dönüşümler eklendi
* [ ] `normalizers/<module>.ts` → View doğru
* [ ] RTK endpoints: `*_admin.endpoints.ts` + tags/invalidates
* [ ] Admin List/Form sayfaları çalışıyor; slug normalize

**BE**

* [ ] Router: `POST /admin/<foo>`, `PATCH /admin/<foo>/:id`, `DELETE /admin/<foo>/:id`
* [ ] Controller: `content_html`→`content(JSON)`, bool→0/1, `id` body’den kaldırılıyor
* [ ] Tenant filtresi tüm CRUD’da
* [ ] 409 duplicate slug döner
* [ ] `Prefer` başlığına uyum (gerekirse)

**Test**

* [ ] Create → 201/200 + FE list invalidate
* [ ] Update (id path) → 200; Network tab’da **query param id yok**
* [ ] Delete → 200/204; liste tazeleniyor
* [ ] Rich-text alanı round-trip: edit → save → reopen → içerik aynı
* [ ] Çok dilli ise `locale` round-trip

---

# 5) Tekrarlanabilir şablon (kopyala–yapıştır)

* **URL builder:** `tryBuild<Module>(ctx)` → READ `/foo`, WRITE `/admin/foo[/id]`
* **Transforms:** `transform<Module>Out` + `transform<Module>AdminOut` → entry point bağları
* **Normalizer:** `normalize<Module>Rows` → `toView`
* **RTK:** `foo_admin.endpoints.ts` + hooks
* **Admin UI:** `List.tsx`, `Form.tsx` (slug normalize, content_html, boolean Switch)
* **BE:** `admin.router.ts` + `admin.controller.ts` (id path, body map,errors)

Bu yol haritasını takip edersen yeni her modül “custom_pages”te çözdüğümüz tüm edge-case’lerle **out-of-the-box** uyumlu olur. İstersen ilk sıraya hangisini alacağımızı söyle; aynı şablonla kodu çıkarırım.
