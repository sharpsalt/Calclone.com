import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { EventType } from '../types';
import * as api from '../lib/api';
import { normalizeEventTypeSettings, toApiEventTypeSettings } from '../lib/eventTypeSettings';

function normalizeLocalEventType(eventType: EventType): EventType {
    return {
        ...eventType,
        description: eventType.description || '',
        isActive: eventType.isActive ?? true,
        settings: normalizeEventTypeSettings(eventType.settings, eventType.title),
    };
}

function mapApiEventType(row: any): EventType {
    return {
        id: row.id,
        title: row.title,
        slug: row.slug,
        description: row.description || '',
        duration: Number(row.duration_minutes ?? row.duration ?? 0),
        isActive: row.is_active ?? row.isActive ?? true,
        createdAt: row.created_at || row.createdAt || new Date().toISOString(),
        settings: normalizeEventTypeSettings(row.settings, row.title),
    };
}

function buildCreatePayload(data: Omit<EventType, 'id' | 'createdAt'>) {
    const settings = normalizeEventTypeSettings(data.settings, data.title);
    return {
        title: data.title,
        description: data.description || '',
        duration_minutes: data.duration,
        slug: data.slug,
        is_active: data.isActive ?? true,
        settings: toApiEventTypeSettings(settings),
    };
}

function buildUpdatePayload(updates: Partial<EventType>) {
    const payload: Record<string, unknown> = {};
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.duration !== undefined) payload.duration_minutes = updates.duration;
    if (updates.slug !== undefined) payload.slug = updates.slug;
    if (updates.isActive !== undefined) payload.is_active = updates.isActive;
    if (updates.settings !== undefined) {
        payload.settings = toApiEventTypeSettings(normalizeEventTypeSettings(updates.settings, updates.title));
    }
    return payload;
}

interface EventTypeStore {
    eventTypes: EventType[];
    addEventType: (eventType: Omit<EventType, 'id' | 'createdAt'>) => Promise<void>;
    updateEventType: (id: string, updates: Partial<EventType>) => Promise<void>;
    deleteEventType: (id: string) => Promise<void>;
    getEventTypeBySlug: (slug: string) => EventType | undefined;
    moveEventTypeToTop: (id: string) => void;
    moveEventTypeToBottom: (id: string) => void;
    moveEventTypeUp: (id: string) => void;
    moveEventTypeDown: (id: string) => void;
    fetchFromServer: () => Promise<void>;
}

export const useEventTypeStore = create<EventTypeStore>()(
    persist(
        (set, get) => ({
            eventTypes: [],
            addEventType: async (data) => {
                // optimistic add
                const tmpId = crypto.randomUUID();
                const tmp = normalizeLocalEventType({
                    ...data,
                    id: tmpId,
                    createdAt: new Date().toISOString(),
                } as EventType);
                set((state) => ({ eventTypes: [...state.eventTypes, tmp] }));
                try {
                    const created = await api.createEventType(buildCreatePayload(data));
                    set((state) => ({ eventTypes: state.eventTypes.map((et) => (et.id === tmpId ? mapApiEventType(created) : et)) }));
                } catch (err) {
                    // rollback
                    set((state) => ({ eventTypes: state.eventTypes.filter((et) => et.id !== tmpId) }));
                    console.error('create event error', err);
                }
            },
            updateEventType: async (id, updates) => {
                const previous = get().eventTypes;
                const merged = previous.map((eventType) =>
                    eventType.id === id
                        ? normalizeLocalEventType({ ...eventType, ...updates, settings: updates.settings ?? eventType.settings })
                        : eventType
                );

                set({ eventTypes: merged });
                try {
                    const response = await api.updateEventType(id, buildUpdatePayload(updates));
                    set((state) => ({ eventTypes: state.eventTypes.map((eventType) => (eventType.id === id ? mapApiEventType(response) : eventType)) }));
                } catch (err) {
                    console.error('update event error', err);
                    set({ eventTypes: previous });
                }
            },
            deleteEventType: async (id) => {
                const prev = get().eventTypes;
                set((state) => ({ eventTypes: state.eventTypes.filter((et) => et.id !== id) }));
                try {
                    await api.deleteEventType(id);
                } catch (err) {
                    console.error('delete error', err);
                    set({ eventTypes: prev });
                }
            },
            getEventTypeBySlug: (slug) =>
                get().eventTypes.find((et) => et.slug === slug),
            moveEventTypeToTop: (id) =>
                set((state) => {
                    const idx = state.eventTypes.findIndex((et) => et.id === id);
                    if (idx <= 0) return { eventTypes: state.eventTypes };
                    const item = state.eventTypes[idx];
                    const rest = state.eventTypes.filter((et) => et.id !== id);
                    return { eventTypes: [item, ...rest] };
                }),
            moveEventTypeToBottom: (id) =>
                set((state) => {
                    const idx = state.eventTypes.findIndex((et) => et.id === id);
                    if (idx === -1 || idx === state.eventTypes.length - 1) return { eventTypes: state.eventTypes };
                    const item = state.eventTypes[idx];
                    const rest = state.eventTypes.filter((et) => et.id !== id);
                    return { eventTypes: [...rest, item] };
                }),
            moveEventTypeUp: (id) =>
                set((state) => {
                    const idx = state.eventTypes.findIndex((et) => et.id === id);
                    if (idx <= 0) return { eventTypes: state.eventTypes };
                    const arr = state.eventTypes.slice();
                    const tmp = arr[idx - 1];
                    arr[idx - 1] = arr[idx];
                    arr[idx] = tmp;
                    return { eventTypes: arr };
                }),
            moveEventTypeDown: (id) =>
                set((state) => {
                    const idx = state.eventTypes.findIndex((et) => et.id === id);
                    if (idx === -1 || idx === state.eventTypes.length - 1) return { eventTypes: state.eventTypes };
                    const arr = state.eventTypes.slice();
                    const tmp = arr[idx + 1];
                    arr[idx + 1] = arr[idx];
                    arr[idx] = tmp;
                    return { eventTypes: arr };
                }),
            // sync from server
            fetchFromServer: async () => {
                try {
                    const rows = await api.fetchEventTypes();
                    const mapped = rows.map((row: any) => mapApiEventType(row));
                    set({ eventTypes: mapped });
                } catch (err) {
                    console.error('fetch event types error', err);
                }
            }
        }),
        { name: 'event-types-v2' }
    )
);
