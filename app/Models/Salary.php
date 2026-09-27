<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Salary extends Model
{
    protected $fillable = [
        'user_id', 'month', 'base_amount', 'allowances',
        'deductions', 'bonus', 'net_amount', 'notes', 'is_paid',
    ];

    protected function casts(): array
    {
        return [
            'month' => 'date',
            'is_paid' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
