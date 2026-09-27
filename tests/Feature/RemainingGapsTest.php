<?php

namespace Tests\Feature;

use App\Models\Attendance;
use App\Models\Holiday;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RemainingGapsTest extends TestCase
{
    use RefreshDatabase;

    public function test_absent_marking_command(): void
    {
        $emp = User::factory()->create(['role' => 'employee']);
        // a past weekday with no record and no leave
        $date = now()->subDays(3);
        while ($date->isWeekend()) {
            $date->subDay();
        }
        $this->artisan('attendance:mark-absents', ['--date' => $date->toDateString()])->assertOk();
        $att = Attendance::where('user_id', $emp->id)->first();
        $this->assertNotNull($att);
        $this->assertEquals($date->toDateString(), $att->date->toDateString());
        $this->assertEquals('absent', $att->status);
    }

    public function test_holiday_skips_absent(): void
    {
        $emp = User::factory()->create(['role' => 'employee']);
        $date = now()->subDays(2)->toDateString();
        Holiday::create(['name' => 'Test Day', 'date' => $date]);
        $this->artisan('attendance:mark-absents', ['--date' => $date])->assertOk();
        $this->assertDatabaseMissing('attendances', ['user_id' => $emp->id, 'date' => $date]);
    }

    public function test_auto_close_forgotten_timer(): void
    {
        $emp = User::factory()->create(['role' => 'employee']);
        $date = now()->subDays(1)->toDateString();
        $att = Attendance::create([
            'user_id' => $emp->id, 'date' => $date,
            'clock_in' => $date.' 09:00:00', 'status' => 'present',
        ]);
        $this->artisan('attendance:auto-close', ['--date' => $date])->assertOk();
        $this->assertNotNull($att->fresh()->clock_out);
    }

    public function test_timesheet_and_csv(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin)->get('/timesheet?month='.now()->format('Y-m'))->assertOk();
        $res = $this->actingAs($admin)->get('/timesheet/export?month='.now()->format('Y-m'));
        $res->assertOk();
        $this->assertStringContainsString('text/csv', $res->headers->get('Content-Type'));
    }

    public function test_password_change(): void
    {
        $emp = User::factory()->create(['role' => 'employee']);
        $this->actingAs($emp)->get('/password')->assertOk();
        $this->actingAs($emp)->post('/password', [
            'current_password' => 'password',
            'password' => 'newpass123',
            'password_confirmation' => 'newpass123',
        ])->assertRedirect();
    }

    public function test_adjustment_creates_audit(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $emp = User::factory()->create(['role' => 'employee']);
        $att = Attendance::create([
            'user_id' => $emp->id, 'date' => today()->toDateString(),
            'clock_in' => today()->setTime(9, 0)->toDateTimeString(), 'status' => 'present',
        ]);
        $this->actingAs($admin)->patch("/attendance/{$att->id}", [
            'clock_in' => today()->setTime(9, 30)->toDateTimeString(),
            'note' => 'corrected',
        ])->assertRedirect();
        $this->assertDatabaseHas('attendance_audits', ['attendance_id' => $att->id]);
        $this->actingAs($admin)->get('/audits')->assertOk();
    }

    public function test_holiday_crud(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin)->get('/holidays')->assertOk();
        $this->actingAs($admin)->post('/holidays', [
            'name' => 'Eid', 'date' => now()->addDays(10)->toDateString(), 'is_recurring' => true,
        ])->assertRedirect();
        $this->assertDatabaseHas('holidays', ['name' => 'Eid']);
    }
}
