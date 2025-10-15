module.exports = {
  apps: [
    {
      name: 'bot-basic',
      script: 'index.js',
      instances: 1,
      autorestart: true,
      watch: true,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/bot-error.log',
      out_file: './logs/bot-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: false,
      restart_delay: 5000,
      min_uptime: 10000,
      max_restarts: 100
    },
    {
      name: 'bot-enhanced',
      script: 'bot-enhanced.js',
      instances: 1,
      autorestart: true,
      watch: true,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      error_file: './logs/bot-enhanced-error.log',
      out_file: './logs/bot-enhanced-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      restart_delay: 5000,
      min_uptime: 10000,
      max_restarts: 100
    }
  ]
};
