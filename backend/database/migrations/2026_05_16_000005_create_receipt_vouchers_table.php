<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('receipt_vouchers', function (Blueprint $table) {
            $table->id();
            $table->date('date')->index();
            $table->string('rep_name')->index();
            $table->string('customer_name')->index();
            $table->string('voucher_no')->unique();
            $table->string('invoice_no')->nullable()->index();
            $table->decimal('amount', 12, 2);
            $table->string('type')->index();
            $table->boolean('is_deposited')->default(false)->index();
            $table->timestamp('deposited_at')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('receipt_vouchers');
    }
};
