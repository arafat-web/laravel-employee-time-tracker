import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Plus, Trash2 } from 'lucide-react';
import Layout, { Card, Btn, Field, inputCls, Modal, fmtDate } from '../../Components/ui';
import PageTitle from '../../Components/PageTitle';

export default function SalIndex({ month, rows, employees }) {
    const [modal, setModal] = useState(false);
    const form = useForm({ user_id: '', month, base_amount: '', allowances: 0, deductions: 0, bonus: 0, notes: '', is_paid: false });

    const openNew = () => {
        form.reset();
        form.clearErrors();
        setModal(true);
    };

    const close = () => {
        setModal(false);
        form.reset();
        form.clearErrors();
    };

    return (
        <Layout title="Salary Input" sub={`Month: ${fmtDate(month)}`}>
            <PageTitle title="Salary" />
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <form className="flex gap-2">
                    <input type="month" name="month" defaultValue={month.slice(0, 7)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
                    <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Filter</button>
                </form>
                <Btn onClick={openNew}><Plus size={15} /> Add salary</Btn>
            </div>

            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] text-sm">
                        <thead>
                            <tr className="text-left text-xs uppercase text-slate-400">
                                <th className="py-2">Employee</th>
                                <th>Base</th>
                                <th>Extras</th>
                                <th>Net</th>
                                <th>Status</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((r) => (
                                <tr key={r.id} className="border-t border-slate-100">
                                    <td className="py-3 font-semibold text-slate-900">{r.user?.name}</td>
                                    <td className="text-slate-600">{r.base_amount}</td>
                                    <td className="text-xs text-slate-500">+{r.allowances} +{r.bonus} −{r.deductions}</td>
                                    <td className="font-bold text-slate-900">{r.net_amount}</td>
                                    <td><span className={`rounded-full px-2 py-1 text-xs font-semibold ${r.is_paid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{r.is_paid ? 'Paid' : 'Unpaid'}</span></td>
                                    <td>
                                        <div className="flex justify-end">
                                            <Btn variant="ghost" onClick={() => { if (confirm('Delete this salary?')) form.delete(`/salaries/${r.id}`); }}><Trash2 size={14} /> Delete</Btn>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {rows.length === 0 && <p className="py-6 text-center text-sm text-slate-400">No salaries this month.</p>}
                </div>
            </Card>

            <Modal open={modal} onClose={close} title="Add / update salary" sub={`Month: ${month}`}>
                <form onSubmit={(e) => { e.preventDefault(); form.post('/salaries', { onSuccess: close }); }} className="space-y-3">
                    <Field label="Employee">
                        <select className={inputCls} value={form.data.user_id} onChange={(e) => {
                            form.setData('user_id', e.target.value);
                            const emp = employees.find((x) => String(x.id) === e.target.value);
                            if (emp) form.setData('base_amount', emp.base_salary || '');
                        }}>
                            <option value="">Select</option>
                            {employees.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                    </Field>
                    <div className="grid grid-cols-2 gap-2">
                        <Field label="Base"><input type="number" step="0.01" className={inputCls} value={form.data.base_amount} onChange={(e) => form.setData('base_amount', e.target.value)} /></Field>
                        <Field label="Allowances"><input type="number" step="0.01" className={inputCls} value={form.data.allowances} onChange={(e) => form.setData('allowances', e.target.value)} /></Field>
                        <Field label="Deductions"><input type="number" step="0.01" className={inputCls} value={form.data.deductions} onChange={(e) => form.setData('deductions', e.target.value)} /></Field>
                        <Field label="Bonus"><input type="number" step="0.01" className={inputCls} value={form.data.bonus} onChange={(e) => form.setData('bonus', e.target.value)} /></Field>
                    </div>
                    <Field label="Notes"><input className={inputCls} value={form.data.notes} onChange={(e) => form.setData('notes', e.target.value)} /></Field>
                    <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={form.data.is_paid} onChange={(e) => form.setData('is_paid', e.target.checked)} /> Paid</label>
                    <div className="flex gap-2 pt-1">
                        <Btn type="button" variant="ghost" className="flex-1" onClick={close}>Cancel</Btn>
                        <Btn className="flex-1" disabled={form.processing}>Save salary</Btn>
                    </div>
                </form>
            </Modal>
        </Layout>
    );
}
