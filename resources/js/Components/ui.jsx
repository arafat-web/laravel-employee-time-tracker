import React, { useState, useEffect } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import {
    LayoutDashboard, Clock, Users, CalendarDays, Wallet,
    TrendingUp, Settings, LogOut, Timer, ShieldCheck, Activity,
    Menu, X, TableProperties, Palmtree, ScrollText, KeyRound, Bell, Megaphone, FolderOpen,
} from 'lucide-react';

export function cn(...xs) {
    return xs.filter(Boolean).join(' ');
}

function toDate(v) {
    if (!v) return null;
    if (v instanceof Date) return v;
    // "2026-09-27 08:18:06" (no tz) -> treat as local; ISO with Z/T handled natively
    if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(v)) {
        return new Date(v.replace(' ', 'T'));
    }
    const d = new Date(v);
    return isNaN(d) ? null : d;
}

export function fmtDate(v) {
    const d = toDate(v);
    if (!d) return '—';
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function fmtTime(v, withSec = false) {
    const d = toDate(v);
    if (!d) return '—';
    return d.toLocaleTimeString('en-GB', {
        hour: '2-digit', minute: '2-digit',
        ...(withSec ? { second: '2-digit' } : {}),
        hour12: true,
    }).toUpperCase();
}

export function fmtDateTime(v, withSec = false) {
    const d = toDate(v);
    if (!d) return '—';
    return `${fmtDate(v)} · ${fmtTime(v, withSec)}`;
}

export function fmtDuration(min) {
    const m = Math.max(0, Math.round(Number(min) || 0));
    const h = Math.floor(m / 60);
    const r = m % 60;
    return h > 0 ? `${h}h ${r}m` : `${r}m`;
}

export function fmtElapsed(from, to) {
    const a = toDate(from);
    if (!a) return '—';
    const b = to ? toDate(to) : new Date();
    if (!b) return '—';
    return fmtDuration((b - a) / 60000);
}

export function useNow(intervalMs = 1000) {
    const [now, setNow] = useState(() => new Date());
    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), intervalMs);
        return () => clearInterval(t);
    }, [intervalMs]);
    return now;
}

export function LiveClock({ className }) {
    const now = useNow(1000);
    return (
        <span className={className}>
            {now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }).toUpperCase()}
        </span>
    );
}

export function Card({ className, children }) {
    return (
        <div className={cn('rounded-2xl border border-slate-200 bg-white p-5 shadow-sm', className)}>
            {children}
        </div>
    );
}

export function CardTitle({ icon: Icon, title, sub }) {
    return (
        <div className="mb-4 flex items-center gap-3">
            {Icon && (
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
                    <Icon size={18} />
                </span>
            )}
            <div>
                <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
                {sub && <p className="text-xs text-slate-500">{sub}</p>}
            </div>
        </div>
    );
}

export function Stat({ icon: Icon, label, value, hint, tone = 'bg-slate-900' }) {
    return (
        <Card>
            <div className="flex items-center justify-between">
                <span className={cn('flex h-10 w-10 items-center justify-center rounded-xl text-white', tone)}>
                    <Icon size={18} />
                </span>
            </div>
            <p className="mt-4 text-2xl font-bold text-slate-900">{value}</p>
            <p className="text-sm font-medium text-slate-600">{label}</p>
            {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
        </Card>
    );
}

export function Field({ label, children }) {
    return (
        <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
            {children}
        </label>
    );
}

export const inputCls =
    'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200';

export function Btn({ variant = 'dark', className, ...props }) {
    const styles =
        variant === 'dark'
            ? 'bg-slate-900 text-white hover:bg-slate-700'
            : variant === 'danger'
                ? 'bg-red-600 text-white hover:bg-red-500'
                : variant === 'ghost'
                    ? 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                    : 'bg-emerald-600 text-white hover:bg-emerald-500';
    return <button {...props} className={cn('inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition', styles, className)} />;
}

export function Modal({ open, onClose, title, sub, children, wide }) {
    useEffect(() => {
        const fn = (e) => {
            if (e.key === 'Escape') onClose?.();
        };
        if (open) document.addEventListener('keydown', fn);
        return () => document.removeEventListener('keydown', fn);
    }, [open]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
            <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} />
            <div className={cn('relative max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-xl sm:rounded-3xl', wide ? 'sm:max-w-2xl' : 'sm:max-w-lg')}>
                <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                        <h3 className="text-base font-bold text-slate-900">{title}</h3>
                        {sub && <p className="text-xs text-slate-500">{sub}</p>}
                    </div>
                    <button
                        onClick={onClose}
                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50"
                        aria-label="Close"
                    >
                        <X size={16} />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}

export default function Layout({ title, sub, children }) {
    const { auth, flash, company, unreadNotices } = usePage().props;
    const { url } = usePage();
    const [open, setOpen] = useState(false);
    const user = auth?.user;
    const isAdmin = user?.role === 'admin';

    const links = isAdmin
        ? [
            { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { href: '/attendance', label: 'Attendance', icon: Clock },
            { href: '/employees', label: 'Employees', icon: Users },
            { href: '/shifts', label: 'Shifts', icon: Timer },
            { href: '/leaves', label: 'Leaves', icon: CalendarDays },
            { href: '/salaries', label: 'Salary', icon: Wallet },
            { href: '/performance', label: 'Performance', icon: TrendingUp },
            { href: '/timesheet', label: 'Timesheet', icon: TableProperties },
            { href: '/holidays', label: 'Holidays', icon: Palmtree },
            { href: '/audits', label: 'Audit Trail', icon: ScrollText },
            { href: '/admin-notices', label: 'Notices', icon: Megaphone, badge: null },
            { href: '/vault', label: 'Files & Notes', icon: FolderOpen },
            { href: '/settings', label: 'Settings', icon: Settings },
            { href: '/ip-logs', label: 'IP Logs', icon: ShieldCheck },
            { href: '/password', label: 'Password', icon: KeyRound },
        ]
        : [
            { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { href: '/my-time', label: 'My Time', icon: Clock },
            { href: '/my-leaves', label: 'My Leaves', icon: CalendarDays },
            { href: '/my-salary', label: 'My Salary', icon: Wallet },
            { href: '/my-performance', label: 'Performance', icon: Activity },
            { href: '/my-notices', label: 'Notices', icon: Bell, badge: unreadNotices },
            { href: '/vault', label: 'Files & Notes', icon: FolderOpen },
            { href: '/password', label: 'Password', icon: KeyRound },
        ];

    const isActive = (href) => url === href || url.startsWith(href + '/') || (href === '/dashboard' && url === '/dashboard');

    const sidebar = (
        <div className="flex h-full flex-col bg-white">
            <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
                    <Timer size={18} />
                </span>
                <div className="min-w-0">
                    <p className="truncate text-sm font-bold leading-tight text-slate-900">{company || 'Time Tracker'}</p>
                    <p className="truncate text-xs text-slate-500">{user?.name} · {user?.role}</p>
                </div>
            </div>
            <nav className="slim-scroll flex-1 space-y-1 overflow-y-auto px-3 py-4">
                {links.map((l) => {
                    const active = isActive(l.href);
                    return (
                        <Link
                            key={l.href}
                            href={l.href}
                            onClick={() => setOpen(false)}
                            className={cn(
                                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                                active
                                    ? 'bg-slate-900 text-white'
                                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                            )}
                        >
                            <l.icon size={17} /> <span className="flex-1">{l.label}</span>
                            {!!l.badge && (
                                <span className={cn('rounded-full px-2 py-0.5 text-xs font-bold', active ? 'bg-white text-slate-900' : 'bg-red-500 text-white')}>
                                    {l.badge}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>
            <div className="border-t border-slate-200 p-3">
                <button
                    onClick={() => router.post('/logout')}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600"
                >
                    <LogOut size={17} /> Logout
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-100 lg:flex">
            {/* Desktop sidebar */}
            <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-slate-200 lg:block">
                {sidebar}
            </aside>

            {/* Mobile drawer */}
            {open && (
                <div className="fixed inset-0 z-40 lg:hidden">
                    <div className="absolute inset-0 bg-slate-900/50" onClick={() => setOpen(false)} />
                    <aside className="absolute left-0 top-0 h-full w-72 max-w-[85vw] shadow-xl">
                        <div className="flex h-full flex-col bg-white">
                            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                                <div className="flex min-w-0 items-center gap-3">
                                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
                                        <Timer size={18} />
                                    </span>
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-bold leading-tight text-slate-900">{company || 'Time Tracker'}</p>
                                        <p className="truncate text-xs text-slate-500">{user?.name} · {user?.role}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setOpen(false)}
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600"
                                    aria-label="Close menu"
                                >
                                    <X size={17} />
                                </button>
                            </div>
                            <nav className="slim-scroll flex-1 space-y-1 overflow-y-auto px-3 py-4">
                                {links.map((l) => {
                                    const active = isActive(l.href);
                                    return (
                                        <Link
                                            key={l.href}
                                            href={l.href}
                                            onClick={() => setOpen(false)}
                                            className={cn(
                                                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                                                active
                                                    ? 'bg-slate-900 text-white'
                                                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                            )}
                                        >
                                            <l.icon size={17} /> {l.label}
                                        </Link>
                                    );
                                })}
                            </nav>
                            <div className="border-t border-slate-200 p-3">
                                <button
                                    onClick={() => router.post('/logout')}
                                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600"
                                >
                                    <LogOut size={17} /> Logout
                                </button>
                            </div>
                        </div>
                    </aside>
                </div>
            )}

            <div className="min-w-0 flex-1">
                <header className="sticky top-0 z-10 border-b border-slate-200 bg-white">
                    <div className="flex items-center gap-3 px-4 py-3">
                        <button
                            onClick={() => setOpen(true)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 lg:hidden"
                            aria-label="Open menu"
                        >
                            <Menu size={17} />
                        </button>
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white lg:hidden">
                            <Timer size={16} />
                        </span>
                        <div className="min-w-0 flex-1">
                            <h1 className="truncate text-base font-bold text-slate-900 lg:hidden">{title}</h1>
                            {sub && <p className="truncate text-xs text-slate-500 lg:hidden">{sub}</p>}
                            <p className="hidden truncate text-sm font-semibold text-slate-500 lg:block">{company || 'Time Tracker'}</p>
                        </div>
                        <button
                            onClick={() => router.post('/logout')}
                            className="hidden items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 sm:inline-flex lg:hidden"
                        >
                            <LogOut size={15} /> Logout
                        </button>
                    </div>
                    {flash?.success && (
                        <div className="border-t border-emerald-100 bg-emerald-50 px-4 py-2 text-center text-sm font-medium text-emerald-700">
                            {flash.success}
                        </div>
                    )}
                </header>

                <main className="mx-auto max-w-6xl px-4 py-6">
                    <div className="mb-5 hidden lg:block">
                        <h1 className="text-xl font-bold text-slate-900">{title}</h1>
                        {sub && <p className="text-sm text-slate-500">{sub}</p>}
                    </div>

                    {children}
                </main>
            </div>
        </div>
    );
}
