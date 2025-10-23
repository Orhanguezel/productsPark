// ────────────────────────────────────────────────────────────────────────────────
// 25) RUN — Quick Start
// ────────────────────────────────────────────────────────────────────────────────
/*
# 1) api/.env doldur
cp api/.env.example api/.env


# 2) Docker ile çalıştır
docker compose build
docker compose up -d


# 3) Sağlık kontrolü
curl http://localhost:8080/health


# 4) Seed
cd api && npm run seed


# 5) FE .env
VITE_SUPABASE_URL=http://localhost:8080
VITE_SUPABASE_PUBLISHABLE_KEY=dummy
VITE_SUPABASE_PROJECT_ID=compat-local
*/

# biri yeterli
pnpm add @fastify/cookie
# veya
npm i @fastify/cookie
# veya
yarn add @fastify/cookie

# Şifre sorar
mysql -u root -p

# veya kullanıcı/adres/port belirterek:
mysql -h 127.0.0.1 -P 3306 -u your_user -p your_db


cd /var/www/productsPark/backend

rm -rf dist .tsbuildinfo
bun run build

mkdir -p dist/db/seed/sql
cp -f src/db/seed/sql/*.sql dist/db/seed/sql/


