<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('receipt_vouchers', function (Blueprint $table) {
            $table->boolean('is_settled')->default(false)->index()->after('deposited_at');
            $table->string('settlement_batch_id')->nullable()->index()->after('is_settled');
        });

        Schema::create('journal_entries', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('journal_no')->index();
            $table->decimal('total_amount', 12, 2);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('journal_entries');

        Schema::table('receipt_vouchers', function (Blueprint $table) {
            $table->dropColumn(['is_settled', 'settlement_batch_id']);
        });
    }
};
