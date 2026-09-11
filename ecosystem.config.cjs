module.exports = {
  apps: [
    {
      name: "readygamecode",
      script: ".next/standalone/server.js",
      interpreter: "bun",
      cwd: "/var/www/readygamecode/fe",

      env: {
        NODE_ENV: "production",
        PORT: 9192,
        HOME: "/var/www"
      },

      out_file: "/var/www/readygamecode/logs/out.log",
      error_file: "/var/www/readygamecode/logs/error.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss"
    }
  ]
};
