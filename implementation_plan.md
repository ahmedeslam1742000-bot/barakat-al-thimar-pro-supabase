# خطة المهام التنفيذية: هجرة نظام "بركة الثمار"

هذه الخطة تمثل خريطة الطريق التنفيذية (Task List) للمشروع. سيتم تحديث حالة كل مهمة (`[x]` للمكتملة، `[/]` للجارية) لضمان سير العمل بدقة متناهية ودون تداخل.

## المرحلة الأولى: البنية التحتية الخلفية (Backend Foundation)
تهدف هذه المرحلة إلى إرساء قواعد البيانات ونظام الحماية.

- `[x]` **تهيئة بيئة العمل:** إنشاء مشروع Laravel جديد (Backend).  
  - تم تشغيل `composer update` بنجاح وتجهيز `vendor/` وملف البيئة.
- `[x]` **إعدادات البيئة:** ضبط ملف `.env` لقاعدة البيانات، `SESSION_DOMAIN`، و `SANCTUM_STATEFUL_DOMAINS`.
- `[x]` **بناء الجداول (Migrations):**
  - `[x]` جدول `products` (مع SoftDeletes).
  - `[x]` جدول `vouchers` (مع UUIDs و SoftDeletes).
  - `[x]` جدول `voucher_items`.
  - `[x]` جدول `voucher_histories` (بنظام JSON history).
  - `[x]` جدول `receipt_vouchers`.
  - `[x]` جدول `representative_expenses`.
- `[x]` **بناء النماذج (Models):** ربط العلاقات الرياضية بـ `HasMany` و `BelongsTo`.
- `[x]` **نظام الحماية (Auth & Roles):**
  - `[x]` تثبيت وتكوين `Laravel Sanctum` لـ SPA Authentication.
  - `[x]` تثبيت وتكوين `Spatie Laravel Permission`.
  - `[x]` كتابة `RolesAndPermissionsSeeder` لتوليد الأدوار الأساسية (مدير، مندوب، مراقب).  
  - `[x]` إنشاء مستخدم مدير افتراضي للاختبار وربطه بدور المدير.

## المرحلة الثانية: برمجة الـ API والـ Business Logic
تهدف هذه المرحلة إلى تحويل القواعد المحاسبية إلى كود (Controllers & Events).

- `[x]` **برمجة الـ Controllers الأساسية:**
  - `[x]` `AuthController` (لتسجيل الدخول والخروج).
  - `[x]` `ProductController`.
- `[ ]` **المنطق المالي (Transactions & Concurrency):**
  - `[x]` `VoucherController`: كتابة دالة `adjustStock` مدعومة بـ `lockForUpdate()`.
  - `[x]` `VoucherController`: تفعيل التوليد التلقائي لـ `voucher_code` (`INV-YYYYMM-XXXX`).
  - `[x]` استكمال دوال (Store, Update, Destroy) مع حماية المخزون.
- `[x]` **السندات المالية والإحصائيات:**
  - `[x]` `ReceiptVoucherController`.
  - `[x]` `RepresentativeExpenseController`.
  - `[x]` `DashboardController`.
- `[x]` **حماية المسارات (Routes):** بناء ملف `api.php` مع الـ Middlewares الخاصة بالصلاحيات.
- `[x]` **التحديث اللحظي (Real-time):**
  - `[x]` تنصيب `Laravel Reverb` (`install:broadcasting`).
  - `[x]` بناء وبث الـ Events (`VoucherCreated`, `VoucherUpdated`, `TransactionCreated`, `ProductUpdated`).

## المرحلة الثالثة: تكامل الواجهة الأمامية (Frontend Integration)
هنا نربط واجهة React بالـ Backend الجديد.

- `[x]` **التنظيف والإعداد:**
  - `[x]` إزالة مكتبة `supabase-js` بعد تحويل كل الشاشات المتبقية.
  - `[x]` تثبيت `axios`, `laravel-echo`, `pusher-js`.
- `[x]` **محرك الاتصال (Axios):**
  - `[x]` إنشاء `lib/api.js` وتفعيل خاصية `withCredentials` لـ CSRF Cookies.
- `[x]` **استبدال DataContext بـ React Query:**
  - `[x]` إنشاء Custom Hook: `useInfiniteVouchers` (لدعم Virtualization).
  - `[x]` تحديث شاشة `StockInventory` لتعتمد على بيانات السيرفر (Pagination).
  - `[x]` إعادة هندسة `VoucherWorkspace` للاعتماد على `useMutation` عند الحفظ/التعديل.
- `[x]` **التحديثات المرئية:**
  - `[x]` تعديل نصوص الأزرار من (حذف) إلى (أرشفة).
  - `[x]` ربط شاشة الـ Dashboard بالـ Echo Events لسماع التحديثات اللحظية وتحديث الـ Query Cache.

## المرحلة الرابعة: الترحيل النهائي وإطلاق الإنتاج (Data Migration)
نقل البيانات الحالية بأمان من Supabase إلى Laravel.

- `[x]` **سكربت النقل (Data Migration Script):**
  - `[x]` بناء أداة في Laravel (Artisan Command) لقراءة ملف JSON المصدَّر من Supabase.
  - `[x]` ضخ الأصناف، السندات، والحركات بالترتيب الزمني الصحيح.
- `[x]` **التدقيق (Sanity Check):** مراجعة أرصدة المخزون والتأكد من تطابقها بين النظامين القديم والجديد.
- `[x]` **الإطلاق النهائي:** اختبار الدورة الكاملة على النظام الجديد جاهزاً للاستخدام.

---

> [!NOTE]
> بمجرد موافقتك على تقسيم المهام هذا، سأقوم بفتح الـ Terminal ونبدأ مباشرة بتنفيذ **أول مهمة في المرحلة الأولى** (إنشاء مشروع Laravel الجديد)!
