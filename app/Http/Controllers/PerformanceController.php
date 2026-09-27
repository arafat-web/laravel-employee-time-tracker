<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Leave;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PerformanceController extends Controller
{
    private function scoreFor(int $userId, Carbon $from, Carbon $to): array
    {
        $user = User::with('shift')->find($userId);
        $rows = Attendance::where('user_id', $userId)
            ->whereBetween('date', [$from->toDateString(), $to->toDateString()])->get();

        $present = $rows->filter(fn ($r) => $r->clock_in)->count();
        $absent = $rows->where('status', 'absent')->count();
        $lateCount = $rows->where('late_minutes', '>', 0)->count();
        $lateMinutes = (int) $rows->sum('late_minutes');
        $earlyMinutes = (int) $rows->sum('early_leave_minutes');
        $overtime = (int) $rows->sum('overtime_minutes');
        $work = (int) $rows->sum('work_minutes');
        $leaveDays = (int) Leave::where('user_id', $userId)
            ->where('date_from', '<=', $to->toDateString())
            ->where('date_to', '>=', $from->toDateString())
            ->sum('days');

        // Working days respect shift working_days + holidays (past dates only for absents)
        $holidays = \App\Models\Holiday::whereBetween('date', [$from->toDateString(), $to->toDateString()])->pluck('date')->map(fn ($x) => Carbon::parse($x)->toDateString())->all();
        $recurring = \App\Models\Holiday::where('is_recurring', true)->get()->map(fn ($h) => $h->date->format('m-d'))->all();
        $workingDays = 0;
        $d = $from->copy();
        $todayStr = today()->toDateString();
        while ($d->lessThanOrEqualTo($to)) {
            $ds = $d->toDateString();
            $wd = $user?->shift?->working_days;
            $isWork = is_array($wd) && count($wd) ? in_array((int) $d->dayOfWeek, $wd, true) : ! $d->isWeekend();
            $isHol = in_array($ds, $holidays, true) || in_array(substr($ds, 5), $recurring, true);
            if ($isWork && ! $isHol && $ds <= $todayStr) {
                $workingDays++;
            }
            $d->addDay();
        }
        $workingDays = max(1, $workingDays);
        $attendanceRate = min(1, $present / $workingDays);
        $punctuality = $present > 0 ? max(0, 1 - ($lateCount / $present) * 0.5 - min(0.5, $lateMinutes / 600)) : 0;
        $avgHours = $present > 0 ? ($work / 60) / $present : 0;
        $hoursScore = min(1, $avgHours / 8);
        $score = round(
            $punctuality * 40 + $attendanceRate * 30 + $hoursScore * 20
            + min(10, $overtime / 60) - min(10, $leaveDays * 1.5),
            1
        );
        $score = max(0, min(100, $score));

        return [
            'present' => $present,
            'absent' => $absent,
            'workingDays' => $workingDays,
            'lateCount' => $lateCount,
            'lateMinutes' => $lateMinutes,
            'earlyMinutes' => $earlyMinutes,
            'overtimeMinutes' => $overtime,
            'workMinutes' => $work,
            'avgHours' => round($avgHours, 2),
            'leaveDays' => $leaveDays,
            'score' => $score,
        ];
    }

    public function index(Request $request)
    {
        $month = $request->get('month', now()->format('Y-m'));
        $from = Carbon::parse($month.'-01')->startOfMonth();
        $to = $from->copy()->endOfMonth();

        $employees = User::where('role', 'employee')->orderBy('name')->get(['id', 'name', 'employee_code']);
        $rows = $employees->map(fn ($e) => array_merge(
            ['id' => $e->id, 'name' => $e->name, 'employee_code' => $e->employee_code],
            $this->scoreFor($e->id, $from, $to)
        ))->sortByDesc('score')->values();

        return Inertia::render('Performance/Index', [
            'month' => $month,
            'rows' => $rows,
            'from' => $from->toDateString(),
            'to' => $to->toDateString(),
        ]);
    }

    public function mine(Request $request)
    {
        $month = $request->get('month', now()->format('Y-m'));
        $from = Carbon::parse($month.'-01')->startOfMonth();
        $to = $from->copy()->endOfMonth();

        return Inertia::render('Performance/Mine', [
            'month' => $month,
            'stats' => $this->scoreFor(auth()->id(), $from, $to),
        ]);
    }
}
