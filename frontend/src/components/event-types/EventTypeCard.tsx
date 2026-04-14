import { Link } from 'react-router-dom';
import { Clock, Copy, Ellipsis, ExternalLink } from 'lucide-react';
import { useEventTypeStore } from '../../stores/eventTypeStore';
import { defaultUser } from '../../data/seed';
import { Switch } from '../ui/Switch';

interface EventTypeCardProps {
    id: string;
    title: string;
    slug: string;
    duration: number;
    isActive: boolean;
}

export function EventTypeCard({
    id,
    title,
    slug,
    duration,
    isActive,
}: EventTypeCardProps) {
    const { updateEventType } = useEventTypeStore();
    const publicLink = `/${defaultUser.username}/${slug}`;

    return (
        <div className="group flex flex-col gap-5 px-6 py-5 md:flex-row md:items-center md:justify-between md:px-6">
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-[1.35rem] font-semibold tracking-tight text-cal-text-primary">{title}</h3>
                    <Link
                        to={publicLink}
                        target="_blank"
                        className="truncate text-sm text-cal-text-muted transition-colors hover:text-cal-text-primary"
                    >
                        {defaultUser.username}/{slug}
                    </Link>
                </div>
                <div className="mt-2 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-white/7 px-2 py-1 text-xs font-semibold text-cal-text-default">
                        <Clock size={12} />
                        {duration}m
                    </span>
                    {!isActive && (
                        <span className="rounded-full border border-cal-border bg-white/4 px-2.5 py-1 text-xs font-semibold text-cal-text-muted">
                            Hidden
                        </span>
                    )}
                </div>
            </div>

            <div className="flex items-center justify-between gap-3 md:justify-end">
                <Switch
                    checked={isActive}
                    onChange={(checked) => updateEventType(id, { isActive: checked })}
                />
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-cal-border text-cal-text-muted transition-colors hover:bg-white/5 hover:text-cal-text-primary"
                    >
                        <ExternalLink size={16} />
                    </button>
                    <button
                        type="button"
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-cal-border text-cal-text-muted transition-colors hover:bg-white/5 hover:text-cal-text-primary"
                    >
                        <Copy size={16} />
                    </button>
                    <button
                        type="button"
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-cal-border text-cal-text-muted transition-colors hover:bg-white/5 hover:text-cal-text-primary"
                    >
                        <Ellipsis size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}
