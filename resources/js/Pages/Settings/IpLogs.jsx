import React from 'react';
import { ShieldCheck } from 'lucide-react';
import Layout, { Card, CardTitle, fmtDateTime } from '../../Components/ui';
import PageTitle from '../../Components/PageTitle';

export default function IpLogs({ logs }) {
    return (
        <Layout title="IP Logs" sub="Login, blocked, clock and break IP tracking">
            <PageTitle title="IP Logs" />
            <Card>
                <CardTitle icon={ShieldCheck} title="Recent IP events" />
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[560px] text-sm">
                        <thead>
                            <tr className="text-left text-xs uppercase text-slate-400">
                                <th className="py-2">Time</th><th>User</th><th>IP</th><th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((l) => (
                                <tr key={l.id} className="border-t border-slate-100">
                                    <td className="py-2">{fmtDateTime(l.created_at, true)}</td>
                                    <td className="font-medium">{l.user?.name || '—'}</td>
                                    <td className="font-mono text-xs">{l.ip_address}</td>
                                    <td><span className={`rounded-full px-2 py-1 text-xs font-semibold ${l.action === 'blocked' || l.action === 'login_failed' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'}`}>{l.action}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {logs.length === 0 && <p className="py-4 text-center text-sm text-slate-400">No logs.</p>}
                </div>
            </Card>
        </Layout>
    );
}
