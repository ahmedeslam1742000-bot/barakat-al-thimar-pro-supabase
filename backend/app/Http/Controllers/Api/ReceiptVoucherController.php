<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ReceiptVoucher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ReceiptVoucherController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $vouchers = ReceiptVoucher::query()
            ->when($request->string('search')->isNotEmpty(), function ($query) use ($request) {
                $search = '%' . $request->string('search')->toString() . '%';
                $query->where(function ($nested) use ($search) {
                    $nested->where('rep_name', 'like', $search)
                        ->orWhere('customer_name', 'like', $search)
                        ->orWhere('voucher_no', 'like', $search)
                        ->orWhere('invoice_no', 'like', $search);
                });
            })
            ->latest('date')
            ->latest()
            ->paginate($request->integer('per_page', 50));

        return response()->json($vouchers);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $this->validatePayload($request);
        $validated['created_by'] = Auth::id();

        return response()->json(ReceiptVoucher::create($validated), 201);
    }

    public function show(ReceiptVoucher $receiptVoucher): JsonResponse
    {
        return response()->json($receiptVoucher);
    }

    public function update(Request $request, ReceiptVoucher $receiptVoucher): JsonResponse
    {
        $receiptVoucher->update($this->validatePayload($request, true));

        return response()->json($receiptVoucher->fresh());
    }

    public function destroy(ReceiptVoucher $receiptVoucher): JsonResponse
    {
        $receiptVoucher->delete();

        return response()->json(['message' => 'تمت أرشفة سند التحصيل']);
    }

    private function validatePayload(Request $request, bool $partial = false): array
    {
        $required = $partial ? 'sometimes' : 'required';

        return $request->validate([
            'date' => [$required, 'date'],
            'rep_name' => [$required, 'string', 'max:255'],
            'customer_name' => [$required, 'string', 'max:255'],
            'voucher_no' => [$required, 'string', 'max:255'],
            'invoice_no' => ['nullable', 'string', 'max:255'],
            'amount' => [$required, 'numeric', 'min:0'],
            'type' => [$required, 'string', 'max:255'],
            'is_deposited' => ['sometimes', 'boolean'],
            'deposited_at' => ['nullable', 'date'],
            'is_settled' => ['sometimes', 'boolean'],
            'settlement_batch_id' => ['nullable', 'string', 'max:255'],
        ]);
    }
}
