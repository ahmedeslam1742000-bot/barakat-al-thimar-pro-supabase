<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('voucher_items', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('voucher_id')->constrained('vouchers')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products')->restrictOnDelete();
            $table->decimal('qty', 12, 2);
            $table->string('unit')->nullable();
            $table->string('notes')->nullable();
            $table->timestamps();

            $table->index(['voucher_id', 'product_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('voucher_items');
    }
};
