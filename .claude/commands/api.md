Yeni bir API endpoint oluştur: $ARGUMENTS

## ProductsPark Backend Yapısı

Backend: Fastify + TypeScript + Drizzle ORM + MySQL

### Modül Yapısı

Her modül şu dosyalardan oluşur:

```
backend/src/modules/[moduleName]/
├── router.ts           ← Route tanımları
├── controller.ts       ← Public endpoint handler'ları
├── admin.controller.ts ← Admin endpoint handler'ları (opsiyonel)
├── schema.ts           ← Drizzle ORM tablo tanımı
└── validation.ts       ← Zod validation şemaları
```

### 1. Schema (Drizzle ORM)

```typescript
// schema.ts
import { mysqlTable, varchar, char, text, int, boolean, datetime, index, foreignKey } from 'drizzle-orm/mysql-core';

export const items = mysqlTable('items', {
  id: char('id', { length: 36 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  is_active: boolean('is_active').default(true),
  created_at: datetime('created_at', { fsp: 3 }).notNull().defaultNow(),
  updated_at: datetime('updated_at', { fsp: 3 }).notNull().defaultNow(),
}, (t) => [
  index('items_name_idx').on(t.name),
]);
```

### 2. Validation (Zod)

```typescript
// validation.ts
import { z } from 'zod';

export const createItemSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  is_active: z.boolean().optional().default(true),
});

export const updateItemSchema = createItemSchema.partial();

export type CreateItemInput = z.infer<typeof createItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
```

### 3. Controller

```typescript
// controller.ts
import type { FastifyInstance, RouteHandler } from 'fastify';
import { db } from '@/db/client';
import { items } from './schema';
import { createItemSchema } from './validation';
import { eq } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';

export function makeItemController(app: FastifyInstance) {
  const list: RouteHandler = async (req, reply) => {
    const rows = await db.select().from(items);
    return reply.send(rows);
  };

  const getById: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
    const [row] = await db.select().from(items).where(eq(items.id, req.params.id)).limit(1);
    if (!row) return reply.code(404).send({ message: 'Not found' });
    return reply.send(row);
  };

  const create: RouteHandler = async (req, reply) => {
    const parsed = createItemSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ message: 'Validation error', errors: parsed.error.errors });
    }
    const id = uuid();
    await db.insert(items).values({ id, ...parsed.data });
    const [created] = await db.select().from(items).where(eq(items.id, id));
    return reply.code(201).send(created);
  };

  return { list, getById, create };
}
```

### 4. Router

```typescript
// router.ts
import type { FastifyInstance } from 'fastify';
import { makeItemController } from './controller';
import { requireAuth, requireAdmin } from '@/common/middleware/auth';

export async function registerItemRoutes(app: FastifyInstance) {
  const c = makeItemController(app);

  // Public endpoints
  app.get('/items', c.list);
  app.get('/items/:id', c.getById);

  // Admin endpoints (auth required)
  app.post('/admin/items', { preHandler: [requireAuth, requireAdmin] }, c.create);
}
```

### 5. app.ts'e Kayıt

```typescript
// app.ts
import { registerItemRoutes } from '@/modules/items/router';

// ... mevcut route'lar
await registerItemRoutes(app);
```

## Frontend RTK Query Endpoint

```typescript
// frontend/src/integrations/rtk/public/items.endpoints.ts
import { baseApi } from '@/integrations/baseApi';

export type Item = {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

const extendedApi = baseApi.enhanceEndpoints({ addTagTypes: ['Items'] });

export const itemsApi = extendedApi.injectEndpoints({
  endpoints: (b) => ({
    listItems: b.query<Item[], void>({
      query: () => ({ url: '/items' }),
      providesTags: [{ type: 'Items', id: 'LIST' }],
    }),
    getItemById: b.query<Item, string>({
      query: (id) => ({ url: `/items/${id}` }),
      providesTags: (result, error, id) => [{ type: 'Items', id }],
    }),
    createItem: b.mutation<Item, Partial<Item>>({
      query: (body) => ({ url: '/admin/items', method: 'POST', body }),
      invalidatesTags: [{ type: 'Items', id: 'LIST' }],
    }),
  }),
  overrideExisting: true,
});

export const { useListItemsQuery, useGetItemByIdQuery, useCreateItemMutation } = itemsApi;
```

## Kontrol Listesi

- [ ] Drizzle schema tanımlandı
- [ ] Zod validation yazıldı
- [ ] Controller fonksiyonları yazıldı
- [ ] Router oluşturuldu ve app.ts'e eklendi
- [ ] RTK Query endpoint'leri oluşturuldu
- [ ] Auth middleware eklendi (admin endpoint'leri için)
- [ ] Seed data gerekiyorsa eklendi
