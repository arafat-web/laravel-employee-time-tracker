import React, { useState } from 'react';
import { Link } from '@inertiajs/react';
import { Download, ChevronDown, Search } from 'lucide-react';
import Layout, { Card, fmtDate, cn } from '../../Components/ui';
import PageTitle from '../../Components/PageTitle';

const DOT = {
    P: 'bg-emerald-500',
    LATE: 'bg-amber-500',
    A: 'bg-red-500',
    L: 'bg-sky-500',
    H: 'bg-violet-500',
    W: 'bg-slate-200',
};

const LABEL = {
    P: 'Present', LATE: 'Late', A: 'Absent', L: 'Leave', H: 'Holiday', W: 'Weekend',
};

function DayCell({ v, date }) {
    const d = new Date(date + 'T12:00:00');
    const tip = `${d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })} — ${LABEL[v] || 'No data'}`;
    return (
        <span
            title={tip}
            className={cn(
                'flex h-6 w-6 items-center justify-center rounded-lg text-[9px] font-bold transition hover:scale-110',
                v ? 'text-white ' + (DOT[v] || 'bg-slate-300') : 'bg-slate-50 text-slate-200'
            )}
        >
            {v === 'LATE' ? '!' : v ? v[0] : '·'}
        </span>
    );
}

function LegendDot({ k }) {
    return (
        <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
            <span className={cn('h-3 w-3 rounded-md', DOT[k])} /> {LABEL[k]}
        </span>
    );
}

export default function Timesheet({ month, from, to, days, rows }) {
    const [q, setQ] = useState('');
    const [open, setOpen] = useState(null);
    const filtered = rows.filter((r) => r.name.toLowerCase().includes(q.toLowerCase()));

    return (
        <Layout title="Timesheet" sub={`${fmtDate(from)} → ${fmtDate(to)}`}>
            <PageTitle title="Timesheet" />
            <div className="mb-3 flex flex-wrap items-center gap-2">
                <form className="flex gap-2">
                    <input type="month" name="month" defaultValue={month} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
                    <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">View</button>
                </form>
                <div className="relative min-w-44 flex-1 sm:max-w-64">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search employee…"
                        className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-slate-900"
                    />
                </div>
                <Link href={`/timesheet/export?month=${month}`} className="ml-auto inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500">
                    <Download size={15} /> CSV
                </Link>
            </div>

            <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-2xl border border-slate-200 bg-white px-4 py-2.5">
                {Object.keys(LABEL).map((k) => <LegendDot key={k} k={k} />)}
                <span className="ml-auto hidden text-[11px] text-slate-400 sm:block">Hover a day for details · Click a row to expand</span>
            </div>

            <div className="space-y-2">
                {filtered.map((r) => {
                    const expanded = open === r.id;
                    return (
                        <Card key={r.id} className="!p-0 overflow-hidden">
                            <button onClick={() => setOpen(expanded ? null : r.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white">
                                    {r.name?.[0]}
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate text-sm font-semibold text-slate-900">{r.name}</span>
                                    <span className="block truncate text-[11px] text-slate-400">{r.employee_code} · {r.shift || 'No shift'}</span>
                                </span>
                                <span className="hidden items-center gap-3 text-xs font-bold tabular-nums sm:flex">
                                    <span className="text-emerald-600">{r.totals.present}P</span>
                                    {r.totals.late > 0 && <span className="text-amber-600">{r.totals.late}L</span>}
                                    {r.totals.absent > 0 && <span className="text-red-500">{r.totals.absent}A</span>}
                                    {r.totals.leave > 0 && <span className="text-sky-600">{r.totals.leave}Lv</span>}
                                    <span className="rounded-lg bg-slate-100 px-2 py-1 text-slate-700">
                                        {Math.floor(r.totals.work / 60)}h {String(r.totals.work % 60).padStart(2, '0')}m
                                    </span>
                                </span>
                                <ChevronDown size={16} className={cn('shrink-0 text-slate-400 transition', expanded && 'rotate-180')} />
                            </button>

                            {/* Compact week-grouped grid */}
                            <div className="border-t border-slate-100 px-4 py-3">
                                <div className="flex flex-wrap gap-x-4 gap-y-2">
                                    {chunkWeeks(days).map((week, wi) => (
                                        <div key={wi} className="flex items-center gap-1">
                                            {week.map((d) => (
                                                <span key={d} className="flex flex-col items-center gap-0.5">
                                                    <DayCell v={r.cells[d]} date={d} />
                                                    <span className="text-[9px] tabular-nums text-slate-300">{d.slice(8)}</span>
                                                </span>
                                            ))}
                                            {wi < chunkWeeks(days).length - 1 && <span className="mx-1 h-8 w-px bg-slate-100" />}
                                        </div>
                                    ))}
                                </div>

                                {/* Mobile totals */}
                                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-bold tabular-nums sm:hidden">
                                    <span className="text-emerald-600">P {r.totals.present}</span>
                                    <span className="text-amber-600">Late {r.totals.late}</span>
                                    <span className="text-red-500">Abs {r.totals.absent}</span>
                                    <span className="text-sky-600">Leave {r.totals.leave}</span>
                                    <span className="text-slate-700">{Math.floor(r.totals.work / 60)}h {r.totals.work % 60}m</span>
                                </div>

                                {expanded && (
                                    <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3 text-xs sm:grid-cols-4">
                                        <span>Present <b className="text-emerald-600">{r.totals.present}</b></span>
                                        <span>Late <b className="text-amber-600">{r.totals.late}</b></span>
                                        <span>Absent <b className="text-red-500">{r.totals.absent}</b></span>
                                        <span>Leave <b className="text-sky-600">{r.totals.leave}</b></span>
                                        <span>Weekend <b>{r.totals.weekend}</b></span>
                                        <span>Holiday <b className="text-violet-600">{r.totals.holiday}</b></span>
                                        <span>Work <b>{Math.floor(r.totals.work / 60)}h {r.totals.work % 60}m</b></span>
                                        <span>OT <b>{r.totals.ot}m</b></span>
                                    </div>
                                )}
                            </div>
                        </Card>
                    );
                })}
                {filtered.length === 0 && (
                    <Card><p className="text-center text-sm text-slate-400">No employees found.</p></Card>
                )}
            </div>
        </Layout>
    );
}

function chunkWeeks(days) {
    const out = [];
    let cur = [];
    days.forEach((d) => {
        cur.push(d);
        if (new Date(d + 'T12:00:00').getDay() === 0 || cur.length === 7) {
            out.push(cur);
            cur = [];
        }
    });
    if (cur.length) out.push(cur);
    return out;
}
