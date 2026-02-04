# =========================================================
NODE_ENV = production
DB_HOST = localhost
DB_PORT = 3306
DB_PASSWORD = mivizuco123
DB_USER = mivizuco_myuser
CORS_ORIGIN = 

ALLOW_DROP=true node --experimental-specifier-resolution=node dist/db/seed/index.js
