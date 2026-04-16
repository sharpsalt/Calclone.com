export type BookingQuestionStatus = 'Required' | 'Optional' | 'Hidden';

export interface BookingQuestionSetting {
    id: string;
    label: string;
    typeLabel: string;
    status: BookingQuestionStatus;
    enabled: boolean;
}

export type DefaultCalendarView = 'Month' | 'Weekly' | 'Column';
export type ConfirmationMode = 'Email' | 'Phone';

export interface EventTypeSettings {
    allowMultipleDurations: boolean;
    limits: {
        beforeEventBuffer: string;
        afterEventBuffer: string;
        minimumNoticeValue: number;
        minimumNoticeUnit: string;
        slotInterval: string;
        limitFrequency: boolean;
        firstSlotOnly: boolean;
        limitTotalDuration: boolean;
        limitUpcomingPerBooker: boolean;
    };
    advanced: {
        calendarEventName: string;
        calendarAccount: string;
        layoutMonth: boolean;
        layoutWeekly: boolean;
        layoutColumn: boolean;
        defaultView: DefaultCalendarView;
        confirmationMode: ConfirmationMode;
        bookingQuestions: BookingQuestionSetting[];
        requireCancellationReason: string;
        requiresConfirmation: boolean;
        disableCancelling: boolean;
        disableRescheduling: boolean;
        sendTranscription: boolean;
        autoTranslate: boolean;
        interfaceLanguage: boolean;
        requiresEmailVerification: boolean;
        hideNotesInCalendar: boolean;
    };
    recurring: {
        recurringEvent: boolean;
    };
}

export interface EventType {
    id: string;
    title: string;
    slug: string;
    description: string;
    duration: number;
    isActive: boolean;
    createdAt: string;
    settings?: EventTypeSettings;
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
    eventSlug?: string;
    hostName?: string;
    date: string;
    startTime: string;
    endTime: string;
    duration: number;
    bookerName: string;
    bookerEmail: string;
    location?: string;
    notes?: string;
    guests?: string[];
    rescheduleRequested?: boolean;
    reportedReason?: string;
    isNoShow?: boolean;
    manageToken?: string;
    status: 'upcoming' | 'past' | 'cancelled' | 'rescheduled';
    createdAt: string;
}

export interface PaginatedBookingsResponse {
    items: Booking[];
    total: number;
    page: number;
    page_size: number;
    has_more: boolean;
}

export interface PublicProfileResponse {
    user: {
        id: string;
        username: string;
        name: string | null;
        timezone: string | null;
    };
    event_types: Array<{
        id: string;
        title: string;
        slug: string;
        description: string;
        duration_minutes: number;
        is_active: boolean;
        created_at: string;
        settings?: Record<string, unknown>;
    }>;
}

export interface TimeSlot {
    time: string;
    available: boolean;
}

export interface User {
    id?: string;
    about?: string;
    name: string;
    username: string;
    avatar?: string;
    timezone: string;
    online?: boolean;
    presence?: 'available' | 'busy' | 'away' | 'offline';
}
