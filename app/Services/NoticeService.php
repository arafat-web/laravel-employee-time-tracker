<?php

namespace App\Services;

use App\Models\Notice;
use App\Models\User;

class NoticeService
{
    public static function send(
        string $title,
        string $body,
        string $kind = 'general',
        ?int $userId = null,
        ?int $createdBy = null,
        bool $isAuto = false,
        ?array $meta = null,
    ): Notice {
        // dedupe auto notices: same kind+user+meta key within 24h
        if ($isAuto && $userId) {
            $key = $meta['key'] ?? null;
            $exists = Notice::where('is_auto', true)
                ->where('kind', $kind)
                ->where('user_id', $userId)
                ->where('created_at', '>=', now()->subDay())
                ->when($key, function ($q) use ($key) {
                    return $q->where('meta->key', $key);
                })
                ->exists();
            if ($exists) {
                return Notice::where('is_auto', true)->where('kind', $kind)->where('user_id', $userId)->latest()->first();
            }
        }

        return Notice::create([
            'title' => $title,
            'body' => $body,
            'kind' => $kind,
            'scope' => $userId ? 'individual' : 'all',
            'user_id' => $userId,
            'created_by' => $createdBy,
            'is_auto' => $isAuto,
            'meta' => $meta,
        ]);
    }

    public static function broadcast(string $title, string $body, string $kind = 'announcement', ?int $createdBy = null): Notice
    {
        return static::send($title, $body, $kind, null, $createdBy, false, null);
    }

    public static function unreadCount(int $userId): int
    {
        $ids = Notice::visibleTo($userId)->pluck('id');
        if ($ids->isEmpty()) {
            return 0;
        }
        $read = \App\Models\NoticeRead::where('user_id', $userId)->whereIn('notice_id', $ids)->pluck('notice_id');

        return $ids->diff($read)->count();
    }
}
