import React from 'react';
import { Users, Clock, Coffee, Timer, CalendarDays } from 'lucide-react';
import Layout, { Card, CardTitle, Stat, fmtDate, fmtTime } from '../../Components/ui';
import PageTitle from '../../Components/PageTitle';

export default function Admin({ stats, recent, defaults }) {
    return (
        <Layout title="Admin Dashboard" sub={`Late grace: ${defaults.late_threshold_minutes} min · Break: ${defaults.break_minutes} min`}>
            <PageTitle title="Dashboard" />
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
                <Stat icon={Users} label="Employees" value={stats.employees} />
                <Stat icon={Clock} label="Present today" value={stats.presentToday} tone="bg-emerald-600" />
                <Stat icon={Timer} label="Late today" value={stats.lateToday} tone="bg-amber-500" />
                <Stat icon={Coffee} label="On break" value={stats.onBreak} tone="bg-sky-600" />
                <Stat icon={Clock} label="Active timers" value={stats.activeTimers} tone="bg-indigo-600" />
                <Stat icon={CalendarDays} label="Leave days (mo)" value={stats.leavesThisMonth} tone="bg-rose-500" />
            </div>

            <Card className="mt-4">
                <CardTitle icon={Clock} title="Recent activity" sub="Latest clock events" />
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px] text-sm">
                        <thead>
                            <tr className="text-left text-xs uppercase text-slate-400">
                                <th className="py-2">Employee</th>
                                <th>Date</th>
                                <th>In</th>
                                <th>Out</th>
                                <th>Late</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recent.map((r) => (
                                <tr key={r.id} className="border-t border-slate-100">
                                    <td className="py-2 font-medium">{r.user?.name}</td>
                                    <td>{fmtDate(r.date)}</td>
                                    <td>{r.clock_in ? fmtTime(r.clock_in) : '—'}</td>
                                    <td>{r.clock_out ? fmtTime(r.clock_out) : '—'}</td>
                                    <td>{r.late_minutes} min</td>
                                    <td><span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold">{r.status}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </Layout>
    );
}
