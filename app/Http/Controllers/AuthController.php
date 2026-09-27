<?php

namespace App\Http\Controllers;

use App\Models\IpLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class AuthController extends Controller
{
    public function show(): Response
    {
        return Inertia::render('Auth/Login');
    }

    public function login(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        if (! Auth::attempt($data, $request->boolean('remember'))) {
            IpLog::create([
                'user_id' => null,
                'ip_address' => $request->ip(),
                'action' => 'login_failed',
                'user_agent' => substr((string) $request->userAgent(), 0, 500),
            ]);

            return back()->withErrors(['email' => 'Invalid credentials.']);
        }

        $request->session()->regenerate();
        $user = $request->user();

        if ($user->role === 'employee' && ! $user->isIpAllowed($request->ip())) {
            IpLog::create([
                'user_id' => $user->id,
                'ip_address' => $request->ip(),
                'action' => 'blocked',
                'user_agent' => substr((string) $request->userAgent(), 0, 500),
            ]);
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect()->route('login')->withErrors([
                'email' => 'Access denied from this IP ('.$request->ip().'). Contact admin.',
            ]);
        }

        if ($user->employment_status !== 'active' && ! $user->isAdmin()) {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect()->route('login')->withErrors(['email' => 'Account is inactive.']);
        }

        IpLog::create([
            'user_id' => $user->id,
            'ip_address' => $request->ip(),
            'action' => 'login',
            'user_agent' => substr((string) $request->userAgent(), 0, 500),
        ]);

        return redirect()->intended(route('dashboard'));
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }
}
