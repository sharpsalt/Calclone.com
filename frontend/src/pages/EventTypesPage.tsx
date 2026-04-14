import { Plus, Search } from 'lucide-react';
import { useEventTypeStore } from '../stores/eventTypeStore';
import { EventTypeCard } from '../components/event-types/EventTypeCard';
import { Button } from '../components/ui/Button';
import { Shell } from '../components/layout/Shell';
import { PageHeader } from '../components/layout/PageHeader';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';

export function EventTypesPage() {
    const { eventTypes } = useEventTypeStore();

    return (
        <Shell>
            <PageHeader
                title="Event types"
                subtitle="Configure different events for people to book on your calendar."
                actions={
                    <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                        <div className="relative min-w-[250px]">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cal-text-dimmed" />
                            <Input placeholder="Search" className="h-10 pl-9" />
                        </div>
                        <Button icon={<Plus size={16} />} size="lg">
                            New
                        </Button>
                    </div>
                }
            />

            {eventTypes.length === 0 ? (
                <Card className="border-dashed py-20 text-center">
                    <h3 className="mb-2 text-lg font-semibold text-cal-text-primary">No event types</h3>
                    <p className="text-sm text-cal-text-muted">Create your first event type to start booking meetings.</p>
                </Card>
            ) : (
                <Card noPadding className="overflow-hidden">
                    {eventTypes.map((eventType, index) => (
                        <div key={eventType.id} className={index !== 0 ? 'border-t border-cal-border' : undefined}>
                            <EventTypeCard {...eventType} />
                        </div>
                    ))}
                </Card>
            )}
        </Shell>
    );
}
