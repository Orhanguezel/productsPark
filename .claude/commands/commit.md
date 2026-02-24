Git değişikliklerini incele ve commit oluştur.

## Adımlar

1. `git status` ve `git diff` ile değişiklikleri incele
2. Değişiklikleri mantıksal gruplara ayır (gerekirse birden fazla commit)
3. Her grup için Conventional Commit formatında mesaj oluştur

## Conventional Commit Formatı

```
<tip>(<kapsam>): <açıklama>

[opsiyonel gövde]

[opsiyonel footer]
```

### Tipler
- `feat`: Yeni özellik
- `fix`: Hata düzeltme
- `refactor`: Kod yeniden düzenleme (davranış değişmez)
- `docs`: Dokümantasyon
- `test`: Test ekleme/düzeltme
- `chore`: Build, CI, bağımlılık güncelleme
- `style`: Kod formatı (whitespace, semicolon vb.)
- `perf`: Performans iyileştirme
- `ci`: CI/CD değişiklikleri

### Kapsam Örnekleri (ProductsPark)
- `feat(products)`: Ürün modülü
- `fix(orders)`: Sipariş modülü
- `refactor(auth)`: Kimlik doğrulama
- `feat(admin)`: Admin panel
- `fix(cart)`: Sepet
- `feat(seo)`: SEO modülü
- `chore(deps)`: Bağımlılık güncelleme
- `feat(rtk)`: RTK Query endpoint'leri

### Kurallar
- Açıklama küçük harfle başlar, nokta ile bitmez
- Açıklama 72 karakteri aşmaz
- Gövdede **ne** değiştiği ve **neden** değiştiği yazılır
- Breaking change varsa: `BREAKING CHANGE:` footer ekle
- İlgili issue varsa: `Closes #123` footer ekle

## Çalıştır

```bash
git add -A
git commit -m "<oluşturulan mesaj>"
```

### Örnek Commit'ler

```bash
# Yeni özellik
git commit -m "feat(products): add product stock management"

# Hata düzeltme
git commit -m "fix(cart): resolve quantity update issue"

# Refactor
git commit -m "refactor(auth): extract token refresh logic to separate hook"

# Birden fazla değişiklik
git commit -m "feat(seo): add PWA manifest and icons support

- Add manifestJsonController endpoint
- Update GlobalSeo component with manifest link
- Add PWA color settings to admin panel"
```

Birden fazla mantıksal değişiklik varsa ayrı commit'ler halinde stage'le ve commit et.
