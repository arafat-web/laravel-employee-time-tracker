<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shifts', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->time('start_time');
            $table->time('end_time');
            $table->json('working_days')->nullable(); // e.g. [1,2,3,4,5]
            $table->time('break_start')->nullable();
            $table->time('break_end')->nullable();
            $table->unsignedInteger('break_minutes')->default(60);
            $table->unsignedInteger('grace_late_minutes')->default(10);
            $table->timestamps();
        });

        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->default('employee')->after('password'); // admin|employee
            $table->string('employee_code')->nullable()->unique()->after('role');
            $table->string('phone')->nullable();
            $table->text('address')->nullable();
            $table->foreignId('shift_id')->nullable()->after('address')->constrained('shifts')->nullOnDelete();
            $table->text('allowed_ips')->nullable(); // comma separated / JSON, empty = any (admin bypasses)
            $table->decimal('base_salary', 12, 2)->default(0);
            $table->string('employment_status')->default('active'); // active|inactive
            $table->date('joined_at')->nullable();
        });

        Schema::create('attendances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('date');
            $table->dateTime('clock_in')->nullable();
            $table->dateTime('clock_out')->nullable();
            $table->string('clock_in_ip', 45)->nullable();
            $table->string('clock_out_ip', 45)->nullable();
            $table->unsignedInteger('late_minutes')->default(0);
            $table->unsignedInteger('early_leave_minutes')->default(0);
            $table->unsignedInteger('overtime_minutes')->default(0);
            $table->unsignedInteger('work_minutes')->default(0);
            $table->unsignedInteger('break_minutes')->default(0);
            $table->string('status')->default('present'); // present|late|half_day|absent|leave|weekend
            $table->text('note')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'date']);
        });

        Schema::create('breaks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('attendance_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->dateTime('break_start');
            $table->dateTime('break_end')->nullable();
            $table->string('break_start_ip', 45)->nullable();
            $table->string('break_end_ip', 45)->nullable();
            $table->unsignedInteger('duration_minutes')->default(0);
            $table->timestamps();
        });

        Schema::create('leaves', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('date_from');
            $table->date('date_to');
            $table->unsignedInteger('days')->default(1);
            $table->string('type')->default('casual'); // sick|casual|annual|unpaid|other
            $table->text('reason')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('salaries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('month'); // first day of month
            $table->decimal('base_amount', 12, 2)->default(0);
            $table->decimal('allowances', 12, 2)->default(0);
            $table->decimal('deductions', 12, 2)->default(0);
            $table->decimal('bonus', 12, 2)->default(0);
            $table->decimal('net_amount', 12, 2)->default(0);
            $table->text('notes')->nullable();
            $table->boolean('is_paid')->default(false);
            $table->timestamps();

            $table->unique(['user_id', 'month']);
        });

        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->text('value')->nullable();
            $table->timestamps();
        });

        Schema::create('ip_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('ip_address', 45);
            $table->string('action'); // login|login_failed|blocked|clock_in|clock_out|break_start|break_end
            $table->string('user_agent', 500)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ip_logs');
        Schema::dropIfExists('settings');
        Schema::dropIfExists('salaries');
        Schema::dropIfExists('leaves');
        Schema::dropIfExists('breaks');
        Schema::dropIfExists('attendances');
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('shift_id');
            $table->dropColumn(['role', 'employee_code', 'phone', 'address', 'allowed_ips', 'base_salary', 'employment_status', 'joined_at']);
        });
        Schema::dropIfExists('shifts');
    }
};
