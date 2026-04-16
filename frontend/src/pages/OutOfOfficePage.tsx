import { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Shell } from '../components/layout/Shell';
import { PageHeader } from '../components/layout/PageHeader';

export function OutOfOfficePage() {
    const [items, setItems] = useState<any[]>(() => {
        try { return JSON.parse(localStorage.getItem('ooList') || '[]'); } catch { return []; }
    });

    const addItem = () => {
        const id = Date.now().toString();
        const next = [...items, { id, title: 'New OOO', from: null, to: null }];
        setItems(next);
        try { localStorage.setItem('ooList', JSON.stringify(next)); } catch {}
    };

    return (
        <Shell>
            <PageHeader title="Out of office" subtitle="Let your bookers know when you're OOO." />

            <div className="mx-auto w-full max-w-[900px] px-4 py-8">
                <Card className="py-12 text-center">
                    {items.length === 0 ? (
                        <div className="space-y-6">
                            <div className="text-2xl font-semibold">Create an OOO</div>
                            <div className="text-sm text-cal-text-muted">Communicate to your bookers when you're not available to take bookings. They can still book you upon your return or you can forward them to a team member.</div>
                            <div className="flex justify-center">
                                <Button onClick={addItem} size="md" variant="accent">+ Add</Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {items.map((it) => (
                                <div key={it.id} className="rounded-md border p-4">
                                    <div className="font-medium">{it.title}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </div>
        </Shell>
    );
}

export default OutOfOfficePage;
