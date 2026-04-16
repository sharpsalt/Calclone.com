import type { EventType, Availability, Booking, User } from '../types';

export const defaultUser: User = {
    name: 'Srijan Verma',
    username: 'srijan',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    presence: 'available',
    online: true,
};

export const seedEventTypes: EventType[] = [
    {
        id: '1',
        title: '15 min meeting',
        slug: '15-min-meeting',
        description: 'A quick 15-minute call to connect.',
        duration: 15,
        isActive: true,
        createdAt: '2026-04-01T00:00:00Z',
    },
    {
        id: '2',
        title: '30 min meeting',
        slug: '30-min-meeting',
        description: 'A 30-minute discussion session.',
        duration: 30,
        isActive: true,
        createdAt: '2026-04-01T00:00:00Z',
    },
];

export const seedAvailability: Availability = {
    id: '1',
    name: 'Working Hours',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    isDefault: true,
    schedule: [
        { day: 0, enabled: false, timeRanges: [] },
        { day: 1, enabled: true, timeRanges: [{ start: '09:00', end: '17:00' }] },
        { day: 2, enabled: true, timeRanges: [{ start: '09:00', end: '17:00' }] },
        { day: 3, enabled: true, timeRanges: [{ start: '09:00', end: '17:00' }] },
        { day: 4, enabled: true, timeRanges: [{ start: '09:00', end: '17:00' }] },
        { day: 5, enabled: true, timeRanges: [{ start: '09:00', end: '17:00' }] },
        { day: 6, enabled: false, timeRanges: [] },
    ],
};

export const seedBookings: Booking[] = [
    {
        id: '1',
        eventTypeId: '1',
        eventTitle: '15 min meeting',
        date: '2026-04-15',
        startTime: '10:00',
        endTime: '10:15',
        duration: 15,
        bookerName: 'Srijan Verma',
        bookerEmail: 'srijan@example.com',
        status: 'upcoming',
        createdAt: '2026-04-10T08:00:00Z',
    },
    {
        id: '2',
        eventTypeId: '2',
        eventTitle: '30 min meeting',
        date: '2026-04-15',
        startTime: '13:00',
        endTime: '13:30',
        duration: 30,
        bookerName: 'Srijan Verma',
        bookerEmail: 'srijan@example.com',
        status: 'rescheduled',
        createdAt: '2026-04-10T09:30:00Z',
    },
];
