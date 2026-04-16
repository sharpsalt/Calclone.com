import { create } from 'zustand';
import type { Booking } from '../types';
import * as api from '../lib/api';

function normalizeBookingStatus(status: unknown): Booking['status'] {
    if (status === 'upcoming' || status === 'past' || status === 'cancelled' || status === 'rescheduled') {
        return status;
    }
    return 'upcoming';
}

function normalizeBookingDate(dateValue: unknown): string {
    if (!dateValue) return '';
    const asString = String(dateValue);
    if (asString.length >= 10) {
        return asString.slice(0, 10);
    }
    return asString;
}

function mapApiBooking(row: any): Booking {
    return {
        id: row.id,
        eventTypeId: row.event_type_id || row.eventTypeId || '',
        eventTitle: row.event_title || row.eventTitle || '',
        eventSlug: row.event_slug || row.eventSlug || undefined,
        hostName: row.host_name || row.hostName || undefined,
        date: normalizeBookingDate(row.date),
        startTime: String(row.start_time || row.startTime || '').slice(0, 5),
        endTime: String(row.end_time || row.endTime || '').slice(0, 5),
        duration: Number(row.duration ?? row.duration_minutes ?? 0),
        bookerName: row.booker_name || row.bookerName || '',
        bookerEmail: row.booker_email || row.bookerEmail || '',
        location: row.location || undefined,
        notes: row.notes || undefined,
        guests: Array.isArray(row.guests) ? row.guests : undefined,
        rescheduleRequested: Boolean(row.reschedule_requested ?? row.rescheduleRequested),
        reportedReason: row.reported_reason || row.reportedReason || undefined,
        isNoShow: Boolean(row.is_no_show ?? row.isNoShow),
        manageToken: row.manage_token || row.manageToken || undefined,
        status: normalizeBookingStatus(row.status),
        createdAt: row.created_at || row.createdAt || new Date().toISOString(),
    };
}

type BookingFilters = {
    event_type?: string;
    team?: string;
    member?: string;
    attendee_name?: string;
    attendee_email?: string;
    date_from?: string;
    date_to?: string;
    booking_uid?: string;
};

function replaceBooking(stateBookings: Booking[], updated: Booking): Booking[] {
    return stateBookings.map((booking) => (booking.id === updated.id ? updated : booking));
}

function upsertBooking(stateBookings: Booking[], next: Booking): Booking[] {
    const idx = stateBookings.findIndex((booking) => booking.id === next.id);
    if (idx === -1) {
        return [...stateBookings, next];
    }
    const cloned = stateBookings.slice();
    cloned[idx] = next;
    return cloned;
}

interface BookingStore {
    bookings: Booking[];
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
    hasLoadedFromServer: boolean;
    addBooking: (booking: Omit<Booking, 'id' | 'createdAt'>) => Promise<Booking>;
    cancelBooking: (id: string) => Promise<void>;
    requestReschedule: (id: string, message?: string) => Promise<void>;
    rescheduleBooking: (id: string, data: { date: string; start_time: string }) => Promise<void>;
    updateLocation: (id: string, location: string) => Promise<void>;
    addGuests: (id: string, guests: string[]) => Promise<void>;
    markNoShow: (id: string) => Promise<void>;
    reportBooking: (id: string, reason: string) => Promise<void>;
    markBookingCancelledLocally: (id: string) => void;
    getBookingsByStatus: (status: Booking['status']) => Booking[];
    getBookingsByDate: (date: string) => Booking[];
    fetchFromServer: (status?: string, filters?: BookingFilters, pagination?: { page?: number; page_size?: number }) => Promise<void>;
    fetchBookingById: (id: string) => Promise<Booking | null>;
}

export const useBookingStore = create<BookingStore>()((set, get) => ({
    bookings: [],
    total: 0,
    page: 1,
    pageSize: 10,
    hasMore: false,
    hasLoadedFromServer: false,
    addBooking: async (data) => {
        const tmpId = crypto.randomUUID();
        const tmp = { ...data, id: tmpId, createdAt: new Date().toISOString() } as Booking;
        set((state) => ({ bookings: [...state.bookings, tmp], total: state.total + 1 }));
        try {
            const created = await api.createBooking({ event_type_id: data.eventTypeId, date: data.date, start_time: data.startTime, booker_name: data.bookerName, booker_email: data.bookerEmail });
            const mapped = mapApiBooking(created);
            set((state) => ({ bookings: state.bookings.map((b) => (b.id === tmpId ? mapped : b)) }));
            return mapped;
        } catch (err) {
            console.error('create booking error', err);
            set((state) => ({ bookings: state.bookings.filter((b) => b.id !== tmpId), total: Math.max(0, state.total - 1) }));
            throw err;
        }
    },

    getBookingsByStatus: (status) =>
        get().bookings.filter((b) => b.status === status),
    getBookingsByDate: (date) =>
        get().bookings.filter((b) => b.date === date),
    cancelBooking: async (id) => {
        const prev = get().bookings;
        set((state) => ({ bookings: state.bookings.map((b) => (b.id === id ? { ...b, status: 'cancelled' as const } : b)) }));
        try {
            await api.cancelBooking(id);
        } catch (err) {
            console.error('cancel booking error', err);
            set({ bookings: prev });
        }
    },
    requestReschedule: async (id, message) => {
        try {
            const row = await api.requestBookingReschedule(id, message);
            const updated = mapApiBooking(row);
            set((state) => ({ bookings: replaceBooking(state.bookings, updated) }));
        } catch (err) {
            console.error('request reschedule error', err);
        }
    },
    rescheduleBooking: async (id, data) => {
        try {
            const row = await api.rescheduleBooking(id, data);
            const updated = mapApiBooking(row);
            set((state) => ({ bookings: replaceBooking(state.bookings, updated) }));
        } catch (err) {
            console.error('reschedule booking error', err);
            throw err;
        }
    },
    updateLocation: async (id, location) => {
        try {
            const row = await api.updateBookingLocation(id, location);
            const updated = mapApiBooking(row);
            set((state) => ({ bookings: replaceBooking(state.bookings, updated) }));
        } catch (err) {
            console.error('update location error', err);
        }
    },
    addGuests: async (id, guests) => {
        try {
            const row = await api.addBookingGuests(id, guests);
            const updated = mapApiBooking(row);
            set((state) => ({ bookings: replaceBooking(state.bookings, updated) }));
        } catch (err) {
            console.error('add guests error', err);
        }
    },
    markNoShow: async (id) => {
        try {
            const row = await api.markBookingNoShow(id);
            const updated = mapApiBooking(row);
            set((state) => ({ bookings: replaceBooking(state.bookings, updated) }));
        } catch (err) {
            console.error('mark no-show error', err);
        }
    },
    reportBooking: async (id, reason) => {
        try {
            const row = await api.reportBooking(id, reason);
            const updated = mapApiBooking(row);
            set((state) => ({ bookings: replaceBooking(state.bookings, updated) }));
        } catch (err) {
            console.error('report booking error', err);
        }
    },
    markBookingCancelledLocally: (id) => {
        set((state) => ({ bookings: state.bookings.map((b) => (b.id === id ? { ...b, status: 'cancelled' } : b)) }));
    },
    fetchFromServer: async (status = 'upcoming', filters, pagination) => {
        try {
            const result = await api.fetchBookings(status, filters, pagination);
            const mapped = result.items.map((row: any) => mapApiBooking(row));
            set({
                bookings: mapped,
                total: result.total,
                page: result.page,
                pageSize: result.page_size,
                hasMore: result.has_more,
                hasLoadedFromServer: true,
            });
        } catch (err) {
            console.error('fetch bookings error', err);
        }
    },
    fetchBookingById: async (id) => {
        try {
            const row = await api.fetchBooking(id);
            const mapped = mapApiBooking(row);
            set((state) => ({ bookings: upsertBooking(state.bookings, mapped) }));
            return mapped;
        } catch (err) {
            console.error('fetch booking by id error', err);
            return null;
        }
    },
}));
