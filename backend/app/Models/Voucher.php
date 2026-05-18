<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Voucher extends Model
{
    use HasFactory;
    use HasUuids;
    use SoftDeletes;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'voucher_code',
        'type',
        'status',
        'date',
        'client_name',
        'notes',
        'attachment_url',
        'created_by',
    ];

    protected $casts = [
        'date' => 'date',
    ];

    protected $dispatchesEvents = [
        'created' => \App\Events\VoucherCreated::class,
        'updated' => \App\Events\VoucherUpdated::class,
    ];

    public function items(): HasMany
    {
        return $this->hasMany(VoucherItem::class);
    }

    public function histories(): HasMany
    {
        return $this->hasMany(VoucherHistory::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
