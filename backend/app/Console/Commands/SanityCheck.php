<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class SanityCheck extends Command
{
    protected $signature = 'app:sanity-check';

    protected $description = 'Checks database integrity, orphaned records, and stock discrepancies.';

    public function handle()
    {
        $this->info("🔍 Starting Database Sanity Check...");

        // 1. Check orphaned Voucher Items
        $orphanedItems = DB::table('voucher_items')
            ->whereNotIn('voucher_id', function ($query) {
                $query->select('id')->from('vouchers');
            })->count();

        if ($orphanedItems > 0) {
            $this->error("❌ Found {$orphanedItems} orphaned voucher items.");
        } else {
            $this->info("✅ No orphaned voucher items found.");
        }

        // 2. Check orphaned Voucher Histories
        $orphanedHistories = DB::table('voucher_histories')
            ->whereNotIn('voucher_id', function ($query) {
                $query->select('id')->from('vouchers');
            })->count();

        if ($orphanedHistories > 0) {
            $this->error("❌ Found {$orphanedHistories} orphaned voucher histories.");
        } else {
            $this->info("✅ No orphaned voucher histories found.");
        }

        // 3. Check for negative stock quantities
        $negativeStocks = DB::table('products')->where('stock_qty', '<', 0)->count();
        if ($negativeStocks > 0) {
            $this->error("❌ Found {$negativeStocks} products with negative stock quantity.");
            $prods = DB::table('products')->where('stock_qty', '<', 0)->get(['id', 'name', 'stock_qty']);
            foreach ($prods as $p) {
                $this->line("   - {$p->name} (Stock: {$p->stock_qty})");
            }
        } else {
            $this->info("✅ All product stocks are non-negative.");
        }

        $this->info("✨ Sanity Check Completed.");
        return 0;
    }
}
