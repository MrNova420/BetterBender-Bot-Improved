module.exports = {
  apps: [
    {
      name: 'betterbender-bot',
      script: 'dashboard/server.js',
      args: 'CONFIG.json',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production'
      },
      error_file: 'data/logs/pm2-error.log',
      out_file: 'data/logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
      restart_delay: 5000,
      min_uptime: 10000,
      max_restarts: 100
    }
  ]
};
