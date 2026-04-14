import { useNavigate } from 'react-router-dom';
import { Clock } from 'lucide-react';
import type { EventType } from '../../types';
import { Badge } from '../ui/Badge';

interface ProfileEventListProps {
    eventTypes: EventType[];
    username: string;
}

export function ProfileEventList({ eventTypes, username }: ProfileEventListProps) {
    const navigate = useNavigate();

    return (
        <div className="cal-card overflow-hidden">
            {eventTypes.map((et, index) => (
                <button
                    key={et.id}
                    onClick={() => navigate(`/${username}/${et.slug}`)}
                    className={`w-full p-4 text-left hover:bg-cal-bg-subtle/50 transition-colors cursor-pointer ${index < eventTypes.length - 1 ? 'border-b border-cal-border' : ''
                        }`}
                >
                    <p className="text-[14px] font-medium text-cal-text-primary">{et.title}</p>
                    <div className="mt-1.5">
                        <Badge icon={<Clock size={12} />}>{et.duration}m</Badge>
                    </div>
                </button>
            ))}
        </div>
    );
}
