<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('attendance:auto-close --date=yesterday')->dailyAt('00:30')->withoutOverlapping();
Schedule::command('attendance:mark-absents --date=yesterday')->dailyAt('00:45')->withoutOverlapping();
