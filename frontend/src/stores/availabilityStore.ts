import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Availability } from '../types';
import { seedAvailability } from '../data/seed';
import api from '../lib/api';

function createEmptyWeekSchedule(): Availability['schedule'] {
    return Array.from({ length: 7 }, (_, day) => ({ day, enabled: false, timeRanges: [] }));
}

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
    syncWithServer: () => Promise<void>;
}

export const useAvailabilityStore = create<AvailabilityStore>()(
    persist(
        (set) => ({
            availability: { ...seedAvailability, schedule: createEmptyWeekSchedule() },
            syncWithServer: async () => {
                try {
                    const res = await api.fetchAvailability();
                    const timezone = res?.timezone || seedAvailability.timezone;
                    const name = res?.name || seedAvailability.name;
                    const isDefault = Boolean(res?.is_default ?? res?.isDefault ?? true);
                    const schedule = createEmptyWeekSchedule();

                    if (Array.isArray(res?.timeRanges)) {
                        for (const tr of res.timeRanges) {
                            const day = Number(tr.day_of_week);
                            const idx = schedule.findIndex((d) => d.day === day);
                            if (idx !== -1) {
                                schedule[idx].enabled = true;
                                schedule[idx].timeRanges.push({
                                    start: String(tr.start_time || '').slice(0, 5),
                                    end: String(tr.end_time || '').slice(0, 5),
                                });
                            }
                        }
                    }

                    set({ availability: { ...seedAvailability, name, timezone, isDefault, schedule } });
                } catch (err) {
                    console.error('fetch availability error', err);
                }
            },
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
        { name: 'availability-v2' }
    )
);
