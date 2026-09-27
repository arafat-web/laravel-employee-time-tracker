<?php

namespace App\Http\Controllers;

use App\Models\Holiday;
use Illuminate\Http\Request;
use Inertia\Inertia;

class HolidayController extends Controller
{
    public function index()
    {
        return Inertia::render('Holidays/Index', [
            'holidays' => Holiday::orderBy('date')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'date' => ['required', 'date', 'unique:holidays,date'],
            'is_recurring' => ['nullable', 'boolean'],
        ]);
        $data['is_recurring'] ??= false;
        Holiday::create($data);

        return back()->with('success', 'Holiday added.');
    }

    public function update(Request $request, Holiday $holiday)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'date' => ['required', 'date', 'unique:holidays,date,'.$holiday->id],
            'is_recurring' => ['nullable', 'boolean'],
        ]);
        $holiday->update($data);

        return back()->with('success', 'Holiday updated.');
    }

    public function destroy(Holiday $holiday)
    {
        $holiday->delete();

        return back()->with('success', 'Holiday deleted.');
    }
}
