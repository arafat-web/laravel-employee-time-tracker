# Deploy — Time Tracker (Laravel 13 + Inertia React)

## 1. Server requirements
- PHP ^8.3 with extensions: `pdo_mysql mbstring openssl tokenizer xml ctype json fileinfo zip gd`
- MySQL 8 / MariaDB 10.6+
- Composer 2, Node 20+ / npm 10+
- HTTPS domain (required — session cookies + IP checks assume real client IPs)

## 2. First deploy
```bash
git clone <repo> timetracker && cd timetracker
cp .env.example .env
php artisan key:generate
# edit .env: APP_URL=https://your-domain, DB_*, ADMIN_EMAIL, ADMIN_PASSWORD
composer install --no-dev --optimize-autoloader
npm ci
npm run build
php artisan migrate --force
ADMIN_EMAIL=you@company.com ADMIN_PASSWORD='Strong#123' php artisan db:seed --force
php artisan storage:link   # harmless even though vault uses local disk
php artisan config:cache && php artisan route:cache && php artisan view:cache
```

Web root must point at `public/`. If Apache, `public/.htaccess` already handles it.
If Nginx:
```nginx
root /var/www/timetracker/public;
location / { try_files $uri $uri/ /index.php?$query_string; }
location ~ \.php$ { fastcgi_pass unix:/run/php/php8.3-fpm.sock; include fastcgi_params; fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name; }
```

## 3. Required `.env` for production
```
APP_ENV=production
APP_DEBUG=false
APP_URL=https://your-domain
SESSION_SECURE_COOKIE=true
TRUSTED_PROXIES=*
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=timetracker
DB_USERNAME=...
DB_PASSWORD=...
ADMIN_EMAIL=you@company.com
ADMIN_PASSWORD=Strong#123
```

## 4. Scheduler (REQUIRED — absents + auto-close run nightly)
Without this, absent-marking and forgotten clock-out auto-close never fire.

Linux cron:
```
* * * * * cd /var/www/timetracker && php artisan schedule:run >> /dev/null 2>&1
```
Windows Task Scheduler: run `php artisan schedule:run` every minute, or run the two
commands nightly directly:
```
php artisan attendance:auto-close --date=yesterday
php artisan attendance:mark-absents --date=yesterday
```

## 5. Queue — optional
`QUEUE_CONNECTION=database` is set but nothing dispatches jobs yet. To be safe run:
```
php artisan queue:work --sleep=3 --tries=3
```
or switch `QUEUE_CONNECTION=sync` in `.env` if you don't want a worker.

## 6. After every update
```bash
git pull
composer install --no-dev --optimize-autoloader
npm ci && npm run build
php artisan migrate --force
php artisan optimize
```

## 7. Backups
- Nightly MySQL dump + `storage/app/private/vault` directory (uploaded files live there).
- Test restore at least once: `storage/app/private/vault/*` + DB dump = full recovery.

## 8. Security checklist before go-live
- [ ] Change admin password (or set `ADMIN_PASSWORD` before seeding)
- [ ] `APP_DEBUG=false`, real `APP_KEY`
- [ ] HTTPS + `SESSION_SECURE_COOKIE=true`
- [ ] Employee `allowed_ips` filled per staff
- [ ] Scheduler verified: `php artisan schedule:list` shows both jobs
- [ ] `storage/app/private` NOT web-accessible (downloads go through auth route)
- [ ] Backups running
