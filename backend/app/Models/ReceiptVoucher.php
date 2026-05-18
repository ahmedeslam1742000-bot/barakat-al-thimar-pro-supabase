<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class ReceiptVoucher extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'date',
        'rep_name',
        'customer_name',
        'voucher_no',
        'invoice_no',
        'amount',
        'type',
        'is_deposited',
        'deposited_at',
        'is_settled',
        'settlement_batch_id',
        'created_by',
    ];

    protected $casts = [
        'date' => 'date',
        'amount' => 'decimal:2',
        'is_deposited' => 'boolean',
        'deposited_at' => 'datetime',
        'is_settled' => 'boolean',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
