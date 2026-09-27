<?php

namespace App\Http\Controllers;

use App\Models\IpLog;
use App\Models\Setting;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SettingsController extends Controller
{
    public function index()
    {
        return Inertia::render('Settings/Index', [
            'settings' => [
                'late_threshold_minutes' => (int) Setting::get('late_threshold_minutes', 10),
                'break_minutes' => (int) Setting::get('break_minutes', 60),
                'company_name' => (string) Setting::get('company_name', 'Time Tracker'),
                'leave_allow_sick' => (int) Setting::get('leave_allow_sick', 10),
                'leave_allow_casual' => (int) Setting::get('leave_allow_casual', 12),
                'leave_allow_annual' => (int) Setting::get('leave_allow_annual', 14),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'late_threshold_minutes' => ['required', 'integer', 'min:0', 'max:180'],
            'break_minutes' => ['required', 'integer', 'min:0', 'max:480'],
            'company_name' => ['nullable', 'string', 'max:100'],
            'leave_allow_sick' => ['required', 'integer', 'min:0', 'max:365'],
            'leave_allow_casual' => ['required', 'integer', 'min:0', 'max:365'],
            'leave_allow_annual' => ['required', 'integer', 'min:0', 'max:365'],
        ]);

        foreach ($data as $k => $v) {
            Setting::put($k, $v);
        }

        return back()->with('success', 'Settings saved.');
    }

    public function ipLogs()
    {
        return Inertia::render('Settings/IpLogs', [
            'logs' => IpLog::with('user:id,name,employee_code')->latest()->limit(200)->get(),
        ]);
    }
}
