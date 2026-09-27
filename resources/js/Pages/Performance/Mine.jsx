import React from 'react';
import { TrendingUp } from 'lucide-react';
import Layout, { Card, CardTitle, Stat } from '../../Components/ui';
import PageTitle from '../../Components/PageTitle';

export default function MyPerf({ month, stats }) {
    return (
        <Layout title="My Performance" sub={month}>
            <PageTitle title="My Performance" />
            <Card className="mb-4">
                <form className="flex gap-2">
                    <input type="month" name="month" defaultValue={month} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                    <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Filter</button>
                </form>
            </Card>
            <div className="grid gap-4 md:grid-cols-4">
                <Stat icon={TrendingUp} label="Score" value={`${stats.score}/100`} />
                <Stat icon={TrendingUp} label="Present days" value={stats.present} tone="bg-emerald-600" />
                <Stat icon={TrendingUp} label="Late" value={`${stats.lateCount}×`} hint={`${stats.lateMinutes} min`} tone="bg-amber-500" />
                <Stat icon={TrendingUp} label="Avg hours" value={stats.avgHours} tone="bg-sky-600" />
            </div>
            <Card className="mt-4">
                <CardTitle icon={TrendingUp} title="Details" />
                <div className="grid grid-cols-2 gap-2 text-sm md:grid-cols-3">
                    <span>Work: <b>{stats.workMinutes}m</b></span>
                    <span>Overtime: <b>{stats.overtimeMinutes}m</b></span>
                    <span>Early leave: <b>{stats.earlyMinutes}m</b></span>
                    <span>Leave days: <b>{stats.leaveDays}</b></span>
                </div>
            </Card>
        </Layout>
    );
}
