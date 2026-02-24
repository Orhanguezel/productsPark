Pull Request oluştur.

## Adımlar

1. Branch'in güncel olduğundan emin ol
2. Değişiklikleri incele
3. PR oluştur

## Komutlar

```bash
# 1. Main/master ile sync
git fetch origin
git rebase origin/main

# 2. Değişiklikleri gözden geçir
git log origin/main..HEAD --oneline
git diff origin/main...HEAD

# 3. Push (gerekirse)
git push origin <branch-name>

# 4. PR oluştur
gh pr create --title "<başlık>" --body "<açıklama>"
```

## PR Şablonu

```markdown
## Özet
<1-3 cümle ile ne yapıldığını açıkla>

## Değişiklikler
- [ ] Feature/fix açıklaması
- [ ] İlgili dosyalar
- [ ] Yeni endpoint'ler (varsa)

## Test
- [ ] Manuel test yapıldı
- [ ] Build başarılı
- [ ] TypeScript hataları yok

## Ekran Görüntüleri (UI değişikliği varsa)
<screenshot>

## Notlar
<varsa ek notlar>
```

## Örnek PR Başlıkları

```
feat(products): add stock management feature
fix(orders): resolve payment callback issue
refactor(auth): improve token refresh mechanism
chore(deps): update dependencies to latest versions
```
