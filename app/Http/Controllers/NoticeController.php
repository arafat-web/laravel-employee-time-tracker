<?php

namespace App\Http\Controllers;

use App\Models\Notice;
use App\Models\NoticeRead;
use App\Models\User;
use App\Services\NoticeService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class NoticeController extends Controller
{
    public function index()
    {
        return Inertia::render('Notices/Index', [
            'notices' => Notice::with(['employee:id,name,employee_code', 'creator:id,name'])
                ->latest()->limit(200)->get(),
            'employees' => User::where('role', 'employee')->orderBy('name')->get(['id', 'name', 'employee_code']),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:150'],
            'body' => ['required', 'string', 'max:2000'],
            'kind' => ['required', 'in:general,announcement,salary,late,leave'],
            'audience' => ['required', 'in:all,individual'],
            'user_id' => ['required_if:audience,individual', 'nullable', 'exists:users,id'],
        ]);

        if ($data['audience'] === 'all') {
            NoticeService::broadcast($data['title'], $data['body'], $data['kind'], $request->user()->id);
        } else {
            NoticeService::send($data['title'], $data['body'], $data['kind'], (int) $data['user_id'], $request->user()->id, false, null);
        }

        return back()->with('success', $data['audience'] === 'all' ? 'Notice sent to everyone.' : 'Notice sent.');
    }

    public function destroy(Notice $notice)
    {
        $notice->delete();

        return back()->with('success', 'Notice deleted.');
    }

    // Employee inbox
    public function mine()
    {
        $id = auth()->id();
        $notices = Notice::visibleTo($id)->with('creator:id,name')->latest()->limit(100)->get();
        $readIds = NoticeRead::where('user_id', $id)->pluck('notice_id')->all();
        $notices->each(fn ($n) => $n->is_read = in_array($n->id, $readIds, true));

        return Inertia::render('Notices/Mine', ['notices' => $notices]);
    }

    public function read(Request $request, Notice $notice)
    {
        $id = $request->user()->id;
        if ($notice->scope === 'individual' && $notice->user_id !== $id) {
            abort(403);
        }
        NoticeRead::updateOrCreate(
            ['notice_id' => $notice->id, 'user_id' => $id],
            ['read_at' => now()]
        );

        return back();
    }

    public function readAll(Request $request)
    {
        $id = $request->user()->id;
        $ids = Notice::visibleTo($id)->pluck('id');
        foreach ($ids as $nid) {
            NoticeRead::updateOrCreate(['notice_id' => $nid, 'user_id' => $id], ['read_at' => now()]);
        }

        return back()->with('success', 'All marked as read.');
    }
}
