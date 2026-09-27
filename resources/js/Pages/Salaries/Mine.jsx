import React from 'react';
import { Wallet } from 'lucide-react';
import Layout, { Card, Stat, fmtDate } from '../../Components/ui';
import PageTitle from '../../Components/PageTitle';

export default function MySalary({ rows }) {
    const total = rows.reduce((s, r) => s + Number(r.net_amount), 0);
    return (
        <Layout title="My Salary" sub="Monthly salary records">
            <PageTitle title="My Salary" />
            <div className="grid gap-4 md:grid-cols-2">
                <Stat icon={Wallet} label="Total received (shown)" value={total.toFixed(2)} />
                <Stat icon={Wallet} label="Records" value={rows.length} tone="bg-emerald-600" />
            </div>
            <div className="mt-4 space-y-2">
                {rows.map((r) => (
                    <Card key={r.id}>
                        <p className="text-sm font-semibold">{fmtDate(r.month)} · Net <b>{r.net_amount}</b> · {r.is_paid ? 'Paid' : 'Unpaid'}</p>
                        <p className="text-xs text-slate-500">Base {r.base_amount} + {r.allowances} + {r.bonus} − {r.deductions} · {r.notes}</p>
                    </Card>
                ))}
                {rows.length === 0 && <Card><p className="text-sm text-slate-400">No salary records.</p></Card>}
            </div>
        </Layout>
    );
}
