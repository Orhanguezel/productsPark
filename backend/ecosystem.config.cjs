// backend/ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: 'productspark-backend',
      cwd: '/var/www/productsPark/backend',
      script: 'dist/index.js',
      interpreter: 'node',
      node_args: '--experimental-specifier-resolution=node',

      // pm2 start için varsayılan env
      env: {
        NODE_ENV: 'development',
        PORT: '8081'
        // Diğer değişkenler .env'den (dotenv/config) okunur
      },

      // pm2 start --env production için
      env_production: {
        NODE_ENV: 'production',
        PORT: '8081'
      },

      instances: 1,          // istersen 'max'
      exec_mode: 'fork',     // istersen 'cluster'
      watch: false,
      time: true,

      out_file: '/var/log/pm2/productspark-backend.out.log',
      error_file: '/var/log/pm2/productspark-backend.err.log',
      merge_logs: true,
      max_restarts: 10,
      restart_delay: 2000
    }
  ]
}

