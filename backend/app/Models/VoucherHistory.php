<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VoucherHistory extends Model
{
    use HasFactory;

    protected $fillable = [
        'voucher_id',
        'user_id',
        'user_name',
        'action_type',
        'previous_data',
        'new_data',
        'notes',
    ];

    protected $casts = [
        'previous_data' => 'array',
        'new_data' => 'array',
    ];

    protected $dispatchesEvents = [
        'created' => \App\Events\TransactionCreated::class,
    ];

    public function voucher(): BelongsTo
    {
        return $this->belongsTo(Voucher::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
