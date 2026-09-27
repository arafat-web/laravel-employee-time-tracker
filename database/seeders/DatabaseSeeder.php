<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $adminEmail = env('ADMIN_EMAIL', 'admin@timetracker.local');
        $adminPassword = env('ADMIN_PASSWORD', 'ChangeMe123!');
        $admin = User::firstOrCreate(
            ['email' => $adminEmail],
            [
                'name' => 'Admin',
                'password' => $adminPassword,
                'role' => 'admin',
                'employee_code' => 'ADM-001',
                'employment_status' => 'active',
            ]
        );

        $shift = \App\Models\Shift::firstOrCreate(
            ['name' => 'Day Shift (9-6)'],
            [
                'start_time' => '09:00',
                'end_time' => '18:00',
                'working_days' => [1, 2, 3, 4, 5],
                'break_start' => '13:00',
                'break_end' => '14:00',
                'break_minutes' => 60,
                'grace_late_minutes' => 10,
            ]
        );

        \App\Models\Setting::put('company_name', 'Time Tracker');
        \App\Models\Setting::put('late_threshold_minutes', 10);
        \App\Models\Setting::put('break_minutes', 60);
        \App\Models\Setting::put('leave_allow_sick', 10);
        \App\Models\Setting::put('leave_allow_casual', 12);
        \App\Models\Setting::put('leave_allow_annual', 14);
    }
}
