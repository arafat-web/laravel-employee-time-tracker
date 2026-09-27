import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Timer, Plus, Pencil, Trash2 } from 'lucide-react';
import Layout, { Card, Btn, Field, inputCls, Modal } from '../../Components/ui';
import PageTitle from '../../Components/PageTitle';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const blank = {
    name: '', start_time: '09:00', end_time: '18:00',
    working_days: [1, 2, 3, 4, 5], break_start: '13:00', break_end: '14:00',
    break_minutes: 60, grace_late_minutes: 10,
};

export default function ShiftIndex({ shifts }) {
    const [modal, setModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const form = useForm(blank);

    const openNew = () => {
        setEditing(null);
        form.setData(blank);
        setModal(true);
    };

    const openEdit = (s) => {
        setEditing(s.id);
        form.setData({
            name: s.name, start_time: s.start_time.slice(0, 5), end_time: s.end_time.slice(0, 5),
            working_days: s.working_days || [], break_start: s.break_start?.slice(0, 5) || '',
            break_end: s.break_end?.slice(0, 5) || '', break_minutes: s.break_minutes,
            grace_late_minutes: s.grace_late_minutes,
        });
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
        if (editing) form.put(`/shifts/${editing}`, { onSuccess: close });
        else form.post('/shifts', { onSuccess: close });
    };

    const toggleDay = (d) => {
        const cur = form.data.working_days || [];
        form.setData('working_days', cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d]);
    };

    return (
        <Layout title="Shifts" sub="Fixed shifts assigned per employee">
            <PageTitle title="Shifts" />
            <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-sm text-slate-500">{shifts.length} shifts</p>
                <Btn onClick={openNew}><Plus size={15} /> Add shift</Btn>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {shifts.map((s) => (
                    <Card key={s.id}>
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-3">
                                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
                                    <Timer size={18} />
                                </span>
                                <div>
                                    <p className="text-sm font-semibold text-slate-900">{s.name}</p>
                                    <p className="text-xs text-slate-500">{s.start_time?.slice(0, 5)} – {s.end_time?.slice(0, 5)} · {s.users_count} staff</p>
                                </div>
                            </div>
                        </div>
                        <p className="mt-3 text-xs text-slate-500">Break: {s.break_minutes} min · Grace: {s.grace_late_minutes} min</p>
                        <div className="mt-3 flex gap-2">
                            <Btn variant="ghost" onClick={() => openEdit(s)}><Pencil size={14} /> Edit</Btn>
                            <Btn variant="ghost" onClick={() => { if (confirm('Delete this shift?')) form.delete(`/shifts/${s.id}`); }}><Trash2 size={14} /> Delete</Btn>
                        </div>
                    </Card>
                ))}
                {shifts.length === 0 && (
                    <Card className="md:col-span-2 xl:col-span-3">
                        <p className="text-center text-sm text-slate-400">No shifts yet. Click “Add shift”.</p>
                    </Card>
                )}
            </div>

            <Modal open={modal} onClose={close} title={editing ? 'Edit shift' : 'Add shift'} sub="Shift times apply to assigned employees">
                <form onSubmit={submit} className="space-y-3">
                    <Field label="Name"><input className={inputCls} value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} placeholder="Day Shift" /></Field>
                    <div className="grid grid-cols-2 gap-2">
                        <Field label="Start"><input type="time" className={inputCls} value={form.data.start_time} onChange={(e) => form.setData('start_time', e.target.value)} /></Field>
                        <Field label="End"><input type="time" className={inputCls} value={form.data.end_time} onChange={(e) => form.setData('end_time', e.target.value)} /></Field>
                    </div>
                    <Field label="Working days">
                        <div className="flex flex-wrap gap-1">
                            {DAYS.map((d, i) => (
                                <button type="button" key={i} onClick={() => toggleDay(i)}
                                    className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold ${form.data.working_days?.includes(i) ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-500'}`}>
                                    {d}
                                </button>
                            ))}
                        </div>
                    </Field>
                    <div className="grid grid-cols-2 gap-2">
                        <Field label="Break start"><input type="time" className={inputCls} value={form.data.break_start} onChange={(e) => form.setData('break_start', e.target.value)} /></Field>
                        <Field label="Break end"><input type="time" className={inputCls} value={form.data.break_end} onChange={(e) => form.setData('break_end', e.target.value)} /></Field>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <Field label="Break min"><input type="number" className={inputCls} value={form.data.break_minutes} onChange={(e) => form.setData('break_minutes', e.target.value)} /></Field>
                        <Field label="Late grace min"><input type="number" className={inputCls} value={form.data.grace_late_minutes} onChange={(e) => form.setData('grace_late_minutes', e.target.value)} /></Field>
                    </div>
                    <div className="flex gap-2 pt-1">
                        <Btn type="button" variant="ghost" className="flex-1" onClick={close}>Cancel</Btn>
                        <Btn className="flex-1" disabled={form.processing}>{editing ? 'Update' : 'Create'}</Btn>
                    </div>
                </form>
            </Modal>
        </Layout>
    );
}
