Kod tabanında kapsamlı bir inceleme yap. Aşağıdaki kontrol listesini sırasıyla uygula:

## 1. TypeScript Strict Uyumluluğu

- `any` tipi kullanılmış mı? Varsa `unknown` veya doğru tiple değiştir
- `import type { ... }` kullanılıyor mu? Tip-only importları düzelt
- Tüm fonksiyonların dönüş tipleri explicit mi?
- `strictNullChecks` ihlalleri var mı?
- `as` type assertion yerine type guard kullanılabilir mi?

## 2. RTK Query Best Practices (Frontend)

- Endpoint'ler doğru tag'leri provide/invalidate ediyor mu?
- `skip` parametresi gereksiz query'leri engelliyor mu?
- Error handling düzgün yapılmış mı?
- Loading state'ler handle ediliyor mu?
- Cache süresi uygun mu? (`keepUnusedDataFor`)

## 3. Drizzle ORM Best Practices (Backend)

- N+1 query problemi var mı? (for loop içinde query)
- İndexler uygun kolonlara eklenmiş mi?
- Transaction kullanılması gereken yerler var mı?
- `select()` sadece gerekli alanları çekiyor mu?
- Foreign key ilişkileri tanımlanmış mı?

## 4. Kod Tekrarı (DRY)

- Tekrarlanan kod blokları bul
- Ortak utility/helper fonksiyonlarına taşınabilecek kodları belirle
- Benzer pattern'ler için generic/reusable çözümler öner
- RTK endpoint'lerde tekrarlanan logic var mı?

## 5. Güvenlik Kontrolü

- SQL injection riski var mı? (Drizzle parametrize eder ama raw query dikkat)
- XSS riski var mı? (`dangerouslySetInnerHTML` kullanımı)
- Hassas veriler loglanıyor mu?
- Auth middleware eksik endpoint var mı?
- CORS ayarları uygun mu?
- Input validation yapılıyor mu? (Zod)

## 6. React Best Practices

- Gereksiz re-render var mı? (`useMemo`, `useCallback` eksik mi?)
- `key` prop'ları doğru kullanılıyor mu?
- useEffect dependency array'i doğru mu?
- Memory leak riski var mı? (cleanup eksik effect)
- Error boundary kullanılıyor mu?

## 7. shadcn-ui / Tailwind Kullanımı

- Tutarlı spacing kullanılıyor mu? (space-y-4, gap-4)
- Responsive breakpoint'ler uygulanmış mı? (md:, lg:)
- Dark mode uyumlu mu? (dark: prefix)
- cn() helper ile conditional class'lar mı?

## 8. Performans

- Büyük listeler virtualize edilmiş mi?
- Resimler optimize edilmiş mi? (lazy load, boyut)
- Bundle size kontrol edilmiş mi?
- API response'ları cache'leniyor mu?

## Çıktı Formatı

Her bulgu için:

| # | Kategori | Seviye | Dosya:Satır | Bulgu | Önerilen Düzeltme |
|---|----------|--------|-------------|-------|-------------------|
| 1 | TypeScript | 🔴 Kritik | src/pages/Admin.tsx:42 | `any` tipi | `Product[]` |
| 2 | RTK Query | 🟡 Önemli | endpoints.ts:15 | Tag eksik | `providesTags` ekle |
| 3 | Performance | 🟢 Öneri | ProductList.tsx:30 | Büyük liste | Virtualization |

**Seviyeler:**
- 🔴 Kritik: Güvenlik/hata riski, hemen düzeltilmeli
- 🟡 Önemli: Performans/maintainability etkisi
- 🟢 Öneri: İyileştirme fırsatı

Sonunda özet:
- Toplam bulgu sayısı (kategorilere göre)
- Öncelikli düzeltme sırası önerisi
