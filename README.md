# Products Park

Products Park, katalog, siparis ve odeme akislarini yoneten bir commerce management workspace'idir. Mevcut checkout'ta Vite tabanli frontend ve Fastify backend bulunur.

## Workspace Yapisi

- `frontend/`: React + Vite tabanli arayuz, katalog ve yonetim ekranlari
- `backend/`: Fastify API, veri katmani, siparis ve odeme akisleri

## Dogrulanmis Teknoloji Yigini

- Frontend: React, TypeScript, Vite, Redux Toolkit, React Query, Radix UI, Shadcn UI, Tailwind CSS, React Hook Form, dnd-kit
- Backend: Fastify, Drizzle ORM, MySQL, Bun, Zod
- Entegrasyonlar: Cloudinary, Stripe, JWT, Google OAuth

## Komutlar

Frontend:

```bash
cd frontend
bun run dev
bun run build
bun run preview
```

Backend:

```bash
cd backend
bun run dev
bun run build
bun run start
bun run db:seed
```

## Dokumantasyon Notu

Bu projede urun kapsami, stack veya entegrasyonlar degisirse once `project.portfolio.json` guncellenir. README bu metadata ile senkron kalir.
