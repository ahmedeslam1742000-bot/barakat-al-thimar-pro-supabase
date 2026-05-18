<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\JournalEntryController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\ReceiptVoucherController;
use App\Http\Controllers\Api\RepresentativeExpenseController;
use App\Http\Controllers\Api\VoucherController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login'])->middleware('guest');

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::get('/dashboard/summary', [DashboardController::class, 'summary'])
        ->middleware('permission:dashboard.view');

    Route::get('journal-entries', [JournalEntryController::class, 'index'])
        ->middleware('permission:receipt-vouchers.view');
    Route::post('settlements', [JournalEntryController::class, 'settle'])
        ->middleware('permission:receipt-vouchers.update');

    Route::get('products', [ProductController::class, 'index'])->middleware('permission:products.view');
    Route::post('products', [ProductController::class, 'store'])->middleware('permission:products.create');
    Route::get('products/{product}', [ProductController::class, 'show'])->middleware('permission:products.view');
    Route::get('products/{product}/history', [ProductController::class, 'history'])->middleware('permission:products.view');
    Route::put('products/{product}', [ProductController::class, 'update'])->middleware('permission:products.update');
    Route::patch('products/{product}', [ProductController::class, 'update'])->middleware('permission:products.update');
    Route::delete('products/{product}', [ProductController::class, 'destroy'])->middleware('permission:products.archive');

    Route::get('vouchers', [VoucherController::class, 'index'])->middleware('permission:vouchers.view');
    Route::post('vouchers', [VoucherController::class, 'store'])->middleware('permission:vouchers.create');
    Route::get('vouchers/{voucher}', [VoucherController::class, 'show'])->middleware('permission:vouchers.view');
    Route::put('vouchers/{voucher}', [VoucherController::class, 'update'])->middleware('permission:vouchers.update');
    Route::patch('vouchers/{voucher}', [VoucherController::class, 'update'])->middleware('permission:vouchers.update');
    Route::patch('vouchers/{voucher}/status', [VoucherController::class, 'updateStatus'])->middleware('permission:vouchers.update');
    Route::delete('vouchers/{voucher}', [VoucherController::class, 'destroy'])->middleware('permission:vouchers.archive');

    Route::apiResource('receipt-vouchers', ReceiptVoucherController::class);
    Route::apiResource('representative-expenses', RepresentativeExpenseController::class);
    Route::apiResource('reps', \App\Http\Controllers\RepController::class)->except(['show']);

    Route::apiResource('users', \App\Http\Controllers\Api\UserController::class)->only(['index', 'store', 'destroy']);
    Route::get('users/{user}/permissions', [\App\Http\Controllers\Api\UserController::class, 'getPermissions']);
    Route::post('users/{user}/permissions', [\App\Http\Controllers\Api\UserController::class, 'togglePermission']);
    Route::get('settings', [\App\Http\Controllers\Api\SettingController::class, 'show']);
    Route::post('settings', [\App\Http\Controllers\Api\SettingController::class, 'update']);
});
