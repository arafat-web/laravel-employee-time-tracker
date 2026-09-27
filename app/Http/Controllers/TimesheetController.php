<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Holiday;
use App\Models\Leave;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;

class TimesheetController extends Controller
{
    private function build(string $month): array
    {
        $from = Carbon::parse($month.'-01')->startOfMonth();
        $to = $from->copy()->endOfMonth();
        $days = [];
        $d = $from->copy();
        while ($d->lessThanOrEqualTo($to)) {
            $days[] = $d->toDateString();
            $d->addDay();
        }

        $holidays = Holiday::whereBetween('date', [$from->toDateString(), $to->toDateString()])->pluck('date')->map(fn ($x) => Carbon::parse($x)->toDateString())->all();
        $recurring = Holiday::where('is_recurring', true)->get()->map(fn ($h) => $h->date->format('m-d'))->all();

        $isHoliday = function (string $ds) use ($holidays, $recurring) {
            if (in_array($ds, $holidays, true)) {
                return true;
            }

            return in_array(substr($ds, 5), $recurring, true);
        };

        $employees = User::where('role', 'employee')->with('shift:id,name')->orderBy('name')->get();
        $rows = [];

        foreach ($employees as $e) {
            $atts = Attendance::where('user_id', $e->id)
                ->whereBetween('date', [$from->toDateString(), $to->toDateString()])
                ->get()->keyBy(fn ($a) => Carbon::parse($a->date)->toDateString());
            $leaves = Leave::where('user_id', $e->id)
                ->where('date_from', '<=', $to->toDateString())
                ->where('date_to', '>=', $from->toDateString())->get();

            $cells = [];
            $tot = ['present' => 0, 'late' => 0, 'absent' => 0, 'leave' => 0, 'weekend' => 0, 'holiday' => 0, 'work' => 0, 'ot' => 0];
            foreach ($days as $ds) {
                $carbon = Carbon::parse($ds);
                $wd = $e->shift?->working_days;
                $workingDay = is_array($wd) && count($wd) ? in_array((int) $carbon->dayOfWeek, $wd, true) : ! $carbon->isWeekend();
                $onLeave = $leaves->first(fn ($l) => $l->date_from <= $ds && $l->date_to >= $ds);
                $att = $atts->get($ds);

                if ($isHoliday($ds)) {
                    $cells[$ds] = 'H';
                    $tot['holiday']++;
                } elseif ($onLeave) {
                    $cells[$ds] = 'L';
                    $tot['leave']++;
                } elseif ($att) {
                    if ($att->clock_in) {
                        $cells[$ds] = $att->late_minutes > 0 ? 'LATE' : 'P';
                        $tot['present']++;
                        if ($att->late_minutes > 0) {
                            $tot['late']++;
                        }
                        $tot['work'] += (int) $att->work_minutes;
                        $tot['ot'] += (int) $att->overtime_minutes;
                    } else {
                        $cells[$ds] = strtoupper(substr($att->status, 0, 1)) === 'A' ? 'A' : $att->status;
                        if ($att->status === 'absent') {
                            $tot['absent']++;
                        }
                    }
                } elseif (! $workingDay) {
                    $cells[$ds] = 'W';
                    $tot['weekend']++;
                } else {
                    $cells[$ds] = $carbon->isFuture() ? '' : 'A';
                    if (! $carbon->isFuture()) {
                        $tot['absent']++;
                    }
                }
            }

            $rows[] = [
                'id' => $e->id, 'name' => $e->name, 'employee_code' => $e->employee_code,
                'shift' => $e->shift?->name, 'cells' => $cells, 'totals' => $tot,
            ];
        }

        return ['month' => $from->format('Y-m'), 'from' => $from->toDateString(), 'to' => $to->toDateString(), 'days' => $days, 'rows' => $rows];
    }

    public function index(Request $request)
    {
        $data = $this->build($request->get('month', now()->format('Y-m')));

        return Inertia::render('Timesheet/Index', $data);
    }

    public function export(Request $request): StreamedResponse
    {
        $data = $this->build($request->get('month', now()->format('Y-m')));
        $filename = 'timesheet-'.$data['month'].'.csv';

        return response()->streamDownload(function () use ($data) {
            $out = fopen('php://output', 'w');
            $head = array_merge(['Employee', 'Code', 'Shift'], $data['days'], ['Present', 'Late', 'Absent', 'Leave', 'Work(min)', 'OT(min)']);
            fputcsv($out, $head);
            foreach ($data['rows'] as $r) {
                $line = [$r['name'], $r['employee_code'], $r['shift']];
                foreach ($data['days'] as $ds) {
                    $line[] = $r['cells'][$ds] ?? '';
                }
                $line[] = $r['totals']['present'];
                $line[] = $r['totals']['late'];
                $line[] = $r['totals']['absent'];
                $line[] = $r['totals']['leave'];
                $line[] = $r['totals']['work'];
                $line[] = $r['totals']['ot'];
                fputcsv($out, $line);
            }
            fclose($out);
        }, $filename, ['Content-Type' => 'text/csv']);
    }
}
