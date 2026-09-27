import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Plus, Pencil, Trash2, Palmtree } from 'lucide-react';
import Layout, { Card, CardTitle, Btn, Field, inputCls, Modal, fmtDate } from '../../Components/ui';
import PageTitle from '../../Components/PageTitle';

const blank = { name: '', date: '', is_recurring: false };

export default function Holidays({ holidays }) {
    const [modal, setModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const form = useForm(blank);

    const openNew = () => {
        setEditing(null);
        form.setData(blank);
        setModal(true);
    };
    const openEdit = (h) => {
        setEditing(h.id);
        form.setData({ name: h.name, date: h.date?.slice(0, 10) || h.date, is_recurring: !!h.is_recurring });
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
        if (editing) form.put(`/holidays/${editing}`, { onSuccess: close });
        else form.post('/holidays', { onSuccess: close });
    };

    return (
        <Layout title="Holidays" sub="Holidays are excluded from absents and performance working days">
            <PageTitle title="Holidays" />
            <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-sm text-slate-500">{holidays.length} holidays</p>
                <Btn onClick={openNew}><Plus size={15} /> Add holiday</Btn>
            </div>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {holidays.map((h) => (
                    <Card key={h.id}>
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-3">
                                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-white"><Palmtree size={18} /></span>
                                <div>
                                    <p className="text-sm font-semibold">{h.name}</p>
                                    <p className="text-xs text-slate-500">{fmtDate(h.date)}{h.is_recurring ? ' · repeats yearly' : ''}</p>
                                </div>
                            </div>
                            <div className="flex gap-1">
                                <Btn variant="ghost" onClick={() => openEdit(h)}><Pencil size={14} /></Btn>
                                <Btn variant="ghost" onClick={() => { if (confirm('Delete?')) form.delete(`/holidays/${h.id}`); }}><Trash2 size={14} /></Btn>
                            </div>
                        </div>
                    </Card>
                ))}
                {holidays.length === 0 && <Card><p className="text-center text-sm text-slate-400">No holidays yet.</p></Card>}
            </div>
            <Modal open={modal} onClose={close} title={editing ? 'Edit holiday' : 'Add holiday'}>
                <form onSubmit={submit} className="space-y-3">
                    <Field label="Name"><input className={inputCls} value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} placeholder="Eid ul-Fitr" /></Field>
                    <Field label="Date"><input type="date" className={inputCls} value={form.data.date} onChange={(e) => form.setData('date', e.target.value)} /></Field>
                    <label className="flex items-center gap-2 text-sm text-slate-600">
                        <input type="checkbox" checked={form.data.is_recurring} onChange={(e) => form.setData('is_recurring', e.target.checked)} /> Repeats every year
                    </label>
                    <div className="flex gap-2 pt-1">
                        <Btn type="button" variant="ghost" className="flex-1" onClick={close}>Cancel</Btn>
                        <Btn className="flex-1" disabled={form.processing}>{editing ? 'Update' : 'Add'}</Btn>
                    </div>
                </form>
            </Modal>
        </Layout>
    );
}
