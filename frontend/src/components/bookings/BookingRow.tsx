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
            className="group relative flex cursor-pointer flex-col gap-6 border-b border-[#2b2b2b] px-6 py-5 hover:bg-[#1c1c1c] transition-colors lg:flex-row lg:items-start lg:justify-between"
            onClick={() => onClickBooking?.(id)}
        >
            <div className="flex w-full min-w-0 flex-1 flex-col gap-3 lg:flex-row">
                <div className="flex w-[200px] shrink-0 flex-col gap-1">
                    <div className="text-[15px] font-semibold text-[#f2f2f2]">{dateLabel}</div>
                    <div className="text-[14px] text-[#9a9a9a]">{startLabel} - {endLabel}</div>
                    <button
                        type="button"
                        onClick={(event) => {
                            event.stopPropagation();
                            onJoin?.(id);
                        }}
                        className="mt-1.5 inline-flex items-center gap-1.5 text-[14px] text-[#3e8ced] hover:underline"
                    >
                        <Video size={14} />
                        Join Cal Video
                    </button>
                    {status === 'rescheduled' && (
                        <div className="mt-2">
                           <span className="rounded bg-[#332616] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#e5801a] border border-[#523c21]">
                               Rescheduled
                           </span>
                        </div>
                    )}
                </div>

                <div className="flex flex-1 flex-col gap-1.5 lg:pl-4">
                    <div className="text-[19px] font-semibold tracking-tight text-[#f2f2f2]">{bookerName}</div>
                    <div className="flex items-center gap-3 text-[14px] text-[#9a9a9a]">
                        <span className="inline-flex items-center gap-1.5">
                            <Clock size={14} />
                            {duration} min
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                            <Globe size={14} />
                            {location || 'Cal Video'}
                        </span>
                    </div>
                    <div className="text-[13px] text-[#717171]">{eventTitle}</div>
                </div>
            </div>

            <div className="relative flex shrink-0 items-center justify-between lg:justify-end gap-3 pt-4 lg:pt-0" ref={menuRef}>
                {status === 'upcoming' && <span className="rounded bg-[#1a3324] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-[#35c762]">Upcoming</span>}
                {status === 'past' && <span className="rounded bg-[#2a2a2a] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-[#9a9a9a]">Past</span>}
                {status === 'cancelled' && <span className="rounded bg-[#332616] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-[#e5801a]">Cancelled</span>}
                <button
                    type="button"
                    onClick={(event) => {
                        event.stopPropagation();
                        setMenuOpen((value) => !value);
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-md border border-[#333] hover:bg-[#2a2a2a] text-[#9a9a9a] transition-colors"
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
