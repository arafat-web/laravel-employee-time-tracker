import React from 'react';
import { router } from '@inertiajs/react';
import { Bell, CheckCheck, Wallet, AlarmClock, CalendarDays, Megaphone, Info } from 'lucide-react';
import Layout, { Card, Btn, fmtDateTime, cn } from '../../Components/ui';
import PageTitle from '../../Components/PageTitle';

const KIND_ICON = {
    salary: Wallet, late: AlarmClock, leave: CalendarDays, announcement: Megaphone, general: Info,
};
const KIND_STYLE = {
    salary: 'bg-emerald-600', late: 'bg-amber-500', leave: 'bg-sky-600', announcement: 'bg-violet-600', general: 'bg-slate-900',
};

export default function Mine({ notices }) {
    const unread = notices.filter((n) => !n.is_read);
    return (
        <Layout title="Notices" sub={`${unread.length} unread`}>
            <PageTitle title="My Notices" />
            {notices.length > 0 && unread.length > 0 && (
                <div className="mb-3 flex justify-end">
                    <Btn variant="ghost" onClick={() => router.post('/my-notices/read-all')}>
                        <CheckCheck size={15} /> Mark all read
                    </Btn>
                </div>
            )}
            <div className="space-y-2">
                {notices.map((n) => {
                    const Icon = KIND_ICON[n.kind] || Info;
                    return (
                        <Card key={n.id} className={cn(!n.is_read && '!border-slate-900')}>
                            <div className="flex items-start gap-3">
                                <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white', KIND_STYLE[n.kind] || KIND_STYLE.general)}>
                                    <Icon size={17} />
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-900">
                                        {n.title}
                                        {!n.is_read && <span className="h-2 w-2 rounded-full bg-red-500" />}
                                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500">{n.kind}</span>
                                    </p>
                                    <p className="mt-0.5 whitespace-pre-line text-sm text-slate-600">{n.body}</p>
                                    <p className="mt-1 text-xs text-slate-400">{fmtDateTime(n.created_at)} · by {n.creator?.name || 'system'}</p>
                                </div>
                                {!n.is_read && (
                                    <Btn variant="ghost" onClick={() => router.post(`/my-notices/${n.id}/read`)}>Mark read</Btn>
                                )}
                            </div>
                        </Card>
                    );
                })}
                {notices.length === 0 && (
                    <Card>
                        <div className="flex flex-col items-center gap-2 py-6 text-slate-400">
                            <Bell size={28} />
                            <p className="text-sm">No notices yet.</p>
                        </div>
                    </Card>
                )}
            </div>
        </Layout>
    );
}
