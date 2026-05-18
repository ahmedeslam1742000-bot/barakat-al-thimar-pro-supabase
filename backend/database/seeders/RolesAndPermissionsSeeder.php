<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            'products.view',
            'products.create',
            'products.update',
            'products.archive',
            'vouchers.view',
            'vouchers.create',
            'vouchers.update',
            'vouchers.archive',
            'receipt-vouchers.view',
            'receipt-vouchers.create',
            'receipt-vouchers.update',
            'receipt-vouchers.archive',
            'representative-expenses.view',
            'representative-expenses.create',
            'representative-expenses.update',
            'representative-expenses.archive',
            'dashboard.view',
            'users.manage',
        ];

        foreach ($permissions as $permission) {
            Permission::findOrCreate($permission, 'web');
        }

        $manager = Role::findOrCreate('مدير', 'web');
        $representative = Role::findOrCreate('مندوب', 'web');
        $observer = Role::findOrCreate('مراقب', 'web');

        $manager->syncPermissions($permissions);
        $representative->syncPermissions([
            'products.view',
            'vouchers.view',
            'vouchers.create',
            'receipt-vouchers.view',
            'receipt-vouchers.create',
            'representative-expenses.view',
            'representative-expenses.create',
            'dashboard.view',
        ]);
        $observer->syncPermissions([
            'products.view',
            'vouchers.view',
            'receipt-vouchers.view',
            'representative-expenses.view',
            'dashboard.view',
        ]);

        $admin = User::updateOrCreate(
            ['email' => 'ahmed_eslam288@yahoo.com'],
            [
                'name' => 'أحمد إسلام',
                'password' => \Illuminate\Support\Facades\Hash::make('password'),
            ],
        );

        // Also ensure the legacy email exists
        User::updateOrCreate(
            ['email' => 'admin@barakat.local'],
            [
                'name' => 'مدير النظام',
                'password' => \Illuminate\Support\Facades\Hash::make('password'),
            ],
        )->assignRole($manager);

        $admin->assignRole($manager);
    }
}
