export interface EventType {
    id: string;
    title: string;
    slug: string;
    description: string;
    duration: number;
    isActive: boolean;
    createdAt: string;
}

export interface Availability {
    id: string;
    name: string;
    timezone: string;
    isDefault: boolean;
    schedule: DaySchedule[];
}

export interface DaySchedule {
    day: number;
    enabled: boolean;
    timeRanges: TimeRange[];
}

export interface TimeRange {
    start: string;
    end: string;
}

export interface Booking {
    id: string;
    eventTypeId: string;
    eventTitle: string;
    date: string;
    startTime: string;
    endTime: string;
    duration: number;
    bookerName: string;
    bookerEmail: string;
    notes?: string;
    guests?: string[];
    status: 'upcoming' | 'past' | 'cancelled' | 'rescheduled';
    createdAt: string;
}

export interface TimeSlot {
    time: string;
    available: boolean;
}

export interface User {
    name: string;
    username: string;
    avatar?: string;
    timezone: string;
}
