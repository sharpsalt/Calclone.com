import { useNavigate } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { useEventTypeStore } from '../stores/eventTypeStore';
import { defaultUser } from '../data/seed';
import { getInitials } from '../lib/utils';
import { Card } from '../components/ui/Card';

export function PublicProfilePage() {
    const navigate = useNavigate();
    const { eventTypes } = useEventTypeStore();
    const activeEvents = eventTypes.filter((eventType) => eventType.isActive);

    return (
        <div className="min-h-screen bg-cal-bg-base px-4 py-12 sm:px-6">
            <div className="mx-auto flex w-full max-w-[760px] flex-col gap-8">
                <Card className="px-6 py-7 sm:px-8">
                    <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                        <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 text-2xl font-bold text-white shadow-lg shadow-sky-900/20">
                            {getInitials(defaultUser.name)}
                        </div>
                        <div>
                            <h1 className="text-4xl font-semibold tracking-tight text-cal-text-primary">{defaultUser.name}</h1>
                        </div>
                    </div>
                </Card>

                {activeEvents.length === 0 ? (
                    <Card className="py-16 text-center">
                        <p className="text-cal-text-muted">No event types available at the moment.</p>
                    </Card>
                ) : (
                    <Card noPadding className="overflow-hidden">
                        {activeEvents.map((eventType, index) => (
                            <button
                                key={eventType.id}
                                onClick={() => navigate(`/${defaultUser.username}/${eventType.slug}`)}
                                className={`w-full px-6 py-6 text-left transition-colors hover:bg-white/[0.025] ${index !== 0 ? 'border-t border-cal-border' : ''}`}
                            >
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <div className="text-[1.75rem] font-semibold tracking-tight text-cal-text-primary">{eventType.title}</div>
                                        <div className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-white/7 px-2 py-1 text-xs font-semibold text-cal-text-default">
                                            <Clock size={12} />
                                            {eventType.duration}m
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </Card>
                )}
            </div>
        </div>
    );
}
