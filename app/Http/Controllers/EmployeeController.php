<?php

namespace App\Http\Controllers;

use App\Models\Shift;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class EmployeeController extends Controller
{
    public function index()
    {
        return Inertia::render('Employees/Index', [
            'employees' => User::where('role', 'employee')->with('shift:id,name,start_time,end_time')
                ->orderBy('name')->get(),
            'shifts' => Shift::orderBy('name')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'min:6'],
            'employee_code' => ['nullable', 'string', 'max:50', 'unique:users,employee_code'],
            'phone' => ['nullable', 'string', 'max:30'],
            'address' => ['nullable', 'string'],
            'shift_id' => ['nullable', 'exists:shifts,id'],
            'allowed_ips' => ['nullable', 'string'],
            'base_salary' => ['nullable', 'numeric', 'min:0'],
            'employment_status' => ['required', Rule::in(['active', 'inactive'])],
            'joined_at' => ['nullable', 'date'],
        ]);

        $data['role'] = 'employee';
        User::create($data);

        return back()->with('success', 'Employee created.');
    }

    public function update(Request $request, User $employee)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', Rule::unique('users')->ignore($employee->id)],
            'password' => ['nullable', 'min:6'],
            'employee_code' => ['nullable', 'string', 'max:50', Rule::unique('users')->ignore($employee->id)],
            'phone' => ['nullable', 'string', 'max:30'],
            'address' => ['nullable', 'string'],
            'shift_id' => ['nullable', 'exists:shifts,id'],
            'allowed_ips' => ['nullable', 'string'],
            'base_salary' => ['nullable', 'numeric', 'min:0'],
            'employment_status' => ['required', Rule::in(['active', 'inactive'])],
            'joined_at' => ['nullable', 'date'],
        ]);

        if (empty($data['password'])) {
            unset($data['password']);
        }

        $employee->update($data);

        return back()->with('success', 'Employee updated.');
    }

    public function destroy(User $employee)
    {
        $employee->delete();

        return back()->with('success', 'Employee deleted.');
    }
}
