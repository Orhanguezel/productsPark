// /var/www/productsPark/frontend/ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: 'productsPark-frontend',
      cwd: '/var/www/productsPark/frontend',

      // Next.js start via Bun
      script: '/home/orhan/.bun/bin/bun',
      args: 'run start -- -p 3055 -H 127.0.0.1',

      exec_mode: 'fork',
      instances: 1,

      watch: false,
      autorestart: true,

      max_memory_restart: '450M',

      min_uptime: '30s',
      max_restarts: 10,
      restart_delay: 5000,

      kill_timeout: 8000,
      listen_timeout: 10000,

      env: {
        NODE_ENV: 'production',
        PORT: '3055',
        HOSTNAME: '127.0.0.1',
        NEXT_TELEMETRY_DISABLED: '1',
      },

      out_file: '/home/orhan/.pm2/logs/productsPark-frontend.out.log',
      error_file: '/home/orhan/.pm2/logs/productsPark-frontend.err.log',
      combine_logs: true,
      time: true,
    },
  ],
};
