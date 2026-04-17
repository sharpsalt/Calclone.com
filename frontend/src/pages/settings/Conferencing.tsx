import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { fetchCurrentUser, updateUserById } from '../../lib/api';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export function Conferencing() {
    const [defaultProvider, setDefaultProvider] = useState('cal');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchCurrentUser().then((u: any) => {
            if (!u) return;
            if (u.conferencing_provider) setDefaultProvider(u.conferencing_provider);
        }).catch(() => {});
    }, []);

    async function saveDefault() {
        setSaving(true);
        try {
            const u: any = await fetchCurrentUser();
            if (!u?.id) return;
            await updateUserById(u.id, { conferencing_provider: defaultProvider });
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    }

    function handleConnectZoom() {
        const url = `${API_BASE}/api/integrations/zoom/authorize`;
        window.open(url, '_blank');
    }

    function handleConnectGoogleMeet() {
        const url = `${API_BASE}/api/integrations/google-meet/authorize`;
        window.open(url, '_blank');
    }

    return (
        <div className="space-y-6">
            <PageHeader title="Conferencing" subtitle="Add your favourite video conferencing apps for your meetings" />

            <Card>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-md bg-cal-bg-subtle flex items-center justify-center">🎥</div>
                        <div>
                            <div className="font-semibold">Cal Video {defaultProvider === 'cal' && <span className="ml-2 text-xs rounded-md bg-cal-bg-subtle px-2 py-1">Default</span>}</div>
                            <div className="text-sm text-cal-text-muted">Cal Video is the in-house web-based video conferencing platform powered by Daily.co</div>
                        </div>
                    </div>
                    <div>
                        <Button variant="ghost" size="sm"><ChevronRight /></Button>
                    </div>
                </div>

                <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <div className="font-medium">Zoom</div>
                        <div className="text-sm text-cal-text-muted">Connect Zoom to create meetings automatically.</div>
                        <div className="mt-2">
                            <Button size="sm" variant="outline" onClick={handleConnectZoom}>Connect Zoom</Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="font-medium">Google Meet</div>
                        <div className="text-sm text-cal-text-muted">Use Google Meet links for events.</div>
                        <div className="mt-2">
                            <Button size="sm" variant="outline" onClick={handleConnectGoogleMeet}>Connect Google Meet</Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="font-medium">Default provider</div>
                        <div className="text-sm text-cal-text-muted">Choose which provider is used by default when creating events.</div>
                        <div className="mt-2 flex items-center gap-2">
                            <label className="inline-flex items-center gap-2">
                                <input type="radio" name="provider" value="cal" checked={defaultProvider === 'cal'} onChange={() => setDefaultProvider('cal')} />
                                <span>Cal Video</span>
                            </label>
                            <label className="inline-flex items-center gap-2">
                                <input type="radio" name="provider" value="zoom" checked={defaultProvider === 'zoom'} onChange={() => setDefaultProvider('zoom')} />
                                <span>Zoom</span>
                            </label>
                        </div>
                        <div className="mt-3">
                            <Button size="sm" onClick={saveDefault} disabled={saving}>{saving ? 'Saving...' : 'Save default'}</Button>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}

export default Conferencing;
