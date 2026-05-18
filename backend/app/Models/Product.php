<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'name',
        'company',
        'category',
        'unit',
        'price',
        'old_price',
        'stock_qty',
        'damaged_qty',
        'search_key',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'old_price' => 'decimal:2',
        'stock_qty' => 'decimal:2',
        'damaged_qty' => 'decimal:2',
    ];

    protected $dispatchesEvents = [
        'saved' => \App\Events\ProductUpdated::class,
        'deleted' => \App\Events\ProductUpdated::class,
    ];

    public function voucherItems(): HasMany
    {
        return $this->hasMany(VoucherItem::class);
    }
}
