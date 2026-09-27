import React from 'react';
import { useForm } from '@inertiajs/react';
import { Settings as SettingsIcon } from 'lucide-react';
import Layout, { Card, CardTitle, Btn, Field, inputCls } from '../../Components/ui';
import PageTitle from '../../Components/PageTitle';

export default function SettingsPage({ settings }) {
    const form = useForm(settings);
    return (
        <Layout title="Settings" sub="Predefined late grace and break time">
            <PageTitle title="Settings" />
            <Card className="max-w-lg">
                <CardTitle icon={SettingsIcon} title="Global rules" sub="Used when shift has no override" />
                <form onSubmit={(e) => { e.preventDefault(); form.post('/settings'); }} className="space-y-3">
                    <Field label="Company name"><input className={inputCls} value={form.data.company_name} onChange={(e) => form.setData('company_name', e.target.value)} /></Field>
                    <div className="grid grid-cols-2 gap-2">
                        <Field label="Late grace (min)"><input type="number" className={inputCls} value={form.data.late_threshold_minutes} onChange={(e) => form.setData('late_threshold_minutes', e.target.value)} /></Field>
                        <Field label="Break allowed (min)"><input type="number" className={inputCls} value={form.data.break_minutes} onChange={(e) => form.setData('break_minutes', e.target.value)} /></Field>
                    </div>
                    <p className="pt-1 text-xs font-bold uppercase tracking-wide text-slate-400">Yearly leave allowance (days)</p>
                    <div className="grid grid-cols-3 gap-2">
                        <Field label="Sick"><input type="number" className={inputCls} value={form.data.leave_allow_sick} onChange={(e) => form.setData('leave_allow_sick', e.target.value)} /></Field>
                        <Field label="Casual"><input type="number" className={inputCls} value={form.data.leave_allow_casual} onChange={(e) => form.setData('leave_allow_casual', e.target.value)} /></Field>
                        <Field label="Annual"><input type="number" className={inputCls} value={form.data.leave_allow_annual} onChange={(e) => form.setData('leave_allow_annual', e.target.value)} /></Field>
                    </div>
                    <Btn className="w-full">Save</Btn>
                </form>
            </Card>
        </Layout>
    );
}
