# ProductsPark Frontend

E-ticaret platformu frontend uygulaması.

## Teknolojiler

- **React 18** + TypeScript
- **Vite** - Build tool
- **Redux Toolkit** + RTK Query - State management & API
- **shadcn-ui** + Tailwind CSS - UI components
- **Zod** - Validation
- **react-helmet-async** - SEO

## Kurulum

```bash
# Bağımlılıkları yükle
npm install

# Development server başlat
npm run dev

# Production build
npm run build

# Type check
npm run typecheck
```

## Proje Yapısı

```
src/
├── components/
│   ├── ui/           # shadcn-ui bileşenleri
│   ├── layout/       # Layout wrapper'lar
│   ├── common/       # Paylaşılan bileşenler
│   └── admin/        # Admin bileşenleri
├── pages/
│   ├── public/       # Kullanıcı sayfaları
│   └── admin/        # Admin panel sayfaları
├── integrations/
│   ├── baseApi.ts    # RTK Query base config
│   ├── rtk/
│   │   ├── public/   # Public API endpoint'leri
│   │   └── admin/    # Admin API endpoint'leri
│   ├── hooks.ts      # Hook export'ları
│   └── types.ts      # API tipleri
├── seo/              # SEO bileşenleri (GlobalSeo, meta)
├── hooks/            # Custom React hook'lar
├── lib/              # Utility fonksiyonlar
├── store/            # Redux store config
└── routes/           # Route tanımları
```







## Scripts

| Script | Açıklama |
|--------|----------|
| `npm run dev` | Development server (port 8080) |
| `npm run build` | Production build |
| `npm run preview` | Build önizleme |
| `npm run typecheck` | TypeScript kontrolü |
| `npm run lint` | ESLint kontrolü |

## Environment Variables

`.env` dosyası oluştur:

```env
VITE_API_URL=http://localhost:3000
```



## Backend

Backend uygulaması `/backend` klasöründe. Detaylar için [backend/README.md](../backend/README.md) dosyasına bakın.
