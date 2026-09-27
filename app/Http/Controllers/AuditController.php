<?php

namespace App\Http\Controllers;

use App\Models\AttendanceAudit;
use Inertia\Inertia;

class AuditController extends Controller
{
    public function index()
    {
        return Inertia::render('Audits/Index', [
            'audits' => AttendanceAudit::with(['employee:id,name,employee_code', 'changer:id,name'])
                ->latest()->limit(200)->get(),
        ]);
    }
}
