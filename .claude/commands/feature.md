Yeni bir özellik geliştir: $ARGUMENTS

Aşağıdaki adımları sırasıyla uygula:

## 1. Analiz & Planlama

- Mevcut kod tabanını tara ve ilgili dosyaları bul
- Bu özelliğin hangi katmanlara dokunacağını belirle
- Bağımlılıkları ve etkilenen modülleri listele
- Planı onayım için sun

### ProductsPark Katman Yapısı

```
Backend:
├── modules/[name]/schema.ts      ← Drizzle tablo tanımı
├── modules/[name]/validation.ts  ← Zod şemaları
├── modules/[name]/controller.ts  ← Handler'lar
└── modules/[name]/router.ts      ← Route tanımları

Frontend:
├── integrations/rtk/[name].endpoints.ts  ← RTK Query
├── pages/[public|admin]/[Name].tsx       ← Sayfalar
└── components/[name]/                    ← Bileşenler
```

## 2. Backend Geliştirme

### a) Schema (Drizzle ORM)
```typescript
// modules/[name]/schema.ts
export const tableName = mysqlTable('table_name', {
  id: char('id', { length: 36 }).primaryKey(),
  // ... alanlar
  created_at: datetime('created_at', { fsp: 3 }).notNull().defaultNow(),
  updated_at: datetime('updated_at', { fsp: 3 }).notNull().defaultNow(),
}, (t) => [
  // indexes
]);
```

### b) Validation (Zod)
```typescript
// modules/[name]/validation.ts
export const createSchema = z.object({
  // ... alanlar
});
export type CreateInput = z.infer<typeof createSchema>;
```

### c) Controller
```typescript
// modules/[name]/controller.ts
export function makeController(app: FastifyInstance) {
  const list: RouteHandler = async (req, reply) => { ... };
  const create: RouteHandler = async (req, reply) => { ... };
  return { list, create };
}
```

### d) Router
```typescript
// modules/[name]/router.ts
export async function registerRoutes(app: FastifyInstance) {
  const c = makeController(app);
  app.get('/items', c.list);
  app.post('/admin/items', { preHandler: [requireAuth, requireAdmin] }, c.create);
}
```

### e) app.ts'e Kayıt
```typescript
import { registerRoutes } from '@/modules/[name]/router';
await registerRoutes(app);
```

## 3. Frontend Geliştirme

### a) RTK Query Endpoint'leri
```typescript
// integrations/rtk/[name].endpoints.ts
export const api = baseApi.enhanceEndpoints({ addTagTypes: ['Name'] }).injectEndpoints({
  endpoints: (b) => ({
    listNames: b.query<Name[], void>({
      query: () => ({ url: '/items' }),
      providesTags: [{ type: 'Name', id: 'LIST' }],
    }),
    // ...
  }),
});
export const { useListNamesQuery } = api;
```

### b) Sayfa Bileşeni
```typescript
// pages/public/NamePage.tsx
export default function NamePage() {
  const { data, isLoading, error } = useListNamesQuery();
  // ...
}
```

### c) Route Ekleme
```typescript
// routes/AppRoutes.tsx
<Route path="/items" element={<NamePage />} />
```

## 4. Seed Data (Opsiyonel)

```sql
-- db/seed/sql/XX.X_table_name.seed.sql
INSERT INTO `table_name` (...) VALUES (...)
ON DUPLICATE KEY UPDATE ...;
```

## 5. Admin Panel (Gerekiyorsa)

- List sayfası: `pages/admin/NameList.tsx`
- Form sayfası: `pages/admin/NameForm.tsx`
- Settings card: `pages/admin/settings/components/NameSettingsCard.tsx`

## 6. Test & Kontrol

```bash
# Backend build
cd backend && bun run build

# Frontend build
cd frontend && npm run build

# TypeScript kontrolü
tsc --noEmit
```

## Kontrol Listesi

- [ ] Drizzle schema tanımlandı
- [ ] Zod validation yazıldı
- [ ] Backend controller/router oluşturuldu
- [ ] app.ts'e route eklendi
- [ ] RTK Query endpoint'leri yazıldı
- [ ] Frontend sayfası oluşturuldu
- [ ] Route AppRoutes.tsx'e eklendi
- [ ] Admin panel sayfaları (gerekiyorsa)
- [ ] Seed data (gerekiyorsa)
- [ ] Build hatasız çalışıyor
