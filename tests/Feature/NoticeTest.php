<?php

namespace Tests\Feature;

use App\Models\Attendance;
use App\Models\Notice;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NoticeTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_broadcast_and_target(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $emp = User::factory()->create(['role' => 'employee']);

        $this->actingAs($admin)->post('/admin-notices', [
            'title' => 'Holiday', 'body' => 'Office closed', 'kind' => 'announcement', 'audience' => 'all',
        ])->assertRedirect();
        $this->assertDatabaseHas('notices', ['scope' => 'all']);

        $this->actingAs($admin)->post('/admin-notices', [
            'title' => 'Be on time', 'body' => 'Sharp 9', 'kind' => 'late',
            'audience' => 'individual', 'user_id' => $emp->id,
        ])->assertRedirect();
        $this->assertDatabaseHas('notices', ['scope' => 'individual', 'user_id' => $emp->id]);

        $this->actingAs($admin)->get('/admin-notices')->assertOk();
    }

    public function test_auto_late_salary_leave_notices(): void
    {
        $shift = \App\Models\Shift::create([
            'name' => 'Day', 'start_time' => '09:00', 'end_time' => '18:00',
            'working_days' => [0, 1, 2, 3, 4, 5, 6], 'break_minutes' => 60, 'grace_late_minutes' => 10,
        ]);
        $emp = User::factory()->create(['role' => 'employee', 'shift_id' => $shift->id]);
        $admin = User::factory()->create(['role' => 'admin']);

        // late auto notice via clock-in recalculation path
        $this->actingAs($emp)->post('/my-time/clock-in')->assertRedirect();
        $att = Attendance::where('user_id', $emp->id)->first();
        $att->clock_in = today()->setTime(11, 0)->toDateTimeString(); // force late
        $att->save();
        app(\App\Services\AttendanceService::class)->recalculate($att);
        $this->assertDatabaseHas('notices', ['user_id' => $emp->id, 'kind' => 'late']);

        // salary auto notice
        $this->actingAs($admin)->post('/salaries', [
            'user_id' => $emp->id, 'month' => now()->startOfMonth()->toDateString(), 'base_amount' => 40000,
        ])->assertRedirect();
        $this->assertDatabaseHas('notices', ['user_id' => $emp->id, 'kind' => 'salary']);

        // leave review auto notice
        $this->actingAs($emp)->post('/my-leaves', [
            'date_from' => now()->addDays(2)->toDateString(),
            'date_to' => now()->addDays(2)->toDateString(),
            'type' => 'casual', 'reason' => 'test reason',
        ])->assertRedirect();
        $leave = \App\Models\Leave::where('user_id', $emp->id)->first();
        $this->actingAs($admin)->post("/leaves/{$leave->id}/review", ['action' => 'approve'])->assertRedirect();
        $this->assertDatabaseHas('notices', ['user_id' => $emp->id, 'kind' => 'leave']);
    }

    public function test_employee_inbox_and_read(): void
    {
        $emp = User::factory()->create(['role' => 'employee']);
        $other = User::factory()->create(['role' => 'employee']);
        Notice::create(['title' => 'All', 'body' => 'hi all', 'kind' => 'announcement', 'scope' => 'all']);
        Notice::create(['title' => 'You', 'body' => 'hi you', 'kind' => 'general', 'scope' => 'individual', 'user_id' => $emp->id]);
        Notice::create(['title' => 'Other', 'body' => 'not you', 'kind' => 'general', 'scope' => 'individual', 'user_id' => $other->id]);

        $res = $this->actingAs($emp)->get('/my-notices');
        $res->assertOk();
        $titles = collect($res->viewData('page')['props']['notices'] ?? $res->original->getData()['page']['props']['notices'])->pluck('title')->all();
        $this->assertContains('All', $titles);
        $this->assertContains('You', $titles);
        $this->assertNotContains('Other', $titles);

        $n = Notice::where('title', 'All')->first();
        $this->actingAs($emp)->post("/my-notices/{$n->id}/read")->assertRedirect();
        $this->assertDatabaseHas('notice_reads', ['notice_id' => $n->id, 'user_id' => $emp->id]);
    }
}
