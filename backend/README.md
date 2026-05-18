# Barakat Althimar Backend

Laravel API backend for the inventory, voucher, receipt voucher, and representative expense workflows.

## Current Status

This backend scaffold was prepared in-repo because PHP and Composer are not currently available in this machine PATH. After installing PHP 8.3+ and Composer, run:

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
```

## Planned Packages

- Laravel 13
- Laravel Sanctum for SPA cookie authentication
- Spatie Laravel Permission for roles and permissions
- Laravel Reverb in the real-time phase

