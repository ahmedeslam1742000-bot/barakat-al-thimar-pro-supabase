<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class MigrateSupabaseData extends Command
{
    protected $signature = 'app:migrate-supabase-data {--path= : Path to the folder containing JSON files}';

    protected $description = 'Migrates data from Supabase JSON exports into Laravel database.';

    public function handle()
    {
        $path = $this->option('path') ?: storage_path('app/migration');

        if (!is_dir($path)) {
            $this->error("Directory not found: {$path}");
            $this->info("Please create this directory and place your Supabase JSON exports there (products.json, transactions.json, system_settings.json).");
            return 1;
        }

        $this->info("Starting migration from: {$path}");

        DB::beginTransaction();

        try {
            // 1. System Settings
            if (file_exists($path . '/system_settings.json')) {
                $this->info('Migrating System Settings...');
                $settingsData = json_decode(file_get_contents($path . '/system_settings.json'), true);
                foreach ($settingsData as $row) {
                    DB::table('system_settings')->updateOrInsert(
                        ['id' => $row['id']],
                        ['settings' => is_string($row['settings']) ? $row['settings'] : json_encode($row['settings']), 'updated_at' => $row['updated_at'] ?? now()]
                    );
                }
            }

            // 2. Products
            if (file_exists($path . '/products.json')) {
                $this->info('Migrating Products...');
                $productsData = json_decode(file_get_contents($path . '/products.json'), true);
                foreach ($productsData as $p) {
                    DB::table('products')->updateOrInsert(
                        ['id' => $p['id']],
                        [
                            'name' => $p['name'],
                            'company' => $p['company'],
                            'cat' => $p['cat'] ?? $p['category'] ?? null,
                            'unit' => $p['unit'],
                            'price' => current(array_filter([$p['price'] ?? null, 0])),
                            'old_price' => current(array_filter([$p['old_price'] ?? null, 0])),
                            'stock_qty' => $p['stock_qty'] ?? 0,
                            'damaged_qty' => $p['damaged_qty'] ?? 0,
                            'created_at' => $p['created_at'] ?? now(),
                            'updated_at' => $p['updated_at'] ?? now(),
                        ]
                    );
                }
            }

            // 3. Transactions (which map to Vouchers and VoucherItems)
            if (file_exists($path . '/transactions.json')) {
                $this->info('Migrating Transactions (Vouchers)...');
                $transactions = json_decode(file_get_contents($path . '/transactions.json'), true);
                
                // Group transactions by batch_id
                $batches = [];
                foreach ($transactions as $tx) {
                    $batchId = $tx['batch_id'] ?? $tx['id'];
                    if (!isset($batches[$batchId])) {
                        $batches[$batchId] = [];
                    }
                    $batches[$batchId][] = $tx;
                }

                foreach ($batches as $batchId => $lines) {
                    $first = $lines[0];
                    $date = $first['timestamp'] ? date('Y-m-d H:i:s', strtotime($first['timestamp'])) : now();
                    
                    // Infer voucher type from the first transaction
                    $type = $first['type'] ?? 'تسوية';
                    if ($type === 'in' || $type === 'Restock') $type = 'سند إدخال';
                    if ($type === 'out' || $type === 'Issue') $type = 'سند إخراج';
                    if ($type === 'Return') $type = 'مرتجع';

                    $voucherId = DB::table('vouchers')->insertGetId([
                        'type' => $type,
                        'status' => $first['status'] ?? 'مكتمل',
                        'date' => date('Y-m-d', strtotime($date)),
                        'client_name' => $first['supplier'] ?? $first['rep'] ?? $first['loc'] ?? $first['beneficiary'] ?? null,
                        'notes' => $first['notes'] ?? null,
                        'attachment_url' => $first['receipt_image'] ?? null,
                        'created_at' => $date,
                        'updated_at' => $date,
                    ]);

                    foreach ($lines as $line) {
                        if (empty($line['item_id'])) continue;
                        
                        DB::table('voucher_items')->insert([
                            'voucher_id' => $voucherId,
                            'product_id' => $line['item_id'],
                            'qty' => abs($line['qty'] ?? 0),
                            'unit' => $line['unit'] ?? null,
                            'notes' => $line['notes'] ?? null,
                            'created_at' => $date,
                            'updated_at' => $date,
                        ]);
                    }
                }
            }

            DB::commit();
            $this->info('Migration completed successfully! 🎉');

        } catch (\Exception $e) {
            DB::rollBack();
            $this->error('Migration failed: ' . $e->getMessage());
            $this->error($e->getTraceAsString());
            return 1;
        }

        return 0;
    }
}
