<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Leave;
use App\Models\Setting;
use App\Models\User;
use App\Services\AttendanceService;
use Carbon\Carbon;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(AttendanceService $service)
    {
        $user = auth()->user();

        if ($user->isAdmin()) {
            $today = today()->toDateString();
            $stats = [
                'employees' => User::where('role', 'employee')->count(),
                'presentToday' => Attendance::where('date', $today)->whereNotNull('clock_in')->count(),
                'lateToday' => Attendance::where('date', $today)->where('late_minutes', '>', 0)->count(),
                'onBreak' => \App\Models\BreakModel::whereNull('break_end')->whereDate('break_start', $today)->count(),
                'activeTimers' => Attendance::where('date', $today)->whereNotNull('clock_in')->whereNull('clock_out')->count(),
                'leavesThisMonth' => Leave::whereMonth('date_from', now()->month)->whereYear('date_from', now()->year)->sum('days'),
            ];
            $recent = Attendance::with('user:id,name,employee_code')
                ->latest('updated_at')->limit(8)->get();
            $lateThreshold = (int) Setting::get('late_threshold_minutes', 10);
            $breakMinutes = (int) Setting::get('break_minutes', 60);

            return Inertia::render('Dashboard/Admin', [
                'stats' => $stats,
                'recent' => $recent,
                'defaults' => ['late_threshold_minutes' => $lateThreshold, 'break_minutes' => $breakMinutes],
            ]);
        }

        $user->load('shift');
        $attendance = $service->todayFor($user);
        $attendance->load('breaks');
        $service->recalculate($attendance);

        $weekStart = now()->startOfWeek();
        $week = Attendance::where('user_id', $user->id)
            ->where('date', '>=', $weekStart->toDateString())
            ->orderBy('date')->get();

        $openBreak = $attendance->breaks->firstWhere('break_end', null);

        return Inertia::render('Dashboard/Employee', [
            'shift' => $user->shift,
            'attendance' => $attendance,
            'openBreak' => $openBreak,
            'week' => $week,
            'lateThreshold' => (int) Setting::get('late_threshold_minutes', $user->shift?->grace_late_minutes ?? 10),
            'allowedBreakMinutes' => (int) Setting::get('break_minutes', $user->shift?->break_minutes ?? 60),
            'today' => now()->toDateTimeString(),
        ]);
    }
}
