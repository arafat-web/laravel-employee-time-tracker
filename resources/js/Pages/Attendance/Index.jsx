import React, { useState } from 'react';
import { Link, useForm } from '@inertiajs/react';
import { Clock, Pencil, Trash2, RotateCcw } from 'lucide-react';
import Layout, { Card, CardTitle, Btn, Field, inputCls, Modal, fmtDate, fmtTime, fmtDateTime } from '../../Components/ui';
import PageTitle from '../../Components/PageTitle';

function toLocalInput(v) {
    if (!v) return '';
    const d = new Date(typeof v === 'string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(v) ? v.replace(' ', 'T') : v);
    if (isNaN(d)) return '';
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export default function AttIndex({ date, rows }) {
    const [modal, setModal] = useState(false);
    const [row, setRow] = useState(null);
    const form = useForm({ clock_in: '', clock_out: '', status: '', note: '', clear_clock_in: false, clear_clock_out: false, breaks: [] });

    const openAdjust = (r) => {
        setRow(r);
        form.setData({
            clock_in: toLocalInput(r.clock_in),
            clock_out: toLocalInput(r.clock_out),
            status: r.status || 'present',
            note: r.note || '',
            clear_clock_in: false,
            clear_clock_out: false,
            breaks: (r.breaks || []).map((b) => ({
                id: b.id,
                break_start: toLocalInput(b.break_start),
                break_end: b.break_end ? toLocalInput(b.break_end) : '',
                delete: false,
            })),
        });
        form.clearErrors();
        setModal(true);
    };

    const close = () => {
        setModal(false);
        setRow(null);
        form.reset();
        form.clearErrors();
    };

    const setBreak = (id, key, val) => {
        form.setData('breaks', form.data.breaks.map((b) => (b.id === id ? { ...b, [key]: val } : b)));
    };

    const submit = (e) => {
        e.preventDefault();
        if (!row) return;
        form.patch(`/attendance/${row.id}`, { onSuccess: close });
    };

    return (
        <Layout title="Attendance" sub={`Records for ${fmtDate(date)} · click Adjust to fix accidental clock in/out`}>
            <PageTitle title="Attendance" />
            <Card>
                <CardTitle icon={Clock} title="Daily attendance" />
                <form className="mb-4 flex gap-2">
                    <input type="date" name="date" defaultValue={date} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                    <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Filter</button>
                </form>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[860px] text-sm">
                        <thead>
                            <tr className="text-left text-xs uppercase text-slate-400">
                                <th className="py-2">Employee</th><th>In</th><th>Out</th><th>Work</th><th>Break</th><th>Late</th><th>OT</th><th>Status</th><th>Note</th><th className="text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((r) => (
                                <tr key={r.id} className="border-t border-slate-100">
                                    <td className="py-2 font-medium">{r.user?.name}<span className="block font-mono text-[11px] font-normal text-slate-400">{r.clock_in_ip} → {r.clock_out_ip || '—'}</span></td>
                                    <td>{r.clock_in ? fmtTime(r.clock_in) : '—'}</td>
                                    <td>{r.clock_out ? fmtTime(r.clock_out) : '—'}</td>
                                    <td>{r.work_minutes}m</td>
                                    <td>{r.break_minutes}m</td>
                                    <td>{r.late_minutes}m</td>
                                    <td>{r.overtime_minutes}m</td>
                                    <td><span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold">{r.status}</span></td>
                                    <td className="max-w-[160px] truncate text-xs text-slate-400">{r.note || '—'}</td>
                                    <td>
                                        <div className="flex justify-end">
                                            <Btn variant="ghost" onClick={() => openAdjust(r)}><Pencil size={14} /> Adjust</Btn>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {rows.length === 0 && <p className="py-4 text-center text-sm text-slate-400">No records.</p>}
                </div>
            </Card>
            <p className="mt-3 text-sm"><Link href="/my-time" className="text-slate-600 underline">Employee clock page</Link></p>

            <Modal open={modal} onClose={close} title={`Adjust · ${row?.user?.name || ''}`} sub={`${fmtDate(row?.date)} · fixes accidental clock in/out · totals recalc automatically`} wide>
                <form onSubmit={submit} className="space-y-3">
                    <div className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
                        Accidental tap? Tick “Clear” to remove it, or pick the correct time. Late / early / overtime recalculate on save.
                    </div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <div>
                            <Field label="Clock in">
                                <input type="datetime-local" className={inputCls} value={form.data.clock_in} disabled={form.data.clear_clock_in} onChange={(e) => form.setData('clock_in', e.target.value)} />
                            </Field>
                            <label className="mt-1 flex items-center gap-2 text-xs font-semibold text-red-600">
                                <input type="checkbox" checked={form.data.clear_clock_in} onChange={(e) => form.setData('clear_clock_in', e.target.checked)} />
                                Clear clock in (accidental)
                            </label>
                            {row?.clock_in && <p className="mt-1 text-xs text-slate-400">Was: {fmtDateTime(row.clock_in, true)}</p>}
                        </div>
                        <div>
                            <Field label="Clock out">
                                <input type="datetime-local" className={inputCls} value={form.data.clock_out} disabled={form.data.clear_clock_out} onChange={(e) => form.setData('clock_out', e.target.value)} />
                            </Field>
                            <label className="mt-1 flex items-center gap-2 text-xs font-semibold text-red-600">
                                <input type="checkbox" checked={form.data.clear_clock_out} onChange={(e) => form.setData('clear_clock_out', e.target.checked)} />
                                Clear clock out (accidental)
                            </label>
                            {row?.clock_out && <p className="mt-1 text-xs text-slate-400">Was: {fmtDateTime(row.clock_out, true)}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <Field label="Status">
                            <select className={inputCls} value={form.data.status} onChange={(e) => form.setData('status', e.target.value)}>
                                {['present', 'late', 'half_day', 'absent', 'leave', 'weekend'].map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </Field>
                        <Field label="Note (reason for adjustment)">
                            <input className={inputCls} value={form.data.note} onChange={(e) => form.setData('note', e.target.value)} placeholder="e.g. accidental clock-in, corrected to 09:05" />
                        </Field>
                    </div>

                    {(form.data.breaks || []).length > 0 && (
                        <div>
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Breaks</p>
                            <div className="space-y-2">
                                {form.data.breaks.map((b) => (
                                    <div key={b.id} className={`grid grid-cols-1 gap-2 rounded-xl border p-2 sm:grid-cols-3 ${b.delete ? 'border-red-200 bg-red-50 opacity-60' : 'border-slate-100'}`}>
                                        <Field label="Start">
                                            <input type="datetime-local" className={inputCls} value={b.break_start} disabled={b.delete} onChange={(e) => setBreak(b.id, 'break_start', e.target.value)} />
                                        </Field>
                                        <Field label="End">
                                            <input type="datetime-local" className={inputCls} value={b.break_end} disabled={b.delete} onChange={(e) => setBreak(b.id, 'break_end', e.target.value)} />
                                        </Field>
                                        <div className="flex items-end">
                                            <Btn type="button" variant="ghost" className="w-full" onClick={() => setBreak(b.id, 'delete', !b.delete)}>
                                                <Trash2 size={14} /> {b.delete ? 'Undo' : 'Delete'}
                                            </Btn>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex gap-2 pt-1">
                        <Btn type="button" variant="ghost" className="flex-1" onClick={() => { form.setData({ clock_in: '', clock_out: '', status: 'absent', note: form.data.note, clear_clock_in: true, clear_clock_out: true, breaks: form.data.breaks.map((b) => ({ ...b, delete: true })) }); }}>
                            <RotateCcw size={14} /> Reset day
                        </Btn>
                        <Btn type="button" variant="ghost" className="flex-1" onClick={close}>Cancel</Btn>
                        <Btn className="flex-1" disabled={form.processing}>Save adjustment</Btn>
                    </div>
                </form>
            </Modal>
        </Layout>
    );
}
