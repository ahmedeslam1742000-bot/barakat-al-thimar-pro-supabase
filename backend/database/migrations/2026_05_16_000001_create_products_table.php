<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('name')->index();
            $table->string('company')->nullable()->index();
            $table->string('category')->nullable()->index();
            $table->string('unit')->nullable();
            $table->decimal('price', 12, 2)->nullable();
            $table->decimal('old_price', 12, 2)->nullable();
            $table->decimal('stock_qty', 12, 2)->default(0);
            $table->decimal('damaged_qty', 12, 2)->default(0);
            $table->text('search_key')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['name', 'company', 'category']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
