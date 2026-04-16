import { format, parse } from 'date-fns';
import { useEffect, useRef, useState } from 'react';
import {
    CalendarClock,
    Clock,
    Flag,
    Globe,
    MapPin,
    MoreHorizontal,
    Send,
    UserPlus,
    Video,
    XCircle,
} from 'lucide-react';
import type { Booking } from '../../types';
import { Badge } from '../ui/Badge';

function isValidDate(value: Date): boolean {
    return !Number.isNaN(value.getTime());
}

interface BookingRowProps extends Booking {
    onClickBooking?: (id: string) => void;
    onJoin?: (id: string) => void;
    onReschedule?: (id: string) => void;
    onRequestReschedule?: (id: string) => void;
    onEditLocation?: (id: string) => void;
    onAddGuests?: (id: string) => void;
    onMarkNoShow?: (id: string) => void;
    onReport?: (id: string) => void;
    onCancel?: (id: string) => void;
}

export function BookingRow({
    id,
    eventTitle,
    date,
    startTime,
    endTime,
    bookerName,
    location,
    duration,
    status,
    onClickBooking,
    onJoin,
    onReschedule,
    onRequestReschedule,
    onEditLocation,
    onAddGuests,
    onMarkNoShow,
    onReport,
    onCancel,
}: BookingRowProps) {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement | null>(null);

    const parsedDate = parse(String(date), 'yyyy-MM-dd', new Date());
    const parsedStart = parse(startTime, 'HH:mm', new Date());
    const parsedEnd = parse(endTime, 'HH:mm', new Date());

    const dateLabel = isValidDate(parsedDate) ? format(parsedDate, 'EEE, d MMM') : 'Unknown date';
    const startLabel = isValidDate(parsedStart) ? format(parsedStart, 'h:mma').toLowerCase() : (startTime || '--:--');
    const endLabel = isValidDate(parsedEnd) ? format(parsedEnd, 'h:mma').toLowerCase() : (endTime || '--:--');

    useEffect(() => {
        function onPointerDown(event: MouseEvent) {
            const target = event.target as Node;
            if (menuRef.current && !menuRef.current.contains(target)) {
                setMenuOpen(false);
            }
        }
        document.addEventListener('mousedown', onPointerDown);
        return () => document.removeEventListener('mousedown', onPointerDown);
    }, []);

    function runAction(action?: (id: string) => void) {
        if (!action) return;
        action(id);
        setMenuOpen(false);
    }

    return (
        <div
            className="group relative flex cursor-pointer flex-col gap-5 px-6 py-6 text-[#dbe2f0] transition-colors hover:bg-[#10131b] lg:flex-row lg:items-start lg:justify-between"
            onClick={() => onClickBooking?.(id)}
        >
            <div className="grid min-w-0 flex-1 gap-5 md:grid-cols-[190px_minmax(0,1fr)]">
                <div className="space-y-1">
                    <div className="text-[2.05rem] font-semibold tracking-tight text-[#eef2fb]">{dateLabel}</div>
                    <div className="text-[2rem] text-[#a7b2c8]">{startLabel} - {endLabel}</div>
                    <button
                        type="button"
                        onClick={(event) => {
                            event.stopPropagation();
                            onJoin?.(id);
                        }}
                        className="mt-2 inline-flex items-center gap-2 whitespace-nowrap text-[2rem] text-[#5aa7ff] hover:underline"
                    >
                        <Video size={14} />
                        Join Cal Video
                    </button>
                    {status === 'rescheduled' && (
                        <Badge variant="warning" className="mt-2">
                            Rescheduled
                        </Badge>
                    )}
                </div>

                <div className="space-y-2">
                    <div className="text-[2.2rem] font-semibold tracking-tight text-[#eef2fb]">You and {bookerName}</div>
                    <div className="flex flex-wrap items-center gap-3 text-[1.75rem] text-[#a4afc6]">
                        <span className="inline-flex items-center gap-1.5">
                            <Clock size={14} />
                            {duration} min
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                            <Globe size={14} />
                            {location || 'Cal Video'}
                        </span>
                    </div>
                    <div className="text-[1.3rem] text-[#7e8aa3]">{eventTitle}</div>
                </div>
            </div>

            <div className="relative flex items-center justify-between gap-3 border-t border-cal-border pt-4 lg:border-0 lg:pt-0" ref={menuRef}>
                {status === 'upcoming' && <Badge variant="success" className="bg-emerald-500/20 text-emerald-300">Upcoming</Badge>}
                {status === 'past' && <Badge>Past</Badge>}
                {status === 'cancelled' && <Badge variant="warning">Cancelled</Badge>}
                <button
                    type="button"
                    onClick={(event) => {
                        event.stopPropagation();
                        setMenuOpen((value) => !value);
                    }}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#2d3344] bg-[#101522] text-[#9ca8bf] transition-colors hover:bg-[#151c2c] hover:text-[#dbe2f0]"
                >
                    <MoreHorizontal size={16} />
                </button>

                {menuOpen && (
                    <div
                        className="absolute right-0 top-[calc(100%+8px)] z-20 w-[232px] overflow-hidden rounded-2xl border border-zinc-200 bg-white text-zinc-900 shadow-[0_16px_40px_rgba(0,0,0,0.24)]"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="px-4 pb-1 pt-3 text-xs font-semibold text-zinc-500">Edit event</div>
                        <button type="button" onClick={() => runAction(onReschedule)} className="flex w-full items-center gap-2 px-4 py-2 text-left hover:bg-zinc-50">
                            <CalendarClock size={15} />
                            Reschedule booking
                        </button>
                        <button type="button" onClick={() => runAction(onRequestReschedule)} className="flex w-full items-center gap-2 px-4 py-2 text-left hover:bg-zinc-50">
                            <Send size={15} />
                            Request reschedule
                        </button>
                        <button type="button" onClick={() => runAction(onEditLocation)} className="flex w-full items-center gap-2 px-4 py-2 text-left hover:bg-zinc-50">
                            <MapPin size={15} />
                            Edit location
                        </button>
                        <button type="button" onClick={() => runAction(onAddGuests)} className="flex w-full items-center gap-2 px-4 py-2 text-left hover:bg-zinc-50">
                            <UserPlus size={15} />
                            Add guests
                        </button>

                        <div className="mt-1 border-t border-zinc-200 px-4 pb-1 pt-3 text-xs font-semibold text-zinc-500">After event</div>
                        <button type="button" disabled className="w-full px-4 py-2 text-left text-zinc-400">View recordings</button>
                        <button type="button" disabled className="w-full px-4 py-2 text-left text-zinc-400">View session details</button>
                        <button type="button" onClick={() => runAction(onMarkNoShow)} className="w-full px-4 py-2 text-left text-zinc-500 hover:bg-zinc-50">Mark as no-show</button>

                        <div className="mt-1 border-t border-zinc-200" />
                        <button type="button" onClick={() => runAction(onReport)} className="flex w-full items-center gap-2 px-4 py-2 text-left text-[#b42318] hover:bg-zinc-50">
                            <Flag size={15} />
                            Report booking
                        </button>
                        <div className="border-t border-zinc-200" />
                        <button type="button" onClick={() => runAction(onCancel)} className="flex w-full items-center gap-2 px-4 py-2 text-left text-[#b42318] hover:bg-zinc-50">
                            <XCircle size={15} />
                            Cancel event
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
