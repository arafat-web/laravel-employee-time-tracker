<?php

use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\AuditController;
use App\Http\Controllers\NoticeController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\HolidayController;
use App\Http\Controllers\LeaveController;
use App\Http\Controllers\PasswordController;
use App\Http\Controllers\PerformanceController;
use App\Http\Controllers\SalaryController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\ShiftController;
use App\Http\Controllers\TimesheetController;
use App\Http\Controllers\VaultController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return auth()->check()
        ? redirect()->route('dashboard')
        : redirect()->route('login');
});

Route::get('/login', [AuthController::class, 'show'])->name('login')->middleware('guest');
Route::post('/login', [AuthController::class, 'login'])->middleware('guest')->name('login.store');
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth')->name('logout');

Route::middleware(['auth', 'employee.ip'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::get('/my-time', [AttendanceController::class, 'myTime'])->name('my-time');
    Route::post('/my-time/clock-in', [AttendanceController::class, 'clockIn'])->name('clock-in');
    Route::post('/my-time/clock-out', [AttendanceController::class, 'clockOut'])->name('clock-out');
    Route::post('/my-time/break-start', [AttendanceController::class, 'breakStart'])->name('break-start');
    Route::post('/my-time/break-end', [AttendanceController::class, 'breakEnd'])->name('break-end');
    Route::get('/my-leaves', [LeaveController::class, 'mine'])->name('my-leaves');
    Route::post('/my-leaves', [LeaveController::class, 'apply'])->name('leaves.apply');
    Route::delete('/my-leaves/{leave}', [LeaveController::class, 'cancel'])->name('leaves.cancel');
    Route::get('/my-salary', [SalaryController::class, 'mine'])->name('my-salary');
    Route::get('/my-performance', [PerformanceController::class, 'mine'])->name('my-performance');
    Route::get('/my-notices', [NoticeController::class, 'mine'])->name('notices.mine');
    Route::post('/my-notices/read-all', [NoticeController::class, 'readAll'])->name('notices.read-all');
    Route::post('/my-notices/{notice}/read', [NoticeController::class, 'read'])->name('notices.read');
    Route::get('/password', [PasswordController::class, 'edit'])->name('password.edit');
    Route::post('/password', [PasswordController::class, 'update'])->name('password.update');
    Route::get('/vault', [VaultController::class, 'index'])->name('vault.index');
    Route::post('/vault/note', [VaultController::class, 'storeNote'])->name('vault.note');
    Route::post('/vault/link', [VaultController::class, 'storeLink'])->name('vault.link');
    Route::post('/vault/file', [VaultController::class, 'storeFile'])->name('vault.file');
    Route::put('/vault/{vault}', [VaultController::class, 'update'])->name('vault.update');
    Route::delete('/vault/{vault}', [VaultController::class, 'destroy'])->name('vault.destroy');
    Route::get('/vault/{vault}/download', [VaultController::class, 'download'])->name('vault.download');

    Route::middleware(['role:admin'])->group(function () {
        Route::resource('shifts', ShiftController::class)->only(['index', 'store', 'update', 'destroy']);
        Route::resource('employees', EmployeeController::class)->only(['index', 'store', 'update', 'destroy']);
        Route::get('/attendance', [AttendanceController::class, 'index'])->name('attendance.index');
        Route::patch('/attendance/{attendance}', [AttendanceController::class, 'update'])->name('attendance.update');
        Route::resource('leaves', LeaveController::class)->only(['index', 'store', 'update', 'destroy']);
        Route::post('/leaves/{leave}/review', [LeaveController::class, 'review'])->name('leaves.review');
        Route::resource('salaries', SalaryController::class)->only(['index', 'store', 'update', 'destroy']);
        Route::get('/performance', [PerformanceController::class, 'index'])->name('performance.index');
        Route::get('/timesheet', [TimesheetController::class, 'index'])->name('timesheet.index');
        Route::get('/timesheet/export', [TimesheetController::class, 'export'])->name('timesheet.export');
        Route::resource('holidays', HolidayController::class)->only(['index', 'store', 'update', 'destroy']);
        Route::get('/audits', [AuditController::class, 'index'])->name('audits.index');
        Route::get('/admin-notices', [NoticeController::class, 'index'])->name('notices.index');
        Route::post('/admin-notices', [NoticeController::class, 'store'])->name('notices.store');
        Route::delete('/admin-notices/{notice}', [NoticeController::class, 'destroy'])->name('notices.destroy');
        Route::get('/settings', [SettingsController::class, 'index'])->name('settings.index');
        Route::post('/settings', [SettingsController::class, 'store'])->name('settings.store');
        Route::get('/ip-logs', [SettingsController::class, 'ipLogs'])->name('ip-logs');
    });
});
