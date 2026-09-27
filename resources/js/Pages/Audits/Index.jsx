import React, { useState } from 'react';
import { ScrollText } from 'lucide-react';
import Layout, { Card, CardTitle, Modal, Btn, fmtDateTime } from '../../Components/ui';
import PageTitle from '../../Components/PageTitle';

function Diff({ before, after }) {
    const keys = ['clock_in', 'clock_out', 'status', 'note', 'late_minutes', 'early_leave_minutes', 'overtime_minutes', 'work_minutes', 'break_minutes'];
    const rows = keys
        .map((k) => {
            const b = before?.attendance?.[k] ?? before?.[k];
            const a = after?.attendance?.[k] ?? after?.[k];
            const bs = JSON.stringify(b);
            const as = JSON.stringify(a);
            if (bs === as) return null;
            return { k, b: bs?.slice(0, 60), a: as?.slice(0, 60) };
        })
        .filter(Boolean);
    const bb = (before?.breaks || []).length;
    const ab = (after?.breaks || after?.attendance?.breaks || []).length;
    return (
        <div className="mt-2 space-y-1">
            {rows.map((r) => (
                <p key={r.k} className="rounded-lg bg-slate-50 px-2 py-1 font-mono text-[11px]">
                    <b>{r.k}</b>: <span className="text-red-600">{r.b || '∅'}</span> → <span className="text-emerald-600">{r.a || '∅'}</span>
                </p>
            ))}
            {bb !== ab && (
                <p className="rounded-lg bg-slate-50 px-2 py-1 font-mono text-[11px]"><b>breaks</b>: <span className="text-red-600">{bb}</span> → <span className="text-emerald-600">{ab}</span></p>
            )}
            {rows.length === 0 && bb === ab && <p className="text-xs text-slate-400">No field changes recorded.</p>}
        </div>
    );
}

export default function Audits({ audits }) {
    const [sel, setSel] = useState(null);
    return (
        <Layout title="Audit Trail" sub="Before → after for every admin adjustment">
            <PageTitle title="Audit Trail" />
            <div className="space-y-2">
                {audits.map((a) => (
                    <Card key={a.id}>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-3">
                                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white"><ScrollText size={17} /></span>
                                <div>
                                    <p className="text-sm font-semibold">{a.employee?.name} <span className="text-xs font-normal text-slate-400">adjusted by {a.changer?.name}</span></p>
                                    <p className="text-xs text-slate-500">{fmtDateTime(a.created_at, true)} · {a.ip_address} · {a.note || 'no note'}</p>
                                </div>
                            </div>
                            <Btn variant="ghost" onClick={() => setSel(a)}>View diff</Btn>
                        </div>
                        <Diff before={a.before} after={a.after} />
                    </Card>
                ))}
                {audits.length === 0 && <Card><p className="text-center text-sm text-slate-400">No adjustments yet.</p></Card>}
            </div>
            <Modal open={!!sel} onClose={() => setSel(null)} title={`Adjustment #${sel?.id || ''}`} sub={`${sel?.employee?.name || ''} · ${sel ? fmtDateTime(sel.created_at, true) : ''}`} wide>
                <div className="grid gap-3 md:grid-cols-2">
                    <div>
                        <p className="mb-1 text-xs font-bold uppercase text-red-500">Before</p>
                        <pre className="max-h-80 overflow-auto rounded-xl bg-red-50 p-3 font-mono text-[11px]">{JSON.stringify(sel?.before, null, 2)}</pre>
                    </div>
                    <div>
                        <p className="mb-1 text-xs font-bold uppercase text-emerald-600">After</p>
                        <pre className="max-h-80 overflow-auto rounded-xl bg-emerald-50 p-3 font-mono text-[11px]">{JSON.stringify(sel?.after, null, 2)}</pre>
                    </div>
                </div>
            </Modal>
        </Layout>
    );
}
