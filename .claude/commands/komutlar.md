Bunlar zaten Claude Code oturumunun içinde yazılan komutlar — terminalde ayrıca bir şey çalıştırmanıza gerek yok.

## ProductsPark Komut Listesi

### Geliştirme Komutları

| Komut | Açıklama |
|-------|----------|
| `/productsPark:feature <özellik>` | Yeni özellik geliştir |
| `/productsPark:api <endpoint>` | Yeni API endpoint oluştur |
| `/productsPark:component <bileşen>` | Yeni UI bileşeni oluştur |
| `/productsPark:admin <entity>` | Admin panel CRUD sayfaları oluştur |
| `/productsPark:migrate <tablo>` | Veritabanı migration oluştur |
| `/productsPark:settings <ayar>` | site_settings ayarı ekle/düzenle |

### Kod Kalitesi Komutları

| Komut | Açıklama |
|-------|----------|
| `/productsPark:review` | Kapsamlı kod incelemesi yap |
| `/productsPark:scan <kapsam>` | Proje prensiplerine aykırı durumları tara |
| `/productsPark:refactor <kod>` | Belirtilen kodu refactor et |
| `/productsPark:architect <konu>` | Mimari analiz veya tasarım |

### Git Komutları

| Komut | Açıklama |
|-------|----------|
| `/productsPark:commit` | Conventional commit oluştur |
| `/productsPark:push` | Hızlı commit ve push |
| `/productsPark:branch <isim>` | Yeni feature branch oluştur |
| `/productsPark:pr` | Pull request oluştur |

## Örnek Kullanımlar

```
/productsPark:feature ürün stok yönetimi
/productsPark:api /admin/reports endpoint'i
/productsPark:component ProductCard bileşeni
/productsPark:admin coupons modülü
/productsPark:migrate user_preferences tablosu
/productsPark:settings pwa_splash_image ayarı
/productsPark:review
/productsPark:scan src/pages/admin
/productsPark:refactor cart modülünü optimize et
/productsPark:commit
```

## Proje Yapısı Özeti

```
productsPark/
├── frontend/           ← React + Vite + RTK Query + shadcn-ui
│   └── src/
│       ├── components/ ← UI bileşenleri
│       ├── pages/      ← Sayfa bileşenleri
│       ├── integrations/rtk/ ← RTK Query endpoint'leri
│       └── seo/        ← SEO bileşenleri
│
└── backend/            ← Fastify + Drizzle ORM + MySQL
    └── src/
        ├── modules/    ← Feature modülleri
        │   └── [name]/
        │       ├── schema.ts
        │       ├── validation.ts
        │       ├── controller.ts
        │       └── router.ts
        └── db/seed/sql/ ← Seed dosyaları
```

## Hızlı Referans

- **Package Manager**: Bun (backend), npm (frontend)
- **ORM**: Drizzle ORM
- **State**: Redux Toolkit + RTK Query
- **UI**: shadcn-ui + Tailwind CSS
- **Validation**: Zod (backend + frontend)
- **Auth**: JWT + HTTP-only cookies
