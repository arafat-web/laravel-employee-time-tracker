import React, { useState } from 'react';
import { useForm, usePage } from '@inertiajs/react';
import {
    FolderOpen, Plus, StickyNote, FileText, Link2, Search,
    Download, Pencil, Trash2, Lock, Users, ExternalLink, Eye, EyeOff,
} from 'lucide-react';
import Layout, { Card, Btn, Field, inputCls, Modal, fmtDateTime, cn } from '../../Components/ui';
import PageTitle from '../../Components/PageTitle';

const TABS = [
    { id: 'all', label: 'All' },
    { id: 'notes', label: 'Notes' },
    { id: 'files', label: 'Files' },
    { id: 'links', label: 'Links' },
    { id: 'mine', label: 'Mine' },
];

function fmtSize(b) {
    if (!b) return '';
    if (b < 1024) return `${b} B`;
    if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / 1048576).toFixed(1)} MB`;
}

function linkParts(body) {
    const lines = String(body || '').split('\n');
    return { url: lines[0] || '', desc: lines.slice(1).join('\n').trim() };
}

export default function Vault({ items, q, tab, isAdmin }) {
    const { auth } = usePage().props;
    const me = auth?.user;
    const [kind, setKind] = useState('note'); // note|file|link
    const [modal, setModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [reveal, setReveal] = useState({}); // id -> show full note (for password-like notes)

    const noteForm = useForm({ title: '', body: '', visibility: 'shared' });
    const linkForm = useForm({ title: '', body: '', description: '', visibility: 'shared' });
    const fileForm = useForm({ title: '', description: '', visibility: 'shared', file: null });
    const editForm = useForm({ title: '', body: '', visibility: 'shared' });

    const openNew = (k) => {
        setKind(k);
        setEditing(null);
        noteForm.reset(); linkForm.reset(); fileForm.reset();
        noteForm.clearErrors(); linkForm.clearErrors(); fileForm.clearErrors();
        setModal(true);
    };

    const openEdit = (it) => {
        setEditing(it);
        setKind(it.type);
        editForm.setData({ title: it.title, body: it.type === 'link' ? linkParts(it.body).url : (it.body || ''), visibility: it.visibility });
        setModal(true);
    };

    const close = () => {
        setModal(false);
        setEditing(null);
    };

    const canEdit = (it) => it.user_id === me?.id || isAdmin;

    return (
        <Layout title="Files & Notes" sub="HR policies, spreadsheets, passwords, links — shared with all or kept private">
            <PageTitle title="Files & Notes" />
            <div className="mb-3 flex flex-wrap items-center gap-2">
                <form className="relative min-w-44 flex-1 sm:max-w-72">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        name="q" defaultValue={q} placeholder="Search title, text, filename…"
                        className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-slate-900"
                    />
                    <input type="hidden" name="tab" value={tab} />
                </form>
                <div className="ml-auto flex gap-2">
                    <Btn variant="ghost" onClick={() => openNew('note')}><StickyNote size={15} /> Note</Btn>
                    <Btn variant="ghost" onClick={() => openNew('link')}><Link2 size={15} /> Link</Btn>
                    <Btn onClick={() => openNew('file')}><Plus size={15} /> File</Btn>
                </div>
            </div>

            <div className="mb-3 flex flex-wrap gap-1 rounded-2xl border border-slate-200 bg-white p-1">
                {TABS.map((t) => (
                    <a
                        key={t.id}
                        href={`/vault?tab=${t.id}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
                        className={cn('rounded-xl px-4 py-1.5 text-sm font-semibold', tab === t.id ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100')}
                    >
                        {t.label}
                    </a>
                ))}
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {items.map((it) => {
                    const lp = it.type === 'link' ? linkParts(it.body) : null;
                    const shown = reveal[it.id];
                    const long = it.type === 'note' && (it.body || '').length > 220;
                    return (
                        <Card key={it.id} className="!p-4">
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex min-w-0 items-start gap-2.5">
                                    <span className={cn(
                                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white',
                                        it.type === 'file' ? 'bg-emerald-600' : it.type === 'link' ? 'bg-sky-600' : 'bg-amber-500'
                                    )}>
                                        {it.type === 'file' ? <FileText size={16} /> : it.type === 'link' ? <Link2 size={16} /> : <StickyNote size={16} />}
                                    </span>
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-slate-900">{it.title}</p>
                                        <p className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
                                            {it.owner?.name} · {fmtDateTime(it.created_at)}
                                            <span className={cn(
                                                'inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-bold',
                                                it.visibility === 'shared' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                                            )}>
                                                {it.visibility === 'shared' ? <Users size={10} /> : <Lock size={10} />}
                                                {it.visibility}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                                {canEdit(it) && (
                                    <div className="flex shrink-0 gap-1">
                                        {it.type !== 'file' && (
                                            <button onClick={() => openEdit(it)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" title="Edit">
                                                <Pencil size={14} />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => editForm.delete(`/vault/${it.id}`, { onSuccess: () => { } })}
                                            className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600" title="Delete"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {it.type === 'note' && (
                                <div className="mt-2">
                                    <p className="whitespace-pre-line text-sm text-slate-600">
                                        {long && !shown ? it.body.slice(0, 220) + '…' : it.body}
                                    </p>
                                    {long && (
                                        <button onClick={() => setReveal({ ...reveal, [it.id]: !shown })} className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900">
                                            {shown ? <><EyeOff size={12} /> Show less</> : <><Eye size={12} /> Show more</>}
                                        </button>
                                    )}
                                </div>
                            )}

                            {it.type === 'link' && (
                                <div className="mt-2">
                                    <a href={lp.url} target="_blank" rel="noreferrer" className="inline-flex max-w-full items-center gap-1.5 rounded-xl bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-700 hover:bg-sky-100">
                                        <ExternalLink size={14} /> <span className="truncate">{lp.url}</span>
                                    </a>
                                    {lp.desc && <p className="mt-1 whitespace-pre-line text-xs text-slate-500">{lp.desc}</p>}
                                </div>
                            )}

                            {it.type === 'file' && (
                                <div className="mt-2">
                                    {it.body && <p className="mb-2 text-xs text-slate-500">{it.body}</p>}
                                    <div className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2">
                                        <p className="min-w-0 truncate text-xs font-medium text-slate-600">
                                            {it.file_name} <span className="text-slate-400">· {fmtSize(it.size)}</span>
                                        </p>
                                        <a href={`/vault/${it.id}/download`} className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-700">
                                            <Download size={12} /> Get
                                        </a>
                                    </div>
                                </div>
                            )}
                        </Card>
                    );
                })}
                {items.length === 0 && (
                    <Card className="md:col-span-2 xl:col-span-3">
                        <div className="flex flex-col items-center gap-2 py-6 text-slate-400">
                            <FolderOpen size={28} />
                            <p className="text-sm">Nothing here yet. Add a note, link or file.</p>
                        </div>
                    </Card>
                )}
            </div>

            <Modal open={modal} onClose={close} title={editing ? `Edit ${kind}` : kind === 'note' ? 'New note' : kind === 'link' ? 'Share link' : 'Upload file'} sub="Shared = everyone sees it · Private = only you (admin can still see for HR oversight)">
                {!editing && (
                    <div className="mb-3 grid grid-cols-3 gap-1 rounded-xl bg-slate-50 p-1">
                        {[['note', 'Note'], ['link', 'Link'], ['file', 'File']].map(([k, label]) => (
                            <button key={k} type="button" onClick={() => setKind(k)}
                                className={cn('rounded-lg px-3 py-2 text-sm font-semibold', kind === k ? 'bg-slate-900 text-white' : 'text-slate-500')}>
                                {label}
                            </button>
                        ))}
                    </div>
                )}

                {(kind === 'note' && !editing) && (
                    <form onSubmit={(e) => { e.preventDefault(); noteForm.post('/vault/note', { onSuccess: close }); }} className="space-y-3">
                        <Field label="Title"><input className={inputCls} value={noteForm.data.title} onChange={(e) => noteForm.setData('title', e.target.value)} placeholder="e.g. Wi-Fi password, HR policy note" /></Field>
                        <Field label="Note (passwords, text, anything)">
                            <textarea rows={5} className={inputCls} value={noteForm.data.body} onChange={(e) => noteForm.setData('body', e.target.value)} placeholder="Write here…" />
                        </Field>
                        <VisField value={noteForm.data.visibility} onChange={(v) => noteForm.setData('visibility', v)} />
                        <ModalBtns onCancel={close} busy={noteForm.processing} label="Save note" />
                    </form>
                )}

                {(kind === 'link' && !editing) && (
                    <form onSubmit={(e) => { e.preventDefault(); linkForm.post('/vault/link', { onSuccess: close }); }} className="space-y-3">
                        <Field label="Title"><input className={inputCls} value={linkForm.data.title} onChange={(e) => linkForm.setData('title', e.target.value)} placeholder="e.g. HR Policy Drive" /></Field>
                        <Field label="URL"><input className={inputCls} value={linkForm.data.body} onChange={(e) => linkForm.setData('body', e.target.value)} placeholder="https://…" /></Field>
                        <Field label="Description (optional)"><input className={inputCls} value={linkForm.data.description} onChange={(e) => linkForm.setData('description', e.target.value)} /></Field>
                        <VisField value={linkForm.data.visibility} onChange={(v) => linkForm.setData('visibility', v)} />
                        <ModalBtns onCancel={close} busy={linkForm.processing} label="Share link" />
                    </form>
                )}

                {(kind === 'file' && !editing) && (
                    <form onSubmit={(e) => { e.preventDefault(); fileForm.post('/vault/file', { onSuccess: close, forceFormData: true }); }} className="space-y-3">
                        <Field label="Title"><input className={inputCls} value={fileForm.data.title} onChange={(e) => fileForm.setData('title', e.target.value)} placeholder="e.g. HRM Policy 2026" /></Field>
                        <Field label="File (pdf, excel, word, image, zip — max 20MB)">
                            <input type="file" className={inputCls} onChange={(e) => fileForm.setData('file', e.target.files[0])} />
                        </Field>
                        <Field label="Description (optional)"><input className={inputCls} value={fileForm.data.description} onChange={(e) => fileForm.setData('description', e.target.value)} /></Field>
                        <VisField value={fileForm.data.visibility} onChange={(v) => fileForm.setData('visibility', v)} />
                        {fileForm.errors?.file && <p className="text-sm font-medium text-red-600">{fileForm.errors.file}</p>}
                        <ModalBtns onCancel={close} busy={fileForm.processing} label="Upload" />
                    </form>
                )}

                {editing && (
                    <form onSubmit={(e) => { e.preventDefault(); editForm.put(`/vault/${editing.id}`, { onSuccess: close }); }} className="space-y-3">
                        <Field label="Title"><input className={inputCls} value={editForm.data.title} onChange={(e) => editForm.setData('title', e.target.value)} /></Field>
                        <Field label={editing.type === 'link' ? 'URL' : 'Text'}>
                            {editing.type === 'link'
                                ? <input className={inputCls} value={editForm.data.body} onChange={(e) => editForm.setData('body', e.target.value)} />
                                : <textarea rows={5} className={inputCls} value={editForm.data.body} onChange={(e) => editForm.setData('body', e.target.value)} />}
                        </Field>
                        <VisField value={editForm.data.visibility} onChange={(v) => editForm.setData('visibility', v)} />
                        <ModalBtns onCancel={close} busy={editForm.processing} label="Update" />
                    </form>
                )}
            </Modal>
        </Layout>
    );
}

function VisField({ value, onChange }) {
    return (
        <Field label="Who can see it?">
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-50 p-1">
                {[['shared', 'Everyone'], ['private', 'Only me']].map(([v, label]) => (
                    <button key={v} type="button" onClick={() => onChange(v)}
                        className={cn('rounded-lg px-3 py-2 text-sm font-semibold', value === v ? 'bg-slate-900 text-white' : 'text-slate-500')}>
                        {label}
                    </button>
                ))}
            </div>
        </Field>
    );
}

function ModalBtns({ onCancel, busy, label }) {
    return (
        <div className="flex gap-2 pt-1">
            <Btn type="button" variant="ghost" className="flex-1" onClick={onCancel}>Cancel</Btn>
            <Btn className="flex-1" disabled={busy}>{label}</Btn>
        </div>
    );
}
