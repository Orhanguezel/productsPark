Yeni bir feature branch oluştur: $ARGUMENTS

## Branch İsimlendirme

```
<tip>/<kısa-açıklama>
```

### Tipler
- `feature/` - Yeni özellik
- `fix/` - Hata düzeltme
- `refactor/` - Kod iyileştirme
- `hotfix/` - Acil düzeltme (production)
- `chore/` - Bakım işleri

### Örnekler
```
feature/product-stock-management
fix/cart-quantity-update
refactor/auth-token-handling
hotfix/payment-callback-fix
chore/update-dependencies
```

## Komutlar

```bash
# 1. Main'den güncel branch al
git checkout main
git pull origin main

# 2. Yeni branch oluştur
git checkout -b <branch-name>

# 3. İlk commit (opsiyonel, branch'i remote'a push etmek için)
git commit --allow-empty -m "chore: init <branch-name>"
git push -u origin <branch-name>
```

## Kurallar

- Branch adı lowercase ve kebab-case olmalı
- Branch adı 50 karakteri aşmamalı
- Ana branch'lerden (`main`, `master`, `develop`) doğrudan commit yapma
- Uzun süren branch'leri düzenli olarak main ile sync et
