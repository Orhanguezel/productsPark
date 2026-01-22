// =============================================================
// FILE: ecosystem.config.cjs
// Emlak – Frontend (Next.js) PM2 config (Production-safe)
// =============================================================

module.exports = {
  apps: [
    {
      name: 'productPark-frontend',
      cwd: '/var/www/productPark/frontend',

      // Next start (prod) - Node ile çalıştır
      interpreter: 'node',
      script: 'node_modules/.bin/next',
      args: 'start -p 3049 -H 127.0.0.1',

      exec_mode: 'fork',
      instances: 1,
      watch: false,
      autorestart: true,
      max_memory_restart: '400M',

      // Crash-loop koruması (CPU’yu kilitlemesin)
      min_uptime: '20s',
      max_restarts: 10,
      restart_delay: 3000,

      env: {
        NODE_ENV: 'production',
        PORT: '3049',
        HOSTNAME: '127.0.0.1',
      },

      out_file: '/var/log/pm2/productPark-frontend.out.log',
      error_file: '/var/log/pm2/productPark-frontend.err.log',
      combine_logs: true,
      time: true,
    },
  ],
};
