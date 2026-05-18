<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ReceiptVoucher;
use App\Models\RepresentativeExpense;
use App\Models\Voucher;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function summary(): JsonResponse
    {
        return response()->json([
            'products_count' => Product::count(),
            'low_stock_count' => Product::where('stock_qty', '<', 50)->count(),
            'vouchers_count' => Voucher::count(),
            'pending_vouchers_count' => Voucher::where('status', 'قيد الانتظار')->count(),
            'receipt_vouchers_total' => ReceiptVoucher::sum('amount'),
            'representative_expenses_total' => RepresentativeExpense::sum('amount'),
        ]);
    }
}
