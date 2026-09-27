<?php

namespace App\Http\Controllers;

use App\Models\Salary;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SalaryController extends Controller
{
    public function index(Request $request)
    {
        $month = $request->get('month', now()->format('Y-m-01'));

        return Inertia::render('Salaries/Index', [
            'month' => $month,
            'rows' => Salary::with('user:id,name,employee_code,base_salary')
                ->where('month', $month)->orderBy('id')->get(),
            'employees' => User::where('role', 'employee')->orderBy('name')->get(['id', 'name', 'employee_code', 'base_salary']),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'user_id' => ['required', 'exists:users,id'],
            'month' => ['required', 'date'],
            'base_amount' => ['required', 'numeric', 'min:0'],
            'allowances' => ['nullable', 'numeric', 'min:0'],
            'deductions' => ['nullable', 'numeric', 'min:0'],
            'bonus' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
            'is_paid' => ['nullable', 'boolean'],
        ]);
        $data['month'] = \Carbon\Carbon::parse($data['month'])->startOfMonth()->toDateString();
        $data['allowances'] ??= 0;
        $data['deductions'] ??= 0;
        $data['bonus'] ??= 0;
        $data['is_paid'] ??= false;
        $data['net_amount'] = $data['base_amount'] + $data['allowances'] + $data['bonus'] - $data['deductions'];

        Salary::updateOrCreate(
            ['user_id' => $data['user_id'], 'month' => $data['month']],
            $data
        );

        \App\Services\NoticeService::send(
            'Salary updated — '.\Carbon\Carbon::parse($data['month'])->format('M Y'),
            'Your salary for '.\Carbon\Carbon::parse($data['month'])->format('F Y').' is Tk '.number_format($data['net_amount'], 2).' ('.($data['is_paid'] ? 'Paid' : 'Unpaid').'). Check My Salary for details.',
            'salary',
            (int) $data['user_id'],
            $request->user()->id,
            true,
            ['key' => 'salary:'.$data['month']]
        );

        return back()->with('success', 'Salary saved.');
    }

    public function update(Request $request, Salary $salary)
    {
        $data = $request->validate([
            'base_amount' => ['required', 'numeric', 'min:0'],
            'allowances' => ['nullable', 'numeric', 'min:0'],
            'deductions' => ['nullable', 'numeric', 'min:0'],
            'bonus' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
            'is_paid' => ['nullable', 'boolean'],
        ]);
        $data['net_amount'] = $data['base_amount']
            + ($data['allowances'] ?? $salary->allowances)
            + ($data['bonus'] ?? $salary->bonus)
            - ($data['deductions'] ?? $salary->deductions);
        $salary->update($data);

        return back()->with('success', 'Salary updated.');
    }

    public function destroy(Salary $salary)
    {
        $salary->delete();

        return back()->with('success', 'Salary deleted.');
    }

    public function mine()
    {
        $rows = Salary::where('user_id', auth()->id())->orderByDesc('month')->get();

        return Inertia::render('Salaries/Mine', ['rows' => $rows]);
    }
}
