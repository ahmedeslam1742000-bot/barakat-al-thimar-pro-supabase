<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Product::query()
            ->when($request->string('search')->isNotEmpty(), function ($q) use ($request) {
                $search = '%' . $request->string('search')->toString() . '%';
                $q->where(function ($nested) use ($search) {
                    $nested->where('name', 'like', $search)
                        ->orWhere('company', 'like', $search)
                        ->orWhere('category', 'like', $search)
                        ->orWhere('search_key', 'like', $search);
                });
            })
            ->when($request->string('category')->isNotEmpty() && $request->string('category')->toString() !== 'الكل', function ($q) use ($request) {
                $q->where('category', $request->string('category')->toString());
            });

        // Calculate summary stats on the filtered query BEFORE pagination
        $stats = [
            'itemCount' => $query->count(),
            'goodQty' => (float) $query->sum('stock_qty'),
            'damagedQty' => (float) $query->sum('damaged_qty'),
        ];

        $products = $query
            ->orderBy($request->string('sort_by', 'category')->toString(), $request->string('sort_dir', 'asc')->toString())
            ->orderBy('name', 'asc')
            ->paginate($request->integer('per_page', 50));

        $response = $products->toArray();
        $response['summary_stats'] = $stats;

        return response()->json($response);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'company' => ['nullable', 'string', 'max:255'],
            'category' => ['nullable', 'string', 'max:255'],
            'unit' => ['nullable', 'string', 'max:50'],
            'price' => ['nullable', 'numeric', 'min:0'],
            'old_price' => ['nullable', 'numeric', 'min:0'],
            'stock_qty' => ['nullable', 'numeric', 'min:0'],
            'damaged_qty' => ['nullable', 'numeric', 'min:0'],
            'search_key' => ['nullable', 'string'],
        ]);

        return response()->json(Product::create($validated), 201);
    }

    public function show(Product $product): JsonResponse
    {
        return response()->json($product);
    }

    public function update(Request $request, Product $product): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'company' => ['nullable', 'string', 'max:255'],
            'category' => ['nullable', 'string', 'max:255'],
            'unit' => ['nullable', 'string', 'max:50'],
            'price' => ['nullable', 'numeric', 'min:0'],
            'old_price' => ['nullable', 'numeric', 'min:0'],
            'stock_qty' => ['nullable', 'numeric', 'min:0'],
            'damaged_qty' => ['nullable', 'numeric', 'min:0'],
            'search_key' => ['nullable', 'string'],
        ]);

        $product->update($validated);

        return response()->json($product->fresh());
    }

    public function history(Product $product): JsonResponse
    {
        $items = \App\Models\VoucherItem::with('voucher')
            ->where('product_id', $product->id)
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'type' => $item->voucher->type ?? '',
                    'timestamp' => $item->voucher->date ?? $item->voucher->created_at,
                    'qty' => $item->qty,
                    'status' => $item->voucher->status ?? '',
                    'beneficiary' => $item->voucher->client_name ?? '',
                    'notes' => trim($item->notes . "\n" . ($item->voucher->notes ?? '')),
                ];
            });

        return response()->json($items);
    }

    public function destroy(Product $product): JsonResponse
    {
        $product->delete();
        return response()->json(['message' => 'Product archived successfully']);
    }
}
