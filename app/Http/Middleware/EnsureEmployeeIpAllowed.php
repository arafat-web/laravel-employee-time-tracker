<?php

namespace App\Http\Middleware;

use App\Models\IpLog;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureEmployeeIpAllowed
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->role === 'employee') {
            $ip = $request->ip();

            if (! $user->isIpAllowed($ip)) {
                IpLog::create([
                    'user_id' => $user->id,
                    'ip_address' => $ip,
                    'action' => 'blocked',
                    'user_agent' => substr((string) $request->userAgent(), 0, 500),
                ]);

                auth()->logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();

                if ($request->header('X-Inertia')) {
                    return redirect()->route('login')->withErrors([
                        'email' => 'Access denied from this IP address ('.$ip.'). Contact admin.',
                    ]);
                }

                abort(403, 'Access denied from IP '.$ip);
            }
        }

        return $next($request);
    }
}
