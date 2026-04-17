import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { addMinutes, addDays, format, getDay, parse } from 'date-fns';
import { Calendar, ChevronLeft, Clock, Globe, Video, Check, LayoutGrid, Columns3 } from 'lucide-react';
import { defaultUser } from '../data/seed';
import { getInitials } from '../lib/utils';
import { useAvailabilityStore } from '../stores/availabilityStore';
import { useBookingStore } from '../stores/bookingStore';
import { useEventTypeStore } from '../stores/eventTypeStore';
import type { EventType } from '../types';
import { BookingCalendar } from '../components/booking/BookingCalendar';
import { TimeSlotPicker } from '../components/booking/TimeSlotPicker';
import { BookingForm } from '../components/booking/BookingForm';
import { BookingConfirmation } from '../components/booking/BookingConfirmation';
import { Dialog } from '../components/ui/Dialog';
import { Skeleton } from '../components/ui/Skeleton';
import * as api from '../lib/api';

type BookingStep = 'calendar' | 'form' | 'confirmation';
type TeamMember = { id: string; name: string; timezone: string };

const TROUBLESHOOTER_TIMEZONES = [
    'Asia/Kolkata',
    'UTC',
    'America/Los_Angeles',
    'America/New_York',
    'Europe/London',
    'Europe/Berlin',
    'Asia/Dubai',
    'Asia/Singapore',
    'Asia/Tokyo',
    'Australia/Sydney',
];

export function PublicBookingPage() {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const overlay = new URLSearchParams(location.search).get('overlayCalendar') === 'true';
    // Only show the overlay debug panel when explicitly requested via `debugOverlay=true`.
    // This keeps `overlayCalendar=true` clean by default.
    const overlayDebug = new URLSearchParams(location.search).get('debugOverlay') === 'true';
    const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
    const [showTroubleshooter, setShowTroubleshooter] = useState(false);
    const [calendarInstalled, setCalendarInstalled] = useState<boolean>(() => {
        try { return localStorage.getItem('calendarInstalled') === 'true'; } catch { return false; }
    });
    const [teamMembersLocal, setTeamMembersLocal] = useState<TeamMember[]>(() => {
        try { return JSON.parse(localStorage.getItem('teamMembers') || '[]'); } catch { return []; }
    });
    const [diagnosis, setDiagnosis] = useState<Array<{ key: string; ok: boolean; message: string }>>([]);
    const [runningDiagnosis, setRunningDiagnosis] = useState(false);
    const [eventType, setEventType] = useState<EventType | null>(null);
    const [eventTypeLoading, setEventTypeLoading] = useState(true);
    const [eventTypeError, setEventTypeError] = useState<string | null>(null);
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [slotsError, setSlotsError] = useState<string | null>(null);
    const { availability, updateAvailability } = useAvailabilityStore();
    const { addBooking, cancelBooking, markBookingCancelledLocally } = useBookingStore();
    const allEventTypes = useEventTypeStore((s) => s.eventTypes);

    const [step, setStep] = useState<BookingStep>('calendar');
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [confirmedBooking, setConfirmedBooking] = useState<{ id?: string; name: string; email: string; manageToken?: string } | null>(null);
    const [troubleshooterTimezone, setTroubleshooterTimezone] = useState(availability.timezone || 'UTC');
    const [troubleEventId, setTroubleEventId] = useState('');

    useEffect(() => {
        let active = true;

        async function run() {
            if (!slug) {
                setEventTypeLoading(false);
                setEventType(null);
                setEventTypeError(null);
                return;
            }

            setEventTypeLoading(true);
            setEventTypeError(null);
            try {
                const row = await api.fetchEventTypeBySlug(slug, { cache: 'no-store' });
                if (!active) return;
                setEventType({
                    id: row.id,
                    title: row.title,
                    slug: row.slug,
                    description: row.description || '',
                    duration: Number(row.duration_minutes ?? row.duration ?? 0),
                    isActive: row.is_active ?? row.isActive ?? true,
                    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
                    settings: row.settings,
                });
            } catch {
                if (active) {
                    setEventType(null);
                    setEventTypeError('Failed to load event type');
                }
            } finally {
                if (active) setEventTypeLoading(false);
            }
        }

        void run();
        return () => {
            active = false;
        };
    }, [slug]);

    useEffect(() => {
        if (troubleEventId) return;
        setTroubleEventId(allEventTypes?.[0]?.id ?? eventType?.id ?? '');
    }, [allEventTypes, eventType, troubleEventId]);

    useEffect(() => {
        let active = true;

        async function loadSlots() {
            if (!eventType?.id || !selectedDate) {
                setAvailableSlots([]);
                setSlotsError(null);
                return;
            }

            setSlotsLoading(true);
            setSlotsError(null);
            try {
                const payload = await api.fetchBookingSlots(eventType.id, format(selectedDate, 'yyyy-MM-dd'));
                if (active) {
                    setAvailableSlots(Array.isArray(payload?.slots) ? payload.slots : []);
                }
            } catch {
                if (active) {
                    setAvailableSlots([]);
                    setSlotsError('Failed to load slots');
                }
            } finally {
                if (active) {
                    setSlotsLoading(false);
                }
            }
        }

        void loadSlots();
        return () => {
            active = false;
        };
    }, [eventType?.id, selectedDate]);

    // When overlay is opened and no date is selected, auto-select the next available date
    useEffect(() => {
        if (!overlay || !eventType || selectedDate) return;
        let active = true;

        (async function findNext() {
            // search the next 30 days for a day enabled in the availability schedule with available slots
            for (let i = 0; i < 30; i++) {
                const d = addDays(new Date(), i);
                const day = getDay(d);
                const daySchedule = availability.schedule.find((s) => s.day === day);
                if (!daySchedule || !daySchedule.enabled || !daySchedule.timeRanges || daySchedule.timeRanges.length === 0) continue;
                try {
                    const payload = await api.fetchBookingSlots(eventType.id, format(d, 'yyyy-MM-dd'));
                    const slots = Array.isArray(payload?.slots) ? payload.slots : [];
                    if (!active) return;
                    if (slots.length > 0) {
                        setSelectedDate(d);
                        return;
                    }
                } catch (e) {
                    // ignore and try next date
                }
            }

            // fallback: pick the next enabled day (even if no slots returned)
            for (let i = 0; i < 30; i++) {
                const d = addDays(new Date(), i);
                const day = getDay(d);
                const daySchedule = availability.schedule.find((s) => s.day === day);
                if (daySchedule && daySchedule.enabled) {
                    if (!active) return;
                    setSelectedDate(d);
                    return;
                }
            }
        })();

        return () => {
            active = false;
        };
    }, [overlay, eventType, availability.schedule, selectedDate]);

    const timeRangesForDate = useMemo(() => {
        if (!selectedDate) {
            return [];
        }

        const daySchedule = availability.schedule.find((entry) => entry.day === getDay(selectedDate));
        return daySchedule?.enabled ? daySchedule.timeRanges : [];
    }, [availability, selectedDate]);

    useEffect(() => {
        if (showTroubleshooter) {
            setTroubleshooterTimezone(availability.timezone || 'UTC');
        }
    }, [showTroubleshooter, availability.timezone]);

    const isDev = import.meta.env.MODE === 'development';
    

    if (eventTypeLoading) {
        return (
            <div className="min-h-screen bg-cal-bg-base px-4 py-6 sm:px-6 sm:py-8">
                <div className="mx-auto w-full max-w-[1160px]">
                    <div className="overflow-hidden rounded-[28px] border border-cal-border bg-cal-bg-card p-6 shadow-[0_18px_40px_rgba(0,0,0,0.28)]">
                        <div className="grid lg:grid-cols-[320px_minmax(0,1fr)] gap-6 min-h-[360px]">
                            <aside className="px-4 py-4">
                                <div className="flex items-center gap-3">
                                    <Skeleton className="h-10 w-10 rounded-full" />
                                    <div className="flex-1">
                                        <Skeleton className="h-5 w-40 rounded-md" />
                                    </div>
                                </div>

                                <div className="mt-6">
                                    <Skeleton className="h-10 w-72 rounded-md" />
                                </div>

                                <div className="mt-6 space-y-3">
                                    <Skeleton className="h-4 w-32 rounded-md" />
                                    <Skeleton className="h-4 w-28 rounded-md" />
                                    <Skeleton className="h-4 w-36 rounded-md" />
                                </div>
                            </aside>

                            <section className="px-4 py-4">
                                <div className="mb-4">
                                    <Skeleton className="h-40 w-full rounded-2xl" />
                                </div>

                                <div className="space-y-3">
                                    <Skeleton className="h-12 rounded-2xl" count={4} />
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!eventType) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-cal-bg-base px-4">
                <div className="text-center">
                    <h1 className="text-2xl font-semibold text-cal-text-primary">Event not found</h1>
                    <button type="button" onClick={() => navigate(-1)} className="mt-3 text-sm text-cal-text-muted hover:text-cal-text-primary">
                        Go back
                    </button>
                </div>
            </div>
        );
    }

    if (step === 'confirmation' && confirmedBooking && selectedDate && selectedTime) {
        return (
            <BookingConfirmation
                eventType={eventType}
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                bookerName={confirmedBooking.name}
                bookerEmail={confirmedBooking.email}
                bookingId={confirmedBooking.id}
                onBack={() => {
                    if (overlay) {
                        try {
                            if (window.history && window.history.length > 1) {
                                window.history.back();
                                return;
                            }
                        } catch (e) {
                            // ignore
                        }
                        navigate(`/${defaultUser.username}`);
                    } else {
                        navigate(`/${defaultUser.username}`);
                    }
                }}
                onReschedule={() => {
                    if (confirmedBooking?.manageToken) {
                        navigate(`/manage/${confirmedBooking.manageToken}`);
                        return;
                    }
                    if (confirmedBooking?.id) navigate(`/bookings/${confirmedBooking.id}`);
                }}
                onCancel={async () => {
                    if (!confirmedBooking?.id) return;
                    try {
                        if (confirmedBooking.manageToken) {
                            await api.publicCancelByToken(confirmedBooking.manageToken);
                            markBookingCancelledLocally(confirmedBooking.id);
                        } else {
                            await cancelBooking(confirmedBooking.id);
                        }
                        if (overlay) {
                            try {
                                if (window.history && window.history.length > 1) {
                                    window.history.back();
                                } else {
                                    navigate(`/${defaultUser.username}`);
                                }
                            } catch (e) {
                                navigate(`/${defaultUser.username}`);
                            }
                        } else {
                            navigate(`/${defaultUser.username}`);
                        }
                    } catch (e) {
                        console.error('cancel from confirmation failed', e);
                    }
                }}
            />
        );
    }

    // Debug panel for overlay/dev to help diagnose blank overlay issues
    const debugInfo = {
        overlay,
        slug,
        eventTypeLoading,
        // expose the full eventType object for debugging (duration, settings, timestamps)
        eventType: eventType ? { ...eventType } : null,
        eventTypeError,
        availability: { timezone: availability.timezone, schedule: availability.schedule },
        selectedDate: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null,
        selectedTime,
        slotsLoading,
        slotsError,
        availableSlotsCount: availableSlots.length,
        step,
    };

    const startTime = selectedTime ? parse(selectedTime, 'HH:mm', new Date()) : null;
    const endTime = startTime ? addMinutes(startTime, eventType.duration) : null;

    return (
        <div className="min-h-screen bg-cal-bg-base px-4 py-6 sm:px-6 sm:py-8">
            {overlay && isDev && overlayDebug && (
                <div className="fixed top-4 right-4 z-50 max-w-sm rounded-md border border-cal-border bg-cal-bg-card p-3 text-sm text-cal-text-default shadow-lg">
                    <div className="mb-2 font-semibold text-cal-text-primary">Debug (overlay)</div>
                    <pre className="text-xs max-h-40 overflow-auto">{JSON.stringify(debugInfo, null, 2)}</pre>
                </div>
            )}
            <div className="mx-auto w-full max-w-[1160px]">
                <div className="mb-6 flex items-center justify-between">
                    {!overlay ? (
                        <button
                            type="button"
                            onClick={() => navigate(`/${defaultUser.username}`)}
                            className="inline-flex items-center gap-2 text-sm font-medium text-cal-text-muted transition-colors hover:text-cal-text-primary"
                        >
                            <ChevronLeft size={16} />
                            Back
                        </button>
                    ) : (
                        <div />
                    )}

                    <div className="items-center gap-2">
                        {!overlay && (
                            <button type="button" onClick={() => setShowTroubleshooter(true)} className="rounded-full bg-black text-white px-4 py-2 font-medium shadow-lg">
                                Need help?
                            </button>
                        )}
                        {!overlay && (
                            <div className="inline-flex items-center rounded-xl border border-cal-border bg-cal-bg-card p-1">
                                <button type="button" onClick={() => setViewMode('month')} className={`rounded-lg p-2 ${viewMode === 'month' ? 'bg-white/8' : ''} text-cal-text-muted hover:bg-white/5 hover:text-cal-text-primary`}>
                                    <Calendar size={16} />
                                </button>
                                <button type="button" onClick={() => setViewMode('week')} className={`rounded-lg p-2 ${viewMode === 'week' ? 'bg-white/8' : ''} text-cal-text-muted hover:bg-white/5 hover:text-cal-text-primary`}>
                                    <LayoutGrid size={16} />
                                </button>
                                <button type="button" onClick={() => setViewMode('day')} className={`rounded-lg p-2 ${viewMode === 'day' ? 'bg-white/8' : ''} text-cal-text-muted hover:bg-white/5 hover:text-cal-text-primary`}>
                                    <Columns3 size={16} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="overflow-hidden rounded-[28px] border border-cal-border bg-cal-bg-card shadow-[0_18px_40px_rgba(0,0,0,0.28)]">
                    <div className="grid min-h-[620px] lg:grid-cols-[320px_minmax(0,1fr)]">
                        <aside className="border-b border-cal-border px-7 py-7 lg:border-b-0 lg:border-r">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 text-sm font-semibold text-white">
                                    {getInitials(defaultUser.name)}
                                </div>
                                <div className="text-lg font-medium text-cal-text-muted">{defaultUser.name}</div>
                            </div>

                            <h1 className="mt-6 text-[2.15rem] font-semibold tracking-tight text-cal-text-primary">{eventType.title}</h1>

                            <div className="mt-7 space-y-4 text-cal-text-default">
                                <div className="flex items-center gap-3 text-lg">
                                    <Clock size={18} className="text-cal-text-muted" />
                                    {eventType.duration}m
                                </div>
                                <div className="flex items-center gap-3 text-lg">
                                    <Video size={18} className="text-cal-text-muted" />
                                    Cal Video
                                </div>
                                <div className="flex items-center gap-3 text-lg">
                                    <Globe size={18} className="text-cal-text-muted" />
                                    {availability.timezone}
                                </div>
                                {selectedDate && selectedTime && startTime && endTime && (
                                    <div className="rounded-2xl border border-[#0ea5e9]/20 bg-[#0ea5e9]/10 px-4 py-4 text-[#dbeafe]">
                                        <div className="flex items-start gap-3">
                                            <Calendar size={18} className="mt-1 text-[#38bdf8]" />
                                            <div className="text-base leading-7">
                                                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                                                <br />
                                                {format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </aside>

                        <section className="px-6 py-7 sm:px-8">
                            {step === 'form' && selectedDate && selectedTime ? (
                                <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
                                    <div className="hidden lg:block" />
                                    <BookingForm
                                        eventType={eventType}
                                        selectedDate={selectedDate}
                                        selectedTime={selectedTime}
                                        onBack={() => setStep('calendar')}
                                        onConfirm={async (data) => {
                                            const end = format(addMinutes(parse(selectedTime, 'HH:mm', new Date()), eventType.duration), 'HH:mm');
                                            try {
                                                const created = await addBooking({
                                                    eventTypeId: eventType.id,
                                                    eventTitle: eventType.title,
                                                    date: format(selectedDate, 'yyyy-MM-dd'),
                                                    startTime: selectedTime,
                                                    endTime: end,
                                                    duration: eventType.duration,
                                                    bookerName: data.name,
                                                    bookerEmail: data.email,
                                                    notes: data.notes || undefined,
                                                    status: 'upcoming',
                                                });
                                                    setConfirmedBooking({ id: created.id, name: data.name, email: data.email, manageToken: (created as any).manageToken });
                                                setStep('confirmation');
                                            } catch (err: any) {
                                                const msg = err?.message || 'This slot is no longer available. Please choose another time.';
                                                window.alert(msg);
                                                setStep('calendar');
                                                setSelectedTime(null);
                                            }
                                        }}
                                    />
                                </div>
                            ) : (
                                <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_280px]">
                                    <BookingCalendar
                                        selectedDate={selectedDate}
                                        onSelectDate={(date) => {
                                            setSelectedDate(date);
                                            setSelectedTime(null);
                                        }}
                                        availability={availability}
                                        view={viewMode}
                                    />
                                    {selectedDate ? (
                                        <TimeSlotPicker
                                            selectedDate={selectedDate}
                                            timeRanges={timeRangesForDate}
                                            duration={eventType.duration}
                                            existingBookings={[]}
                                            availableSlots={availableSlots}
                                            isLoading={slotsLoading}
                                            selectedSlot={selectedTime}
                                            onSelectSlot={(time) => setSelectedTime(time)}
                                            onContinue={() => selectedTime && setStep('form')}
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center rounded-[24px] border border-dashed border-cal-border bg-cal-bg-subtle/60 p-8 text-center text-cal-text-muted">
                                            Select a date to view available times.
                                        </div>
                                    )}
                                </div>
                            )}
                        </section>
                    </div>
                </div>

                <div className="py-8 text-center text-[2rem] font-semibold tracking-tight text-cal-text-primary/90">Cal.com</div>
            </div>

            <Dialog
                open={showTroubleshooter}
                onClose={() => setShowTroubleshooter(false)}
                title="Troubleshooter"
                className="w-[min(1100px,calc(100vw-2rem))] max-w-none p-0"
            >
                <div className="grid items-stretch gap-4 xl:grid-cols-[360px_minmax(0,1fr)] xl:gap-6">
                    <div className="h-full min-h-[360px] rounded-2xl bg-gradient-to-r from-sky-700 to-indigo-700 p-6 text-white shadow-lg sm:p-8">
                        <div className="flex items-start gap-4">
                            <div className="rounded-lg bg-white/10 p-3">
                                <Calendar size={24} />
                            </div>

                            <div>
                                <h3 className="text-2xl font-semibold">Troubleshoot scheduling issues</h3>
                                <p className="mt-2 max-w-[26rem] text-sm opacity-90">Install a calendar, add teammates, and confirm availability rules to prevent double bookings. We'll preview your public booking flow and recommend fixes.</p>

                                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                                    <button
                                        className="inline-flex items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-sky-700 shadow-sm"
                                        onClick={() => {
                                            try { localStorage.setItem('calendarInstalled', 'true'); } catch {}
                                            setCalendarInstalled(true);
                                        }}
                                    >
                                        {calendarInstalled ? 'Calendar installed' : 'Install calendar'}
                                    </button>
                                    <button
                                        className="inline-flex items-center justify-center rounded-md border border-white/30 bg-white/6 px-4 py-2 text-sm text-white"
                                        onClick={() => {
                                            const name = window.prompt('Enter teammate name');
                                            if (name && name.trim()) {
                                                const id = Date.now().toString();
                                                const tz = availability.timezone || defaultUser.timezone;
                                                const newList = [...teamMembersLocal, { id, name: name.trim(), timezone: tz }];
                                                try { localStorage.setItem('teamMembers', JSON.stringify(newList)); } catch {}
                                                setTeamMembersLocal(newList);
                                            }
                                        }}
                                    >
                                        Create team
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex h-full flex-col">
                        <div className="mb-4">
                            <label className="text-sm text-cal-text-muted">Event type</label>
                            <select value={troubleEventId} onChange={(e) => setTroubleEventId(e.target.value)} className="mt-2 w-full rounded-lg border border-cal-border bg-cal-bg-surface px-3 py-2">
                                {allEventTypes.map((et) => (
                                    <option key={et.id} value={et.id}>{et.title}</option>
                                ))}
                            </select>
                        </div>

                        <div className="mb-4 rounded-lg border border-cal-border bg-white/3 p-3">
                            <div className="text-sm text-cal-text-muted">Availability</div>
                            <div className="mt-2 font-medium">Working hours</div>
                            <label className="mt-3 block text-xs text-cal-text-dimmed">Timezone</label>
                            <select
                                value={troubleshooterTimezone}
                                onChange={(e) => {
                                    const nextTz = e.target.value;
                                    setTroubleshooterTimezone(nextTz);
                                    updateAvailability({ timezone: nextTz });
                                }}
                                className="mt-1 w-full rounded-lg border border-cal-border bg-cal-bg-surface px-3 py-2 text-sm"
                            >
                                {TROUBLESHOOTER_TIMEZONES.map((tz) => (
                                    <option key={tz} value={tz}>{tz}</option>
                                ))}
                            </select>
                        </div>

                        <div className="mb-4">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-cal-text-muted">Preview calendar</div>
                                <div className="text-xs text-cal-text-dimmed">This is how visitors see availability</div>
                            </div>
                            <div className="mt-2 max-h-[300px] overflow-auto rounded-lg border border-cal-border bg-cal-bg-surface p-3 shadow-sm">
                                <BookingCalendar selectedDate={new Date()} onSelectDate={() => {}} availability={availability} view="month" />
                            </div>
                        </div>

                        <div className="mb-4">
                            <h4 className="mb-2 text-sm font-semibold">Diagnosis results</h4>
                            {diagnosis.length === 0 ? (
                                <div className="text-sm text-cal-text-muted">No diagnosis run yet.</div>
                            ) : (
                                <ul className="space-y-2">
                                    {diagnosis.map((d) => (
                                        <li key={d.key} className="flex items-start gap-3">
                                            <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full ${d.ok ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                                                <Check size={14} />
                                            </span>
                                            <div>
                                                <div className="text-sm font-medium">{d.ok ? 'OK' : 'Issue'}</div>
                                                <div className="text-xs text-cal-text-muted">{d.message}</div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div className="mt-auto flex justify-end gap-3">
                            {diagnosis.length > 0 && (
                                <button className="text-sm text-cal-text-muted" onClick={() => setDiagnosis([])}>Clear</button>
                            )}
                            <button className="text-sm text-cal-text-muted" onClick={() => setShowTroubleshooter(false)}>Close</button>
                            <button
                                className="rounded-md bg-cal-bg-emphasis px-4 py-2 text-sm text-white"
                                onClick={async () => {
                                    setRunningDiagnosis(true);
                                    const results: Array<{ key: string; ok: boolean; message: string }> = [];
                                    if (calendarInstalled) results.push({ key: 'calendar', ok: true, message: 'Calendar connected' });
                                    else results.push({ key: 'calendar', ok: false, message: 'No calendar connected' });

                                    if (teamMembersLocal.length > 0) results.push({ key: 'team', ok: true, message: `Team has ${teamMembersLocal.length} member(s)` });
                                    else results.push({ key: 'team', ok: false, message: 'No team members — consider adding teammates' });

                                    const hasAvailability = availability.schedule.some((s) => s.enabled && s.timeRanges.length > 0);
                                    if (hasAvailability) results.push({ key: 'availability', ok: true, message: 'Availability configured' });
                                    else results.push({ key: 'availability', ok: false, message: 'No availability set — configure working hours' });

                                    try {
                                        const all = await api.fetchBookings('all');
                                        const count = Number(all?.total || 0);
                                        results.push({ key: 'bookings', ok: true, message: `${count} booking(s) found` });
                                    } catch {
                                        results.push({ key: 'bookings', ok: false, message: 'Could not fetch bookings from server' });
                                    }

                                    setDiagnosis(results);
                                    setRunningDiagnosis(false);
                                }}
                            >
                                {runningDiagnosis ? 'Running…' : 'Run diagnosis'}
                            </button>
                        </div>
                    </div>
                </div>
            </Dialog>

            {overlay && !showTroubleshooter && (
                <div className="fixed right-6 top-6 z-40 flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => setShowTroubleshooter(true)}
                        className="rounded-2xl border border-white/15 bg-zinc-900/95 px-5 py-2.5 text-xl font-medium text-white shadow-[0_10px_28px_rgba(0,0,0,0.45)]"
                    >
                        Need help?
                    </button>
                    <div className="inline-flex items-center rounded-2xl bg-zinc-100/95 p-1.5 shadow-[0_10px_28px_rgba(0,0,0,0.28)]">
                        <button
                            type="button"
                            aria-label="Month view"
                            onClick={() => setViewMode('month')}
                            className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${viewMode === 'month' ? 'bg-white text-zinc-800 shadow-sm' : 'text-zinc-500 hover:bg-white/70 hover:text-zinc-700'}`}
                        >
                            <Calendar size={16} />
                        </button>
                        <button
                            type="button"
                            aria-label="Week view"
                            onClick={() => setViewMode('week')}
                            className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${viewMode === 'week' ? 'bg-white text-zinc-800 shadow-sm' : 'text-zinc-500 hover:bg-white/70 hover:text-zinc-700'}`}
                        >
                            <LayoutGrid size={16} />
                        </button>
                        <button
                            type="button"
                            aria-label="Day view"
                            onClick={() => setViewMode('day')}
                            className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${viewMode === 'day' ? 'bg-white text-zinc-800 shadow-sm' : 'text-zinc-500 hover:bg-white/70 hover:text-zinc-700'}`}
                        >
                            <Columns3 size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
