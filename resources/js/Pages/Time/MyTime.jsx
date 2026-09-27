import React from 'react';
import { router } from '@inertiajs/react';
import {
    Clock, Coffee, LogIn, LogOut, Timer, CalendarDays,
    MapPin, AlarmClock, Sparkles, History,
} from 'lucide-react';
import Layout, { Card, Btn, fmtDate, fmtTime, fmtDuration, fmtElapsed, useNow, LiveClock, cn } from '../../Components/ui';
import PageTitle from '../../Components/PageTitle';

function Ring({ value, max, size = 180, stroke = 12, children }) {
    const pct = Math.min(1, Math.max(0, max > 0 ? value / max : 0));
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    return (
        <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
                <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} className="fill-none stroke-slate-100" />
                <circle
                    cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} strokeLinecap="round"
                    className="fill-none stroke-slate-900 transition-all duration-1000"
                    strokeDasharray={c} strokeDashoffset={c * (1 - pct)}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
        </div>
    );
}

function MiniStat({ icon: Icon, label, value, sub }) {
    return (
        <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-slate-700 shadow-sm">
                <Icon size={16} />
            </span>
            <div className="min-w-0">
                <p className="text-sm font-bold tabular-nums text-slate-900">{value}</p>
                <p className="truncate text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}{sub ? ` · ${sub}` : ''}</p>
            </div>
        </div>
    );
}

function TimelineItem({ time, label, sub, active, done, last }) {
    return (
        <div className="flex gap-3">
            <div className="flex flex-col items-center">
                <span className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full border-2',
                    done ? 'border-slate-900 bg-slate-900 text-white' : active ? 'border-slate-900 bg-white text-slate-900' : 'border-slate-200 bg-white text-slate-300'
                )}>
                    {active && <span className="h-2 w-2 animate-pulse rounded-full bg-slate-900" />}
                    {done && <span className="text-xs font-bold">✓</span>}
                </span>
                {!last && <span className={cn('w-0.5 flex-1', done ? 'bg-slate-900' : 'bg-slate-100')} style={{ minHeight: 22 }} />}
            </div>
            <div className="pb-5">
                <p className="text-sm font-semibold text-slate-900">{label}</p>
                <p className="text-xs text-slate-500">{time}{sub ? ` · ${sub}` : ''}</p>
            </div>
        </div>
    );
}

export default function MyTime({ shift, attendance, history, allowedBreakMinutes }) {
    const now = useNow(1000);
    const openBreak = attendance?.breaks?.find((b) => !b.break_end);
    const clockedIn = !!attendance?.clock_in;
    const clockedOut = !!attendance?.clock_out;

    const elapsedMin = clockedIn ? Math.max(0, (now - new Date(attendance.clock_in)) / 60000) : 0;
    const shiftMin = shift ? (() => {
        const [sh, sm] = String(shift.start_time).slice(0, 5).split(':').map(Number);
        const [eh, em] = String(shift.end_time).slice(0, 5).split(':').map(Number);
        let m = (eh * 60 + em) - (sh * 60 + sm);
        if (m <= 0) m += 24 * 60;
        return m;
    })() : 8 * 60;
    const elapsed = clockedIn && !clockedOut ? fmtElapsed(attendance.clock_in, now) : fmtDuration(attendance?.work_minutes ?? 0);
    const breakPct = Math.min(100, ((attendance?.break_minutes ?? 0) / Math.max(1, allowedBreakMinutes)) * 100);

    const steps = [
        { time: attendance?.clock_in ? fmtTime(attendance.clock_in, true) : 'Pending', label: 'Clock in', sub: attendance?.clock_in_ip, done: clockedIn, active: false },
        ...(attendance?.breaks || []).map((b) => ({
            time: `${fmtTime(b.break_start)} → ${b.break_end ? fmtTime(b.break_end) : 'now'}`,
            label: b.break_end ? 'Break' : 'On break',
            sub: b.break_end ? `${b.duration_minutes}m` : fmtElapsed(b.break_start, now),
            done: !!b.break_end, active: !b.break_end,
        })),
        { time: attendance?.clock_out ? fmtTime(attendance.clock_out, true) : clockedIn ? 'In progress' : 'Pending', label: 'Clock out', sub: attendance?.clock_out_ip, done: clockedOut, active: clockedIn && !clockedOut },
    ];

    return (
        <Layout title="My Time" sub={shift ? `${shift.name} · ${shift.start_time?.slice(0, 5)} – ${shift.end_time?.slice(0, 5)}` : 'No shift assigned'}>            <PageTitle title="My Time" />            {/* Hero */}
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col items-center gap-6 px-6 py-8 md:flex-row md:justify-between md:px-10">
                    <div className="flex flex-col items-center gap-4 md:flex-row md:gap-8">
                        <Ring value={clockedIn && !clockedOut ? elapsedMin : (attendance?.work_minutes ?? 0)} max={shiftMin}>
                            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                                {clockedOut ? 'Worked' : clockedIn ? (openBreak ? 'On break' : 'Working') : 'Today'}
                            </p>
                            <p className="text-3xl font-bold tabular-nums text-slate-900">{elapsed}</p>
                            <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-slate-400">
                                <CalendarDays size={11} /> {fmtDate(attendance?.date)}
                            </p>
                        </Ring>
                        <div className="text-center md:text-left">
                            <p className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-400 md:justify-start">
                                <span className={cn('h-2 w-2 rounded-full', clockedIn && !clockedOut ? 'animate-pulse bg-emerald-500' : 'bg-slate-300')} />
                                {clockedOut ? 'Day complete' : clockedIn ? (openBreak ? 'On break — timer keeps running' : 'Clocked in') : 'Ready to start'}
                            </p>
                            <p className="mt-2 text-4xl font-bold tabular-nums tracking-tight text-slate-900">
                                <LiveClock />
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                                {now.toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                            </p>
                            <div className="mt-4 flex flex-wrap justify-center gap-2 md:justify-start">
                                {!clockedIn && (
                                    <Btn onClick={() => router.post('/my-time/clock-in')} className="px-6 py-2.5">
                                        <LogIn size={16} /> Clock in
                                    </Btn>
                                )}
                                {clockedIn && !clockedOut && !openBreak && (
                                    <>
                                        <Btn variant="ghost" onClick={() => router.post('/my-time/break-start')} className="px-5 py-2.5">
                                            <Coffee size={16} /> Take break
                                        </Btn>
                                        <Btn variant="danger" onClick={() => router.post('/my-time/clock-out')} className="px-6 py-2.5">
                                            <LogOut size={16} /> Clock out
                                        </Btn>
                                    </>
                                )}
                                {openBreak && (
                                    <Btn onClick={() => router.post('/my-time/break-end')} className="px-6 py-2.5">
                                        <Coffee size={16} /> End break · {fmtElapsed(openBreak.break_start, now)}
                                    </Btn>
                                )}
                                {clockedOut && (
                                    <span className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700">
                                        <Sparkles size={15} /> Done for today
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="grid w-full max-w-sm grid-cols-2 gap-2">
                        <MiniStat icon={LogIn} label="In" value={attendance?.clock_in ? fmtTime(attendance.clock_in) : '—'} />
                        <MiniStat icon={LogOut} label="Out" value={attendance?.clock_out ? fmtTime(attendance.clock_out) : '—'} />
                        <MiniStat icon={AlarmClock} label="Late" value={`${attendance?.late_minutes ?? 0}m`} />
                        <MiniStat icon={Timer} label="Overtime" value={`${attendance?.overtime_minutes ?? 0}m`} />
                    </div>
                </div>
                {/* Break meter */}
                <div className="border-t border-slate-100 px-6 py-4 md:px-10">
                    <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                        <span className="flex items-center gap-1.5"><Coffee size={13} /> Break {fmtDuration(attendance?.break_minutes ?? 0)} of {allowedBreakMinutes}m</span>
                        <span className={cn('font-bold', (attendance?.break_minutes ?? 0) > allowedBreakMinutes ? 'text-red-600' : 'text-slate-700')}>
                            {Math.round(breakPct)}%
                        </span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                            className={cn('h-full rounded-full transition-all', (attendance?.break_minutes ?? 0) > allowedBreakMinutes ? 'bg-red-500' : 'bg-slate-900')}
                            style={{ width: `${Math.min(100, breakPct)}%` }}
                        />
                    </div>
                </div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-5">
                {/* Timeline */}
                <Card className="lg:col-span-2">
                    <div className="mb-4 flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white"><Clock size={18} /></span>
                        <div>
                            <h3 className="text-sm font-semibold text-slate-900">Today's timeline</h3>
                            <p className="text-xs text-slate-500">{attendance?.status || 'present'}{attendance?.note ? ` · ${attendance.note}` : ''}</p>
                        </div>
                    </div>
                    {steps.map((s, i) => (
                        <TimelineItem key={i} {...s} last={i === steps.length - 1} />
                    ))}
                    {(attendance?.clock_in_ip || attendance?.clock_out_ip) && (
                        <p className="flex items-center gap-1.5 border-t border-slate-100 pt-3 text-xs text-slate-400">
                            <MapPin size={12} /> {attendance?.clock_in_ip || '—'} → {attendance?.clock_out_ip || '—'}
                        </p>
                    )}
                </Card>

                {/* History */}
                <Card className="lg:col-span-3">
                    <div className="mb-4 flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white"><History size={18} /></span>
                        <div>
                            <h3 className="text-sm font-semibold text-slate-900">History</h3>
                            <p className="text-xs text-slate-500">Last 30 days</p>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[460px] text-sm">
                            <thead>
                                <tr className="text-left text-[11px] uppercase tracking-wide text-slate-400">
                                    <th className="pb-2">Date</th><th className="pb-2">In → Out</th><th className="pb-2">Work</th><th className="pb-2">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.map((h) => (
                                    <tr key={h.id} className="border-t border-slate-50">
                                        <td className="py-2.5 font-semibold text-slate-900">{fmtDate(h.date)}</td>
                                        <td className="text-slate-500">{h.clock_in ? fmtTime(h.clock_in) : '—'} <span className="text-slate-300">→</span> {h.clock_out ? fmtTime(h.clock_out) : '—'}</td>
                                        <td className="font-semibold tabular-nums text-slate-700">{fmtDuration(h.work_minutes)}</td>
                                        <td>
                                            <span className={cn(
                                                'rounded-full px-2 py-0.5 text-xs font-semibold',
                                                h.status === 'late' ? 'bg-amber-100 text-amber-700'
                                                    : h.status === 'leave' ? 'bg-sky-100 text-sky-700'
                                                    : h.status === 'absent' ? 'bg-red-100 text-red-600'
                                                    : 'bg-emerald-100 text-emerald-700'
                                            )}>
                                                {h.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {history.length === 0 && <p className="py-4 text-center text-sm text-slate-400">No history yet.</p>}
                    </div>
                </Card>
            </div>
        </Layout>
    );
}
