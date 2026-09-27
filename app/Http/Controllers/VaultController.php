<?php

namespace App\Http\Controllers;

use App\Models\VaultItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class VaultController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $q = $request->get('q', '');
        $tab = $request->get('tab', 'all'); // all|notes|files|links|mine

        $items = VaultItem::visibleTo($user)
            ->with('owner:id,name,role')
            ->when($q, fn ($x) => $x->where(function ($w) use ($q) {
                $w->where('title', 'like', "%{$q}%")->orWhere('body', 'like', "%{$q}%")->orWhere('file_name', 'like', "%{$q}%");
            }))
            ->when($tab === 'notes', fn ($x) => $x->where('type', 'note'))
            ->when($tab === 'files', fn ($x) => $x->where('type', 'file'))
            ->when($tab === 'links', fn ($x) => $x->where('type', 'link'))
            ->when($tab === 'mine', fn ($x) => $x->where('user_id', $user->id))
            ->latest()->limit(200)->get();

        return Inertia::render('Vault/Index', [
            'items' => $items,
            'q' => $q,
            'tab' => $tab,
            'isAdmin' => $user->isAdmin(),
        ]);
    }

    public function storeNote(Request $request)
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:150'],
            'body' => ['required', 'string', 'max:10000'],
            'visibility' => ['required', 'in:shared,private'],
        ]);

        VaultItem::create([
            'type' => 'note',
            'title' => $data['title'],
            'body' => $data['body'],
            'visibility' => $data['visibility'],
            'user_id' => $request->user()->id,
        ]);

        return back()->with('success', $data['visibility'] === 'shared' ? 'Note shared.' : 'Private note saved.');
    }

    public function storeLink(Request $request)
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:150'],
            'body' => ['required', 'url', 'max:2000'],
            'description' => ['nullable', 'string', 'max:1000'],
            'visibility' => ['required', 'in:shared,private'],
        ]);

        VaultItem::create([
            'type' => 'link',
            'title' => $data['title'],
            'body' => $data['body'].(! empty($data['description']) ? "\n\n".$data['description'] : ''),
            'visibility' => $data['visibility'],
            'user_id' => $request->user()->id,
        ]);

        return back()->with('success', 'Link shared.');
    }

    public function storeFile(Request $request)
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:150'],
            'description' => ['nullable', 'string', 'max:1000'],
            'visibility' => ['required', 'in:shared,private'],
            'file' => ['required', 'file', 'max:20480', 'mimes:pdf,doc,docx,xls,xlsx,csv,txt,png,jpg,jpeg,gif,webp,zip,ppt,pptx'],
        ]);

        $file = $request->file('file');
        $path = $file->store('vault', 'local');

        VaultItem::create([
            'type' => 'file',
            'title' => $data['title'],
            'body' => $data['description'] ?? null,
            'file_path' => $path,
            'file_name' => $file->getClientOriginalName(),
            'mime' => $file->getMimeType(),
            'size' => $file->getSize(),
            'visibility' => $data['visibility'],
            'user_id' => $request->user()->id,
        ]);

        return back()->with('success', 'File uploaded.');
    }

    public function update(Request $request, VaultItem $vault)
    {
        $user = $request->user();
        if ($vault->user_id !== $user->id && ! $user->isAdmin()) {
            abort(403);
        }

        $data = $request->validate([
            'title' => ['required', 'string', 'max:150'],
            'body' => ['nullable', 'string', 'max:10000'],
            'visibility' => ['required', 'in:shared,private'],
        ]);
        $vault->update($data);

        return back()->with('success', 'Updated.');
    }

    public function destroy(Request $request, VaultItem $vault)
    {
        $user = $request->user();
        if ($vault->user_id !== $user->id && ! $user->isAdmin()) {
            abort(403);
        }
        if ($vault->file_path) {
            Storage::disk('local')->delete($vault->file_path);
        }
        $vault->delete();

        return back()->with('success', 'Deleted.');
    }

    public function download(Request $request, VaultItem $vault): BinaryFileResponse
    {
        $user = $request->user();
        if ($vault->type !== 'file' || ! $vault->file_path) {
            abort(404);
        }
        $visible = $user->isAdmin()
            || $vault->visibility === 'shared'
            || $vault->user_id === $user->id;
        if (! $visible) {
            abort(403, 'Private file.');
        }
        if (! Storage::disk('local')->exists($vault->file_path)) {
            abort(404, 'File missing on disk.');
        }

        return response()->download(
            Storage::disk('local')->path($vault->file_path),
            $vault->file_name ?: 'download'
        );
    }
}
