<?php

namespace App\Events;

use App\Models\VoucherHistory;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TransactionCreated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $transaction;

    public function __construct(VoucherHistory $transaction)
    {
        $this->transaction = $transaction;
    }

    public function broadcastOn(): array
    {
        return [
            new Channel('transactions'),
        ];
    }
}
