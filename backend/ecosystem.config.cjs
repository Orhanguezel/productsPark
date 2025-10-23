// backend/ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: 'productspark-backend',
      cwd: '/var/www/productsPark/backend',
      script: 'dist/index.js',
      interpreter: 'node',
      node_args: '--experimental-specifier-resolution=node',

      env: {
        NODE_ENV: 'development',
        PORT: '8081'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: '8081'
      },

      instances: 1,
      exec_mode: 'fork',
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

