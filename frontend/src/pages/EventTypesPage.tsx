import { Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { useEventTypeStore } from '../stores/eventTypeStore';
import { EventTypeCard } from '../components/event-types/EventTypeCard';
import { Button } from '../components/ui/Button';
import { Shell } from '../components/layout/Shell';
import { PageHeader } from '../components/layout/PageHeader';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Dialog } from '../components/ui/Dialog';
import { Textarea } from '../components/ui/Textarea';

export function EventTypesPage() {
    const { eventTypes, addEventType } = useEventTypeStore();
    const [query, setQuery] = useState('');
    const [showNew, setShowNew] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newSlug, setNewSlug] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [newDuration, setNewDuration] = useState(30);
    const [createError, setCreateError] = useState<string | null>(null);

    const filtered = eventTypes.filter((et) => et.title.toLowerCase().includes(query.toLowerCase()) || et.slug.toLowerCase().includes(query.toLowerCase()));

    return (
        <Shell>
            <PageHeader
                title="Event types"
                subtitle="Configure different events for people to book on your calendar."
                actions={
                    <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                        <div className="relative min-w-[250px]">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cal-text-dimmed" />
                            <Input placeholder="Search" className="h-10 pl-9" value={query} onChange={(e) => setQuery(e.target.value)} />
                        </div>
                        <Button icon={<Plus size={16} />} size="lg" onClick={() => setShowNew(true)}>
                            New
                        </Button>
                    </div>
                }
            />

            {filtered.length === 0 ? (
                <Card className="border-dashed py-20 text-center">
                    <h3 className="mb-2 text-lg font-semibold text-cal-text-primary">No event types</h3>
                    <p className="text-sm text-cal-text-muted">Create your first event type to start booking meetings.</p>
                </Card>
            ) : (
                <Card noPadding className="overflow-hidden">
                    {filtered.map((eventType, idx) => (
                        <div key={eventType.id} className={idx !== 0 ? 'border-t border-cal-border' : undefined}>
                            <EventTypeCard {...eventType} index={idx} totalCount={filtered.length} />
                        </div>
                    ))}
                </Card>
            )}

            <Dialog open={showNew} onClose={() => { setShowNew(false); setCreateError(null); }} title="Add a new event type">
                <div className="space-y-4">
                    <div>
                        <label className="text-sm text-cal-text-muted">Title</label>
                        <Input value={newTitle} onChange={(e) => { setNewTitle(e.target.value); setCreateError(null); }} placeholder="Quick chat" />
                    </div>

                    <div>
                        <label className="text-sm text-cal-text-muted">URL</label>
                        <div className="mt-1 flex items-center">
                            <div className="select-none px-3 py-2 rounded-l-md bg-cal-bg-subtle text-cal-text-muted">https://cal.com/</div>
                            <Input value={newSlug} onChange={(e) => { setNewSlug(e.target.value); setCreateError(null); }} placeholder={`${(window.location.hostname || 'cal.com')}/${''}`} />
                        </div>
                    </div>

                    <div>
                        <label className="text-sm text-cal-text-muted">Description</label>
                        <Textarea value={newDescription} onChange={(e) => setNewDescription(e.target.value)} />
                    </div>

                    <div>
                        <label className="text-sm text-cal-text-muted">Duration</label>
                        <div className="mt-1 flex items-center gap-2">
                            <Input type="number" value={newDuration} onChange={(e) => setNewDuration(Number(e.target.value))} className="w-28" />
                            <div className="text-sm text-cal-text-muted">minutes</div>
                        </div>
                    </div>

                    {createError && <div className="text-sm text-red-400">{createError}</div>}

                    <div className="flex justify-end gap-2">
                        <button onClick={() => { setShowNew(false); setCreateError(null); }} className="text-sm text-cal-text-muted">Close</button>
                        <button
                            onClick={async () => {
                                const title = newTitle.trim();
                                if (!title) return setCreateError('Title is required');
                                const slug = (newSlug.trim() || title).toLowerCase().replace(/\s+/g, '-');

                                // client-side duplicate check against existing event types
                                const duplicate = eventTypes.some((et) => et.slug === slug || et.title.toLowerCase() === title.toLowerCase());
                                if (duplicate) {
                                    setCreateError('An event type with this name or URL already exists');
                                    return;
                                }

                                try {
                                    await addEventType({ title, slug, description: newDescription, duration: newDuration, isActive: true });
                                    setShowNew(false);
                                    setNewTitle('');
                                    setNewSlug('');
                                    setNewDescription('');
                                    setCreateError(null);
                                } catch (err) {
                                    setCreateError('Failed to create event type');
                                }
                            }}
                            className="rounded-md bg-cal-bg-emphasis px-3 py-2 text-sm text-white"
                        >
                            Continue
                        </button>
                    </div>
                </div>
            </Dialog>
        </Shell>
    );
}
