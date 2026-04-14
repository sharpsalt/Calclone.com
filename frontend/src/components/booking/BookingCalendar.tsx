import { useMemo, useState } from 'react';
import {
    addMonths,
    eachDayOfInterval,
    endOfMonth,
    format,
    getDay,
    isBefore,
    isSameDay,
    isToday,
    startOfDay,
    startOfMonth,
    subMonths,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { Availability } from '../../types';

interface BookingCalendarProps {
    selectedDate: Date | null;
    onSelectDate: (date: Date) => void;
    availability: Availability;
}

const DAY_HEADERS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export function BookingCalendar({
    selectedDate,
    onSelectDate,
    availability,
}: BookingCalendarProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const today = useMemo(() => startOfDay(new Date()), []);

    const calendarDays = useMemo(() => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(currentMonth);
        const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
        const startPadding = getDay(monthStart);
        return [...Array(startPadding).fill(null), ...days] as Array<Date | null>;
    }, [currentMonth]);

    const isAvailable = (date: Date) => {
        if (isBefore(date, today)) {
            return false;
        }

        const daySchedule = availability.schedule.find((entry) => entry.day === getDay(date));
        return Boolean(daySchedule?.enabled && daySchedule.timeRanges.length > 0);
    };

    return (
        <div className="w-full">
            <div className="mb-7 flex items-center justify-between">
                <h2 className="text-[1.75rem] font-semibold tracking-tight text-cal-text-primary">
                    {format(currentMonth, 'MMMM')} <span className="text-cal-text-muted">{format(currentMonth, 'yyyy')}</span>
                </h2>
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                        className="flex h-9 w-9 items-center justify-center rounded-xl text-cal-text-muted transition-colors hover:bg-white/5 hover:text-cal-text-primary"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <button
                        type="button"
                        onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                        className="flex h-9 w-9 items-center justify-center rounded-xl text-cal-text-muted transition-colors hover:bg-white/5 hover:text-cal-text-primary"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>

            <div className="mb-3 grid grid-cols-7 gap-3">
                {DAY_HEADERS.map((day) => (
                    <div key={day} className="text-center text-xs font-semibold tracking-[0.18em] text-cal-text-muted">
                        {day}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-3">
                {calendarDays.map((day, index) => {
                    if (!day) {
                        return <div key={`empty-${index}`} className="aspect-square" />;
                    }

                    const available = isAvailable(day);
                    const selected = selectedDate ? isSameDay(day, selectedDate) : false;
                    const todayDate = isToday(day);

                    return (
                        <button
                            key={day.toISOString()}
                            type="button"
                            disabled={!available}
                            onClick={() => available && onSelectDate(day)}
                            className={cn(
                                'relative aspect-square rounded-2xl border text-base font-medium transition-all',
                                selected
                                    ? 'border-white bg-white text-cal-text-inverted shadow-[0_14px_28px_rgba(255,255,255,0.08)]'
                                    : available
                                        ? 'border-transparent bg-white/7 text-cal-text-primary hover:border-cal-border hover:bg-white/12'
                                        : 'border-transparent bg-transparent text-cal-text-dimmed/60'
                            )}
                        >
                            {format(day, 'd')}
                            {todayDate && !selected && (
                                <span className="absolute bottom-2 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-cal-text-primary" />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
