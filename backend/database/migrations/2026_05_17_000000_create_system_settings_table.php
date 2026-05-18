<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('system_settings', function (Blueprint $table) {
            $table->string('id', 36)->primary();
            $table->json('settings');
            $table->timestamps();
        });

        // Insert default settings row
        DB::table('system_settings')->insert([
            'id' => '00000000-0000-0000-0000-000000000001',
            'settings' => json_encode([
                'orgEmoji' => '🌿',
                'orgName' => 'مؤسسة بركة الثمار',
                'orgSubtitle' => 'للتجارة والتوزيع الغذائي',
                'orgContact' => '',
                'defaultUnit' => 'كرتونة',
                'defaultBrand' => '',
                'systemFrozen' => false,
                'voucherCustomAccent' => '',
                'voucherFontSize' => 'medium',
                'lowStockThreshold' => 50,
                'voucherShowCompany' => true,
                'voucherShowNotes' => true,
                'uiShowSignatureBox' => true,
                'uiShowVoucherCode' => true,
                'uiShowUnit' => true,
                'filenameFormat' => 'code_date',
                'lastCleanupDate' => null,
                'lastBackupDate' => null,
                'labels' => [
                    'voucherIn' => 'سند إدخال',
                    'voucherOut' => 'سند إخراج',
                    'stockIn' => 'وارد',
                    'stockOut' => 'صادر',
                    'returns' => 'مرتجع',
                ],
            ]),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('system_settings');
    }
};
