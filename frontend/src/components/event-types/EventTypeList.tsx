import type { EventType } from '../../types';
import { EventTypeCard } from './EventTypeCard';
import { Card } from '../ui/Card';
import { Calendar } from 'lucide-react';

interface EventTypeListProps {
    eventTypes: EventType[];
    onToggle: (id: string, isActive: boolean) => void;
    onEdit: (eventType: EventType) => void;
    onDelete: (id: string) => void;
}

export function EventTypeList({ eventTypes, onToggle, onEdit, onDelete }: EventTypeListProps) {
    void onToggle;
    void onEdit;
    void onDelete;

    if (eventTypes.length === 0) {
        return (
            <Card className="flex flex-col items-center justify-center py-12">
                <Calendar size={40} className="text-cal-text-dimmed mb-3" />
                <p className="text-cal-text-muted text-sm">No event types yet</p>
                <p className="text-cal-text-dimmed text-xs mt-1">
                    Create your first event type to get started.
                </p>
            </Card>
        );
    }

    return (
        <Card noPadding>
            {eventTypes.map((et, idx) => (
                <EventTypeCard key={et.id} {...et} index={idx} totalCount={eventTypes.length} />
            ))}
        </Card>
    );
}
