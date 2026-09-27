import React from 'react';
import { router } from '@inertiajs/react';
import { Clock, Coffee, LogIn, LogOut, Timer } from 'lucide-react';
import Layout, { Card, CardTitle, Stat, Btn, fmtDate, fmtTime, fmtDuration, fmtElapsed, LiveClock, useNow } from '../../Components/ui';
import PageTitle from '../../Components/PageTitle';

export default function Employee({ shift, attendance, openBreak, week, lateThreshold, allowedBreakMinutes, today }) {
    const now = useNow(1000);
    const clockedIn = !!attendance?.clock_in;
    const clockedOut = !!attendance?.clock_out;
    const elapsed = clockedIn && !clockedOut ? fmtElapsed(attendance.clock_in, now) : fmtDuration(attendance?.work_minutes ?? 0);

    return (
        <Layout title="My Dashboard" sub={`${fmtDate(today)} · Shift: ${shift ? `${shift.name} (${shift.start_time?.slice(0, 5)}–${shift.end_time?.slice(0, 5)})` : 'Not assigned'}`}>
            <PageTitle title="Dashboard" />
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <div className="flex items-center justify-between">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
                            <Clock size={18} />
                        </span>
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" /> LIVE
                        </span>
                    </div>
                    <p className="mt-4 text-2xl font-bold tabular-nums text-slate-900"><LiveClock /></p>
                    <p className="text-sm font-medium text-slate-600">Today</p>
                    <p className="mt-1 text-xs text-slate-400">{now.toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' })}</p>
                </Card>
                <Stat icon={Timer} label="Late" value={`${attendance?.late_minutes ?? 0} min`} hint={`Grace: ${lateThreshold} min`} tone="bg-amber-500" />
                <Stat icon={Coffee} label="Break used" value={fmtDuration(attendance?.break_minutes ?? 0)} hint={`Allowed: ${allowedBreakMinutes} min`} tone="bg-sky-600" />
                <Stat icon={Clock} label={clockedIn && !clockedOut ? 'Working (live)' : 'Worked'} value={elapsed} hint={`OT: ${attendance?.overtime_minutes ?? 0} min`} tone="bg-emerald-600" />
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Card>
                    <CardTitle icon={Timer} title="Clock actions" sub={clockedOut ? 'Done for today' : clockedIn ? `Clocked in at ${fmtTime(attendance.clock_in, true)} · ${elapsed}` : 'Not clocked in yet'} />
                    <div className="flex flex-wrap gap-2">
                        {!clockedIn && <Btn onClick={() => router.post('/my-time/clock-in')}><LogIn size={15} /> Clock in</Btn>}
                        {clockedIn && !clockedOut && <Btn variant="danger" onClick={() => router.post('/my-time/clock-out')}><LogOut size={15} /> Clock out</Btn>}
                        {clockedIn && !clockedOut && !openBreak && <Btn variant="ghost" onClick={() => router.post('/my-time/break-start')}><Coffee size={15} /> Start break</Btn>}
                        {openBreak && <Btn variant="ghost" onClick={() => router.post('/my-time/break-end')}><Coffee size={15} /> End break ({fmtElapsed(openBreak.break_start, now)})</Btn>}
                    </div>
                    {attendance?.clock_in && <p className="mt-3 text-sm text-slate-500">In: {fmtTime(attendance.clock_in, true)} · Out: {attendance.clock_out ? fmtTime(attendance.clock_out, true) : '—'}</p>}
                </Card>

                <Card>
                    <CardTitle icon={Clock} title="This week" sub="Recent attendance" />
                    <div className="space-y-2">
                        {week?.map((d) => (
                            <div key={d.id} className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2 text-sm">
                                <span className="font-medium">{fmtDate(d.date)}</span>
                                <span className="text-slate-500">{d.clock_in ? `${fmtDuration(d.work_minutes)} · ${d.clock_in ? fmtTime(d.clock_in) : ''} · ${d.status}` : d.status}</span>
                            </div>
                        ))}
                        {(!week || week.length === 0) && <p className="text-sm text-slate-400">No records yet.</p>}
                    </div>
                </Card>
            </div>
        </Layout>
    );
}
