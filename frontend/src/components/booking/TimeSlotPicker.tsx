import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Button } from '../ui/Button';
import { cn, generateTimeSlots, formatTime } from '../../lib/utils';
import type { TimeRange, Booking } from '../../types';

interface TimeSlotPickerProps {
    selectedDate: Date;
    timeRanges: TimeRange[];
    duration: number;
    existingBookings: Booking[];
    onSelectSlot: (time: string) => void;
    onContinue: () => void;
    selectedSlot?: string | null;
}

export function TimeSlotPicker({
    selectedDate,
    timeRanges,
    duration,
    existingBookings,
    onSelectSlot,
    onContinue,
    selectedSlot,
}: TimeSlotPickerProps) {
    const [use24h, setUse24h] = useState(false);
    const dateStr = format(selectedDate, 'yyyy-MM-dd');

    const slots = useMemo(
        () => generateTimeSlots(dateStr, timeRanges, duration, existingBookings).filter((slot) => slot.available),
        [dateStr, timeRanges, duration, existingBookings]
    );

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
                {slots.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-cal-border bg-cal-bg-subtle/60 px-4 py-8 text-center text-sm text-cal-text-muted">
                        No slots available for this day.
                    </div>
                ) : (
                    slots.map((slot) => (
                        <div key={slot.time} className="flex items-stretch gap-3">
                            <button
                                type="button"
                                onClick={() => onSelectSlot(slot.time)}
                                className={cn(
                                    'flex-1 rounded-2xl border px-4 py-3 text-base font-medium transition-all',
                                    selectedSlot === slot.time
                                        ? 'border-[#0ea5e9] bg-[#0ea5e9]/10 text-cal-text-primary'
                                        : 'border-cal-border text-cal-text-primary hover:border-white/20 hover:bg-white/5'
                                )}
                            >
                                <span className="inline-flex items-center gap-2">
                                    <span className="h-2.5 w-2.5 rounded-full bg-[#16d9a3]" />
                                    {formatTime(slot.time, use24h)}
                                </span>
                            </button>
                            {selectedSlot === slot.time && (
                                <Button className="h-auto px-5" onClick={onContinue}>
                                    Next
                                </Button>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
