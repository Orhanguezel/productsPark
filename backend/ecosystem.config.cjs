// /var/www/productsPark/backend/ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: 'productsPark-backend',
      cwd: '/var/www/productsPark/backend',

      // Bun runtime
      interpreter: '/home/orhan/.bun/bin/bun',
      script: 'dist/index.js',

      exec_mode: 'fork',
      instances: 1,

      watch: false,
      autorestart: true,

      max_memory_restart: '350M',

      min_uptime: '30s',
      max_restarts: 10,
      restart_delay: 5000,

      kill_timeout: 8000,
      listen_timeout: 10000,

      env: {
        NODE_ENV: 'production',
        HOST: '127.0.0.1',
        PORT: 8077,

        // Puppeteer/Chromium
        PUPPETEER_EXECUTABLE_PATH: '/snap/bin/chromium',
        PUPPETEER_NO_SANDBOX: '1',
      },

      out_file: '/home/orhan/.pm2/logs/productsPark-backend.out.log',
      error_file: '/home/orhan/.pm2/logs/productsPark-backend.err.log',
      combine_logs: true,
      time: true,
    },
  ],
};
