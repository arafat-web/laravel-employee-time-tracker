<?php

namespace App\Console\Commands;

use App\Models\Attendance;
use App\Models\Holiday;
use App\Models\Leave;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Console\Command;

class MarkAbsents extends Command
{
    protected $signature = 'attendance:mark-absents {--date=}';
    protected $description = 'Mark employees absent when they have no clock-in and no leave on a working day';

    public function handle(): int
    {
        $date = $this->option('date') ? Carbon::parse($this->option('date')) : Carbon::yesterday();
        $dateStr = $date->toDateString();
        $count = 0;

        if ($this->isHoliday($date)) {
            $this->info("{$dateStr} is a holiday, skipping.");

            return 0;
        }

        foreach (User::where('role', 'employee')->where('employment_status', 'active')->with('shift')->get() as $emp) {
            if (! $this->isWorkingDay($emp, $date)) {
                continue;
            }
            $onLeave = Leave::where('user_id', $emp->id)
                ->where('date_from', '<=', $dateStr)->where('date_to', '>=', $dateStr)->exists();
            if ($onLeave) {
                continue;
            }
            $exists = Attendance::where('user_id', $emp->id)->whereDate('date', $dateStr)->exists();
            if ($exists) {
                continue;
            }
            Attendance::create(['user_id' => $emp->id, 'date' => $dateStr, 'status' => 'absent']);
            $count++;
        }

        $this->info("Marked {$count} absent(s) for {$dateStr}.");

        return 0;
    }

    private function isWorkingDay(User $emp, Carbon $date): bool
    {
        $days = $emp->shift?->working_days;
        if (is_array($days) && count($days) > 0) {
            return in_array((int) $date->dayOfWeek, $days, true);
        }

        return ! $date->isWeekend();
    }

    private function isHoliday(Carbon $date): bool
    {
        $str = $date->toDateString();
        if (Holiday::where('date', $str)->exists()) {
            return true;
        }
        // recurring: match month-day
        $md = $date->format('m-d');

        return Holiday::where('is_recurring', true)->get()
            ->contains(fn ($h) => $h->date->format('m-d') === $md);
    }
}
