import { Shell } from '../components/layout/Shell';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Textarea } from '../components/ui/Textarea';
import { useUserStore } from '../stores/userStore';
import { useEffect, useRef, useState } from 'react';
import { fetchCurrentUser, updateUserById, uploadAvatar, deleteAvatar, addEmail, removeEmail, setPrimaryEmail } from '../lib/api';

export function SettingsPage() {
    const user = useUserStore((s) => s.user);
    const updateUser = useUserStore((s) => s.updateUser);
    const [name, setName] = useState(user.name || '');
    const [timezone, setTimezone] = useState(user.timezone || 'UTC');
    const [about, setAbout] = useState((user as any).about || '');
    const [saving, setSaving] = useState(false);
    const [emails, setEmails] = useState<Array<any>>((user as any).emails || []);
    const fileRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        let mounted = true;
        fetchCurrentUser().then((u: any) => {
            if (!mounted || !u) return;
            // update local store and form fields; preserve existing client-only `about` when backend does not provide it
            updateUser({ ...(u || {}), ...(user?.about ? { about: user.about } : {}) });
            setName(u.name || '');
            setTimezone(u.timezone || 'UTC');
            setAbout(u.about || (user as any)?.about || '');
            setEmails(u.emails || []);
        }).catch(() => {});
        return () => { mounted = false; };
    }, []);

    function save() {
        const payload: any = { name, timezone };
        if (about) payload.about = about;
        setSaving(true);
        // call backend and update store
        if (!user?.id) {
            setSaving(false);
            return;
        }
        updateUserById(user.id as string, payload).then((res: any) => {
            // backend returns id/username/name/timezone; preserve local-only fields like `about`
            updateUser({ ...(res || {}), ...(about ? { about } : {}) });
        }).catch(() => {
        }).finally(() => setSaving(false));
    }

    const handleUploadClick = () => {
        fileRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f || !user?.id) return;
        try {
            const res: any = await uploadAvatar(user.id, f);
            updateUser({ avatar: res.avatar });
        } catch (err) {
            // ignore for now
        }
    };

    const handleRemoveAvatar = async () => {
        if (!user?.id) return;
        try {
            await deleteAvatar(user.id);
            updateUser({ avatar: undefined });
        } catch {}
    };

    const handleAddEmail = async () => {
        const input = window.prompt('Enter new email address');
        if (!input || !user?.id) return;
        try {
            const added = await addEmail(user.id, input);
            setEmails((s) => [added, ...s]);
        } catch (err) {
            // ignore for now
        }
    };

    const handleRemoveEmail = async (email: string) => {
        if (!user?.id) return;
        try {
            await removeEmail(user.id, email);
            setEmails((s) => s.filter((x) => x.email !== email));
        } catch {}
    };

    const handleMakePrimary = async (email: string) => {
        if (!user?.id) return;
        try {
            const rows = await setPrimaryEmail(user.id, email);
            setEmails(rows);
        } catch {}
    };

    return (
        <Shell>
            <PageHeader title="Profile" subtitle="Manage settings for your Cal.com profile" />

            <div className="space-y-6">
                <Card>
                    <div className="flex gap-6 items-start">
                        <div className="flex-shrink-0">
                            <div className="w-24 h-24 rounded-full bg-cal-bg-subtle flex items-center justify-center overflow-hidden">
                                {user.avatar ? (
                                    // use absolute URL from env
                                    <img src={`${(import.meta.env.VITE_API_URL || 'http://localhost:4000')}${user.avatar}`} alt="avatar" className="w-24 h-24 object-cover" />
                                ) : (
                                    <div className="w-24 h-24 flex items-center justify-center text-2xl text-cal-text-muted">{user.name ? user.name.split(' ').map((s) => s[0]).slice(0,2).join('') : 'U'}</div>
                                )}
                            </div>
                            <div className="mt-3 flex gap-2">
                                <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                                <Button size="sm" variant="secondary" onClick={handleUploadClick}>Upload avatar</Button>
                                <button className="text-sm text-cal-text-muted" onClick={handleRemoveAvatar}>Remove</button>
                            </div>
                        </div>

                        <div className="flex-1">
                            <div className="grid gap-4">
                                <div>
                                    <label className="text-sm text-cal-text-muted">Username</label>
                                    <div className="mt-1 flex items-center">
                                        <div className="select-none px-3 py-2 rounded-l-md bg-cal-bg-subtle text-cal-text-muted">cal.com/</div>
                                        <Input value={user.username} readOnly className="rounded-none" />
                                    </div>
                                    <p className="text-xs text-cal-text-muted mt-1">Tip: You can add a '+' between usernames (e.g. cal.com/anna+brian) to meet with multiple people</p>
                                </div>

                                <div>
                                    <label className="text-sm text-cal-text-muted">Full name</label>
                                    <Input value={name} onChange={(e) => setName(e.target.value)} />
                                </div>

                                <div>
                                    <label className="text-sm text-cal-text-muted">Email</label>
                                    <div className="mt-1 space-y-2">
                                        {(emails || []).length === 0 ? (
                                            <div className="flex items-center gap-3">
                                                <Input value={(user as any).email || ''} readOnly />
                                                <Button variant="ghost" size="sm" onClick={handleAddEmail}>+ Add email</Button>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {emails.map((e) => (
                                                    <div key={e.email} className="flex items-center gap-3">
                                                        <div className="flex-1">{e.email}</div>
                                                        {e.is_primary ? <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-cal-bg-subtle text-cal-text-muted">Primary</span> : <Button size="sm" variant="outline" onClick={() => handleMakePrimary(e.email)}>Make primary</Button>}
                                                        <Button size="sm" variant="ghost" onClick={() => handleRemoveEmail(e.email)}>Remove</Button>
                                                    </div>
                                                ))}
                                                <div>
                                                    <Button variant="ghost" size="sm" onClick={handleAddEmail}>+ Add email</Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm text-cal-text-muted">About</label>
                                    <Textarea value={about} onChange={(e) => setAbout(e.target.value)} />
                                </div>

                                <div>
                                    <label className="text-sm text-cal-text-muted">Connected accounts</label>
                                    <div className="mt-2 bg-cal-bg-subtle p-3 rounded-md flex items-center justify-between">
                                        <div>Google</div>
                                        <Button variant="destructive" size="sm">Disconnect</Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end mt-6">
                        <Button onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Update'}</Button>
                    </div>
                </Card>

                <Card>
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold text-cal-text-primary">It looks like you're on a work email</h3>
                            <p className="text-sm text-cal-text-muted mt-1">Organize events across your team and make sure every meeting lands with the right person.</p>
                            <div className="mt-3 flex gap-2">
                                <Button variant="outline" size="sm">+ Upgrade</Button>
                                <Button variant="ghost" size="sm">Dismiss</Button>
                            </div>
                        </div>
                        <div className="opacity-60 select-none">📧</div>
                    </div>
                </Card>

                <Card>
                    <div>
                        <h3 className="font-semibold text-cal-text-primary">Danger zone</h3>
                        <p className="text-sm text-cal-text-muted mt-2">Be careful. Account deletion cannot be undone.</p>
                        <div className="flex justify-end mt-4">
                            <Button variant="destructive">Delete account</Button>
                        </div>
                    </div>
                </Card>
            </div>
        </Shell>
    );
}
