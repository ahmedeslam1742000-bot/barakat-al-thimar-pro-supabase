<?php

namespace App\Events;

use App\Models\Voucher;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class VoucherCreated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $voucher;

    public function __construct(Voucher $voucher)
    {
        $this->voucher = $voucher;
    }

    public function broadcastOn(): array
    {
        return [
            new Channel('vouchers'),
        ];
    }
}
