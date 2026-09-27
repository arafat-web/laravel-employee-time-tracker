<?php

namespace App\Console\Commands;

use App\Models\Attendance;
use App\Models\BreakModel;
use App\Services\AttendanceService;
use Carbon\Carbon;
use Illuminate\Console\Command;

class AutoCloseOpenTimers extends Command
{
    protected $signature = 'attendance:auto-close {--date=}';
    protected $description = 'Auto clock-out forgotten open timers at shift end (or 23:59) and close open breaks';

    public function handle(AttendanceService $service): int
    {
        $date = $this->option('date') ? Carbon::parse($this->option('date')) : Carbon::yesterday();
        $dateStr = $date->toDateString();
        $closed = 0;

        $rows = Attendance::with(['user.shift', 'breaks'])
            ->whereDate('date', $dateStr)
            ->whereNotNull('clock_in')->whereNull('clock_out')->get();

        foreach ($rows as $att) {
            $shift = $att->user?->shift;
            if ($shift) {
                $end = Carbon::parse($dateStr.' '.$shift->end_time);
                if ($end->lessThan(Carbon::parse($dateStr.' '.$shift->start_time))) {
                    $end->addDay();
                }
            } else {
                $end = Carbon::parse($dateStr.' 23:59:00');
            }
            // never close in the future
            if ($end->isFuture()) {
                continue;
            }

            foreach ($att->breaks->whereNull('break_end') as $br) {
                $br->break_end = $end->copy()->subMinute();
                if ($br->break_end->lessThan($br->break_start)) {
                    $br->break_end = $br->break_start;
                }
                $br->duration_minutes = (int) $br->break_start->diffInMinutes($br->break_end);
                $br->save();
            }

            $att->clock_out = $end;
            $att->clock_out_ip = null;
            $att->note = trim(($att->note ? $att->note.' | ' : '').'Auto-closed (forgotten clock-out)');
            $att->save();
            $service->recalculate($att);
            $closed++;
        }

        $this->info("Auto-closed {$closed} timer(s) for {$dateStr}.");

        return 0;
    }
}
