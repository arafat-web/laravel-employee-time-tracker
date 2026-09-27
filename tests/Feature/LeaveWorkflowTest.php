<?php

namespace Tests\Feature;

use App\Models\Leave;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LeaveWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_employee_can_apply_and_admin_reviews(): void
    {
        $emp = User::factory()->create(['role' => 'employee']);
        $admin = User::factory()->create(['role' => 'admin']);

        // apply
        $from = now()->addDays(2)->toDateString();
        $to = now()->addDays(3)->toDateString();
        $this->actingAs($emp)->post('/my-leaves', [
            'date_from' => $from, 'date_to' => $to, 'type' => 'casual', 'reason' => 'family trip',
        ])->assertRedirect();
        $leave = Leave::where('user_id', $emp->id)->first();
        $this->assertEquals('pending', $leave->status);
        // pending must NOT mark attendance
        $this->assertDatabaseMissing('attendances', ['user_id' => $emp->id, 'date' => $from, 'status' => 'leave']);

        // approve
        $this->actingAs($admin)->post("/leaves/{$leave->id}/review", ['action' => 'approve'])
            ->assertRedirect();
        $this->assertEquals('approved', $leave->fresh()->status);
        $this->assertDatabaseHas('attendances', ['user_id' => $emp->id, 'status' => 'leave']);

        // employee sees it
        $this->actingAs($emp)->get('/my-leaves')->assertOk();
    }

    public function test_reject_unmarks_and_overlap_blocked(): void
    {
        $emp = User::factory()->create(['role' => 'employee']);
        $admin = User::factory()->create(['role' => 'admin']);

        $from = now()->addDays(5)->toDateString();
        $to = now()->addDays(5)->toDateString();
        $this->actingAs($emp)->post('/my-leaves', [
            'date_from' => $from, 'date_to' => $to, 'type' => 'sick', 'reason' => 'flu',
        ])->assertRedirect();
        $leave = Leave::where('user_id', $emp->id)->first();

        // overlapping second request blocked
        $this->actingAs($emp)->post('/my-leaves', [
            'date_from' => $from, 'date_to' => $to, 'type' => 'casual', 'reason' => 'dup',
        ])->assertSessionHasErrors('date_from');

        // reject
        $this->actingAs($admin)->post("/leaves/{$leave->id}/review", [
            'action' => 'reject', 'review_note' => 'need cover',
        ])->assertRedirect();
        $this->assertEquals('rejected', $leave->fresh()->status);

        // cancel own pending
        $this->actingAs($emp)->post('/my-leaves', [
            'date_from' => now()->addDays(9)->toDateString(),
            'date_to' => now()->addDays(9)->toDateString(),
            'type' => 'casual', 'reason' => 'x reason here',
        ])->assertRedirect();
        $l2 = Leave::where('user_id', $emp->id)->where('status', 'pending')->first();
        $this->actingAs($emp)->delete("/my-leaves/{$l2->id}")->assertRedirect();
        $this->assertDatabaseMissing('leaves', ['id' => $l2->id]);
    }
}
