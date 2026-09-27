<?php

namespace App\Services;

use App\Models\Attendance;
use App\Models\User;
use App\Services\NoticeService;
use Carbon\Carbon;

class AttendanceService
{
    public function recalculate(Attendance $attendance): Attendance
    {
        $attendance->loadMissing(['user.shift', 'breaks']);
        $user = $attendance->user;
        $shift = $user?->shift;

        $breakMinutes = (int) $attendance->breaks->sum('duration_minutes');
        foreach ($attendance->breaks->whereNull('break_end') as $open) {
            $breakMinutes += $open->break_start->diffInMinutes(now());
        }
        $attendance->break_minutes = $breakMinutes;

        $late = 0;
        $early = 0;
        $overtime = 0;
        $work = 0;

        if ($attendance->clock_in) {
            $end = $attendance->clock_out ?? now();
            $work = max(0, (int) $attendance->clock_in->diffInMinutes($end) - $breakMinutes);
            $attendance->work_minutes = $work;

            if ($shift) {
                $dateStr = $attendance->date->toDateString();
                $shiftStart = Carbon::parse($dateStr.' '.$shift->start_time);
                $shiftEnd = Carbon::parse($dateStr.' '.$shift->end_time);
                if ($shiftEnd->lessThan($shiftStart)) {
                    $shiftEnd->addDay();
                }
                $clockIn = Carbon::parse($attendance->clock_in);
                $clockOut = $attendance->clock_out ? Carbon::parse($attendance->clock_out) : null;

                $grace = (int) ($shift->grace_late_minutes ?? 10);
                if ($clockIn->greaterThan($shiftStart->copy()->addMinutes($grace))) {
                    $late = (int) $shiftStart->diffInMinutes($clockIn);
                }

                if ($clockOut) {
                    if ($clockOut->lessThan($shiftEnd)) {
                        $early = (int) $clockOut->diffInMinutes($shiftEnd);
                    } elseif ($clockOut->greaterThan($shiftEnd)) {
                        $overtime = (int) $shiftEnd->diffInMinutes($clockOut);
                    }
                }
            }
        }

        $attendance->late_minutes = $late;
        $attendance->early_leave_minutes = $early;
        $attendance->overtime_minutes = $overtime;

        $wasLate = ($attendance->getOriginal('late_minutes') ?? 0) === 0 && $late > 0;

        if ($attendance->clock_in && ! $attendance->clock_out) {
            $attendance->status = $late > 0 ? 'late' : 'present';
        } elseif ($attendance->clock_in && $attendance->clock_out) {
            $attendance->status = $late > 0 ? 'late' : 'present';
        }

        $attendance->save();

        // Auto late notice (once per day)
        if ($wasLate && $attendance->user_id) {
            NoticeService::send(
                'Late arrival — '.$late.' min',
                'You clocked in '.$late.' min after your shift start ('.$attendance->date->toDateString().'). Please be on time.',
                'late',
                $attendance->user_id,
                null,
                true,
                ['key' => 'late:'.$attendance->date->toDateString()]
            );
        }

        return $attendance;
    }

    public function todayFor(User $user): Attendance
    {
        $today = today()->toDateString();

        $existing = Attendance::where('user_id', $user->id)->whereDate('date', $today)->first();
        if ($existing) {
            return $existing;
        }

        return Attendance::create([
            'user_id' => $user->id,
            'date' => $today,
            'status' => 'present',
        ]);
    }
}
