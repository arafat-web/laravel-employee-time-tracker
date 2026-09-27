import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import Layout, { Card, Btn, Field, inputCls, Modal } from '../../Components/ui';
import PageTitle from '../../Components/PageTitle';

const empty = { name: '', email: '', password: '', employee_code: '', phone: '', address: '', shift_id: '', allowed_ips: '', base_salary: '', employment_status: 'active', joined_at: '' };

export default function EmpIndex({ employees, shifts }) {
    const [modal, setModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const form = useForm(empty);

    const openNew = () => {
        setEditing(null);
        form.setData(empty);
        setModal(true);
    };

    const openEdit = (e) => {
        setEditing(e.id);
        form.setData({ ...empty, ...e, shift_id: e.shift_id || '', password: '', allowed_ips: e.allowed_ips || '', joined_at: e.joined_at || '' });
        setModal(true);
    };

    const close = () => {
        setModal(false);
        setEditing(null);
        form.reset();
        form.clearErrors();
    };

    const submit = (ev) => {
        ev.preventDefault();
        if (editing) form.put(`/employees/${editing}`, { onSuccess: close });
        else form.post('/employees', { onSuccess: close });
    };

    return (
        <Layout title="Employees" sub={`${employees.length} staff · IP restriction per employee`}>
            <PageTitle title="Employees" />
            <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-sm text-slate-500">{employees.length} employees</p>
                <Btn onClick={openNew}><Plus size={15} /> Add employee</Btn>
            </div>

            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] text-sm">
                        <thead>
                            <tr className="text-left text-xs uppercase text-slate-400">
                                <th className="py-2">Employee</th>
                                <th>Shift</th>
                                <th>Allowed IPs</th>
                                <th>Status</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {employees.map((e) => (
                                <tr key={e.id} className="border-t border-slate-100">
                                    <td className="py-3">
                                        <div className="flex items-center gap-3">
                                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white">{e.name?.[0]}</span>
                                            <div>
                                                <p className="font-semibold text-slate-900">{e.name} <span className="text-xs font-normal text-slate-400">{e.employee_code}</span></p>
                                                <p className="text-xs text-slate-500">{e.email}{e.phone ? ` · ${e.phone}` : ''}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="text-slate-600">{e.shift?.name || '—'}</td>
                                    <td className="font-mono text-xs text-slate-500">{e.allowed_ips || 'any'}</td>
                                    <td><span className={`rounded-full px-2 py-1 text-xs font-semibold ${e.employment_status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>{e.employment_status}</span></td>
                                    <td>
                                        <div className="flex justify-end gap-2">
                                            <Btn variant="ghost" onClick={() => openEdit(e)}><Pencil size={14} /> Edit</Btn>
                                            <Btn variant="ghost" onClick={() => { if (confirm('Delete this employee?')) form.delete(`/employees/${e.id}`); }}><Trash2 size={14} /> Delete</Btn>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {employees.length === 0 && <p className="py-6 text-center text-sm text-slate-400">No employees yet. Click “Add employee”.</p>}
                </div>
            </Card>

            <Modal open={modal} onClose={close} title={editing ? 'Edit employee' : 'Add employee'} sub="Login access is IP-restricted for employees" wide>
                <form onSubmit={submit} className="space-y-3">
                    <Field label="Name"><input className={inputCls} value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} placeholder="Full name" /></Field>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <Field label="Email"><input className={inputCls} value={form.data.email} onChange={(e) => form.setData('email', e.target.value)} placeholder="name@company.com" /></Field>
                        <Field label="Password"><input type="password" className={inputCls} value={form.data.password} onChange={(e) => form.setData('password', e.target.value)} placeholder={editing ? '(keep current)' : 'Min 6 chars'} /></Field>
                    </div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <Field label="Code"><input className={inputCls} value={form.data.employee_code} onChange={(e) => form.setData('employee_code', e.target.value)} placeholder="EMP-001" /></Field>
                        <Field label="Phone"><input className={inputCls} value={form.data.phone} onChange={(e) => form.setData('phone', e.target.value)} /></Field>
                    </div>
                    <Field label="Shift">
                        <select className={inputCls} value={form.data.shift_id} onChange={(e) => form.setData('shift_id', e.target.value)}>
                            <option value="">No shift</option>
                            {shifts.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.start_time?.slice(0, 5)}–{s.end_time?.slice(0, 5)})</option>)}
                        </select>
                    </Field>
                    <Field label="Allowed IPs (comma separated, blank = any)">
                        <input className={inputCls} value={form.data.allowed_ips} onChange={(e) => form.setData('allowed_ips', e.target.value)} placeholder="192.168.1.10, 203.0.113.5" />
                    </Field>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                        <Field label="Base salary"><input type="number" step="0.01" className={inputCls} value={form.data.base_salary} onChange={(e) => form.setData('base_salary', e.target.value)} /></Field>
                        <Field label="Status">
                            <select className={inputCls} value={form.data.employment_status} onChange={(e) => form.setData('employment_status', e.target.value)}>
                                <option value="active">active</option>
                                <option value="inactive">inactive</option>
                            </select>
                        </Field>
                        <Field label="Joined"><input type="date" className={inputCls} value={form.data.joined_at} onChange={(e) => form.setData('joined_at', e.target.value)} /></Field>
                    </div>
                    <Field label="Address"><input className={inputCls} value={form.data.address} onChange={(e) => form.setData('address', e.target.value)} /></Field>
                    <div className="flex gap-2 pt-1">
                        <Btn type="button" variant="ghost" className="flex-1" onClick={close}>Cancel</Btn>
                        <Btn className="flex-1" disabled={form.processing}>{editing ? 'Update' : 'Create'}</Btn>
                    </div>
                </form>
            </Modal>
        </Layout>
    );
}
