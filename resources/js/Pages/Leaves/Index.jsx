import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Plus, Pencil, Trash2, Check, X, Clock3 } from 'lucide-react';
import Layout, { Card, Btn, Field, inputCls, Modal, fmtDate, cn } from '../../Components/ui';
import PageTitle from '../../Components/PageTitle';

const blank = { user_id: '', date_from: '', date_to: '', type: 'casual', reason: '' };

function StatusPill({ s }) {
    return (
        <span className={cn(
            'rounded-full px-2 py-1 text-xs font-semibold',
            s === 'approved' ? 'bg-emerald-100 text-emerald-700'
                : s === 'rejected' ? 'bg-red-100 text-red-600'
                : 'bg-amber-100 text-amber-700'
        )}>
            {s}
        </span>
    );
}

export default function LeaveIndex({ leaves, employees, pendingCount }) {
    const [modal, setModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [review, setReview] = useState(null);
    const form = useForm(blank);
    const reviewForm = useForm({ action: 'approve', review_note: '' });

    const openNew = () => {
        setEditing(null);
        form.setData(blank);
        setModal(true);
    };

    const openEdit = (l) => {
        setEditing(l.id);
        form.setData({ user_id: l.user_id, date_from: String(l.date_from).slice(0, 10), date_to: String(l.date_to).slice(0, 10), type: l.type, reason: l.reason || '' });
        setModal(true);
    };

    const close = () => {
        setModal(false);
        setEditing(null);
        form.reset();
        form.clearErrors();
    };

    const submit = (e) => {
        e.preventDefault();
        if (editing) form.put(`/leaves/${editing}`, { onSuccess: close });
        else form.post('/leaves', { onSuccess: close });
    };

    const openReview = (l, action) => {
        setReview(l);
        reviewForm.setData({ action, review_note: '' });
    };

    const submitReview = (e) => {
        e.preventDefault();
        reviewForm.post(`/leaves/${review.id}/review`, {
            onSuccess: () => { setReview(null); reviewForm.reset(); },
        });
    };

    const pendings = leaves.filter((l) => l.status === 'pending');
    const rest = leaves.filter((l) => l.status !== 'pending');

    return (
        <Layout title="Leaves" sub={`${pendingCount || pendings.length} pending approval · approved marks attendance as leave`}>
            <PageTitle title="Leaves" />
            <div className="mb-4 flex items-center justify-between gap-3">
                <p className="flex items-center gap-2 text-sm text-slate-500">
                    <Clock3 size={15} className="text-amber-500" /> {pendings.length} awaiting review
                </p>
                <Btn onClick={openNew}><Plus size={15} /> Add leave (auto-approved)</Btn>
            </div>

            {pendings.length > 0 && (
                <div className="mb-4 space-y-2">
                    {pendings.map((l) => (
                        <Card key={l.id} className="!border-amber-200 !bg-amber-50/50">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                    <p className="text-sm font-semibold">{l.user?.name} <StatusPill s={l.status} /> <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">{l.type} · {l.days}d</span></p>
                                    <p className="text-xs text-slate-500">{fmtDate(l.date_from)} → {fmtDate(l.date_to)} · “{l.reason}”</p>
                                </div>
                                <div className="flex gap-2">
                                    <Btn onClick={() => openReview(l, 'approve')}><Check size={14} /> Approve</Btn>
                                    <Btn variant="danger" onClick={() => openReview(l, 'reject')}><X size={14} /> Reject</Btn>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] text-sm">
                        <thead>
                            <tr className="text-left text-xs uppercase text-slate-400">
                                <th className="py-2">Employee</th>
                                <th>Dates</th>
                                <th>Type</th>
                                <th>Status</th>
                                <th>Review</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leaves.map((l) => (
                                <tr key={l.id} className="border-t border-slate-100">
                                    <td className="py-3 font-semibold text-slate-900">{l.user?.name}</td>
                                    <td className="text-slate-600">{fmtDate(l.date_from)} → {fmtDate(l.date_to)} <span className="font-semibold">({l.days}d)</span></td>
                                    <td><span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold">{l.type}</span></td>
                                    <td><StatusPill s={l.status} /></td>
                                    <td className="max-w-[200px] truncate text-xs text-slate-400">{l.review_note ? `${l.reviewer?.name || ''}: ${l.review_note}` : l.reason || '—'}</td>
                                    <td>
                                        <div className="flex justify-end gap-1">
                                            {l.status === 'pending' && (
                                                <>
                                                    <Btn variant="ghost" onClick={() => openReview(l, 'approve')}><Check size={14} /></Btn>
                                                    <Btn variant="ghost" onClick={() => openReview(l, 'reject')}><X size={14} /></Btn>
                                                </>
                                            )}
                                            <Btn variant="ghost" onClick={() => openEdit(l)}><Pencil size={14} /></Btn>
                                            <Btn variant="ghost" onClick={() => { if (confirm('Delete this leave?')) form.delete(`/leaves/${l.id}`); }}><Trash2 size={14} /></Btn>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {leaves.length === 0 && <p className="py-6 text-center text-sm text-slate-400">No leaves yet.</p>}
                </div>
            </Card>

            <Modal open={modal} onClose={close} title={editing ? 'Edit leave' : 'Add leave (approved immediately)'}>
                <form onSubmit={submit} className="space-y-3">
                    <Field label="Employee">
                        <select className={inputCls} value={form.data.user_id} onChange={(e) => form.setData('user_id', e.target.value)}>
                            <option value="">Select</option>
                            {employees.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.employee_code})</option>)}
                        </select>
                    </Field>
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
                    <Field label="Reason"><input className={inputCls} value={form.data.reason} onChange={(e) => form.setData('reason', e.target.value)} /></Field>
                    <div className="flex gap-2 pt-1">
                        <Btn type="button" variant="ghost" className="flex-1" onClick={close}>Cancel</Btn>
                        <Btn className="flex-1" disabled={form.processing}>{editing ? 'Update' : 'Save'}</Btn>
                    </div>
                </form>
            </Modal>

            <Modal open={!!review} onClose={() => setReview(null)} title={`${reviewForm.data.action === 'approve' ? 'Approve' : 'Reject'} leave · ${review?.user?.name || ''}`} sub={`${review ? fmtDate(review.date_from) + ' → ' + fmtDate(review.date_to) : ''}`}>
                <form onSubmit={submitReview} className="space-y-3">
                    <Field label={reviewForm.data.action === 'approve' ? 'Note (optional)' : 'Rejection reason'}>
                        <input className={inputCls} value={reviewForm.data.review_note} onChange={(e) => reviewForm.setData('review_note', e.target.value)} placeholder={reviewForm.data.action === 'approve' ? 'Optional note' : 'Why rejected?'} />
                    </Field>
                    <div className="flex gap-2">
                        <Btn type="button" variant="ghost" className="flex-1" onClick={() => setReview(null)}>Cancel</Btn>
                        <Btn className="flex-1" variant={reviewForm.data.action === 'approve' ? 'dark' : 'danger'} disabled={reviewForm.processing}>
                            Confirm {reviewForm.data.action}
                        </Btn>
                    </div>
                </form>
            </Modal>
        </Layout>
    );
}
