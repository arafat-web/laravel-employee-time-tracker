<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VaultItem extends Model
{
    protected $fillable = [
        'type', 'title', 'body', 'file_path', 'file_name', 'mime', 'size',
        'visibility', 'user_id',
    ];

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function scopeVisibleTo($query, User $user)
    {
        if ($user->isAdmin()) {
            return $query; // admin sees everything incl. employee private (for HR oversight)
        }

        return $query->where(function ($q) use ($user) {
            $q->where('visibility', 'shared')->orWhere('user_id', $user->id);
        });
    }

    public function isImage(): bool
    {
        return str_starts_with($this->mime ?? '', 'image/');
    }
}
