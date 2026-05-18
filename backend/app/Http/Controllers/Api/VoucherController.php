<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Voucher;
use App\Models\VoucherHistory;
use App\Models\VoucherItem;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Throwable;

class VoucherController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $vouchers = Voucher::query()
            ->with(['items.product', 'creator:id,name'])
            ->when($request->string('search')->isNotEmpty(), function (Builder $query) use ($request) {
                $search = '%' . $request->string('search')->toString() . '%';
                $query->where(function (Builder $nested) use ($search) {
                    $nested->where('voucher_code', 'like', $search)
                        ->orWhere('client_name', 'like', $search)
                        ->orWhere('notes', 'like', $search);
                });
            })
            ->when($request->string('type')->isNotEmpty(), fn (Builder $query) => $query->where('type', $request->string('type')))
            ->when($request->string('status')->isNotEmpty(), fn (Builder $query) => $query->where('status', $request->string('status')))
            ->latest('date')
            ->latest()
            ->paginate($request->integer('per_page', 30));

        return response()->json($vouchers);
    }

    public function store(Request $request): JsonResponse
    {
        Log::info('Voucher Payload:', $request->all());
        $validated = $this->validateVoucher($request);

        try {
            $voucher = DB::transaction(function () use ($validated) {
                $voucher = Voucher::create([
                    'voucher_code' => !empty($validated['voucher_code']) ? $validated['voucher_code'] : $this->nextVoucherCode(),
                    'type' => $validated['type'],
                    'status' => $validated['status'] ?? 'قيد الانتظار',
                    'date' => $validated['date'],
                    'client_name' => $validated['client_name'] ?? null,
                    'notes' => $validated['notes'] ?? null,
                    'attachment_url' => $validated['attachment_url'] ?? null,
                    'created_by' => Auth::id(),
                ]);

                foreach ($validated['items'] as $item) {
                    VoucherItem::create([
                        'voucher_id' => $voucher->id,
                        'product_id' => $item['product_id'],
                        'qty' => $item['qty'],
                        'unit' => $item['unit'] ?? null,
                        'notes' => $item['notes'] ?? null,
                    ]);

                    $this->adjustStock((int) $item['product_id'], (float) $item['qty'], $voucher->type, $voucher->status, false, $item['notes'] ?? null);
                }

                $this->recordHistory($voucher, 'created', null, $validated);

                return $voucher->load(['items.product', 'histories', 'creator:id,name']);
            });

            return response()->json(['message' => 'تم حفظ السند بنجاح', 'voucher' => $voucher], 201);
        } catch (Throwable $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }
    }

    public function show(Voucher $voucher): JsonResponse
    {
        return response()->json($voucher->load(['items.product', 'histories', 'creator:id,name']));
    }

    public function update(Request $request, Voucher $voucher): JsonResponse
    {
        $validated = $this->validateVoucher($request, $voucher->id);

        try {
            $updated = DB::transaction(function () use ($voucher, $validated) {
                $previous = $voucher->load('items')->toArray();

                foreach ($voucher->items as $item) {
                    $this->adjustStock((int) $item->product_id, (float) $item->qty, $voucher->type, $voucher->status, true, $item->notes);
                }

                $voucher->update([
                    'type' => $validated['type'],
                    'status' => $validated['status'] ?? 'قيد الانتظار',
                    'date' => $validated['date'],
                    'client_name' => $validated['client_name'] ?? null,
                    'notes' => $validated['notes'] ?? null,
                    'attachment_url' => $validated['attachment_url'] ?? null,
                ]);

                $voucher->items()->delete();

                foreach ($validated['items'] as $item) {
                    VoucherItem::create([
                        'voucher_id' => $voucher->id,
                        'product_id' => $item['product_id'],
                        'qty' => $item['qty'],
                        'unit' => $item['unit'] ?? null,
                        'notes' => $item['notes'] ?? null,
                    ]);

                    $this->adjustStock((int) $item['product_id'], (float) $item['qty'], $voucher->type, $voucher->status, false, $item['notes'] ?? null);
                }

                $this->recordHistory($voucher, 'updated', $previous, $validated);

                return $voucher->fresh()->load(['items.product', 'histories', 'creator:id,name']);
            });

            return response()->json(['message' => 'تم تحديث السند بنجاح', 'voucher' => $updated]);
        } catch (Throwable $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }
    }

    public function updateStatus(Request $request, Voucher $voucher): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['nullable', 'string', 'max:255'],
            'attachment_url' => ['nullable', 'string', 'max:2048'],
        ]);

        try {
            $updated = DB::transaction(function () use ($request, $voucher, $validated) {
                $previous = $voucher->toArray();

                $updateData = [];
                if ($request->has('status')) {
                    $updateData['status'] = $validated['status'];
                }
                if ($request->has('attachment_url')) {
                    $updateData['attachment_url'] = $validated['attachment_url'];
                }

                if (!empty($updateData)) {
                    $voucher->update($updateData);
                    $this->recordHistory($voucher, 'status_updated', $previous, $validated);
                }

                return $voucher->fresh()->load(['items.product', 'histories', 'creator:id,name']);
            });

            return response()->json(['message' => 'تم التحديث بنجاح', 'voucher' => $updated]);
        } catch (Throwable $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }
    }

    public function destroy(Voucher $voucher): JsonResponse
    {
        try {
            DB::transaction(function () use ($voucher) {
                $voucher->load('items');

                foreach ($voucher->items as $item) {
                    $this->adjustStock((int) $item->product_id, (float) $item->qty, $voucher->type, $voucher->status, true, $item->notes);
                }

                $this->recordHistory($voucher, 'archived', $voucher->toArray(), null);
                $voucher->delete();
            });

            return response()->json(['message' => 'تمت أرشفة السند وعكس أثره على المخزون']);
        } catch (Throwable $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }
    }

    private function validateVoucher(Request $request, ?string $ignoreId = null): array
    {
        $uniqueRule = 'unique:vouchers,voucher_code';
        if ($ignoreId) {
            $uniqueRule .= ',' . $ignoreId;
        }

        return $request->validate([
            'voucher_code' => ['nullable', 'string', 'max:255', $uniqueRule],
            'type' => ['required', 'string', 'max:255'],
            'status' => ['nullable', 'string', 'max:255'],
            'date' => ['required', 'date'],
            'client_name' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
            'attachment_url' => ['nullable', 'string', 'max:2048'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', 'exists:products,id'],
            'items.*.qty' => ['required', 'numeric', 'min:0.01'],
            'items.*.unit' => ['nullable', 'string', 'max:50'],
            'items.*.notes' => ['nullable', 'string', 'max:255'],
        ], [
            'voucher_code.unique' => 'رقم السند هذا مستخدم مسبقاً، يرجى كتابة رقم آخر أو تركه فارغاً ليتم توليده تلقائياً.',
            'items.*.product_id.exists' => 'أحد الأصناف المدخلة غير موجود في قاعدة البيانات.',
            'items.required' => 'يجب إضافة صنف واحد على الأقل.',
        ]);
    }

    private function nextVoucherCode(): string
    {
        $prefix = 'INV-' . now()->format('Ym') . '-';

        $lastCode = Voucher::query()
            ->where('voucher_code', 'like', $prefix . '%')
            ->lockForUpdate()
            ->orderByDesc('voucher_code')
            ->value('voucher_code');

        $nextNumber = $lastCode ? ((int) substr($lastCode, -4)) + 1 : 1;

        return $prefix . str_pad((string) $nextNumber, 4, '0', STR_PAD_LEFT);
    }

    private function adjustStock(int $productId, float $qty, string $type, ?string $status = null, bool $reverse = false, ?string $itemNote = null): void
    {
        $inboundTypes = ['سند إدخال', 'in', 'Restock'];
        $outboundTypes = ['سند إخراج', 'out', 'صادر', 'Issue', 'سند إخراج صوري', 'فاتورة مبيعات'];
        $returnTypes = ['مرتجع', 'Return', 'return'];

        $isReturn = in_array($type, $returnTypes, true);
        $isDamagedReturn = $isReturn && ($status === 'مرتجع تالف' || $itemNote === 'تالف');

        $incrementStock = (in_array($type, $inboundTypes, true) || $isReturn) && !$isDamagedReturn;
        $decrementStock = in_array($type, $outboundTypes, true);

        if ($reverse) {
            [$incrementStock, $decrementStock] = [$decrementStock, $incrementStock];
        }

        $product = DB::table('products')->where('id', $productId)->lockForUpdate()->first();

        if (! $product) {
            throw new \RuntimeException('الصنف غير موجود.');
        }

        if ($decrementStock && (float) $product->stock_qty < $qty) {
            throw new \RuntimeException("الكمية غير كافية للصنف: {$product->name}. المتوفر: {$product->stock_qty}");
        }

        if ($incrementStock) {
            DB::table('products')->where('id', $productId)->increment('stock_qty', $qty);
        }

        if ($decrementStock) {
            DB::table('products')->where('id', $productId)->decrement('stock_qty', $qty);
        }

        if ($isDamagedReturn) {
            $reverse
                ? DB::table('products')->where('id', $productId)->decrement('damaged_qty', $qty)
                : DB::table('products')->where('id', $productId)->increment('damaged_qty', $qty);
        }
    }

    private function recordHistory(Voucher $voucher, string $actionType, ?array $previousData, ?array $newData): void
    {
        VoucherHistory::create([
            'voucher_id' => $voucher->id,
            'user_id' => Auth::id(),
            'user_name' => Auth::user()->name ?? 'System',
            'action_type' => $actionType,
            'previous_data' => $previousData,
            'new_data' => $newData,
        ]);
    }
}
