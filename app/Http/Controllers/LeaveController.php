<?php

namespace App\Http\Controllers;

use App\Models\Leave;
use App\Models\Setting;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LeaveController extends Controller
{
    private function markLeaveDays(int $userId, Carbon $from, Carbon $to): void
    {
        $d = $from->copy();
        while ($d->lessThanOrEqualTo($to)) {
            \App\Models\Attendance::updateOrCreate(
                ['user_id' => $userId, 'date' => $d->toDateString()],
                ['status' => 'leave']
            );
            $d->addDay();
        }
    }

    private function unmarkLeaveDays(int $userId, Carbon $from, Carbon $to): void
    {
        \App\Models\Attendance::where('user_id', $userId)
            ->whereBetween('date', [$from->toDateString(), $to->toDateString()])
            ->where('status', 'leave')
            ->whereNull('clock_in')
            ->delete();
    }

    private function balances(int $userId): array
    {
        $year = now()->year;
        $allow = [
            'sick' => (int) Setting::get('leave_allow_sick', 10),
            'casual' => (int) Setting::get('leave_allow_casual', 12),
            'annual' => (int) Setting::get('leave_allow_annual', 14),
        ];
        $used = [];
        foreach (array_keys($allow) as $type) {
            $used[$type] = (int) Leave::where('user_id', $userId)
                ->where('type', $type)->where('status', 'approved')
                ->whereYear('date_from', $year)->sum('days');
        }

        return [
            'year' => $year,
            'allow' => $allow,
            'used' => $used,
            'left' => [
                'sick' => max(0, $allow['sick'] - $used['sick']),
                'casual' => max(0, $allow['casual'] - $used['casual']),
                'annual' => max(0, $allow['annual'] - $used['annual']),
            ],
        ];
    }

    // ---- Admin ----
    public function index()
    {
        return Inertia::render('Leaves/Index', [
            'leaves' => Leave::with(['user:id,name,employee_code', 'reviewer:id,name'])
                ->orderByRaw("CASE status WHEN 'pending' THEN 0 ELSE 1 END")
                ->orderByDesc('date_from')->limit(200)->get(),
            'employees' => User::where('role', 'employee')->orderBy('name')->get(['id', 'name', 'employee_code']),
            'pendingCount' => Leave::where('status', 'pending')->count(),
            'balances' => null,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'user_id' => ['required', 'exists:users,id'],
            'date_from' => ['required', 'date'],
            'date_to' => ['required', 'date', 'after_or_equal:date_from'],
            'type' => ['required', 'in:sick,casual,annual,unpaid,other'],
            'reason' => ['nullable', 'string'],
        ]);

        $from = Carbon::parse($data['date_from']);
        $to = Carbon::parse($data['date_to']);
        $data['days'] = $from->diffInDays($to) + 1;
        $data['created_by'] = $request->user()->id;
        // Admin direct entry = auto-approved
        $data['status'] = 'approved';
        $data['reviewed_by'] = $request->user()->id;
        $data['reviewed_at'] = now();

        Leave::create($data);
        $this->markLeaveDays((int) $data['user_id'], $from, $to);

        return back()->with('success', 'Leave recorded (approved).');
    }

    public function update(Request $request, Leave $leave)
    {
        $data = $request->validate([
            'date_from' => ['required', 'date'],
            'date_to' => ['required', 'date', 'after_or_equal:date_from'],
            'type' => ['required', 'in:sick,casual,annual,unpaid,other'],
            'reason' => ['nullable', 'string'],
        ]);
        $oldFrom = Carbon::parse($leave->date_from);
        $oldTo = Carbon::parse($leave->date_to);
        $wasApproved = $leave->status === 'approved';

        $from = Carbon::parse($data['date_from']);
        $to = Carbon::parse($data['date_to']);
        $data['days'] = $from->diffInDays($to) + 1;
        $leave->update($data);

        if ($wasApproved) {
            $this->unmarkLeaveDays($leave->user_id, $oldFrom, $oldTo);
            $this->markLeaveDays($leave->user_id, $from, $to);
        }

        return back()->with('success', 'Leave updated.');
    }

    public function review(Request $request, Leave $leave)
    {
        $data = $request->validate([
            'action' => ['required', 'in:approve,reject'],
            'review_note' => ['nullable', 'string', 'max:500'],
        ]);

        $leave->status = $data['action'] === 'approve' ? 'approved' : 'rejected';
        $leave->review_note = $data['review_note'] ?? null;
        $leave->reviewed_by = $request->user()->id;
        $leave->reviewed_at = now();
        $leave->save();

        $from = Carbon::parse($leave->date_from);
        $to = Carbon::parse($leave->date_to);
        if ($leave->status === 'approved') {
            $this->markLeaveDays($leave->user_id, $from, $to);
        } else {
            $this->unmarkLeaveDays($leave->user_id, $from, $to);
        }

        \App\Services\NoticeService::send(
            'Leave '.$leave->status.' — '.$from->toDateString().' → '.$to->toDateString(),
            'Your '.$leave->type.' leave ('.$leave->days.'d) was '.$leave->status.' by admin.'
                .($leave->review_note ? ' Note: '.$leave->review_note : ''),
            'leave',
            $leave->user_id,
            $request->user()->id,
            true,
            ['key' => 'leave:'.$leave->id.':'.$leave->status]
        );

        return back()->with('success', 'Leave '.$leave->status.'.');
    }

    public function destroy(Leave $leave)
    {
        if ($leave->status === 'approved') {
            $this->unmarkLeaveDays(
                $leave->user_id,
                Carbon::parse($leave->date_from),
                Carbon::parse($leave->date_to)
            );
        }
        $leave->delete();

        return back()->with('success', 'Leave deleted.');
    }

    // ---- Employee ----
    public function mine()
    {
        $id = auth()->id();
        $leaves = Leave::where('user_id', $id)->with('reviewer:id,name')->orderByDesc('date_from')->get();
        $approved = $leaves->where('status', 'approved');
        $summary = [
            'total' => (int) $approved->sum('days'),
            'sick' => (int) $approved->where('type', 'sick')->sum('days'),
            'casual' => (int) $approved->where('type', 'casual')->sum('days'),
            'annual' => (int) $approved->where('type', 'annual')->sum('days'),
            'unpaid' => (int) $approved->where('type', 'unpaid')->sum('days'),
            'pending' => (int) $leaves->where('status', 'pending')->sum('days'),
        ];

        return Inertia::render('Leaves/Mine', [
            'leaves' => $leaves,
            'summary' => $summary,
            'balances' => $this->balances($id),
        ]);
    }

    public function apply(Request $request)
    {
        $data = $request->validate([
            'date_from' => ['required', 'date', 'after_or_equal:today'],
            'date_to' => ['required', 'date', 'after_or_equal:date_from'],
            'type' => ['required', 'in:sick,casual,annual,unpaid,other'],
            'reason' => ['required', 'string', 'min:3', 'max:500'],
        ]);

        $from = Carbon::parse($data['date_from']);
        $to = Carbon::parse($data['date_to']);

        // prevent overlapping requests (pending or approved)
        $overlap = Leave::where('user_id', $request->user()->id)
            ->whereIn('status', ['pending', 'approved'])
            ->whereDate('date_from', '<=', $to->toDateString())
            ->whereDate('date_to', '>=', $from->toDateString())
            ->exists();
        if ($overlap) {
            return back()->withErrors(['date_from' => 'Overlaps with an existing leave request.']);
        }

        $data['user_id'] = $request->user()->id;
        $data['days'] = $from->diffInDays($to) + 1;
        $data['created_by'] = $request->user()->id;
        $data['status'] = 'pending';

        Leave::create($data);

        return back()->with('success', 'Leave request sent for approval.');
    }

    public function cancel(Leave $leave)
    {
        if ($leave->user_id !== auth()->id() || $leave->status !== 'pending') {
            abort(403);
        }
        $leave->delete();

        return back()->with('success', 'Request cancelled.');
    }
}
