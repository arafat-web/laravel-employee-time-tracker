<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Shift extends Model
{
    protected $fillable = [
        'name', 'start_time', 'end_time', 'working_days',
        'break_start', 'break_end', 'break_minutes', 'grace_late_minutes',
    ];

    protected function casts(): array
    {
        return ['working_days' => 'array'];
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }
}
