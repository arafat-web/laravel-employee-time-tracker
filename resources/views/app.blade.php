<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="Time Tracker — employee attendance, shifts, leaves, salary and performance.">
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    <link rel="alternate icon" type="image/x-icon" href="/favicon.ico">
    <title inertia>{{ config('app.name', 'Time Tracker') }}</title>
    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.jsx'])
    @inertiaHead
</head>
<body class="bg-slate-100 text-slate-900 antialiased">
    @inertia
</body>
</html>
