<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Permission;

class UserController extends Controller
{
    public function index()
    {
        return User::with('permissions', 'roles')->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'username' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'password' => 'required|min:6',
        ]);

        $user = User::create([
            'name' => $validated['username'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
        ]);

        return response()->json($user, 201);
    }

    public function destroy(User $user)
    {
        if ($user->email === 'ahmed_eslam288@yahoo.com') {
            return response()->json(['message' => 'Cannot delete admin'], 403);
        }
        $user->delete();
        return response()->json(['message' => 'deleted']);
    }

    public function togglePermission(Request $request, User $user)
    {
        $validated = $request->validate([
            'page_id' => 'required|string',
            'is_allowed' => 'required|boolean',
        ]);

        $pagePermissions = [
            'dashboard' => 'dashboard.view',
            'items' => 'products.view',
            'stock-in' => 'vouchers.view',
            'stock-out' => 'vouchers.view',
            'returns' => 'vouchers.view',
            'voucher-outward' => 'vouchers.view',
            'reps' => 'users.manage',
            'receipt-vouchers' => 'receipt-vouchers.view',
            'inventory' => 'products.view',
            'inbound-records' => 'vouchers.view',
            'stock-card' => 'vouchers.view',
            'price-list' => 'products.view',
            'sales-analytics' => 'dashboard.view',
            'settings' => 'users.manage',
        ];

        $permissionName = $pagePermissions[$validated['page_id']] ?? null;

        if ($permissionName) {
            Permission::firstOrCreate(['name' => $permissionName]);

            if ($validated['is_allowed']) {
                $user->givePermissionTo($permissionName);
            } else {
                $user->revokePermissionTo($permissionName);
            }
        }

        return response()->json(['message' => 'Permission updated']);
    }

    public function getPermissions(User $user)
    {
        $permissions = $user->getAllPermissions()->pluck('name')->toArray();
        $pagePermissions = [
            'dashboard' => 'dashboard.view',
            'items' => 'products.view',
            'stock-in' => 'vouchers.view',
            'stock-out' => 'vouchers.view',
            'returns' => 'vouchers.view',
            'voucher-outward' => 'vouchers.view',
            'reps' => 'users.manage',
            'receipt-vouchers' => 'receipt-vouchers.view',
            'inventory' => 'products.view',
            'inbound-records' => 'vouchers.view',
            'stock-card' => 'vouchers.view',
            'price-list' => 'products.view',
            'sales-analytics' => 'dashboard.view',
            'settings' => 'users.manage',
        ];

        $response = [];
        foreach ($pagePermissions as $pageId => $permName) {
            if (in_array($permName, $permissions)) {
                $response[] = ['page_id' => $pageId, 'is_allowed' => true];
            }
        }

        return response()->json($response);
    }
}
