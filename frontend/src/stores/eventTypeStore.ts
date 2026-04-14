import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { EventType } from '../types';
import { seedEventTypes } from '../data/seed';

interface EventTypeStore {
    eventTypes: EventType[];
    addEventType: (eventType: Omit<EventType, 'id' | 'createdAt'>) => void;
    updateEventType: (id: string, updates: Partial<EventType>) => void;
    deleteEventType: (id: string) => void;
    getEventTypeBySlug: (slug: string) => EventType | undefined;
}

export const useEventTypeStore = create<EventTypeStore>()(
    persist(
        (set, get) => ({
            eventTypes: seedEventTypes,
            addEventType: (data) =>
                set((state) => ({
                    eventTypes: [
                        ...state.eventTypes,
                        {
                            ...data,
                            id: crypto.randomUUID(),
                            createdAt: new Date().toISOString(),
                        },
                    ],
                })),
            updateEventType: (id, updates) =>
                set((state) => ({
                    eventTypes: state.eventTypes.map((et) =>
                        et.id === id ? { ...et, ...updates } : et
                    ),
                })),
            deleteEventType: (id) =>
                set((state) => ({
                    eventTypes: state.eventTypes.filter((et) => et.id !== id),
                })),
            getEventTypeBySlug: (slug) =>
                get().eventTypes.find((et) => et.slug === slug),
        }),
        { name: 'event-types' }
    )
);
