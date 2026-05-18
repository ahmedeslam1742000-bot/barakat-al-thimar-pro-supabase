<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RepresentativeExpense;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class RepresentativeExpenseController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $expenses = RepresentativeExpense::query()
            ->when($request->string('search')->isNotEmpty(), function ($query) use ($request) {
                $search = '%' . $request->string('search')->toString() . '%';
                $query->where(function ($nested) use ($search) {
                    $nested->where('rep_name', 'like', $search)
                        ->orWhere('statement', 'like', $search)
                        ->orWhere('settlement_batch_id', 'like', $search);
                });
            })
            ->latest('date')
            ->latest()
            ->paginate($request->integer('per_page', 50));

        return response()->json($expenses);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $this->validatePayload($request);
        $validated['created_by'] = Auth::id();

        return response()->json(RepresentativeExpense::create($validated), 201);
    }

    public function show(RepresentativeExpense $representativeExpense): JsonResponse
    {
        return response()->json($representativeExpense);
    }

    public function update(Request $request, RepresentativeExpense $representativeExpense): JsonResponse
    {
        $representativeExpense->update($this->validatePayload($request, true));

        return response()->json($representativeExpense->fresh());
    }

    public function destroy(RepresentativeExpense $representativeExpense): JsonResponse
    {
        $representativeExpense->delete();

        return response()->json(['message' => 'تمت أرشفة مصروف المندوب']);
    }

    private function validatePayload(Request $request, bool $partial = false): array
    {
        $required = $partial ? 'sometimes' : 'required';

        return $request->validate([
            'date' => [$required, 'date'],
            'rep_name' => [$required, 'string', 'max:255'],
            'amount' => [$required, 'numeric', 'min:0'],
            'statement' => ['nullable', 'string'],
            'is_settled' => ['sometimes', 'boolean'],
            'settlement_batch_id' => ['nullable', 'string', 'max:255'],
        ]);
    }
}
