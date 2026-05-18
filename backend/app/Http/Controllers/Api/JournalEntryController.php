<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JournalEntry;
use App\Models\ReceiptVoucher;
use App\Models\RepresentativeExpense;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class JournalEntryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $entries = JournalEntry::query()
            ->latest()
            ->paginate($request->integer('per_page', 100));

        return response()->json($entries);
    }

    public function settle(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'journal_no' => ['required', 'string', 'max:255'],
            'total_amount' => ['required', 'numeric', 'min:0'],
            'receipt_voucher_ids' => ['array'],
            'receipt_voucher_ids.*' => ['integer', 'exists:receipt_vouchers,id'],
            'representative_expense_ids' => ['array'],
            'representative_expense_ids.*' => ['integer', 'exists:representative_expenses,id'],
        ]);

        if (empty($validated['receipt_voucher_ids']) && empty($validated['representative_expense_ids'])) {
            return response()->json(['message' => 'يجب اختيار سند أو مصروف واحد على الأقل.'], 422);
        }

        $entry = DB::transaction(function () use ($validated) {
            $entry = JournalEntry::create([
                'id' => (string) Str::uuid(),
                'journal_no' => $validated['journal_no'],
                'total_amount' => $validated['total_amount'],
                'created_by' => Auth::id(),
            ]);

            if (! empty($validated['receipt_voucher_ids'])) {
                ReceiptVoucher::query()
                    ->whereIn('id', $validated['receipt_voucher_ids'])
                    ->update([
                        'is_settled' => true,
                        'settlement_batch_id' => $entry->id,
                    ]);
            }

            if (! empty($validated['representative_expense_ids'])) {
                RepresentativeExpense::query()
                    ->whereIn('id', $validated['representative_expense_ids'])
                    ->update([
                        'is_settled' => true,
                        'settlement_batch_id' => $entry->id,
                    ]);
            }

            return $entry;
        });

        return response()->json(['message' => 'تم ترحيل القيد بنجاح', 'journal_entry' => $entry], 201);
    }
}
