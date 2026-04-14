import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Booking } from '../types';
import { seedBookings } from '../data/seed';

interface BookingStore {
    bookings: Booking[];
    addBooking: (booking: Omit<Booking, 'id' | 'createdAt'>) => void;
    cancelBooking: (id: string) => void;
    getBookingsByStatus: (status: Booking['status']) => Booking[];
    getBookingsByDate: (date: string) => Booking[];
}

export const useBookingStore = create<BookingStore>()(
    persist(
        (set, get) => ({
            bookings: seedBookings,
            addBooking: (data) =>
                set((state) => ({
                    bookings: [
                        ...state.bookings,
                        {
                            ...data,
                            id: crypto.randomUUID(),
                            createdAt: new Date().toISOString(),
                        },
                    ],
                })),
            cancelBooking: (id) =>
                set((state) => ({
                    bookings: state.bookings.map((b) =>
                        b.id === id ? { ...b, status: 'cancelled' as const } : b
                    ),
                })),
            getBookingsByStatus: (status) =>
                get().bookings.filter((b) => b.status === status),
            getBookingsByDate: (date) =>
                get().bookings.filter((b) => b.date === date),
        }),
        { name: 'bookings' }
    )
);
