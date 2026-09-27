import React from 'react';
import { TrendingUp } from 'lucide-react';
import Layout, { Card, CardTitle } from '../../Components/ui';
import PageTitle from '../../Components/PageTitle';

function bar(v) {
    return (
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-slate-900" style={{ width: `${Math.min(100, v)}%` }} />
        </div>
    );
}

export default function PerfIndex({ month, rows, from, to }) {
    return (
        <Layout title="Performance" sub={`${from} → ${to}`}>
            <PageTitle title="Performance" />
            <Card className="mb-4">
                <form className="flex gap-2">
                    <input type="month" name="month" defaultValue={month} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                    <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Filter</button>
                </form>
            </Card>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {rows.map((r) => (
                    <Card key={r.id}>
                        <CardTitle icon={TrendingUp} title={`${r.name}`} sub={r.employee_code || ''} />
                        <p className="text-3xl font-bold">{r.score}<span className="text-sm font-normal text-slate-400">/100</span></p>
                        <div className="my-2">{bar(r.score)}</div>
                        <div className="grid grid-cols-2 gap-1 text-xs text-slate-500">
                            <span>Present: <b className="text-slate-800">{r.present}</b></span>
                            <span>Late: <b className="text-slate-800">{r.lateCount}× ({r.lateMinutes}m)</b></span>
                            <span>Avg hrs: <b className="text-slate-800">{r.avgHours}</b></span>
                            <span>OT: <b className="text-slate-800">{r.overtimeMinutes}m</b></span>
                            <span>Early: <b className="text-slate-800">{r.earlyMinutes}m</b></span>
                            <span>Leave: <b className="text-slate-800">{r.leaveDays}d</b></span>
                        </div>
                    </Card>
                ))}
                {rows.length === 0 && <Card><p className="text-sm text-slate-400">No employees.</p></Card>}
            </div>
        </Layout>
    );
}
