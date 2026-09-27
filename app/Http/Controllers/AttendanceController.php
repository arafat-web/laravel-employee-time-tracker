<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\BreakModel;
use App\Models\IpLog;
use App\Models\Setting;
use App\Services\AttendanceService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AttendanceController extends Controller
{
    public function myTime(AttendanceService $service)
    {
        $user = auth()->user()->load('shift');
        $attendance = $service->todayFor($user);
        $attendance->load('breaks');
        $service->recalculate($attendance);

        $history = Attendance::where('user_id', $user->id)
            ->with('breaks')->orderByDesc('date')->limit(30)->get();

        return Inertia::render('Time/MyTime', [
            'shift' => $user->shift,
            'attendance' => $attendance->fresh('breaks'),
            'history' => $history,
            'allowedBreakMinutes' => (int) Setting::get('break_minutes', $user->shift?->break_minutes ?? 60),
        ]);
    }

    public function clockIn(Request $request, AttendanceService $service)
    {
        $user = $request->user();
        $attendance = $service->todayFor($user);

        if ($attendance->clock_in) {
            return back()->withErrors(['clock' => 'Already clocked in today.']);
        }

        $attendance->clock_in = now();
        $attendance->clock_in_ip = $request->ip();
        $attendance->save();
        $service->recalculate($attendance);

        IpLog::create(['user_id' => $user->id, 'ip_address' => $request->ip(), 'action' => 'clock_in']);

        return back()->with('success', 'Clocked in at '.now()->format('H:i'));
    }

    public function clockOut(Request $request, AttendanceService $service)
    {
        $user = $request->user();
        $attendance = $service->todayFor($user);

        if (! $attendance->clock_in) {
            return back()->withErrors(['clock' => 'Clock in first.']);
        }
        if ($attendance->clock_out) {
            return back()->withErrors(['clock' => 'Already clocked out.']);
        }

        // auto-end open break
        $open = BreakModel::where('attendance_id', $attendance->id)->whereNull('break_end')->first();
        if ($open) {
            $open->break_end = now();
            $open->break_end_ip = $request->ip();
            $open->duration_minutes = (int) $open->break_start->diffInMinutes(now());
            $open->save();
        }

        $attendance->clock_out = now();
        $attendance->clock_out_ip = $request->ip();
        $attendance->save();
        $service->recalculate($attendance);

        IpLog::create(['user_id' => $user->id, 'ip_address' => $request->ip(), 'action' => 'clock_out']);

        return back()->with('success', 'Clocked out at '.now()->format('H:i'));
    }

    public function breakStart(Request $request, AttendanceService $service)
    {
        $user = $request->user();
        $attendance = $service->todayFor($user);

        if (! $attendance->clock_in || $attendance->clock_out) {
            return back()->withErrors(['break' => 'You must be clocked in to start a break.']);
        }

        $exists = BreakModel::where('attendance_id', $attendance->id)->whereNull('break_end')->exists();
        if ($exists) {
            return back()->withErrors(['break' => 'Break already in progress.']);
        }

        $allowed = (int) Setting::get('break_minutes', $user->shift?->break_minutes ?? 60);
        $used = (int) $attendance->breaks()->sum('duration_minutes');
        if ($used >= $allowed) {
            return back()->withErrors(['break' => 'Break limit reached ('.$allowed.' min).']);
        }

        BreakModel::create([
            'attendance_id' => $attendance->id,
            'user_id' => $user->id,
            'break_start' => now(),
            'break_start_ip' => $request->ip(),
        ]);

        IpLog::create(['user_id' => $user->id, 'ip_address' => $request->ip(), 'action' => 'break_start']);
        $service->recalculate($attendance);

        return back()->with('success', 'Break started.');
    }

    public function breakEnd(Request $request, AttendanceService $service)
    {
        $user = $request->user();
        $attendance = $service->todayFor($user);

        $open = BreakModel::where('attendance_id', $attendance->id)->whereNull('break_end')->first();
        if (! $open) {
            return back()->withErrors(['break' => 'No active break.']);
        }

        $open->break_end = now();
        $open->break_end_ip = $request->ip();
        $open->duration_minutes = (int) $open->break_start->diffInMinutes(now());
        $open->save();

        IpLog::create(['user_id' => $user->id, 'ip_address' => $request->ip(), 'action' => 'break_end']);
        $service->recalculate($attendance);

        $allowed = (int) Setting::get('break_minutes', $user->shift?->break_minutes ?? 60);
        $total = (int) $attendance->fresh()->break_minutes;
        $msg = 'Break ended ('.$open->duration_minutes.' min).';
        if ($total > $allowed) {
            $msg .= ' Exceeded limit by '.($total - $allowed).' min.';
        }

        return back()->with('success', $msg);
    }

    // Admin views
    public function index(Request $request)
    {
        $date = $request->get('date', today()->toDateString());
        $rows = Attendance::with(['user:id,name,employee_code', 'breaks'])
            ->whereDate('date', $date)->orderBy('clock_in')->get();

        return Inertia::render('Attendance/Index', [
            'date' => $date,
            'rows' => $rows,
        ]);
    }

    public function update(Request $request, Attendance $attendance, AttendanceService $service)
    {
        $data = $request->validate([
            'clock_in' => ['nullable', 'date'],
            'clock_out' => ['nullable', 'date'],
            'status' => ['nullable', 'string', 'max:30'],
            'note' => ['nullable', 'string', 'max:500'],
            'clear_clock_in' => ['nullable', 'boolean'],
            'clear_clock_out' => ['nullable', 'boolean'],
            'breaks' => ['nullable', 'array'],
            'breaks.*.id' => ['required', 'integer', 'exists:breaks,id'],
            'breaks.*.break_start' => ['nullable', 'date'],
            'breaks.*.break_end' => ['nullable', 'date'],
            'breaks.*.delete' => ['nullable', 'boolean'],
        ]);

        $before = $attendance->fresh('breaks')->toArray();
        $beforeBreaks = BreakModel::where('attendance_id', $attendance->id)->get()->toArray();

        // Handle accidental clock in/out: allow clearing or correcting
        if (! empty($data['clear_clock_in'])) {
            $attendance->clock_in = null;
            $attendance->clock_in_ip = null;
        } elseif (array_key_exists('clock_in', $data)) {
            $attendance->clock_in = $data['clock_in'];
        }

        if (! empty($data['clear_clock_out'])) {
            $attendance->clock_out = null;
            $attendance->clock_out_ip = null;
        } elseif (array_key_exists('clock_out', $data)) {
            $attendance->clock_out = $data['clock_out'];
        }

        if (array_key_exists('status', $data) && $data['status'] !== null) {
            $attendance->status = $data['status'];
        }
        if (array_key_exists('note', $data)) {
            $attendance->note = $data['note'];
        }
        $attendance->save();

        // Adjust breaks (fix accidental break taps or delete them)
        foreach ($data['breaks'] ?? [] as $b) {
            $br = BreakModel::where('attendance_id', $attendance->id)->find($b['id']);
            if (! $br) {
                continue;
            }
            if (! empty($b['delete'])) {
                $br->delete();
                continue;
            }
            if (array_key_exists('break_start', $b)) {
                $br->break_start = $b['break_start'];
            }
            if (array_key_exists('break_end', $b)) {
                $br->break_end = $b['break_end'];
            }
            if ($br->break_start && $br->break_end) {
                $br->duration_minutes = max(0, (int) $br->break_start->diffInMinutes($br->break_end));
            } else {
                $br->duration_minutes = 0;
            }
            $br->save();
        }

        // If clock-in was cleared, also clear clock-out + open breaks to fully reset the accidental tap
        if ($attendance->clock_in === null) {
            if ($attendance->clock_out !== null) {
                $attendance->clock_out = null;
                $attendance->clock_out_ip = null;
                $attendance->save();
            }
        }

        $service->recalculate($attendance->fresh('breaks'));

        $after = $attendance->fresh('breaks')->toArray();
        \App\Models\AttendanceAudit::create([
            'attendance_id' => $attendance->id,
            'user_id' => $attendance->user_id,
            'changed_by' => $request->user()->id,
            'before' => ['attendance' => $before, 'breaks' => $beforeBreaks],
            'after' => ['attendance' => $after, 'breaks' => $after['breaks'] ?? []],
            'note' => $data['note'] ?? null,
            'ip_address' => $request->ip(),
        ]);

        IpLog::create([
            'user_id' => $request->user()->id,
            'ip_address' => $request->ip(),
            'action' => 'attendance_adjust',
            'user_agent' => substr('adjusted attendance #'.$attendance->id, 0, 500),
        ]);

        return back()->with('success', 'Attendance adjusted.');
    }
}
