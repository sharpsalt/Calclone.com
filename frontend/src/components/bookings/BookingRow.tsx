import { format, parseISO } from 'date-fns';
import { Clock, MoreHorizontal, Video, Globe } from 'lucide-react';
import type { Booking } from '../../types';
import { Badge } from '../ui/Badge';

export function BookingRow({
    eventTitle,
    date,
    startTime,
    endTime,
    bookerName,
    duration,
    status,
}: Booking) {
    const parsedDate = parseISO(date);

    return (
        <div className="group flex flex-col gap-5 px-6 py-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="grid min-w-0 flex-1 gap-4 md:grid-cols-[170px_minmax(0,1fr)]">
                <div className="space-y-1 text-cal-text-primary">
                    <div className="text-[1.05rem] font-medium">{format(parsedDate, 'EEE, d MMM')}</div>
                    <div className="text-cal-text-muted">{startTime} - {endTime}</div>
                    <div className="flex items-center gap-2 text-sm text-[#60a5fa]">
                        <Video size={14} />
                        Join Cal Video
                    </div>
                    {status === 'rescheduled' && (
                        <Badge variant="warning" className="mt-2">
                            Rescheduled
                        </Badge>
                    )}
                </div>

                <div className="space-y-2">
                    <div className="text-xl font-semibold tracking-tight text-cal-text-primary">{eventTitle}</div>
                    <div className="text-[1.02rem] text-cal-text-default">You and {bookerName}</div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-cal-text-muted">
                        <span className="inline-flex items-center gap-1.5">
                            <Clock size={14} />
                            {duration} min
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                            <Globe size={14} />
                            Local time
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-cal-border pt-4 lg:border-0 lg:pt-0">
                {status === 'upcoming' && <Badge variant="success">Upcoming</Badge>}
                {status === 'past' && <Badge>Past</Badge>}
                {status === 'cancelled' && <Badge variant="warning">Cancelled</Badge>}
                <button
                    type="button"
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-cal-border text-cal-text-muted transition-colors hover:bg-white/5 hover:text-cal-text-primary"
                >
                    <MoreHorizontal size={16} />
                </button>
            </div>
        </div>
    );
}
