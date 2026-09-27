<?php

namespace Tests\Feature;

use App\Models\Shift;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TimeTrackerTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_login_from_any_ip(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'password' => 'password']);
        $this->post('/login', ['email' => $admin->email, 'password' => 'password'])
            ->assertRedirect('/dashboard');
        $this->assertAuthenticatedAs($admin);
    }

    public function test_employee_blocked_from_unlisted_ip(): void
    {
        $emp = User::factory()->create([
            'role' => 'employee', 'password' => 'password', 'allowed_ips' => '10.0.0.1',
        ]);
        $this->post('/login', ['email' => $emp->email, 'password' => 'password'])
            ->assertRedirect('/login');
        $this->assertGuest();
    }

    public function test_employee_can_clock_in_out_and_break(): void
    {
        $shift = Shift::create([
            'name' => 'Day', 'start_time' => '09:00', 'end_time' => '18:00',
            'working_days' => [1, 2, 3, 4, 5], 'break_minutes' => 60, 'grace_late_minutes' => 10,
        ]);
        $emp = User::factory()->create(['role' => 'employee', 'shift_id' => $shift->id]);

        $this->actingAs($emp)->post('/my-time/clock-in')->assertRedirect();
        $this->assertDatabaseHas('attendances', ['user_id' => $emp->id]);
        $this->assertDatabaseHas('ip_logs', ['user_id' => $emp->id, 'action' => 'clock_in']);

        $this->actingAs($emp)->post('/my-time/break-start')->assertRedirect();
        $this->actingAs($emp)->post('/my-time/break-end')->assertRedirect();
        $this->actingAs($emp)->post('/my-time/clock-out')->assertRedirect();

        $this->assertDatabaseHas('breaks', ['user_id' => $emp->id]);
    }

    public function test_admin_can_add_leave_and_salary(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $emp = User::factory()->create(['role' => 'employee']);

        $this->actingAs($admin)->post('/leaves', [
            'user_id' => $emp->id, 'date_from' => today()->toDateString(),
            'date_to' => today()->toDateString(), 'type' => 'casual',
        ])->assertRedirect();
        $this->assertDatabaseHas('leaves', ['user_id' => $emp->id]);

        $this->actingAs($admin)->post('/salaries', [
            'user_id' => $emp->id, 'month' => now()->startOfMonth()->toDateString(),
            'base_amount' => 50000,
        ])->assertRedirect();
        $this->assertDatabaseHas('salaries', ['user_id' => $emp->id, 'net_amount' => 50000]);
    }

    public function test_admin_can_adjust_accidental_clock_in_out(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $emp = User::factory()->create(['role' => 'employee']);

        $this->actingAs($emp)->post('/my-time/clock-in')->assertRedirect();
        $att = \App\Models\Attendance::where('user_id', $emp->id)->first();
        $this->assertNotNull($att->clock_in);

        // Correct the time
        $this->actingAs($admin)->patch("/attendance/{$att->id}", [
            'clock_in' => today()->setTime(9, 5)->toDateTimeString(),
            'note' => 'accidental tap, corrected',
        ])->assertRedirect();
        $this->assertEquals('09:05', $att->fresh()->clock_in->format('H:i'));

        // Clear accidental clock-out (none yet) + clock-in fully resets the day
        $this->actingAs($admin)->patch("/attendance/{$att->id}", [
            'clear_clock_in' => true,
            'note' => 'false alarm, remove',
        ])->assertRedirect();
        $this->assertNull($att->fresh()->clock_in);
    }
}
