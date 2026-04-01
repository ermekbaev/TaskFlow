module.exports = {
  apps: [
    {
      name: 'taskflow',
      script: 'node_modules/.bin/next',
      args: 'start',
      instances: 'max',       // использует все CPU ядра
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '500M',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
};
