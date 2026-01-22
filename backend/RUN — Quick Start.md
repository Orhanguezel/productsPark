

# Şifre sorar
mysql -u root -p

ADMIN_EMAIL="admin@site.com" ADMIN_PASSWORD="admin123" bun run db:seed


mysql -h 127.0.0.1 -P 3306 -u app -papp app

node -e "require('argon2').hash('admin123').then(console.log).catch(console.error)"


rg -n "registerWallet\(" src




cd /var/www/productsPark/backend

rm -rf dist .tsbuildinfo
bun run build

mkdir -p dist/db/seed/sql
cp -f src/db/seed/sql/*.sql dist/db/seed/sql/


cd ~/Documents/productsPark   # doğru klasör
git status                    # ne değişmiş gör
git add -A
git commit -m "mesajın"
git pull --rebase origin main
git push origin main


```sh
pm2 flush


cd /var/www/productsPark
git fetch --prune
git reset --hard origin/main

cd backend
bun run build

# çalışan süreç kesilmeden reload
pm2 reload ecosystem.config.cjs --env production

# gerekirse log izle
pm2 logs productspark-backend --lines 100

```



