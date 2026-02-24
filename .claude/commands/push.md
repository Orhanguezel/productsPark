Tüm değişiklikleri hızlıca commit ve push et.

## Adımlar

1. Değişiklikleri kontrol et
2. Commit oluştur (Conventional Commit formatında)
3. Remote'a push et

## Komutlar

```bash
# 1. Durum kontrolü
git status

# 2. Tüm değişiklikleri stage'le
git add -A

# 3. Commit (değişiklik türüne göre mesaj)
git commit -m "<tip>(<kapsam>): <açıklama>"

# 4. Push
git push origin <branch-name>
```

## Dikkat Edilecekler

- Push öncesi `npm run build` veya `bun run build` ile build kontrolü yap
- TypeScript hataları olmadığından emin ol: `tsc --noEmit`
- Hassas dosyaların (.env, credentials) commit edilmediğinden emin ol
- Force push (`git push -f`) kullanmadan önce onay al

## Hızlı Push (Küçük Değişiklikler İçin)

```bash
git add -A && git commit -m "fix(module): quick fix description" && git push
```
