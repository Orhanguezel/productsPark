Sistem mimarisini tasarla veya mevcut mimariyi analiz et: $ARGUMENTS

## ProductsPark Mimari Yapısı

### Genel Bakış

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  React 18 + TypeScript + Vite + shadcn-ui + Tailwind        │
│  State: Redux Toolkit + RTK Query                           │
├─────────────────────────────────────────────────────────────┤
│                         API                                  │
│  REST API (Fastify)                                         │
│  Auth: JWT + Cookies                                        │
├─────────────────────────────────────────────────────────────┤
│                        BACKEND                               │
│  Fastify + TypeScript + Drizzle ORM                         │
├─────────────────────────────────────────────────────────────┤
│                       DATABASE                               │
│  MySQL 8+                                                   │
├─────────────────────────────────────────────────────────────┤
│                    EXTERNAL SERVICES                         │
│  Cloudinary (CDN) | PayTR (Payment) | SMTP (Email)          │
│  Telegram Bot (Notifications)                               │
└─────────────────────────────────────────────────────────────┘
```

### Backend Modül Yapısı

```
backend/src/
├── index.ts              ← Entry point
├── app.ts                ← Fastify app + route registration
├── core/
│   ├── env.ts            ← Environment variables
│   └── error.ts          ← Global error handler
├── db/
│   ├── client.ts         ← Drizzle + MySQL pool
│   └── seed/sql/         ← Seed dosyaları
├── common/
│   └── middleware/
│       └── auth.ts       ← requireAuth, requireAdmin
└── modules/
    └── [moduleName]/
        ├── schema.ts     ← Drizzle tablo tanımı
        ├── validation.ts ← Zod şemaları
        ├── controller.ts ← Public handler'lar
        ├── admin.controller.ts ← Admin handler'lar
        └── router.ts     ← Route tanımları
```

### Frontend Yapısı

```
frontend/src/
├── main.tsx              ← Entry point
├── App.tsx               ← Root component + providers
├── routes/
│   └── AppRoutes.tsx     ← Route definitions
├── components/
│   ├── ui/               ← shadcn-ui components
│   ├── layout/           ← Layout wrappers
│   ├── common/           ← Shared components
│   └── admin/            ← Admin components
├── pages/
│   ├── public/           ← User-facing pages
│   └── admin/            ← Admin pages
├── integrations/
│   ├── baseApi.ts        ← RTK Query base
│   ├── rtk/
│   │   ├── public/       ← Public endpoints
│   │   └── admin/        ← Admin endpoints
│   ├── hooks.ts          ← Hook exports
│   └── types.ts          ← API types
├── seo/                  ← SEO components
├── hooks/                ← Custom React hooks
├── lib/                  ← Utility functions
└── store/                ← Redux store
```

## Tasarım Kararları

### 1. Monorepo Yapısı
- `/frontend` ve `/backend` ayrı package.json
- Ortak tipler yok (her taraf kendi tiplerini tanımlar)
- Bağımsız build ve deploy

### 2. API Tasarımı
- RESTful pattern
- Public: `/api/[resource]`
- Admin: `/api/admin/[resource]`
- Auth middleware ile koruma

### 3. State Management
- RTK Query: Server state (API cache)
- Redux: Client state (cart, auth)
- React state: Local UI state

### 4. Database
- MySQL 8+ (production-ready)
- Drizzle ORM (type-safe, no runtime)
- UUID primary keys (char 36)
- Soft delete pattern (deleted_at)

### 5. Authentication
- JWT access token (memory)
- Refresh token (HTTP-only cookie)
- Automatic token refresh on 401

## Yeni Özellik Ekleme Akışı

```
1. Schema (Drizzle) → Tablo tanımı
         ↓
2. Validation (Zod) → Input/output şemaları
         ↓
3. Controller → Business logic
         ↓
4. Router → Endpoint registration
         ↓
5. RTK Query → Frontend API hooks
         ↓
6. Component/Page → UI implementation
```

## Performans Kriterleri

- API response < 200ms
- Page load < 2s
- Bundle size < 500KB (gzip)
- Lighthouse score > 90

## Güvenlik Kontrolleri

- [ ] Auth middleware tüm admin route'larda
- [ ] Input validation (Zod) her endpoint'te
- [ ] Rate limiting (production)
- [ ] CORS whitelist
- [ ] SQL injection koruması (Drizzle)
- [ ] XSS koruması (React default)

## Ölçeklenebilirlik

### Horizontal Scaling
- Stateless backend (JWT)
- Database connection pooling
- CDN for static assets

### Vertical Scaling
- Query optimization (indexes)
- Caching (RTK Query, HTTP cache)
- Lazy loading (React.lazy)
