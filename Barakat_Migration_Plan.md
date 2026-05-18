# مستند خطة هجرة وتطوير نظام "بركة الثمار" (Production-Ready)

## ١. ملخص المشروع والقرار الهندسي
**المشكلة السابقة:**
الاعتماد على المعالجة في المتصفح (Thick Client) لسحب ومعالجة بيانات ضخمة، حفظ الـ Tokens بشكل غير آمن، وثغرات محتملة في تحديث المخزون (Race Conditions).

**القرار الهندسي:**
تطوير واجهة خلفية بـ (Laravel) توفر:
1. قاعدة بيانات مترابطة (Relational DB) مع (Soft Deletes).
2. حماية للمخزون عبر الأقفال التشاؤمية (Pessimistic Locking) لمنع الأرصدة السالبة.
3. مصادقة آمنة (Sanctum SPA - Cookie Based) وحماية للصلاحيات.
4. تحديثات لحظية عبر (Laravel Reverb).
5. تجربة مستخدم لا نهائية (Infinite Scroll) مدعومة بـ (React Query - useInfiniteQuery).

---

## ٢. هيكل قاعدة البيانات الجديدة (Migrations & Models)

### الـ Migrations:

**1. الأصناف (`products`)**
```php
Schema::create('products', function (Blueprint $table) {
    $table->id();
    $table->string('name')->index();
    $table->string('company')->nullable()->index();
    $table->string('category')->nullable()->index();
    $table->string('unit')->nullable(); 
    $table->integer('stock_qty')->default(0);
    $table->integer('damaged_qty')->default(0);
    $table->text('search_key')->nullable();
    $table->timestamps();
    $table->softDeletes(); 
});
```

**2. السندات (`vouchers`)**
```php
Schema::create('vouchers', function (Blueprint $table) {
    $table->uuid('id')->primary(); 
    $table->string('voucher_code')->unique(); // يتم توليده في الـ Backend
    $table->string('type'); 
    $table->string('status')->default('قيد الانتظار'); 
    $table->date('date');
    $table->string('client_name')->nullable(); 
    $table->text('notes')->nullable();
    $table->string('attachment_url')->nullable(); 
    $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete(); 
    $table->timestamps();
    $table->softDeletes(); 
});
```

**3. تفاصيل السند (`voucher_items`)**
```php
Schema::create('voucher_items', function (Blueprint $table) {
    $table->id();
    $table->foreignUuid('voucher_id')->constrained('vouchers')->cascadeOnDelete();
    $table->foreignId('product_id')->constrained('products')->restrictOnDelete();
    $table->decimal('qty', 10, 2); 
    $table->string('unit')->nullable();
    $table->string('notes')->nullable(); 
    $table->timestamps();
});
```

**4. تاريخ السند (`voucher_histories`)**
```php
Schema::create('voucher_histories', function (Blueprint $table) {
    $table->id();
    $table->foreignUuid('voucher_id')->constrained('vouchers')->cascadeOnDelete();
    $table->string('user_name'); 
    $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
    $table->string('action_type'); 
    $table->json('previous_data')->nullable(); 
    $table->json('new_data')->nullable(); 
    $table->text('notes')->nullable(); 
    $table->timestamps();
});
```

**5. الجداول المالية (`receipt_vouchers` و `representative_expenses`)**
(نفس الهيكل المتفق عليه مسبقاً مع SoftDeletes).

### الـ Models:
نفس الهيكل المتفق عليه مع تضمين `HasUuids`, `SoftDeletes`, والعلاقات.

---

## ٣. الـ Controllers (مع حلول Production-Proof)

### `VoucherController` (مُحدث بالـ Locks والـ Auto-Generation)
```php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\Voucher;
use App\Models\VoucherItem;
use App\Models\VoucherHistory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class VoucherController extends Controller
{
    private function adjustStock($productId, $qty, $type, $status = null, $reverse = false)
    {
        $inboundTypes = ['سند إدخال', 'in', 'Restock'];
        $outboundTypes = ['سند إخراج', 'out', 'صادر', 'Issue'];
        $returnTypes = ['مرتجع', 'Return', 'return']; 
        
        $isDamaged = ($status === 'مرتجع تالف');

        $incrementStock = in_array($type, $inboundTypes) || in_array($type, $returnTypes);
        $decrementStock = in_array($type, $outboundTypes);

        if ($reverse) {
            $incrementStock = !$incrementStock;
            $decrementStock = !$decrementStock;
        }

        if ($incrementStock) {
            DB::table('products')->where('id', $productId)->increment('stock_qty', $qty);
        } elseif ($decrementStock) {
            // حماية التزامن (Pessimistic Lock) لمنع الأرصدة السالبة وقت الضغط
            $product = DB::table('products')->where('id', $productId)->lockForUpdate()->first();
            if ($product->stock_qty < $qty) {
                throw new \Exception("الكمية غير كافية للصنف: {$product->name}. المتوفر: {$product->stock_qty}");
            }
            DB::table('products')->where('id', $productId)->decrement('stock_qty', $qty);
        }

        if ($isDamaged) {
            if ($reverse) {
                DB::table('products')->where('id', $productId)->decrement('damaged_qty', $qty);
            } else {
                DB::table('products')->where('id', $productId)->increment('damaged_qty', $qty);
            }
        }
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            // تمت إزالة voucher_code من هنا ليتم توليده من الـ Backend
            'type' => 'required|string',
            'status' => 'nullable|string',
            'date' => 'required|date',
            'client_name' => 'nullable|string',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.qty' => 'required|numeric|min:0.1',
            'items.*.unit' => 'nullable|string',
            'items.*.notes' => 'nullable|string',
        ]);

        try {
            DB::beginTransaction();

            // توليد آمن ومُقفل لرقم السند (INV-YYYYMM-XXXX)
            $lastVoucher = DB::table('vouchers')->lockForUpdate()->latest('created_at')->first();
            $nextId = $lastVoucher ? ((int) substr($lastVoucher->voucher_code, -4)) + 1 : 1;
            $voucherCode = 'INV-' . now()->format('Ym') . '-' . str_pad($nextId, 4, '0', STR_PAD_LEFT);

            $voucher = Voucher::create([
                'voucher_code' => $voucherCode,
                'type' => $validated['type'],
                'status' => $validated['status'] ?? 'قيد الانتظار',
                'date' => $validated['date'],
                'client_name' => $validated['client_name'] ?? null,
                'notes' => $validated['notes'] ?? null,
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
                $this->adjustStock($item['product_id'], $item['qty'], $voucher->type, $voucher->status);
            }

            VoucherHistory::create([
                'voucher_id' => $voucher->id,
                'user_name' => Auth::user()->name ?? 'System',
                'user_id' => Auth::id(),
                'action_type' => 'Created',
                'new_data' => $validated,
            ]);

            DB::commit();
            broadcast(new \App\Events\VoucherCreated($voucher));
            return response()->json(['message' => 'تم الحفظ بنجاح', 'voucher' => $voucher->load('items.product')], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
    // دوال index, show, update, destroy كما تم توثيقها مسبقاً
}
```

---

## ٤. الـ Real-time (Laravel Reverb)
يتم استخدام `ShouldBroadcastNow` في `VoucherCreated` و `VoucherUpdated` و `VoucherCancelled` لبث التحديثات الفورية للواجهة الأمامية لمنع طلب البيانات بشكل متكرر.

---

## ٥. تعديلات الـ Frontend المتقدمة (React)

### استخدام `useInfiniteQuery` للمحافظة على سلاسة الـ Virtualization
لتجنب ضياع تجربة التمرير اللانهائي عند استخدام Pagination السيرفر:

```javascript
import { useInfiniteQuery } from '@tanstack/react-query';
import api from '../lib/api';

export function useInfiniteVouchers(search = '', type = '') {
    return useInfiniteQuery({
        queryKey: ['vouchers', search, type],
        queryFn: async ({ pageParam = 1 }) => {
            const { data } = await api.get('/vouchers', {
                params: { page: pageParam, search, type }
            });
            return data; // يجب أن يرجع Laravel الـ (data, current_page, last_page)
        },
        getNextPageParam: (lastPage) => {
            return lastPage.current_page < lastPage.last_page 
                ? lastPage.current_page + 1 
                : undefined;
        },
    });
}
```
*في واجهة المستخدم (`StockInventory` / `VoucherWorkspace`)، سيتم دمج الصفحات المستلمة وعرضها بـ `@tanstack/react-virtual` تماماً كما كانت في النظام السابق.*

### تعديل واجهة حذف الأصناف:
نظراً لوجود `restrictOnDelete` في الجداول، يجب أن يتم تغيير زر (حذف الصنف) في الواجهة ليظهر كـ (أرشفة/إيقاف) ليعكس الإجراء الفعلي (`SoftDelete`).

---

## ٦. خطة التنفيذ المرحلية (Phased Execution Plan)

لضمان الانتقال السلس دون تعطل العمل اليومي (Zero Downtime Migration)، سيتم التنفيذ على 4 مراحل:

### المرحلة الأولى: تأسيس البنية التحتية (Backend Foundation)
- إنشاء مشروع Laravel وتجهيز قاعدة البيانات (Migrations & Models).
- إعداد حماية Sanctum بـ Cookie-based Authentication.
- إعداد حزمة Spatie وإضافة أدوار المستخدمين عبر الـ Seeder.
- **الاختبار المستهدف:** نجاح تسجيل الدخول من Postman/Frontend بـ CSRF Cookies.

### المرحلة الثانية: برمجة الـ API والـ Business Logic
- كتابة الـ Controllers مع التركيز على الـ Transactions وحماية `lockForUpdate`.
- تفعيل التوليد التلقائي لـ `voucher_code` في الـ Backend.
- تنصيب وإعداد (Laravel Reverb) وبرمجة الـ Events.
- **الاختبار المستهدف:** تنفيذ طلبات جلب وإنشاء وتعديل من Postman وتأكد صحة أرصدة المخزون.

### المرحلة الثالثة: تكامل الواجهة الأمامية (Frontend Integration)
- حذف مكتبة `supabase-js` من React وتثبيت `axios`, `laravel-echo`, `pusher-js`.
- استبدال `DataContext.jsx` بهوكات `useInfiniteQuery` و `useMutation`.
- ربط الواجهة وتعديل نصوص واجهة المستخدم (مثل تغيير "حذف" إلى "أرشفة").
- **الاختبار المستهدف:** عمل الواجهة بكامل طاقتها على بيئة محلية متصلة بـ Laravel وسماع الأحداث عبر Echo.

### المرحلة الرابعة: الترحيل النهائي وإطلاق الإنتاج (Data Migration & Go-Live)
- كتابة سكريبت (Migration Script) في Laravel يسحب السجلات من Supabase ويضخها في الـ MySQL بترتيبها الزمني الصحيح.
- إعادة حساب التراكمات للتأكد من مطابقة الأرصدة (Sanity Check).
- نشر المشروع على الخادم (Production Server) وتوجيه الموظفين للرابط الجديد.
- **الاختبار المستهدف:** عمل النظام في بيئة حقيقية بدون أخطاء تزامن أو بطء في التحميل.
