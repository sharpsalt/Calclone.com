import { useMemo, useState } from 'react';
import { format, isSameDay, parse } from 'date-fns';
import { Button } from '../ui/Button';
import { cn, generateTimeSlots, formatTime } from '../../lib/utils';
import type { TimeRange, Booking } from '../../types';

interface TimeSlotPickerProps {
    selectedDate: Date;
    timeRanges: TimeRange[];
    duration: number;
    existingBookings: Booking[];
    availableSlots?: string[];
    isLoading?: boolean;
    onSelectSlot: (time: string) => void;
    onContinue: () => void;
    selectedSlot?: string | null;
}

export function TimeSlotPicker({
    selectedDate,
    timeRanges,
    duration,
    existingBookings,
    availableSlots,
    isLoading = false,
    onSelectSlot,
    onContinue,
    selectedSlot,
}: TimeSlotPickerProps) {
    const [use24h, setUse24h] = useState(false);
    const dateStr = format(selectedDate, 'yyyy-MM-dd');

    const slots = useMemo(() => {
        const now = new Date();
        const isToday = isSameDay(selectedDate, now);

        if (Array.isArray(availableSlots)) {
            return availableSlots
                .map((time) => ({ time, available: true }))
                .filter((slot) => {
                    if (!isToday) return true;
                    const slotStart = parse(slot.time, 'HH:mm', selectedDate);
                    return slotStart.getTime() > now.getTime();
                });
        }

        return generateTimeSlots(dateStr, timeRanges, duration, existingBookings)
            .filter((slot) => {
                if (!isToday) return true;
                const slotStart = parse(slot.time, 'HH:mm', selectedDate);
                return slotStart.getTime() > now.getTime();
            });
    }, [dateStr, timeRanges, duration, existingBookings, selectedDate]);

    return (
        <div className="flex h-full w-full flex-col border-cal-border md:border-l md:pl-8">
            <div className="mb-6 flex items-center justify-between">
                <h3 className="text-[1.65rem] font-semibold tracking-tight text-cal-text-primary">
                    {format(selectedDate, 'EEE d')}
                </h3>
                <div className="inline-flex items-center rounded-xl border border-cal-border bg-cal-bg-subtle p-1">
                    <button
                        type="button"
                        onClick={() => setUse24h(false)}
                        className={cn(
                            'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                            !use24h ? 'bg-white text-cal-text-inverted' : 'text-cal-text-muted'
                        )}
                    >
                        12h
                    </button>
                    <button
                        type="button"
                        onClick={() => setUse24h(true)}
                        className={cn(
                            'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                            use24h ? 'bg-white text-cal-text-inverted' : 'text-cal-text-muted'
                        )}
                    >
                        24h
                    </button>
                </div>
            </div>

            <div className="flex max-h-[500px] flex-1 flex-col gap-3 overflow-y-auto pr-1">
                {isLoading ? (
                    <div className="rounded-2xl border border-dashed border-cal-border bg-cal-bg-subtle/60 px-4 py-8 text-center text-sm text-cal-text-muted">
                        Loading available slots...
                    </div>
                ) : slots.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-cal-border bg-cal-bg-subtle/60 px-4 py-8 text-center text-sm text-cal-text-muted">
                        No slots available for this day.
                    </div>
                ) : (
                    slots.map((slot) => (
                        <div key={slot.time} className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => slot.available && onSelectSlot(slot.time)}
                                disabled={!slot.available}
                                className={cn(
                                    'flex-1 rounded-2xl border px-4 py-3 text-sm font-medium transition-all flex items-center justify-between',
                                    selectedSlot === slot.time
                                        ? 'bg-[#0f1720] border-transparent text-cal-text-inverted'
                                        : slot.available
                                            ? 'bg-cal-bg-card border-cal-border text-cal-text-primary hover:brightness-105'
                                            : 'bg-cal-bg-subtle/60 border-cal-border text-cal-text-dimmed cursor-not-allowed'
                                )}
                            >
                                <span className="inline-flex items-center gap-3">
                                    <span className={`h-2.5 w-2.5 rounded-full ${slot.available ? 'bg-[#16d9a3]' : 'bg-cal-text-dimmed'}`} />
                                    <span className="font-medium">{formatTime(slot.time, use24h)}</span>
                                </span>
                                {selectedSlot === slot.time ? (
                                    <span className="text-xs text-cal-text-muted">Selected</span>
                                ) : !slot.available ? (
                                    <span className="text-xs text-cal-text-dimmed">Unavailable</span>
                                ) : null}
                            </button>
                            {selectedSlot === slot.time && slot.available && (
                                <Button className="h-10 px-4" variant="accent" onClick={onContinue}>
                                    Continue
                                </Button>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
