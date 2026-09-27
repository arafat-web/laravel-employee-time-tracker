<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\VaultItem;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class VaultTest extends TestCase
{
    use RefreshDatabase;

    public function test_employee_and_admin_can_share_notes_links(): void
    {
        $emp = User::factory()->create(['role' => 'employee']);
        $admin = User::factory()->create(['role' => 'admin']);

        // employee shared note (e.g. password note)
        $this->actingAs($emp)->post('/vault/note', [
            'title' => 'Wi-Fi', 'body' => 'pass: 12345', 'visibility' => 'shared',
        ])->assertRedirect();
        $this->assertDatabaseHas('vault_items', ['type' => 'note', 'title' => 'Wi-Fi']);

        // employee private note
        $this->actingAs($emp)->post('/vault/note', [
            'title' => 'Mine', 'body' => 'secret', 'visibility' => 'private',
        ])->assertRedirect();

        // admin sees both (oversight), other employee sees only shared
        $other = User::factory()->create(['role' => 'employee']);
        $this->actingAs($other)->get('/vault')->assertOk();
        $res = $this->actingAs($admin)->get('/vault')->assertOk();

        // link share
        $this->actingAs($admin)->post('/vault/link', [
            'title' => 'Policy', 'body' => 'https://example.com/policy', 'visibility' => 'shared',
        ])->assertRedirect();
        $this->assertDatabaseHas('vault_items', ['type' => 'link']);
    }

    public function test_file_upload_download_and_permissions(): void
    {
        $emp = User::factory()->create(['role' => 'employee']);
        $other = User::factory()->create(['role' => 'employee']);

        $this->actingAs($emp)->post('/vault/file', [
            'title' => 'HRM Policy',
            'visibility' => 'shared',
            'file' => UploadedFile::fake()->create('policy.xlsx', 100, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'),
        ])->assertRedirect();
        $item = VaultItem::where('title', 'HRM Policy')->first();
        $this->assertNotNull($item);

        // other employee can download shared file
        $this->actingAs($other)->get("/vault/{$item->id}/download")->assertOk();

        // private file blocked for others
        $item->update(['visibility' => 'private']);
        $this->actingAs($other)->get("/vault/{$item->id}/download")->assertForbidden();

        // owner can delete
        $this->actingAs($emp)->delete("/vault/{$item->id}")->assertRedirect();
        $this->assertDatabaseMissing('vault_items', ['id' => $item->id]);
        // cleanup uploaded file
        if ($item->file_path) {
            Storage::disk('local')->delete($item->file_path);
        }
    }
}
