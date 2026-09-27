# Time Tracker

Simple employee time tracker. Clock in/out, shifts, leaves, salary, and performance — in one clean app.

Built with Laravel + Inertia + React + Tailwind. No paid packages. MIT licensed.

## What it does

- **Time tracking** — clock in/out, breaks, late / early / overtime auto-calc per shift
- **Employees** — profile, shift, allowed IPs, salary base, status
- **Leaves** — employee applies, admin approves/rejects, yearly balance
- **Salary** — monthly input (base + allowances + bonus − deductions), paid flag
- **Performance** — monthly 0–100 score from attendance and punctuality
- **Timesheet** — monthly grid + CSV export for payroll
- **Notices** — auto (late, salary, leave) + manual broadcast or individual
- **Files & Notes** — share HR policies, sheets, passwords, links
- **Extras** — holidays, audit trail, IP logs, absent auto-mark, forgotten clock-out auto-close

## Quick start

Needs: PHP 8.3+, MySQL, Composer, Node 20+.

```bash
git clone <your-repo> timetracker && cd timetracker
cp .env.example .env
php artisan key:generate
# edit .env: DB_*, APP_URL, ADMIN_EMAIL, ADMIN_PASSWORD
composer install
npm install && npm run build
php artisan migrate --force
php artisan db:seed --force
php artisan serve
```

Open `http://localhost:8000` and sign in with your `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

Tests: `php artisan test`

## Important

- **Scheduler** (needed for absent-mark + auto-close). Run every minute:
  ```bash
  php artisan schedule:run
  ```
- **Employee IPs**: admin logs in from anywhere; employees only from their allowed IPs (set per employee).
- **Files** live in `storage/app/private/vault` — back it up with the DB.

See [DEPLOY.md](DEPLOY.md) for server setup.

## Contribute

PRs welcome. Keep it simple, add a test if you change logic (`tests/Feature`).

## License

MIT — free for personal and commercial use.
