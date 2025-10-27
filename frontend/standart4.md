süper—aşağıya, projedeki mevcut yapıya birebir uyan **backend standartlarını** kısa ve uygulanabilir şekilde özetledim. (Her madde, daha önce konuştuğumuz sözleşme ve örneklerle uyumlu.) 

# Mimari katmanlar

* **Schema (Drizzle)** → tablo/indeks/ilişkiler. Bool = `tinyint(1)`, parasal = `decimal(p,s)`, zaman damgaları `datetime(..., { fsp: 3 })` + `DEFAULT CURRENT_TIMESTAMP(3)`; `updated_at` için `ON UPDATE` ya da Drizzle `.$onUpdateFn`. PK: `char(36)` UUID. Slug’lar için `uniqueIndex`. FK’lerde `onDelete('set null')`, `onUpdate('cascade')`. 
* **Validation (Zod)** → `create/update` gövdeleri; bool-like (`true/false/1/0/"1"/"0"`) normalize edin. 
* **Repository/Query** → `where(and(...))` ile filtre zinciri; sıralama için **beyaz liste** edilmiş kolon + yön. Sayım için `COUNT(*)`. 
* **Controller** → HTTP sözleşmesi + header’lar + normalize cevap. Liste uçlarında `X-Total-Count` **veya** `Content-Range` set edin, CORS için `Access-Control-Expose-Headers` ekleyin. 
* **Router** → Okuma uçları **public** (`config: { public: true }`), yazma uçları `requireAuth`. Kayıt sırası: auth/cors plugin’leri → router’lar. 

# HTTP sözleşmesi

* **Liste**: `GET /resource?limit&offset&sort&order&q&...`

  * `is_active` gibi boolean query değerleri **0/1** (opsiyonel: `true/false`) kabul eder. 
  * Dönüş **dizi** (veya `{ data: [] }`), toplam için `X-Total-Count` **ya da** `Content-Range: */<total>`. 
* **Tekil**: `GET /resource/:id`
* **Yardımcı**: `GET /resource/by-slug/:slug` gibi sugar uçlar olabilir. 
* **Oluştur/Güncelle/Sil**:

  * `POST` → `201` (+ mümkünse temsil; `Prefer: return=representation`).
  * `PATCH` → `200` (güncel temsil)
  * `DELETE` → `204` (gövdesiz). 

# Sıralama & sayfalama

* İki stil destekleyin:

  1. `sort=price&order=asc`
  2. Tek param: `order=price.asc` (`<col>.<dir>`)
     Her iki durumda da kolon adı **beyaz listeden** seçilmeli. `limit ≤ 100`, `offset ≥ 0`. 

# Normalize & tip güvenliği

* DECIMAL’ler string gelebilir → controller dönüşünde **sayıya çevirip** gönderin (FE’de ek normalize yoksa).
* JSON metin alanları (galeri, rozetler vb.) parse edilip **geçerli JSON** döndürülür.
* Boole alanlar (DB `tinyint`) FE’ye `boolean` olarak döner. 

# Hata yönetimi

* Controller’larda `try/catch` → tek tip hata gövdesi:
  `{ error: { message: 'validation_error' | 'not_found' | 'request_failed_XXX', details? } }`.
* Liste 404 **dönmez**; boş dizi döner. Tekil bulunamazsa **404**. 

# Güvenlik & performans

* Public GET’ler hariç **tüm** mutasyonlar `requireAuth`.
* Sorgularda string birleştirmeyin; Drizzle builder kullanın.
* İndeksler: slug, created_at, sık filtrelenen sütunlar.
* CORS + `credentials` senaryosunda sayım header’larını açmak için `Access-Control-Expose-Headers` ayarlayın. 

# Minimal örnekler

**Router**

```ts
app.get('/products', { config: { public: true } }, listProducts);
app.get('/products/:id', { config: { public: true } }, getProductById);
app.post('/products', { preHandler: [requireAuth] }, createProduct);
```

(Bu düzen, UI’nin token istemeden liste çekmesini sağlar; yazma uçları korumalıdır.) 

**Controller – liste (özet)**

```ts
const { limit = '50', offset = '0', sort, order } = (req.query ?? {}) as any;

const conds = [];
if (req.query?.category_id) conds.push(eq(products.category_id, req.query.category_id));
if (req.query?.is_active !== undefined) {
  const v = ['1','true'].includes(String(req.query.is_active)) ? 1 : 0;
  conds.push(eq(products.is_active, v as any));
}
const where = conds.length ? and(...conds) : undefined;

// order parsing: "price.asc" veya sort+order
const [col, dir = 'desc'] = (order?.includes('.') ? order : `${sort || 'created_at'}.${order || 'desc'}`).split('.');
const sortCol = col === 'price' ? products.price : col === 'rating' ? products.rating : products.created_at;
const orderBy = dir === 'asc' ? sortCol : desc(sortCol);

const [{ total }] = await db.select({ total: sql<number>`COUNT(*)` }).from(products).where(where as any);

const rows = await db.select({ p: products, c: { id: categories.id, name: categories.name, slug: categories.slug } })
  .from(products).leftJoin(categories, eq(products.category_id, categories.id))
  .where(where).orderBy(orderBy).limit(Math.min(+limit, 100)).offset(Math.max(+offset, 0));

reply.header('x-total-count', String(total));
reply.header('content-range', `*/${total}`);
reply.header('access-control-expose-headers', 'x-total-count, content-range');
reply.send(rows.map(r => ({ ...r.p, categories: r.c })));
```

(Burada hem filtre zinciri, hem sayım header’ları hem de iki stilli sıralama sözleşmesi uygulanıyor.) 

**Schema – kritik noktalar (Drizzle)**

```ts
export const products = mysqlTable('products', {
  id: char('id', { length: 36 }).primaryKey().notNull(),
  slug: varchar('slug', { length: 255 }).notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  original_price: decimal('original_price', { precision: 10, scale: 2 }),
  is_active: tinyint('is_active').notNull().default(1),
  created_at: datetime('created_at', { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  updated_at: datetime('updated_at', { fsp: 3 }).notNull()
    .default(sql`CURRENT_TIMESTAMP(3)`).$onUpdateFn(() => new Date()),
}, (t) => [
  uniqueIndex('products_slug_uq').on(t.slug),
]);
```

(Parasal alanlar `decimal`; timestamp’ler `fsp: 3`; slug unique index.) 

---

Bu standartları uygularsan: FE’nin “`metahub.from(...)/RTK` + normalize” katmanı hiçbir değişiklik istemez, endpoint’ler Postman’da nasıl dönüyorsa UI’da da aynen görünür. (Özellikle **public GET**, **sayım header’ı**, **0/1 boolean filtreleri** ve **sıralama sözleşmesi** vazgeçilmez.)
