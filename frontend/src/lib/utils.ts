import { format, parse, addMinutes, isBefore, isEqual } from 'date-fns';
import type { TimeRange, Booking } from '../types';

/** Merge class names, filtering out falsy values */
export function cn(...classes: (string | false | null | undefined)[]): string {
    return classes.filter(Boolean).join(' ');
}

/** Generate a URL slug from a title */
export function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
}

/** Generate time slots for given availability ranges, duration, and existing bookings */
export function generateTimeSlots(
    date: string,
    timeRanges: TimeRange[],
    duration: number,
    existingBookings: Booking[]
): { time: string; available: boolean }[] {
    const slots: { time: string; available: boolean }[] = [];

    for (const range of timeRanges) {
        const rangeStart = parse(range.start, 'HH:mm', new Date());
        const rangeEnd = parse(range.end, 'HH:mm', new Date());
        let current = rangeStart;

        while (
            isBefore(addMinutes(current, duration), rangeEnd) ||
            isEqual(addMinutes(current, duration), rangeEnd)
        ) {
            const timeStr = format(current, 'HH:mm');
            const slotEnd = format(addMinutes(current, duration), 'HH:mm');

            // Check for conflicts with existing bookings
            const hasConflict = existingBookings.some((booking) => {
                if (booking.date !== date) return false;
                if (booking.status === 'cancelled') return false;
                return timeStr < booking.endTime && slotEnd > booking.startTime;
            });

            slots.push({ time: timeStr, available: !hasConflict });
            current = addMinutes(current, duration);
        }
    }

    return slots;
}

/** Format time string to 12h or 24h */
export function formatTime(time: string, use24h: boolean): string {
    const parsed = parse(time, 'HH:mm', new Date());
    return use24h ? format(parsed, 'HH:mm') : format(parsed, 'h:mma').toLowerCase();
}

/** Format a date string (YYYY-MM-DD) to a readable format */
export function formatDate(dateStr: string, formatStr: string = 'EEEE, MMMM d, yyyy'): string {
    const date = parse(dateStr, 'yyyy-MM-dd', new Date());
    return format(date, formatStr);
}

/** Get initials from a name */
export function getInitials(name: string): string {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}
