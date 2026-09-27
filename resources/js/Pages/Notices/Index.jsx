import React, { useState } from 'react';
import { router, useForm } from '@inertiajs/react';
import { Megaphone, Plus, Trash2, Users, User } from 'lucide-react';
import Layout, { Card, Btn, Field, inputCls, Modal, fmtDateTime, cn } from '../../Components/ui';
import PageTitle from '../../Components/PageTitle';

const KINDS = ['general', 'announcement', 'salary', 'late', 'leave'];
const KIND_STYLE = {
    salary: 'bg-emerald-100 text-emerald-700',
    late: 'bg-amber-100 text-amber-700',
    leave: 'bg-sky-100 text-sky-700',
    announcement: 'bg-violet-100 text-violet-700',
    general: 'bg-slate-100 text-slate-600',
};

export default function NoticeIndex({ notices, employees }) {
    const [modal, setModal] = useState(false);
    const form = useForm({ title: '', body: '', kind: 'announcement', audience: 'all', user_id: '' });

    const submit = (e) => {
        e.preventDefault();
        form.post('/admin-notices', { onSuccess: () => { setModal(false); form.reset(); } });
    };

    return (
        <Layout title="Notices" sub="Send to everyone or an individual · salary / late / leave auto-notices appear here too">
            <PageTitle title="Notices" />
            <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-sm text-slate-500">{notices.length} notices</p>
                <Btn onClick={() => { form.reset(); form.clearErrors(); setModal(true); }}><Plus size={15} /> New notice</Btn>
            </div>

            <div className="space-y-2">
                {notices.map((n) => (
                    <Card key={n.id}>
                        <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="flex items-start gap-3">
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
                                    <Megaphone size={17} />
                                </span>
                                <div>
                                    <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-900">
                                        {n.title}
                                        <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-bold', KIND_STYLE[n.kind] || KIND_STYLE.general)}>{n.kind}</span>
                                        {n.is_auto && <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[11px] font-bold text-white">auto</span>}
                                    </p>
                                    <p className="mt-0.5 whitespace-pre-line text-sm text-slate-600">{n.body}</p>
                                    <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                                        <span className="inline-flex items-center gap-1">
                                            {n.scope === 'all' ? <Users size={12} /> : <User size={12} />}
                                            {n.scope === 'all' ? 'Everyone' : n.employee?.name || '—'}
                                        </span>
                                        · {fmtDateTime(n.created_at)} · by {n.creator?.name || 'system'}
                                    </p>
                                </div>
                            </div>
                            <Btn variant="ghost" onClick={() => { if (confirm('Delete this notice?')) form.delete(`/admin-notices/${n.id}`); }}>
                                <Trash2 size={14} />
                            </Btn>
                        </div>
                    </Card>
                ))}
                {notices.length === 0 && <Card><p className="text-center text-sm text-slate-400">No notices yet.</p></Card>}
            </div>

            <Modal open={modal} onClose={() => setModal(false)} title="New notice" sub="Broadcast to all or send to one employee">
                <form onSubmit={submit} className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-1">
                        {['all', 'individual'].map((a) => (
                            <button
                                key={a} type="button" onClick={() => form.setData('audience', a)}
                                className={cn('rounded-lg px-3 py-2 text-sm font-semibold', form.data.audience === a ? 'bg-slate-900 text-white' : 'text-slate-500')}
                            >
                                {a === 'all' ? 'Everyone' : 'Individual'}
                            </button>
                        ))}
                    </div>
                    {form.data.audience === 'individual' && (
                        <Field label="Employee">
                            <select className={inputCls} value={form.data.user_id} onChange={(e) => form.setData('user_id', e.target.value)}>
                                <option value="">Select employee</option>
                                {employees.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.employee_code})</option>)}
                            </select>
                        </Field>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                        <Field label="Title"><input className={inputCls} value={form.data.title} onChange={(e) => form.setData('title', e.target.value)} placeholder="e.g. Salary for September paid" /></Field>
                        <Field label="Kind">
                            <select className={inputCls} value={form.data.kind} onChange={(e) => form.setData('kind', e.target.value)}>
                                {KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
                            </select>
                        </Field>
                    </div>
                    <Field label="Message">
                        <textarea rows={4} className={inputCls} value={form.data.body} onChange={(e) => form.setData('body', e.target.value)} placeholder="Write the notice…" />
                    </Field>
                    <div className="flex gap-2 pt-1">
                        <Btn type="button" variant="ghost" className="flex-1" onClick={() => setModal(false)}>Cancel</Btn>
                        <Btn className="flex-1" disabled={form.processing || router.processing}>Send</Btn>
                    </div>
                </form>
            </Modal>
        </Layout>
    );
}
