import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Availability } from '../types';
import { seedAvailability } from '../data/seed';

interface AvailabilityStore {
    availability: Availability;
    updateAvailability: (updates: Partial<Availability>) => void;
    toggleDay: (day: number) => void;
    addTimeRange: (day: number) => void;
    removeTimeRange: (day: number, index: number) => void;
    updateTimeRange: (
        day: number,
        index: number,
        field: 'start' | 'end',
        value: string
    ) => void;
}

export const useAvailabilityStore = create<AvailabilityStore>()(
    persist(
        (set) => ({
            availability: seedAvailability,
            updateAvailability: (updates) =>
                set((state) => ({
                    availability: { ...state.availability, ...updates },
                })),
            toggleDay: (day) =>
                set((state) => ({
                    availability: {
                        ...state.availability,
                        schedule: state.availability.schedule.map((s) =>
                            s.day === day
                                ? {
                                    ...s,
                                    enabled: !s.enabled,
                                    timeRanges: !s.enabled && s.timeRanges.length === 0
                                        ? [{ start: '09:00', end: '17:00' }]
                                        : s.timeRanges,
                                }
                                : s
                        ),
                    },
                })),
            addTimeRange: (day) =>
                set((state) => ({
                    availability: {
                        ...state.availability,
                        schedule: state.availability.schedule.map((s) =>
                            s.day === day
                                ? { ...s, timeRanges: [...s.timeRanges, { start: '09:00', end: '17:00' }] }
                                : s
                        ),
                    },
                })),
            removeTimeRange: (day, index) =>
                set((state) => ({
                    availability: {
                        ...state.availability,
                        schedule: state.availability.schedule.map((s) =>
                            s.day === day
                                ? { ...s, timeRanges: s.timeRanges.filter((_, i) => i !== index) }
                                : s
                        ),
                    },
                })),
            updateTimeRange: (day, index, field, value) =>
                set((state) => ({
                    availability: {
                        ...state.availability,
                        schedule: state.availability.schedule.map((s) =>
                            s.day === day
                                ? {
                                    ...s,
                                    timeRanges: s.timeRanges.map((tr, i) =>
                                        i === index ? { ...tr, [field]: value } : tr
                                    ),
                                }
                                : s
                        ),
                    },
                })),
        }),
        { name: 'availability' }
    )
);
