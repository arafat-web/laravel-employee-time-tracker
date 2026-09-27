import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { CalendarDays, Plus, X } from 'lucide-react';
import Layout, { Card, Stat, Btn, Field, inputCls, Modal, fmtDate, cn } from '../../Components/ui';
import PageTitle from '../../Components/PageTitle';

function StatusPill({ s }) {
    return (
        <span className={cn(
            'rounded-full px-2 py-0.5 text-xs font-semibold',
            s === 'approved' ? 'bg-emerald-100 text-emerald-700'
                : s === 'rejected' ? 'bg-red-100 text-red-600'
                : 'bg-amber-100 text-amber-700'
        )}>
            {s}
        </span>
    );
}

export default function MyLeaves({ leaves, summary, balances }) {
    const [modal, setModal] = useState(false);
    const form = useForm({ date_from: '', date_to: '', type: 'casual', reason: '' });

    const openNew = () => {
        form.setData({ date_from: '', date_to: '', type: 'casual', reason: '' });
        form.clearErrors();
        setModal(true);
    };

    const submit = (e) => {
        e.preventDefault();
        form.post('/my-leaves', { onSuccess: () => { setModal(false); form.reset(); } });
    };

    return (
        <Layout title="My Leaves" sub="Apply here · approved leaves count toward attendance">
            <PageTitle title="My Leaves" />
            <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm text-slate-500">
                    {summary.pending > 0 ? `${summary.pending}d awaiting approval` : 'No pending requests'}
                </p>
                <Btn onClick={openNew}><Plus size={15} /> Apply for leave</Btn>
            </div>

            {balances && (
                <Card className="mb-3">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Balance {balances.year} (approved only)</p>
                    <div className="grid grid-cols-3 gap-2">
                        {['sick', 'casual', 'annual'].map((t) => (
                            <div key={t} className="rounded-xl bg-slate-50 px-3 py-2 text-center">
                                <p className="text-lg font-bold tabular-nums text-slate-900">{balances.left[t]}<span className="text-xs font-normal text-slate-400">/{balances.allow[t]}</span></p>
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{t} left</p>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            <div className="grid gap-4 md:grid-cols-5">
                <Stat icon={CalendarDays} label="Approved" value={summary.total} />
                <Stat icon={CalendarDays} label="Sick" value={summary.sick} tone="bg-rose-500" />
                <Stat icon={CalendarDays} label="Casual" value={summary.casual} tone="bg-sky-600" />
                <Stat icon={CalendarDays} label="Annual" value={summary.annual} tone="bg-emerald-600" />
                <Stat icon={CalendarDays} label="Pending" value={summary.pending} tone="bg-amber-500" />
            </div>

            <div className="mt-4 space-y-2">
                {leaves.map((l) => (
                    <Card key={l.id} className={cn(l.status === 'pending' && '!border-amber-200')}>
                        <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                                <p className="text-sm font-semibold">
                                    {fmtDate(l.date_from)} → {fmtDate(l.date_to)}{' '}
                                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">{l.type} · {l.days}d</span>{' '}
                                    <StatusPill s={l.status} />
                                </p>
                                <p className="mt-0.5 text-xs text-slate-500">“{l.reason}”</p>
                                {l.review_note && (
                                    <p className="mt-0.5 text-xs text-slate-400">Reviewer{l.reviewer?.name ? ` (${l.reviewer.name})` : ''}: {l.review_note}</p>
                                )}
                            </div>
                            {l.status === 'pending' && (
                                <Btn variant="ghost" onClick={() => { if (confirm('Cancel this request?')) form.delete(`/my-leaves/${l.id}`); }}>
                                    <X size={14} /> Cancel
                                </Btn>
                            )}
                        </div>
                    </Card>
                ))}
                {leaves.length === 0 && <Card><p className="text-sm text-slate-400">No leaves yet. Click “Apply for leave”.</p></Card>}
            </div>

            <Modal open={modal} onClose={() => setModal(false)} title="Apply for leave" sub="Goes to admin for approval">
                <form onSubmit={submit} className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                        <Field label="From"><input type="date" className={inputCls} value={form.data.date_from} onChange={(e) => form.setData('date_from', e.target.value)} /></Field>
                        <Field label="To"><input type="date" className={inputCls} value={form.data.date_to} onChange={(e) => form.setData('date_to', e.target.value)} /></Field>
                    </div>
                    <Field label="Type">
                        <select className={inputCls} value={form.data.type} onChange={(e) => form.setData('type', e.target.value)}>
                            <option value="casual">casual</option><option value="sick">sick</option>
                            <option value="annual">annual</option><option value="unpaid">unpaid</option>
                            <option value="other">other</option>
                        </select>
                    </Field>
                    <Field label="Reason">
                        <input className={inputCls} value={form.data.reason} onChange={(e) => form.setData('reason', e.target.value)} placeholder="Why do you need leave?" />
                    </Field>
                    {form.errors?.date_from && <p className="text-sm font-medium text-red-600">{form.errors.date_from}</p>}
                    <div className="flex gap-2 pt-1">
                        <Btn type="button" variant="ghost" className="flex-1" onClick={() => setModal(false)}>Cancel</Btn>
                        <Btn className="flex-1" disabled={form.processing}>Send request</Btn>
                    </div>
                </form>
            </Modal>
        </Layout>
    );
}
