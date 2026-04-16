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
    startOfWeek,
    addDays,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { Availability } from '../../types';

interface BookingCalendarProps {
    selectedDate: Date | null;
    onSelectDate: (date: Date) => void;
    availability: Availability;
    view?: 'month' | 'week' | 'day';
}

const DAY_HEADERS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export function BookingCalendar({
    selectedDate,
    onSelectDate,
    availability,
    view = 'month',
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

    // Month view (default)
    if (view === 'month') {
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
                                    'relative aspect-square rounded-2xl transition-all flex items-center justify-center text-base font-semibold',
                                    selected
                                        ? 'bg-[#111113] text-white border-transparent shadow-[0_24px_60px_rgba(0,0,0,0.6)]'
                                        : available
                                            ? 'bg-white text-zinc-900 border border-white/10 hover:brightness-95'
                                            : 'bg-transparent text-cal-text-dimmed/60'
                                )}
                            >
                                <div className="flex flex-col items-center justify-center">
                                    <span className="text-lg font-semibold">{format(day, 'd')}</span>
                                    {selected ? (
                                        <span className="mt-2 h-2 w-2 rounded-full bg-white" />
                                    ) : todayDate && (
                                        <span className="absolute bottom-2 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-cal-text-primary" />
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    }

    // Week view - simple column grid with hours
    if (view === 'week') {
        const today = new Date();
        const weekStart = startOfWeek(selectedDate ?? today, { weekStartsOn: 0 });
        const days = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));
        const hours = Array.from({ length: 12 }).map((_, i) => 7 + i); // 7am - 18pm

        return (
            <div className="w-full">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold tracking-tight text-cal-text-primary">Week</h2>
                    <div className="text-sm text-cal-text-dimmed">{format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d')}</div>
                </div>

                <div className="grid grid-cols-7 gap-2">
                    {days.map((d) => (
                        <div key={d.toISOString()} className="rounded-lg border bg-cal-bg-surface p-2 text-sm">
                            <div className="mb-2 font-medium">{format(d, 'EEE d')}</div>
                            <div className="space-y-1">
                                {hours.map((h) => {
                                    const slotDate = new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, 0);
                                    const available = isAvailable(slotDate);
                                    return (
                                        <button
                                            key={h}
                                            onClick={() => available && onSelectDate(slotDate)}
                                            disabled={!available}
                                            className={cn(
                                                'w-full rounded-md px-2 py-1 text-left text-xs',
                                                available ? 'bg-white/7 hover:bg-white/12' : 'text-cal-text-dimmed/60'
                                            )}
                                        >
                                            {format(slotDate, 'h:00 a')}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Day/column view - show selected date times as column list
    const day = selectedDate ?? new Date();
    const daySchedule = availability.schedule.find((entry) => entry.day === getDay(day));
    const hours = [] as string[];
    if (daySchedule?.enabled) {
        daySchedule.timeRanges.forEach((tr) => {
            const [startH] = tr.start.split(':');
            const [endH] = tr.end.split(':');
            const s = parseInt(startH, 10);
            const e = parseInt(endH, 10);
            for (let hh = s; hh < e; hh += 1) {
                hours.push(`${hh.toString().padStart(2, '0')}:00`);
            }
        });
    }

    return (
        <div className="w-full">
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold tracking-tight text-cal-text-primary">{format(day, 'EEEE, MMM d')}</h2>
            </div>
            <div className="space-y-2">
                {hours.length === 0 ? (
                    <div className="text-cal-text-dimmed">No available times for this day.</div>
                ) : (
                    hours.map((t) => (
                        <div key={t} className="rounded-md border bg-white/7 px-3 py-2 text-sm">{t}</div>
                    ))
                )}
            </div>
        </div>
    );
}
