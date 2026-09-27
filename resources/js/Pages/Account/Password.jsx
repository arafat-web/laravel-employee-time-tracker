import React from 'react';
import { useForm } from '@inertiajs/react';
import { KeyRound } from 'lucide-react';
import Layout, { Card, CardTitle, Btn, Field, inputCls } from '../../Components/ui';
import PageTitle from '../../Components/PageTitle';

export default function Password() {
    const form = useForm({ current_password: '', password: '', password_confirmation: '' });
    return (
        <Layout title="Change Password" sub="Use a strong password">
            <PageTitle title="Change Password" />
            <Card className="max-w-md">
                <CardTitle icon={KeyRound} title="Password" />
                <form onSubmit={(e) => { e.preventDefault(); form.post('/password', { onSuccess: () => form.reset() }); }} className="space-y-3">
                    <Field label="Current password">
                        <input type="password" className={inputCls} value={form.data.current_password} onChange={(e) => form.setData('current_password', e.target.value)} />
                    </Field>
                    <Field label="New password">
                        <input type="password" className={inputCls} value={form.data.password} onChange={(e) => form.setData('password', e.target.value)} />
                    </Field>
                    <Field label="Confirm new password">
                        <input type="password" className={inputCls} value={form.data.password_confirmation} onChange={(e) => form.setData('password_confirmation', e.target.value)} />
                    </Field>
                    {Object.values(form.errors).map((er, i) => <p key={i} className="text-sm font-medium text-red-600">{er}</p>)}
                    <Btn className="w-full" disabled={form.processing}>Change password</Btn>
                </form>
            </Card>
        </Layout>
    );
}
