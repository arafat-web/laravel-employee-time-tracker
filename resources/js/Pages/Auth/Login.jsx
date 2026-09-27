import React from 'react';
import { useForm, usePage } from '@inertiajs/react';
import { Clock } from 'lucide-react';
import { Card, Btn, Field, inputCls } from '../../Components/ui';

export default function Login() {
    const { errors } = usePage().props;
    const { data, setData, post, processing } = useForm({ email: '', password: '', remember: false });

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
            <PageTitle title="Sign in" />
            <Card className="w-full max-w-sm">
                <div className="mb-5 flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
                        <Clock size={20} />
                    </span>
                    <div>
                        <h1 className="text-lg font-bold">Time Tracker</h1>
                        <p className="text-xs text-slate-500">Sign in to continue</p>
                    </div>
                </div>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        post('/login');
                    }}
                    className="space-y-3"
                >
                    <Field label="Email">
                        <input className={inputCls} type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} placeholder="admin@timetracker.local" />
                    </Field>
                    <Field label="Password">
                        <input className={inputCls} type="password" value={data.password} onChange={(e) => setData('password', e.target.value)} placeholder="••••••••" />
                    </Field>
                    {errors?.email && <p className="text-sm font-medium text-red-600">{errors.email}</p>}
                    <Btn className="w-full" disabled={processing}>Sign in</Btn>
                    <p className="text-center text-xs text-slate-400">Default admin: admin@timetracker.local / password</p>
                </form>
            </Card>
        </div>
    );
}
