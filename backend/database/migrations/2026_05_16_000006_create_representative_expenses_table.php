<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('representative_expenses', function (Blueprint $table) {
            $table->id();
            $table->date('date')->index();
            $table->string('rep_name')->index();
            $table->decimal('amount', 12, 2);
            $table->text('statement')->nullable();
            $table->boolean('is_settled')->default(false)->index();
            $table->string('settlement_batch_id')->nullable()->index();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('representative_expenses');
    }
};
